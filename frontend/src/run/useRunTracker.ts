/* eslint-disable @typescript-eslint/no-explicit-any */
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
} from './api';
import { type PositionWatch, haptic, isNativeApp, startPositionWatch } from './nativeBridge';
import { clearBuffer, readBuffer, saveBuffer } from './offlineBuffer';

export type RunPhase = 'idle' | 'starting' | 'tracking' | 'finishing' | 'done';

/** Solo and clan ground are separate layers; a run belongs to one of them. */
export type TerritoryMode = 'solo' | 'clan';

/** The points endpoint allows 2 requests per second; 4 s stays well inside it. */
const FLUSH_INTERVAL_MS = 4000;

/**
 * How hard the finish tries to deliver the queue before giving up. A run that
 * ends in a dead spot is common; losing its tail is not acceptable, so the
 * run stays open and buffered rather than being judged on half a track.
 */
const FLUSH_ATTEMPTS = 3;
const FLUSH_RETRY_DELAY_MS = 800;

function distanceBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface RunTracker {
  phase: RunPhase;
  runId: string | null;
  points: TrackPoint[];
  result: RunResult | null;
  error: string | null;
  durationSeconds: number;
  distanceM: number;
  speedKmh: number;
  screenLocked: boolean;
  loopGapM?: number | null;
  isLoopReady?: boolean;
  anchorIndex?: number | null;
  effectiveLoopStartIdx?: number;
  /** True when the APK's foreground service is recording with the screen off. */
  backgroundTracking?: boolean;

  start: () => Promise<void>;
  finish: () => Promise<void>;
  reset: () => void;
  recover: () => Promise<void>;
  dropFlag?: () => void;
}

export function useRunTracker(mode: TerritoryMode = 'solo'): RunTracker {
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [runId, setRunId] = useState<string | null>(null);
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [distanceM, setDistanceM] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [screenLocked, setScreenLocked] = useState(false);
  const [loopGapM, setLoopGapM] = useState<number | null>(null);
  const [isLoopReady, setIsLoopReady] = useState(false);
  const [anchorIndex, setAnchorIndex] = useState<number | null>(null);
  const [effectiveLoopStartIdx, setEffectiveLoopStartIdx] = useState<number>(0);
  const [backgroundTracking, setBackgroundTracking] = useState(false);

  const watchRef = useRef<PositionWatch | null>(null);
  const pending = useRef<TrackPoint[]>([]);
  const flushTimer = useRef<number | null>(null);
  const durationTimer = useRef<number | null>(null);
  const activeRunId = useRef<string | null>(null);
  const wakeLockRef = useRef<any>(null);
  const anchorIndexRef = useRef<number | null>(null);
  const speedWindowRef = useRef<number[]>([]);
  // The loop-ready buzz fires on the edge, not on every fix that stays closed.
  const loopReadyRef = useRef(false);

  const stopWatching = useCallback(() => {
    if (watchRef.current !== null) {
      watchRef.current.stop();
      watchRef.current = null;
      setBackgroundTracking(false);
    }

    if (flushTimer.current !== null) {
      window.clearInterval(flushTimer.current);
      flushTimer.current = null;
    }

    if (durationTimer.current !== null) {
      window.clearInterval(durationTimer.current);
      durationTimer.current = null;
    }

    if (wakeLockRef.current) {
      try {
        void wakeLockRef.current.release();
      } catch {
        // ignore
      }
      wakeLockRef.current = null;
      setScreenLocked(false);
    }
  }, []);

  /** Mirror the queue to disk so a lost connection cannot cost the track. */
  const persistPending = useCallback(() => {
    const id = activeRunId.current;
    if (id) {
      saveBuffer(id, pending.current);
    }
  }, []);

  /** Returns true when the queue reached the server. */
  const flush = useCallback(async () => {
    const id = activeRunId.current;
    if (!id || pending.current.length === 0) {
      return true;
    }

    const batch = pending.current;
    pending.current = [];

    try {
      await sendPoints(id, batch);
      persistPending();
      return true;
    } catch (cause) {
      // Keep the batch so a dropped connection does not lose the track.
      pending.current = [...batch, ...pending.current];
      persistPending();
      setError(cause instanceof Error ? cause.message : t.run.couldNotUpload);
      return false;
    }
  }, [persistPending]);

  const flushWithRetry = useCallback(async () => {
    for (let attempt = 1; attempt <= FLUSH_ATTEMPTS; attempt += 1) {
      if (await flush()) {
        return true;
      }

      if (attempt < FLUSH_ATTEMPTS) {
        await new Promise((resolve) => window.setTimeout(resolve, FLUSH_RETRY_DELAY_MS));
      }
    }

    return false;
  }, [flush]);

  useEffect(() => stopWatching, [stopWatching]);

  /** Buzz once when the ring closes, never again while it stays closed. */
  const applyLoopReady = useCallback((ready: boolean) => {
    if (ready && !loopReadyRef.current) {
      void haptic('loopReady');
    }

    loopReadyRef.current = ready;
    setIsLoopReady(ready);
  }, []);

  const recomputeLoopState = useCallback(
    (trackPts: TrackPoint[], manualAnchorIdx: number | null) => {
      if (trackPts.length < 3) {
        setLoopGapM(null);
        applyLoopReady(false);
        setEffectiveLoopStartIdx(manualAnchorIdx ?? 0);
        return;
      }

      const last = trackPts[trackPts.length - 1];

      // 1. If the user explicitly dropped a Flag (Anchor), measure closure to that Flag
      if (manualAnchorIdx !== null && manualAnchorIdx >= 0 && manualAnchorIdx < trackPts.length - 2) {
        const anchorPt = trackPts[manualAnchorIdx];
        const gap = distanceBetween(anchorPt.lat, anchorPt.lon, last.lat, last.lon);
        setLoopGapM(Math.round(gap));
        applyLoopReady(trackPts.length - manualAnchorIdx >= 4 && gap <= 45);
        setEffectiveLoopStartIdx(manualAnchorIdx);
        return;
      }

      // 2. Otherwise measure closure to start (0), OR detect a Lollipop self-intersection
      const first = trackPts[0];
      const gap0 = distanceBetween(first.lat, first.lon, last.lat, last.lon);

      if (gap0 <= 45) {
        setLoopGapM(Math.round(gap0));
        applyLoopReady(trackPts.length >= 4 && gap0 <= 45);
        setEffectiveLoopStartIdx(0);
        return;
      }

      // Check if the runner closed a sub-loop of >= 100m perimeter back to an earlier point
      let bestIdx = 0;
      let bestGap = gap0;
      let cumulativeTailLen = 0;
      const totalLen = trackPts.reduce((acc, pt, idx) => {
        if (idx === 0) return 0;
        const p = trackPts[idx - 1];
        return acc + distanceBetween(p.lat, p.lon, pt.lat, pt.lon);
      }, 0);

      for (let i = 1; i < trackPts.length - 3; i++) {
        const pPrev = trackPts[i - 1];
        const pCur = trackPts[i];
        cumulativeTailLen += distanceBetween(pPrev.lat, pPrev.lon, pCur.lat, pCur.lon);
        const subLoopLen = totalLen - cumulativeTailLen;
        if (subLoopLen < 90) break;

        const g = distanceBetween(pCur.lat, pCur.lon, last.lat, last.lon);
        if (g <= 45 && g < bestGap) {
          bestGap = g;
          bestIdx = i;
        }
      }

      setLoopGapM(Math.round(bestGap));
      applyLoopReady(bestGap <= 45);
      setEffectiveLoopStartIdx(bestIdx);
    },
    [applyLoopReady],
  );

  const dropFlag = useCallback(() => {
    setPoints((current) => {
      if (current.length === 0) return current;
      const targetIdx = current.length - 1;
      const nextAnchor = anchorIndexRef.current === targetIdx ? null : targetIdx;
      anchorIndexRef.current = nextAnchor;
      setAnchorIndex(nextAnchor);
      recomputeLoopState(current, nextAnchor);
      void haptic('flag');
      return current;
    });
  }, [recomputeLoopState]);

  /**
   * One fix, from whichever provider this platform uses. The filtering, the
   * EMA smoothing and the loop detection below are the same in the browser
   * and in the APK, so a run behaves identically on both.
   */
  const ingestPoint = useCallback(
    (rawPoint: TrackPoint) => {
      // Filter out low accuracy fixes (> 35 meters)
      if (rawPoint.accuracy && rawPoint.accuracy > 35) {
        return;
      }

      setPoints((previous) => {
        let point = rawPoint;

        if (previous.length > 0) {
          const prev = previous[previous.length - 1];
          const rawDist = distanceBetween(prev.lat, prev.lon, rawPoint.lat, rawPoint.lon);
          const dt = Math.max(0.1, rawPoint.ts - prev.ts);

          // Filter out micro-jitter (< 1.5 meters unless time difference > 4 seconds)
          if (rawDist < 1.5 && dt < 4) {
            return previous;
          }

          // Filter out extreme GPS teleport jumps (> 70 meters in < 3 seconds)
          if (rawDist > 70 && dt < 3) {
            return previous;
          }

          // Real-time accuracy-weighted EMA smoothing to eliminate chaotic zig-zags
          const acc = rawPoint.accuracy ?? 12;
          const alpha = acc <= 8 ? 0.78 : acc <= 18 ? 0.62 : 0.45;
          point = {
            ...rawPoint,
            lat: prev.lat + alpha * (rawPoint.lat - prev.lat),
            lon: prev.lon + alpha * (rawPoint.lon - prev.lon),
          };

          const d = distanceBetween(prev.lat, prev.lon, point.lat, point.lon);
          setDistanceM((cur) => cur + d);

          const instSpeedKmh =
            point.speed !== null && point.speed > 0
              ? point.speed * 3.6
              : dt > 0
                ? (d / dt) * 3.6
                : 0;

          if (instSpeedKmh < 45) {
            const win = [...speedWindowRef.current.slice(-2), instSpeedKmh];
            speedWindowRef.current = win;
            const avgSpeed = win.reduce((a, b) => a + b, 0) / win.length;
            setSpeedKmh(Math.round(avgSpeed * 10) / 10);
          }
        }

        const updated = [...previous, point];
        recomputeLoopState(updated, anchorIndexRef.current);
        pending.current.push(point);
        return updated;
      });
    },
    [recomputeLoopState],
  );

  /**
   * Replay whatever a previous session could not deliver. The old run may
   * already be finished or abandoned, so this is best effort: the buffer is
   * cleared either way and never blocks the new run.
   */
  const drainOrphanBuffer = useCallback(async () => {
    const orphan = readBuffer();

    if (orphan && orphan.runId !== activeRunId.current) {
      try {
        await sendPoints(orphan.runId, orphan.points);
      } catch {
        // That run is gone. Nothing here is worth stopping a new one for.
      }
    }

    clearBuffer();
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setResult(null);
    setPoints([]);
    setDistanceM(0);
    setSpeedKmh(0);
    setDurationSeconds(0);
    setAnchorIndex(null);
    setEffectiveLoopStartIdx(0);
    anchorIndexRef.current = null;
    speedWindowRef.current = [];
    loopReadyRef.current = false;
    pending.current = [];

    // The APK reaches GPS through the native plugin, so a WebView without the
    // browser API is still perfectly able to record a run.
    if (!isNativeApp() && !('geolocation' in navigator)) {
      setError(t.run.noGeolocation);
      return;
    }

    setPhase('starting');

    await drainOrphanBuffer();

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

    // In the APK the foreground service is what keeps the fixes coming, so
    // forcing the screen on there would only burn battery for nothing.
    if (!isNativeApp() && 'wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setScreenLocked(true);
        wakeLockRef.current.addEventListener('release', () => setScreenLocked(false));
      } catch {
        // WakeLock request can fail on low battery or unpermitted contexts
      }
    }

    try {
      watchRef.current = await startPositionWatch(
        {
          notificationTitle: t.run.backgroundTitle,
          notificationMessage: t.run.backgroundMessage,
        },
        ingestPoint,
        (message) => setError(message),
      );
      setBackgroundTracking(watchRef.current.background);
    } catch (cause) {
      // The server already has an active run; leaving it open would block the
      // next attempt with a 409, so it is released before giving up.
      const orphanRun = activeRunId.current;
      activeRunId.current = null;
      if (orphanRun) {
        void abandonRun(orphanRun).catch(() => {});
      }

      setPhase('idle');
      setError(cause instanceof Error ? cause.message : t.run.couldNotStart);
      return;
    }

    // Start live duration counter
    durationTimer.current = window.setInterval(() => {
      setDurationSeconds((sec) => sec + 1);
    }, 1000);

    flushTimer.current = window.setInterval(() => {
      void flush();
    }, FLUSH_INTERVAL_MS);

    setPhase('tracking');
    void haptic('start');
  }, [drainOrphanBuffer, flush, ingestPoint, mode]);

  const finish = useCallback(async () => {
    const id = activeRunId.current;
    if (!id) {
      return;
    }

    setPhase('finishing');
    stopWatching();

    // Pocket mode means a run can easily end somewhere with no signal. The
    // server must judge the whole shape, so a queue that will not go through
    // leaves the run open and buffered rather than losing its tail; pressing
    // finish again retries from exactly where this left off.
    if (!(await flushWithRetry())) {
      setPhase('tracking');
      return;
    }

    try {
      const outcome = await finishRun(id, anchorIndexRef.current);
      setResult(outcome);
      setPhase('done');
      clearBuffer();

      if (outcome.status === 'accepted') {
        void haptic('captured');
      }
    } catch (cause) {
      setPhase('tracking');
      setError(cause instanceof Error ? cause.message : t.run.couldNotFinish);
      return;
    }

    activeRunId.current = null;
  }, [flushWithRetry, stopWatching]);

  const reset = useCallback(() => {
    stopWatching();
    const id = activeRunId.current;
    activeRunId.current = null;
    if (id) {
      void abandonRun(id).catch(() => {});
    }
    anchorIndexRef.current = null;
    speedWindowRef.current = [];
    loopReadyRef.current = false;
    pending.current = [];
    clearBuffer();
    setPhase('idle');
    setRunId(null);
    setPoints([]);
    setResult(null);
    setError(null);
    setDurationSeconds(0);
    setDistanceM(0);
    setSpeedKmh(0);
    setLoopGapM(null);
    setIsLoopReady(false);
    setAnchorIndex(null);
    setEffectiveLoopStartIdx(0);
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

  return {
    phase,
    runId,
    points,
    result,
    error,
    durationSeconds,
    distanceM,
    speedKmh,
    screenLocked,
    loopGapM,
    isLoopReady,
    anchorIndex,
    effectiveLoopStartIdx,
    backgroundTracking,
    start,
    finish,
    reset,
    recover,
    dropFlag,
  };
}


