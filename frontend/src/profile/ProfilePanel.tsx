import { useEffect, useState } from 'react';
import { t } from '../i18n/qq';
import { formatArea } from '../run/format';
import { ClanSection } from './ClanSection';
import { avatarHue, initials } from './identity';
import type { Profile } from './useProfile';

interface ProfilePanelProps {
  profile: Profile;
  onClose: () => void;
  /** True when the panel was opened by pressing Clan without a clan. */
  clanPrompt?: boolean;
}

export function ProfilePanel({ profile, onClose, clanPrompt = false }: ProfilePanelProps) {
  const { me } = profile;
  const [name, setName] = useState(me?.display_name ?? '');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => setName(me?.display_name ?? ''), [me?.display_name]);

  if (!profile.available || !me) {
    return (
      <aside className="sheet" aria-label={t.profile.title}>
        <div className="sheet-head">
          <p className="eyebrow">{t.profile.title}</p>
          <button type="button" onClick={onClose} aria-label={t.profile.close}>
            ×
          </button>
        </div>
        <p className="sheet-note">
          {profile.available ? t.profile.loading : t.profile.unavailable}
        </p>
      </aside>
    );
  }

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

  return (
    <aside className="sheet" aria-label={t.profile.title}>
      <div className="sheet-head">
        <p className="eyebrow">{t.profile.title}</p>
        <button type="button" onClick={onClose} aria-label={t.profile.close}>
          ×
        </button>
      </div>

      <div className="profile-identity">
        <span
          className="profile-avatar"
          style={{ background: `hsl(${avatarHue(me.player_id)} 70% 45%)` }}
          aria-hidden="true"
        >
          {initials(me.display_name)}
        </span>
        <div>
          <p className="profile-name">{me.display_name}</p>
          <p className="profile-id">
            <span className="profile-id-label">{t.profile.playerId}</span>
            <strong>{me.player_id}</strong>
            <button type="button" className="link-button" onClick={() => void copyId()}>
              {copied ? t.profile.copied : t.profile.copy}
            </button>
          </p>
        </div>
      </div>

      <label className="field">
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
      </label>
      {nameError ? <p className="field-error">{nameError}</p> : null}

      <ul className="stat-row">
        <li>
          <span>{t.profile.runs}</span>
          <strong>{me.stats.runs_accepted}</strong>
        </li>
        <li>
          <span>{t.profile.soloArea}</span>
          <strong>{formatArea(me.stats.solo_area_m2)}</strong>
        </li>
        <li>
          <span>{t.profile.clanArea}</span>
          <strong>{formatArea(me.stats.clan_area_m2)}</strong>
        </li>
      </ul>

      <ClanSection profile={profile} prompt={clanPrompt} />
    </aside>
  );
}
