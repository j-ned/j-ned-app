import { ErrorHandler, Injectable, REQUEST, inject } from '@angular/core';
import { injectSsrRequestContext } from '@core/ssr/ssr-request-context';

// Rendu serveur : l'erreur part par le rapporteur du serveur Node (journal du conteneur, puis Sentry
// nettoyé). Sans lui (prérendu, `ng serve`), seul le journal par défaut.
@Injectable()
export class ServerErrorHandler implements ErrorHandler {
  private readonly _reportError = injectSsrRequestContext()?.reportError ?? null;
  private readonly _request = inject(REQUEST, { optional: true });
  private readonly _fallback = new ErrorHandler();

  handleError(error: unknown): void {
    if (!this._reportError) {
      this._fallback.handleError(error);
      return;
    }
    this._reportError(error, {
      message: 'SSR render error:',
      request: { method: this._request?.method, url: this._request?.url },
    });
  }
}
