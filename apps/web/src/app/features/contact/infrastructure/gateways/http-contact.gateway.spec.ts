import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, afterEach } from 'vitest';

import { API_BASE_URL } from '@shared/api';
import { HttpContactGateway } from './http-contact.gateway';
import type {
  ContactFormData,
  ContactMessage,
} from '../../domain';

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

  describe('Public — 3 tests', () => {
    it('getContactInfo() émet GET /<base>/contact/info, retourne {email, phone, location}', async () => {
      const { gateway, httpController } = configure();

      const promise = firstValueFrom(gateway.getContactInfo());

      const req = httpController.expectOne(`${BASE}/contact/info`);
      expect(req.request.method).toBe('GET');
      req.flush({ email: 'a@b.c', phone: '+33 6 00 00 00 00', location: 'Paris' });

      const result = await promise;
      expect(result).toEqual({ email: 'a@b.c', phone: '+33 6 00 00 00 00', location: 'Paris' });
      httpController.verify();
    });

    it('getSocialLinks() émet GET /<base>/social-links, retourne SocialLinks via toSocialLinks mapping', async () => {
      const { gateway, httpController } = configure();

      const promise = firstValueFrom(gateway.getSocialLinks());

      const req = httpController.expectOne(`${BASE}/social-links`);
      expect(req.request.method).toBe('GET');
      req.flush([
        { id: '1', icon: 'github', label: 'GitHub', href: 'https://github.com/foo' },
        { id: '2', icon: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com/in/foo' },
      ]);

      const result = await promise;
      expect(result.github.url).toBe('https://github.com/foo');
      expect(result.linkedin.url).toBe('https://linkedin.com/in/foo');
      httpController.verify();
    });

    it('submitContactForm({name,email,subject,message}) émet POST /<base>/contact/messages', async () => {
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
      req.flush({ success: true, message: 'Message envoyé' });

      const result = await promise;
      expect(result).toEqual({ success: true, message: 'Message envoyé' });
      httpController.verify();
    });
  });

  describe('Admin — 4 tests', () => {
    it('getAllMessages() émet GET /<base>/contact/messages, extrait res.data', async () => {
      const { gateway, httpController } = configure();
      const messages: ContactMessage[] = [
        { id: 1, name: 'X', email: 'x@y.z', subject: 's', message: 'm', read: false, createdAt: '2026-05-03' } as ContactMessage,
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
  });
});
