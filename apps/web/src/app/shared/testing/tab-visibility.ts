// happy-dom ne change jamais `visibilityState` : le test le pose, puis annonce le changement.
export function showTab(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

export function forgetTabVisibility(): void {
  Reflect.deleteProperty(document, 'visibilityState');
}

export function returnToTab(): void {
  showTab('hidden');
  showTab('visible');
}
