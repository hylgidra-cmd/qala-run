import React from 'react';
import {
  Castle,
  Crown,
  Flame,
  Gem,
  Shield,
  Skull,
  Swords,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';

export interface EmblemDef {
  id: string;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
  color: string;
}

export const GUILD_EMBLEMS_LIST: EmblemDef[] = [
  { id: 'shield', name: 'Qalqon', shortName: 'Shield', icon: Shield, color: '#21D8A0' },
  { id: 'swords', name: 'Qilichlar', shortName: 'Swords', icon: Swords, color: '#FF3B30' },
  { id: 'crown', name: 'Toj', shortName: 'Crown', icon: Crown, color: '#FFB800' },
  { id: 'zap', name: 'Yashin', shortName: 'Lightning', icon: Zap, color: '#FFD60A' },
  { id: 'flame', name: 'Olov', shortName: 'Fire', icon: Flame, color: '#FF9500' },
  { id: 'trophy', name: 'Kubok', shortName: 'Trophy', icon: Trophy, color: '#E8B464' },
  { id: 'gem', name: 'Olmos', shortName: 'Gem', icon: Gem, color: '#00E5FF' },
  { id: 'target', name: 'Nishon', shortName: 'Target', icon: Target, color: '#FF2D55' },
  { id: 'castle', name: 'Qasr', shortName: 'Citadel', icon: Castle, color: '#AF52DE' },
  { id: 'skull', name: 'Boshsuyak', shortName: 'Skull', icon: Skull, color: '#E5E5EA' },
];

export function findEmblem(idOrEmoji?: string): EmblemDef {
  if (!idOrEmoji) return GUILD_EMBLEMS_LIST[0];

  const emojiMap: Record<string, string> = {
    '🛡️': 'shield',
    '⚔️': 'swords',
    '👑': 'crown',
    '⚡': 'zap',
    '🔥': 'flame',
    '🏆': 'trophy',
    '🦅': 'target',
    '🐺': 'skull',
    '🦁': 'castle',
    '🐉': 'gem',
  };

  const normalizedId = emojiMap[idOrEmoji] || idOrEmoji;
  return GUILD_EMBLEMS_LIST.find((e) => e.id === normalizedId) || GUILD_EMBLEMS_LIST[0];
}

export function getGuildEmblem(clanId?: string): string {
  if (!clanId) return 'shield';
  return localStorage.getItem(`dontstop.emblem.${clanId}`) || 'shield';
}

interface GuildEmblemProps {
  emblemId?: string;
  size?: number;
  showBadge?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function GuildEmblem({
  emblemId,
  size = 20,
  showBadge = true,
  className = '',
  style,
}: GuildEmblemProps) {
  const emblem = findEmblem(emblemId);
  const IconComponent = emblem.icon;

  if (!showBadge) {
    return <IconComponent size={size} color={emblem.color} className={className} />;
  }

  return (
    <div
      className={`guild-emblem-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size + 14}px`,
        height: `${size + 14}px`,
        borderRadius: '10px',
        background: `radial-gradient(circle, ${emblem.color}22 0%, rgba(10, 24, 18, 0.9) 100%)`,
        border: `1px solid ${emblem.color}66`,
        boxShadow: `0 2px 10px ${emblem.color}25, inset 0 0 8px ${emblem.color}15`,
        flexShrink: 0,
        ...style,
      }}
      title={emblem.name}
    >
      <IconComponent size={size} color={emblem.color} />
    </div>
  );
}

interface GuildEmblemPickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function GuildEmblemPicker({ selectedId, onSelect }: GuildEmblemPickerProps) {
  return (
    <div className="emblem-picker-grid">
      {GUILD_EMBLEMS_LIST.map((emb) => {
        const isSelected = selectedId === emb.id || findEmblem(selectedId).id === emb.id;
        const Icon = emb.icon;
        return (
          <button
            key={emb.id}
            type="button"
            className={`emblem-picker-btn ${isSelected ? 'active' : ''}`}
            onClick={() => onSelect(emb.id)}
            title={emb.name}
            style={
              isSelected
                ? {
                    borderColor: emb.color,
                    boxShadow: `0 0 16px ${emb.color}44`,
                    background: `rgba(16, 37, 31, 0.9)`,
                  }
                : {}
            }
          >
            <div
              className="emblem-icon-box"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: `radial-gradient(circle, ${emb.color}20 0%, transparent 80%)`,
              }}
            >
              <Icon size={20} color={emb.color} />
            </div>
            <span className="emblem-picker-label" style={isSelected ? { color: emb.color } : {}}>
              {emb.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
