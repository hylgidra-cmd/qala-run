import { t } from '../i18n/qq';
import type { Notification } from './api';

interface Props {
  notifications: Notification[];
  onDismiss: () => void;
}

/**
 * Invasion toast — shown when someone has entered your territory.
 * Stacks multiple alerts into one banner to avoid notification spam.
 */
export function InvasionToast({ notifications, onDismiss }: Props) {
  if (notifications.length === 0) return null;

  return (
    <div className="invasion-toast" role="alert" aria-live="assertive">
      <div className="invasion-toast__content">
        <span className="invasion-toast__icon" aria-hidden="true">⚔️</span>
        <div className="invasion-toast__messages">
          {notifications.map((n) => {
            const invader = n.payload.invader ?? 'Belgisiz';
            const area = Math.round(n.payload.area_m2 ?? 0);
            return (
              <p key={n.id} className="invasion-toast__line">
                {t.notifications.territoryInvaded(invader, area)}
              </p>
            );
          })}
        </div>
        <button
          type="button"
          className="invasion-toast__close"
          onClick={onDismiss}
          aria-label={t.notifications.dismiss}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
