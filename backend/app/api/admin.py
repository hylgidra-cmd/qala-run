"""Admin live monitoring endpoints.

Shows real-time connected users, runners, their live locations, and tracks.
"""
import json
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.deps import get_connection

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


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
    total_territories = await connection.scalar(text("SELECT count(*) FROM territories")) or 0
    total_area_m2 = (
        await connection.scalar(text("SELECT coalesce(sum(area_m2), 0) FROM territories")) or 0.0
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
) -> list[LiveRunner]:
    """Lists recent users (last 2 hours) and any currently active runners."""
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

    results: list[LiveRunner] = []

    for row in rows:
        user_id = str(row.id)
        active_run_id = str(row.active_run_id) if row.active_run_id else None
        points_count = 0
        track_coords: list[list[float]] = []
        loc = None

        if active_run_id:
            # Fetch coordinates for the active track
            pts = (
                await connection.execute(
                    text(
                        """
                        SELECT ST_X(geom) AS lon, ST_Y(geom) AS lat
                          FROM track_points
                         WHERE run_id = :run_id
                         ORDER BY ts ASC
                        """
                    ),
                    {"run_id": row.active_run_id},
                )
            ).all()

            points_count = len(pts)
            track_coords = [[float(p.lon), float(p.lat)] for p in pts]
            if track_coords:
                last_coord = track_coords[-1]
                loc = RunnerLocation(lon=last_coord[0], lat=last_coord[1])
        elif row.last_lat is not None and row.last_lon is not None:
            loc = RunnerLocation(lat=row.last_lat, lon=row.last_lon)

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
                track=track_coords,
            )
        )

    return results

