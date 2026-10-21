/// <reference types="node" />
import { readFileSync } from 'node:fs';
import type { Route } from '@angular/router';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { routes } from './app.routes';

type JsonLdNode = Readonly<Record<string, unknown>>;

const homeRoute = (): Route | undefined => routes.find((route) => route.path === '');
const homeSeo = (): Readonly<Record<string, unknown>> | undefined => homeRoute()?.data?.['seo'];
const structuredData = (): JsonLdNode | undefined =>
  homeSeo()?.['structuredData'] as JsonLdNode | undefined;
const graph = (): readonly JsonLdNode[] =>
  (structuredData()?.['@graph'] as readonly JsonLdNode[] | undefined) ?? [];
const nodeOfType = (type: string): JsonLdNode | undefined =>
  graph().find((node) => node['@type'] === type);

const HOME_TITLE = 'Julien Nédellec | Tourneur CN et développeur web Angular / NestJS';
const HOME_DESCRIPTION =
  "Tourneur CN dans l'aéronautique et développeur web par passion\u00a0: Angular, NestJS, auto-hébergement, et des projets qui tournent vraiment.";

const indexHtmlDescriptions = (): readonly (string | null)[] => {
  const html = new DOMParser().parseFromString(readFileSync('src/index.html', 'utf8'), 'text/html');
  return ['meta[name="description"]', 'meta[property="og:description"]'].map(
    (selector) => html.querySelector(selector)?.getAttribute('content') ?? null,
  );
};

describe('home route SEO', () => {
  it('titles the home page after the person, in the tab and in the SEO data', () => {
    expect(homeRoute()?.title).toBe(HOME_TITLE);
    expect(homeSeo()?.['title']).toBe(HOME_TITLE);
  });

  it('describes the home page by the trade, the stack and what the site holds', () => {
    expect(homeSeo()?.['description']).toBe(HOME_DESCRIPTION);
  });

  it('serves the same description in the static index.html, for search engines and link previews', () => {
    expect(indexHtmlDescriptions()).toEqual([HOME_DESCRIPTION, HOME_DESCRIPTION]);
  });

  it('gives the home page a search snippet of at most 160 characters, without em dash', () => {
    const description = String(homeSeo()?.['description'] ?? '');
    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).not.toContain('—');
  });

  // Spec 029 : plus d'activité commerciale ni de recherche d'emploi.
  it.each([/\bCDI\b/, /prix/i, /devis/i, /mission/i, /freelance/i, /Yvelines/, /Île-de-France/])(
    'never mentions %s, neither in the snippet nor in the structured data',
    (pattern) => {
      expect(JSON.stringify(homeSeo())).not.toMatch(pattern);
    },
  );

  it('describes the home page as one schema.org graph of a person and the website they write', () => {
    expect(structuredData()?.['@context']).toBe('https://schema.org');
    expect(graph().map((node) => node['@type'])).toEqual(['Person', 'WebSite']);
  });

  it('identifies the person by name, site and trade, and links their public profiles only', () => {
    const person = nodeOfType('Person');
    expect({
      name: person?.['name'],
      url: person?.['url'],
      jobTitle: person?.['jobTitle'],
      sameAs: person?.['sameAs'],
    }).toEqual({
      name: 'Julien Nédellec',
      url: SITE_IDENTITY.siteUrl,
      jobTitle: 'Tourneur CN',
      sameAs: [SITE_IDENTITY.socials.linkedin, SITE_IDENTITY.socials.github],
    });
  });

  it('declares the website in French, authored by the person', () => {
    const website = nodeOfType('WebSite');
    expect({
      url: website?.['url'],
      inLanguage: website?.['inLanguage'],
      author: website?.['author'],
    }).toEqual({
      url: SITE_IDENTITY.siteUrl,
      inLanguage: 'fr-FR',
      author: { '@id': nodeOfType('Person')?.['@id'] },
    });
  });

  it.each([
    'ProfessionalService',
    'OfferCatalog',
    'Offer',
    'Review',
    'AdministrativeArea',
    'PriceSpecification',
  ])('carries no commercial node of type %s anywhere in the graph', (type) => {
    expect(JSON.stringify(structuredData())).not.toContain(`"@type":"${type}"`);
  });

  it('never lists Malt nor the Google review form among the identities', () => {
    expect(JSON.stringify(structuredData())).not.toMatch(/malt\.fr|g\.page/);
  });
});
