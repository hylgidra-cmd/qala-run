import { useState } from 'react';
import { t } from '../i18n/qq';
import { formatArea } from '../run/format';
import { GuildEmblem, GuildEmblemPicker, getGuildEmblem } from './GuildEmblem';
import { type Profile, clanErrorText } from './useProfile';

interface ClanSectionProps {
  profile: Profile;
  /** True when the player pressed Clan on the map without having one. */
  prompt?: boolean;
}

const DEFAULT_COLOR = '#c7ff4a';

export { getGuildEmblem };

/**
 * Create a Gildiya (guild), join one with a code, or manage the one you are in.
 */
export function ClanSection({ profile, prompt = false }: ClanSectionProps) {
  const { clan } = profile;
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [emblem, setEmblem] = useState<string>('shield');
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

  const handleCreate = async () => {
    await run('create', async () => {
      await profile.create({ name: name.trim(), tag, color_hex: color });
      if (profile.clan?.id) {
        localStorage.setItem(`dontstop.emblem.${profile.clan.id}`, emblem);
      }
    });
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
    const currentEmblem = getGuildEmblem(clan.id);
    const roleBadges: Record<string, { icon: string; label: string }> = {
      owner: { icon: '👑', label: t.clan.roles.owner },
      officer: { icon: '⭐', label: t.clan.roles.officer },
      member: { icon: '🏃', label: t.clan.roles.member },
    };

    return (
      <section className="clan-block" aria-label={t.clan.title}>
        <p className="eyebrow">{t.clan.title}</p>

        <div className="clan-identity-card" style={{ borderColor: `${clan.color_hex}55` }}>
          <div className="clan-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GuildEmblem emblemId={currentEmblem} size={22} />
              <span className="clan-tag-badge" style={{ background: clan.color_hex }}>
                [{clan.tag}]
              </span>
            </div>
            <div className="clan-titles">
              <h3 className="clan-name">{clan.name}</h3>
              <p className="clan-meta">
                <span>👥 {t.clan.members(clan.member_count)}</span>
                <span>•</span>
                <span className="clan-area-badge">🗺️ {formatArea(clan.area_m2)}</span>
              </p>
            </div>
          </div>

          <div className="clan-member-progress-track">
            <div
              className="clan-member-progress-fill"
              style={{ width: `${(clan.member_count / 10) * 100}%`, backgroundColor: clan.color_hex }}
            />
          </div>
        </div>

        {clan.invite_code ? (
          <div className="clan-code-box">
            <div className="code-info">
              <span className="code-label">{t.clan.inviteCode}:</span>
              <strong className="code-val">{clan.invite_code}</strong>
            </div>
            <button type="button" className="code-copy-btn" onClick={() => void copyCode()}>
              {copied ? `✓ ${t.profile.copied}` : t.profile.copy}
            </button>
          </div>
        ) : null}

        <div className="clan-members-section">
          <p className="clan-section-label">AǴZALAR DIZIMI ({clan.member_count}/10)</p>
          <ul className="clan-members-list">
            {clan.members.map((member) => {
              const badge = roleBadges[member.role] ?? { icon: '🏃', label: member.role };
              return (
                <li key={member.user_id} className="clan-member-item">
                  <div className="member-info">
                    <span className="member-role-icon" title={badge.label}>{badge.icon}</span>
                    <span className="clan-member-name">{member.display_name}</span>
                    <span className="clan-member-id">{member.player_id}</span>
                  </div>

                  <span className={`member-role-tag ${member.role}`}>
                    {badge.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

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
      <div className="clan-none-banner">
        {prompt ? t.mode.clanNeeded : t.clan.none}
      </div>

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

      {/* Vector Guild Emblem Selector */}
      <div className="field" style={{ marginTop: '12px' }}>
        <span>{t.clan.emblemField}</span>
        <GuildEmblemPicker selectedId={emblem} onSelect={setEmblem} />
      </div>

      {error ? <p className="field-error">{error}</p> : null}

      <button
        type="button"
        className="primary-button"
        onClick={() => void handleCreate()}
        disabled={busy !== null || name.trim().length < 3 || tag.length < 2}
      >
        {busy === 'create' ? t.clan.creating : t.clan.create}
      </button>
    </section>
  );
}
