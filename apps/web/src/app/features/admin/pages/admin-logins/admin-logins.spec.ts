import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { LoginEvent } from '@features/auth/domain/models/login-event.model';
import { makeLoginEvent } from '@features/auth/testing/login-event-builders';
import { API_BASE_URL } from '@shared/api/api-config';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { pressTestId } from '@shared/testing/press-test-id';
import { settleBounded } from '@shared/testing/settle';
import { forgetTabVisibility, returnToTab } from '@shared/testing/tab-visibility';
import { AdminLogins } from './admin-logins';

const pageUrl = (page: number): string => `/api/auth/login-events?page=${page}&limit=25`;

type Rendered = {
  readonly fixture: ComponentFixture<AdminLogins>;
  readonly host: HTMLElement;
  readonly http: HttpTestingController;
};

async function render(): Promise<Rendered> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: '/api' },
    ],
  });
  const fixture = TestBed.createComponent(AdminLogins);
  await settleBounded(fixture);
  return {
    fixture,
    host: fixture.nativeElement as HTMLElement,
    http: TestBed.inject(HttpTestingController),
  };
}

async function answer(
  { fixture, http }: Rendered,
  page: number,
  events: readonly LoginEvent[],
  total = events.length,
): Promise<void> {
  http.expectOne(pageUrl(page)).flush({ data: events, total, page, limit: 25 });
  await settleBounded(fixture);
}

// Ce qu'une aide technique lit : le texte sans les éléments masqués par `aria-hidden`.
function accessibleText(element: HTMLElement | null): string {
  const clone = element?.cloneNode(true) as HTMLElement | undefined;
  clone?.querySelectorAll('[aria-hidden="true"]').forEach((hidden) => hidden.remove());
  return (clone?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

const texts = (host: HTMLElement, testId: string): readonly string[] =>
  [...host.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`)].map((element) =>
    (element.textContent ?? '').replace(/\s+/g, ' ').trim(),
  );

describe('AdminLogins', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('Given the journal is still loading When the page opens Then a loading status is announced instead of rows', async () => {
    const rendered = await render();

    expect(byTestId(rendered.host, 'admin-logins-loading')?.getAttribute('role')).toBe('status');
    expect(byTestId(rendered.host, 'admin-logins-list')).toBeNull();

    await answer(rendered, 1, []);
  });

  it('Given an accepted and a rejected step When the journal loads Then each row reads its step, outcome and origin, newest first as sent', async () => {
    const rendered = await render();

    await answer(rendered, 1, [
      makeLoginEvent({ id: 'b', kind: 'two_factor_rejected', country: 'DE' }),
      makeLoginEvent({ id: 'a', kind: 'password_accepted', country: 'FR' }),
    ]);

    expect(texts(rendered.host, 'login-step')).toEqual([
      'Code de double authentification',
      'Mot de passe',
    ]);
    expect(texts(rendered.host, 'login-outcome')).toEqual(['Refusé', 'Accepté']);
    expect(texts(rendered.host, 'login-origin')).toEqual([
      'Firefox 128.0 · Linux x86_64 · Allemagne',
      'Firefox 128.0 · Linux x86_64 · France',
    ]);
  });

  it('Given a rejected password When the journal loads Then assistive technology reads the step and its outcome as two words', async () => {
    const rendered = await render();

    await answer(rendered, 1, [makeLoginEvent({ kind: 'password_rejected' })]);

    expect(accessibleText(byTestId(rendered.host, 'login-result'))).toBe('Mot de passe, Refusé');
  });

  it('Given an event dated in UTC When the journal loads Then its row carries the machine-readable instant', async () => {
    const rendered = await render();

    await answer(rendered, 1, [makeLoginEvent({ createdAt: '2026-11-19T18:42:00.000Z' })]);

    expect(byTestId(rendered.host, 'login-date')?.getAttribute('datetime')).toBe(
      '2026-11-19T18:42:00.000Z',
    );
  });

  it('Given a rejected password on an unknown account When the journal loads Then the row says so', async () => {
    const rendered = await render();

    await answer(rendered, 1, [makeLoginEvent({ kind: 'password_rejected', userId: null })]);

    expect(texts(rendered.host, 'login-note')).toEqual(['Compte inconnu']);
  });

  it('Given 41 steps in the journal When it loads Then the summary counts them over the retention period', async () => {
    const rendered = await render();

    await answer(rendered, 1, [makeLoginEvent()], 41);

    expect(testIdText(rendered.host, 'admin-logins-summary')).toBe(
      '41 étapes sur les 90 derniers jours',
    );
  });

  it('Given an empty journal When it loads Then an empty state explains it, without list nor pager', async () => {
    const rendered = await render();

    await answer(rendered, 1, []);

    expect(byTestId(rendered.host, 'empty-state')).not.toBeNull();
    expect(byTestId(rendered.host, 'admin-logins-list')).toBeNull();
    expect(byTestId(rendered.host, 'admin-logins-pager')).toBeNull();
  });

  it('Given the API fails When the journal loads Then an error is shown, and retrying asks for the page again', async () => {
    const rendered = await render();
    rendered.http
      .expectOne(pageUrl(1))
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    await settleBounded(rendered.fixture);

    expect(byTestId(rendered.host, 'load-error')).not.toBeNull();

    await pressTestId(rendered.fixture, 'load-error-retry');
    await answer(rendered, 1, [makeLoginEvent()]);

    expect(texts(rendered.host, 'login-step')).toEqual(['Mot de passe']);
  });

  it('Given a journal that fits one page When it loads Then no pager is shown', async () => {
    const rendered = await render();

    await answer(rendered, 1, [makeLoginEvent()], 25);

    expect(byTestId(rendered.host, 'admin-logins-pager')).toBeNull();
  });

  describe('pagination', () => {
    it('Given 60 steps When the first page loads Then the pager reads page 1 of 3 and only "older" is available', async () => {
      const rendered = await render();

      await answer(rendered, 1, [makeLoginEvent()], 60);

      expect(testIdText(rendered.host, 'admin-logins-page')).toBe('Page 1 sur 3');
      expect(byTestId(rendered.host, 'admin-logins-newer')?.getAttribute('aria-disabled')).toBe(
        'true',
      );
      expect(byTestId(rendered.host, 'admin-logins-older')?.getAttribute('aria-disabled')).toBe(
        null,
      );
    });

    it('Given the first page of 60 steps When "older" is pressed Then page 2 is requested and shown', async () => {
      const rendered = await render();
      await answer(rendered, 1, [makeLoginEvent({ id: 'recent' })], 60);

      await pressTestId(rendered.fixture, 'admin-logins-older');
      await answer(rendered, 2, [makeLoginEvent({ id: 'older', kind: 'password_rejected' })], 60);

      expect(testIdText(rendered.host, 'admin-logins-page')).toBe('Page 2 sur 3');
      expect(texts(rendered.host, 'login-outcome')).toEqual(['Refusé']);
    });

    it('Given "older" was pressed When page 2 is still loading Then the pager stays in place on page 2', async () => {
      const rendered = await render();
      await answer(rendered, 1, [makeLoginEvent()], 60);

      await pressTestId(rendered.fixture, 'admin-logins-older');

      expect(byTestId(rendered.host, 'admin-logins-loading')).not.toBeNull();
      expect(testIdText(rendered.host, 'admin-logins-page')).toBe('Page 2 sur 3');

      await answer(rendered, 2, [makeLoginEvent()], 60);
    });

    it('Given the last page When the unavailable "older" is pressed Then nothing is requested', async () => {
      const rendered = await render();
      await answer(rendered, 1, [makeLoginEvent()], 30);
      await pressTestId(rendered.fixture, 'admin-logins-older');
      await answer(rendered, 2, [makeLoginEvent()], 30);

      await pressTestId(rendered.fixture, 'admin-logins-older');

      rendered.http.expectNone(pageUrl(3));
      expect(testIdText(rendered.host, 'admin-logins-page')).toBe('Page 2 sur 2');
    });

    it('Given the nightly purge emptied the last page When it is opened Then the journal falls back to the new last page instead of claiming to be empty', async () => {
      const rendered = await render();
      await answer(rendered, 1, [makeLoginEvent()], 51);
      await pressTestId(rendered.fixture, 'admin-logins-older');
      await answer(rendered, 2, [makeLoginEvent()], 51);

      await pressTestId(rendered.fixture, 'admin-logins-older');
      await answer(rendered, 3, [], 50);
      await answer(rendered, 2, [makeLoginEvent({ id: 'last' })], 50);

      expect(byTestId(rendered.host, 'empty-state')).toBeNull();
      expect(testIdText(rendered.host, 'admin-logins-page')).toBe('Page 2 sur 2');
      expect(texts(rendered.host, 'login-step')).toEqual(['Mot de passe']);
    });

    it('Given a fallback to page 2 while a new step made page 3 exist again When "older" is pressed Then page 3 is requested again', async () => {
      const rendered = await render();
      await answer(rendered, 1, [makeLoginEvent()], 51);
      await pressTestId(rendered.fixture, 'admin-logins-older');
      await answer(rendered, 2, [makeLoginEvent()], 51);
      await pressTestId(rendered.fixture, 'admin-logins-older');
      await answer(rendered, 3, [], 50);
      await answer(rendered, 2, [makeLoginEvent()], 51);

      await pressTestId(rendered.fixture, 'admin-logins-older');
      await answer(rendered, 3, [makeLoginEvent({ id: 'oldest' })], 51);

      expect(testIdText(rendered.host, 'admin-logins-page')).toBe('Page 3 sur 3');
    });

    it('Given the first page When the unavailable "newer" is pressed Then nothing is requested', async () => {
      const rendered = await render();
      await answer(rendered, 1, [makeLoginEvent()], 60);

      await pressTestId(rendered.fixture, 'admin-logins-newer');

      rendered.http.expectNone(pageUrl(0));
      expect(testIdText(rendered.host, 'admin-logins-page')).toBe('Page 1 sur 3');
    });

    it('Given page 2 of 60 steps When "newer" is pressed Then page 1 is requested again', async () => {
      const rendered = await render();
      await answer(rendered, 1, [makeLoginEvent()], 60);
      await pressTestId(rendered.fixture, 'admin-logins-older');
      await answer(rendered, 2, [makeLoginEvent()], 60);

      await pressTestId(rendered.fixture, 'admin-logins-newer');
      await answer(rendered, 1, [makeLoginEvent()], 60);

      expect(testIdText(rendered.host, 'admin-logins-page')).toBe('Page 1 sur 3');
    });
  });

  it('Given the journal page When rendered Then it has a single h1 and a way back to the settings', async () => {
    const rendered = await render();
    await answer(rendered, 1, [makeLoginEvent()]);

    expect(rendered.host.querySelectorAll('h1')).toHaveLength(1);
    expect(testIdText(rendered.host, 'admin-page-title')).toBe('Journal des connexions');
    expect(byTestId(rendered.host, 'admin-breadcrumb-parent')?.getAttribute('href')).toBe(
      '/admin/settings',
    );
  });
});

describe('AdminLogins: relecture au retour sur l’onglet', () => {
  afterEach(() => {
    forgetTabVisibility();
    TestBed.inject(HttpTestingController).verify();
  });

  it('Given the journal on screen When a login happened elsewhere and the tab comes back Then the journal shows it, the rows staying meanwhile', async () => {
    const rendered = await render();
    await answer(rendered, 1, [makeLoginEvent({ id: 'a', kind: 'password_accepted' })]);

    returnToTab();
    await settleBounded(rendered.fixture);
    const during = texts(rendered.host, 'login-outcome');
    await answer(rendered, 1, [
      makeLoginEvent({ id: 'b', kind: 'password_rejected' }),
      makeLoginEvent({ id: 'a', kind: 'password_accepted' }),
    ]);

    expect({ during, after: texts(rendered.host, 'login-outcome') }).toEqual({
      during: ['Accepté'],
      after: ['Refusé', 'Accepté'],
    });
  });

  it('Given the journal on screen When the reread on return fails Then the rows stay, without an error', async () => {
    const rendered = await render();
    await answer(rendered, 1, [makeLoginEvent({ id: 'a', kind: 'password_accepted' })]);

    returnToTab();
    await settleBounded(rendered.fixture);
    rendered.http.expectOne(pageUrl(1)).flush(null, { status: 500, statusText: 'Server Error' });
    await settleBounded(rendered.fixture);

    expect({
      rows: texts(rendered.host, 'login-outcome'),
      error: byTestId(rendered.host, 'load-error'),
    }).toEqual({ rows: ['Accepté'], error: null });
  });
});
