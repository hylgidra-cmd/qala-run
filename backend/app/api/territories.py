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

    rows = (
        await connection.execute(
            text(
                """
                SELECT t.id,
                       t.mode,
                       t.owner_user_id,
                       u.display_name,
                       t.area_m2,
                       t.created_at,
                       ST_AsGeoJSON(t.geom) AS geometry
                  FROM territories t
                  JOIN demo_users u ON u.id = t.owner_user_id
                 WHERE t.mode = :mode
                   AND t.geom && ST_MakeEnvelope(:west, :south, :east, :north, 4326)
                 ORDER BY t.created_at
                """
            ),
            {"mode": mode, "west": west, "south": south, "east": east, "north": north},
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
                    "owner_id": str(row.owner_user_id),
                    "owner_name": row.display_name,
                    "area_m2": float(row.area_m2),
                    "created_at": row.created_at.isoformat(),
                },
            }
            for row in rows
        ],
    }
