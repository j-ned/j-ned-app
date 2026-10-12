import { InjectionToken, isDevMode } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: (): never => {
    throw new Error('API_BASE_URL must be provided in app.config.ts');
  },
});

export const PUBLIC_API_ORIGIN = 'https://api.nedellec-julien.fr';
export const PUBLIC_API_BASE_URL = `${PUBLIC_API_ORIGIN}/api`;

// Base des URL que le visiteur suit (`href`) : le rendu serveur remplace API_BASE_URL par
// l'upstream interne (ADR-0024), jamais celle-ci.
export const API_LINK_BASE_URL = new InjectionToken<string>('API_LINK_BASE_URL', {
  providedIn: 'root',
  factory: (): string => (isDevMode() ? '/api' : PUBLIC_API_BASE_URL),
});

// Images servies par l'origine du site (relais nginx en prod, `proxy.conf.cjs` en dev), pas par `api.`.
export const STORAGE_BASE_PATH = '/api';
