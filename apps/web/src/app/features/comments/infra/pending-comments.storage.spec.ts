import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { makePendingComment } from '../testing/comment-builders';
import { PendingCommentsStorage } from './pending-comments.storage';

const KEY = 'comments:pending:v1:article-temoin';
const NOW = Date.parse('2026-11-22T12:00:00.000Z');

function storage(platform: 'browser' | 'server' = 'browser'): PendingCommentsStorage {
  TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });
  return TestBed.inject(PendingCommentsStorage);
}

describe('PendingCommentsStorage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    vi.useRealTimers();
  });

  it('Given comments written for an article When they are read back Then the same entries come back, under a versioned key of that article only', () => {
    const pending = [makePendingComment({ id: 'p-1' }), makePendingComment({ id: 'p-2' })];

    storage().write('article-temoin', pending);

    expect({
      read: TestBed.inject(PendingCommentsStorage).read('article-temoin'),
      other: TestBed.inject(PendingCommentsStorage).read('article-voisin'),
      keys: Object.keys(sessionStorage),
    }).toEqual({ read: pending, other: [], keys: [KEY] });
  });

  it('Given an entry that carries an e-mail When it is written Then only the name, the text, the parent, the date and the id are stored', () => {
    const entry = { ...makePendingComment(), email: 'lou@example.test' };

    storage().write('article-temoin', [entry]);

    expect(JSON.parse(sessionStorage.getItem(KEY) ?? 'null')).toEqual([makePendingComment()]);
  });

  it('Given nothing left to wait for When the list is written empty Then the key is removed', () => {
    sessionStorage.setItem(KEY, JSON.stringify([makePendingComment()]));

    storage().write('article-temoin', []);

    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it.each([
    { name: 'text that is not JSON', stored: '{oops' },
    { name: 'JSON of another shape', stored: '{"id":"p-1"}' },
  ])(
    'Given $name under the key When it is read Then nothing is pending and nothing throws',
    ({ stored }) => {
      sessionStorage.setItem(KEY, stored);

      expect(storage().read('article-temoin')).toEqual([]);
    },
  );

  it('Given a browser that refuses the storage When the comments are read and written Then nothing throws and nothing is pending', () => {
    sessionStorage.setItem(KEY, JSON.stringify([makePendingComment()]));
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const pendingStorage = storage();

    expect(() => pendingStorage.write('article-temoin', [makePendingComment()])).not.toThrow();
    expect(pendingStorage.read('article-temoin')).toEqual([]);
  });

  it('Given a server render When the comments are read and written Then the storage is never touched', () => {
    sessionStorage.setItem(KEY, JSON.stringify([makePendingComment()]));
    const access = vi.spyOn(window, 'sessionStorage', 'get');
    const pendingStorage = storage('server');

    pendingStorage.write('article-voisin', [makePendingComment()]);

    expect({
      read: pendingStorage.read('article-temoin'),
      accesses: access.mock.calls.length,
    }).toEqual({ read: [], accesses: 0 });
  });
});
