"""Pure geometry helpers for the run pipeline.

Anything authoritative - area, validity, exclusion subtraction - is done by
PostGIS. These helpers only decide whether a track is worth sending there.
"""
from math import asin, cos, radians, sin, sqrt

EARTH_RADIUS_M = 6371008.8

# A polygon ring needs three distinct corners plus the repeated closing point.
MIN_RING_POSITIONS = 4


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in metres."""
    phi1, phi2 = radians(lat1), radians(lat2)
    d_phi = phi2 - phi1
    d_lambda = radians(lon2 - lon1)

    a = sin(d_phi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(d_lambda / 2) ** 2

    return 2 * EARTH_RADIUS_M * asin(sqrt(a))


def path_length_m(coordinates: list[tuple[float, float]]) -> float:
    """Length of a (lon, lat) path in metres."""
    total = 0.0

    for index in range(1, len(coordinates)):
        lon1, lat1 = coordinates[index - 1]
        lon2, lat2 = coordinates[index]
        total += haversine_m(lat1, lon1, lat2, lon2)

    return total


def closing_gap_m(coordinates: list[tuple[float, float]]) -> float:
    """Distance between the first and the last position."""
    if len(coordinates) < 2:
        return 0.0

    lon1, lat1 = coordinates[0]
    lon2, lat2 = coordinates[-1]

    return haversine_m(lat1, lon1, lat2, lon2)


def is_closed_loop(coordinates: list[tuple[float, float]], tolerance_m: float) -> bool:
    if len(coordinates) < 3:
        return False

    return closing_gap_m(coordinates) <= tolerance_m


def close_ring(coordinates: list[tuple[float, float]]) -> list[tuple[float, float]]:
    """Repeat the first position at the end so PostGIS can build a polygon.

    The runner never stops exactly on the start, so the small remaining gap is
    closed by snapping back rather than by inserting an invented position.
    """
    if len(coordinates) < 3:
        raise ValueError("a ring needs at least three positions")

    ring = list(coordinates)
    if ring[0] != ring[-1]:
        ring.append(ring[0])

    return ring


def perimeter_m(coordinates: list[tuple[float, float]]) -> float:
    """Length of the closed ring, including the closing segment."""
    return path_length_m(close_ring(coordinates))


def is_inside_bbox(
    coordinates: list[tuple[float, float]], bbox: tuple[float, float, float, float]
) -> bool:
    west, south, east, north = bbox

    return all(
        west <= lon <= east and south <= lat <= north for lon, lat in coordinates
    )
