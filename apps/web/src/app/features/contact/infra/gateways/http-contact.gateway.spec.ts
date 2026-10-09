import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, afterEach, vi } from 'vitest';

import { API_BASE_URL } from '@shared/api/api-config';
import { ToastStore } from '@core/notifications/toast-store';
import { errorToastInterceptor } from '@core/interceptors/error-toast';
import { HttpContactGateway } from './http-contact.gateway';
import type { ContactFormData } from '../../domain/models/contact-form.model';
import type { ContactMessage } from '../../domain/models/contact-message.model';

const BASE = '/api';

function configure(): { gateway: HttpContactGateway; httpController: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      HttpContactGateway,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: BASE },
    ],
  });
  return {
    gateway: TestBed.inject(HttpContactGateway),
    httpController: TestBed.inject(HttpTestingController),
  };
}

describe('HttpContactGateway', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('Public: 1 test', () => {
    it('submitContactForm() retourne success:true sur 201 quel que soit le body backend', async () => {
      const { gateway, httpController } = configure();
      const data: ContactFormData = {
        name: 'Test',
        email: 'test@example.com',
        subject: 'Hello',
        message: 'Hi there',
      };

      const promise = firstValueFrom(gateway.submitContactForm(data));

      const req = httpController.expectOne(`${BASE}/contact/messages`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      // Backend renvoie l'entité ContactMessage complète : la gateway l'ignore
      // et produit un ContactFormSubmission stable côté domain.
      req.flush(
        {
          id: 'uuid-1',
          name: 'Test',
          email: 'test@example.com',
          subject: 'Hello',
          message: 'Hi there',
          read: false,
          createdAt: '2026-05-07',
        },
        { status: 201, statusText: 'Created' },
      );

      const result = await promise;
      expect(result).toEqual({
        success: true,
        message: 'Votre message a bien été envoyé. Je reviens vers vous rapidement.',
      });
      httpController.verify();
    });

    it.each([
      {
        status: 400,
        expected: 'Certains champs sont invalides. Vérifiez votre saisie et réessayez.',
      },
      {
        status: 429,
        expected: 'Trop de tentatives en peu de temps. Patientez une minute avant de réessayer.',
      },
      {
        status: 500,
        expected: 'Le serveur rencontre un souci temporaire. Réessayez dans quelques minutes.',
      },
      {
        status: 502,
        expected: 'Le serveur rencontre un souci temporaire. Réessayez dans quelques minutes.',
      },
      {
        status: 503,
        expected: 'Le serveur rencontre un souci temporaire. Réessayez dans quelques minutes.',
      },
      {
        status: 504,
        expected: 'Le serveur rencontre un souci temporaire. Réessayez dans quelques minutes.',
      },
      {
        status: 418,
        expected:
          "Une erreur inattendue est survenue lors de l'envoi. Réessayez ou contactez-moi par email.",
      },
    ])(
      'submitContactForm() retourne erreur explicite pour HTTP $status',
      async ({ status, expected }) => {
        const { gateway, httpController } = configure();
        const data: ContactFormData = {
          name: 'Test',
          email: 'test@example.com',
          subject: 'Hello',
          message: 'Hi there',
        };

        const promise = firstValueFrom(gateway.submitContactForm(data));

        const req = httpController.expectOne(`${BASE}/contact/messages`);
        req.flush({ message: 'error' }, { status, statusText: 'Error' });

        const result = await promise;
        expect(result).toEqual({ success: false, message: expected });
        httpController.verify();
      },
    );

    it('submitContactForm() retourne erreur réseau pour HTTP status 0', async () => {
      const { gateway, httpController } = configure();
      const data: ContactFormData = {
        name: 'Test',
        email: 'test@example.com',
        subject: 'Hello',
        message: 'Hi there',
      };

      const promise = firstValueFrom(gateway.submitContactForm(data));

      const req = httpController.expectOne(`${BASE}/contact/messages`);
      req.error(new ProgressEvent('error'), { status: 0, statusText: '' });

      const result = await promise;
      expect(result).toEqual({
        success: false,
        message: 'Connexion impossible. Vérifiez votre réseau, puis réessayez dans un instant.',
      });
      httpController.verify();
    });
  });

  describe('Admin: 4 tests', () => {
    it('getAllMessages() émet GET /<base>/contact/messages, extrait res.data', async () => {
      const { gateway, httpController } = configure();
      const messages: ContactMessage[] = [
        {
          id: 1,
          name: 'X',
          email: 'x@y.z',
          subject: 's',
          message: 'm',
          read: false,
          createdAt: '2026-05-03',
        } as ContactMessage,
      ];

      const promise = firstValueFrom(gateway.getAllMessages());

      const req = httpController.expectOne(`${BASE}/contact/messages`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: messages });

      const result = await promise;
      expect(result).toEqual(messages);
      httpController.verify();
    });

    it('markMessageAsRead(id) émet PATCH /<base>/contact/messages/:id/read', async () => {
      const { gateway, httpController } = configure();

      const promise = firstValueFrom(gateway.markMessageAsRead(42));

      const req = httpController.expectOne(`${BASE}/contact/messages/42/read`);
      expect(req.request.method).toBe('PATCH');
      req.flush({ id: 42, isRead: true });

      await promise;
      httpController.verify();
    });

    it('deleteMessage(id) émet DELETE /<base>/contact/messages/:id', async () => {
      const { gateway, httpController } = configure();

      const promise = firstValueFrom(gateway.deleteMessage(42));

      const req = httpController.expectOne(`${BASE}/contact/messages/42`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      await promise;
      httpController.verify();
    });

    it('getUnreadCount() émet GET /<base>/contact/messages/unread-count, extrait res.count', async () => {
      const { gateway, httpController } = configure();

      const promise = firstValueFrom(gateway.getUnreadCount());

      const req = httpController.expectOne(`${BASE}/contact/messages/unread-count`);
      expect(req.request.method).toBe('GET');
      req.flush({ count: 7 });

      const result = await promise;
      expect(result).toBe(7);
      httpController.verify();
    });

    it('markAllRead() émet PATCH /<base>/contact/messages/mark-all-read et mappe { count }', async () => {
      const { gateway, httpController } = configure();

      const promise = firstValueFrom(gateway.markAllRead());

      const req = httpController.expectOne(`${BASE}/contact/messages/mark-all-read`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({});
      req.flush({ count: 3 });

      const result = await promise;
      expect(result).toEqual({ count: 3 });
      httpController.verify();
    });
  });

  describe('Échec de chargement', () => {
    const MESSAGES_URL = `${BASE}/contact/messages`;
    const UNREAD_URL = `${BASE}/contact/messages/unread-count`;
    const settled = <T>(source: Promise<T>): Promise<T | 'error'> =>
      source.then(
        (value) => value,
        () => 'error' as const,
      );

    it('getAllMessages() propage une erreur HTTP au lieu de rendre une liste vide', async () => {
      const { gateway, httpController } = configure();
      const outcome = settled(firstValueFrom(gateway.getAllMessages()));

      httpController.expectOne(MESSAGES_URL).flush('down', { status: 500, statusText: 'Error' });

      expect(await outcome).toBe('error');
      httpController.verify();
    });

    it('getAllMessages() après une erreur : un nouvel abonnement relance la requête', async () => {
      const { gateway, httpController } = configure();
      const failed = settled(firstValueFrom(gateway.getAllMessages()));
      httpController.expectOne(MESSAGES_URL).flush('down', { status: 500, statusText: 'Error' });
      await failed;

      const retried = firstValueFrom(gateway.getAllMessages());
      httpController.expectOne(MESSAGES_URL).flush({ data: [] });

      expect(await retried).toEqual([]);
      httpController.verify();
    });

    it("getUnreadCount() relance la requête une fois puis propage l'erreur au lieu de rendre 0", async () => {
      const { gateway, httpController } = configure();
      const outcome = settled(firstValueFrom(gateway.getUnreadCount()));

      httpController
        .expectOne(UNREAD_URL)
        .flush('down', { status: 503, statusText: 'Unavailable' });
      const retries = httpController.match(UNREAD_URL);
      retries.forEach((request) =>
        request.flush('down', { status: 503, statusText: 'Unavailable' }),
      );

      expect({ retries: retries.length, outcome: await outcome }).toEqual({
        retries: 1,
        outcome: 'error',
      });
      httpController.verify();
    });

    it("getUnreadCount() : un échec n'est pas mis en cache, le prochain abonné relance la requête", async () => {
      const { gateway, httpController } = configure();
      const failed = settled(firstValueFrom(gateway.getUnreadCount()));
      httpController
        .match(UNREAD_URL)
        .forEach((request) => request.flush('down', { status: 500, statusText: 'Error' }));
      httpController
        .match(UNREAD_URL)
        .forEach((request) => request.flush('down', { status: 500, statusText: 'Error' }));
      const first = await failed;

      const next = settled(firstValueFrom(gateway.getUnreadCount()));
      const relaunched = httpController.match(UNREAD_URL);
      relaunched.forEach((request) => request.flush({ count: 4 }));

      expect({ first, relaunched: relaunched.length, next: await next }).toEqual({
        first: 'error',
        relaunched: 1,
        next: 4,
      });
      httpController.verify();
    });

    it('getUnreadCount() partage une seule requête entre deux abonnés simultanés', async () => {
      const { gateway, httpController } = configure();
      const seen: number[] = [];
      const first = gateway.getUnreadCount().subscribe((count) => seen.push(count));
      const second = gateway.getUnreadCount().subscribe((count) => seen.push(count));

      httpController.expectOne(UNREAD_URL).flush({ count: 2 });

      expect(seen).toEqual([2, 2]);
      first.unsubscribe();
      second.unsubscribe();
      httpController.verify();
    });
  });
});

describe('HttpContactGateway: toasts des non-lus avec relance', () => {
  const UNREAD_URL = `${BASE}/contact/messages/unread-count`;

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it.each([
    {
      scenario: 'both attempts fail',
      second: { body: 'down', init: { status: 500, statusText: 'Error' } },
      toasts: 1,
      outcome: 'error',
    },
    {
      scenario: 'the retry succeeds',
      second: { body: { count: 4 }, init: { status: 200, statusText: 'OK' } },
      toasts: 0,
      outcome: 4,
    },
  ])(
    'Given the unread count answers 500 When $scenario Then the visitor sees $toasts error toast(s)',
    async ({ second, toasts, outcome }) => {
      const add = vi.fn();
      TestBed.configureTestingModule({
        providers: [
          HttpContactGateway,
          provideHttpClient(withInterceptors([errorToastInterceptor])),
          provideHttpClientTesting(),
          { provide: API_BASE_URL, useValue: BASE },
          { provide: ToastStore, useValue: { add } },
        ],
      });
      const gateway = TestBed.inject(HttpContactGateway);
      const httpController = TestBed.inject(HttpTestingController);
      const result = firstValueFrom(gateway.getUnreadCount()).then(
        (count) => count,
        () => 'error' as const,
      );

      httpController.expectOne(UNREAD_URL).flush('down', { status: 500, statusText: 'Error' });
      httpController.expectOne(UNREAD_URL).flush(second.body, second.init);

      expect({ toasts: add.mock.calls.length, outcome: await result }).toEqual({
        toasts,
        outcome,
      });
      httpController.verify();
    },
  );
});

describe('HttpContactGateway: lecture des messages derrière l’intercepteur de toasts', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('Given the messages answer 500 When the admin reads them Then no toast is shown and the caller still receives the error', async () => {
    const add = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        HttpContactGateway,
        provideHttpClient(withInterceptors([errorToastInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: ToastStore, useValue: { add } },
      ],
    });
    const gateway = TestBed.inject(HttpContactGateway);
    const httpController = TestBed.inject(HttpTestingController);
    const outcome = firstValueFrom(gateway.getAllMessages()).then(
      () => 'read',
      () => 'error',
    );

    httpController
      .expectOne(`${BASE}/contact/messages`)
      .flush('down', { status: 500, statusText: 'Error' });

    expect({ toasts: add.mock.calls.length, outcome: await outcome }).toEqual({
      toasts: 0,
      outcome: 'error',
    });
    httpController.verify();
  });
});
