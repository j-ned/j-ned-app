import type { Resource } from '@angular/core';

type LoadState = 'loading' | 'error' | 'empty' | 'ready';

// `value()` lève en état d'erreur : on ne lit la donnée (via `isEmpty`) qu'après `hasValue()`.
export function loadState(resource: Resource<unknown>, isEmpty: () => boolean): LoadState {
  if (resource.hasValue()) return isEmpty() ? 'empty' : 'ready';
  return resource.status() === 'error' ? 'error' : 'loading';
}
