import { describe, expect, it } from 'vitest';
import { bboxKey, roundBbox } from './bbox';

describe('roundBbox', () => {
  it('widens rather than narrows the box', () => {
    const [west, south, east, north] = roundBbox([59.58123456, 42.43123456, 59.64987654, 42.48987654]);

    expect(west).toBeLessThanOrEqual(59.58123456);
    expect(south).toBeLessThanOrEqual(42.43123456);
    expect(east).toBeGreaterThanOrEqual(59.64987654);
    expect(north).toBeGreaterThanOrEqual(42.48987654);
  });

  it('gives the same result for a tiny pan, so the request can be reused', () => {
    const first = roundBbox([59.5812345, 42.4312345, 59.6498765, 42.4898765]);
    const second = roundBbox([59.5812349, 42.4312349, 59.6498761, 42.4898761]);

    expect(bboxKey(first)).toBe(bboxKey(second));
  });

  it('changes once the map really moves', () => {
    const first = roundBbox([59.58, 42.43, 59.64, 42.48]);
    const second = roundBbox([59.6, 42.45, 59.66, 42.5]);

    expect(bboxKey(first)).not.toBe(bboxKey(second));
  });

  it('keeps four decimals', () => {
    expect(bboxKey(roundBbox([59.58, 42.43, 59.64, 42.48]))).toBe('59.58,42.43,59.64,42.48');
  });
});
