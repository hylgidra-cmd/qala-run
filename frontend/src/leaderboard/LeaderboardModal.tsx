import { useEffect, useState } from 'react';
import { t } from '../i18n/qq';
import { CITIES_LIST, getCity } from '../map/cities';
import { getGuildEmblem } from '../profile/ClanSection';
import { formatArea } from '../run/format';
import { DefaultAvatar } from '../ui/DefaultAvatar';
import {
  type ClanStanding,
  type PlayerStanding,
  fetchClanLeaderboard,
  fetchPlayerLeaderboard,
} from '../profile/api';

interface LeaderboardModalProps {
  initialCity?: string;
  onClose: () => void;
}

export function LeaderboardModal({ initialCity = 'nukus', onClose }: LeaderboardModalProps) {
  const [tab, setTab] = useState<'solo' | 'clan'>('solo');
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [soloList, setSoloList] = useState<PlayerStanding[]>([]);
  const [clanList, setClanList] = useState<ClanStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    if (tab === 'solo') {
      fetchPlayerLeaderboard(selectedCity)
        .then((res) => {
          if (active) setSoloList(res);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      fetchClanLeaderboard()
        .then((res) => {
          if (active) setClanList(res);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [tab, selectedCity]);

  const currentCityObj = getCity(selectedCity);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="leaderboard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="leaderboard-head">
          <div className="leaderboard-title-row">
            <h2>🏆 Reyting Jadvali</h2>
            <button type="button" className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="leaderboard-tabs">
            <button
              type="button"
              className={`leaderboard-tab ${tab === 'solo' ? 'active' : ''}`}
              onClick={() => setTab('solo')}
            >
              🏃 {t.mode.solo}
            </button>
            <button
              type="button"
              className={`leaderboard-tab ${tab === 'clan' ? 'active' : ''}`}
              onClick={() => setTab('clan')}
            >
              🛡️ {t.mode.clan}
            </button>
          </div>

          {tab === 'solo' && (
            <div className="leaderboard-city-pills">
              {CITIES_LIST.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`city-pill ${selectedCity === c.id ? 'active' : ''}`}
                  onClick={() => setSelectedCity(c.id)}
                >
                  {c.flag} {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="leaderboard-body">
          {loading ? (
            <div className="leaderboard-loading">Júklenbekte... ⚡</div>
          ) : tab === 'solo' ? (
            soloList.length === 0 ? (
              <div className="leaderboard-empty">
                {currentCityObj.name} qalasında házirshe jer iyelegen oyınshılar joq. Birinshi bolıp iyeleń! 🏃‍♂️
              </div>
            ) : (
              <div className="leaderboard-list">
                {soloList.map((player, index) => {
                  const rankBadge =
                    index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                  return (
                    <div
                      key={player.user_id}
                      className={`leaderboard-item ${index < 3 ? `top-${index + 1}` : ''}`}
                    >
                      <div className="rank-col">{rankBadge}</div>
                      <div className="avatar-col">
                        {player.avatar_data ? (
                          <img src={player.avatar_data} alt="" className="player-avatar" />
                        ) : (
                          <DefaultAvatar size={36} />
                        )}
                      </div>
                      <div className="info-col">
                        <div className="player-name" style={{ color: player.color_hex || '#fff' }}>
                          {player.display_name}
                        </div>
                        <div className="player-sub">
                          <span>ID: {player.player_id}</span>
                          <span>•</span>
                          <span>{player.runs_count} juwırıw</span>
                        </div>
                      </div>
                      <div className="area-col">
                        <span className="area-val">{formatArea(player.total_area_m2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : clanList.length === 0 ? (
            <div className="leaderboard-empty">Házirshe gildiyalar joq.</div>
          ) : (
            <div className="leaderboard-list">
              {clanList.map((clan, index) => {
                const rankBadge =
                  index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                const emblem = getGuildEmblem(clan.id);
                return (
                  <div
                    key={clan.id}
                    className={`leaderboard-item ${index < 3 ? `top-${index + 1}` : ''}`}
                  >
                    <div className="rank-col">{rankBadge}</div>
                    <div
                      className="clan-tag-col"
                      style={{ borderColor: clan.color_hex, color: clan.color_hex, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>{emblem}</span>
                      <span>[{clan.tag}]</span>
                    </div>
                    <div className="info-col">
                      <div className="clan-name">{clan.name}</div>
                      <div className="clan-sub">👥 {clan.member_count}/10 aǵza</div>
                    </div>
                    <div className="area-col">
                      <span className="area-val">{formatArea(clan.area_m2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
