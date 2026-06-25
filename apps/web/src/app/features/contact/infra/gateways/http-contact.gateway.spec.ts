import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, afterEach } from 'vitest';

import { API_BASE_URL } from '@shared/api/api-config';
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

  describe('Public — 1 test', () => {
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
        message: 'Votre message a bien été envoyé — je reviens vers vous rapidement.',
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
        message: 'Connexion impossible — vérifiez votre réseau, puis réessayez dans un instant.',
      });
      httpController.verify();
    });
  });

  describe('Admin — 4 tests', () => {
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
});
