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


def extract_closed_loop(
    coordinates: list[tuple[float, float]],
    tolerance_m: float | None,
    min_perimeter_m: float = 100.0,
    anchor_index: int | None = None,
) -> tuple[list[tuple[float, float]], float, bool]:
    """Extract the closed loop portion of a track.

    Supports:
    1. Explicit anchor flag (`anchor_index`) dropped by the runner after a stem/tail.
    2. Standard start-to-finish loop (`coordinates[0]` to `coordinates[-1]`).
    3. Lollipop with lead-in stem (`coordinates[idx:]`), lead-out tail (`coordinates[:j+1]`),
       or out-and-back retraced stem (`coordinates[i:j+1]`, e.g. Home -> Park Loop -> Home).

    Returns `(loop_coordinates, closing_gap_m, trimmed_tail)`.
    """
    n = len(coordinates)
    if n < 3:
        return coordinates, closing_gap_m(coordinates), False

    effective_tol = tolerance_m if tolerance_m is not None else 35.0
    effective_min_perim = max(min_perimeter_m, 100.0)

    if anchor_index is not None and 0 < anchor_index <= n - 3:
        sub = coordinates[anchor_index:]
        sub_gap = closing_gap_m(sub)
        if sub_gap <= effective_tol:
            return sub, sub_gap, True

        # Check if the runner closed the loop at the flag and then walked further
        best_end: int | None = None
        best_end_gap = sub_gap
        for end_idx in range(n - 2, anchor_index + 2, -1):
            cand = coordinates[anchor_index : end_idx + 1]
            g = closing_gap_m(cand)
            if g <= effective_tol and g < best_end_gap and perimeter_m(cand) >= min_perimeter_m:
                best_end_gap = g
                best_end = end_idx
        if best_end is not None:
            return coordinates[anchor_index : best_end + 1], best_end_gap, True

        return sub, sub_gap, True

    gap0 = closing_gap_m(coordinates)

    # Check for out-and-back retraced stem (Home -> Stem -> Loop -> Stem -> Home)
    if gap0 <= effective_tol and n >= 8:
        stem_k = 0
        corridor_tol = min(effective_tol, 25.0)
        gaps: list[float] = [gap0]
        while (n - 1 - 2 * (stem_k + 1)) >= 3:
            lon1, lat1 = coordinates[stem_k + 1]
            lon2, lat2 = coordinates[n - 1 - (stem_k + 1)]
            d = haversine_m(lat1, lon1, lat2, lon2)
            if d <= corridor_tol:
                candidate = coordinates[stem_k + 1 : n - (stem_k + 1)]
                if perimeter_m(candidate) >= effective_min_perim:
                    stem_k += 1
                    gaps.append(d)
                    continue
            break

        if stem_k >= 2 and path_length_m(coordinates[: stem_k + 1]) >= 25.0:
            # Walk back from stem_k if the últimos steps already started diverging into the loop
            best_k = stem_k
            while best_k > 2 and gaps[best_k] > gaps[best_k - 1] + 2.0:
                best_k -= 1
            if path_length_m(coordinates[: best_k + 1]) >= 25.0:
                trimmed = coordinates[best_k : n - best_k]
                return trimmed, closing_gap_m(trimmed), True

    if gap0 <= effective_tol:
        return coordinates, gap0, False

    best_sub: list[tuple[float, float]] | None = None
    best_gap = gap0

    # 1. Lead-in stem: coordinates[idx:]
    for idx in range(1, n - 2):
        sub = coordinates[idx:]
        gap = closing_gap_m(sub)
        if gap <= effective_tol and gap < best_gap:
            if perimeter_m(sub) >= effective_min_perim:
                best_gap = gap
                best_sub = sub

    # 2. Lead-out tail: coordinates[:end_idx + 1]
    for end_idx in range(n - 2, 2, -1):
        sub = coordinates[: end_idx + 1]
        gap = closing_gap_m(sub)
        if gap <= effective_tol and gap < best_gap:
            if perimeter_m(sub) >= effective_min_perim:
                best_gap = gap
                best_sub = sub

    if best_sub is not None:
        return best_sub, best_gap, True

    # 3. Both lead-in and lead-out stems: coordinates[i : j + 1]
    step = max(1, n // 120)
    for i in range(1, n - 3, step):
        lon_i, lat_i = coordinates[i]
        for j in range(n - 2, i + 2, -step):
            lon_j, lat_j = coordinates[j]
            gap = haversine_m(lat_i, lon_i, lat_j, lon_j)
            if gap <= effective_tol and gap < best_gap:
                sub = coordinates[i : j + 1]
                if perimeter_m(sub) >= effective_min_perim:
                    best_gap = gap
                    best_sub = sub

    if best_sub is not None:
        return best_sub, best_gap, True

    return coordinates, gap0, False


def is_inside_bbox(
    coordinates: list[tuple[float, float]], bbox: tuple[float, float, float, float]
) -> bool:
    west, south, east, north = bbox

    return all(
        west <= lon <= east and south <= lat <= north for lon, lat in coordinates
    )
