import { t } from '../i18n/qq';
import {
  describeActivity,
  describeReason,
  formatArea,
  formatDistance,
  formatSpeed,
} from './format';
import type { RunTracker } from './useRunTracker';

interface RunPanelProps {
  tracker: RunTracker;
  /** False when no backend is reachable, e.g. on a static deployment. */
  apiReachable: boolean;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function RunPanel({ tracker, apiReachable }: RunPanelProps) {
  const {
    phase,
    points,
    result,
    error,
    durationSeconds,
    distanceM,
    speedKmh,
    screenLocked,
  } = tracker;

  if (!apiReachable) {
    return (
      <div className="run-dock">
        <p className="run-note">{t.run.noApi}</p>
      </div>
    );
  }

  return (
    <div className="run-dock">
      {error ? (
        <div className="run-error" role="alert">
          <p>{error}</p>
          {/[0-9a-f-]{36}/i.test(error) ? (
            <button type="button" onClick={() => void tracker.recover()}>
              {t.run.release}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Victory / Capture or Rejection Card */}
      {result ? (
        <div className={`run-result-card ${result.status}`} role="status">
          {result.status === 'accepted' ? (
            <div className="victory-content">
              <span className="victory-badge">
                <span aria-hidden="true">🎉</span> {t.run.captured}
              </span>
              <h2 className="victory-area">{formatArea(result.awarded_area_m2)}</h2>
              <div className="victory-details">
                <span><span aria-hidden="true">⚡ </span><span>{describeActivity(result.activity?.type)} ({formatSpeed(result.activity?.avg_speed_ms ?? null)})</span></span>
                {result.excluded_area_m2 ? (
                  <span><span aria-hidden="true">🚫 </span><span>{t.run.excluded(formatArea(result.excluded_area_m2))}</span></span>
                ) : null}
                {result.warnings.includes('LOOP_CLOSED_BY_SERVER') ? (
                  <span><span aria-hidden="true">🔄 </span><span>{t.run.closedGap(formatDistance(result.closing_gap_m))}</span></span>
                ) : null}
                {result.captured_from.length > 0 ? (
                  <span><span aria-hidden="true">⚔️ </span><span>{t.run.takenFrom(result.captured_from.map((o) => o.username).join(', '))}</span></span>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rejection-content">
              <span className="rejection-badge">
                <span aria-hidden="true">⚠️</span> {t.run.rejected}
              </span>
              <p className="rejection-reason">{describeReason(result.reason)}</p>
            </div>
          )}
          <button type="button" className="result-close-btn" onClick={tracker.reset}>
            {t.run.close}
          </button>
        </div>
      ) : null}

      {/* Active Run Live HUD Bar */}
      {(phase === 'tracking' || phase === 'finishing') && !result ? (
        <div className="run-hud">
          <div className="hud-metrics">
            <div className="hud-metric-box">
              <span className="metric-label">⏱️ VAQIT</span>
              <span className="metric-val">{formatDuration(durationSeconds)}</span>
            </div>
            <div className="hud-metric-box">
              <span className="metric-label">📏 ARALIQ</span>
              <span className="metric-val">
                {distanceM >= 1000 ? `${(distanceM / 1000).toFixed(2)} km` : `${Math.round(distanceM)} m`}
              </span>
            </div>
            <div className="hud-metric-box">
              <span className="metric-label">⚡ TEZLIK</span>
              <span className="metric-val">{speedKmh} km/h</span>
            </div>
          </div>

          <p className="run-note">{t.run.tracking(points.length)}</p>

          <div className="hud-status-row">
            <span className="hud-points-badge">📍 {points.length} noqat</span>
            {screenLocked ? (
              <span className="hud-wakelock-badge">⚡ Ekran oʻshpeydi</span>
            ) : null}
          </div>

          <div className="hud-actions">
            <button
              className="run-button stop"
              type="button"
              onClick={() => void tracker.finish()}
              disabled={phase === 'finishing'}
            >
              {phase === 'finishing' ? t.run.checking : t.run.finish}
            </button>
            <button
              className="run-abandon-btn"
              type="button"
              onClick={tracker.reset}
              title="Biykarlaw"
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}

      {/* Idle Launch Button */}
      {(phase === 'idle' || phase === 'done') && !result ? (
        <div className="run-launch-box">
          <button
            className="run-button start"
            type="button"
            onClick={() => void tracker.start()}
            disabled={phase === 'done'}
          >
            <span aria-hidden="true" className="play-triangle">▶</span> {t.run.start}
          </button>
        </div>
      ) : null}
    </div>
  );
}
