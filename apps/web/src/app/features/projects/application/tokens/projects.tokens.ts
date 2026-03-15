import { InjectionToken } from '@angular/core';
import type { ProjectsGateway } from '@features/projects/domain';

export const PROJECTS_GATEWAY = new InjectionToken<ProjectsGateway>('ProjectsGateway', {
  providedIn: 'root',
  factory: (): never => {
    throw new Error('ProjectsGateway must be provided in app.config.ts');
  },
});
