import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, afterEach } from 'vitest';

import { API_BASE_URL } from '@shared/api';
import { HttpHomeGateway } from './http-home.gateway';
import type { HeroData, HomeBundle, HomeHighlight, ServicePricing } from '../../domain';

const BASE = '/api';

function configure(): { gateway: HttpHomeGateway; httpController: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      HttpHomeGateway,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: BASE },
    ],
  });
  return {
    gateway: TestBed.inject(HttpHomeGateway),
    httpController: TestBed.inject(HttpTestingController),
  };
}

describe('HttpHomeGateway', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('Public — 2 tests', () => {
    it('getHeroData() émet GET /<base>/hero, retourne HeroData', async () => {
      const { gateway, httpController } = configure();
      const expected = {
        id: 'h1',
        name: 'Julien',
        tagline: 'Dev',
        availability: 'open',
      } as HeroData;

      const promise = firstValueFrom(gateway.getHeroData());

      const req = httpController.expectOne(`${BASE}/hero`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('getServicePricing() émet GET /<base>/service-pricing, retourne ServicePricing[]', async () => {
      const { gateway, httpController } = configure();
      const expected = [
        {
          id: 'sp1',
          title: 'Web',
          description: 'desc',
          price: '100',
          features: [],
          highlighted: false,
          enabled: true,
          order: 1,
        },
      ] as ServicePricing[];

      const promise = firstValueFrom(gateway.getServicePricing());

      const req = httpController.expectOne(`${BASE}/service-pricing`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });
  });

  describe('Bundle/aggregate — 2 tests', () => {
    it('getHomeBundle() émet GET /<base>/home-bundle', async () => {
      const { gateway, httpController } = configure();
      const expected = {
        hero: { id: 'h1', name: 'Julien', tagline: 'Dev', availability: 'open' },
        highlights: [],
        services: [],
        featuredProjects: [],
      } as unknown as HomeBundle;

      const promise = firstValueFrom(gateway.getHomeBundle());

      const req = httpController.expectOne(`${BASE}/home-bundle`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      const result = await promise;
      expect(result.hero).toEqual(expected.hero);
      httpController.verify();
    });

    it('getHomeHighlights() émet GET /<base>/highlights/home, retourne HomeHighlight[]', async () => {
      const { gateway, httpController } = configure();
      const expected = [
        { id: 'hh1', title: 'Highlight 1', description: 'desc', icon: 'star', order: 1 },
      ] as HomeHighlight[];

      const promise = firstValueFrom(gateway.getHomeHighlights());

      const req = httpController.expectOne(`${BASE}/highlights/home`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });
  });
});
