import { useEffect, useState } from 'react';
import { describeActivity, formatArea, formatDistance, formatSpeed } from '../run/format';
import { type RunHistoryItem, fetchMyRuns } from '../profile/api';

interface HistoryModalProps {
  onClose: () => void;
}

export function HistoryModal({ onClose }: HistoryModalProps) {
  const [runs, setRuns] = useState<RunHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchMyRuns()
      .then((res) => {
        if (active) setRuns(res);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="history-head">
          <div className="history-title-row">
            <h2>📜 Juwırıwlar Tariyxı</h2>
            <button type="button" className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
          <p className="history-sub">Barlıq o'tkerilgen juwırıwlar hám nátiyjeler</p>
        </div>

        <div className="history-body">
          {loading ? (
            <div className="history-loading">Júklenbekte... ⚡</div>
          ) : runs.length === 0 ? (
            <div className="history-empty">
              Siz ele juwırmadıńız. Start túymesin basıp, birinshi aymaqtı iyeleń! 🏃‍♂️
            </div>
          ) : (
            <div className="history-list">
              {runs.map((r) => {
                const isAccepted = r.status === 'accepted';
                return (
                  <div key={r.id} className={`history-card ${isAccepted ? 'accepted' : 'rejected'}`}>
                    <div className="history-card-top">
                      <div className="history-date">
                        <span>🗓️ {formatDate(r.started_at)}</span>
                        <span className="history-mode-tag">[{r.mode.toUpperCase()}]</span>
                      </div>
                      <span className={`history-status-badge ${isAccepted ? 'badge-ok' : 'badge-fail'}`}>
                        {isAccepted ? '✅ Qabıllandı' : '❌ Qabıllanbadı'}
                      </span>
                    </div>

                    <div className="history-metrics">
                      {r.awarded_area_m2 ? (
                        <div className="history-metric">
                          <span className="m-label">Maydan</span>
                          <span className="m-val highlight">{formatArea(r.awarded_area_m2)}</span>
                        </div>
                      ) : null}

                      {r.distance_m ? (
                        <div className="history-metric">
                          <span className="m-label">Aralıq</span>
                          <span className="m-val">{formatDistance(r.distance_m)}</span>
                        </div>
                      ) : null}

                      {r.avg_speed_ms ? (
                        <div className="history-metric">
                          <span className="m-label">Tezlik</span>
                          <span className="m-val">{formatSpeed(r.avg_speed_ms)}</span>
                        </div>
                      ) : null}

                      {r.activity_type ? (
                        <div className="history-metric">
                          <span className="m-label">Házirgi</span>
                          <span className="m-val">{describeActivity(r.activity_type)}</span>
                        </div>
                      ) : null}
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

