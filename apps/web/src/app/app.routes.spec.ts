import { STATIC_HERO } from '@features/home/infra/data/home.static-data';
import { routes } from './app.routes';

type HomeSeo = { readonly structuredData: { readonly name: string } };

describe('routes', () => {
  const homeSeo = routes.find((route) => route.path === '')?.data?.['seo'] as HomeSeo | undefined;

  it('exposes SEO data on the home route', () => {
    expect(homeSeo).toBeDefined();
  });

  // Le `h1` de la home et le `Person` de schema.org affirment la même identité :
  // ils ont divergé tant que le `h1` portait un intitulé de poste.
  it('names the same person in the h1 and in the structured data', () => {
    expect(homeSeo?.structuredData.name).toBe(STATIC_HERO.name);
  });
});
