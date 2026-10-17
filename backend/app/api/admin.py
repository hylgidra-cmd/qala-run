"""Admin live monitoring endpoints.

Shows real-time connected users, runners, their live locations, and tracks.
"""
import hmac
from collections import defaultdict
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.deps import get_connection
from app.config import get_settings

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


def _has_valid_admin_key(x_admin_key: str | None) -> bool:
    expected = get_settings().admin_key
    if not expected or not x_admin_key:
        return False
    return hmac.compare_digest(x_admin_key, expected)


async def verify_admin_key(
    x_admin_key: Annotated[str | None, Header()] = None,
) -> None:
    if not _has_valid_admin_key(x_admin_key):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin kaliti (X-Admin-Key) noto'g'ri yoki kiritilmagan",
        )


class RunnerLocation(BaseModel):
    lat: float
    lon: float


class LiveRunner(BaseModel):
    user_id: str
    player_id: str
    display_name: str
    last_seen_at: str
    is_online: bool
    status: str  # "running" or "idle"
    run_id: str | None = None
    started_at: str | None = None
    points_count: int = 0
    location: RunnerLocation | None = None
    track: list[list[float]] = []  # [[lon, lat], ...]
    color: str = "#00ff88"


class AdminStats(BaseModel):
    total_players: int
    online_players: int
    active_runs: int
    total_runs: int
    total_territories: int
    total_area_m2: float


@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> AdminStats:
    total_players = await connection.scalar(text("SELECT count(*) FROM demo_users")) or 0
    online_players = (
        await connection.scalar(
            text("SELECT count(*) FROM demo_users WHERE last_seen_at > now() - interval '5 minutes'")
        )
        or 0
    )
    active_runs = (
        await connection.scalar(text("SELECT count(*) FROM runs WHERE status = 'active'")) or 0
    )
    total_runs = (
        await connection.scalar(text("SELECT count(*) FROM runs WHERE status = 'accepted'")) or 0
    )
    total_territories = (
        await connection.scalar(
            text("SELECT count(*) FROM territories WHERE expires_at IS NULL OR expires_at > now()")
        )
        or 0
    )
    total_area_m2 = (
        await connection.scalar(
            text(
                "SELECT coalesce(sum(area_m2), 0) FROM territories "
                "WHERE expires_at IS NULL OR expires_at > now()"
            )
        )
        or 0.0
    )

    return AdminStats(
        total_players=int(total_players),
        online_players=int(online_players),
        active_runs=int(active_runs),
        total_runs=int(total_runs),
        total_territories=int(total_territories),
        total_area_m2=float(total_area_m2),
    )


@router.get("/runners", response_model=list[LiveRunner])
async def get_live_runners(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    x_admin_key: Annotated[str | None, Header()] = None,
) -> list[LiveRunner]:
    """Lists recent users (last 2 hours) and any currently active runners.

    Full exact tracks and exact coordinates are only returned when a valid
    X-Admin-Key header is supplied. Public map requests receive coarse (~110m)
    rounded coordinates and no raw GPS tracks (TZ section 26 / CLAUDE.md rule 6).
    """
    is_admin = _has_valid_admin_key(x_admin_key)

    rows = (
        await connection.execute(
            text(
                """
                SELECT u.id,
                       u.player_id,
                       u.display_name,
                       u.color_hex AS color,
                       u.last_seen_at,
                       u.last_lat,
                       u.last_lon,
                       (u.last_seen_at > now() - interval '5 minutes') AS is_online,
                       r.id AS active_run_id,
                       r.started_at AS run_started_at
                  FROM demo_users u
             LEFT JOIN runs r ON r.user_id = u.id AND r.status = 'active'
                 WHERE u.last_seen_at > now() - interval '2 hours'
                    OR r.id IS NOT NULL
                 ORDER BY is_online DESC, u.last_seen_at DESC
                 LIMIT 50
                """
            )
        )
    ).all()

    active_run_ids = [row.active_run_id for row in rows if row.active_run_id is not None]
    tracks_by_run: dict[str, list[list[float]]] = defaultdict(list)

    if active_run_ids:
        pts = (
            await connection.execute(
                text(
                    """
                    SELECT run_id, ST_X(geom) AS lon, ST_Y(geom) AS lat
                      FROM track_points
                     WHERE run_id = ANY(:run_ids)
                     ORDER BY run_id, ts ASC
                    """
                ),
                {"run_ids": active_run_ids},
            )
        ).all()
        for p in pts:
            tracks_by_run[str(p.run_id)].append([float(p.lon), float(p.lat)])

    results: list[LiveRunner] = []

    for row in rows:
        user_id = str(row.id)
        active_run_id = str(row.active_run_id) if row.active_run_id else None
        raw_track = tracks_by_run.get(active_run_id, []) if active_run_id else []
        points_count = len(raw_track)
        loc = None

        if raw_track:
            last_coord = raw_track[-1]
            raw_lat, raw_lon = last_coord[1], last_coord[0]
            loc = RunnerLocation(
                lat=raw_lat if is_admin else round(raw_lat, 3),
                lon=raw_lon if is_admin else round(raw_lon, 3),
            )
        elif row.last_lat is not None and row.last_lon is not None:
            raw_lat, raw_lon = float(row.last_lat), float(row.last_lon)
            loc = RunnerLocation(
                lat=raw_lat if is_admin else round(raw_lat, 3),
                lon=raw_lon if is_admin else round(raw_lon, 3),
            )

        results.append(
            LiveRunner(
                user_id=user_id,
                player_id=row.player_id,
                display_name=row.display_name,
                color=getattr(row, "color", None) or "#00ff88",
                last_seen_at=row.last_seen_at.isoformat() if row.last_seen_at else "",
                is_online=bool(row.is_online),
                status="running" if active_run_id else "idle",
                run_id=active_run_id,
                started_at=row.run_started_at.isoformat() if row.run_started_at else None,
                points_count=points_count,
                location=loc,
                track=raw_track if is_admin else [],
            )
        )

    return results


class CleanupResult(BaseModel):
    expired_territories_deleted: int
    abandoned_runs_closed: int


@router.post(
    "/cleanup",
    response_model=CleanupResult,
    dependencies=[Depends(verify_admin_key)],
)
async def run_cleanup(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> CleanupResult:
    """Purge expired territories (TTL) and close stale active runs.

    TZ section 23.2:
    - Solo territories expire after 7 days.
    - Clan territories expire after 14 days.

    Call this from a Render cron job (or any HTTP scheduler) once per day:
      POST https://qalarun-api.onrender.com/api/v1/admin/cleanup
    """
    # Delete territories whose TTL has elapsed
    expired = await connection.execute(
        text("DELETE FROM territories WHERE expires_at IS NOT NULL AND expires_at < now()")
    )

    # Close active runs that haven't received a point in > 2 hours (stale GPS).
    # Note: runs_status_check allows ('active', 'accepted', 'rejected').
    abandoned = await connection.execute(
        text(
            """
            UPDATE runs
               SET status = 'rejected',
                   reason = 'LOW_GPS_QUALITY',
                   finished_at = now()
             WHERE status = 'active'
               AND started_at < now() - interval '2 hours'
            """
        )
    )

    return CleanupResult(
        expired_territories_deleted=expired.rowcount,
        abandoned_runs_closed=abandoned.rowcount,
    )


@router.post(
    "/reset-map",
    dependencies=[Depends(verify_admin_key)],
)
async def reset_map(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> dict[str, str]:
    """Clears all territories, track points, and runs from the map for a fresh start."""
    await connection.execute(
        text("TRUNCATE territories, track_points, runs, notifications RESTART IDENTITY CASCADE;")
    )
    return {"status": "ok", "message": "Map and runs reset successfully"}

