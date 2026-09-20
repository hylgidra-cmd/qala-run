export interface City {
  id: string;
  name: string;
  country: string;
  flag: string;
  center: {
    longitude: number;
    latitude: number;
  };
  // [west, south, east, north]
  bounds: [number, number, number, number];
  zoom: number;
}

export const CITIES: Record<string, City> = {
  nukus: {
    id: 'nukus',
    name: 'Nókis',
    country: 'Qaraqalpaqstan',
    flag: '🇺🇿',
    center: { longitude: 59.6103, latitude: 42.4531 },
    bounds: [59.45, 42.36, 59.75, 42.55],
    zoom: 13,
  },
  tashkent: {
    id: 'tashkent',
    name: 'Toshkent',
    country: 'O‘zbekiston',
    flag: '🇺🇿',
    center: { longitude: 69.2401, latitude: 41.2995 },
    bounds: [69.05, 41.15, 69.45, 41.45],
    zoom: 12,
  },
  almaty: {
    id: 'almaty',
    name: 'Almaty',
    country: 'Qazaqstan',
    flag: '🇰🇿',
    center: { longitude: 76.8897, latitude: 43.2389 },
    bounds: [76.70, 43.10, 77.10, 43.40],
    zoom: 12,
  },
  istanbul: {
    id: 'istanbul',
    name: 'Istanbul',
    country: 'Türkiye',
    flag: '🇹🇷',
    center: { longitude: 28.9784, latitude: 41.0082 },
    bounds: [28.60, 40.80, 29.40, 41.30],
    zoom: 11,
  },
};

export const CITIES_LIST = Object.values(CITIES);
export const DEFAULT_CITY_ID = 'nukus';

export function getCity(cityId?: string | null): City {
  if (cityId && cityId.toLowerCase() in CITIES) {
    return CITIES[cityId.toLowerCase()];
  }
  return CITIES[DEFAULT_CITY_ID];
}
