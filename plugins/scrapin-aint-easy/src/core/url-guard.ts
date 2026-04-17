/**
 * SSRF / dangerous-URL guard.
 *
 * Used by the crawler and webhook emitter to reject URLs that would let an
 * attacker reach metadata services (AWS IMDS), internal networks, or loopback
 * hosts. A sitemap hosted at a public domain can otherwise embed
 * `<loc>http://169.254.169.254/...</loc>` and steer our crawler into the
 * container's IAM credentials.
 */

const PRIVATE_IPV4_RANGES: Array<[number, number, number]> = [
  [10, 0, 8],        // 10.0.0.0/8
  [172, 16, 12],     // 172.16.0.0/12  (172.16-172.31)
  [192, 168, 16],    // 192.168.0.0/16
  [127, 0, 8],       // 127.0.0.0/8 — loopback
  [169, 254, 16],    // 169.254.0.0/16 — link-local / IMDS
  [100, 64, 10],     // 100.64.0.0/10 — CGNAT
  [0, 0, 8],         // 0.0.0.0/8
];

function ipv4InRange(ip: string, base: [number, number, number]): boolean {
  const parts = ip.split('.').map((s) => Number(s));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b, prefix] = base;
  if (prefix === 8) return parts[0] === a;
  if (prefix === 10) return parts[0] === a && (parts[1]! & 0xc0) === (b & 0xc0);
  if (prefix === 12) return parts[0] === a && (parts[1]! & 0xf0) === (b & 0xf0);
  if (prefix === 16) return parts[0] === a && parts[1] === b;
  return false;
}

function isIpv4Literal(host: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
}

function isIpv6Loopback(host: string): boolean {
  // ::1 with any bracket/zone variant
  const stripped = host.replace(/^\[|\]$/g, '').toLowerCase();
  return stripped === '::1' || stripped === '0:0:0:0:0:0:0:1';
}

function isPrivateIpv4(ip: string): boolean {
  return PRIVATE_IPV4_RANGES.some((r) => ipv4InRange(ip, r));
}

function isDisallowedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (isIpv6Loopback(h)) return true;
  if (isIpv4Literal(h) && isPrivateIpv4(h)) return true;
  return false;
}

/**
 * Returns true if the URL can be safely fetched by a crawler or emitted to as
 * a webhook: must be http(s), must resolve to a public-ish hostname, must not
 * be a loopback / RFC-1918 / IMDS target.
 *
 * This is DNS-unaware — a resolver-rebind attack can still move a public DNS
 * name onto a private IP at fetch time. Harden by pairing with fetch-time
 * DNS pinning if the threat model demands it.
 */
export function isSafeFetchUrl(raw: string, allowHttp = false): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:' && !(allowHttp && u.protocol === 'http:')) return false;
  if (!u.hostname) return false;
  if (isDisallowedHostname(u.hostname)) return false;
  return true;
}

/** Stricter variant — https only, used by webhook emitter. */
export function isPublicHttpsUrl(raw: string): boolean {
  return isSafeFetchUrl(raw, false);
}
