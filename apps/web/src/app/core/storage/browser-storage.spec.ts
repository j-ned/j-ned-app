import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  injectStorageHost,
  readStored,
  removeStored,
  writeStored,
  type BrowserStorage,
} from './browser-storage';

const KEY = 'test:browser-storage';
const KINDS: readonly BrowserStorage[] = ['localStorage', 'sessionStorage'];

const refusingHost = (): Pick<Window, BrowserStorage> => ({
  get localStorage(): Storage {
    throw new DOMException('denied', 'SecurityError');
  },
  get sessionStorage(): Storage {
    throw new DOMException('denied', 'SecurityError');
  },
});

const fullStorage = (): Storage => ({
  length: 0,
  clear: (): void => undefined,
  key: (): null => null,
  getItem: (): null => null,
  removeItem: (): void => undefined,
  setItem: (): void => {
    throw new DOMException('full', 'QuotaExceededError');
  },
});

describe('browser storage', () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it.each(KINDS)(
    'Given a value written in %s When it is read back Then it comes back, and only in that storage',
    (kind) => {
      const written = writeStored(window, kind, KEY, 'valeur');
      const other = kind === 'localStorage' ? 'sessionStorage' : 'localStorage';

      expect({
        written,
        read: readStored(window, kind, KEY),
        other: readStored(window, other, KEY),
      }).toEqual({ written: true, read: 'valeur', other: null });
    },
  );

  it.each(KINDS)(
    'Given a value stored in %s When it is removed Then it is no longer read',
    (kind) => {
      (kind === 'localStorage' ? localStorage : sessionStorage).setItem(KEY, 'valeur');

      const removed = removeStored(window, kind, KEY);

      expect({ removed, read: readStored(window, kind, KEY) }).toEqual({
        removed: true,
        read: null,
      });
    },
  );

  it.each(KINDS)(
    'Given a browser that refuses %s When it is read, written and removed Then nothing throws and every access reports its failure',
    (kind) => {
      const host = refusingHost();

      expect({
        read: readStored(host, kind, KEY),
        written: writeStored(host, kind, KEY, 'valeur'),
        removed: removeStored(host, kind, KEY),
      }).toEqual({ read: null, written: false, removed: false });
    },
  );

  it('Given a full storage When a value is written Then the write reports its failure without throwing', () => {
    const host = { localStorage: fullStorage(), sessionStorage: fullStorage() };

    expect(writeStored(host, 'localStorage', KEY, 'valeur')).toBe(false);
  });

  it('Given a server render When the storage is read, written and removed Then nothing is stored and every access reports its failure', () => {
    expect({
      read: readStored(null, 'localStorage', KEY),
      written: writeStored(null, 'localStorage', KEY, 'valeur'),
      removed: removeStored(null, 'localStorage', KEY),
      stored: localStorage.getItem(KEY),
    }).toEqual({ read: null, written: false, removed: false, stored: null });
  });

  it.each([
    { platform: 'browser', host: window },
    { platform: 'server', host: null },
  ])(
    'Given a $platform render When the storage host is injected Then the window is given to the browser only',
    ({ platform, host }) => {
      TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });

      expect(TestBed.runInInjectionContext(injectStorageHost)).toBe(host);
    },
  );
});
