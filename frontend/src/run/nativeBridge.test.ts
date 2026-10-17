/**
 * The bridge is exercised here in its browser half, which is the half the
 * test environment can reach. What matters is that a browser keeps behaving
 * exactly as it did before the APK existed: web geolocation, web vibration,
 * and no native call anywhere.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { haptic, initNativeShell, isNativeApp, startPositionWatch } from './nativeBridge';

const STRINGS = {
  notificationTitle: "Don't Stop",
  notificationMessage: 'running',
};

function fix(overrides: Partial<GeolocationCoordinates> = {}): GeolocationPosition {
  return {
    coords: {
      latitude: 42.4531,
      longitude: 59.6103,
      accuracy: 7,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: 1.5,
      toJSON: () => ({}),
      ...overrides,
    } as GeolocationCoordinates,
    timestamp: 1_700_000_000_000,
    toJSON: () => ({}),
  } as GeolocationPosition;
}

const watchPosition = vi.fn();
const clearWatch = vi.fn();

beforeEach(() => {
  watchPosition.mockReset().mockReturnValue(7);
  clearWatch.mockReset();

  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { watchPosition, clearWatch },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'vibrate');
});

describe('platform detection', () => {
  it('reads a browser as a browser, never as the APK', () => {
    expect(isNativeApp()).toBe(false);
  });
});

describe('position watch in a browser', () => {
  it('records through the Geolocation API and reports no background mode', async () => {
    const onPoint = vi.fn();

    const watch = await startPositionWatch(STRINGS, onPoint, vi.fn());

    expect(watch.background).toBe(false);
    expect(watchPosition).toHaveBeenCalledTimes(1);
  });

  it('hands over a fix in the shape the run API speaks', async () => {
    const onPoint = vi.fn();
    await startPositionWatch(STRINGS, onPoint, vi.fn());

    watchPosition.mock.calls[0][0](fix());

    expect(onPoint).toHaveBeenCalledWith({
      lat: 42.4531,
      lon: 59.6103,
      // The API counts in seconds; the browser reports milliseconds.
      ts: 1_700_000_000,
      accuracy: 7,
      speed: 1.5,
      // Only the native plugin can tell a mock-location app apart.
      mocked: false,
    });
  });

  it('passes a geolocation failure up as a message', async () => {
    const onError = vi.fn();
    await startPositionWatch(STRINGS, vi.fn(), onError);

    watchPosition.mock.calls[0][1]({ message: 'User denied Geolocation' });

    expect(onError).toHaveBeenCalledWith('User denied Geolocation');
  });

  it('releases the watch when the run stops', async () => {
    const watch = await startPositionWatch(STRINGS, vi.fn(), vi.fn());

    watch.stop();

    expect(clearWatch).toHaveBeenCalledWith(7);
  });
});

describe('haptics', () => {
  it('falls back to the Vibration API for a single pulse', async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate });

    await haptic('start');

    expect(vibrate).toHaveBeenCalledWith(40);
  });

  it('uses a pattern for the capture celebration', async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate });

    await haptic('captured');

    expect(vibrate).toHaveBeenCalledWith([60, 80, 60, 80, 140]);
  });

  // A desktop has no vibration motor, and a refused one must never surface
  // as a failed run.
  it('stays silent and keeps going without a vibration motor', async () => {
    await expect(haptic('flag')).resolves.toBeUndefined();
  });

  it('swallows a motor that throws', async () => {
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: () => {
        throw new Error('no motor');
      },
    });

    await expect(haptic('loopReady')).resolves.toBeUndefined();
  });
});

describe('native shell', () => {
  it('does nothing at all in a browser', async () => {
    await expect(initNativeShell()).resolves.toBeUndefined();
  });
});
