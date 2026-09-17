"""Kalman, features, activity and anti-cheat checks - no database needed."""
import math

import pytest

from app.config import Settings
from app.geo.loop import (
    close_ring,
    closing_gap_m,
    haversine_m,
    is_closed_loop,
    is_inside_bbox,
    path_length_m,
    perimeter_m,
)
from app.geo.reasons import RejectionReason
from app.signal.activity import RuleBasedClassifier
from app.signal.features import extract_features
from app.signal.kalman import RawPoint, smooth_track, to_local_enu
from app.signal.validate import check_activity, check_track_quality, drop_bad_points

NUKUS_LAT = 42.4531
NUKUS_LON = 59.6103

M_PER_DEG_LAT = 110574.0
M_PER_DEG_LON = 111320.0 * math.cos(math.radians(NUKUS_LAT))


def straight_track(speed_ms: float, seconds: int, dt: float = 1.0) -> list[RawPoint]:
    """A due-north walk at a constant speed."""
    points = []
    steps = int(seconds / dt)

    for index in range(steps):
        metres = speed_ms * dt * index
        points.append(
            RawPoint(
                lat=NUKUS_LAT + metres / M_PER_DEG_LAT,
                lon=NUKUS_LON,
                ts=1_780_000_000.0 + index * dt,
                accuracy_m=8.0,
            )
        )

    return points


def settings() -> Settings:
    return Settings(_env_file=None)


class TestKalman:
    def test_enu_origin_is_the_first_point(self) -> None:
        points = straight_track(1.4, 10)

        assert to_local_enu(points)[0] == (0.0, 0.0)

    def test_enu_north_displacement_is_metres(self) -> None:
        points = straight_track(1.0, 3)
        _, north = to_local_enu(points)[2]

        assert north == pytest.approx(2.0, abs=0.05)

    def test_speed_converges_on_the_true_speed(self) -> None:
        smoothed = smooth_track(straight_track(1.4, 120))
        settled = [point.kalman_speed_ms for point in smoothed[60:]]

        assert sum(settled) / len(settled) == pytest.approx(1.4, abs=0.25)

    def test_first_point_starts_at_rest(self) -> None:
        assert smooth_track(straight_track(1.4, 10))[0].kalman_speed_ms == 0.0

    def test_empty_track_is_handled(self) -> None:
        assert smooth_track([]) == []

    def test_kalman_is_steadier_than_raw_differences(self) -> None:
        """The whole point of the filter: noise in, stable speed out."""
        noisy = []
        for index, point in enumerate(straight_track(1.4, 120)):
            jitter = (-1) ** index * 8e-5  # roughly +-9 m of multipath
            noisy.append(
                RawPoint(
                    lat=point.lat + jitter,
                    lon=point.lon,
                    ts=point.ts,
                    accuracy_m=point.accuracy_m,
                )
            )

        raw_speeds = [
            haversine_m(noisy[i - 1].lat, noisy[i - 1].lon, noisy[i].lat, noisy[i].lon)
            / (noisy[i].ts - noisy[i - 1].ts)
            for i in range(1, len(noisy))
        ]
        kalman_speeds = [point.kalman_speed_ms for point in smooth_track(noisy)[1:]]

        raw_spread = max(raw_speeds) - min(raw_speeds)
        kalman_spread = max(kalman_speeds) - min(kalman_speeds)

        assert kalman_spread < raw_spread


class TestFeatures:
    def test_duration_covers_the_whole_track(self) -> None:
        features = extract_features(smooth_track(straight_track(1.4, 60)))

        assert features.duration_s == pytest.approx(59.0)

    def test_walking_track_has_low_mean_speed(self) -> None:
        features = extract_features(smooth_track(straight_track(1.3, 120)))

        assert features.mean_speed < 2.2

    def test_stop_ratio_is_one_for_a_stationary_track(self) -> None:
        still = [
            RawPoint(lat=NUKUS_LAT, lon=NUKUS_LON, ts=1_780_000_000.0 + i, accuracy_m=8.0)
            for i in range(30)
        ]
        features = extract_features(smooth_track(still))

        assert features.stop_ratio == pytest.approx(1.0)

    def test_empty_track_is_rejected(self) -> None:
        with pytest.raises(ValueError):
            extract_features([])


class TestActivity:
    def setup_method(self) -> None:
        self.classifier = RuleBasedClassifier()

    def test_walking_pace_is_walk(self) -> None:
        features = extract_features(smooth_track(straight_track(1.3, 120)))
        activity, confidence = self.classifier.predict(features)

        assert activity == "walk"
        assert confidence == pytest.approx(0.85)

    def test_a_car_is_fast_and_smooth(self) -> None:
        features = extract_features(smooth_track(straight_track(15.0, 120)))

        assert self.classifier.predict(features)[0] == "vehicle"


class TestGeometry:
    def test_haversine_matches_a_known_short_distance(self) -> None:
        distance = haversine_m(NUKUS_LAT, NUKUS_LON, NUKUS_LAT + 1 / M_PER_DEG_LAT, NUKUS_LON)

        assert distance == pytest.approx(1.0, abs=0.01)

    def test_closing_gap_of_a_returning_track_is_zero(self) -> None:
        square = square_loop(side_m=100.0)

        assert closing_gap_m(square) < 1.0

    def test_open_track_is_not_a_closed_loop(self) -> None:
        line = [(NUKUS_LON, NUKUS_LAT + i / M_PER_DEG_LAT) for i in range(0, 200, 10)]

        assert is_closed_loop(line, tolerance_m=30.0) is False

    def test_square_is_a_closed_loop(self) -> None:
        assert is_closed_loop(square_loop(side_m=120.0), tolerance_m=30.0) is True

    def test_close_ring_repeats_the_first_position(self) -> None:
        ring = close_ring([(0.0, 0.0), (0.0, 1.0), (1.0, 1.0)])

        assert ring[0] == ring[-1]
        assert len(ring) == 4

    def test_close_ring_needs_three_positions(self) -> None:
        with pytest.raises(ValueError):
            close_ring([(0.0, 0.0), (0.0, 1.0)])

    def test_perimeter_includes_the_closing_segment(self) -> None:
        square = square_loop(side_m=100.0, spacing_m=100.0)

        assert perimeter_m(square) == pytest.approx(400.0, rel=0.02)

    def test_path_length_of_a_single_point_is_zero(self) -> None:
        assert path_length_m([(NUKUS_LON, NUKUS_LAT)]) == 0.0

    def test_pilot_bbox_membership(self) -> None:
        bbox = (59.58, 42.43, 59.64, 42.48)

        assert is_inside_bbox([(NUKUS_LON, NUKUS_LAT)], bbox) is True
        assert is_inside_bbox([(69.24, 41.29)], bbox) is False


class TestAntiCheat:
    def test_low_accuracy_points_are_dropped(self) -> None:
        points = straight_track(1.4, 10)
        points.append(
            RawPoint(lat=NUKUS_LAT, lon=NUKUS_LON, ts=1_780_000_100.0, accuracy_m=90.0)
        )

        cleaned = drop_bad_points(points, settings())

        assert cleaned.dropped_low_accuracy == 1
        assert len(cleaned.points) == 10

    def test_duplicate_timestamps_are_removed(self) -> None:
        point = RawPoint(lat=NUKUS_LAT, lon=NUKUS_LON, ts=1_780_000_000.0, accuracy_m=8.0)

        assert len(drop_bad_points([point, point], settings()).points) == 1

    def test_points_are_sorted_by_time(self) -> None:
        points = list(reversed(straight_track(1.4, 10)))
        cleaned = drop_bad_points(points, settings())

        assert [p.ts for p in cleaned.points] == sorted(p.ts for p in cleaned.points)

    def test_too_few_points_is_low_gps_quality(self) -> None:
        result = check_track_quality(straight_track(1.4, 3), settings(), now_ts=1_780_000_000.0)

        assert result is RejectionReason.LOW_GPS_QUALITY

    def test_a_jump_is_a_teleport(self) -> None:
        points = straight_track(1.4, 20)
        points.append(
            RawPoint(
                lat=NUKUS_LAT + 0.02,
                lon=NUKUS_LON,
                ts=points[-1].ts + 1.0,
                accuracy_m=8.0,
            )
        )

        result = check_track_quality(points, settings(), now_ts=points[-1].ts)

        assert result is RejectionReason.TELEPORT_DETECTED

    def test_a_stale_track_is_rejected(self) -> None:
        points = straight_track(1.4, 20)

        result = check_track_quality(points, settings(), now_ts=points[0].ts + 10 * 24 * 3600)

        assert result is RejectionReason.LOW_GPS_QUALITY

    def test_sparse_points_are_rejected(self) -> None:
        points = straight_track(1.4, 600, dt=30.0)

        result = check_track_quality(points, settings(), now_ts=points[-1].ts)

        assert result is RejectionReason.LOW_GPS_QUALITY

    def test_a_clean_walk_passes(self) -> None:
        points = straight_track(1.4, 60)

        assert check_track_quality(points, settings(), now_ts=points[-1].ts) is None

    def test_cycling_is_not_an_allowed_activity(self) -> None:
        assert check_activity("bike", 5.0, settings()) is RejectionReason.ACTIVITY_NOT_ALLOWED

    def test_running_too_fast_is_rejected(self) -> None:
        assert check_activity("run", 9.0, settings()) is RejectionReason.ACTIVITY_NOT_ALLOWED

    def test_a_normal_run_is_allowed(self) -> None:
        assert check_activity("run", 3.2, settings()) is None


def square_loop(
    side_m: float,
    spacing_m: float = 5.0,
    lat: float = NUKUS_LAT,
    lon: float = NUKUS_LON,
) -> list[tuple[float, float]]:
    """A closed square of (lon, lat) positions, walked anticlockwise."""
    d_lat = side_m / M_PER_DEG_LAT
    d_lon = side_m / M_PER_DEG_LON
    corners = [
        (lon, lat),
        (lon + d_lon, lat),
        (lon + d_lon, lat + d_lat),
        (lon, lat + d_lat),
        (lon, lat),
    ]

    positions: list[tuple[float, float]] = []
    steps = max(int(side_m / spacing_m), 1)

    for index in range(4):
        start_lon, start_lat = corners[index]
        end_lon, end_lat = corners[index + 1]
        for step in range(steps):
            fraction = step / steps
            positions.append(
                (
                    start_lon + (end_lon - start_lon) * fraction,
                    start_lat + (end_lat - start_lat) * fraction,
                )
            )

    positions.append(corners[0])

    return positions
