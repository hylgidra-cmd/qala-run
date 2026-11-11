import { useState } from 'react';
import { CheckCircle2, Clock, CreditCard, Crown, Gift, ShieldCheck, Sparkles, X } from 'lucide-react';
import { type SubscriptionInfo, activateSubscription } from '../profile/api';

interface SubscriptionModalProps {
  subscription?: SubscriptionInfo | null;
  onClose: () => void;
  onActivated: () => Promise<void> | void;
}

interface TariffPlan {
  id: string;
  days: number;
  title: string;
  priceUzs: number;
  badge?: string;
  subtitle: string;
}

const TARIFF_PLANS: TariffPlan[] = [
  {
    id: 'daily',
    days: 1,
    title: '1 Kúnlik Kirisiw',
    priceUzs: 5000,
    badge: 'Eń qolaylı',
    subtitle: '24 saat dawamında sheksiz juwırıw hám aymaq iyelew',
  },
  {
    id: 'weekly',
    days: 7,
    title: '7 Kúnlik Paket',
    priceUzs: 30000,
    badge: '-15% jeńillik',
    subtitle: 'Hár kúni 4 285 swmnan — háptelik klan hám jeke jarıslar ushın',
  },
  {
    id: 'monthly',
    days: 30,
    title: '30 Kúnlik PRO',
    priceUzs: 120000,
    badge: 'PRO',
    subtitle: 'Hár kúni 4 000 swmnan — tolıq ay dawamında maksimal ústinlik',
  },
];

const PAYMENT_PROVIDERS = [
  { id: 'click', label: 'CLICK Evolution', color: '#00aEEF' },
  { id: 'payme', label: 'Payme', color: '#00CCCC' },
  { id: 'uzum', label: 'Uzum Bank', color: '#7000FF' },
  { id: 'card', label: 'Uzcard / Humo', color: '#21D8A0' },
];

export function SubscriptionModal({
  subscription,
  onClose,
  onActivated,
}: SubscriptionModalProps) {
  const [selectedDays, setSelectedDays] = useState<number>(1);
  const [provider, setProvider] = useState<string>('click');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = subscription?.status ?? 'trial';
  const isActive = subscription?.is_active ?? true;
  const hoursLeft = subscription?.hours_left ?? 72;
  const daysLeft = subscription?.days_left ?? 3;

  const selectedPlan = TARIFF_PLANS.find((p) => p.days === selectedDays) ?? TARIFF_PLANS[0];

  const handleActivate = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await activateSubscription(selectedPlan.days, provider);
      await onActivated();
      setSuccessMsg(
        `Tabriklaymiz! ${selectedPlan.title} (${selectedPlan.priceUzs.toLocaleString()} swm) muvaffaqiyatli faollashtirildi!`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tólemde qátelik júz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Obuna hám 3 kúnlik biypul sınaw">
      <aside className="sub-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="sub-modal-head">
          <div className="sub-modal-title-row">
            <span className="sub-crown-badge">
              <Crown size={20} />
            </span>
            <div>
              <h2 className="sub-modal-title">Don&apos;t Stop Pass</h2>
              <p className="sub-modal-subtitle">3 kún biypul sınaw • Kúnine 5 000 swm</p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Jabıw">
            <X size={18} />
          </button>
        </div>

        {/* Current Status Banner */}
        <div className={`sub-status-banner ${isActive ? 'active' : 'expired'}`}>
          <div className="sub-status-icon">
            {status === 'trial' ? (
              <Gift size={22} />
            ) : isActive ? (
              <ShieldCheck size={22} />
            ) : (
              <Clock size={22} />
            )}
          </div>
          <div className="sub-status-info">
            {status === 'trial' && isActive ? (
              <>
                <strong>🎁 3 Kúnlik Biypul Sınaw Faol!</strong>
                <span>
                  Sizde jáne <b>{daysLeft} kún ({hoursLeft} saat)</b> biypul juwırıw waqtı bar.
                </span>
              </>
            ) : isActive ? (
              <>
                <strong>💎 Pullı Obuna Faol!</strong>
                <span>
                  Obuna múddeti: jáne <b>{daysLeft} kún ({hoursLeft} saat)</b> dawam etedi.
                </span>
              </>
            ) : (
              <>
                <strong>⚠️ 3 Kúnlik Biypul Sınaw Múddeti Tamamlandı</strong>
                <span>
                  Juwırıwdı dawam ettiriw hám aymaq iyelew ushın kúnlik obunanı faollastırıń (5 000 swm / kún).
                </span>
              </>
            )}
          </div>
        </div>

        {/* Tariff Selector */}
        <div className="sub-plans-grid">
          {TARIFF_PLANS.map((plan) => {
            const selected = plan.days === selectedDays;
            return (
              <button
                key={plan.id}
                type="button"
                className={`sub-plan-card ${selected ? 'selected' : ''}`}
                onClick={() => setSelectedDays(plan.days)}
              >
                <div className="sub-plan-top">
                  <span className="sub-plan-name">{plan.title}</span>
                  {plan.badge && <span className="sub-plan-badge">{plan.badge}</span>}
                </div>
                <div className="sub-plan-price">
                  <strong>{plan.priceUzs.toLocaleString()}</strong>
                  <span> swm</span>
                </div>
                <p className="sub-plan-desc">{plan.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Payment Method Selector */}
        <div className="sub-provider-section">
          <span className="sub-section-label">
            <CreditCard size={13} /> TÓLEM USILIN SAYLAŃ
          </span>
          <div className="sub-providers-row">
            {PAYMENT_PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`sub-provider-btn ${provider === p.id ? 'active' : ''}`}
                onClick={() => setProvider(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="auth-error">{error}</p>}
        {successMsg && (
          <div className="sub-success-banner">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <button
          type="button"
          className="sub-activate-btn"
          disabled={loading}
          onClick={() => void handleActivate()}
        >
          <Sparkles size={18} />
          <span>
            {loading
              ? 'Faollastırılmaqta...'
              : `${selectedPlan.title} — ${selectedPlan.priceUzs.toLocaleString()} swm tólew`}
          </span>
        </button>

        <p className="sub-footer-note">
          Hárbir jańa paydalanıwshıǵa dizimnen ótken waqıttan baslap 3 kún (72 saat) biypul beriledi. Onnan soń kúnine 5 000 swm.
        </p>
      </aside>
    </div>
  );
}
