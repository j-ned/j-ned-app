import { REQUEST_CONTEXT, inject } from '@angular/core';
import type { ReportServerError } from './server-error-report';

export type SsrRequestContext = {
  readonly apiBaseUrl: string;
  readonly visitorForwardedFor: string | null;
  // Secret partagé avec l'API pour qu'elle croie l'IP transmise ; `null` sous `ng serve`.
  readonly ssrForwardSecret?: string | null;
  // Absent sous `ng serve` : les erreurs du rendu ne vont qu'à la console.
  readonly reportError?: ReportServerError;
};

function isSsrRequestContext(value: unknown): value is SsrRequestContext {
  if (typeof value !== 'object' || value === null) return false;
  const { apiBaseUrl, visitorForwardedFor, ssrForwardSecret, reportError } = value as Record<
    string,
    unknown
  >;
  return (
    typeof apiBaseUrl === 'string' &&
    URL.canParse(apiBaseUrl) &&
    (typeof visitorForwardedFor === 'string' || visitorForwardedFor === null) &&
    (ssrForwardSecret === undefined ||
      ssrForwardSecret === null ||
      typeof ssrForwardSecret === 'string') &&
    (reportError === undefined || typeof reportError === 'function')
  );
}

// REQUEST_CONTEXT est `unknown` : seul le serveur Node le fournit, absent au prérendu et dans le navigateur.
export function injectSsrRequestContext(): SsrRequestContext | null {
  const context = inject(REQUEST_CONTEXT, { optional: true });
  return isSsrRequestContext(context) ? context : null;
}
