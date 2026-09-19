import { describe, expect, it } from 'vitest';
import { t } from '../i18n/qq';
import {
  PERMISSION_DENIED,
  POSITION_UNAVAILABLE,
  TIMEOUT,
  geolocationNotice,
  isInsidePilotBounds,
} from './geolocation';

describe('geolocationNotice', () => {
  it('explains a blocked permission', () => {
    expect(geolocationNotice(PERMISSION_DENIED)).toBe(t.geo.denied);
  });

  it('explains a missing fix', () => {
    expect(geolocationNotice(POSITION_UNAVAILABLE)).toBe(t.geo.unavailable);
  });

  it('explains a timeout', () => {
    expect(geolocationNotice(TIMEOUT)).toBe(t.geo.timeout);
  });

  it('falls back for unknown codes', () => {
    expect(geolocationNotice(99)).toBe(t.geo.unknown);
  });
});

describe('isInsidePilotBounds', () => {
  it('accepts the Nukus centre', () => {
    expect(isInsidePilotBounds(59.6103, 42.4531)).toBe(true);
  });

  it('accepts the bbox corners', () => {
    expect(isInsidePilotBounds(59.58, 42.43)).toBe(true);
    expect(isInsidePilotBounds(59.64, 42.48)).toBe(true);
  });

  it('rejects a point west of the pilot area', () => {
    expect(isInsidePilotBounds(59.5, 42.4531)).toBe(false);
  });

  it('rejects a point north of the pilot area', () => {
    expect(isInsidePilotBounds(59.6103, 42.6)).toBe(false);
  });

  it('rejects Tashkent', () => {
    expect(isInsidePilotBounds(69.2401, 41.2995)).toBe(false);
  });
});
