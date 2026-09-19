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

export function RunPanel({ tracker, apiReachable }: RunPanelProps) {
  const { phase, points, result, error } = tracker;

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

      {result ? (
        <div className={`run-result ${result.status}`} role="status">
          {result.status === 'accepted' ? (
            <>
              <p className="eyebrow">{t.run.captured}</p>
              <h2>{formatArea(result.awarded_area_m2)}</h2>
              <p className="run-meta">
                {describeActivity(result.activity?.type)} ·{' '}
                {formatSpeed(result.activity?.avg_speed_ms ?? null)}
              </p>
              {result.excluded_area_m2 ? (
                <p className="run-meta">
                  {t.run.excluded(formatArea(result.excluded_area_m2))}
                </p>
              ) : null}
              {result.warnings.includes('LOOP_CLOSED_BY_SERVER') ? (
                <p className="run-meta">
                  {t.run.closedGap(formatDistance(result.closing_gap_m))}
                </p>
              ) : null}
              {result.captured_from.length > 0 ? (
                <p className="run-meta">
                  {t.run.takenFrom(result.captured_from.map((owner) => owner.username).join(', '))}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="eyebrow">{t.run.rejected}</p>
              <p>{describeReason(result.reason)}</p>
            </>
          )}
          <button type="button" onClick={tracker.reset}>
            {t.run.close}
          </button>
        </div>
      ) : null}

      {phase === 'tracking' || phase === 'finishing' ? (
        <p className="run-note">{t.run.tracking(points.length)}</p>
      ) : null}

      {phase === 'idle' || phase === 'done' ? (
        <button
          className="run-button"
          type="button"
          onClick={() => void tracker.start()}
          disabled={phase === 'done' && result === null}
        >
          {t.run.start}
        </button>
      ) : (
        <button
          className="run-button stop"
          type="button"
          onClick={() => void tracker.finish()}
          disabled={phase !== 'tracking'}
        >
          {phase === 'finishing' ? t.run.checking : t.run.finish}
        </button>
      )}
    </div>
  );
}
