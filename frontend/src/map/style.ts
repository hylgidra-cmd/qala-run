export const DEV_MAP_STYLE =
  import.meta.env.VITE_MAP_STYLE_URL ??
  'https://tiles.openfreemap.org/styles/positron';

export const NUKUS_CENTER = {
  longitude: 59.6103,
  latitude: 42.4531,
};

export const PILOT_BOUNDS: [number, number, number, number] = [
  59.58,
  42.43,
  59.64,
  42.48,
];
