"""Read-only territory layer (TZ section 11).

Returns GeoJSON for the map. Ownership is never taken from the client.
"""
import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.deps import get_connection

# Starlette renamed the 422 constant; the number is stable.
HTTP_422 = 422

router = APIRouter(prefix="/api/v1", tags=["territories"])

SUPPORTED_MODES = frozenset({"solo", "clan"})

# A bbox wider than this would scan the whole table and defeat the GiST index.
MAX_BBOX_SPAN_DEG = 0.5


def parse_bbox(bbox: str) -> tuple[float, float, float, float]:
    """Parse `west,south,east,north` in EPSG:4326."""
    parts = bbox.split(",")
    if len(parts) != 4:
        raise HTTPException(
            HTTP_422,
            "bbox must be west,south,east,north",
        )

    try:
        west, south, east, north = (float(part) for part in parts)
    except ValueError as exc:
        raise HTTPException(
            HTTP_422, "bbox values must be numbers"
        ) from exc

    if not (-180 <= west <= 180 and -180 <= east <= 180):
        raise HTTPException(HTTP_422, "longitude out of range")
    if not (-90 <= south <= 90 and -90 <= north <= 90):
        raise HTTPException(HTTP_422, "latitude out of range")
    if west >= east or south >= north:
        raise HTTPException(
            HTTP_422, "bbox must be west<east and south<north"
        )
    if east - west > MAX_BBOX_SPAN_DEG or north - south > MAX_BBOX_SPAN_DEG:
        raise HTTPException(
            HTTP_422,
            f"bbox is larger than {MAX_BBOX_SPAN_DEG} degrees",
        )

    return west, south, east, north


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
