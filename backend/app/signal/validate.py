"""Server-side anti-cheat checks (TZ section 25).

Nothing the client reports about speed, distance or activity is used here; the
checks run on coordinates, timestamps and accuracy only.
"""
from dataclasses import dataclass

from app.config import Settings
from app.geo.loop import haversine_m
from app.geo.reasons import RejectionReason
from app.signal.kalman import RawPoint

# Rule 2: a fix older or newer than this is not a live run.
MAX_CLOCK_SKEW_S = 24 * 3600


@dataclass(frozen=True)
class CleanedTrack:
    points: list[RawPoint]
    dropped_low_accuracy: int


def drop_bad_points(points: list[RawPoint], settings: Settings) -> CleanedTrack:
    """Sort by time, drop duplicates and rule 4 low-accuracy fixes."""
    ordered = sorted(points, key=lambda point: point.ts)

    kept: list[RawPoint] = []
    dropped = 0
    seen_ts: set[float] = set()

    for point in ordered:
        if point.ts in seen_ts:
            continue
        seen_ts.add(point.ts)

        if point.accuracy_m and point.accuracy_m > settings.max_accuracy_m:
            dropped += 1
            continue

        kept.append(point)

    return CleanedTrack(points=kept, dropped_low_accuracy=dropped)


def check_track_quality(
    points: list[RawPoint], settings: Settings, now_ts: float
) -> RejectionReason | None:
    """Rules 1, 2, 3, 6 and 7. Returns the first failing reason."""
    if len(points) < settings.min_points:
        return RejectionReason.LOW_GPS_QUALITY

    for index in range(1, len(points)):
        previous, current = points[index - 1], points[index]

        # Rule 1: timestamps must increase.
        if current.ts <= previous.ts:
            return RejectionReason.LOW_GPS_QUALITY

        dt = current.ts - previous.ts
        distance = haversine_m(previous.lat, previous.lon, current.lat, current.lon)

        # Rule 6: a jump no human could make.
        if distance / dt > settings.teleport_speed_ms:
            return RejectionReason.TELEPORT_DETECTED

    # Rule 2: the whole track has to sit around now.
    for point in points:
        if abs(now_ts - point.ts) > MAX_CLOCK_SKEW_S:
            return RejectionReason.LOW_GPS_QUALITY

    # Rule 7: too few fixes per second to trust the shape.
    duration = points[-1].ts - points[0].ts
    if duration <= 0:
        return RejectionReason.LOW_GPS_QUALITY

    if len(points) / duration < settings.min_point_density_per_s:
        return RejectionReason.LOW_GPS_QUALITY

    return None


def check_activity(
    activity: str, max_kalman_speed: float, settings: Settings
) -> RejectionReason | None:
    """Rules 5 and 11."""
    if activity not in {"walk", "run"}:
        return RejectionReason.ACTIVITY_NOT_ALLOWED

    if max_kalman_speed > settings.max_run_speed_ms:
        return RejectionReason.ACTIVITY_NOT_ALLOWED

    return None
