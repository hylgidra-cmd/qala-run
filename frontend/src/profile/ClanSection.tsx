import { useState } from 'react';
import { t } from '../i18n/qq';
import { formatArea } from '../run/format';
import { type Profile, clanErrorText } from './useProfile';

interface ClanSectionProps {
  profile: Profile;
  /** True when the player pressed Clan on the map without having one. */
  prompt?: boolean;
}

const DEFAULT_COLOR = '#c7ff4a';

/**
 * Create a clan, join one with a code, or manage the one you are in.
 *
 * A clan holds ten players (TZ section 23.2) and its ground is its own: it is
 * a second map over the same city, not a filter on the solo one.
 */
export function ClanSection({ profile, prompt = false }: ClanSectionProps) {
  const { clan } = profile;
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | 'leave' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async (kind: 'create' | 'join' | 'leave', action: () => Promise<void>) => {
    setError(null);
    setBusy(kind);

    try {
      await action();
    } catch (cause) {
      setError(clanErrorText(cause));
    } finally {
      setBusy(null);
    }
  };

  const copyCode = async () => {
    if (!clan?.invite_code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(clan.invite_code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // The code is on screen even when the clipboard is refused.
    }
  };

  if (clan) {
    return (
      <section className="clan-block" aria-label={t.clan.title}>
        <p className="eyebrow">{t.clan.title}</p>

        <div className="clan-identity">
          <span className="clan-tag" style={{ background: clan.color_hex }}>
            {clan.tag}
          </span>
          <div>
            <p className="clan-name">{clan.name}</p>
            <p className="clan-meta">
              {t.clan.members(clan.member_count)} · {formatArea(clan.area_m2)}
            </p>
          </div>
        </div>

        {clan.invite_code ? (
          <p className="clan-code">
            <span>{t.clan.inviteCode}</span>
            <strong>{clan.invite_code}</strong>
            <button type="button" className="link-button" onClick={() => void copyCode()}>
              {copied ? t.profile.copied : t.profile.copy}
            </button>
          </p>
        ) : null}

        <ul className="clan-members">
          {clan.members.map((member) => (
            <li key={member.user_id}>
              <span className="clan-member-name">{member.display_name}</span>
              <span className="clan-member-id">{member.player_id}</span>
              <span className="clan-member-role">{t.clan.roles[member.role] ?? member.role}</span>
            </li>
          ))}
        </ul>

        {error ? <p className="field-error">{error}</p> : null}

        <button
          type="button"
          className="danger-button"
          onClick={() => void run('leave', profile.leave)}
          disabled={busy !== null}
        >
          {busy === 'leave' ? t.clan.leaving : t.clan.leave}
        </button>
      </section>
    );
  }

  return (
    <section className="clan-block" aria-label={t.clan.title}>
      <p className="eyebrow">{t.clan.title}</p>
      <p className="sheet-note">{prompt ? t.mode.clanNeeded : t.clan.none}</p>

      <label className="field">
        <span>{t.clan.codeField}</span>
        <div className="field-row">
          <input
            value={code}
            maxLength={6}
            placeholder={t.clan.codeHint}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
          />
          <button
            type="button"
            onClick={() => void run('join', () => profile.join(code))}
            disabled={busy !== null || code.length !== 6}
          >
            {busy === 'join' ? t.clan.joining : t.clan.join}
          </button>
        </div>
      </label>

      <div className="clan-divider" aria-hidden="true" />

      <label className="field">
        <span>{t.clan.nameField}</span>
        <input value={name} maxLength={48} onChange={(event) => setName(event.target.value)} />
      </label>

      <div className="clan-create-row">
        <label className="field">
          <span>{t.clan.tagField}</span>
          <input
            value={tag}
            maxLength={5}
            placeholder={t.clan.tagHint}
            onChange={(event) => setTag(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          />
        </label>

        <label className="field">
          <span>{t.clan.colorField}</span>
          <input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            aria-label={t.clan.colorField}
          />
        </label>
      </div>

      {error ? <p className="field-error">{error}</p> : null}

      <button
        type="button"
        className="primary-button"
        onClick={() =>
          void run('create', () => profile.create({ name: name.trim(), tag, color_hex: color }))
        }
        disabled={busy !== null || name.trim().length < 3 || tag.length < 2}
      >
        {busy === 'create' ? t.clan.creating : t.clan.create}
      </button>
    </section>
  );
}
