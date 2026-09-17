export type Bbox = [number, number, number, number];

/** Four decimals is about 10 m - enough for the map, stable enough to cache. */
export const BBOX_PRECISION = 4;

/**
 * Round a bbox so that small map movements reuse the same request.
 * The box is widened, never narrowed, so nothing visible goes unfetched.
 */
export function roundBbox(bbox: Bbox): Bbox {
  const factor = 10 ** BBOX_PRECISION;
  const [west, south, east, north] = bbox;

  return [
    Math.floor(west * factor) / factor,
    Math.floor(south * factor) / factor,
    Math.ceil(east * factor) / factor,
    Math.ceil(north * factor) / factor,
  ];
}

export function bboxKey(bbox: Bbox): string {
  return bbox.join(',');
}
