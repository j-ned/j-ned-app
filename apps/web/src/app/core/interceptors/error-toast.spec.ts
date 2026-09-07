import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ToastStore } from '@shared/ui/toast-store';
import { SKIP_ERROR_TOAST } from './skip-error-toast';
import { errorToastInterceptor } from './error-toast';

describe('errorToastInterceptor', () => {
  const add = vi.fn();
  let http: HttpClient;
  let httpController: HttpTestingController;

  beforeEach(() => {
    add.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorToastInterceptor])),
        provideHttpClientTesting(),
        { provide: ToastStore, useValue: { add } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
    TestBed.resetTestingModule();
  });

  const failWith = (status: number, url = '/api/anything', context?: HttpContext): void => {
    http.post(url, {}, context ? { context } : {}).subscribe({ error: () => undefined });
    httpController
      .expectOne(url)
      .flush(
        { message: 'type must be one of the following values' },
        { status, statusText: 'Bad Request' },
      );
  };

  it('surfaces a toast on a failing request', () => {
    failWith(400);
    expect(add).toHaveBeenCalledOnce();
  });

  // Le tracking analytics est fire-and-forget : une erreur y est un problème
  // d'exploitation, jamais un message destiné au visiteur d'une page publique.
  it('stays silent when the caller opted out', () => {
    failWith(400, '/api/analytics/track', new HttpContext().set(SKIP_ERROR_TOAST, true));
    expect(add).not.toHaveBeenCalled();
  });

  it('stays silent on a throttled tracking burst', () => {
    failWith(429, '/api/analytics/track', new HttpContext().set(SKIP_ERROR_TOAST, true));
    expect(add).not.toHaveBeenCalled();
  });
});
