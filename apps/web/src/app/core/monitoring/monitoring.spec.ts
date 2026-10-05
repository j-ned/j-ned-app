import { Component, ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Monitoring, MonitoringErrorHandler, type MonitoringSdk } from './monitoring';

@Component({ selector: 'app-monitoring-stub', template: '' })
class Stub {}

type FakeSdk = MonitoringSdk & {
  readonly handled: unknown[];
  readonly tracedRouters: Router[];
  readonly renamed: string[];
  readonly transactionNames: string[];
};

function fakeSdk(activeSpanOp: string | null = null): FakeSdk {
  const handled: unknown[] = [];
  const tracedRouters: Router[] = [];
  const renamed: string[] = [];
  const transactionNames: string[] = [];
  const span = { op: activeSpanOp };
  return {
    handled,
    tracedRouters,
    renamed,
    transactionNames,
    setUser: vi.fn(),
    createErrorHandler: () => ({ handleError: (error: unknown) => handled.push(error) }),
    TraceService: class {
      constructor(router: Router) {
        tracedRouters.push(router);
      }
    },
    getActiveSpan: () => (activeSpanOp === null ? undefined : span),
    getRootSpan: (s: unknown) => s,
    spanToJSON: (s: { op: string | null }) => ({ op: s.op }),
    updateSpanName: (_: unknown, name: string) => renamed.push(name),
    getCurrentScope: () => ({ setTransactionName: (name: string) => transactionNames.push(name) }),
  } as unknown as FakeSdk;
}

describe('Monitoring', () => {
  let monitoring: Monitoring;
  let router: Router;
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'projects/:slug', component: Stub },
          { path: '', component: Stub },
        ]),
        { provide: ErrorHandler, useClass: MonitoringErrorHandler },
      ],
    });
    monitoring = TestBed.inject(Monitoring);
    router = TestBed.inject(Router);
  });

  afterEach(() => consoleError.mockRestore());

  it('given no SDK attached, when an error is handled, then it is logged to the console', () => {
    const error = new Error('boom');

    TestBed.inject(ErrorHandler).handleError(error);

    expect(consoleError).toHaveBeenCalledWith('ERROR', error);
  });

  it('given an attached SDK, when an error is handled, then the SDK error handler receives it', () => {
    const sdk = fakeSdk();
    monitoring.attach(sdk, router);
    const error = new Error('boom');

    TestBed.inject(ErrorHandler).handleError(error);

    expect(sdk.handled).toEqual([error]);
  });

  it('given errors handled before the SDK loads, when the SDK attaches, then they are replayed in order', () => {
    const first = new Error('first');
    const second = new Error('second');
    TestBed.inject(ErrorHandler).handleError(first);
    TestBed.inject(ErrorHandler).handleError(second);
    const sdk = fakeSdk();

    monitoring.attach(sdk, router);

    expect(sdk.handled).toEqual([first, second]);
  });

  it('given more than 20 errors before the SDK loads, when the SDK attaches, then only the first 20 are replayed', () => {
    const errors = Array.from({ length: 25 }, (_, i) => new Error(`e${i}`));
    for (const error of errors) TestBed.inject(ErrorHandler).handleError(error);
    const sdk = fakeSdk();

    monitoring.attach(sdk, router);

    expect(sdk.handled).toEqual(errors.slice(0, 20));
  });

  it('given errors already replayed, when a second error arrives, then earlier errors are not replayed again', () => {
    TestBed.inject(ErrorHandler).handleError(new Error('early'));
    const sdk = fakeSdk();
    monitoring.attach(sdk, router);
    const late = new Error('late');

    TestBed.inject(ErrorHandler).handleError(late);

    expect(sdk.handled).toHaveLength(2);
    expect(sdk.handled[1]).toBe(late);
  });

  it('given an attached SDK, then router tracing is started on the app router', () => {
    const sdk = fakeSdk();

    monitoring.attach(sdk, router);

    expect(sdk.tracedRouters).toEqual([router]);
  });

  it('given an ongoing pageload span, when the SDK attaches, then it is named after the parameterized route', async () => {
    await router.navigateByUrl('/projects/angular-portfolio');
    const sdk = fakeSdk('pageload');

    monitoring.attach(sdk, router);

    expect(sdk.renamed).toEqual(['/projects/:slug/']);
    expect(sdk.transactionNames).toEqual(['/projects/:slug/']);
  });

  it.each([null, 'navigation'])(
    'given an active span of op %s, when the SDK attaches, then no span is renamed',
    async (op) => {
      await router.navigateByUrl('/projects/angular-portfolio');
      const sdk = fakeSdk(op);

      monitoring.attach(sdk, router);

      expect(sdk.renamed).toEqual([]);
    },
  );

  it('given a user set before the SDK loads, when the SDK attaches, then the user is replayed', () => {
    const sdk = fakeSdk();
    monitoring.setUser({ id: 'u1' });

    monitoring.attach(sdk, router);

    expect(sdk.setUser).toHaveBeenCalledWith({ id: 'u1' });
  });

  it('given an attached SDK, when the user changes, then the SDK is updated', () => {
    const sdk = fakeSdk();
    monitoring.attach(sdk, router);

    monitoring.setUser(null);

    expect(sdk.setUser).toHaveBeenLastCalledWith(null);
  });
});
