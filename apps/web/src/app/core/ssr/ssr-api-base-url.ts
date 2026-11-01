import type { Provider } from '@angular/core';
import { HTTP_TRANSFER_CACHE_ORIGIN_MAP } from '@angular/common/http';
import { API_BASE_URL, PUBLIC_API_BASE_URL, PUBLIC_API_ORIGIN } from '@shared/api/api-config';
import { injectSsrRequestContext } from './ssr-request-context';

// La clé du transfer cache est l'URL interne : sans ce mapping (origine à origine, chemin exclu),
// le navigateur, qui lit l'URL publique, referait chaque appel à l'hydratation.
export function provideSsrApiBaseUrl(): Provider[] {
  return [
    {
      provide: API_BASE_URL,
      useFactory: (): string => injectSsrRequestContext()?.apiBaseUrl ?? PUBLIC_API_BASE_URL,
    },
    {
      provide: HTTP_TRANSFER_CACHE_ORIGIN_MAP,
      useFactory: (): Record<string, string> => {
        const context = injectSsrRequestContext();
        return context ? { [new URL(context.apiBaseUrl).origin]: PUBLIC_API_ORIGIN } : {};
      },
    },
  ];
}
