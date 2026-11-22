import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject } from '@angular/core';
import { injectIsBrowser } from '@core/ssr/inject-is-browser';

// Absorbe les retours en rafale (alt-tab répétés) : 30 relectures par minute au plus, sous le
// quota de 120 lectures publiques par minute et par visiteur de l'API.
export const REFRESH_MIN_INTERVAL_MS = 2_000;

// À appeler dans un contexte d'injection : l'écoute tombe avec l'écran qui l'a posée.
export function refreshWhenVisible(
  refresh: () => void,
  { minIntervalMs = REFRESH_MIN_INTERVAL_MS }: { readonly minIntervalMs?: number } = {},
): void {
  if (!injectIsBrowser()) return;
  const document = inject(DOCUMENT);
  let lastRefresh = Number.NEGATIVE_INFINITY;
  const onChange = (): void => {
    if (document.visibilityState !== 'visible') return;
    const now = Date.now();
    if (now - lastRefresh < minIntervalMs) return;
    lastRefresh = now;
    refresh();
  };
  document.addEventListener('visibilitychange', onChange);
  inject(DestroyRef).onDestroy(() => document.removeEventListener('visibilitychange', onChange));
}
