import { DOCUMENT, Location } from '@angular/common';
import { inject } from '@angular/core';
import type { NavigationError } from '@angular/router';
import { readStored, writeStored } from '@core/storage/browser-storage';

const STALE_CHUNK_MESSAGE =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;
const LAST_RELOAD_KEY = 'navigation:stale-chunk-reload';
const RELOAD_COOLDOWN_MS = 30_000;

const isStaleChunkError = (error: unknown): boolean =>
  error instanceof TypeError && STALE_CHUNK_MESSAGE.test(error.message);

// Stockage refusé par le navigateur : rien n'arrêterait une boucle de rechargement, on y renonce.
function claimReload(view: Window, now: number): boolean {
  const last = Number(readStored(view, 'sessionStorage', LAST_RELOAD_KEY));
  if (Number.isFinite(last) && last > 0 && now - last < RELOAD_COOLDOWN_MS) return false;
  return writeStored(view, 'sessionStorage', LAST_RELOAD_KEY, String(now));
}

export function reloadOnStaleChunk(event: NavigationError): void {
  const view = inject(DOCUMENT).defaultView;
  if (!view || !isStaleChunkError(event.error)) return;
  const url = inject(Location).prepareExternalUrl(event.url);
  if (claimReload(view, Date.now())) view.location.assign(url);
}
