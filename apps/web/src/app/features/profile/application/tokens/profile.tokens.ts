import { InjectionToken } from '@angular/core';
import type { ProfileGateway } from '@features/profile/domain';

export const PROFILE_GATEWAY = new InjectionToken<ProfileGateway>('ProfileGateway', {
  providedIn: 'root',
  factory: (): never => {
    throw new Error('ProfileGateway must be provided in app.config.ts');
  },
});
