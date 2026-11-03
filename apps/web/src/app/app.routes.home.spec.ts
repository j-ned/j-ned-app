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

describe('home route SEO', () => {
  it('gives the home page a search snippet of at most 160 characters', () => {
    const description = String(homeSeo()?.['description'] ?? '');
    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThanOrEqual(160);
  });

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
});
