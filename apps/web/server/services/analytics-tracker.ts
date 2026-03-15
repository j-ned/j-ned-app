import { createHash } from 'node:crypto';
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';

export function generateSessionHash(ip: string, userAgent: string, date: string): string {
  return createHash('sha256')
    .update(`${ip}:${userAgent}:${date}`)
    .digest('hex');
}

export function parseUserAgent(userAgent: string) {
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  return {
    browser: browser.name ?? 'Unknown',
    os: os.name ?? 'Unknown',
  };
}

export function getCountry(ip: string): string {
  const geo = geoip.lookup(ip);
  return geo?.country ?? 'Unknown';
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  );
}
