import { Flag, Play, Square, X, MapPin, Smartphone } from 'lucide-react';
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
    anchorIndex,
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
                {result.warnings.includes('TAIL_TRIMMED_TO_LOOP') ? (
                  <span><span aria-hidden="true">🚩 </span><span>Baslanǵısh sızıq saqlandı, aylana aymaqqa aylandı!</span></span>
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
            <span className="hud-points-badge">
              <MapPin size={12} className="inline-icon" /> {points.length} noqat
            </span>
            {anchorIndex != null ? (
              <span className="hud-points-badge" style={{ color: '#ffea00', borderColor: 'rgba(255, 234, 0, 0.4)' }}>
                🚩 Bayraq #{anchorIndex + 1}
              </span>
            ) : null}
            {tracker.loopGapM !== null && tracker.loopGapM !== undefined && points.length >= 3 ? (
              <span className={`hud-loop-badge ${tracker.isLoopReady ? 'ready' : ''}`}>
                <span aria-hidden="true">{anchorIndex != null ? '🚩 ' : '🔄 '}</span>
                {tracker.isLoopReady
                  ? `Aylana tayyor! (${tracker.loopGapM}m)`
                  : `${anchorIndex != null ? 'Bayraqqa' : 'Basa kiyiwge'}: ${tracker.loopGapM}m`}
              </span>
            ) : null}
            {screenLocked ? (
              <span className="hud-wakelock-badge">
                <Smartphone size={12} className="inline-icon" /> Ekran oʻshpeydi
              </span>
            ) : null}
            {tracker.backgroundTracking ? (
              <span className="hud-wakelock-badge">
                <Smartphone size={12} className="inline-icon" /> {t.run.backgroundActive}
              </span>
            ) : null}
          </div>

          <div className="hud-actions">
            {tracker.dropFlag && points.length >= 1 ? (
              <button
                className="run-abandon-btn"
                type="button"
                onClick={tracker.dropFlag}
                disabled={phase === 'finishing'}
                title="Bayraq qadaw (shu noqattan aylana baslanadı, aldınǵı jol sızıq bolıp qaladı)"
                style={{
                  width: 'auto',
                  padding: '0 12px',
                  gap: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: anchorIndex != null ? '#10251F' : '#ffea00',
                  background: anchorIndex != null ? '#ffea00' : 'rgba(255, 234, 0, 0.14)',
                  borderColor: 'rgba(255, 234, 0, 0.45)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}
              >
                <Flag size={15} fill={anchorIndex != null ? '#10251F' : 'none'} />
                <span>{anchorIndex != null ? 'Bayraq ornatıldı' : 'Bayraq'}</span>
              </button>
            ) : null}
            <button
              className="run-button stop"
              type="button"
              onClick={() => void tracker.finish()}
              disabled={phase === 'finishing'}
            >
              <Square size={15} fill="currentColor" />
              <span>{phase === 'finishing' ? t.run.checking : t.run.finish}</span>
            </button>
            <button
              className="run-abandon-btn"
              type="button"
              onClick={tracker.reset}
              title="Biykarlaw"
            >
              <X size={18} />
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
            <Play size={18} fill="#10251F" strokeWidth={0} />
            <span>{t.run.start}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
