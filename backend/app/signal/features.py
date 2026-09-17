"""Track features for the activity classifier (TZ section 20.3).

Every value is derived from the Kalman speed, never from the raw browser speed.
"""
from dataclasses import dataclass
from math import atan2, degrees, log

import numpy as np

from app.signal.kalman import SmoothPoint

# Below this speed the runner counts as standing still.
STOP_SPEED_MS = 0.4
ENTROPY_BINS = 8


@dataclass(frozen=True)
class Features:
    mean_speed: float
    std_speed: float
    max_speed: float
    p25_speed: float
    p75_speed: float
    p95_speed: float
    mean_accel: float
    std_accel: float
    max_abs_accel: float
    bearing_change_rate: float
    stop_ratio: float
    mean_accuracy: float
    speed_entropy: float
    duration_s: float


def _accelerations(points: list[SmoothPoint]) -> np.ndarray:
    values = []

    for index in range(1, len(points)):
        dt = points[index].raw.ts - points[index - 1].raw.ts
        if dt <= 0:
            continue
        values.append((points[index].kalman_speed_ms - points[index - 1].kalman_speed_ms) / dt)

    return np.array(values, dtype=float)


def _bearing_change_rate(points: list[SmoothPoint]) -> float:
    """Mean absolute heading change in degrees per second."""
    if len(points) < 3:
        return 0.0

    bearings: list[tuple[float, float]] = []

    for index in range(1, len(points)):
        dx = points[index].x_m - points[index - 1].x_m
        dy = points[index].y_m - points[index - 1].y_m
        if dx == 0.0 and dy == 0.0:
            continue
        bearings.append((degrees(atan2(dx, dy)) % 360.0, points[index].raw.ts))

    if len(bearings) < 2:
        return 0.0

    total_change = 0.0
    total_time = 0.0

    for index in range(1, len(bearings)):
        change = abs(bearings[index][0] - bearings[index - 1][0])
        # A turn of 350 degrees is really a turn of 10 the other way.
        change = min(change, 360.0 - change)
        dt = bearings[index][1] - bearings[index - 1][1]
        if dt <= 0:
            continue
        total_change += change
        total_time += dt

    return total_change / total_time if total_time > 0 else 0.0


def _speed_entropy(speeds: np.ndarray) -> float:
    """Shannon entropy of the speed histogram, in nats."""
    if speeds.size == 0 or float(speeds.max()) <= 0.0:
        return 0.0

    counts, _ = np.histogram(speeds, bins=ENTROPY_BINS)
    total = counts.sum()
    if total == 0:
        return 0.0

    probabilities = counts[counts > 0] / total

    return float(-sum(p * log(p) for p in probabilities))


def extract_features(points: list[SmoothPoint]) -> Features:
    if not points:
        raise ValueError("cannot extract features from an empty track")

    speeds = np.array([point.kalman_speed_ms for point in points], dtype=float)
    accelerations = _accelerations(points)
    accuracies = np.array(
        [point.raw.accuracy_m for point in points if point.raw.accuracy_m], dtype=float
    )

    return Features(
        mean_speed=float(speeds.mean()),
        std_speed=float(speeds.std()),
        max_speed=float(speeds.max()),
        p25_speed=float(np.percentile(speeds, 25)),
        p75_speed=float(np.percentile(speeds, 75)),
        p95_speed=float(np.percentile(speeds, 95)),
        mean_accel=float(accelerations.mean()) if accelerations.size else 0.0,
        std_accel=float(accelerations.std()) if accelerations.size else 0.0,
        max_abs_accel=float(np.abs(accelerations).max()) if accelerations.size else 0.0,
        bearing_change_rate=_bearing_change_rate(points),
        stop_ratio=float((speeds < STOP_SPEED_MS).mean()),
        mean_accuracy=float(accuracies.mean()) if accuracies.size else 0.0,
        speed_entropy=_speed_entropy(speeds),
        duration_s=float(points[-1].raw.ts - points[0].raw.ts),
    )
