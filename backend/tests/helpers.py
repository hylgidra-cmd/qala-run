"""Track fixtures shared by the run and clan tests.

A track is what the server is authoritative about, so the tests build real
coordinates rather than stubbing the pipeline.
"""
import math
import time

import httpx

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


async def run_track(client: httpx.AsyncClient, headers: dict[str, str], points: list[dict]):
    started = await client.post("/api/v1/runs/start", headers=headers)
    assert started.status_code == 201, started.text
    run_id = started.json()["run_id"]

    stored = await client.post(
        f"/api/v1/runs/{run_id}/points", headers=headers, json={"points": points}
    )
    assert stored.status_code == 200, stored.text

    return run_id, await client.post(f"/api/v1/runs/{run_id}/finish", headers=headers)


