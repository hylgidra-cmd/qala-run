import { type FormEvent, useState } from 'react';
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password, displayName.trim() || username.trim());
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
          <p className="auth-subtitle">Nókis — Aymaqtı iyelew</p>
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

