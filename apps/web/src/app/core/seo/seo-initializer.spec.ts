import { Component, provideAppInitializer } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Seo, type SeoData } from './seo';
import { initializeSeo } from './seo-initializer';

@Component({ template: '' })
class BlankRoute {}

const VALID_SEO = {
  title: 'Parcours | Julien Nédellec',
  description: 'Mon parcours.',
} satisfies SeoData;

async function navigateTo(path: string, seo: unknown): Promise<ReturnType<typeof vi.fn>> {
  const applySeoData = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'parent', children: [{ path: 'page', component: BlankRoute, data: { seo } }] },
      ]),
      { provide: Seo, useValue: { applySeoData } },
      provideAppInitializer(initializeSeo()),
    ],
  });
  await TestBed.inject(Router).navigateByUrl(path);
  return applySeoData;
}

describe('initializeSeo', () => {
  it('Given a route declaring SEO data without url When the navigation ends Then the deepest route data is applied with the site url of the page', async () => {
    const applySeoData = await navigateTo('/parent/page', VALID_SEO);

    expect(applySeoData.mock.calls).toEqual([
      [{ ...VALID_SEO, url: 'https://nedellec-julien.fr/parent/page' }],
    ]);
  });

  it('Given a route declaring its canonical url When the navigation ends Then that url is kept', async () => {
    const seo = { ...VALID_SEO, url: 'https://nedellec-julien.fr/canonique' } satisfies SeoData;

    const applySeoData = await navigateTo('/parent/page', seo);

    expect(applySeoData.mock.calls).toEqual([[seo]]);
  });

  it.each<{ readonly scenario: string; readonly seo: unknown }>([
    { scenario: 'no SEO data', seo: undefined },
    { scenario: 'a null value', seo: null },
    { scenario: 'a bare string', seo: 'Parcours' },
    { scenario: 'a list', seo: [VALID_SEO] },
    { scenario: 'robots that are not text', seo: { ...VALID_SEO, robots: false } },
    { scenario: 'structured data given as a list', seo: { ...VALID_SEO, structuredData: [] } },
    { scenario: 'a title that is not text', seo: { ...VALID_SEO, title: 42 } },
    { scenario: 'no description', seo: { title: VALID_SEO.title } },
    { scenario: 'a url that is not text', seo: { ...VALID_SEO, url: 42 } },
    {
      scenario: 'structured data that is not an object',
      seo: { ...VALID_SEO, structuredData: 'x' },
    },
  ])(
    'Given a route with $scenario When the navigation ends Then nothing is applied',
    async ({ seo }) => {
      const applySeoData = await navigateTo('/parent/page', seo);

      expect(applySeoData.mock.calls).toEqual([]);
    },
  );
});
