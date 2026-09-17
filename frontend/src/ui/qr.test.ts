import { describe, expect, it } from 'vitest';
import { isPhoneReachable, phoneShareUrl } from './qr';

describe('isPhoneReachable', () => {
  it('rejects localhost, which a phone cannot resolve', () => {
    expect(isPhoneReachable('http://localhost:5173/')).toBe(false);
    expect(isPhoneReachable('http://127.0.0.1:5173/')).toBe(false);
  });

  it('accepts a deployed host', () => {
    expect(isPhoneReachable('https://qalarun-web.onrender.com/')).toBe(true);
  });

  it('accepts a tunnel host', () => {
    expect(isPhoneReachable('https://heart-lately.trycloudflare.com/')).toBe(true);
  });

  it('accepts a LAN address', () => {
    expect(isPhoneReachable('http://192.168.1.13:5173/')).toBe(true);
  });
});

describe('phoneShareUrl', () => {
  it('keeps origin and path', () => {
    expect(phoneShareUrl('https://qalarun-web.onrender.com/run')).toBe(
      'https://qalarun-web.onrender.com/run',
    );
  });

  it('drops dev-only query parameters', () => {
    expect(phoneShareUrl('https://qalarun-web.onrender.com/?dev=1')).toBe(
      'https://qalarun-web.onrender.com/',
    );
  });

  it('drops the hash', () => {
    expect(phoneShareUrl('https://qalarun-web.onrender.com/#map')).toBe(
      'https://qalarun-web.onrender.com/',
    );
  });
});
