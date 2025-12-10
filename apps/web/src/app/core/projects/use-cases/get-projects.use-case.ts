import { inject, Injectable } from '@angular/core';
import { PROJECTS_GATEWAY } from '../gateways';

@Injectable({ providedIn: 'root' })
export class GetProjectsUseCase {
  private gateway = inject(PROJECTS_GATEWAY);

  execute() {
    return this.gateway.getAllProjects();
  }
}
