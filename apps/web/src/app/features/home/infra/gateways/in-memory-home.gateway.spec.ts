import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { vi } from 'vitest';
import { ProjectsGateway } from '@features/projects/domain';
import { InMemoryHomeGateway } from '@features/home/infra';
import { STATIC_HERO, STATIC_HOME_HIGHLIGHTS } from '../data/home.static-data';

describe('InMemoryHomeGateway', () => {
  let gateway: InMemoryHomeGateway;
  const projectsStub = {
    getFeaturedProjects: vi.fn(),
    invalidateFeatured: vi.fn(),
  };

  beforeEach(() => {
    projectsStub.getFeaturedProjects.mockReset();
    projectsStub.getFeaturedProjects.mockReturnValue(of([]));
    projectsStub.invalidateFeatured.mockReset();
    TestBed.configureTestingModule({
      providers: [
        InMemoryHomeGateway,
        { provide: ProjectsGateway, useValue: projectsStub },
      ],
    });
    gateway = TestBed.inject(InMemoryHomeGateway);
  });

  it('getHeroData returns the static hero', async () => {
    const result = await firstValueFrom(gateway.getHeroData());
    expect(result).toEqual(STATIC_HERO);
  });

  it('getHomeHighlights returns the static highlights', async () => {
    const result = await firstValueFrom(gateway.getHomeHighlights());
    expect(result).toEqual([...STATIC_HOME_HIGHLIGHTS]);
  });

  it('getHomeBundle composes hero + highlights + featuredProjects from ProjectsGateway', async () => {
    const fakeProjects = [{ id: 1, slug: 'proj-1', title: 'Project 1' } as never];
    projectsStub.getFeaturedProjects.mockReturnValue(of(fakeProjects));

    const result = await firstValueFrom(gateway.getHomeBundle());

    expect(result.hero).toEqual(STATIC_HERO);
    expect(result.highlights).toEqual([...STATIC_HOME_HIGHLIGHTS]);
    expect(result.featuredProjects).toEqual(fakeProjects);
    expect(projectsStub.getFeaturedProjects).toHaveBeenCalledOnce();
  });

  it('invalidateBundle délègue à ProjectsGateway.invalidateFeatured (rafraîchit la donnée dynamique)', () => {
    gateway.invalidateBundle();
    expect(projectsStub.invalidateFeatured).toHaveBeenCalledOnce();
  });
});
