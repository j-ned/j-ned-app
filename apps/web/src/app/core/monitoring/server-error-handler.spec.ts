import {
  ApplicationRef,
  Component,
  EnvironmentInjector,
  ErrorHandler,
  REQUEST,
  REQUEST_CONTEXT,
  createComponent,
  type Provider,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReportServerError } from '@core/ssr/server-error-report';
import { ServerErrorHandler } from './server-error-handler';

const API = 'http://api:3000/api';

@Component({
  selector: 'app-broken-article',
  template: `<h1>{{ title() }}</h1>`,
})
class BrokenArticle {
  protected title(): string {
    throw new TypeError('article.title is undefined');
  }
}

// Rendu planifié par l'application, comme sur le serveur : l'erreur va à l'ErrorHandler.
async function renderBrokenArticle(providers: Provider[]): Promise<void> {
  TestBed.configureTestingModule({
    providers: [{ provide: ErrorHandler, useClass: ServerErrorHandler }, ...providers],
    rethrowApplicationErrors: false,
  });
  const appRef = TestBed.inject(ApplicationRef);
  const article = createComponent(BrokenArticle, {
    environmentInjector: TestBed.inject(EnvironmentInjector),
  });
  appRef.attachView(article.hostView);
  await appRef.whenStable();
}

describe('ServerErrorHandler', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => consoleError.mockRestore());

  it('given a request served by the Node server, when a template throws during the render, then the error is reported with the request method and URL', async () => {
    const reportError = vi.fn<ReportServerError>();

    await renderBrokenArticle([
      {
        provide: REQUEST_CONTEXT,
        useValue: { apiBaseUrl: API, visitorForwardedFor: null, reportError },
      },
      {
        provide: REQUEST,
        useValue: new Request('https://nedellec-julien.fr/blog/article?token=t'),
      },
    ]);

    expect(reportError).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ message: 'article.title is undefined' }),
      {
        message: 'SSR render error:',
        request: { method: 'GET', url: 'https://nedellec-julien.fr/blog/article?token=t' },
      },
    );
  });

  it('given a render without reporter (prerender, ng serve), when a template throws, then the error is only logged', async () => {
    await renderBrokenArticle([]);

    expect(consoleError).toHaveBeenCalledWith(
      'ERROR',
      expect.objectContaining({ message: 'article.title is undefined' }),
    );
  });

  it('given a request context whose reporter is not a function, when read, then it is ignored and the error only logged', async () => {
    await renderBrokenArticle([
      {
        provide: REQUEST_CONTEXT,
        useValue: { apiBaseUrl: API, visitorForwardedFor: null, reportError: 'nope' },
      },
    ]);

    expect(consoleError).toHaveBeenCalledWith(
      'ERROR',
      expect.objectContaining({ message: 'article.title is undefined' }),
    );
  });
});
