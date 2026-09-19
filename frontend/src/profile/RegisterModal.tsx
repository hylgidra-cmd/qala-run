import { useState } from 'react';
import type { Profile } from './useProfile';

const COLOR_PALETTE = [
  '#00ff88', // Neon Green
  '#00e5ff', // Cyan
  '#ff3b30', // Flame Red
  '#ffb800', // Cyber Gold
  '#af52de', // Neon Purple
  '#ff2d55', // Electric Pink
  '#30d158', // Vivid Green
  '#007aff', // Royal Blue
  '#ffd60a', // Bright Yellow
  '#c7ff4a', // Lime Green
];

interface RegisterModalProps {
  profile: Profile;
  onComplete: () => void;
}

export function RegisterModal({ profile, onComplete }: RegisterModalProps) {
  const defaultName =
    profile.me?.display_name && !profile.me.display_name.startsWith('Oyınshı ')
      ? profile.me.display_name
      : '';
  const [name, setName] = useState(defaultName);
  const [color, setColor] = useState(profile.me?.color_hex || COLOR_PALETTE[0]);
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
    if (trimmed.length < 2) {
      setError('Atıńız keminde 2 belgiden ibarat bolıwı kerek');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await profile.updateProfile({
        displayName: trimmed,
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
            Oyındı baslaw ushın óz atıńızdı kiritiń hám oyın reńińizdi saylań.
          </p>
        </div>

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
            <label>Oyın reńińiz (Kartada usı reń kórinedi)</label>
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
              <label className="custom-color-btn" style={{ borderColor: color }} title="Basqa reń">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="visually-hidden"
                />
                🎨
              </label>
            </div>
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
