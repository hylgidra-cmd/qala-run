import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { t } from '../i18n/qq';
import { isPhoneReachable, phoneShareUrl } from './qr';

interface PhoneQrProps {
  /** Injectable for tests; defaults to the current page. */
  href?: string;
}

export function PhoneQr({ href }: PhoneQrProps) {
  const current = href ?? window.location.href;
  const reachable = isPhoneReachable(current);
  const shareUrl = phoneShareUrl(current);
  const [svg, setSvg] = useState<string | null>(null);
  const [open, setOpen] = useState(true);

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
      color: { dark: '#07130f', light: '#ffffff' },
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
      <button className="qr-reopen" type="button" onClick={() => setOpen(true)}>
        {t.qr.reopen}
      </button>
    );
  }

  return (
    <aside className="qr-card" aria-label={t.qr.label}>
      <div className="qr-head">
        <p className="eyebrow">{t.qr.title}</p>
        <button type="button" onClick={() => setOpen(false)} aria-label={t.qr.hide}>
          ×
        </button>
      </div>

      {reachable ? (
        <>
          {svg ? (
            <div className="qr-image" role="img" aria-label={`QR code for ${shareUrl}`}
              dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <p className="qr-hint">{t.qr.preparing}</p>
          )}
          <p className="qr-url">{shareUrl}</p>
          <p className="qr-hint">{t.qr.hint}</p>
        </>
      ) : (
        <p className="qr-hint">{t.qr.localhost}</p>
      )}
    </aside>
  );
}
