"""The exclusion layer the map draws (TZ sections 9, 10 and 12).

The pilot bbox already holds imported OSM zones, so these tests put their own
zones far from Nukus where the counts stay deterministic.
"""
from sqlalchemy import text

# Empty ground for the test fixtures, well outside the imported pilot bbox.
TEST_LON = 69.2401
TEST_LAT = 41.2995


async def insert_zone(
    connection,
    kind: str,
    osm_id: int,
    lon: float = TEST_LON,
    lat: float = TEST_LAT,
    size_deg: float = 0.0005,
) -> None:
    await connection.execute(
        text(
            """
            INSERT INTO exclusion_zones (kind, source, osm_type, osm_id, geom)
            VALUES (
                :kind, 'test', 'way', :osm_id,
                ST_Multi(ST_MakeEnvelope(:west, :south, :east, :north, 4326))
            )
            """
        ),
        {
            "kind": kind,
            "osm_id": osm_id,
            "west": lon,
            "south": lat,
            "east": lon + size_deg,
            "north": lat + size_deg,
        },
    )


def bbox_around(lon: float, lat: float, span: float) -> str:
    return f"{lon - span},{lat - span},{lon + span},{lat + span}"


class TestExclusionLayer:
    async def test_a_zone_in_view_is_returned_with_its_kind(self, client, connection) -> None:
        await insert_zone(connection, "water", osm_id=9001)

        response = await client.get(
            "/api/v1/zones/exclusions", params={"bbox": bbox_around(TEST_LON, TEST_LAT, 0.002)}
        )

        assert response.status_code == 200, response.text
        body = response.json()
        assert body["type"] == "FeatureCollection"
        assert body["truncated"] is False
        assert [feature["properties"]["kind"] for feature in body["features"]] == ["water"]
        assert body["features"][0]["geometry"]["type"] == "MultiPolygon"

    async def test_a_zone_outside_the_view_is_left_out(self, client, connection) -> None:
        await insert_zone(connection, "building", osm_id=9002)

        response = await client.get(
            "/api/v1/zones/exclusions",
            params={"bbox": bbox_around(TEST_LON + 0.2, TEST_LAT, 0.002)},
        )

        assert response.json()["features"] == []

    async def test_kinds_can_be_filtered(self, client, connection) -> None:
        await insert_zone(connection, "building", osm_id=9003)
        await insert_zone(connection, "water", osm_id=9004, lon=TEST_LON + 0.001)

        response = await client.get(
            "/api/v1/zones/exclusions",
            params={"bbox": bbox_around(TEST_LON, TEST_LAT, 0.002), "kind": "water"},
        )

        kinds = [feature["properties"]["kind"] for feature in response.json()["features"]]
        assert kinds == ["water"]

    async def test_an_unknown_kind_is_refused(self, client) -> None:
        response = await client.get(
            "/api/v1/zones/exclusions",
            params={"bbox": bbox_around(TEST_LON, TEST_LAT, 0.002), "kind": "castle"},
        )

        assert response.status_code == 422

    async def test_a_sub_pixel_zone_is_dropped_from_a_wide_view(self, client, connection) -> None:
        # Same zone, two zoom levels: visible close up, too small to draw at
        # city scale (TZ section 11).
        await insert_zone(connection, "building", osm_id=9005, size_deg=0.00001)

        close_up = await client.get(
            "/api/v1/zones/exclusions", params={"bbox": bbox_around(TEST_LON, TEST_LAT, 0.0005)}
        )
        wide = await client.get(
            "/api/v1/zones/exclusions", params={"bbox": bbox_around(TEST_LON, TEST_LAT, 0.03)}
        )

        assert len(close_up.json()["features"]) == 1
        assert wide.json()["features"] == []

    async def test_bbox_order_is_validated(self, client) -> None:
        response = await client.get(
            "/api/v1/zones/exclusions", params={"bbox": "59.64,42.48,59.58,42.43"}
        )

        assert response.status_code == 422

    async def test_an_oversized_bbox_is_refused(self, client) -> None:
        response = await client.get("/api/v1/zones/exclusions", params={"bbox": "50,40,60,50"})

        assert response.status_code == 422

    async def test_a_malformed_bbox_is_refused(self, client) -> None:
        response = await client.get("/api/v1/zones/exclusions", params={"bbox": "59.58,42.43"})

        assert response.status_code == 422
