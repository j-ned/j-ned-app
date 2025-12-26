import { InjectionToken } from '@angular/core';
import type { ProfileGateway } from './profile.gateway';

export const PROFILE_GATEWAY = new InjectionToken<ProfileGateway>('ProfileGateway', {
  providedIn: 'root',
  factory: () => {
    throw new Error('ProfileGateway must be provided in app.config.ts');
  },
});
