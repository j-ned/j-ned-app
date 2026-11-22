import { EnvironmentInjector, PLATFORM_ID, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { REFRESH_MIN_INTERVAL_MS, refreshWhenVisible } from './refresh-when-visible';

const START = Date.parse('2026-11-22T12:00:00.000Z');

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

function watch(
  platform: 'browser' | 'server' = 'browser',
  options?: { readonly minIntervalMs: number },
): {
  readonly refresh: ReturnType<typeof vi.fn>;
  readonly destroy: () => void;
} {
  TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });
  const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
  const refresh = vi.fn();
  injector.runInContext(() => refreshWhenVisible(refresh, options));
  return { refresh, destroy: () => injector.destroy() };
}

describe('refreshWhenVisible', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(START);
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(document, 'visibilityState');
  });

  it('Given a hidden tab When it becomes visible again Then the refresh runs once', () => {
    const { refresh } = watch();

    setVisibility('hidden');
    setVisibility('visible');

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('Given a visible tab When it is hidden Then nothing is refreshed', () => {
    const { refresh } = watch();

    setVisibility('hidden');

    expect(refresh).not.toHaveBeenCalled();
  });

  it('Given a refresh just made When the tab comes back again within the minimal interval Then no second refresh runs; after it, one does', () => {
    const { refresh } = watch();
    setVisibility('visible');

    vi.setSystemTime(START + REFRESH_MIN_INTERVAL_MS - 1);
    setVisibility('visible');
    const withinInterval = refresh.mock.calls.length;
    vi.setSystemTime(START + REFRESH_MIN_INTERVAL_MS);
    setVisibility('visible');

    expect([withinInterval, refresh.mock.calls.length]).toEqual([1, 2]);
  });

  it('Given the screen that asked is gone When the tab becomes visible Then nothing is refreshed', () => {
    const { refresh, destroy } = watch();

    destroy();
    setVisibility('visible');

    expect(refresh).not.toHaveBeenCalled();
  });

  it('Given a server render When the document fires a visibility change Then nothing is refreshed', () => {
    const { refresh } = watch('server');

    setVisibility('visible');

    expect(refresh).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'a longer interval', minIntervalMs: 15_000 },
    { label: 'the default interval', minIntervalMs: REFRESH_MIN_INTERVAL_MS },
  ])(
    'Given $label When the tab comes back just before it and then at it Then only the second return refreshes again',
    ({ minIntervalMs }) => {
      const { refresh } = watch('browser', { minIntervalMs });
      setVisibility('visible');

      vi.setSystemTime(START + minIntervalMs - 1);
      setVisibility('visible');
      const before = refresh.mock.calls.length;
      vi.setSystemTime(START + minIntervalMs);
      setVisibility('visible');

      expect([before, refresh.mock.calls.length]).toEqual([1, 2]);
    },
  );
});
