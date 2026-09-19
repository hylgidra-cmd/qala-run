"""Read-only exclusion zone layer (TZ sections 9, 10 and 12).

The map draws these so a runner can see the ground that will be subtracted
before they run it. The subtraction itself still happens server-side when a
run finishes; this endpoint is display only.
"""
import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.bbox import HTTP_422, parse_bbox
from app.api.deps import get_connection
from app.geo.osm import ALLOWED_KINDS

router = APIRouter(prefix="/api/v1", tags=["zones"])

# TZ section 11: GeoJSON stays comfortable up to a couple of thousand polygons.
# The pilot bbox holds ~17,000, so a wide view is simplified, filtered and
# capped rather than sent whole. The biggest zones survive the cap because they
# are the ones a runner can actually see.
MAX_FEATURES = 3000

# Simplification and the small-zone filter both scale with how much ground is
# on screen, so a close-up view loses nothing and a city-wide view stays light.
SIMPLIFY_DIVISOR = 4000
MIN_AREA_DIVISOR = 1200

# Six decimals is ~10 cm: finer than a drawn outline, and it roughly halves
# the payload against the 9 decimals PostGIS emits by default.
COORD_DECIMALS = 6


def parse_kinds(kind: str | None) -> list[str]:
    """Parse the optional `kind=building,water` filter."""
    if kind is None:
        return []

    kinds = [part.strip() for part in kind.split(",") if part.strip()]
    unknown = sorted(set(kinds) - ALLOWED_KINDS)
    if unknown:
        raise HTTPException(HTTP_422, f"Unsupported kind: {', '.join(unknown)}")

    return sorted(set(kinds))


@router.get("/zones/exclusions")
async def list_exclusions(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    bbox: Annotated[str, Query(description="west,south,east,north")],
    kind: Annotated[str | None, Query(description="comma-separated kinds")] = None,
) -> dict:
    west, south, east, north = parse_bbox(bbox)
    kinds = parse_kinds(kind)

    span = max(east - west, north - south)
    tolerance = span / SIMPLIFY_DIVISOR
    min_area = (span / MIN_AREA_DIVISOR) ** 2

    # The kinds are whitelisted against ALLOWED_KINDS above, so inlining them
    # carries no injection risk and keeps the driver out of array binding.
    kind_filter = ""
    if kinds:
        quoted = ", ".join(f"'{value}'" for value in kinds)
        kind_filter = f"AND z.kind IN ({quoted})"

    rows = (
        await connection.execute(
            text(
                f"""
                SELECT z.id,
                       z.kind,
                       z.source,
                       -- Simplifying a one-part multipolygon degrades it to a
                       -- Polygon, so the column type is restored for the client.
                       ST_AsGeoJSON(
                           ST_Multi(ST_SimplifyPreserveTopology(z.geom, :tolerance)),
                           {COORD_DECIMALS}
                       ) AS geometry
                  FROM exclusion_zones z
                 WHERE z.geom && ST_MakeEnvelope(:west, :south, :east, :north, 4326)
                   AND ST_Area(z.geom) >= :min_area
                   {kind_filter}
                 ORDER BY ST_Area(z.geom) DESC
                 LIMIT :limit
                """
            ),
            {
                "west": west,
                "south": south,
                "east": east,
                "north": north,
                "tolerance": tolerance,
                "min_area": min_area,
                # One extra row tells us the view was capped without a COUNT(*).
                "limit": MAX_FEATURES + 1,
            },
        )
    ).all()

    truncated = len(rows) > MAX_FEATURES

    return {
        "type": "FeatureCollection",
        # Foreign members are allowed by RFC 7946; the map uses this to warn
        # that zooming in will reveal more zones.
        "truncated": truncated,
        "features": [
            {
                "type": "Feature",
                "id": str(row.id),
                "geometry": json.loads(row.geometry),
                "properties": {"kind": row.kind, "source": row.source},
            }
            for row in rows[:MAX_FEATURES]
        ],
    }
