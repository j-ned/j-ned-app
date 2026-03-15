import { InjectionToken } from '@angular/core';
import type { ContactGateway } from '@features/contact/domain';

export const CONTACT_GATEWAY = new InjectionToken<ContactGateway>('ContactGateway', {
  providedIn: 'root',
  factory: (): never => {
    throw new Error('ContactGateway must be provided in app.config.ts');
  },
});
