import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, afterEach } from 'vitest';

import { API_BASE_URL } from '@shared/api';
import { HttpBookingGateway } from './http-booking.gateway';
import type { Booking, BookingFormData, DisabledDate } from '../../domain';

const BASE = '/api';

function configure(): { gateway: HttpBookingGateway; httpController: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      HttpBookingGateway,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: BASE },
    ],
  });
  return {
    gateway: TestBed.inject(HttpBookingGateway),
    httpController: TestBed.inject(HttpTestingController),
  };
}

describe('HttpBookingGateway', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('Public — 3 tests', () => {
    it('getBookedSlots(month) émet GET /<base>/bookings/slots avec query month, retourne Booking[]', async () => {
      const { gateway, httpController } = configure();
      const expected: Booking[] = [
        {
          id: 'uuid-1',
          date: '2026-04-15',
          startTime: '14:30',
          duration: 60,
          name: 'Alice',
          email: 'a@b.c',
          phone: '0612345678',
          subject: 'Demo',
          message: 'Hello',
          createdAt: '2026-04-10T10:00:00Z',
        },
      ];

      const promise = firstValueFrom(gateway.getBookedSlots('2026-04'));

      const req = httpController.expectOne(
        (r) => r.url === `${BASE}/bookings/slots` && r.params.get('month') === '2026-04',
      );
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('submitBooking(data) émet POST /<base>/bookings, retourne BookingSubmission', async () => {
      const { gateway, httpController } = configure();
      const data: BookingFormData = {
        date: '2026-04-15',
        startTime: '14:30',
        duration: 60,
        name: 'Alice',
        email: 'a@b.c',
        phone: '0612345678',
        subject: 'Demo',
        message: 'Hello',
      };

      const promise = firstValueFrom(gateway.submitBooking(data));

      const req = httpController.expectOne(`${BASE}/bookings`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      req.flush({ success: true, message: 'Réservation enregistrée' });

      const result = await promise;
      expect(result).toEqual({ success: true, message: 'Réservation enregistrée' });
      httpController.verify();
    });

    it('getDisabledDates() émet GET /<base>/bookings/disabled-dates, retourne DisabledDate[]', async () => {
      const { gateway, httpController } = configure();
      const expected: DisabledDate[] = [{ id: 'uuid-1', date: '2026-05-01', reason: 'Férié' }];

      const promise = firstValueFrom(gateway.getDisabledDates());

      const req = httpController.expectOne(`${BASE}/bookings/disabled-dates`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });
  });

  describe('Admin — 5 tests', () => {
    it('getAllBookings() émet GET /<base>/bookings, extract res.data', async () => {
      const { gateway, httpController } = configure();
      const bookings: Booking[] = [
        {
          id: 'uuid-1',
          date: '2026-04-15',
          startTime: '14:30',
          duration: 60,
          name: 'Alice',
          email: 'a@b.c',
          phone: '0612345678',
          subject: 'Demo',
          message: 'Hello',
          createdAt: '2026-04-10T10:00:00Z',
        },
      ];

      const promise = firstValueFrom(gateway.getAllBookings());

      const req = httpController.expectOne(`${BASE}/bookings`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: bookings });

      const result = await promise;
      expect(result).toEqual(bookings);
      httpController.verify();
    });

    it('updateBookingStatus(id, status) émet PATCH /<base>/bookings/:id avec body { status }', async () => {
      const { gateway, httpController } = configure();

      const promise = firstValueFrom(gateway.updateBookingStatus('uuid-42', 'confirmed'));

      const req = httpController.expectOne(`${BASE}/bookings/uuid-42`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'confirmed' });
      req.flush({ id: 'uuid-42', status: 'confirmed' });

      await promise;
      httpController.verify();
    });

    it('deleteBooking(id) émet DELETE /<base>/bookings/:id', async () => {
      const { gateway, httpController } = configure();

      const promise = firstValueFrom(gateway.deleteBooking('uuid-42'));

      const req = httpController.expectOne(`${BASE}/bookings/uuid-42`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      await promise;
      httpController.verify();
    });

    it('addDisabledDate(date) émet POST /<base>/bookings/disabled-dates avec body', async () => {
      const { gateway, httpController } = configure();
      const payload = { date: '2026-05-01', reason: 'Congés' };

      const promise = firstValueFrom(gateway.addDisabledDate(payload));

      const req = httpController.expectOne(`${BASE}/bookings/disabled-dates`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ id: 'uuid-5', ...payload });

      const result = await promise;
      expect(result).toEqual({ id: 'uuid-5', ...payload });
      httpController.verify();
    });

    it('removeDisabledDate(id) émet DELETE /<base>/bookings/disabled-dates/:id', async () => {
      const { gateway, httpController } = configure();

      const promise = firstValueFrom(gateway.removeDisabledDate('uuid-5'));

      const req = httpController.expectOne(`${BASE}/bookings/disabled-dates/uuid-5`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      await promise;
      httpController.verify();
    });
  });
});
