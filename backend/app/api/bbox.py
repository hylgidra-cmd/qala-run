"""Shared bbox parsing for the map layers (TZ section 10).

Both `/territories` and `/zones/exclusions` take the same
`west,south,east,north` string, so the validation lives in one place.
"""
from fastapi import HTTPException

# Starlette renamed the 422 constant; the number is stable.
HTTP_422 = 422

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
