export const MAP_STYLES = {
  day: 'https://tiles.openfreemap.org/styles/positron',
  night: 'https://tiles.openfreemap.org/styles/dark',
} as const;

export type MapTheme = 'day' | 'night';

export const DEV_MAP_STYLE =
  import.meta.env.VITE_MAP_STYLE_URL ??
  'https://tiles.openfreemap.org/styles/positron';
  MAP_STYLES.day;

export const NUKUS_CENTER = {
  longitude: 59.6103,
  latitude: 42.4531,
};

export const PILOT_BOUNDS: [number, number, number, number] = [
  59.45,
  42.36,
  59.75,
  42.55,
];
