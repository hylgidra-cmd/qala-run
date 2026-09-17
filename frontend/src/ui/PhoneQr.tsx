import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
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
        Phone link
      </button>
    );
  }

  return (
    <aside className="qr-card" aria-label="Open this demo on a phone">
      <div className="qr-head">
        <p className="eyebrow">OPEN ON YOUR PHONE</p>
        <button type="button" onClick={() => setOpen(false)} aria-label="Hide phone link">
          ×
        </button>
      </div>

      {reachable ? (
        <>
          {svg ? (
            <div className="qr-image" role="img" aria-label={`QR code for ${shareUrl}`}
              dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <p className="qr-hint">Preparing the code…</p>
          )}
          <p className="qr-url">{shareUrl}</p>
          <p className="qr-hint">
            Scan it, then press the locate button on the map. A phone has real GPS; this laptop
            does not.
          </p>
        </>
      ) : (
        <p className="qr-hint">
          This page is served on <strong>localhost</strong>, which a phone cannot open. Use the
          deployed address or an HTTPS tunnel, then this card shows a scannable code.
        </p>
      )}
    </aside>
  );
}
