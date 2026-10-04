import { Injectable, inject } from '@angular/core';
import { defer, map, of, type Observable } from 'rxjs';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { HomeGateway } from '../../domain/gateways/home.gateway';
import type { HeroData } from '../../domain/models/hero.model';
import type { HomeBundle } from '../../domain/models/home-bundle.model';
import { STATIC_HERO } from '../data/home.static-data';

@Injectable()
export class InMemoryHomeGateway extends HomeGateway {
  private readonly projectsGateway = inject(ProjectsGateway);

  getHomeBundle(): Observable<HomeBundle> {
    return this.projectsGateway.getFeaturedProjects().pipe(
      map((featuredProjects) => ({
        hero: STATIC_HERO,
        featuredProjects: [...featuredProjects],
      })),
    );
  }

  invalidateBundle(): void {
    this.projectsGateway.invalidateFeatured();
  }

  getHeroData(): Observable<HeroData> {
    return defer(() => of(STATIC_HERO));
  }
}
