import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withNavigationErrorHandler } from '@angular/router';
import { reloadOnStaleChunk } from './stale-chunk-reload';

const STALE_CHUNK_MESSAGES = [
  'Failed to fetch dynamically imported module: https://example.test/chunk-ABC.js',
  'error loading dynamically imported module: https://example.test/chunk-ABC.js',
  'Importing a module script failed.',
] as const;

describe('reloadOnStaleChunk', () => {
  let assign: ReturnType<typeof vi.spyOn>;

  const navigateToRouteFailingWith = async (error: unknown): Promise<void> => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: 'lazy', loadComponent: (): Promise<never> => Promise.reject(error) }],
          withNavigationErrorHandler(reloadOnStaleChunk),
        ),
      ],
    });
    await TestBed.inject(Router)
      .navigateByUrl('/lazy?from=home')
      .catch(() => undefined);
  };

  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-21T10:00:00Z'));
    assign = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it.each(STALE_CHUNK_MESSAGES)(
    'Given a lazy chunk removed by a deployment (%s) When the navigation fails Then the page is reloaded on the requested URL',
    async (message) => {
      await navigateToRouteFailingWith(new TypeError(message));

      expect(assign).toHaveBeenCalledTimes(1);
      expect(assign).toHaveBeenCalledWith('/lazy?from=home');
    },
  );

  it('Given a reload already made less than 30 s ago When the chunk still fails Then the page is not reloaded again', async () => {
    await navigateToRouteFailingWith(new TypeError(STALE_CHUNK_MESSAGES[0]));
    TestBed.resetTestingModule();
    vi.setSystemTime(new Date('2026-11-21T10:00:29Z'));

    await navigateToRouteFailingWith(new TypeError(STALE_CHUNK_MESSAGES[0]));

    expect(assign).toHaveBeenCalledTimes(1);
  });

  it('Given a reload made more than 30 s ago When a chunk fails again Then the page is reloaded', async () => {
    await navigateToRouteFailingWith(new TypeError(STALE_CHUNK_MESSAGES[0]));
    TestBed.resetTestingModule();
    vi.setSystemTime(new Date('2026-11-21T10:00:31Z'));

    await navigateToRouteFailingWith(new TypeError(STALE_CHUNK_MESSAGES[0]));

    expect(assign).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['another TypeError', new TypeError('x is not a function')],
    ['a non-TypeError with the same text', new Error(STALE_CHUNK_MESSAGES[0])],
    ['a thrown string', STALE_CHUNK_MESSAGES[0]],
  ])('Given %s When the navigation fails Then the page is not reloaded', async (_label, error) => {
    await navigateToRouteFailingWith(error);

    expect(assign).not.toHaveBeenCalled();
  });

  it('Given a browser that refuses sessionStorage When a chunk fails Then the page is not reloaded, since a loop could not be stopped', async () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });

    await navigateToRouteFailingWith(new TypeError(STALE_CHUNK_MESSAGES[0]));

    expect(assign).not.toHaveBeenCalled();
  });
});
