import { InjectionToken } from '@angular/core';
import type { BlogGateway } from './blog.gateway';

export const BLOG_GATEWAY = new InjectionToken<BlogGateway>('BlogGateway', {
  providedIn: 'root',
  factory: (): never => {
    throw new Error('BlogGateway must be provided in app.config.ts');
  },
});
