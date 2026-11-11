/**
 * Exclusion zone styling (TZ sections 9 and 12).
 *
 * These polygons are the ground a run never wins. Positron already draws
 * buildings in pale grey, so a grey exclusion is invisible as an exclusion -
 * every kind gets a saturated hue of its own instead. The server still decides
 * what is actually subtracted.
 */
export const EXCLUSION_KINDS = [
  'building',
  'private',
  'school',
  'hospital',
  'military',
  'water',
  'industrial',
  'other',
] as const;

export type ExclusionKind = (typeof EXCLUSION_KINDS)[number];

export const EXCLUSION_COLORS: Record<ExclusionKind, string> = {
  building: '#ff3b30',
  private: '#ff2d55',
  school: '#e61919',
  hospital: '#ff4757',
  military: '#d63031',
  water: '#ff5252',
  industrial: '#c0392b',
  other: '#b71540',
};

/**
 * A MapLibre `match` expression over the `kind` property. An unknown kind from
 * a newer import still gets drawn, in the `other` colour.
 */
export function exclusionColorExpression(): unknown[] {
  const cases = EXCLUSION_KINDS.filter((kind) => kind !== 'other').flatMap((kind) => [
    kind,
    EXCLUSION_COLORS[kind],
  ]);

  return ['match', ['get', 'kind'], ...cases, EXCLUSION_COLORS.other];
}
