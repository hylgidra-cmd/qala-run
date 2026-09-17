import { useCallback, useState } from 'react';
import { MapView } from './map/MapView';
import { RunPanel } from './run/RunPanel';
import { useRunTracker } from './run/useRunTracker';
import { PhoneQr } from './ui/PhoneQr';

export function App() {
  const tracker = useRunTracker();
  const [apiReachable, setApiReachable] = useState(true);
  const handleApiReachable = useCallback((reachable: boolean) => setApiReachable(reachable), []);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="QalaRun home">
          <span className="brand-mark" aria-hidden="true">Q</span>
          <span>QalaRun</span>
        </a>

        <div className="mode-switch" aria-label="Territory mode">
          <button className="active" type="button">Solo</button>
          <button type="button" disabled title="Clan mode arrives in Sprint 5">Clan</button>
        </div>

        <button className="profile-button" type="button" aria-label="Open profile">MD</button>
      </header>

      <section className="map-stage" aria-label="Nukus territory map">
        <MapView
          trackPoints={tracker.points}
          territoryRefreshKey={tracker.result?.territory_id ?? ''}
          onApiReachable={handleApiReachable}
        />

        {tracker.phase === 'idle' && !tracker.result ? (
          <aside className="status-card">
            <p className="eyebrow">NUKUS PILOT</p>
            <h1>Own your route.</h1>
            <p>Walk or run a closed loop to capture territory.</p>
            <div className="status-row">
              <span className="status-dot" />
              <span>{apiReachable ? 'Run flow ready' : 'Map only — no API here'}</span>
            </div>
          </aside>
        ) : null}

        <PhoneQr />

        <RunPanel tracker={tracker} apiReachable={apiReachable} />
      </section>
    </main>
  );
}
