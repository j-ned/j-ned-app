import { Component, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, type Routes } from '@angular/router';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';

import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import type { OutboundChannel } from '@features/analytics/domain/models/analytics.types';
import { stubAnalyticsGateway } from '@features/analytics/testing/stub-analytics-gateway';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { initializeOutboundClickTracking } from './outbound-click-tracking';

@Component({ template: '' })
class Blank {}

const ROUTES: Routes = [
  { path: '', component: Blank },
  { path: 'offres/:slug', component: Blank },
  { path: '**', component: Blank },
];

type TrackOutboundClick = Mock<(channel: OutboundChannel, path: string) => void>;

async function startTracking(
  platform: 'browser' | 'server' = 'browser',
  url = '/offres/site-vitrine#demande',
): Promise<TrackOutboundClick> {
  const trackOutboundClick: TrackOutboundClick = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      provideRouter(ROUTES),
      { provide: PLATFORM_ID, useValue: platform },
      { provide: AnalyticsGateway, useValue: stubAnalyticsGateway({ trackOutboundClick }) },
    ],
  });
  TestBed.runInInjectionContext(initializeOutboundClickTracking());
  await TestBed.inject(Router).navigateByUrl(url);
  return trackOutboundClick;
}

function link(href: string | null, label = 'Lien'): HTMLAnchorElement {
  const anchor = document.createElement('a');
  if (href !== null) anchor.setAttribute('href', href);
  anchor.dataset['testid'] = 'outbound-probe';
  // Sans navigation réelle, happy-dom recopie quand même l'href dans `location` : un `tel:` y
  // resterait pour les fichiers suivants du worker (fenêtre partagée, `isolate: false`) et toute
  // URL relative résolue contre lui lèverait `Invalid URL` (NgOptimizedImage d'AboutHero).
  anchor.addEventListener('click', (event) => event.preventDefault());
  const text = document.createElement('span');
  text.textContent = label;
  anchor.append(text);
  document.body.append(anchor);
  return anchor;
}

function middleClick(element: Element, button = 1): void {
  element.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, button }));
}

describe('initializeOutboundClickTracking', () => {
  afterEach(() => {
    document.querySelectorAll('[data-testid="outbound-probe"]').forEach((el) => el.remove());
    TestBed.resetTestingModule();
  });

  describe('liens reconnus', () => {
    it('Given a mailto link anywhere in the document When it is clicked Then the email channel is reported with the page, without its fragment', async () => {
      const track = await startTracking();

      link('mailto:contact@nedellec-julien.fr').click();

      expect(track).toHaveBeenCalledExactlyOnceWith('email', '/offres/site-vitrine');
    });

    it('Given a LinkedIn link When the text inside it is clicked Then the linkedin channel is reported once', async () => {
      const track = await startTracking();

      link(SITE_IDENTITY.socials.linkedin).querySelector('span')?.click();

      expect(track).toHaveBeenCalledExactlyOnceWith('linkedin', '/offres/site-vitrine');
    });

    it('Given a phone link on the home page When it is clicked Then the phone channel is reported with the home path', async () => {
      const track = await startTracking('browser', '/#contact');

      link('tel:+33622869279').click();

      expect(track).toHaveBeenCalledExactlyOnceWith('phone', '/');
    });

    it('Given a demo link When it is opened with the middle button Then the demo channel is reported once', async () => {
      const track = await startTracking();

      middleClick(link('https://vieux-comptoir.nedellec-julien.fr/'));

      expect(track).toHaveBeenCalledExactlyOnceWith('demo', '/offres/site-vitrine');
    });

    it('Given a GitHub link When the secondary button raises auxclick Then nothing is reported', async () => {
      const track = await startTracking();

      middleClick(link(SITE_IDENTITY.socials.github), 2);

      expect(track).not.toHaveBeenCalled();
    });
  });

  describe('clics ignorés', () => {
    it.each([
      ['an internal link', '/blog'],
      ['an unrelated outbound link', 'https://www.cnil.fr'],
      ['a link to the site itself', 'https://nedellec-julien.fr/offres'],
      ['an anchor without href', null],
    ])('Given %s When it is clicked Then nothing is reported', async (_label, href) => {
      const track = await startTracking();

      link(href).click();

      expect(track).not.toHaveBeenCalled();
    });

    it('Given a click outside any link When it bubbles to the document Then nothing is reported', async () => {
      const track = await startTracking();
      const button = document.createElement('button');
      button.dataset['testid'] = 'outbound-probe';
      document.body.append(button);

      button.click();

      expect(track).not.toHaveBeenCalled();
    });
  });

  describe('cycle de vie', () => {
    it('Given the server platform When a mailto link is clicked Then nothing is reported', async () => {
      const track = await startTracking('server');

      link('mailto:contact@nedellec-julien.fr').click();

      expect(track).not.toHaveBeenCalled();
    });

    it('Given the application was destroyed When a mailto link is clicked Then nothing is reported after the destruction', async () => {
      const track = await startTracking();
      link('mailto:contact@nedellec-julien.fr').click();

      TestBed.resetTestingModule();
      link('tel:+33622869279').click();

      expect(track.mock.calls).toEqual([['email', '/offres/site-vitrine']]);
    });
  });
});
