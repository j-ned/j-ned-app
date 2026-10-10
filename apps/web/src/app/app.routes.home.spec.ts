import type { Route } from '@angular/router';
import { OFFERS } from '@features/offer/domain/offer-catalog.static-data';
import { toOfferCatalogJsonLd } from '@features/offer/offer-seo';
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

const HOME_TITLE = 'Julien Nédellec | Sites et applications web, Yvelines';

describe('home route SEO', () => {
  it('titles the home page for clients, in the tab and in the SEO data', () => {
    expect(homeRoute()?.title).toBe(HOME_TITLE);
    expect(homeSeo()?.['title']).toBe(HOME_TITLE);
  });

  it('describes the home page with the validated snippet', () => {
    expect(homeSeo()?.['description']).toBe(
      'Sites et applications web livrés en production par un seul interlocuteur\u00a0: site vitrine en 7 jours, application sur mesure, maintenance. Yvelines et à distance.',
    );
  });

  it('gives the home page a search snippet of at most 160 characters, without em dash', () => {
    const description = String(homeSeo()?.['description'] ?? '');
    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).not.toContain('—');
  });

  it('never mentions the CDI, neither in the snippet nor in the structured data', () => {
    expect(JSON.stringify(homeSeo())).not.toMatch(/\bCDI\b/);
  });

  it('describes the home page as one schema.org graph of a person and a professional service', () => {
    expect(structuredData()?.['@context']).toBe('https://schema.org');
    expect(graph().map((node) => node['@type'])).toEqual(['Person', 'ProfessionalService']);
  });

  it('keeps the person behind the service identified by name and site', () => {
    const person = nodeOfType('Person');
    expect(person?.['name']).toBe('Julien Nédellec');
    expect(person?.['url']).toBe(SITE_IDENTITY.siteUrl);
  });

  it('serves the Yvelines, Île-de-France and France from the professional service', () => {
    const areas = (nodeOfType('ProfessionalService')?.['areaServed'] ??
      []) as readonly JsonLdNode[];
    expect(areas.map((area) => area['name'])).toEqual(['Yvelines', 'Île-de-France', 'France']);
  });

  it('locates the professional service where the publisher is established', () => {
    const address = nodeOfType('ProfessionalService')?.['address'] as JsonLdNode | undefined;
    expect(address?.['addressLocality']).toBe(SITE_IDENTITY.location);
    expect(address?.['addressCountry']).toBe('FR');
  });

  it('attaches the offer catalogue to the professional service', () => {
    expect(nodeOfType('ProfessionalService')?.['hasOfferCatalog']).toEqual(
      toOfferCatalogJsonLd(OFFERS),
    );
  });

  it('never lists the Google review form among the identities of the structured data', () => {
    expect(JSON.stringify(structuredData())).not.toContain('g.page');
  });

  it('claims no review on the professional service while no real review exists', () => {
    expect(Object.keys(nodeOfType('ProfessionalService') ?? {})).not.toContain('review');
  });
});
