import { useCallback, useEffect, useState } from 'react';
import { AdminView } from './admin/AdminView';
import { AuthPage } from './auth/AuthPage';
import { useAuth } from './auth/useAuth';
import { t } from './i18n/qq';
import { MapView } from './map/MapView';
import { CITIES_LIST, DEFAULT_CITY_ID, getCity } from './map/cities';
import { InvasionToast } from './notifications/InvasionToast';
import { useNotifications } from './notifications/useNotifications';
import { ProfilePanel } from './profile/ProfilePanel';
import { RegisterModal } from './profile/RegisterModal';
import { initials } from './profile/identity';
import { useProfile } from './profile/useProfile';
import { RunPanel } from './run/RunPanel';
import { type TerritoryMode, useRunTracker } from './run/useRunTracker';
import { DefaultAvatar } from './ui/DefaultAvatar';
import { PhoneQr } from './ui/PhoneQr';

export function App() {
  const { isAuthenticated, logout } = useAuth();
  const profile = useProfile();
  const [activeCity, setActiveCity] = useState(DEFAULT_CITY_ID);
  const [mode, setMode] = useState<TerritoryMode>('solo');
  const [panelOpen, setPanelOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [clanPrompt, setClanPrompt] = useState(false);
  const [registerDismissed, setRegisterDismissed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === '#admin');
  const tracker = useRunTracker(mode);
  const [apiReachable, setApiReachable] = useState(true);
  const handleApiReachable = useCallback((reachable: boolean) => setApiReachable(reachable), []);
  const { notifications, dismiss: dismissNotifications } = useNotifications();

  // Sync active city from player's profile if set
  useEffect(() => {
    if (profile.me?.city) {
      setActiveCity(profile.me.city);
    }
  }, [profile.me?.city]);

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

  const handleCityChange = (newCity: string) => {
    setActiveCity(newCity);
    if (profile.me) {
      void profile.updateProfile({ city: newCity });
    }
  };

  const currentCityObj = getCity(activeCity);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a className="brand" href="/" aria-label={t.brand.home}>
            <span className="brand-mark" aria-hidden="true">DS</span>
            <span>{t.brand.name}</span>
          </a>

          {/* City switcher dropdown */}
          <div className="city-switcher">
            <select
              value={activeCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="topbar-city-select"
              aria-label={t.cities.label}
              title="Qalanı saylań"
            >
              {CITIES_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

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

          {isAuthenticated ? (
            <button
              className="profile-button"
              type="button"
              aria-label={t.profile.open}
              onClick={() => {
                setClanPrompt(false);
                setPanelOpen((open) => !open);
              }}
              style={{
                background: profile.me?.avatar_data ? 'transparent' : (profile.me?.color_hex || '#00ff88'),
                padding: profile.me?.avatar_data ? 0 : undefined,
                overflow: 'hidden',
              }}
            >
              {profile.me?.avatar_data ? (
                <img
                  src={profile.me.avatar_data}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : profile.me ? (
                initials(profile.me.display_name)
              ) : (
                '··'
              )}
            </button>
          ) : (
            <button
              className="login-topbar-btn"
              type="button"
              onClick={() => setAuthModalOpen(true)}
              title="Kirish / Ro'yxatdan o'tiw"
            >
              Kirish ⚡
            </button>
          )}
        </div>
      </header>

      <section className="map-stage" aria-label={t.map.label}>
        <MapView
          cityId={activeCity}
          currentUserId={profile.me?.user_id}
          mode={mode}
          trackPoints={tracker.points}
          territoryRefreshKey={tracker.result?.territory_id ?? ''}
          onApiReachable={handleApiReachable}
        />

        {tracker.phase === 'idle' && !tracker.result ? (
          <aside className="status-card">
            <p className="eyebrow">{currentCityObj.name.toUpperCase()} AYMAǴI</p>
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

        {authModalOpen && (
          <AuthPage
            onSuccess={() => {
              setAuthModalOpen(false);
              window.location.reload();
            }}
            onClose={() => setAuthModalOpen(false)}
          />
        )}

        <InvasionToast notifications={notifications} onDismiss={dismissNotifications} />

        <RunPanel tracker={tracker} apiReachable={apiReachable} />
      </section>
    </main>
  );
}
