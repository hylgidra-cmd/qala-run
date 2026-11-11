import { useEffect, useState } from 'react';
import { Download, Globe, Smartphone, X } from 'lucide-react';
import QRCode from 'qrcode';
import { t } from '../i18n/qq';
import { apkDownloadUrl, isPhoneReachable, phoneShareUrl } from './qr';

interface PhoneQrProps {
  /** Injectable for tests; defaults to the current page. */
  href?: string;
  defaultOpen?: boolean;
  initialMode?: 'apk' | 'web';
}

export function PhoneQr({ href, defaultOpen = true, initialMode = 'apk' }: PhoneQrProps) {
  const current = href ?? window.location.href;
  const reachable = isPhoneReachable(current);
  const shareUrl = phoneShareUrl(current);
  const apkUrl = apkDownloadUrl(current);
  const [tab, setTab] = useState<'apk' | 'web'>(initialMode);
  const [svg, setSvg] = useState<string | null>(null);
  const [open, setOpen] = useState(defaultOpen);

  const activeUrl = tab === 'apk' ? apkUrl : shareUrl;

  useEffect(() => {
    if (!reachable) {
      setSvg(null);
      return;
    }

    let active = true;

    // toString('svg') keeps this canvas-free, so it renders identically in
    // the browser and under jsdom.
    QRCode.toString(activeUrl, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#10251F', light: '#ffffff' },
    })
      .then((markup) => {
        if (active) {
          setSvg(markup);
        }
      })
      .catch(() => {
        if (active) {
          setSvg(null);
        }
      });

    return () => {
      active = false;
    };
  }, [reachable, activeUrl]);

  if (!open) {
    return (
      <div className="phone-qr-wrapper">
        <button
          className="qr-phone-btn"
          type="button"
          onClick={() => setOpen(true)}
          title="Telefonda ashıw"
          aria-label={t.qr.label}
        >
          <Smartphone size={16} className="qr-phone-icon" aria-hidden="true" />
          <span className="qr-phone-text">Telefonda ashıw (APK)</span>
        </button>
        <span className="phone-qr-slogan">Qaraqalpaqstan birge júgirdi.</span>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={() => setOpen(false)}>
      <aside
        className="qr-modal-card"
        onClick={(e) => e.stopPropagation()}
        aria-label={t.qr.label}
      >
        <div className="qr-modal-head">
          <div className="qr-modal-title">
            <Smartphone size={20} className="qr-modal-icon" />
            <h3>Telefonda ashıw</h3>
          </div>
          <button
            type="button"
            className="close-btn"
            onClick={() => setOpen(false)}
            aria-label={t.qr.hide}
          >
            <X size={18} />
          </button>
        </div>

        {reachable && (
          <div className="qr-tabs">
            <button
              type="button"
              className={`qr-tab ${tab === 'apk' ? 'active' : ''}`}
              onClick={() => setTab('apk')}
            >
              <Download size={15} />
              <span>Android APK</span>
            </button>
            <button
              type="button"
              className={`qr-tab ${tab === 'web' ? 'active' : ''}`}
              onClick={() => setTab('web')}
            >
              <Globe size={15} />
              <span>Veb-sayt</span>
            </button>
          </div>
        )}

        <div className="qr-modal-body">
          {reachable ? (
            <>
              {svg ? (
                <div
                  className="qr-image"
                  role="img"
                  aria-label={`QR code for ${activeUrl}`}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              ) : (
                <p className="qr-hint">{t.qr.preparing}</p>
              )}

              {tab === 'apk' ? (
                <div className="qr-apk-box">
                  <a
                    href={apkUrl}
                    download="dontstop.apk"
                    className="qr-apk-download-btn"
                  >
                    <Download size={16} />
                    <span>APK fayldı júklep alıw</span>
                  </a>
                  <p className="qr-hint">
                    Kameranı QR kodqa qaratıń yamasa túymeni basıp jańa APK versiyanı ornatıń.
                  </p>
                </div>
              ) : (
                <>
                  <div className="qr-url-box">
                    <p className="qr-url">{shareUrl}</p>
                  </div>
                  <p className="qr-hint">{t.qr.hint}</p>
                </>
              )}
            </>
          ) : (
            <p className="qr-hint">{t.qr.localhost}</p>
          )}
        </div>
      </aside>
    </div>
  );
}
