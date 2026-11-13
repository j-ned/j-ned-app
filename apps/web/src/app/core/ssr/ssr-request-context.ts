import { REQUEST_CONTEXT, inject } from '@angular/core';

export type SsrRequestContext = {
  readonly apiBaseUrl: string;
  readonly visitorForwardedFor: string | null;
  /** Secret partagé avec l'API pour qu'elle croie l'IP transmise ; `null` sous `ng serve`. */
  readonly ssrForwardSecret?: string | null;
};

function isSsrRequestContext(value: unknown): value is SsrRequestContext {
  if (typeof value !== 'object' || value === null) return false;
  const { apiBaseUrl, visitorForwardedFor, ssrForwardSecret } = value as Record<string, unknown>;
  return (
    typeof apiBaseUrl === 'string' &&
    URL.canParse(apiBaseUrl) &&
    (typeof visitorForwardedFor === 'string' || visitorForwardedFor === null) &&
    (ssrForwardSecret === undefined ||
      ssrForwardSecret === null ||
      typeof ssrForwardSecret === 'string')
  );
}

// REQUEST_CONTEXT est `unknown` : seul le serveur Node le fournit, absent au prérendu et dans le navigateur.
export function injectSsrRequestContext(): SsrRequestContext | null {
  const context = inject(REQUEST_CONTEXT, { optional: true });
  return isSsrRequestContext(context) ? context : null;
}
