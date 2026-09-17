/** Hostnames that only resolve on the machine serving the page. */
export const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];

/**
 * A phone can only open the link if the host is reachable from the phone.
 * A QR pointing at localhost scans fine and then fails on the phone, which is
 * worse than showing no QR at all.
 */
export function isPhoneReachable(href: string): boolean {
  const { hostname } = new URL(href);

  return !LOCAL_HOSTNAMES.includes(hostname.replace(/^\[|\]$/g, ''));
}

/** The address to encode: origin plus path, without dev-only query or hash. */
export function phoneShareUrl(href: string): string {
  const url = new URL(href);
  url.search = '';
  url.hash = '';

  return url.toString();
}
