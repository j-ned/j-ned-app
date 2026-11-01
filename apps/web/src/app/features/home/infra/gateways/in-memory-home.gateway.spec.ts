import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { InMemoryHomeGateway } from '@features/home/infra/gateways/in-memory-home.gateway';
import { STATIC_HERO } from '../data/home.static-data';

describe('InMemoryHomeGateway', () => {
  let gateway: InMemoryHomeGateway;
  const projectsStub = {
    getFeaturedProjects: vi.fn(),
    invalidateFeatured: vi.fn(),
  };
  const blogStub = { getPublishedPosts: vi.fn() };

  beforeEach(() => {
    projectsStub.getFeaturedProjects.mockReset();
    projectsStub.getFeaturedProjects.mockReturnValue(of([]));
    projectsStub.invalidateFeatured.mockReset();
    blogStub.getPublishedPosts.mockReset();
    blogStub.getPublishedPosts.mockReturnValue(of([]));
    TestBed.configureTestingModule({
      providers: [
        InMemoryHomeGateway,
        { provide: ProjectsGateway, useValue: projectsStub },
        { provide: BlogGateway, useValue: blogStub },
      ],
    });
    gateway = TestBed.inject(InMemoryHomeGateway);
  });

  it('getHomeBundle composes the static hero, the featured projects and the latest posts, nothing else', async () => {
    const fakeProjects = [{ id: 1, slug: 'proj-1', title: 'Project 1' } as never];
    const post = makeBlogPost({ slug: 'a', publishedAt: '2026-09-01T08:00:00Z' });
    projectsStub.getFeaturedProjects.mockReturnValue(of(fakeProjects));
    blogStub.getPublishedPosts.mockReturnValue(of([post]));

    const result = await firstValueFrom(gateway.getHomeBundle());

    expect(result).toEqual({
      hero: STATIC_HERO,
      featuredProjects: fakeProjects,
      latestPosts: [post],
    });
    expect([
      projectsStub.getFeaturedProjects.mock.calls.length,
      blogStub.getPublishedPosts.mock.calls.length,
    ]).toEqual([1, 1]);
  });

  it('Given more than three published posts When the bundle is read Then only the three newest are kept, newest first', async () => {
    blogStub.getPublishedPosts.mockReturnValue(
      of(
        ['2026-01-01', '2026-04-01', '2026-02-01', '2026-03-01'].map((day) =>
          makeBlogPost({ slug: day, publishedAt: `${day}T08:00:00Z` }),
        ),
      ),
    );

    const { latestPosts } = await firstValueFrom(gateway.getHomeBundle());

    expect(latestPosts.map((p) => p.slug)).toEqual(['2026-04-01', '2026-03-01', '2026-02-01']);
  });

  it.each([
    ['the featured projects', 'projects'],
    ['the published posts', 'posts'],
  ] as const)(
    'Given %s request fails When the bundle is read Then it still carries the static hero and the other source',
    async (_label, failing) => {
      const post = makeBlogPost({ slug: 'a', publishedAt: '2026-09-01T08:00:00Z' });
      const project = { id: 1 } as never;
      projectsStub.getFeaturedProjects.mockReturnValue(
        failing === 'projects' ? throwError(() => new Error('502')) : of([project]),
      );
      blogStub.getPublishedPosts.mockReturnValue(
        failing === 'posts' ? throwError(() => new Error('502')) : of([post]),
      );

      const result = await firstValueFrom(gateway.getHomeBundle());

      expect(result).toEqual({
        hero: STATIC_HERO,
        featuredProjects: failing === 'projects' ? [] : [project],
        latestPosts: failing === 'posts' ? [] : [post],
      });
    },
  );

  it('Given a featured projects stream that never completes When the bundle is read Then it is still emitted', async () => {
    // Reproduit `allProjects$` (ReplaySubject partagé, jamais complété) : un forkJoin n'émettrait jamais.
    projectsStub.getFeaturedProjects.mockReturnValue(new BehaviorSubject<readonly never[]>([]));

    const result = await firstValueFrom(gateway.getHomeBundle());

    expect(result).toEqual({ hero: STATIC_HERO, featuredProjects: [], latestPosts: [] });
  });

  it('invalidateBundle délègue à ProjectsGateway.invalidateFeatured (rafraîchit la donnée dynamique)', () => {
    gateway.invalidateBundle();
    expect(projectsStub.invalidateFeatured).toHaveBeenCalledOnce();
  });
});
