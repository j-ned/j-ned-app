import { ErrorHandler, Injectable, inject } from '@angular/core';
import type { ActivatedRouteSnapshot, Router } from '@angular/router';

export type MonitoringSdk = Pick<
  typeof import('@sentry/angular'),
  | 'createErrorHandler'
  | 'setUser'
  | 'TraceService'
  | 'getActiveSpan'
  | 'getRootSpan'
  | 'spanToJSON'
  | 'updateSpanName'
  | 'getCurrentScope'
>;

type MonitoredUser = { readonly id: string };

const MAX_PENDING_ERRORS = 20;

const toParameterizedRoute = (root: ActivatedRouteSnapshot): string => {
  const paths: string[] = [];
  let route = root.firstChild;
  while (route?.routeConfig?.path != null) {
    paths.push(route.routeConfig.path);
    route = route.firstChild;
  }
  const fullPath = paths.filter(Boolean).join('/');
  return fullPath ? `/${fullPath}/` : '/';
};

// SDK jamais importé statiquement : chargé seulement si un DSN est configuré.
@Injectable({ providedIn: 'root' })
export class Monitoring {
  private readonly _fallbackHandler = new ErrorHandler();
  private readonly _pendingErrors: unknown[] = [];
  private _sdk: MonitoringSdk | null = null;
  private _sdkHandler: ErrorHandler | null = null;
  private _user: MonitoredUser | null = null;

  attach(sdk: MonitoringSdk, router: Router): void {
    this._sdk = sdk;
    this._sdkHandler = sdk.createErrorHandler({ showDialog: false });
    new sdk.TraceService(router);
    this.nameOngoingPageload(sdk, router);
    sdk.setUser(this._user);
    this.replayPendingErrors(sdk);
  }

  setUser(user: MonitoredUser | null): void {
    this._user = user;
    this._sdk?.setUser(user);
  }

  handleError(error: unknown): void {
    if (this._sdkHandler) {
      this._sdkHandler.handleError(error);
      return;
    }
    this._fallbackHandler.handleError(error);
    if (this._pendingErrors.length < MAX_PENDING_ERRORS) this._pendingErrors.push(error);
  }

  // Le TraceService est créé après la première navigation : il n'a pas vu son ResolveEnd.
  private nameOngoingPageload(sdk: MonitoringSdk, router: Router): void {
    const activeSpan = sdk.getActiveSpan();
    if (!activeSpan) return;
    const rootSpan = sdk.getRootSpan(activeSpan);
    if (sdk.spanToJSON(rootSpan).op !== 'pageload') return;
    const route = toParameterizedRoute(router.routerState.snapshot.root);
    sdk.updateSpanName(rootSpan, route);
    sdk.getCurrentScope().setTransactionName(route);
  }

  // Déjà journalisées par le handler par défaut : le rejeu ne les relogue pas.
  private replayPendingErrors(sdk: MonitoringSdk): void {
    const replayHandler = sdk.createErrorHandler({ showDialog: false, logErrors: false });
    for (const error of this._pendingErrors.splice(0)) replayHandler.handleError(error);
  }
}

@Injectable()
export class MonitoringErrorHandler implements ErrorHandler {
  private readonly monitoring = inject(Monitoring);

  handleError(error: unknown): void {
    this.monitoring.handleError(error);
  }
}
