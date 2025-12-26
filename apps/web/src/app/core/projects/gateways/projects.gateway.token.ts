import { InjectionToken } from '@angular/core';
import type { ProjectsGateway } from './projects.gateway';

export const PROJECTS_GATEWAY = new InjectionToken<ProjectsGateway>('ProjectsGateway', {
  providedIn: 'root',
  factory: () => {
    throw new Error('ProjectsGateway must be provided in app.config.ts');
  },
});
