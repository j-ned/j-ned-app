import { Injectable, inject } from '@angular/core';
import { catchError, combineLatest, map, of, type Observable } from 'rxjs';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import { latestPosts } from '@features/blog/domain/latest-posts';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { HomeGateway } from '../../domain/gateways/home.gateway';
import type { HomeBundle } from '../../domain/models/home-bundle.model';
import { STATIC_HERO } from '../data/home.static-data';

const LATEST_POSTS_COUNT = 3;

@Injectable()
export class InMemoryHomeGateway extends HomeGateway {
  private readonly projectsGateway = inject(ProjectsGateway);
  private readonly blogGateway = inject(BlogGateway);

  getHomeBundle(): Observable<HomeBundle> {
    // Le hero est statique : un échec des projets ou des articles ne doit pas le laisser en squelette,
    // ni priver la home de l'autre source. `combineLatest` et non `forkJoin` : la liste des projets
    // ne se termine jamais (elle réémet après une invalidation de l'admin).
    return combineLatest({
      featuredProjects: this.projectsGateway.getFeaturedProjects().pipe(catchError(() => of([]))),
      posts: this.blogGateway.getPublishedPosts().pipe(catchError(() => of([]))),
    }).pipe(
      map(({ featuredProjects, posts }) => ({
        hero: STATIC_HERO,
        featuredProjects: [...featuredProjects],
        latestPosts: latestPosts(posts, LATEST_POSTS_COUNT),
      })),
    );
  }

  invalidateBundle(): void {
    this.projectsGateway.invalidateFeatured();
  }
}
