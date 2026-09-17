"""Turn an Overpass `out geom` response into exclusion polygons (TZ section 13).

Pure parsing only: fetching and writing live in scripts/import_exclusions.py so
that this module can be tested without a network or a database.
"""
from typing import Any

Position = tuple[float, float]
Ring = list[Position]
Polygon = list[Ring]

# The kinds the TZ allows, most specific use first: a school inside a building
# is a school, not a building.
KIND_BUILDING = "building"
KIND_OTHER = "other"

ALLOWED_KINDS = frozenset(
    {"building", "private", "school", "hospital", "military", "water", "industrial", "other"}
)

# A ring needs three distinct corners plus the repeated closing position.
MIN_RING_POSITIONS = 4


def overpass_query(bbox: tuple[float, float, float, float], timeout_s: int = 300) -> str:
    """Build the TZ query. Overpass takes (south, west, north, east)."""
    west, south, east, north = bbox
    area = f"({south},{west},{north},{east})"

    selectors = [
        '["building"]',
        '["access"~"^(private|no)$"]',
        '["amenity"~"^(school|kindergarten|hospital)$"]',
        '["landuse"~"^(military|industrial)$"]',
        '["natural"="water"]',
    ]
    lines = [
        f"  {kind}{selector}{area};"
        for selector in selectors
        for kind in ("way", "relation")
    ]

    return "\n".join(
        [f"[out:json][timeout:{timeout_s}];", "(", *lines, ");", "out geom;"]
    )


def classify(tags: dict[str, str]) -> str:
    """Map OSM tags to one of the allowed exclusion kinds."""
    if tags.get("landuse") == "military" or "military" in tags:
        return "military"
    if tags.get("amenity") == "hospital":
        return "hospital"
    if tags.get("amenity") in {"school", "kindergarten"}:
        return "school"
    if tags.get("landuse") == "industrial":
        return "industrial"
    if tags.get("natural") == "water":
        return "water"
    if tags.get("access") in {"private", "no"}:
        return "private"
    if "building" in tags:
        return KIND_BUILDING

    return KIND_OTHER


def _positions(geometry: list[dict[str, float]]) -> Ring:
    return [(node["lon"], node["lat"]) for node in geometry if "lon" in node and "lat" in node]


def is_closed(ring: Ring) -> bool:
    return len(ring) >= MIN_RING_POSITIONS and ring[0] == ring[-1]


def way_polygon(element: dict[str, Any]) -> Polygon | None:
    """Only a closed way becomes a polygon (TZ section 14)."""
    ring = _positions(element.get("geometry") or [])

    return [ring] if is_closed(ring) else None


def assemble_rings(segments: list[Ring]) -> list[Ring]:
    """Chain way members end-to-end into closed rings.

    Segments that never close are dropped: an open barrier must not be turned
    into an area without a product decision (TZ section 14).
    """
    remaining = [segment for segment in segments if len(segment) >= 2]
    rings: list[Ring] = []

    while remaining:
        current = list(remaining.pop(0))

        extended = True
        while extended and current[0] != current[-1]:
            extended = False
            for index, candidate in enumerate(remaining):
                if candidate[0] == current[-1]:
                    current.extend(candidate[1:])
                elif candidate[-1] == current[-1]:
                    current.extend(reversed(candidate[:-1]))
                elif candidate[-1] == current[0]:
                    current = list(candidate[:-1]) + current
                elif candidate[0] == current[0]:
                    current = list(reversed(candidate[1:])) + current
                else:
                    continue

                remaining.pop(index)
                extended = True
                break

        if is_closed(current):
            rings.append(current)

    return rings


def relation_polygons(element: dict[str, Any]) -> list[Polygon]:
    """Assemble a multipolygon relation into outer rings with their holes.

    Holes are attached to the first outer ring, which is enough for the
    exclusion use: PostGIS runs ST_MakeValid over the result anyway.
    """
    members = element.get("members") or []
    outer = assemble_rings(
        [
            _positions(member.get("geometry") or [])
            for member in members
            if member.get("type") == "way" and member.get("role") in {"outer", ""}
        ]
    )
    inner = assemble_rings(
        [
            _positions(member.get("geometry") or [])
            for member in members
            if member.get("type") == "way" and member.get("role") == "inner"
        ]
    )

    if not outer:
        return []

    polygons: list[Polygon] = [[ring] for ring in outer]
    polygons[0].extend(inner)

    return polygons


def ring_wkt(ring: Ring) -> str:
    return "(" + ", ".join(f"{lon!r} {lat!r}" for lon, lat in ring) + ")"


def polygon_wkt(polygon: Polygon) -> str:
    return "POLYGON(" + ", ".join(ring_wkt(ring) for ring in polygon) + ")"


def multipolygon_wkt(polygons: list[Polygon]) -> str:
    bodies = [
        "(" + ", ".join(ring_wkt(ring) for ring in polygon) + ")" for polygon in polygons
    ]

    return "MULTIPOLYGON(" + ", ".join(bodies) + ")"


def parse_elements(elements: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Overpass elements -> rows ready for upsert into exclusion_zones."""
    rows: list[dict[str, Any]] = []

    for element in elements:
        osm_type = element.get("type")
        tags = element.get("tags") or {}

        if osm_type == "way":
            polygon = way_polygon(element)
            polygons = [polygon] if polygon else []
        elif osm_type == "relation":
            polygons = relation_polygons(element)
        else:
            continue

        if not polygons:
            continue

        rows.append(
            {
                "kind": classify(tags),
                "osm_type": osm_type,
                "osm_id": element.get("id"),
                "wkt": multipolygon_wkt(polygons),
            }
        )

    return rows
