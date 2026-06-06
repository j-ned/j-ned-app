import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, afterEach } from 'vitest';

import { API_BASE_URL } from '@shared/api';
import { HttpProjectsGateway } from './http-projects.gateway';
import type { Project } from '../../domain';

const BASE = '/api';

function configure(): { gateway: HttpProjectsGateway; httpController: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      HttpProjectsGateway,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: BASE },
    ],
  });
  return {
    gateway: TestBed.inject(HttpProjectsGateway),
    httpController: TestBed.inject(HttpTestingController),
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'uuid-1',
    title: 'My Project',
    category: 'Web',
    tags: ['angular'],
    description: 'desc',
    image: 'https://example.com/img.png',
    featured: false,
    order: 1,
    ...overrides,
  };
}

describe('HttpProjectsGateway', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('Public (NestJS) — 5 tests', () => {
    it('getAllProjects() émet GET /<base>/projects?_sort=order&limit=100, retourne Project[] (NestJS array direct)', async () => {
      const { gateway, httpController } = configure();
      const expected = [
        makeProject({ id: 'uuid-1' }),
        makeProject({ id: 'uuid-2', category: 'Mobile' }),
      ];

      const promise = firstValueFrom(gateway.getAllProjects());

      const req = httpController.expectOne(`${BASE}/projects?_sort=order&limit=100`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('getFeaturedProjects() émet GET /<base>/projects?featured=true&_sort=order, retourne Project[]', async () => {
      const { gateway, httpController } = configure();
      const expected = [makeProject({ featured: true })];

      const promise = firstValueFrom(gateway.getFeaturedProjects());

      const req = httpController.expectOne(`${BASE}/projects?featured=true&_sort=order`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('filterProjects({category:Web}) émet GET /<base>/projects?_sort=order&category=Web', async () => {
      const { gateway, httpController } = configure();
      const expected = [makeProject({ category: 'Web' })];

      const promise = firstValueFrom(gateway.filterProjects({ category: 'Web' }));

      const req = httpController.expectOne(`${BASE}/projects?_sort=order&category=Web`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('getProjectById(id) émet GET /<base>/projects/:id, retourne Project', async () => {
      const { gateway, httpController } = configure();
      const expected = makeProject({ id: 'uuid-9' });

      const promise = firstValueFrom(gateway.getProjectById('uuid-9'));

      const req = httpController.expectOne(`${BASE}/projects/uuid-9`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('getCategories() ne fait PAS de GET /categories ; dérive depuis getAllProjects, retourne ["Tous", ...uniques triées]', async () => {
      const { gateway, httpController } = configure();
      const projects = [
        makeProject({ id: '1', category: 'Web' }),
        makeProject({ id: '2', category: 'Mobile' }),
        makeProject({ id: '3', category: 'Web' }),
      ];

      const promise = firstValueFrom(gateway.getCategories());

      const req = httpController.expectOne(`${BASE}/projects?_sort=order&limit=100`);
      req.flush(projects);

      httpController.expectNone(`${BASE}/projects/categories`);

      const result = await promise;
      expect(result).toEqual(['Tous', 'Mobile', 'Web']);
      httpController.verify();
    });
  });

  describe('Admin (NestJS) — 4 tests', () => {
    it('createProject(data) émet POST /<base>/projects sans champ image (géré via uploadImage)', async () => {
      const { gateway, httpController } = configure();
      const data = makeProject();
      const { id: _id, image: _image, ...payload } = data;
      const created = makeProject({ id: 'new-uuid' });

      const promise = firstValueFrom(gateway.createProject(payload));

      const req = httpController.expectOne(`${BASE}/projects`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      expect(req.request.body).not.toHaveProperty('image');
      req.flush(created);

      const result = await promise;
      expect(result).toEqual(created);
      httpController.verify();
    });

    it('updateProject(id, partial) émet PATCH /<base>/projects/:id', async () => {
      const { gateway, httpController } = configure();
      const partial = { title: 'Updated' };
      const updated = makeProject({ id: 'uuid-1', title: 'Updated' });

      const promise = firstValueFrom(gateway.updateProject('uuid-1', partial));

      const req = httpController.expectOne(`${BASE}/projects/uuid-1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(partial);
      req.flush(updated);

      const result = await promise;
      expect(result).toEqual(updated);
      httpController.verify();
    });

    it('deleteProject(id) émet DELETE /<base>/projects/:id', async () => {
      const { gateway, httpController } = configure();

      const promise = firstValueFrom(gateway.deleteProject('uuid-1'));

      const req = httpController.expectOne(`${BASE}/projects/uuid-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      await promise;
      httpController.verify();
    });

    it('uploadImage(file, id) émet POST /<base>/projects/:id/image avec FormData{file}, retourne key', async () => {
      const { gateway, httpController } = configure();
      const file = new File(['png'], 'test.png', { type: 'image/png' });

      const promise = firstValueFrom(gateway.uploadImage(file, 'uuid-1'));

      const req = httpController.expectOne(`${BASE}/projects/uuid-1/image`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      expect((req.request.body as FormData).get('file')).toEqual(file);
      req.flush({ key: 'projects/uuid-1/test.png' });

      const result = await promise;
      expect(result).toBe('projects/uuid-1/test.png');
      httpController.verify();
    });
  });

  describe('Invalidation du cache featured — 1 test', () => {
    it('invalidateFeatured() re-déclenche le GET featured pour les abonnés vivants', () => {
      const { gateway, httpController } = configure();

      // Abonnement vivant : maintient le shareReplay({ refCount: true }) chaud.
      const sub = gateway.getFeaturedProjects().subscribe();
      httpController
        .expectOne(`${BASE}/projects?featured=true&_sort=order`)
        .flush([makeProject({ id: 'uuid-1', featured: true })]);

      gateway.invalidateFeatured();

      const refetch = httpController.expectOne(`${BASE}/projects?featured=true&_sort=order`);
      expect(refetch.request.method).toBe('GET');
      refetch.flush([makeProject({ id: 'uuid-2', featured: true })]);

      sub.unsubscribe();
      httpController.verify();
    });
  });
});
