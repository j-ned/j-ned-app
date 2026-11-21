import { inject } from '@angular/core';
import { AuthStore } from './auth-store';
import { injectIsBrowser } from '@core/ssr/inject-is-browser';

export function initializeAuth(): () => Promise<void> | void {
  return (): Promise<void> | void => {
    if (!injectIsBrowser()) return;
    // Le store est entièrement construit ici : la requête peut traverser `authInterceptor`.
    const auth = inject(AuthStore);
    auth.restoreSession();
    return auth.ready;
  };
}
