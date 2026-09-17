import { describe, expect, it } from 'vitest';
import {
  describeReason,
  formatArea,
  formatDistance,
  formatDuration,
  formatSpeed,
} from './format';

describe('formatArea', () => {
  it('shows square metres below a hectare', () => {
    expect(formatArea(2400)).toBe('2,400 m²');
  });

  it('switches to hectares at ten thousand', () => {
    expect(formatArea(14400)).toBe('1.44 ha');
  });

  it('handles a missing value', () => {
    expect(formatArea(null)).toBe('—');
  });

  it('handles a non-finite value', () => {
    expect(formatArea(Number.NaN)).toBe('—');
  });
});

describe('formatDuration', () => {
  it('pads the seconds', () => {
    expect(formatDuration(65)).toBe('1:05');
  });

  it('handles under a minute', () => {
    expect(formatDuration(9)).toBe('0:09');
  });

  it('refuses to render negative time', () => {
    expect(formatDuration(-5)).toBe('0:00');
  });
});

describe('formatSpeed', () => {
  it('converts metres per second to km/h', () => {
    expect(formatSpeed(1.4)).toBe('5.0 km/h');
  });

  it('handles a missing value', () => {
    expect(formatSpeed(null)).toBe('—');
  });
});

describe('describeReason', () => {
  it('explains a known rejection', () => {
    expect(describeReason('LOOP_NOT_CLOSED')).toMatch(/back to the start/i);
  });

  it('does not quote a threshold the server may not use', () => {
    // The size floors are configurable, so the text must not name numbers.
    expect(describeReason('TOO_SHORT')).not.toMatch(/300/);
    expect(describeReason('AREA_TOO_SMALL')).not.toMatch(/2,?000/);
  });

  it('falls back to the raw code for an unknown reason', () => {
    expect(describeReason('SOMETHING_NEW')).toBe('SOMETHING_NEW');
  });

  it('renders nothing when a run was accepted', () => {
    expect(describeReason(null)).toBe('');
  });
});

describe('formatDistance', () => {
  it('shows metres below a kilometre', () => {
    expect(formatDistance(64)).toBe('64 m');
  });

  it('switches to kilometres', () => {
    expect(formatDistance(1420)).toBe('1.42 km');
  });

  it('handles a missing value', () => {
    expect(formatDistance(null)).toBe('—');
  });
});
