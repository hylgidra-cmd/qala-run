import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  ChevronDown,
  Flag,
  History,
  LogIn,
  MapPin,
  MessageSquare,
  Moon,
  Shield,
  ShieldAlert,
  Sun,
  User,
} from 'lucide-react';
import { AdminView } from './admin/AdminView';
import { AuthPage } from './auth/AuthPage';
import { useAuth } from './auth/useAuth';
import { ChatPanel } from './chat/ChatPanel';
import { HistoryModal } from './history/HistoryModal';
import { t } from './i18n/qq';
import { LeaderboardModal } from './leaderboard/LeaderboardModal';
import { MapView } from './map/MapView';
import { CITIES_LIST, DEFAULT_CITY_ID, getCity } from './map/cities';
import { type MapTheme } from './map/style';
import { InvasionToast } from './notifications/InvasionToast';
import { useNotifications } from './notifications/useNotifications';
import { ProfilePanel } from './profile/ProfilePanel';
import { RegisterModal } from './profile/RegisterModal';
import { initials } from './profile/identity';
import { useProfile } from './profile/useProfile';
import { formatArea, formatDistance } from './run/format';
import { RunPanel } from './run/RunPanel';
import { type TerritoryMode, useRunTracker } from './run/useRunTracker';
import { PhoneQr } from './ui/PhoneQr';

export function App() {
  const { isAuthenticated, logout } = useAuth();
  const profile = useProfile();
  const [activeCity, setActiveCity] = useState(DEFAULT_CITY_ID);
  const [mode, setMode] = useState<TerritoryMode>('solo');
  const [panelOpen, setPanelOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [clanPrompt, setClanPrompt] = useState(false);
  const [registerDismissed, setRegisterDismissed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === '#admin');
  const tracker = useRunTracker(mode);
  const [apiReachable, setApiReachable] = useState(true);
  const handleApiReachable = useCallback((reachable: boolean) => setApiReachable(reachable), []);
  const { notifications, dismiss: dismissNotifications } = useNotifications();
  const [theme, setTheme] = useState<MapTheme>(() => {
    const urlTheme = new URLSearchParams(window.location.search).get('theme');
    if (urlTheme === 'night' || urlTheme === 'day') return urlTheme;
    const saved = localStorage.getItem('dontstop.theme');
    return saved === 'night' ? 'night' : 'day';
  });

  const handleSetTheme = (newTheme: MapTheme) => {
    setTheme(newTheme);
    localStorage.setItem('dontstop.theme', newTheme);
  };

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
    if (!profile.me?.clan) {
      setClanPrompt(true);
      setPanelOpen(true);
      return;
    }

    setMode('clan');
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
    <main className="app-shell" data-theme={theme}>
      <header className="topbar">
        <div className="topbar-left">
          <a className="brand" href="/" aria-label={t.brand.home}>
            <span className="brand-mark" aria-hidden="true">DS</span>
            <div className="brand-titles">
              <span className="brand-title">QalaRun</span>
              <span className="brand-sub">DON'T STOP</span>
            </div>
          </a>

          {/* City switcher dropdown */}
          <div className="city-switcher">
            <MapPin size={13} className="city-icon" aria-hidden="true" />
            <select
              value={activeCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="topbar-city-select"
              aria-label={t.cities.label}
              title="Qalanı saylań"
            >
              {CITIES_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown size={11} className="city-chevron" aria-hidden="true" />
          </div>
        </div>

        <div className="mode-switch" aria-label={t.mode.label}>
          <button
            className={`mode-btn ${mode === 'solo' ? 'active' : ''}`}
            type="button"
            onClick={() => setMode('solo')}
            aria-pressed={mode === 'solo'}
          >
            <span className="mode-icon" aria-hidden="true">
              <User size={14} />
            </span>
            <span>{t.mode.solo}</span>
          </button>
          <button
            className={`mode-btn ${mode === 'clan' ? 'active' : ''}`}
            type="button"
            onClick={chooseClan}
            aria-pressed={mode === 'clan'}
          >
            <span className="mode-icon" aria-hidden="true">
              <Shield size={14} />
            </span>
            <span>{t.mode.clan}</span>
          </button>
        </div>

        <div className="topbar-actions">
          {/* Day / Night Theme Switch */}
          <div className="theme-toggle-pill" role="group" aria-label="Xarita vaqti rejimi">
            <button
              type="button"
              className={`theme-toggle-btn ${theme === 'day' ? 'active' : ''}`}
              onClick={() => handleSetTheme('day')}
              title="Kúndizgi rejim (Day)"
              aria-label="Kúndizgi rejim"
            >
              <Sun size={14} />
              <span className="theme-btn-label">Kúndiz</span>
            </button>
            <button
              type="button"
              className={`theme-toggle-btn ${theme === 'night' ? 'active' : ''}`}
              onClick={() => handleSetTheme('night')}
              title="Keshki rejim (Night)"
              aria-label="Keshki rejim"
            >
              <Moon size={14} />
              <span className="theme-btn-label">Keshki</span>
            </button>
          </div>

          {/* Action buttons: Reyting, Tariyx, Chat */}
          <button
            type="button"
            className={`topbar-nav-btn ${leaderboardOpen ? 'active' : ''}`}
            onClick={() => {
              setLeaderboardOpen((o) => !o);
              setHistoryOpen(false);
              setChatOpen(false);
            }}
            title="Reyting Jadvali"
            aria-label="Reyting"
          >
            <BarChart3 size={15} className="nav-btn-icon" />
            <span className="nav-btn-text">Reyting</span>
          </button>

          {isAuthenticated && (
            <button
              type="button"
              className={`topbar-nav-btn ${historyOpen ? 'active' : ''}`}
              onClick={() => {
                setHistoryOpen((o) => !o);
                setLeaderboardOpen(false);
                setChatOpen(false);
              }}
              title="Juwırıwlar Tariyxı"
              aria-label="Tariyx"
            >
              <History size={15} className="nav-btn-icon" />
              <span className="nav-btn-text">Tariyx</span>
            </button>
          )}

          <button
            type="button"
            className={`topbar-nav-btn ${chatOpen ? 'active' : ''}`}
            onClick={() => {
              setChatOpen((o) => !o);
              setLeaderboardOpen(false);
              setHistoryOpen(false);
            }}
            title="Chat"
            aria-label="Chat"
          >
            <MessageSquare size={15} className="nav-btn-icon" />
            <span className="nav-btn-text">Chat <span className="chat-unread-dot" aria-hidden="true">•</span></span>
          </button>

          <button
            type="button"
            className="admin-toggle-btn"
            onClick={() => {
              window.location.hash = '#admin';
              setIsAdmin(true);
            }}
            title="Admin Baqlaw Orayı"
          >
            <ShieldAlert size={13} className="inline-icon" /> Admin
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
                background: profile.me?.avatar_data ? 'transparent' : (profile.me?.color_hex || '#21D8A0'),
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
                <User size={16} />
              )}
            </button>
          ) : (
            <button
              className="login-topbar-btn"
              type="button"
              onClick={() => setAuthModalOpen(true)}
              title="Kirish / Ro'yxatdan o'tiw"
            >
              <LogIn size={13} /> Kirish
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
          theme={theme}
        />

        {tracker.phase === 'idle' && !tracker.result ? (
          <aside className="status-card compact" aria-label="Aymaq haqqında">
            <div className="status-card-header">
              <span className="status-badge">{currentCityObj.name} aymaǵı</span>
              <div className="status-indicator">
                <span className="status-dot" />
                <span>{apiReachable ? 'Online' : t.map.offline}</span>
              </div>
            </div>
            <h2 className="status-card-title">QalaRun</h2>
            <p className="status-card-lead">Júgirip, óz aymaǵıńdı keńeytiriń.</p>

            <div className="status-card-desc">
              <span className="status-sub-head">{t.map.headline}</span>
              <span className="status-sub-lead">{t.map.lead}</span>
            </div>

            <div className="status-quick-stats">
              <div className="quick-stat">
                <div className="quick-stat-top">
                  <Activity size={16} className="quick-stat-icon" aria-hidden="true" />
                  <strong className="stat-val">
                    {profile.me && profile.me.stats.runs_accepted > 0
                      ? formatDistance(profile.me.stats.runs_accepted * 1500)
                      : '12.4 km'}
                  </strong>
                </div>
                <span className="stat-label">Júgirgen qashıqlıq</span>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-top">
                  <Flag size={16} className="quick-stat-icon" aria-hidden="true" />
                  <strong className="stat-val">
                    {profile.me && profile.me.stats.solo_area_m2 > 0
                      ? formatArea(profile.me.stats.solo_area_m2)
                      : '2.8 km²'}
                  </strong>
                </div>
                <span className="stat-label">Basıp alınǵan aymaq</span>
              </div>
            </div>
          </aside>
        ) : null}

        <PhoneQr defaultOpen={false} />

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

        {leaderboardOpen && (
          <LeaderboardModal
            initialCity={activeCity}
            onClose={() => setLeaderboardOpen(false)}
          />
        )}

        {historyOpen && (
          <HistoryModal
            onClose={() => setHistoryOpen(false)}
          />
        )}

        {chatOpen && (
          <ChatPanel
            currentCityId={activeCity}
            cityName={currentCityObj.name}
            me={profile.me}
            onClose={() => setChatOpen(false)}
            onFlyToLocation={(_lat, _lon) => {
              // Smoothly fly or show location
            }}
          />
        )}

        <RunPanel tracker={tracker} apiReachable={apiReachable} />
      </section>
    </main>
  );
}

