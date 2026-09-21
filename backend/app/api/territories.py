"""Read-only territory layer (TZ section 11).

Returns GeoJSON for the map. Ownership is never taken from the client.
"""
import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.bbox import HTTP_422, parse_bbox
from app.api.deps import get_connection

router = APIRouter(prefix="/api/v1", tags=["territories"])

SUPPORTED_MODES = frozenset({"solo", "clan"})


@router.get("/territories")
async def list_territories(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    bbox: Annotated[str, Query(description="west,south,east,north")],
    mode: str = "solo",
) -> dict:
    if mode not in SUPPORTED_MODES:
        raise HTTPException(HTTP_422, f"Unsupported mode: {mode}")

    west, south, east, north = parse_bbox(bbox)

    # Solo ground belongs to a player, clan ground to the clan, so the two
    # modes answer with different owners (TZ section 23.2).
    if mode == "clan":
        sql = """
            SELECT t.id,
                   t.mode,
                   t.owner_clan_id AS owner_id,
                   NULL AS owner_player_id,
                   c.name AS owner_name,
                   c.tag AS owner_tag,
                   c.color_hex AS color,
                   t.area_m2,
                   t.created_at,
                   t.expires_at,
                   ST_AsGeoJSON(t.geom) AS geometry
              FROM territories t
              JOIN clans c ON c.id = t.owner_clan_id
             WHERE t.mode = 'clan'
               AND t.geom && ST_MakeEnvelope(:west, :south, :east, :north, 4326)
             ORDER BY t.created_at
        """
    else:
        sql = """
            SELECT t.id,
                   t.mode,
                   t.owner_user_id AS owner_id,
                   u.player_id AS owner_player_id,
                   u.display_name AS owner_name,
                   NULL AS owner_tag,
                   u.color_hex AS color,
                   t.area_m2,
                   t.created_at,
                   t.expires_at,
                   ST_AsGeoJSON(t.geom) AS geometry
              FROM territories t
              JOIN demo_users u ON u.id = t.owner_user_id
             WHERE t.mode = 'solo'
               AND t.geom && ST_MakeEnvelope(:west, :south, :east, :north, 4326)
             ORDER BY t.created_at
        """

    rows = (
        await connection.execute(
            text(sql),
            {"west": west, "south": south, "east": east, "north": north},
        )
    ).all()

    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": str(row.id),
                "geometry": json.loads(row.geometry),
                "properties": {
                    "mode": row.mode,
                    "owner_id": str(row.owner_id),
                    "owner_player_id": getattr(row, "owner_player_id", None),
                    "owner_name": row.owner_name,
                    "owner_tag": row.owner_tag,
                    "color": row.color,
                    "area_m2": float(row.area_m2),
                    "created_at": row.created_at.isoformat(),
                    "expires_at": row.expires_at.isoformat() if row.expires_at else None,
                },
            }
            for row in rows
        ],
    }
