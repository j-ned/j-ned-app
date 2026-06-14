import { Injectable, inject } from '@angular/core';
import { defer, map, of, type Observable } from 'rxjs';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { HomeGateway } from '../../domain/gateways/home.gateway';
import type { HeroData } from '../../domain/models/hero.model';
import type { HomeBundle } from '../../domain/models/home-bundle.model';
import type { HomeHighlight } from '../../domain/models/home-highlight.model';
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
    // Hero/highlights sont statiques, mais `featuredProjects` vient du HTTP
    // (`ProjectsGateway`) : on invalide ce flux pour que la landing reflète
    // les mutations admin (create/update/delete) sans reload.
    this.projectsGateway.invalidateFeatured();
  }

  getHeroData(): Observable<HeroData> {
    return defer(() => of(STATIC_HERO));
  }

  getHomeHighlights(): Observable<readonly HomeHighlight[]> {
    return defer(() => of([...STATIC_HOME_HIGHLIGHTS]));
  }
}
