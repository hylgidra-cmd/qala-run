import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TrackPoint } from './api';
import {
  MAX_BUFFERED_POINTS,
  PENDING_POINTS_KEY,
  clearBuffer,
  readBuffer,
  saveBuffer,
} from './offlineBuffer';

function point(ts: number): TrackPoint {
  return { lat: 42.45, lon: 59.61, ts, accuracy: 8, speed: 1.4, mocked: false };
}

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('offline GPS buffer', () => {
  it('replays what it was given', () => {
    saveBuffer('run-1', [point(1), point(2)]);

    expect(readBuffer()).toEqual({ runId: 'run-1', points: [point(1), point(2)] });
  });

  it('clears the key instead of storing an empty queue', () => {
    saveBuffer('run-1', [point(1)]);
    saveBuffer('run-1', []);

    expect(localStorage.getItem(PENDING_POINTS_KEY)).toBeNull();
    expect(readBuffer()).toBeNull();
  });

  it('keeps the newest points when the run outgrows the quota', () => {
    const many = Array.from({ length: MAX_BUFFERED_POINTS + 10 }, (_, index) => point(index));

    saveBuffer('run-1', many);
    const buffered = readBuffer();

    expect(buffered?.points).toHaveLength(MAX_BUFFERED_POINTS);
    expect(buffered?.points[buffered.points.length - 1].ts).toBe(MAX_BUFFERED_POINTS + 9);
  });

  it('ignores half-written JSON from a killed process', () => {
    localStorage.setItem(PENDING_POINTS_KEY, '{"runId":"run-1","points":[{"lat":42');

    expect(readBuffer()).toBeNull();
  });

  it('ignores a batch that holds nothing shaped like a fix', () => {
    localStorage.setItem(
      PENDING_POINTS_KEY,
      JSON.stringify({ runId: 'run-1', points: [{ lat: 'north' }, null] }),
    );

    expect(readBuffer()).toBeNull();
  });

  it('ignores a batch with no run to send it to', () => {
    localStorage.setItem(PENDING_POINTS_KEY, JSON.stringify({ points: [point(1)] }));

    expect(readBuffer()).toBeNull();
  });

  it('forgets the batch on demand', () => {
    saveBuffer('run-1', [point(1)]);
    clearBuffer();

    expect(readBuffer()).toBeNull();
  });

  // A private window refuses storage. The run has to continue anyway: the
  // in-memory queue is still the one the uploader works from.
  it('survives storage being refused', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });

    expect(() => saveBuffer('run-1', [point(1)])).not.toThrow();
  });

  it('survives storage being unreadable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });

    expect(readBuffer()).toBeNull();
  });
});
