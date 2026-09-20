import { type ChangeEvent, useEffect, useState } from 'react';
import { t } from '../i18n/qq';
import { CITIES_LIST, getCity } from '../map/cities';
import { formatArea } from '../run/format';
import { DefaultAvatar } from '../ui/DefaultAvatar';
import { ClanSection } from './ClanSection';
import { avatarHue, initials } from './identity';
import type { Profile } from './useProfile';

interface ProfilePanelProps {
  profile: Profile;
  onClose: () => void;
  onLogout?: () => void;
  /** True when the panel was opened by pressing Clan without a clan. */
  clanPrompt?: boolean;
}

export function ProfilePanel({ profile, onClose, onLogout, clanPrompt = false }: ProfilePanelProps) {
  const { me } = profile;
  const [name, setName] = useState(me?.display_name ?? '');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (me?.display_name) {
      setName(me.display_name);
    }
  }, [me?.display_name]);

  if (!profile.available || !me) {
    return (
      <div className="profile-modal-backdrop" onClick={onClose}>
        <div className="profile-modal-card" onClick={(e) => e.stopPropagation()} aria-label={t.profile.title}>
          <div className="sheet-head">
            <p className="eyebrow">{t.profile.title}</p>
            <button type="button" onClick={onClose} aria-label={t.profile.close}>
              ×
            </button>
          </div>
          <p className="sheet-note">
            {profile.available ? t.profile.loading : t.profile.unavailable}
          </p>
        </div>
      </div>
    );
  }

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        const data = canvas.toDataURL('image/jpeg', 0.85);
        void profile.updateProfile({ avatarData: data });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const trimmed = name.trim();

    if (trimmed.length < 2) {
      setNameError(t.profile.nameTooShort);
      return;
    }
    if (trimmed.length > 24) {
      setNameError(t.profile.nameTooLong);
      return;
    }

    setNameError(null);
    setSaving(true);

    try {
      await profile.rename(trimmed);
    } catch {
      setNameError(t.clan.errors.generic);
    } finally {
      setSaving(false);
    }
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(me.player_id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the id is on screen either way.
    }
  };

  const currentCity = getCity(me.city);

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal-card" onClick={(e) => e.stopPropagation()} aria-label={t.profile.title}>
        <div className="sheet-head">
          <p className="eyebrow">{t.profile.title}</p>
          <button type="button" onClick={onClose} aria-label={t.profile.close}>
            ×
          </button>
        </div>

        <div className="profile-identity">
          <label className="profile-avatar-wrapper" title="Avatardı ózgertiw">
            {me.avatar_data ? (
              <img
                src={me.avatar_data}
                alt="Avatar"
                className="profile-avatar-img"
                style={{ borderColor: me.color_hex || '#00ff88' }}
              />
            ) : (
              <div className="profile-avatar-fallback" style={{ borderColor: me.color_hex || '#00ff88' }}>
                <DefaultAvatar size={54} />
              </div>
            )}
            <span className="profile-avatar-edit-badge">📷</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
          </label>
          <div>
            <h2 className="profile-name">{me.display_name || 'Oyınshı'}</h2>
            <p className="profile-id">
              <span className="profile-id-label">{t.profile.playerId}</span>
              <strong>{me.player_id}</strong>
              <button type="button" className="link-button" onClick={() => void copyId()}>
                {copied ? t.profile.copied : t.profile.copy}
              </button>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <label className="field" style={{ flex: 1 }}>
            <span>{t.profile.name}</span>
            <div className="field-row">
              <input
                value={name}
                maxLength={24}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={nameError !== null}
              />
              <button type="button" onClick={() => void save()} disabled={saving}>
                {saving ? t.profile.saving : t.profile.save}
              </button>
            </div>
            {nameError ? <p className="field-error">{nameError}</p> : null}
          </label>

          <label className="field" style={{ width: '70px' }}>
            <span>Reń</span>
            <div className="field-row">
              <input
                type="color"
                value={me.color_hex || '#00ff88'}
                onChange={(e) => void profile.updateProfile({ colorHex: e.target.value })}
                title="Oyın reńin ózgertiw"
                style={{ height: '38px', padding: '2px', cursor: 'pointer', width: '100%' }}
              />
            </div>
          </label>
        </div>

        {/* City Selector */}
        <div className="field" style={{ marginTop: '8px' }}>
          <span>{t.cities.label}</span>
          <div className="field-row">
            <select
              value={me.city || 'nukus'}
              onChange={(e) => void profile.updateProfile({ city: e.target.value })}
              className="city-select-input"
            >
              {CITIES_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.flag} {c.name} ({c.country})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="profile-stats-grid">
          <div className="profile-stat-box">
            <span className="stat-label">{t.profile.runs}</span>
            <strong className="stat-val">{me.stats.runs_accepted}</strong>
          </div>
          <div className="profile-stat-box">
            <span className="stat-label">{t.profile.soloArea}</span>
            <strong className="stat-val">{formatArea(me.stats.solo_area_m2)}</strong>
          </div>
          <div className="profile-stat-box">
            <span className="stat-label">{t.profile.clanArea}</span>
            <strong className="stat-val">{formatArea(me.stats.clan_area_m2)}</strong>
          </div>
        </div>

        <div className="clan-divider" aria-hidden="true" />

        <ClanSection profile={profile} prompt={clanPrompt} />

        {onLogout && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={onLogout}
              className="danger-button"
              style={{ width: '100%', padding: '10px', fontSize: '0.9rem', borderRadius: '10px' }}
            >
              🚪 {t.profile.logout}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
