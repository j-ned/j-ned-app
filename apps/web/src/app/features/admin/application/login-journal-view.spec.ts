import { makeLoginEvent } from '@features/auth/testing/login-event-builders';
import type { LoginEventKind } from '@features/auth/domain/models/login-event.model';
import {
  loginJournalPager,
  loginJournalSummary,
  toLoginJournalRows,
  type LoginJournalRow,
} from './login-journal-view';

const row = (overrides: Parameters<typeof makeLoginEvent>[0]): LoginJournalRow | undefined =>
  toLoginJournalRows([makeLoginEvent(overrides)], 'UTC')[0];

describe('toLoginJournalRows', () => {
  it.each<[LoginEventKind, string, string, boolean]>([
    ['password_accepted', 'Mot de passe', 'Accepté', false],
    ['password_rejected', 'Mot de passe', 'Refusé', true],
    ['two_factor_accepted', 'Code de double authentification', 'Accepté', false],
    ['two_factor_rejected', 'Code de double authentification', 'Refusé', true],
  ])(
    'Given a %s event When listed Then it reads as step "%s", outcome "%s"',
    (kind, step, outcome, rejected) => {
      expect(row({ kind })).toMatchObject({ step, outcome, rejected });
    },
  );

  it('Given a step the front does not know When listed Then it is named as unknown and not counted as rejected', () => {
    expect(row({ kind: 'unknown' })).toMatchObject({
      step: 'Étape inconnue',
      outcome: 'Résultat inconnu',
      rejected: false,
    });
  });

  it('Given a known browser, system and country When listed Then the origin names them, the country in French', () => {
    expect(row({ browser: 'Firefox 128.0', os: 'Linux x86_64', country: 'DE' })?.origin).toBe(
      'Firefox 128.0 · Linux x86_64 · Allemagne',
    );
  });

  it.each([
    [{ browser: null, os: null, country: 'FR' }, 'France'],
    [{ browser: 'Chrome 120.0.0.0', os: null, country: null }, 'Chrome 120.0.0.0'],
    [{ browser: null, os: null, country: null }, 'Origine inconnue'],
  ])('Given the partial origin %o When listed Then it reads "%s"', (origin, expected) => {
    expect(row(origin)?.origin).toBe(expected);
  });

  it.each<[LoginEventKind, string | null, string]>([
    ['password_rejected', null, 'Compte inconnu'],
    ['two_factor_rejected', null, 'Jeton de challenge invalide'],
    ['password_rejected', 'user-1', ''],
    ['password_accepted', 'user-1', ''],
  ])(
    'Given a %s event on the account %s When listed Then the note reads "%s"',
    (kind, userId, note) => {
      expect(row({ kind, userId })?.note).toBe(note);
    },
  );

  it.each([
    ['2026-11-19T18:42:00.000Z', 'UTC', '19 nov. 2026 à 18:42'],
    ['2026-11-19T18:42:00.000Z', 'Europe/Paris', '19 nov. 2026 à 19:42'],
    ['2026-12-01T07:05:00.000Z', 'UTC', '1er déc. 2026 à 07:05'],
  ])('Given an event at %s read in %s When listed Then it is dated "%s"', (createdAt, zone, at) => {
    expect(toLoginJournalRows([makeLoginEvent({ createdAt })], zone)[0]).toMatchObject({
      at,
      createdAt,
    });
  });

  it('Given several events When listed Then their order is kept as the API sent it', () => {
    const rows = toLoginJournalRows(
      [makeLoginEvent({ id: 'b' }), makeLoginEvent({ id: 'a' })],
      'UTC',
    );

    expect(rows.map(({ id }) => id)).toEqual(['b', 'a']);
  });
});

describe('loginJournalPager', () => {
  it.each([
    [0, 1, { pageCount: 1, label: 'Page 1 sur 1', hasNewer: false, hasOlder: false }],
    [25, 1, { pageCount: 1, label: 'Page 1 sur 1', hasNewer: false, hasOlder: false }],
    [26, 1, { pageCount: 2, label: 'Page 1 sur 2', hasNewer: false, hasOlder: true }],
    [60, 2, { pageCount: 3, label: 'Page 2 sur 3', hasNewer: true, hasOlder: true }],
    [60, 3, { pageCount: 3, label: 'Page 3 sur 3', hasNewer: true, hasOlder: false }],
  ])('Given %i events on page %i When paged Then %o', (total, page, expected) => {
    expect(loginJournalPager(total, page)).toEqual(expected);
  });
});

describe('loginJournalSummary', () => {
  it.each([
    [0, '0 étape sur les 90 derniers jours'],
    [1, '1 étape sur les 90 derniers jours'],
    [1234, '1 234 étapes sur les 90 derniers jours'],
  ])('Given %i events When summarised Then "%s"', (total, summary) => {
    expect(loginJournalSummary(total)).toBe(summary);
  });
});
