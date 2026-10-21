import type { Route } from '@angular/router';
import { routes } from './app.routes';

const privacyRoute = (): Route | undefined =>
  routes.find((route) => route.path === 'confidentialite');

describe('privacy policy route', () => {
  it('describes what the site collects and ends on the reader’s rights, addressed with tu', () => {
    expect(privacyRoute()?.data?.['seo']?.description).toBe(
      "Ce que le site collecte et pourquoi\u00a0: formulaire de contact, mesure d'audience sans cookie, commentaires, suivi des erreurs, et tes droits.",
    );
  });
});
