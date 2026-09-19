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
  building: '#5b6b8f',
  private: '#e08a2e',
  school: '#8256d8',
  hospital: '#e0556b',
  military: '#5f8a43',
  water: '#2f9fd0',
  industrial: '#8c5a3c',
  other: '#6f7b86',
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
