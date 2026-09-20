import { type ChangeEvent, type FormEvent, useState } from 'react';
import { CITIES_LIST, DEFAULT_CITY_ID } from '../map/cities';
import { DefaultAvatar } from '../ui/DefaultAvatar';
import { useAuth } from './useAuth';

interface Props {
  onSuccess: () => void;
  onClose?: () => void;
}

type Tab = 'login' | 'register';

export function AuthPage({ onSuccess, onClose }: Props) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<Tab>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState(DEFAULT_CITY_ID);
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 2MB
    if (file.size > 2 * 1024 * 1024) {
      setError('Rasm kólemi 2MB dan kishi bolıwı kerek');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Compress if needed using canvas
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
    setLoading(true);

    try {
      if (tab === 'login') {
        await login(username.trim(), password);
      } else {
        await register(
          username.trim(),
          password,
          displayName.trim() || username.trim(),
          city,
          avatarData,
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
          <h1 className="auth-title">QalaRun</h1>
          <p className="auth-subtitle">Aymaqtı iyelew oyını</p>
        </div>

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
            Ro'yxatdan o'tiw
          </button>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={(e) => void handleSubmit(e)}>
          {tab === 'register' && (
            <div className="auth-avatar-section">
              <label className="auth-avatar-picker" title="Avatar rásmin qoyıw">
                {avatarData ? (
                  <img src={avatarData} alt="Avatar" className="auth-avatar-img" />
                ) : (
                  <DefaultAvatar size={68} />
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

          <div className="auth-field">
            <label htmlFor="auth-username">Foydalanuvchi nomi</label>
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

          {tab === 'register' && (
            <>
              <div className="auth-field">
                <label htmlFor="auth-displayname">Ko'rsatiladigan at (ixtiyoriy)</label>
                <input
                  id="auth-displayname"
                  type="text"
                  autoComplete="name"
                  placeholder="Ali Rahimov"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={24}
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
            </>
          )}

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
                : 'Ro\'yxatdan o\'tiw'}
          </button>
        </form>

        {tab === 'login' && (
          <p className="auth-hint">
            Akkauntingiz yo'qmi?{' '}
            <button
              type="button"
              className="auth-link"
              onClick={() => { setTab('register'); setError(''); }}
            >
              Ro'yxatdan o'tiw
            </button>
          </p>
        )}

        {tab === 'register' && (
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

