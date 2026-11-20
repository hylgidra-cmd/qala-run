import { afterEach, describe, expect, it, vi } from 'vitest';

import { googleAuthUser } from './api';
import { readIdTokenClaims } from './google';

function idToken(claims: Record<string, unknown>): string {
  const bytes = new TextEncoder().encode(JSON.stringify(claims));
  const base64 = btoa(String.fromCharCode(...bytes));
  const payload = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `header.${payload}.signature`;
}

describe('readIdTokenClaims', () => {
  it('reads the address and the name Google put in the token', () => {
    const token = idToken({ email: 'Runner@Gmail.com', name: 'Nókis Runner' });

    expect(readIdTokenClaims(token)).toEqual({ email: 'runner@gmail.com', name: 'Nókis Runner' });
  });

  it('gives up on something that is not a token', () => {
    expect(readIdTokenClaims('not-a-token')).toBeNull();
    expect(readIdTokenClaims('a.%%%.c')).toBeNull();
    expect(readIdTokenClaims(idToken({ name: 'No address' }))).toBeNull();
  });
});

describe('googleAuthUser', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('sends the ID token and never an address of its own', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          token: 'jwt',
          user_id: 'u1',
          player_id: '12345678',
          display_name: 'Shamol',
          email: 'runner@gmail.com',
          color_hex: '#13B585',
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const user = await googleAuthUser({ id_token: 'signed-token', display_name: 'Shamol' });

    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string) as Record<string, unknown>;
    expect(sent.id_token).toBe('signed-token');
    expect(sent).not.toHaveProperty('email');
    expect(sent).not.toHaveProperty('google_sub');
    expect(user.user_id).toBe('u1');
  });

  it('reports a refusal instead of inventing a local account', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Google tokeni yaroqsiz' }), { status: 401 }),
      ),
    );

    await expect(googleAuthUser({ id_token: 'bad' })).rejects.toThrow('Google tokeni yaroqsiz');
    expect(localStorage.getItem('dontstop.local_accounts')).toBeNull();
  });

  it('reports an unreachable or sleeping server instead of signing in offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(googleAuthUser({ id_token: 't' })).rejects.toThrow(/Server bilan/);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<!doctype html>', { status: 503 })),
    );
    await expect(googleAuthUser({ id_token: 't' })).rejects.toThrow(/Google orqali kirish/);
  });
});
