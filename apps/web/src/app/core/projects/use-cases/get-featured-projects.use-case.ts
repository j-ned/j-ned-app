import { inject, Injectable } from '@angular/core';
import { PROJECTS_GATEWAY } from '../gateways';

@Injectable({ providedIn: 'root' })
export class GetFeaturedProjectsUseCase {
  private gateway = inject(PROJECTS_GATEWAY);

  execute() {
    return this.gateway.getFeaturedProjects();
  }
}
