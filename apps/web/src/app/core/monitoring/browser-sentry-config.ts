export type BrowserSentryConfig = {
  readonly dsn: string;
  readonly environment: string;
  readonly release?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// `/api/config` donne le DSN et l'environnement ; sa `release` est celle de l'image de l'API, ignorée
// au profit de celle du build du site. `null` : Sentry reste éteint.
export function toBrowserSentryConfig(
  raw: unknown,
  siteRelease: string,
): BrowserSentryConfig | null {
  if (!isRecord(raw) || !isRecord(raw['sentry'])) return null;
  const { dsn, environment } = raw['sentry'];
  if (typeof dsn !== 'string' || typeof environment !== 'string' || !dsn) return null;
  return { dsn, environment, ...(siteRelease && { release: siteRelease }) };
}
