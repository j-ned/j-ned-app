import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { PROJECTS_GATEWAY } from '../gateways';
import type { Project } from '../models';

@Injectable({ providedIn: 'root' })
export class GetFeaturedProjectsUseCase {
  private gateway = inject(PROJECTS_GATEWAY);

  execute(): Observable<readonly Project[]> {
    return this.gateway.getFeaturedProjects();
  }
}
