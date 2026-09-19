"""Run lifecycle and the authoritative territory pipeline (TZ sections 17-19).

The client sends coordinates and nothing else that matters: speed, distance,
area, activity and ownership are all decided here.
"""
import time
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.clans import clan_of
from app.api.deps import enforce_rate_limit, get_connection, get_demo_user
from app.api.schemas import (
    ActivityOut,
    CapturedFrom,
    PointsAccepted,
    PointsIn,
    RunResult,
    RunStarted,
)
from app.config import get_settings
from app.geo.loop import close_ring, closing_gap_m, is_inside_bbox, perimeter_m
from app.geo.reasons import RejectionReason
from app.signal.activity import get_classifier
from app.signal.features import extract_features
from app.signal.kalman import RawPoint, smooth_track
from app.signal.validate import check_activity, check_track_quality, drop_bad_points

router = APIRouter(prefix="/api/v1", tags=["runs"])

# Solo and clan are two separate layers over the same ground: a run belongs to
# exactly one of them and never touches the other (CLAUDE.md rule 8).
SUPPORTED_MODES = frozenset({"solo", "clan"})


def ring_wkt(coordinates: list[tuple[float, float]]) -> str:
    """WKT for a closed ring, used as a bound parameter and never interpolated."""
    ring = close_ring(coordinates)
    positions = ", ".join(f"{lon!r} {lat!r}" for lon, lat in ring)

    return f"LINESTRING({positions})"


async def _reject(
    connection: AsyncConnection,
    run_id: str,
    mode: str,
    reason: RejectionReason,
    activity: ActivityOut | None = None,
    warnings: list[str] | None = None,
    gap_m: float | None = None,
) -> RunResult:
    await connection.execute(
        text(
            """
            UPDATE runs
               SET status = 'rejected',
                   reason = :reason,
                   finished_at = now(),
                   activity_type = :activity_type,
                   activity_confidence = :confidence,
                   avg_speed_ms = :avg_speed
             WHERE id = :run_id
            """
        ),
        {
            "reason": reason.value,
            "run_id": run_id,
            "activity_type": activity.type if activity else None,
            "confidence": activity.confidence if activity else None,
            "avg_speed": activity.avg_speed_ms if activity else None,
        },
    )

    return RunResult(
        run_id=run_id,
        status="rejected",
        reason=reason.value,
        mode=mode,
        closing_gap_m=gap_m,
        activity=activity,
        warnings=warnings or [],
    )


@router.post("/runs/start", response_model=RunStarted, status_code=status.HTTP_201_CREATED)
async def start_run(
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    mode: str = "solo",
) -> RunStarted:
    if mode not in SUPPORTED_MODES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unsupported mode: {mode}")

    # The mode is fixed when the run starts and cannot change mid-run
    # (TZ section 23.2), so clan membership is checked here as well as at the
    # finish.
    if mode == "clan" and await clan_of(connection, user_id) is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Join a clan before running for one")

    await enforce_rate_limit(f"runs-start:{user_id}", limit=10, window_s=3600)

    # Anti-cheat rule 12: one active run per user.
    active = await connection.scalar(
        text("SELECT id FROM runs WHERE user_id = :user_id AND status = 'active'"),
        {"user_id": user_id},
    )
    if active:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"A run is already active: {active}. Finish or abandon it first.",
        )

    row = (
        await connection.execute(
            text(
                """
                INSERT INTO runs (user_id, mode)
                VALUES (:user_id, :mode)
                RETURNING id, started_at
                """
            ),
            {"user_id": user_id, "mode": mode},
        )
    ).one()

    return RunStarted(run_id=str(row.id), mode=mode, started_at=row.started_at.isoformat())


@router.post("/runs/{run_id}/points", response_model=PointsAccepted)
async def add_points(
    run_id: str,
    payload: PointsIn,
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> PointsAccepted:
    await enforce_rate_limit(f"runs-points:{user_id}", limit=2, window_s=1)

    owned = await connection.scalar(
        text(
            "SELECT id FROM runs "
            "WHERE id = :run_id AND user_id = :user_id AND status = 'active'"
        ),
        {"run_id": run_id, "user_id": user_id},
    )
    if not owned:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No active run with that id")

    # asyncpg reports no rowcount for executemany, so the count is measured.
    before = await connection.scalar(
        text("SELECT count(*) FROM track_points WHERE run_id = :run_id"), {"run_id": run_id}
    )

    if payload.points:
        latest = payload.points[-1]
        await connection.execute(
            text(
                """
                UPDATE demo_users
                   SET last_lat = :lat,
                       last_lon = :lon,
                       last_seen_at = now()
                 WHERE id = :user_id
                """
            ),
            {"lat": latest.lat, "lon": latest.lon, "user_id": user_id},
        )

    await connection.execute(
        text(
            """
            INSERT INTO track_points (run_id, ts, accuracy_m, raw_speed_ms, mocked, geom)
            VALUES (:run_id, to_timestamp(:ts), :accuracy, :speed, :mocked,
                    ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))
            ON CONFLICT (run_id, ts) DO NOTHING
            """
        ),
        [
            {
                "run_id": run_id,
                "ts": point.ts,
                "accuracy": point.accuracy,
                "speed": point.speed,
                "mocked": point.mocked,
                "lon": point.lon,
                "lat": point.lat,
            }
            for point in payload.points
        ],
    )

    total = await connection.scalar(
        text("SELECT count(*) FROM track_points WHERE run_id = :run_id"), {"run_id": run_id}
    )

    return PointsAccepted(
        run_id=run_id, stored=int(total or 0) - int(before or 0), total=int(total or 0)
    )


@router.post("/runs/{run_id}/abandon", status_code=status.HTTP_204_NO_CONTENT)
async def abandon_run(
    run_id: str,
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> None:
    """Release a run left active by a closed tab, so the runner is not stuck."""
    result = await connection.execute(
        text(
            """
            UPDATE runs
               SET status = 'rejected', reason = 'LOW_GPS_QUALITY', finished_at = now()
             WHERE id = :run_id AND user_id = :user_id AND status = 'active'
            """
        ),
        {"run_id": run_id, "user_id": user_id},
    )

    if not result.rowcount:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No active run with that id")


@router.post("/runs/{run_id}/finish", response_model=RunResult)
async def finish_run(
    run_id: str,
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> RunResult:
    settings = get_settings()

    run = (
        await connection.execute(
            text(
                "SELECT id, mode FROM runs "
                "WHERE id = :run_id AND user_id = :user_id AND status = 'active'"
            ),
            {"run_id": run_id, "user_id": user_id},
        )
    ).one_or_none()

    if run is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No active run with that id")

    mode = run.mode
    warnings: list[str] = []

    # A member who left mid-run has no clan to award the ground to.
    clan = await clan_of(connection, user_id) if mode == "clan" else None
    if mode == "clan" and clan is None:
        return await _reject(connection, run_id, mode, RejectionReason.NOT_IN_CLAN)

    owner_clan_id = clan.id if clan is not None else None

    # --- 2, 3: order, de-duplicate and drop unusable fixes ---
    rows = (
        await connection.execute(
            text(
                """
                SELECT extract(epoch FROM ts) AS ts,
                       ST_Y(geom) AS lat,
                       ST_X(geom) AS lon,
                       accuracy_m,
                       raw_speed_ms,
                       mocked
                  FROM track_points
                 WHERE run_id = :run_id
                 ORDER BY ts
                """
            ),
            {"run_id": run_id},
        )
    ).all()

    raw_points = [
        RawPoint(
            lat=row.lat,
            lon=row.lon,
            ts=float(row.ts),
            accuracy_m=row.accuracy_m or 0.0,
            raw_speed_ms=row.raw_speed_ms,
            mocked=row.mocked,
        )
        for row in rows
    ]

    cleaned = drop_bad_points(raw_points, settings)
    if cleaned.dropped_low_accuracy:
        warnings.append("LOW_GPS_QUALITY_POINTS_DROPPED")

    quality_problem = check_track_quality(cleaned.points, settings, now_ts=time.time())
    if quality_problem is not None:
        return await _reject(connection, run_id, mode, quality_problem, warnings=warnings)

    # --- 4, 5: Kalman speed, then features and activity ---
    smoothed = smooth_track(cleaned.points)
    features = extract_features(smoothed)
    activity_type, confidence = get_classifier().predict(features)
    activity = ActivityOut(
        type=activity_type, confidence=confidence, avg_speed_ms=features.mean_speed
    )

    # --- 6, 7: speed ceiling and allowed activity ---
    max_speed = max(point.kalman_speed_ms for point in smoothed)
    activity_problem = check_activity(activity_type, max_speed, settings)
    if activity_problem is not None:
        return await _reject(connection, run_id, mode, activity_problem, activity, warnings)

    coordinates = [(point.raw.lon, point.raw.lat) for point in smoothed]

    # --- 8: inside the pilot region ---
    if not is_inside_bbox(coordinates, settings.pilot_bbox):
        return await _reject(
            connection, run_id, mode, RejectionReason.OUTSIDE_REGION, activity, warnings
        )

    # --- 9: closing the loop ---
    # The runner decides when the loop is done, so there is no minimum or
    # maximum gap by default; the server joins the last fix back to the first
    # and reports how far apart they were.
    gap_m = closing_gap_m(coordinates)

    if (
        settings.loop_close_tolerance_m is not None
        and gap_m > settings.loop_close_tolerance_m
    ):
        return await _reject(
            connection, run_id, mode, RejectionReason.LOOP_NOT_CLOSED, activity, warnings, gap_m
        )

    if gap_m > settings.loop_close_warning_m:
        warnings.append("LOOP_CLOSED_BY_SERVER")

    # --- 12a: perimeter, checked separately from area (TZ section 19) ---
    if perimeter_m(coordinates) < settings.min_loop_perimeter_m:
        return await _reject(
            connection, run_id, mode, RejectionReason.TOO_SHORT, activity, warnings, gap_m
        )

    # Solo and clan take separate locks so they never block each other.
    await connection.execute(
        text("SELECT pg_advisory_xact_lock(hashtext(:mode))"), {"mode": mode}
    )

    # --- 10, 11, 13: polygon, ST_MakeValid, minus the exclusion union ---
    measured = (
        await connection.execute(
            text(
                """
                WITH ring AS (
                    SELECT ST_SetSRID(ST_GeomFromText(:wkt), 4326) AS line
                ), poly AS (
                    SELECT ST_CollectionExtract(ST_MakeValid(ST_MakePolygon(line)), 3) AS geom
                      FROM ring
                ), valid AS (
                    SELECT ST_Multi(geom) AS geom
                      FROM poly
                     WHERE geom IS NOT NULL AND NOT ST_IsEmpty(geom)
                ), usable AS (
                    SELECT COALESCE(
                             ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_Difference(
                                 v.geom,
                                 (SELECT ST_Union(e.geom)
                                    FROM exclusion_zones e
                                   WHERE ST_Intersects(e.geom, v.geom)
                                     AND e.kind != 'building')
                             )), 3)),
                             v.geom
                           ) AS geom
                      FROM valid v
                )
                SELECT ST_Area(v.geom::geography) AS raw_area_m2,
                       ST_Area(u.geom::geography) AS usable_area_m2,
                       ST_AsText(u.geom) AS usable_wkt
                  FROM valid v, usable u
                """
            ),
            {"wkt": ring_wkt(coordinates)},
        )
    ).one_or_none()

    if measured is None or measured.usable_wkt is None:
        return await _reject(
            connection, run_id, mode, RejectionReason.BAD_SHAPE, activity, warnings, gap_m
        )

    raw_area = float(measured.raw_area_m2 or 0.0)
    usable_area = float(measured.usable_area_m2 or 0.0)

    # --- 12b: minimum area, separate from the perimeter check ---
    if raw_area < settings.min_area_m2:
        return await _reject(
            connection, run_id, mode, RejectionReason.AREA_TOO_SMALL, activity, warnings, gap_m
        )

    if usable_area <= 0:
        return await _reject(
            connection, run_id, mode, RejectionReason.NO_AWARDABLE_AREA, activity, warnings, gap_m
        )

    # --- 14: take the overlap from whoever holds it now ---
    if mode == "clan":
        captured_sql = """
            SELECT t.owner_clan_id AS owner_id,
                   c.name AS owner_name,
                   ST_Area(ST_Intersection(
                       t.geom, ST_SetSRID(ST_GeomFromText(:wkt), 4326)
                   )::geography) AS area_lost_m2
              FROM territories t
              JOIN clans c ON c.id = t.owner_clan_id
             WHERE t.mode = 'clan'
               AND t.owner_clan_id <> :owner_clan_id
               AND ST_Intersects(t.geom, ST_SetSRID(ST_GeomFromText(:wkt), 4326))
        """
        captured_params = {"wkt": measured.usable_wkt, "owner_clan_id": owner_clan_id}
    else:
        captured_sql = """
            SELECT t.owner_user_id AS owner_id,
                   u.display_name AS owner_name,
                   ST_Area(ST_Intersection(
                       t.geom, ST_SetSRID(ST_GeomFromText(:wkt), 4326)
                   )::geography) AS area_lost_m2
              FROM territories t
              JOIN demo_users u ON u.id = t.owner_user_id
             WHERE t.mode = 'solo'
               AND t.owner_user_id <> :user_id
               AND ST_Intersects(t.geom, ST_SetSRID(ST_GeomFromText(:wkt), 4326))
        """
        captured_params = {"wkt": measured.usable_wkt, "user_id": user_id}

    captured = (await connection.execute(text(captured_sql), captured_params)).all()

    # Trimming every overlapping territory, including the runner's own older
    # ones, is what stops the same ground being counted twice.
    await connection.execute(
        text(
            """
            UPDATE territories
               SET geom = ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_Difference(
                       geom, ST_SetSRID(ST_GeomFromText(:wkt), 4326)
                   )), 3)),
                   updated_at = now()
             WHERE mode = :mode
               AND ST_Intersects(geom, ST_SetSRID(ST_GeomFromText(:wkt), 4326))
            """
        ),
        {"wkt": measured.usable_wkt, "mode": mode},
    )
    await connection.execute(
        text("DELETE FROM territories WHERE geom IS NULL OR ST_IsEmpty(geom)")
    )
    await connection.execute(
        text("UPDATE territories SET area_m2 = ST_Area(geom::geography) WHERE mode = :mode"),
        {"mode": mode},
    )

    # --- 15, 16: store the new territory and close the run ---
    territory_id = await connection.scalar(
        text(
            """
            INSERT INTO territories (mode, owner_user_id, owner_clan_id, run_id, area_m2, geom,
                                     expires_at)
            VALUES (:mode, :user_id, :owner_clan_id, :run_id, :area,
                    ST_SetSRID(ST_GeomFromText(:wkt), 4326),
                    now() + (CASE WHEN :mode = 'solo'
                                  THEN INTERVAL '7 days'
                                  ELSE INTERVAL '14 days' END))
            RETURNING id
            """
        ),
        {
            "mode": mode,
            "user_id": user_id,
            "owner_clan_id": owner_clan_id,
            "run_id": run_id,
            "area": usable_area,
            "wkt": measured.usable_wkt,
        },
    )

    await connection.execute(
        text(
            """
            UPDATE runs
               SET status = 'accepted',
                   reason = NULL,
                   finished_at = now(),
                   activity_type = :activity_type,
                   activity_confidence = :confidence,
                   avg_speed_ms = :avg_speed,
                   raw_area_m2 = :raw_area,
                   excluded_area_m2 = :excluded_area,
                   awarded_area_m2 = :awarded_area,
                   track = ST_SetSRID(ST_GeomFromText(:line_wkt), 4326)
             WHERE id = :run_id
            """
        ),
        {
            "activity_type": activity_type,
            "confidence": confidence,
            "avg_speed": features.mean_speed,
            "raw_area": raw_area,
            "excluded_area": raw_area - usable_area,
            "awarded_area": usable_area,
            "line_wkt": ring_wkt(coordinates),
            "run_id": run_id,
        },
    )

    return RunResult(
        run_id=run_id,
        status="accepted",
        reason=None,
        mode=mode,
        closing_gap_m=gap_m,
        raw_area_m2=raw_area,
        excluded_area_m2=raw_area - usable_area,
        awarded_area_m2=usable_area,
        territory_id=str(territory_id),
        activity=activity,
        captured_from=[
            CapturedFrom(
                user_id=str(row.owner_id),
                username=row.owner_name,
                area_lost_m2=float(row.area_lost_m2 or 0.0),
            )
            for row in captured
            if (row.area_lost_m2 or 0.0) > 0
        ],
        warnings=warnings,
    )
