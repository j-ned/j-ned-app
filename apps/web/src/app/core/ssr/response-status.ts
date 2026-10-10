import { RESPONSE_INIT, inject } from '@angular/core';

// Le jeton est lu à la construction : les appelants (effect, loader de resource) marquent la page
// plus tard, hors contexte d'injection. Dans le navigateur, le marqueur ne fait rien.
export function injectMarkNotFound(): () => void {
  const responseInit = inject(RESPONSE_INIT, { optional: true });
  return () => {
    if (responseInit) responseInit.status = 404;
  };
}
