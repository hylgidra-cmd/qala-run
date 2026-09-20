"""Supported cities and geographic boundaries.

Nukus: Pilot region in Karakalpakstan
Tashkent: Capital of Uzbekistan
Almaty: Major hub in Kazakhstan
Istanbul: Major metropolis in Turkey
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class City:
    id: str
    name: str
    country: str
    center_lon: float
    center_lat: float
    # [west, south, east, north]
    bbox: tuple[float, float, float, float]


CITIES: dict[str, City] = {
    "nukus": City(
        id="nukus",
        name="Nókis",
        country="Qaraqalpaqstan",
        center_lon=59.6103,
        center_lat=42.4531,
        bbox=(59.45, 42.36, 59.75, 42.55),
    ),
    "tashkent": City(
        id="tashkent",
        name="Toshkent",
        country="O‘zbekiston",
        center_lon=69.2401,
        center_lat=41.2995,
        bbox=(69.05, 41.15, 69.45, 41.45),
    ),
    "almaty": City(
        id="almaty",
        name="Almaty",
        country="Qazaqstan",
        center_lon=76.8897,
        center_lat=43.2389,
        bbox=(76.70, 43.10, 77.10, 43.40),
    ),
    "istanbul": City(
        id="istanbul",
        name="Istanbul",
        country="Türkiye",
        center_lon=28.9784,
        center_lat=41.0082,
        bbox=(28.60, 40.80, 29.40, 41.30),
    ),
}

DEFAULT_CITY_ID = "nukus"


def get_city(city_id: str | None) -> City:
    if city_id and city_id.lower() in CITIES:
        return CITIES[city_id.lower()]
    return CITIES[DEFAULT_CITY_ID]


def is_inside_city_bbox(
    coordinates: list[tuple[float, float]],
    city_id: str | None,
) -> bool:
    city = get_city(city_id)
    west, south, east, north = city.bbox
    return all(west <= lon <= east and south <= lat <= north for lon, lat in coordinates)
