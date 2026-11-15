import { useEffect, useRef, useState } from 'react';

import { GOOGLE_CLIENT_ID, loadGoogleIdentity } from './google';

interface Props {
  /** Called with the signed ID token once Google has confirmed the account. */
  onCredential: (idToken: string) => void;
}

/**
 * Google's own button. It opens Google's account chooser, so the account the
 * player ends up with is one they are really signed in to.
 */
export function GoogleSignInButton({ onCredential }: Props) {
  const slot = useRef<HTMLDivElement>(null);
  const handler = useRef(onCredential);
  const [failed, setFailed] = useState(false);

  handler.current = onCredential;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      return;
    }

    let cancelled = false;

    loadGoogleIdentity()
      .then((google) => {
        if (cancelled || !slot.current) {
          return;
        }
        google.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: 'popup',
          auto_select: false,
          callback: (response) => {
            if (response.credential) {
              handler.current(response.credential);
            }
          },
        });
        google.renderButton(slot.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 300,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="auth-error" role="alert">
        Google orqali kirish hozircha sozlanmagan. Username va parol bilan kiring.
      </p>
    );
  }

  if (failed) {
    return (
      <p className="auth-error" role="alert">
        Google bilan bog&apos;lanib bo&apos;lmadi. Internetni tekshirib, sahifani yangilang.
      </p>
    );
  }

  return <div ref={slot} className="google-signin-slot" data-testid="google-signin-slot" />;
}
