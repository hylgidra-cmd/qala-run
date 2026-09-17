import { MapView } from './map/MapView';
import { PhoneQr } from './ui/PhoneQr';

export function App() {
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
        <MapView />

        <aside className="status-card">
          <p className="eyebrow">NUKUS PILOT</p>
          <h1>Own your route.</h1>
          <p>Walk or run a closed loop to capture territory.</p>
          <div className="status-row">
            <span className="status-dot" />
            <span>Foundation ready</span>
          </div>
        </aside>

        <PhoneQr />

        <button className="run-button" type="button" disabled title="Run flow is implemented in Sprint 3">
          Start run
        </button>
      </section>
    </main>
  );
}
