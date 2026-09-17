"""Overpass parsing - no network, no database."""
import pytest

from app.geo.osm import (
    ALLOWED_KINDS,
    assemble_rings,
    classify,
    is_closed,
    multipolygon_wkt,
    overpass_query,
    parse_elements,
    relation_polygons,
    way_polygon,
)

SQUARE = [(59.60, 42.45), (59.601, 42.45), (59.601, 42.451), (59.60, 42.451), (59.60, 42.45)]


def geometry(positions):
    return [{"lon": lon, "lat": lat} for lon, lat in positions]


class TestQuery:
    def test_bbox_is_written_in_overpass_order(self) -> None:
        """Overpass takes (south, west, north, east), unlike GeoJSON."""
        query = overpass_query((59.58, 42.43, 59.64, 42.48))

        assert "(42.43,59.58,42.48,59.64)" in query

    def test_every_tz_selector_is_present(self) -> None:
        query = overpass_query((59.58, 42.43, 59.64, 42.48))

        for selector in ['["building"]', '["access"', '["amenity"', '["landuse"', '["natural"']:
            assert selector in query

    def test_ways_and_relations_are_both_requested(self) -> None:
        query = overpass_query((59.58, 42.43, 59.64, 42.48))

        assert query.count("way[") == 5
        assert query.count("relation[") == 5

    def test_geometry_is_requested_inline(self) -> None:
        assert overpass_query((59.58, 42.43, 59.64, 42.48)).endswith("out geom;")


class TestClassify:
    @pytest.mark.parametrize(
        ("tags", "expected"),
        [
            ({"building": "yes"}, "building"),
            ({"access": "private"}, "private"),
            ({"access": "no"}, "private"),
            ({"amenity": "school"}, "school"),
            ({"amenity": "kindergarten"}, "school"),
            ({"amenity": "hospital"}, "hospital"),
            ({"landuse": "military"}, "military"),
            ({"landuse": "industrial"}, "industrial"),
            ({"natural": "water"}, "water"),
            ({"highway": "residential"}, "other"),
        ],
    )
    def test_tags_map_to_the_allowed_kinds(self, tags: dict, expected: str) -> None:
        assert classify(tags) == expected

    def test_every_result_is_an_allowed_kind(self) -> None:
        assert classify({"building": "yes"}) in ALLOWED_KINDS
        assert classify({}) in ALLOWED_KINDS

    def test_a_specific_use_beats_the_generic_building_tag(self) -> None:
        assert classify({"building": "yes", "amenity": "school"}) == "school"
        assert classify({"building": "yes", "landuse": "military"}) == "military"


class TestWays:
    def test_a_closed_way_becomes_a_polygon(self) -> None:
        polygon = way_polygon({"type": "way", "geometry": geometry(SQUARE)})

        assert polygon is not None
        assert polygon[0][0] == polygon[0][-1]

    def test_an_open_way_is_skipped(self) -> None:
        """TZ section 14: an open barrier is never turned into an area."""
        assert way_polygon({"type": "way", "geometry": geometry(SQUARE[:-1])}) is None

    def test_a_way_with_too_few_nodes_is_skipped(self) -> None:
        assert way_polygon({"type": "way", "geometry": geometry(SQUARE[:2])}) is None

    def test_a_way_without_geometry_is_skipped(self) -> None:
        assert way_polygon({"type": "way"}) is None


class TestRings:
    def test_two_halves_are_chained_into_one_ring(self) -> None:
        rings = assemble_rings([SQUARE[:3], SQUARE[2:]])

        assert len(rings) == 1
        assert is_closed(rings[0])

    def test_a_reversed_member_is_still_chained(self) -> None:
        rings = assemble_rings([SQUARE[:3], list(reversed(SQUARE[2:]))])

        assert len(rings) == 1
        assert is_closed(rings[0])

    def test_a_ring_that_never_closes_is_dropped(self) -> None:
        assert assemble_rings([SQUARE[:3]]) == []

    def test_an_already_closed_segment_is_kept(self) -> None:
        assert len(assemble_rings([SQUARE])) == 1


class TestRelations:
    def test_outer_members_form_the_polygon(self) -> None:
        relation = {
            "type": "relation",
            "members": [{"type": "way", "role": "outer", "geometry": geometry(SQUARE)}],
        }

        assert len(relation_polygons(relation)) == 1

    def test_inner_members_become_holes(self) -> None:
        hole = [(59.6002, 42.4502), (59.6008, 42.4502), (59.6008, 42.4508), (59.6002, 42.4508),
                (59.6002, 42.4502)]
        relation = {
            "type": "relation",
            "members": [
                {"type": "way", "role": "outer", "geometry": geometry(SQUARE)},
                {"type": "way", "role": "inner", "geometry": geometry(hole)},
            ],
        }

        polygons = relation_polygons(relation)

        assert len(polygons) == 1
        assert len(polygons[0]) == 2

    def test_a_relation_without_a_closed_outer_is_skipped(self) -> None:
        relation = {
            "type": "relation",
            "members": [{"type": "way", "role": "outer", "geometry": geometry(SQUARE[:3])}],
        }

        assert relation_polygons(relation) == []


class TestParseElements:
    def test_rows_carry_the_identity_needed_for_an_idempotent_upsert(self) -> None:
        rows = parse_elements(
            [{"type": "way", "id": 42, "tags": {"building": "yes"}, "geometry": geometry(SQUARE)}]
        )

        assert rows == [
            {
                "kind": "building",
                "osm_type": "way",
                "osm_id": 42,
                "wkt": rows[0]["wkt"],
            }
        ]
        assert rows[0]["wkt"].startswith("MULTIPOLYGON(((")

    def test_nodes_are_ignored(self) -> None:
        assert parse_elements([{"type": "node", "id": 1, "lat": 42.45, "lon": 59.6}]) == []

    def test_unusable_geometry_is_ignored(self) -> None:
        elements = [
            {"type": "way", "id": 1, "tags": {}, "geometry": geometry(SQUARE[:2])},
            {"type": "way", "id": 2, "tags": {"building": "yes"}, "geometry": geometry(SQUARE)},
        ]

        assert [row["osm_id"] for row in parse_elements(elements)] == [2]


class TestWkt:
    def test_multipolygon_nests_rings_correctly(self) -> None:
        wkt = multipolygon_wkt([[SQUARE]])

        assert wkt.startswith("MULTIPOLYGON(((")
        assert wkt.endswith(")))")
