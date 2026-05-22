import { Injectable, inject } from '@angular/core';
import { defer, map, of, type Observable } from 'rxjs';
import { ProjectsGateway } from '@features/projects/domain';
import { HomeGateway, type HeroData, type HomeBundle, type HomeHighlight } from '../../domain';
import { STATIC_HERO, STATIC_HOME_HIGHLIGHTS } from '../data/home.static-data';

@Injectable()
export class InMemoryHomeGateway extends HomeGateway {
  private readonly projectsGateway = inject(ProjectsGateway);

  getHomeBundle(): Observable<HomeBundle> {
    return this.projectsGateway.getFeaturedProjects().pipe(
      map((featuredProjects) => ({
        hero: STATIC_HERO,
        highlights: [...STATIC_HOME_HIGHLIGHTS],
        featuredProjects: [...featuredProjects],
      })),
    );
  }

  invalidateBundle(): void {
    // No-op: static data, no cache to invalidate.
  }

  getHeroData(): Observable<HeroData> {
    return defer(() => of(STATIC_HERO));
  }

  getHomeHighlights(): Observable<readonly HomeHighlight[]> {
    return defer(() => of([...STATIC_HOME_HIGHLIGHTS]));
  }
}
