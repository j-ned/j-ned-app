import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { InMemoryHomeGateway } from '@features/home/infra/gateways/in-memory-home.gateway';
import { STATIC_HERO } from '../data/home.static-data';

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
      providers: [InMemoryHomeGateway, { provide: ProjectsGateway, useValue: projectsStub }],
    });
    gateway = TestBed.inject(InMemoryHomeGateway);
  });

  it('getHomeBundle composes the static hero and the featured projects from ProjectsGateway, nothing else', async () => {
    const fakeProjects = [{ id: 1, slug: 'proj-1', title: 'Project 1' } as never];
    projectsStub.getFeaturedProjects.mockReturnValue(of(fakeProjects));

    const result = await firstValueFrom(gateway.getHomeBundle());

    expect(result).toEqual({ hero: STATIC_HERO, featuredProjects: fakeProjects });
    expect(projectsStub.getFeaturedProjects).toHaveBeenCalledOnce();
  });

  it('Given the featured projects request fails When the bundle is read Then it still carries the static hero, with no project', async () => {
    projectsStub.getFeaturedProjects.mockReturnValue(throwError(() => new Error('502')));

    const result = await firstValueFrom(gateway.getHomeBundle());

    expect(result).toEqual({ hero: STATIC_HERO, featuredProjects: [] });
  });

  it('invalidateBundle délègue à ProjectsGateway.invalidateFeatured (rafraîchit la donnée dynamique)', () => {
    gateway.invalidateBundle();
    expect(projectsStub.invalidateFeatured).toHaveBeenCalledOnce();
  });
});
