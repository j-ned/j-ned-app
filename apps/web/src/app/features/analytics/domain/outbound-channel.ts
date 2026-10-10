import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import type { OutboundChannel } from './models/analytics.types';

const NON_DEMO_SUBDOMAINS: readonly string[] = ['www', 'api'];

function hostAndPath(url: URL): string {
  return `${url.host}${url.pathname.replace(/\/+$/, '')}`;
}

const PROFILE_CHANNELS: ReadonlyMap<string, OutboundChannel> = new Map([
  [hostAndPath(new URL(SITE_IDENTITY.socials.malt)), 'malt'],
  [hostAndPath(new URL(SITE_IDENTITY.socials.discord)), 'discord'],
  [hostAndPath(new URL(SITE_IDENTITY.socials.linkedin)), 'linkedin'],
  [hostAndPath(new URL(SITE_IDENTITY.socials.github)), 'github'],
]);

const GITHUB_REPOSITORIES = `${hostAndPath(new URL(SITE_IDENTITY.socials.github))}/`;

function parseAbsolute(href: string): URL | null {
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

function isDemoHost(host: string, siteHost: string): boolean {
  if (!host.endsWith(`.${siteHost}`)) return false;
  const subdomain = host.slice(0, -siteHost.length - 1);
  return !NON_DEMO_SUBDOMAINS.includes(subdomain);
}

export function outboundChannel(href: string, siteUrl: string): OutboundChannel | null {
  const url = parseAbsolute(href);
  if (!url) return null;
  if (url.protocol === 'mailto:') return 'email';
  if (url.protocol === 'tel:') return 'phone';

  const target = hostAndPath(url);
  const profile = PROFILE_CHANNELS.get(target);
  if (profile) return profile;

  // Un dépôt public montre un projet, comme une démo : seul le profil GitHub compte comme profil.
  if (target.startsWith(GITHUB_REPOSITORIES) || isDemoHost(url.host, new URL(siteUrl).host)) {
    return 'demo';
  }
  return null;
}
