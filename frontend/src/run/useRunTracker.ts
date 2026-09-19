import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '../i18n/qq';
import {
  ApiError,
  type RunResult,
  type TrackPoint,
  abandonRun,
  finishRun,
  sendPoints,
  startRun,
  toTrackPoint,
} from './api';

export type RunPhase = 'idle' | 'starting' | 'tracking' | 'finishing' | 'done';

/** Solo and clan ground are separate layers; a run belongs to one of them. */
export type TerritoryMode = 'solo' | 'clan';

/** The points endpoint allows 2 requests per second; 4 s stays well inside it. */
const FLUSH_INTERVAL_MS = 4000;

export interface RunTracker {
  phase: RunPhase;
  runId: string | null;
  points: TrackPoint[];
  result: RunResult | null;
  error: string | null;
  start: () => Promise<void>;
  finish: () => Promise<void>;
  reset: () => void;
  recover: () => Promise<void>;
}

export function useRunTracker(mode: TerritoryMode = 'solo'): RunTracker {
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [runId, setRunId] = useState<string | null>(null);
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const watchId = useRef<number | null>(null);
  const pending = useRef<TrackPoint[]>([]);
  const flushTimer = useRef<number | null>(null);
  const activeRunId = useRef<string | null>(null);

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    if (flushTimer.current !== null) {
      window.clearInterval(flushTimer.current);
      flushTimer.current = null;
    }
  }, []);

  const flush = useCallback(async () => {
    const id = activeRunId.current;
    if (!id || pending.current.length === 0) {
      return;
    }

    const batch = pending.current;
    pending.current = [];

    try {
      await sendPoints(id, batch);
    } catch (cause) {
      // Keep the batch so a dropped connection does not lose the track.
      pending.current = [...batch, ...pending.current];
      setError(cause instanceof Error ? cause.message : t.run.couldNotUpload);
    }
  }, []);

  useEffect(() => stopWatching, [stopWatching]);

  const start = useCallback(async () => {
    setError(null);
    setResult(null);
    setPoints([]);
    pending.current = [];

    if (!('geolocation' in navigator)) {
      setError(t.run.noGeolocation);
      return;
    }

    setPhase('starting');

    try {
      const started = await startRun(mode);
      activeRunId.current = started.run_id;
      setRunId(started.run_id);
    } catch (cause) {
      setPhase('idle');
      setError(
        cause instanceof ApiError && cause.status === 409
          ? `${cause.message}`
          : cause instanceof Error
            ? cause.message
            : t.run.couldNotStart,
      );
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const point = toTrackPoint(position);
        pending.current.push(point);
        setPoints((previous) => [...previous, point]);
      },
      (positionError) => setError(positionError.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );

    flushTimer.current = window.setInterval(() => {
      void flush();
    }, FLUSH_INTERVAL_MS);

    setPhase('tracking');
  }, [flush, mode]);

  const finish = useCallback(async () => {
    const id = activeRunId.current;
    if (!id) {
      return;
    }

    setPhase('finishing');
    stopWatching();
    await flush();

    try {
      setResult(await finishRun(id));
      setPhase('done');
    } catch (cause) {
      setPhase('tracking');
      setError(cause instanceof Error ? cause.message : t.run.couldNotFinish);
      return;
    }

    activeRunId.current = null;
  }, [flush, stopWatching]);

  const reset = useCallback(() => {
    stopWatching();
    activeRunId.current = null;
    setPhase('idle');
    setRunId(null);
    setPoints([]);
    setResult(null);
    setError(null);
  }, [stopWatching]);

  /** Release a run left active by a closed tab, then allow a new one. */
  const recover = useCallback(async () => {
    const match = /([0-9a-f-]{36})/i.exec(error ?? '');
    if (!match) {
      return;
    }

    try {
      await abandonRun(match[1]);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.run.couldNotRelease);
    }
  }, [error]);

  return { phase, runId, points, result, error, start, finish, reset, recover };
}
