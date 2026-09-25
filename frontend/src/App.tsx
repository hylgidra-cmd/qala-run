import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  ChevronDown,
  Flag,
  Globe,
  History,
  LogIn,
  MapPin,
  Menu,
  MessageSquare,
  Shield,
  ShieldAlert,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { AdminView } from './admin/AdminView';
import { AuthPage } from './auth/AuthPage';
import { useAuth } from './auth/useAuth';
import { ChatPanel } from './chat/ChatPanel';
import { HistoryModal } from './history/HistoryModal';
import { t } from './i18n/qq';
import {
  SUPPORTED_LANGUAGES,
  getLanguage,
  setLanguage,
  subscribeLanguageChange,
  type LanguageCode,
} from './i18n';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clanPrompt, setClanPrompt] = useState(false);
  const [currentLang, setCurrentLang] = useState(getLanguage());

  useEffect(() => {
    return subscribeLanguageChange((lang) => setCurrentLang(lang));
  }, []);

  const [registerDismissed, setRegisterDismissed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === '#admin');
  const tracker = useRunTracker(mode);
  const [apiReachable, setApiReachable] = useState(true);
  const [friendToast, setFriendToast] = useState<string | null>(null);
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
              <span className="brand-title">DON'T STOP</span>
              <span className="brand-sub">TERRITORY CAPTURE</span>
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

          {/* Language Switcher */}
          <div className="lang-switcher">
            <Globe size={13} className="lang-icon" aria-hidden="true" style={{ color: '#21D8A0' }} />
            <select
              value={currentLang}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="topbar-lang-select"
              aria-label="Til"
              title="Tildi ózgertiw"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
            <ChevronDown size={11} className="city-chevron" aria-hidden="true" />
          </div>

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

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Menyu"
            title="Menyu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

        </div>
      </header>

      {/* Mobile Drawer Menu (Visible when hamburger button is clicked) */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">MENYU</span>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Yopish"
              >
                <X size={18} />
              </button>
            </div>

            <div className="drawer-section">
              <label className="drawer-label">QALA SAYLAW</label>
              <div className="city-switcher drawer-city">
                <MapPin size={15} className="city-icon" aria-hidden="true" />
                <select
                  value={activeCity}
                  onChange={(e) => {
                    handleCityChange(e.target.value);
                    setMobileMenuOpen(false);
                  }}
                  className="topbar-city-select"
                  aria-label={t.cities.label}
                >
                  {CITIES_LIST.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="city-chevron" aria-hidden="true" />
              </div>
            </div>

            <div className="drawer-section">
              <label className="drawer-label">TIL / LANGUAGE</label>
              <div className="lang-switcher drawer-city" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Globe size={15} className="lang-icon" aria-hidden="true" style={{ color: '#21D8A0' }} />
                <select
                  value={currentLang}
                  onChange={(e) => {
                    setLanguage(e.target.value as LanguageCode);
                  }}
                  className="topbar-lang-select"
                  style={{ flex: 1, fontSize: '0.88rem' }}
                  aria-label="Til"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="city-chevron" aria-hidden="true" />
              </div>
            </div>

            <div className="drawer-section">
              <label className="drawer-label">REJIM</label>
              <div className="mode-switch drawer-mode">
                <button
                  className={`mode-btn ${mode === 'solo' ? 'active' : ''}`}
                  type="button"
                  onClick={() => {
                    setMode('solo');
                    setMobileMenuOpen(false);
                  }}
                >
                  <User size={15} /> <span>{t.mode.solo}</span>
                </button>
                <button
                  className={`mode-btn ${mode === 'clan' ? 'active' : ''}`}
                  type="button"
                  onClick={() => {
                    chooseClan();
                    setMobileMenuOpen(false);
                  }}
                >
                  <Shield size={15} /> <span>{t.mode.clan}</span>
                </button>
              </div>
            </div>

            <div className="drawer-nav-list">
              <button
                type="button"
                className="drawer-nav-item"
                onClick={() => {
                  setLeaderboardOpen(true);
                  setMobileMenuOpen(false);
                }}
              >
                <BarChart3 size={16} /> <span>Reyting Jadvali</span>
              </button>

              {isAuthenticated && (
                <button
                  type="button"
                  className="drawer-nav-item"
                  onClick={() => {
                    setHistoryOpen(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  <History size={16} /> <span>Juwırıwlar Tariyxı</span>
                </button>
              )}

              <button
                type="button"
                className="drawer-nav-item highlight-chat"
                onClick={() => {
                  setChatOpen(true);
                  setMobileMenuOpen(false);
                }}
                style={{
                  background: 'rgba(33, 216, 160, 0.15)',
                  border: '1px solid #21D8A0',
                  color: '#21D8A0',
                  fontWeight: 800,
                }}
              >
                <MessageSquare size={16} /> <span>Chat (Global, Qala, Gildiya) 💬</span>
              </button>

              <button
                type="button"
                className="drawer-nav-item"
                onClick={() => {
                  window.location.hash = '#admin';
                  setIsAdmin(true);
                  setMobileMenuOpen(false);
                }}
              >
                <ShieldAlert size={16} /> <span>Admin Baqlaw Orayı</span>
              </button>

              {isAuthenticated ? (
                <button
                  type="button"
                  className="drawer-nav-item highlight"
                  onClick={() => {
                    setPanelOpen(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  <User size={16} /> <span>{profile.me?.display_name || 'Profil'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="drawer-nav-item highlight"
                  onClick={() => {
                    setAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogIn size={16} /> <span>Kirish / Ro'yxatdan o'tiw</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}


      <section className="map-stage" aria-label={t.map.label}>
        <MapView
          cityId={activeCity}
          currentUserId={profile.me?.user_id}
          mode={mode}
          trackPoints={tracker.points}
          territoryRefreshKey={tracker.result?.territory_id ?? ''}
          onApiReachable={handleApiReachable}
          theme={theme}
          onToggleTheme={() => handleSetTheme(theme === 'day' ? 'night' : 'day')}
          onSendFriendRequest={(runner) => setFriendToast(t.friends.received(runner.display_name))}
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
            <h2 className="status-card-title">Don't Stop</h2>
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
                      : '0 km'}
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
                      : '0 m²'}
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

        {friendToast && (
          <div className="friend-request-toast" role="alert">
            <div className="toast-content">
              <UserPlus size={18} className="toast-icon" />
              <span className="toast-message">{friendToast}</span>
              <button
                type="button"
                onClick={() => setFriendToast(null)}
                className="toast-close"
                aria-label="Jabıw"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

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

