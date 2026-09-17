"""End-to-end run pipeline against the real database.

Every test runs inside a transaction that is rolled back, so the demo data
stays clean. They need the compose database and skip without it.
"""
import math
import time
import uuid

import httpx
import pytest
from asyncpg.exceptions import PostgresConnectionError
from sqlalchemy import text
from sqlalchemy.exc import InterfaceError, OperationalError
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from app.api.deps import get_connection
from app.config import get_settings
from app.db import get_redis
from app.main import app

NUKUS_LAT = 42.4531
NUKUS_LON = 59.6103
TASHKENT_LAT = 41.2995
TASHKENT_LON = 69.2401

M_PER_DEG_LAT = 110574.0

# Anti-cheat rule 2 rejects a track that is not from around now, so the
# fixtures are anchored to the clock rather than to a fixed epoch.
START_TS = time.time() - 3600.0


def metres_per_degree_lon(lat: float) -> float:
    return 111320.0 * math.cos(math.radians(lat))


def square_points(
    side_m: float,
    lat: float = NUKUS_LAT,
    lon: float = NUKUS_LON,
    spacing_m: float = 1.4,
    dt: float = 1.0,
) -> list[dict]:
    """A square walked at roughly 1.4 m/s, one fix per second."""
    d_lat = side_m / M_PER_DEG_LAT
    d_lon = side_m / metres_per_degree_lon(lat)
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

    return [
        {
            "lon": position[0],
            "lat": position[1],
            "ts": START_TS + index * dt,
            "accuracy": 8.0,
            "speed": None,
        }
        for index, position in enumerate(positions)
    ]


def triangle_points(
    side_m: float,
    lat: float = NUKUS_LAT,
    lon: float = NUKUS_LON,
    spacing_m: float = 1.4,
    dt: float = 1.0,
) -> list[dict]:
    """Three corners, walked at roughly 1.4 m/s."""
    d_lat = side_m / M_PER_DEG_LAT
    d_lon = side_m / metres_per_degree_lon(lat)
    corners = [(lon, lat), (lon + d_lon, lat), (lon + d_lon / 2, lat + d_lat), (lon, lat)]

    positions: list[tuple[float, float]] = []
    steps = max(int(side_m / spacing_m), 1)

    for index in range(3):
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

    return [
        {
            "lon": position[0],
            "lat": position[1],
            "ts": START_TS + index * dt,
            "accuracy": 8.0,
            "speed": None,
        }
        for index, position in enumerate(positions)
    ]


def straight_points(length_m: float, dt: float = 1.0, spacing_m: float = 1.4) -> list[dict]:
    steps = max(int(length_m / spacing_m), 1)

    return [
        {
            "lon": NUKUS_LON,
            "lat": NUKUS_LAT + (index * spacing_m) / M_PER_DEG_LAT,
            "ts": START_TS + index * dt,
            "accuracy": 8.0,
            "speed": None,
        }
        for index in range(steps)
    ]


@pytest.fixture
async def client():
    # Both caches hold clients bound to an event loop, and every test gets a
    # fresh loop, so they have to be rebuilt per test.
    get_redis.cache_clear()
    engine = create_async_engine(get_settings().database_url, poolclass=NullPool)

    try:
        connection = await engine.connect()
    except (OperationalError, InterfaceError, OSError, PostgresConnectionError) as exc:
        await engine.dispose()
        pytest.skip(f"database not reachable ({type(exc).__name__}); start it with docker compose")

    transaction = await connection.begin()

    async def override_connection():
        yield connection

    app.dependency_overrides[get_connection] = override_connection

    try:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as http_client:
            http_client.connection = connection  # type: ignore[attr-defined]
            yield http_client
    finally:
        app.dependency_overrides.clear()
        await transaction.rollback()
        await connection.close()
        await engine.dispose()
        await get_redis().aclose()
        get_redis.cache_clear()


@pytest.fixture
def connection(client):
    """The very connection the API is using, inside the same transaction."""
    return client.connection


@pytest.fixture
def headers() -> dict[str, str]:
    """A fresh device per test keeps users and rate-limit buckets separate."""
    return {"X-Demo-User": uuid.uuid4().hex}


async def run_track(client: httpx.AsyncClient, headers: dict[str, str], points: list[dict]):
    started = await client.post("/api/v1/runs/start", headers=headers)
    assert started.status_code == 201, started.text
    run_id = started.json()["run_id"]

    stored = await client.post(
        f"/api/v1/runs/{run_id}/points", headers=headers, json={"points": points}
    )
    assert stored.status_code == 200, stored.text

    return run_id, await client.post(f"/api/v1/runs/{run_id}/finish", headers=headers)


class TestAuth:
    async def test_a_run_needs_a_device_header(self, client) -> None:
        response = await client.post("/api/v1/runs/start")

        assert response.status_code == 401

    async def test_a_malformed_device_header_is_refused(self, client) -> None:
        response = await client.post("/api/v1/runs/start", headers={"X-Demo-User": "short"})

        assert response.status_code == 401


class TestRunLifecycle:
    async def test_a_closed_walk_captures_territory(self, client, headers) -> None:
        _, finished = await run_track(client, headers, square_points(side_m=120.0))

        assert finished.status_code == 200, finished.text
        body = finished.json()
        assert body["status"] == "accepted"
        assert body["reason"] is None
        assert body["mode"] == "solo"
        assert body["territory_id"]
        assert body["activity"]["type"] == "walk"
        # A 120 m square is 14400 m2; PostGIS measures it on the geography type.
        assert body["raw_area_m2"] == pytest.approx(14400.0, rel=0.05)
        # Whatever OSM holds inside the square is removed, so the award is the
        # raw area minus the exclusions and never more than the raw area.
        assert body["awarded_area_m2"] <= body["raw_area_m2"]
        assert body["awarded_area_m2"] == pytest.approx(
            body["raw_area_m2"] - body["excluded_area_m2"], rel=1e-6
        )
        assert body["closing_gap_m"] == pytest.approx(0.0, abs=1.0)

    async def test_the_captured_territory_is_served_to_the_map(self, client, headers) -> None:
        await run_track(client, headers, square_points(side_m=120.0))

        response = await client.get(
            "/api/v1/territories", params={"bbox": "59.58,42.43,59.64,42.48", "mode": "solo"}
        )

        assert response.status_code == 200
        body = response.json()
        assert body["type"] == "FeatureCollection"

        mine = [
            feature
            for feature in body["features"]
            if feature["properties"]["owner_name"].endswith(headers["X-Demo-User"][:6])
        ]
        assert len(mine) == 1
        assert mine[0]["geometry"]["type"] == "MultiPolygon"
        assert mine[0]["properties"]["mode"] == "solo"

    async def test_an_exclusion_zone_is_subtracted_from_the_award(
        self, client, headers, connection
    ) -> None:
        """A building inside the loop is not awarded (TZ section 17, step 13)."""
        # A 40 m square in the middle of the 120 m loop, as its own OSM object.
        inner = square_points(side_m=40.0, lat=NUKUS_LAT + 0.00036, lon=NUKUS_LON + 0.00048)
        ring = ", ".join(f"{point['lon']!r} {point['lat']!r}" for point in inner)
        first = f"{inner[0]['lon']!r} {inner[0]['lat']!r}"
        await connection.execute(
            text(
                """
                INSERT INTO exclusion_zones (kind, source, osm_type, osm_id, geom)
                VALUES ('building', 'test', 'way', :osm_id,
                        ST_Multi(ST_GeomFromText(:wkt, 4326)))
                """
            ),
            {"osm_id": -12345, "wkt": f"POLYGON(({ring}, {first}))"},
        )

        _, finished = await run_track(client, headers, square_points(side_m=120.0))
        body = finished.json()

        assert body["status"] == "accepted"
        # The 40 m square is 1600 m2 and sits wholly inside the loop.
        assert body["excluded_area_m2"] >= 1500.0

    async def test_a_second_run_cannot_start_while_one_is_active(self, client, headers) -> None:
        first = await client.post("/api/v1/runs/start", headers=headers)
        assert first.status_code == 201

        second = await client.post("/api/v1/runs/start", headers=headers)

        assert second.status_code == 409

    async def test_an_abandoned_run_frees_the_runner(self, client, headers) -> None:
        started = await client.post("/api/v1/runs/start", headers=headers)
        run_id = started.json()["run_id"]

        abandoned = await client.post(f"/api/v1/runs/{run_id}/abandon", headers=headers)
        assert abandoned.status_code == 204

        assert (await client.post("/api/v1/runs/start", headers=headers)).status_code == 201

    async def test_points_for_someone_elses_run_are_refused(self, client, headers) -> None:
        started = await client.post("/api/v1/runs/start", headers=headers)
        run_id = started.json()["run_id"]

        response = await client.post(
            f"/api/v1/runs/{run_id}/points",
            headers={"X-Demo-User": uuid.uuid4().hex},
            json={"points": square_points(side_m=120.0)[:10]},
        )

        assert response.status_code == 404

    async def test_stored_count_reports_what_was_actually_written(self, client, headers) -> None:
        started = await client.post("/api/v1/runs/start", headers=headers)
        run_id = started.json()["run_id"]
        points = square_points(side_m=120.0)[:20]

        first = await client.post(
            f"/api/v1/runs/{run_id}/points", headers=headers, json={"points": points}
        )
        # The same timestamps again must not be counted twice.
        second = await client.post(
            f"/api/v1/runs/{run_id}/points", headers=headers, json={"points": points}
        )

        assert first.json() == {"run_id": run_id, "stored": 20, "total": 20}
        assert second.json() == {"run_id": run_id, "stored": 0, "total": 20}

    async def test_the_client_reported_speed_is_ignored(self, client, headers) -> None:
        """CLAUDE.md rule 5: never trust client-computed speed."""
        points = square_points(side_m=120.0)
        for point in points:
            point["speed"] = 99.0

        _, finished = await run_track(client, headers, points)
        body = finished.json()

        assert body["status"] == "accepted"
        assert body["activity"]["avg_speed_ms"] < 5.0


class TestRejections:
    async def test_a_straight_line_encloses_nothing(self, client, headers) -> None:
        """The runner decides when to finish, so an open track is not rejected
        for being open - it is rejected because it encloses no ground."""
        _, finished = await run_track(client, headers, straight_points(length_m=400.0))
        body = finished.json()

        assert body["status"] == "rejected"
        assert body["reason"] in {"BAD_SHAPE", "AREA_TOO_SMALL", "NO_AWARDABLE_AREA"}
        assert body["closing_gap_m"] == pytest.approx(400.0, rel=0.05)

    async def test_a_wide_gap_is_reported_but_still_accepted(self, client, headers) -> None:
        """Product decision: the runner closes the loop, not a server threshold."""
        points = square_points(side_m=150.0)
        # Stop walking 60 m before the start, well over the 30 m warning.
        del points[-40:]

        _, finished = await run_track(client, headers, points)
        body = finished.json()

        assert body["status"] == "accepted"
        assert body["closing_gap_m"] > 30.0
        assert "LOOP_CLOSED_BY_SERVER" in body["warnings"]

    async def test_a_small_loop_is_still_the_runners_ground(self, client, headers) -> None:
        """Product decision: no minimum size. A 30 m square is 900 m2, well
        under the old 300 m / 2,000 m2 floors from TZ section 19."""
        _, finished = await run_track(client, headers, square_points(side_m=30.0))
        body = finished.json()

        assert body["status"] == "accepted", body
        assert body["raw_area_m2"] == pytest.approx(900.0, rel=0.1)

    async def test_a_triangle_counts_the_same_as_a_square(self, client, headers) -> None:
        """Any shape the runner actually walks encloses their ground."""
        _, finished = await run_track(client, headers, triangle_points(side_m=90.0))
        body = finished.json()

        assert body["status"] == "accepted", body
        assert body["raw_area_m2"] > 0

    async def test_a_loop_outside_the_pilot_area_is_refused(self, client, headers) -> None:
        points = square_points(side_m=120.0, lat=TASHKENT_LAT, lon=TASHKENT_LON)

        _, finished = await run_track(client, headers, points)

        assert finished.json()["reason"] == "OUTSIDE_REGION"

    async def test_a_teleport_is_detected(self, client, headers) -> None:
        points = square_points(side_m=120.0)
        points[50]["lat"] = NUKUS_LAT + 0.05

        _, finished = await run_track(client, headers, points)

        assert finished.json()["reason"] == "TELEPORT_DETECTED"

    async def test_a_rejected_run_stores_no_territory(self, client, headers) -> None:
        # Earlier demo runs may already own ground, so compare before and after
        # rather than assuming an empty map.
        params = {"bbox": "59.58,42.43,59.64,42.48"}
        before = (await client.get("/api/v1/territories", params=params)).json()["features"]

        await run_track(client, headers, straight_points(length_m=400.0))

        after = (await client.get("/api/v1/territories", params=params)).json()["features"]

        assert len(after) == len(before)


class TestTerritoryQuery:
    async def test_bbox_order_is_validated(self, client) -> None:
        response = await client.get(
            "/api/v1/territories", params={"bbox": "59.64,42.48,59.58,42.43"}
        )

        assert response.status_code == 422

    async def test_an_oversized_bbox_is_refused(self, client) -> None:
        response = await client.get("/api/v1/territories", params={"bbox": "50,40,60,50"})

        assert response.status_code == 422

    async def test_a_malformed_bbox_is_refused(self, client) -> None:
        response = await client.get("/api/v1/territories", params={"bbox": "59.58,42.43"})

        assert response.status_code == 422

    async def test_an_unknown_mode_is_refused(self, client) -> None:
        response = await client.get(
            "/api/v1/territories", params={"bbox": "59.58,42.43,59.64,42.48", "mode": "guild"}
        )

        assert response.status_code == 422
