import { describe, expect, it } from 'vitest';
import { t } from '../i18n/qq';
import { EXCLUSION_COLORS, EXCLUSION_KINDS, exclusionColorExpression } from './exclusions';

describe('exclusion styling', () => {
  it('gives every kind the TZ allows a colour and a Karakalpak label', () => {
    for (const kind of EXCLUSION_KINDS) {
      expect(EXCLUSION_COLORS[kind]).toMatch(/^#[0-9a-f]{6}$/);
      expect(t.legend.kinds[kind]).toBeTruthy();
    }
  });

  it('gives each kind a colour of its own', () => {
    const colors = new Set(EXCLUSION_KINDS.map((kind) => EXCLUSION_COLORS[kind]));

    expect(colors.size).toBe(EXCLUSION_KINDS.length);
  });

  it('matches on kind and falls back to the other colour', () => {
    const expression = exclusionColorExpression();

    expect(expression[0]).toBe('match');
    expect(expression[1]).toEqual(['get', 'kind']);
    expect(expression).toContain('water');
    expect(expression).toContain(EXCLUSION_COLORS.water);
    expect(expression.at(-1)).toBe(EXCLUSION_COLORS.other);
    // The fallback stands in for `other`, so it is not also a case.
    expect(expression).not.toContain('other');
  });
});
