import { describeReason, formatArea, formatSpeed } from './format';
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
        <p className="run-note">
          No API on this address, so a run cannot be recorded. Capturing territory needs the
          backend from <code>docker compose</code>.
        </p>
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
              Release it
            </button>
          ) : null}
        </div>
      ) : null}

      {result ? (
        <div className={`run-result ${result.status}`} role="status">
          {result.status === 'accepted' ? (
            <>
              <p className="eyebrow">TERRITORY CAPTURED</p>
              <h2>{formatArea(result.awarded_area_m2)}</h2>
              <p className="run-meta">
                {result.activity?.type} · {formatSpeed(result.activity?.avg_speed_ms ?? null)}
              </p>
              {result.captured_from.length > 0 ? (
                <p className="run-meta">
                  Taken from {result.captured_from.map((owner) => owner.username).join(', ')}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="eyebrow">RUN REJECTED</p>
              <p>{describeReason(result.reason)}</p>
            </>
          )}
          <button type="button" onClick={tracker.reset}>
            Close
          </button>
        </div>
      ) : null}

      {phase === 'tracking' || phase === 'finishing' ? (
        <p className="run-note">
          {points.length} point{points.length === 1 ? '' : 's'} recorded. Walk back to where you
          started, then finish.
        </p>
      ) : null}

      {phase === 'idle' || phase === 'done' ? (
        <button
          className="run-button"
          type="button"
          onClick={() => void tracker.start()}
          disabled={phase === 'done' && result === null}
        >
          Start run
        </button>
      ) : (
        <button
          className="run-button stop"
          type="button"
          onClick={() => void tracker.finish()}
          disabled={phase !== 'tracking'}
        >
          {phase === 'finishing' ? 'Checking…' : 'Finish run'}
        </button>
      )}
    </div>
  );
}
