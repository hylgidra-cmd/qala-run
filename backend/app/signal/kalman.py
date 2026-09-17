"""Kalman smoothing of a GPS track (TZ section 20.2).

This is classical signal processing, not machine learning. The browser's own
`speed` field is never trusted: speed is recomputed here from coordinates,
timestamps and per-point accuracy.
"""
from dataclasses import dataclass
from math import cos, radians

import numpy as np
from filterpy.common import Q_discrete_white_noise
from filterpy.kalman import KalmanFilter

# Local tangent-plane scale. Over a pilot area of a few kilometres the error of
# this approximation is far below GPS noise, and the projection only feeds the
# speed estimate - areas are measured by PostGIS on the geography type.
METRES_PER_DEGREE_LAT = 110574.0
METRES_PER_DEGREE_LON = 111320.0

# A zero or negative time step would make the state transition singular.
MIN_DT_S = 0.1
DEFAULT_ACCURACY_M = 15.0


@dataclass(frozen=True)
class RawPoint:
    lat: float
    lon: float
    ts: float
    accuracy_m: float = DEFAULT_ACCURACY_M
    raw_speed_ms: float | None = None
    mocked: bool = False


@dataclass(frozen=True)
class SmoothPoint:
    raw: RawPoint
    x_m: float
    y_m: float
    kalman_speed_ms: float


def to_local_enu(
    points: list[RawPoint], origin: RawPoint | None = None
) -> list[tuple[float, float]]:
    """Project to metres east/north of the first point."""
    if not points:
        return []

    base = origin or points[0]
    lon_scale = METRES_PER_DEGREE_LON * cos(radians(base.lat))

    return [
        ((point.lon - base.lon) * lon_scale, (point.lat - base.lat) * METRES_PER_DEGREE_LAT)
        for point in points
    ]


def build_kf(dt: float, accuracy_m: float) -> KalmanFilter:
    """State: [x, y, vx, vy] in local ENU metres."""
    kf = KalmanFilter(dim_x=4, dim_z=2)
    kf.F = np.array(
        [
            [1, 0, dt, 0],
            [0, 1, 0, dt],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
        dtype=float,
    )
    kf.H = np.array([[1, 0, 0, 0], [0, 1, 0, 0]], dtype=float)
    kf.R = np.eye(2) * (accuracy_m**2)
    kf.Q = Q_discrete_white_noise(dim=2, dt=dt, var=0.5, block_size=2)

    return kf


def smooth_track(points: list[RawPoint]) -> list[SmoothPoint]:
    """Return every point with a filtered speed attached."""
    if not points:
        return []

    enu = to_local_enu(points)
    first = points[0]
    accuracy = first.accuracy_m or DEFAULT_ACCURACY_M

    kf = build_kf(MIN_DT_S, accuracy)
    kf.x = np.array([enu[0][0], enu[0][1], 0.0, 0.0], dtype=float)
    # Position starts as well known as the fix; velocity starts unknown.
    kf.P = np.diag([accuracy**2, accuracy**2, 25.0, 25.0])

    smoothed = [SmoothPoint(raw=first, x_m=enu[0][0], y_m=enu[0][1], kalman_speed_ms=0.0)]

    for index in range(1, len(points)):
        point = points[index]
        dt = max(point.ts - points[index - 1].ts, MIN_DT_S)
        point_accuracy = point.accuracy_m or DEFAULT_ACCURACY_M

        kf.F[0, 2] = dt
        kf.F[1, 3] = dt
        kf.Q = Q_discrete_white_noise(dim=2, dt=dt, var=0.5, block_size=2)
        kf.R = np.eye(2) * (point_accuracy**2)

        kf.predict()
        kf.update(np.array(enu[index], dtype=float))

        speed = float(np.hypot(kf.x[2], kf.x[3]))
        smoothed.append(
            SmoothPoint(raw=point, x_m=float(kf.x[0]), y_m=float(kf.x[1]), kalman_speed_ms=speed)
        )

    return smoothed
