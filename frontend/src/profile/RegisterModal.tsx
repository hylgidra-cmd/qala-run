import { useState } from 'react';
import { SpectrumColorPicker } from '../ui/SpectrumColorPicker';
import type { Profile } from './useProfile';

const GMAIL_REGEX = /^[A-Za-z0-9._%+-]+@gmail\.com$/i;

interface RegisterModalProps {
  profile: Profile;
  onComplete: () => void;
  onOpenAuth?: () => void;
}

export function RegisterModal({ profile, onComplete, onOpenAuth }: RegisterModalProps) {
  const defaultName =
    profile.me?.display_name && !profile.me.display_name.startsWith('Oyınshı ')
      ? profile.me.display_name
      : '';
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(profile.me?.email ?? '');
  const [color, setColor] = useState(profile.me?.color_hex || '#00ff88');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyId = async () => {
    if (!profile.me?.player_id) return;
    try {
      await navigator.clipboard.writeText(profile.me.player_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard refusal
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmed.length < 2) {
      setError('Atıńız keminde 2 belgiden ibarat bolıwı kerek');
      return;
    }

    if (!GMAIL_REGEX.test(trimmedEmail)) {
      setError('Faqat @gmail.com pochta manzilini kiriting (masalan: ali@gmail.com)');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await profile.updateProfile({
        displayName: trimmed,
        email: trimmedEmail,
        colorHex: color,
      });
      localStorage.setItem('dontstop.registered', 'true');
      onComplete();
    } catch {
      setError('Dizimnen ótiwde qátelik júz berdi. Qaytadan urınıp kóriń.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="register-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="reg-title">
      <div className="register-modal-card">
        <div className="register-modal-header">
          <div className="register-icon-badge" style={{ borderColor: color, boxShadow: `0 0 16px ${color}44` }}>
            🎮
          </div>
          <h2 id="reg-title">Qala Run-ǵa xosh keldińiz!</h2>
          <p className="register-subtitle">
            Oyındı baslaw ushın Google akkaunt yamasa Gmail manzilińiz benen dizimnen ótiń.
          </p>
        </div>

        {onOpenAuth ? (
          <>
            <button
              type="button"
              className="auth-google-btn"
              onClick={onOpenAuth}
              style={{ marginTop: '14px' }}
            >
              <span>🌐 Google akkaunt yamasa Parol orqali kirish</span>
            </button>
            <div className="auth-divider">
              <span>yoki tezkor ro&apos;yxatdan o&apos;tish</span>
            </div>
          </>
        ) : null}

        {profile.me ? (
          <div className="register-id-box">
            <span className="register-id-label">Siziń unikal ID:</span>
            <div className="register-id-row">
              <strong className="register-id-val">{profile.me.player_id}</strong>
              <button
                type="button"
                className="register-id-copy"
                onClick={copyId}
                title="Kóshirip alıw"
              >
                {copied ? '✓ Kóshirildi' : '📋 Kóshirip alıw'}
              </button>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="reg-name">Atıńız</label>
            <input
              id="reg-name"
              type="text"
              className="register-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Atıńızdı kiritiń (mısaly: Madiyar)"
              maxLength={24}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Gmail manzilińiz (@gmail.com shárt)</label>
            <input
              id="reg-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className="register-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Gmail kiritiń (mısaly: madiyar@gmail.com)"
              required
            />
          </div>

          <div className="form-group">
            <label>Oyın reńińiz (Spektrdan xohlagan reńdi saylań)</label>
            <SpectrumColorPicker value={color} onChange={setColor} />
          </div>

          {error ? <p className="register-error" role="alert">{error}</p> : null}

          <button
            type="submit"
            className="register-submit-btn"
            style={{ backgroundColor: color }}
            disabled={saving}
          >
            {saving ? 'Saqlanbaqta...' : 'Dizimnen ótiw & Baslaw 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}

