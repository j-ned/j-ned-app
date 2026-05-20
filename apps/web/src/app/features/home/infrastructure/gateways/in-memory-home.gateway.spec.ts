import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { vi } from 'vitest';
import { PROJECTS_GATEWAY } from '@features/projects/application';
import { InMemoryHomeGateway } from './in-memory-home.gateway';
import { STATIC_HERO, STATIC_HOME_HIGHLIGHTS } from '../data/home.static-data';

describe('InMemoryHomeGateway', () => {
  let gateway: InMemoryHomeGateway;
  const projectsStub = {
    getFeaturedProjects: vi.fn(),
  };

  beforeEach(() => {
    projectsStub.getFeaturedProjects.mockReset();
    projectsStub.getFeaturedProjects.mockReturnValue(of([]));
    TestBed.configureTestingModule({
      providers: [
        InMemoryHomeGateway,
        { provide: PROJECTS_GATEWAY, useValue: projectsStub },
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

  it('getHomeBundle composes hero + highlights + featuredProjects from PROJECTS_GATEWAY', async () => {
    const fakeProjects = [{ id: 1, slug: 'proj-1', title: 'Project 1' } as never];
    projectsStub.getFeaturedProjects.mockReturnValue(of(fakeProjects));

    const result = await firstValueFrom(gateway.getHomeBundle());

    expect(result.hero).toEqual(STATIC_HERO);
    expect(result.highlights).toEqual([...STATIC_HOME_HIGHLIGHTS]);
    expect(result.featuredProjects).toEqual(fakeProjects);
    expect(projectsStub.getFeaturedProjects).toHaveBeenCalledOnce();
  });

  it('invalidateBundle is a no-op (no error)', () => {
    expect(() => gateway.invalidateBundle()).not.toThrow();
  });
});
