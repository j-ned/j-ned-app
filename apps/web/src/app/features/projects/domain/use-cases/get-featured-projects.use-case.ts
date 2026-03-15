import type { Observable } from 'rxjs';
import type { Project } from '../models';
import type { ProjectsGateway } from '../gateways';

export function getFeaturedProjects(gateway: ProjectsGateway): Observable<readonly Project[]> {
  return gateway.getFeaturedProjects();
}
