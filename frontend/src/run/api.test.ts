import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, deviceKey, finishRun, startRun, toTrackPoint } from './api';

function position(overrides: Partial<GeolocationCoordinates> = {}): GeolocationPosition {
  return {
    timestamp: 1_780_000_000_000,
    coords: {
      latitude: 42.4531,
      longitude: 59.6103,
      accuracy: 8,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: 1.4,
      toJSON: () => ({}),
      ...overrides,
    },
    toJSON: () => ({}),
  } as GeolocationPosition;
}

describe('toTrackPoint', () => {
  it('converts the timestamp from milliseconds to seconds', () => {
    expect(toTrackPoint(position()).ts).toBe(1_780_000_000);
  });

  it('keeps coordinates and accuracy', () => {
    const point = toTrackPoint(position());

    expect(point.lat).toBe(42.4531);
    expect(point.lon).toBe(59.6103);
    expect(point.accuracy).toBe(8);
  });

  it('passes the browser speed through for auditing only', () => {
    expect(toTrackPoint(position()).speed).toBe(1.4);
    expect(toTrackPoint(position({ speed: null })).speed).toBeNull();
  });
});

describe('deviceKey', () => {
  beforeEach(() => localStorage.clear());

  it('matches the format the server accepts', () => {
    expect(deviceKey()).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });

  it('stays the same across calls', () => {
    expect(deviceKey()).toBe(deviceKey());
  });

  it('adopts the pre-rename key so an existing browser keeps its territories', () => {
    localStorage.setItem('qalarun.device', 'abcdef0123456789');

    expect(deviceKey()).toBe('abcdef0123456789');
    expect(localStorage.getItem('dontstop.device')).toBe('abcdef0123456789');
  });

  it('prefers the current key when both are present', () => {
    localStorage.setItem('qalarun.device', 'oldoldoldoldold1');
    localStorage.setItem('dontstop.device', 'newnewnewnewnew1');

    expect(deviceKey()).toBe('newnewnewnewnew1');
  });
});

describe('request handling', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('sends the device header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ run_id: 'r1', mode: 'solo', started_at: 'now' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await startRun();

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers['X-Demo-User']).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });

  it('turns a failure into an ApiError carrying the server detail', async () => {
    // A fresh Response per call: a body can only be read once.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        async () =>
          new Response(JSON.stringify({ detail: 'A run is already active' }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );

    const error = await startRun().catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(409);
    expect((error as ApiError).message).toBe('A run is already active');
  });

  it('survives an error body that is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => new Response('gateway down', { status: 502 })),
    );

    const error = await startRun().catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(502);
  });

  it('returns the decision the server made', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            run_id: 'r1',
            status: 'accepted',
            reason: null,
            mode: 'solo',
            awarded_area_m2: 14400,
            captured_from: [],
            warnings: [],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    const result = await finishRun('r1');

    expect(result.status).toBe('accepted');
    expect(result.awarded_area_m2).toBe(14400);
  });
});
