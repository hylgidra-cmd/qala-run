import { useCallback, useEffect, useState } from 'react';
import { AdminView } from './admin/AdminView';
import { AuthPage } from './auth/AuthPage';
import { useAuth } from './auth/useAuth';
import { t } from './i18n/qq';
import { MapView } from './map/MapView';
import { InvasionToast } from './notifications/InvasionToast';
import { useNotifications } from './notifications/useNotifications';
import { ProfilePanel } from './profile/ProfilePanel';
import { RegisterModal } from './profile/RegisterModal';
import { initials } from './profile/identity';
import { useProfile } from './profile/useProfile';
import { RunPanel } from './run/RunPanel';
import { type TerritoryMode, useRunTracker } from './run/useRunTracker';
import { PhoneQr } from './ui/PhoneQr';

export function App() {
  const { isAuthenticated, logout } = useAuth();
  const profile = useProfile();
  const [mode, setMode] = useState<TerritoryMode>('solo');
  const [panelOpen, setPanelOpen] = useState(false);
  const [clanPrompt, setClanPrompt] = useState(false);
  const [registerDismissed, setRegisterDismissed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === '#admin');
  const tracker = useRunTracker(mode);
  const [apiReachable, setApiReachable] = useState(true);
  const handleApiReachable = useCallback((reachable: boolean) => setApiReachable(reachable), []);
  const { notifications, dismiss: dismissNotifications } = useNotifications();

  // Show auth screen if not logged in
  if (!isAuthenticated) {
    return <AuthPage onSuccess={() => window.location.reload()} />;
  }

  const showRegister =
    !registerDismissed &&
    profile.me != null &&
    !localStorage.getItem('dontstop.registered') &&
    (profile.me.display_name.startsWith('Oyınshı ') || profile.me.display_name.startsWith('Runner '));

  const inClan = profile.me?.clan != null;

  // Leaving a clan takes the clan map with it.
  useEffect(() => {
    if (mode === 'clan' && profile.me && !inClan) {
      setMode('solo');
    }
  }, [mode, profile.me, inClan]);

  // A finished run changes the areas on the profile.
  useEffect(() => {
    if (tracker.result?.status === 'accepted') {
      void profile.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracker.result]);

  const chooseClan = () => {
    if (inClan) {
      setMode('clan');
      return;
    }

    setClanPrompt(true);
    setPanelOpen(true);
  };

  useEffect(() => {
    const onHash = () => setIsAdmin(window.location.hash === '#admin');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (isAdmin) {
    return (
      <AdminView
        onBack={() => {
          window.location.hash = '';
          setIsAdmin(false);
        }}
      />
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label={t.brand.home}>
          <span className="brand-mark" aria-hidden="true">DS</span>
          <span>{t.brand.name}</span>
        </a>

        <div className="mode-switch" aria-label={t.mode.label}>
          <button
            className={mode === 'solo' ? 'active' : ''}
            type="button"
            onClick={() => setMode('solo')}
            aria-pressed={mode === 'solo'}
          >
            {t.mode.solo}
          </button>
          <button
            className={mode === 'clan' ? 'active' : ''}
            type="button"
            onClick={chooseClan}
            aria-pressed={mode === 'clan'}
          >
            {t.mode.clan}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="admin-toggle-btn"
            onClick={() => {
              window.location.hash = '#admin';
              setIsAdmin(true);
            }}
            title="Admin Baqlaw Orayı"
          >
            Admin 🛡️
          </button>

          <button
            className="profile-button"
            type="button"
            aria-label={t.profile.open}
            onClick={() => {
              setClanPrompt(false);
              setPanelOpen((open) => !open);
            }}
          >
            {profile.me ? initials(profile.me.display_name) : '··'}
          </button>
        </div>
      </header>

      <section className="map-stage" aria-label={t.map.label}>
        <MapView
          mode={mode}
          trackPoints={tracker.points}
          territoryRefreshKey={tracker.result?.territory_id ?? ''}
          onApiReachable={handleApiReachable}
        />

        {tracker.phase === 'idle' && !tracker.result ? (
          <aside className="status-card">
            <p className="eyebrow">{t.map.eyebrow}</p>
            <h1>{t.map.headline}</h1>
            <p>{t.map.lead}</p>
            <div className="status-row">
              <span className="status-dot" />
              <span>{apiReachable ? t.map.ready : t.map.offline}</span>
            </div>
          </aside>
        ) : null}

        <PhoneQr />

        {showRegister && profile.me ? (
          <RegisterModal
            profile={profile}
            onComplete={() => setRegisterDismissed(true)}
          />
        ) : null}

        {panelOpen ? (
          <ProfilePanel
            profile={profile}
            clanPrompt={clanPrompt}
            onClose={() => setPanelOpen(false)}
            onLogout={() => {
              logout();
              setPanelOpen(false);
            }}
          />
        ) : null}

        <InvasionToast notifications={notifications} onDismiss={dismissNotifications} />

        <RunPanel tracker={tracker} apiReachable={apiReachable} />
      </section>
    </main>
  );
}
