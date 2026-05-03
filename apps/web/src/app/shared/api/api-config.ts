import { InjectionToken } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: (): never => {
    throw new Error('API_BASE_URL must be provided in app.config.ts');
  },
});
