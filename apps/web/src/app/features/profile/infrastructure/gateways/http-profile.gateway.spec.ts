import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, afterEach } from 'vitest';

import { API_BASE_URL } from '@shared/api';
import { HttpProfileGateway } from './http-profile.gateway';
import type {
  ProfileInfo,
  Biography,
  Diploma,
  Technology,
  Highlight,
  SocialButton,
  WhatIDo,
  WhatISeek,
} from '../../domain';

const BASE = '/api';

function configure(): { gateway: HttpProfileGateway; httpController: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      HttpProfileGateway,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: BASE },
    ],
  });
  return {
    gateway: TestBed.inject(HttpProfileGateway),
    httpController: TestBed.inject(HttpTestingController),
  };
}

describe('HttpProfileGateway', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('Public — 5 tests', () => {
    it('getProfileInfo() émet GET /<base>/profile', async () => {
      const { gateway, httpController } = configure();
      const expected = { id: 'p1', displayName: 'John', location: 'Paris', avatarUrl: '', isAvailable: true, availabilityMessage: '' } as ProfileInfo;

      const promise = firstValueFrom(gateway.getProfileInfo());

      const req = httpController.expectOne(`${BASE}/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('getSocialButtons() émet GET /<base>/social-links, retourne SocialButton[]', async () => {
      const { gateway, httpController } = configure();
      const expected = [{ id: '1', icon: 'github', label: 'GitHub', href: 'https://gh.com' }] as SocialButton[];

      const promise = firstValueFrom(gateway.getSocialButtons());

      const req = httpController.expectOne(`${BASE}/social-links`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('getDiplomas() émet GET /<base>/diplomas, retourne Diploma[]', async () => {
      const { gateway, httpController } = configure();
      const expected = [{ id: 'd1', title: 'BAC', provider: 'X', shortDescription: 'desc', skills: [] }] as Diploma[];

      const promise = firstValueFrom(gateway.getDiplomas());

      const req = httpController.expectOne(`${BASE}/diplomas`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('getTechnologies() émet GET /<base>/technologies, retourne Technology[]', async () => {
      const { gateway, httpController } = configure();
      const expected = [{ id: 't1', name: 'Angular', category: 'frontend', icon: 'angular' }] as Technology[];

      const promise = firstValueFrom(gateway.getTechnologies());

      const req = httpController.expectOne(`${BASE}/technologies`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('getWhatIDo() émet GET /<base>/expertises/offers, retourne WhatIDo[]', async () => {
      const { gateway, httpController } = configure();
      const expected = [{ id: 'e1', title: 'Web dev', description: 'desc' }] as WhatIDo[];

      const promise = firstValueFrom(gateway.getWhatIDo());

      const req = httpController.expectOne(`${BASE}/expertises/offers`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });
  });

  describe('Public (suite) — 3 tests', () => {
    it('getBiography() émet GET /<base>/biography', async () => {
      const { gateway, httpController } = configure();
      const expected = { id: 'b1', title: 'About me', paragraphs: ['paragraph 1'] } as Biography;

      const promise = firstValueFrom(gateway.getBiography());

      const req = httpController.expectOne(`${BASE}/biography`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('getHighlights() émet GET /<base>/highlights/profile, retourne Highlight[]', async () => {
      const { gateway, httpController } = configure();
      const expected = [{ id: 'h1', title: 'Award', description: 'desc', icon: 'star' }] as Highlight[];

      const promise = firstValueFrom(gateway.getHighlights());

      const req = httpController.expectOne(`${BASE}/highlights/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('getWhatISeek() émet GET /<base>/expertises/seeks, retourne 1er item ou fallback', async () => {
      const { gateway, httpController } = configure();
      const items = [{ id: 's1', title: 'Looking for', description: 'a job' }] as WhatISeek[];

      const promise = firstValueFrom(gateway.getWhatISeek());

      const req = httpController.expectOne(`${BASE}/expertises/seeks`);
      expect(req.request.method).toBe('GET');
      req.flush(items);

      const result = await promise;
      expect(result).toEqual(items[0]);
      httpController.verify();
    });
  });
});
