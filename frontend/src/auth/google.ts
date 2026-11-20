/**
 * Google Identity Services, the only way a Google account gets into the game.
 *
 * Google shows its own account chooser and hands back a signed ID token. That
 * token is the proof the server checks; nothing typed into a form of ours can
 * stand in for it, which is what stops one player signing in as another by
 * naming their address.
 */

/** The OAuth web client id. Without it Google sign-in is switched off. */
export const GOOGLE_CLIENT_ID: string = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();

const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

export interface GoogleCredentialResponse {
  credential?: string;
}

export interface GoogleIdentityApi {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: 'popup';
    auto_select?: boolean;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: 'standard';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'continue_with';
      shape?: 'rectangular' | 'pill';
      width?: number;
      locale?: string;
    },
  ): void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdentityApi } };
  }
}

let loading: Promise<GoogleIdentityApi> | null = null;

/** Loads Google's script once and resolves with its sign-in API. */
export function loadGoogleIdentity(): Promise<GoogleIdentityApi> {
  const ready = window.google?.accounts?.id;
  if (ready) {
    return Promise.resolve(ready);
  }

  loading ??= new Promise<GoogleIdentityApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      const api = window.google?.accounts?.id;
      if (api) {
        resolve(api);
      } else {
        loading = null;
        reject(new Error('Google sign-in did not initialise'));
      }
    };
    script.onerror = () => {
      // Let a later attempt try again instead of caching the failure.
      loading = null;
      script.remove();
      reject(new Error('Google sign-in could not be loaded'));
    };
    document.head.appendChild(script);
  });

  return loading;
}

export interface IdTokenClaims {
  email: string;
  name: string;
}

/**
 * Reads the email and name out of an ID token so the form can greet the
 * player. For display only: it does not verify anything, and the server
 * never trusts what the client says the token contains.
 */
export function readIdTokenClaims(idToken: string): IdTokenClaims | null {
  const payload = idToken.split('.')[1];
  if (!payload) {
    return null;
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
    const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : '';

    if (!email) {
      return null;
    }
    return { email, name: typeof claims.name === 'string' ? claims.name.trim() : '' };
  } catch {
    return null;
  }
}
