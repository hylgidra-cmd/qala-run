import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { t } from '../i18n/qq';
import { isPhoneReachable, phoneShareUrl } from './qr';

interface PhoneQrProps {
  /** Injectable for tests; defaults to the current page. */
  href?: string;
  defaultOpen?: boolean;
}

export function PhoneQr({ href, defaultOpen = true }: PhoneQrProps) {
  const current = href ?? window.location.href;
  const reachable = isPhoneReachable(current);
  const shareUrl = phoneShareUrl(current);
  const [svg, setSvg] = useState<string | null>(null);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!reachable) {
      setSvg(null);
      return;
    }

    let active = true;

    // toString('svg') keeps this canvas-free, so it renders identically in
    // the browser and under jsdom.
    QRCode.toString(shareUrl, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#08130e', light: '#ffffff' },
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
  }, [reachable, shareUrl]);

  if (!open) {
    return (
      <button
        className="qr-phone-btn"
        type="button"
        onClick={() => setOpen(true)}
        title="Telefonda ashıw"
        aria-label={t.qr.label}
      >
        <span className="qr-phone-icon" aria-hidden="true">📱</span>
        <span className="qr-phone-text">Telefonda ashıw</span>
      </button>
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
            <span className="qr-modal-icon">📱</span>
            <h3>Telefonda ashıw</h3>
          </div>
          <button
            type="button"
            className="close-btn"
            onClick={() => setOpen(false)}
            aria-label={t.qr.hide}
          >
            ✕
          </button>
        </div>

        <div className="qr-modal-body">
          {reachable ? (
            <>
              {svg ? (
                <div
                  className="qr-image"
                  role="img"
                  aria-label={`QR code for ${shareUrl}`}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              ) : (
                <p className="qr-hint">{t.qr.preparing}</p>
              )}
              <div className="qr-url-box">
                <p className="qr-url">{shareUrl}</p>
              </div>
              <p className="qr-hint">{t.qr.hint}</p>
            </>
          ) : (
            <p className="qr-hint">{t.qr.localhost}</p>
          )}
        </div>
      </aside>
    </div>
  );
}
