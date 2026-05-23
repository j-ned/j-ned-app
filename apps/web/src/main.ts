import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

if (environment.sentry.dsn) {
  Sentry.init({
    dsn: environment.sentry.dsn,
    environment: environment.sentry.environment,
    release: environment.sentry.release,
    sendDefaultPii: false,
    integrations: [
      Sentry.browserTracingIntegration({
        enableInp: true,
        enableLongAnimationFrame: true,
      }),
      Sentry.httpClientIntegration({
        failedRequestStatusCodes: [[500, 599]],
      }),
      Sentry.replayIntegration({
        maskAllInputs: true,
        maskAllText: false,
        blockAllMedia: false,
        block: ['.sentry-block'],
        mask: ['[data-sensitive]'],
      }),
      Sentry.feedbackIntegration({
        autoInject: false,
        colorScheme: 'system',
        showBranding: false,
      }),
    ],
    tracesSampleRate: environment.production ? 0.1 : 1.0,
    tracePropagationTargets: [/^\//, /^https:\/\/api\.j-ned\.dev/],
    replaysSessionSampleRate: environment.production ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: ['ChunkLoadError', /ResizeObserver loop/, 'NG0911'],
    beforeSend(event) {
      const data = event.request?.data as Record<string, unknown> | undefined;
      if (data) {
        for (const key of ['password', 'newPassword', 'currentPassword', 'code', 'token', 'email']) {
          if (key in data) data[key] = '[Filtered]';
        }
      }
      if (event.request?.cookies) delete event.request.cookies;
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
