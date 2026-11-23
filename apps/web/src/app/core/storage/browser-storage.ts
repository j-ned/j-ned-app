import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { injectIsBrowser } from '@core/ssr/inject-is-browser';

export type BrowserStorage = 'localStorage' | 'sessionStorage';

// Hôte nul : rendu serveur, où un stockage global serait partagé entre les requêtes.
export type StorageHost = Pick<Window, BrowserStorage> | null;

export const injectStorageHost = (): StorageHost =>
  injectIsBrowser() ? inject(DOCUMENT).defaultView : null;

// L'accès même au stockage lève quand le navigateur le refuse (navigation privée, quota, cookies bloqués).
export function readStored(host: StorageHost, kind: BrowserStorage, key: string): string | null {
  if (!host) return null;
  try {
    return host[kind].getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(
  host: StorageHost,
  kind: BrowserStorage,
  key: string,
  value: string,
): boolean {
  if (!host) return false;
  try {
    host[kind].setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStored(host: StorageHost, kind: BrowserStorage, key: string): boolean {
  if (!host) return false;
  try {
    host[kind].removeItem(key);
    return true;
  } catch {
    return false;
  }
}
