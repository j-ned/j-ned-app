import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom, type Observable } from 'rxjs';
import { describe, it, expect, afterEach, vi } from 'vitest';

import { API_BASE_URL } from '@shared/api/api-config';
import { errorToastInterceptor } from '@core/interceptors/error-toast';
import { ToastStore } from '@core/notifications/toast-store';
import { HttpProjectsGateway } from './http-projects.gateway';
import type { Project } from '../../domain/models/project.model';
import { makeProject, makeProjectImage, makeProjectInput } from '../../testing/project-builders';

const BASE = 'https://api.test/api';

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

describe('HttpProjectsGateway', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('Public (NestJS): 5 tests', () => {
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

    it('getAllProjects() conserve slug, techChoices et architectureDecisions', async () => {
      const { gateway, httpController } = configure();
      const expected = [
        makeProject({
          slug: 'dashflow',
          techChoices: [{ techno: 'NestJS', why: 'modulaire' }],
          architectureDecisions: [{ decision: 'hexagonale', rationale: 'testable' }],
        }),
      ];

      const promise = firstValueFrom(gateway.getAllProjects());
      httpController.expectOne(`${BASE}/projects?_sort=order&limit=100`).flush(expected);

      const result = await promise;
      expect(result[0].slug).toBe('dashflow');
      expect(result[0].techChoices).toEqual([{ techno: 'NestJS', why: 'modulaire' }]);
      expect(result[0].architectureDecisions).toEqual([
        { decision: 'hexagonale', rationale: 'testable' },
      ]);
    });

    // Un visiteur qui enchaîne home → /projects → détail ne doit coûter qu'une requête : la liste
    // reste en cache tant que l'admin ne l'invalide pas, et « featured » en est dérivé.
    it('getFeaturedProjects() dérive de la liste complète sans requête ?featured=true', async () => {
      const { gateway, httpController } = configure();
      const featured = makeProject({ id: 'uuid-2', featured: true });

      const promise = firstValueFrom(gateway.getFeaturedProjects());

      httpController.expectNone(`${BASE}/projects?featured=true&_sort=order`);
      httpController
        .expectOne(`${BASE}/projects?_sort=order&limit=100`)
        .flush([makeProject({ id: 'uuid-1', featured: false }), featured]);

      expect(await promise).toEqual([featured]);
      httpController.verify();
    });

    it('getFeaturedProjects() ne retient que les projets mis en avant et en production', async () => {
      const { gateway, httpController } = configure();
      const { kind: _kind, ...featuredWithoutKind } = makeProject({
        id: 'no-kind',
        featured: true,
      });

      const promise = firstValueFrom(gateway.getFeaturedProjects());
      httpController
        .expectOne(`${BASE}/projects?_sort=order&limit=100`)
        .flush([
          makeProject({ id: 'featured-demo', featured: true, kind: 'demo' }),
          makeProject({ id: 'featured-production', featured: true, kind: 'production' }),
          makeProject({ id: 'production', featured: false, kind: 'production' }),
          featuredWithoutKind,
        ]);

      expect((await promise).map((p) => p.id)).toEqual(['featured-production']);
      httpController.verify();
    });

    it('getAllProjects() ne refait pas de requête quand un second consommateur arrive après le premier', async () => {
      const { gateway, httpController } = configure();
      const expected = [makeProject()];

      const first = firstValueFrom(gateway.getAllProjects());
      httpController.expectOne(`${BASE}/projects?_sort=order&limit=100`).flush(expected);
      await first;

      // firstValueFrom s'est désabonné : une page suivante (détail projet) ressouscrit.
      expect(await firstValueFrom(gateway.getAllProjects())).toEqual(expected);
      httpController.expectNone(`${BASE}/projects?_sort=order&limit=100`);
      httpController.verify();
    });

    it('invalidateAllProjects() force une nouvelle requête et pousse la nouvelle liste aux abonnés', () => {
      const { gateway, httpController } = configure();
      const seen: number[] = [];
      const sub = gateway.getFeaturedProjects().subscribe((list) => seen.push(list.length));
      httpController.expectOne(`${BASE}/projects?_sort=order&limit=100`).flush([makeProject()]);

      gateway.invalidateAllProjects();
      httpController
        .expectOne(`${BASE}/projects?_sort=order&limit=100`)
        .flush([makeProject({ featured: true })]);

      expect(seen).toEqual([0, 1]);
      sub.unsubscribe();
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
  });

  describe('Adaptation des réponses', () => {
    const {
      kind: _kind,
      gallery: _gallery,
      ...legacyRow
    } = makeProject({
      image: '/storage/portfolio-storage/projects/uuid-1-fb6c30aa.avif',
    });
    const adapted = makeProject({
      image: '/api/storage/portfolio-storage/projects/uuid-1-fb6c30aa.avif',
      kind: null,
      gallery: [],
    });
    const payload = makeProjectInput();

    it.each<{
      label: string;
      url: string;
      list: boolean;
      call: (g: HttpProjectsGateway) => Observable<Project | readonly Project[] | null>;
    }>([
      {
        label: 'getAllProjects()',
        url: `${BASE}/projects?_sort=order&limit=100`,
        list: true,
        call: (g: HttpProjectsGateway): Observable<Project | readonly Project[] | null> =>
          g.getAllProjects(),
      },
      {
        label: 'getProjectById()',
        url: `${BASE}/projects/uuid-1`,
        list: false,
        call: (g: HttpProjectsGateway): Observable<Project | readonly Project[] | null> =>
          g.getProjectById('uuid-1'),
      },
      {
        label: 'createProject()',
        url: `${BASE}/projects`,
        list: false,
        call: (g: HttpProjectsGateway): Observable<Project | readonly Project[] | null> =>
          g.createProject(payload),
      },
      {
        label: 'updateProject()',
        url: `${BASE}/projects/uuid-1`,
        list: false,
        call: (g: HttpProjectsGateway): Observable<Project | readonly Project[] | null> =>
          g.updateProject('uuid-1', { title: 'Mon site' }),
      },
    ])(
      'Given a row without kind nor gallery and a relative cover When $label answers Then the project is adapted',
      async ({ url, list, call }) => {
        const { gateway, httpController } = configure();

        const promise = firstValueFrom(call(gateway));
        httpController.expectOne(url).flush(list ? [legacyRow] : legacyRow);

        const result = await promise;
        expect(Array.isArray(result) ? result : [result]).toEqual([adapted]);
        httpController.verify();
      },
    );

    it('Given a cover and captures stored by the API When the list is read Then they are served from the site, never from the API origin', async () => {
      const { gateway, httpController } = configure();

      const promise = firstValueFrom(gateway.getAllProjects());
      httpController.expectOne(`${BASE}/projects?_sort=order&limit=100`).flush([
        {
          ...makeProject({ image: '/storage/portfolio-storage/projects/uuid-1-fb6c30aa.avif' }),
          gallery: [
            {
              id: 'img-2',
              url: '/storage/portfolio-storage/project-images/img-2-ab12cd34.avif',
              alt: 'Liste des transactions',
              width: 1280,
              height: 800,
              order: 1,
            },
            {
              id: 'img-1',
              url: '/storage/portfolio-storage/project-images/img-1-ab12cd34.avif',
              alt: 'Tableau de bord',
              width: 1280,
              height: 800,
              order: 0,
            },
          ],
        },
      ]);

      const [project] = await promise;
      expect({ image: project.image, gallery: project.gallery.map((image) => image.src) }).toEqual({
        image: '/api/storage/portfolio-storage/projects/uuid-1-fb6c30aa.avif',
        gallery: [
          '/api/storage/portfolio-storage/project-images/img-1-ab12cd34.avif',
          '/api/storage/portfolio-storage/project-images/img-2-ab12cd34.avif',
        ],
      });
      httpController.verify();
    });

    it('Given a cover and a capture already absolute When the list is read Then they are left as is', async () => {
      const { gateway, httpController } = configure();

      const promise = firstValueFrom(gateway.getAllProjects());
      httpController.expectOne(`${BASE}/projects?_sort=order&limit=100`).flush([
        {
          ...makeProject({ image: 'https://cdn.test/projects/cover.avif' }),
          gallery: [
            {
              id: 'img-1',
              url: 'https://cdn.test/project-images/img-1.avif',
              alt: 'Tableau de bord',
              width: 1280,
              height: 800,
              order: 0,
            },
          ],
        },
      ]);

      const [project] = await promise;
      expect({ image: project.image, gallery: project.gallery.map((image) => image.src) }).toEqual({
        image: 'https://cdn.test/projects/cover.avif',
        gallery: ['https://cdn.test/project-images/img-1.avif'],
      });
      httpController.verify();
    });

    it('Given an unknown kind in the list When it is read Then the project has no kind', async () => {
      const { gateway, httpController } = configure();

      const promise = firstValueFrom(gateway.getAllProjects());
      httpController
        .expectOne(`${BASE}/projects?_sort=order&limit=100`)
        .flush([
          { ...makeProject({ id: 'uuid-1' }), kind: 'client' },
          makeProject({ id: 'uuid-2', kind: 'demo' }),
        ]);

      expect((await promise).map((p) => p.kind)).toEqual([null, 'demo']);
      httpController.verify();
    });
  });

  describe('Projet introuvable', () => {
    it.each([
      { status: 404, statusText: 'Not Found', outcome: { value: null } },
      { status: 500, statusText: 'Internal Server Error', outcome: { failedWith: 500 } },
    ])(
      'Given GET /projects/:id answering $status When the project is read Then the outcome is $outcome',
      async ({ status, statusText, outcome }) => {
        const { gateway, httpController } = configure();
        const read = firstValueFrom(gateway.getProjectById('uuid-404')).then(
          (value) => ({ value }),
          (error: unknown) => ({
            failedWith: error instanceof HttpErrorResponse ? error.status : error,
          }),
        );

        httpController
          .expectOne(`${BASE}/projects/uuid-404`)
          .flush('missing', { status, statusText });

        expect(await read).toEqual(outcome);
        httpController.verify();
      },
    );
  });

  describe('Échec de chargement', () => {
    const URL = `${BASE}/projects?_sort=order&limit=100`;

    it("relance la requête une fois avant de propager l'erreur", async () => {
      const { gateway, httpController } = configure();
      const outcome = firstValueFrom(gateway.getAllProjects()).then(
        () => 'ok',
        () => 'error',
      );

      httpController.expectOne(URL).flush('boom', { status: 503, statusText: 'Unavailable' });
      httpController.expectOne(URL).flush('boom', { status: 503, statusText: 'Unavailable' });

      expect(await outcome).toBe('error');
      httpController.verify();
    });

    it("un échec n'est pas mis en cache : le prochain abonné relance la requête", async () => {
      const { gateway, httpController } = configure();
      const failed = firstValueFrom(gateway.getAllProjects()).catch(() => 'error');
      httpController.expectOne(URL).flush('boom', { status: 500, statusText: 'Error' });
      httpController.expectOne(URL).flush('boom', { status: 500, statusText: 'Error' });
      expect(await failed).toBe('error');

      const recovered = firstValueFrom(gateway.getAllProjects());
      httpController.expectOne(URL).flush([makeProject()]);
      expect((await recovered).length).toBe(1);
      httpController.verify();
    });
  });

  describe('Admin (NestJS): 4 tests', () => {
    it('createProject(data) émet POST /<base>/projects sans champ image (géré via uploadImage)', async () => {
      const { gateway, httpController } = configure();
      const payload = makeProjectInput();
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

  describe('Galerie (admin)', () => {
    const imageDto = (
      id: string,
      order: number,
      alt = `Capture ${id}`,
    ): Record<string, unknown> => ({
      id,
      url: `/storage/portfolio-storage/project-images/${id}-ab12cd34.avif`,
      alt,
      width: 1280,
      height: 800,
      order,
    });
    const adaptedImage = (id: string, alt = `Capture ${id}`): ReturnType<typeof makeProjectImage> =>
      makeProjectImage({
        id,
        src: `/api/storage/portfolio-storage/project-images/${id}-ab12cd34.avif`,
        alt,
        width: 1280,
        height: 800,
      });

    it('Given a file and an alt When a capture is uploaded Then POST /projects/:id/images sends multipart file + alt and returns the adapted capture', async () => {
      const { gateway, httpController } = configure();
      const file = new File(['png'], 'vue.png', { type: 'image/png' });

      const promise = firstValueFrom(gateway.uploadGalleryImage('uuid-1', file, 'Vue globale'));

      const req = httpController.expectOne(`${BASE}/projects/uuid-1/images`);
      const body = req.request.body as FormData;
      expect({
        method: req.request.method,
        isFormData: body instanceof FormData,
        file: body.get('file'),
        alt: body.get('alt'),
      }).toEqual({ method: 'POST', isFormData: true, file, alt: 'Vue globale' });
      req.flush(imageDto('img-9', 3, 'Vue globale'), { status: 201, statusText: 'Created' });

      expect(await promise).toEqual(adaptedImage('img-9', 'Vue globale'));
      httpController.verify();
    });

    it.each([413, 422])(
      'Given the API refuses the upload with %i When a capture is uploaded Then the error reaches the caller with its status',
      async (status) => {
        const { gateway, httpController } = configure();
        const file = new File(['png'], 'vue.png', { type: 'image/png' });

        const outcome = firstValueFrom(
          gateway.uploadGalleryImage('uuid-1', file, 'Vue globale'),
        ).then(
          () => 'ok',
          (error: { status?: number }) => error.status,
        );
        httpController
          .expectOne(`${BASE}/projects/uuid-1/images`)
          .flush('refused', { status, statusText: 'Refused' });

        expect(await outcome).toBe(status);
        httpController.verify();
      },
    );

    it('Given a new alt When it is saved Then PATCH /projects/:id/images/:imageId sends { alt } and returns the adapted capture', async () => {
      const { gateway, httpController } = configure();

      const promise = firstValueFrom(
        gateway.updateGalleryImageAlt('uuid-1', 'img-9', 'Liste des transactions'),
      );

      const req = httpController.expectOne(`${BASE}/projects/uuid-1/images/img-9`);
      expect({ method: req.request.method, body: req.request.body }).toEqual({
        method: 'PATCH',
        body: { alt: 'Liste des transactions' },
      });
      req.flush(imageDto('img-9', 0, 'Liste des transactions'));

      expect(await promise).toEqual(adaptedImage('img-9', 'Liste des transactions'));
      httpController.verify();
    });

    it('Given a capture When it is deleted Then DELETE /projects/:id/images/:imageId is sent', async () => {
      const { gateway, httpController } = configure();

      const outcome = firstValueFrom(gateway.deleteGalleryImage('uuid-1', 'img-9'), {
        defaultValue: undefined,
      }).then(() => 'deleted');

      const req = httpController.expectOne(`${BASE}/projects/uuid-1/images/img-9`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      expect(await outcome).toBe('deleted');
      httpController.verify();
    });

    it('Given a new order When the gallery is reordered Then PUT /projects/:id/images/order sends the whole permutation and returns the adapted gallery', async () => {
      const { gateway, httpController } = configure();

      const promise = firstValueFrom(gateway.reorderGallery('uuid-1', ['img-c', 'img-a', 'img-b']));

      const req = httpController.expectOne(`${BASE}/projects/uuid-1/images/order`);
      expect({ method: req.request.method, body: req.request.body }).toEqual({
        method: 'PUT',
        body: { imageIds: ['img-c', 'img-a', 'img-b'] },
      });
      req.flush([imageDto('img-c', 0), imageDto('img-a', 1), imageDto('img-b', 2)]);

      expect(await promise).toEqual([
        adaptedImage('img-c'),
        adaptedImage('img-a'),
        adaptedImage('img-b'),
      ]);
      httpController.verify();
    });
  });

  describe('Invalidation du cache featured: 1 test', () => {
    it('invalidateFeatured() re-déclenche le GET de la liste pour les abonnés vivants', () => {
      const { gateway, httpController } = configure();
      const seen: string[] = [];
      const sub = gateway.getFeaturedProjects().subscribe((list) => seen.push(list[0]?.id ?? ''));
      httpController
        .expectOne(`${BASE}/projects?_sort=order&limit=100`)
        .flush([makeProject({ id: 'uuid-1', featured: true })]);

      gateway.invalidateFeatured();

      const refetch = httpController.expectOne(`${BASE}/projects?_sort=order&limit=100`);
      expect(refetch.request.method).toBe('GET');
      refetch.flush([makeProject({ id: 'uuid-2', featured: true })]);

      expect(seen).toEqual(['uuid-1', 'uuid-2']);
      sub.unsubscribe();
      httpController.verify();
    });
  });
});

describe('HttpProjectsGateway: écritures de l’admin derrière l’intercepteur de toasts', () => {
  const add = vi.fn();

  function configureWithToasts(): {
    gateway: HttpProjectsGateway;
    httpController: HttpTestingController;
  } {
    add.mockClear();
    TestBed.configureTestingModule({
      providers: [
        HttpProjectsGateway,
        provideHttpClient(withInterceptors([errorToastInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: ToastStore, useValue: { add } },
      ],
    });
    return {
      gateway: TestBed.inject(HttpProjectsGateway),
      httpController: TestBed.inject(HttpTestingController),
    };
  }

  async function toastsOnFailure(
    request: Observable<unknown>,
    httpController: HttpTestingController,
    method: string,
    url: string,
  ): Promise<{ status: number | null; toasts: number }> {
    const outcome = firstValueFrom(request).then(
      () => null,
      (error: unknown) => (error instanceof HttpErrorResponse ? error.status : -1),
    );
    httpController
      .expectOne({ method, url })
      .flush(null, { status: 500, statusText: 'Server Error' });
    return { status: await outcome, toasts: add.mock.calls.length };
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  const IMAGE = new File(['x'], 'cover.png', { type: 'image/png' });

  it.each<{
    write: string;
    method: string;
    url: string;
    call: (gateway: HttpProjectsGateway) => Observable<unknown>;
  }>([
    {
      write: 'createProject',
      method: 'POST',
      url: `${BASE}/projects`,
      call: (g): Observable<unknown> => g.createProject(makeProjectInput()),
    },
    {
      write: 'updateProject',
      method: 'PATCH',
      url: `${BASE}/projects/p-1`,
      call: (g): Observable<unknown> => g.updateProject('p-1', { title: 'X' }),
    },
    {
      write: 'deleteProject',
      method: 'DELETE',
      url: `${BASE}/projects/p-1`,
      call: (g): Observable<unknown> => g.deleteProject('p-1'),
    },
    {
      write: 'uploadImage',
      method: 'POST',
      url: `${BASE}/projects/p-1/image`,
      call: (g): Observable<unknown> => g.uploadImage(IMAGE, 'p-1'),
    },
    {
      write: 'uploadGalleryImage',
      method: 'POST',
      url: `${BASE}/projects/p-1/images`,
      call: (g): Observable<unknown> => g.uploadGalleryImage('p-1', IMAGE, 'Capture'),
    },
    {
      write: 'updateGalleryImageAlt',
      method: 'PATCH',
      url: `${BASE}/projects/p-1/images/i-1`,
      call: (g): Observable<unknown> => g.updateGalleryImageAlt('p-1', 'i-1', 'Capture'),
    },
    {
      write: 'reorderGallery',
      method: 'PUT',
      url: `${BASE}/projects/p-1/images/order`,
      call: (g): Observable<unknown> => g.reorderGallery('p-1', ['i-2', 'i-1']),
    },
    {
      write: 'deleteGalleryImage',
      method: 'DELETE',
      url: `${BASE}/projects/p-1/images/i-1`,
      call: (g): Observable<unknown> => g.deleteGalleryImage('p-1', 'i-1'),
    },
  ])(
    'Given the API answers 500 When $write is called Then no toast is shown and the caller still receives the error',
    async ({ method, url, call }) => {
      const { gateway, httpController } = configureWithToasts();

      expect(await toastsOnFailure(call(gateway), httpController, method, url)).toEqual({
        status: 500,
        toasts: 0,
      });
      httpController.verify();
    },
  );

  it('Given the public detail page reads a project When the API answers 500 Then the interceptor still shows its toast', async () => {
    const { gateway, httpController } = configureWithToasts();

    expect(
      await toastsOnFailure(
        gateway.getProjectById('p-1'),
        httpController,
        'GET',
        `${BASE}/projects/p-1`,
      ),
    ).toEqual({ status: 500, toasts: 1 });
    httpController.verify();
  });
});
