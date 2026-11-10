import { type ChangeEvent, type FormEvent, useState } from 'react';
import { CITIES_LIST, DEFAULT_CITY_ID } from '../map/cities';
import { DefaultAvatar } from '../ui/DefaultAvatar';
import { useAuth } from './useAuth';

interface Props {
  onSuccess: () => void;
  onClose?: () => void;
}

type Tab = 'login' | 'register' | 'google';

const COLOR_PALETTE = [
  '#00ff88',
  '#00e5ff',
  '#ff3b30',
  '#ffb800',
  '#af52de',
  '#ff2d55',
  '#c7ff4a',
];

const GMAIL_REGEX = /^[A-Za-z0-9._%+-]+@gmail\.com$/i;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function AuthPage({ onSuccess, onClose }: Props) {
  const { login, register, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState<Tab>('login');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState(DEFAULT_CITY_ID);
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Rasm kólemi 2MB dan kishi bolıwı kerek');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 200;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > MAX_DIM) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          }
        } else {
          if (h > MAX_DIM) {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        setAvatarData(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (tab === 'register' || tab === 'google') {
      const cleanEmail = email.trim().toLowerCase();
      if (!GMAIL_REGEX.test(cleanEmail)) {
        setError('Faqat @gmail.com pochta manzilini kiriting (masalan: ali@gmail.com)');
        return;
      }
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        await login(username.trim(), password);
      } else if (tab === 'google') {
        await loginWithGoogle({
          email: email.trim().toLowerCase(),
          display_name: displayName.trim(),
          city,
          color_hex: color,
          avatar_data: avatarData,
        });
      } else {
        await register(
          username.trim(),
          email.trim().toLowerCase(),
          password,
          displayName.trim() || username.trim(),
          city,
          avatarData,
          color,
        );
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        {onClose && (
          <button
            type="button"
            className="auth-close-btn"
            onClick={onClose}
            aria-label="Jabıw"
          >
            ×
          </button>
        )}

        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo-mark">🏃</span>
          <h1 className="auth-title">Don&apos;t Stop</h1>
          <p className="auth-subtitle">Aymaqtı iyelew oyını</p>
        </div>

        {/* Google Quick Auth Button */}
        {tab !== 'google' && (
          <>
            <button
              type="button"
              className="auth-google-btn"
              onClick={() => {
                setTab('google');
                setError('');
              }}
            >
              <GoogleIcon />
              <span>Google akkaunt orqali kirish</span>
            </button>

            <div className="auth-divider">
              <span>yoki</span>
            </div>
          </>
        )}

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={tab === 'login' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Kirish
          </button>
          <button
            type="button"
            className={tab === 'register' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => { setTab('register'); setError(''); }}
          >
            Ro&apos;yxatdan o&apos;tish
          </button>
          <button
            type="button"
            className={tab === 'google' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => { setTab('google'); setError(''); }}
          >
            Google
          </button>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={(e) => void handleSubmit(e)}>
          {(tab === 'register' || tab === 'google') && (
            <div className="auth-avatar-section">
              <label className="auth-avatar-picker" title="Avatar rásmin qoyıw">
                {avatarData ? (
                  <img src={avatarData} alt="Avatar" className="auth-avatar-img" />
                ) : (
                  <DefaultAvatar size={64} />
                )}
                <span className="auth-avatar-badge">📷</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </label>
              <span className="auth-avatar-hint">Avatar (ixtiyoriy)</span>
            </div>
          )}

          {tab === 'login' && (
            <div className="auth-field">
              <label htmlFor="auth-username">Username yoki Gmail manzili</label>
              <input
                id="auth-username"
                type="text"
                autoComplete="username"
                placeholder="mys_ali_99 yoki ali@gmail.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
              />
            </div>
          )}

          {tab === 'register' && (
            <div className="auth-field">
              <label htmlFor="auth-username">Foydalanuvchi nomi (Username)</label>
              <input
                id="auth-username"
                type="text"
                autoComplete="username"
                placeholder="mys_ali_99"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={32}
                pattern="[A-Za-z0-9_]+"
                title="Faqat harf, raqam va _ belgisi"
              />
            </div>
          )}

          {(tab === 'register' || tab === 'google') && (
            <>
              <div className="auth-field">
                <label htmlFor="auth-email">Gmail manzili (@gmail.com majburiy)</label>
                <input
                  id="auth-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="sizning.ismingiz@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="auth-displayname">Ko&apos;rsatiladigan ism</label>
                <input
                  id="auth-displayname"
                  type="text"
                  autoComplete="name"
                  placeholder="Ali Rahimov"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={24}
                  required={tab === 'google'}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="auth-city">Qala (Shahar)</label>
                <select
                  id="auth-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="auth-select"
                >
                  {CITIES_LIST.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.flag} {c.name} ({c.country})
                    </option>
                  ))}
                </select>
              </div>

              <div className="auth-field">
                <label>O&apos;yin rangi</label>
                <div className="register-color-palette">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-pill ${color.toLowerCase() === c.toLowerCase() ? 'selected' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {tab !== 'google' && (
            <div className="auth-field">
              <label htmlFor="auth-password">Parol</label>
              <input
                id="auth-password"
                type="password"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? 'Kuting…'
              : tab === 'login'
                ? 'Kirish'
                : tab === 'google'
                  ? 'Google bilan davom etish 🚀'
                  : "Ro'yxatdan o'tish 🚀"}
          </button>
        </form>

        {tab === 'login' && (
          <p className="auth-hint">
            Akkauntingiz yo&apos;qmi?{' '}
            <button
              type="button"
              className="auth-link"
              onClick={() => { setTab('register'); setError(''); }}
            >
              Ro&apos;yxatdan o&apos;tish
            </button>
          </p>
        )}

        {tab !== 'login' && (
          <p className="auth-hint">
            Akkauntingiz bormi?{' '}
            <button
              type="button"
              className="auth-link"
              onClick={() => { setTab('login'); setError(''); }}
            >
              Kirish
            </button>
          </p>
        )}
      </div>
    </div>
  );
}


