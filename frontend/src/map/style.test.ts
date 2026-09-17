import { describe, expect, it } from 'vitest';
import { NUKUS_CENTER, PILOT_BOUNDS } from './style';

describe('map configuration', () => {
  it('keeps Nukus center inside the pilot bounds', () => {
    const [west, south, east, north] = PILOT_BOUNDS;

    expect(NUKUS_CENTER.longitude).toBeGreaterThan(west);
    expect(NUKUS_CENTER.longitude).toBeLessThan(east);
    expect(NUKUS_CENTER.latitude).toBeGreaterThan(south);
    expect(NUKUS_CENTER.latitude).toBeLessThan(north);
  });
});
