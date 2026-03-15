import { InjectionToken } from '@angular/core';
import type { BookingGateway } from '@features/booking/domain';

export const BOOKING_GATEWAY = new InjectionToken<BookingGateway>('BookingGateway', {
  providedIn: 'root',
  factory: (): never => {
    throw new Error('BookingGateway must be provided in app.config.ts');
  },
});
