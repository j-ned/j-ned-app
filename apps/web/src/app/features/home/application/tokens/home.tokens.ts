import { InjectionToken } from '@angular/core';
import type { HomeGateway } from '@features/home/domain';

export const HOME_GATEWAY = new InjectionToken<HomeGateway>('HomeGateway', {
  providedIn: 'root',
  factory: (): never => {
    throw new Error('HomeGateway must be provided in app.config.ts');
  },
});
