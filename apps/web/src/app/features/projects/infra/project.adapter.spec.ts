import { toProject, toProjectImage } from './project.adapter';
import type { ProjectDto } from './project.types';

const API_URL = 'https://api.test/api';

type ProjectImageDto = NonNullable<ProjectDto['gallery']>[number];

function imageDto(overrides: Partial<ProjectImageDto> = {}): ProjectImageDto {
  return {
    id: 'img-1',
    url: '/storage/portfolio-storage/project-images/img-1-0a1b2c3d.avif',
    alt: 'Tableau de bord du mois en cours',
    width: 1600,
    height: 1000,
    order: 0,
    ...overrides,
  };
}

function dto(overrides: Partial<ProjectDto> = {}): ProjectDto {
  return {
    id: 'uuid-1',
    title: 'DashFlow',
    slug: 'dashflow',
    category: 'Application Web',
    tags: ['Angular', 'NestJS'],
    description: 'Budget et santé du foyer.',
    image: '/storage/portfolio-storage/projects/uuid-1-fb6c30aa.avif',
    techChoices: [{ techno: 'Angular', why: 'Signals' }],
    architectureDecisions: [{ decision: 'Chiffrement côté client', rationale: 'Opaque' }],
    liveUrl: 'https://dashflow.nedellec-julien.fr',
    repoUrl: null,
    featured: true,
    order: 1,
    kind: 'production',
    gallery: [],
    ...overrides,
  };
}

describe('toProject', () => {
  it('Given a complete API project When adapted Then every field is kept and the cover URL is resolved against the API', () => {
    expect(toProject(dto(), API_URL)).toEqual({
      id: 'uuid-1',
      title: 'DashFlow',
      slug: 'dashflow',
      category: 'Application Web',
      tags: ['Angular', 'NestJS'],
      description: 'Budget et santé du foyer.',
      image: 'https://api.test/api/storage/portfolio-storage/projects/uuid-1-fb6c30aa.avif',
      techChoices: [{ techno: 'Angular', why: 'Signals' }],
      architectureDecisions: [{ decision: 'Chiffrement côté client', rationale: 'Opaque' }],
      liveUrl: 'https://dashflow.nedellec-julien.fr',
      repoUrl: null,
      featured: true,
      order: 1,
      kind: 'production',
      gallery: [],
    });
  });

  describe('cover image', () => {
    it.each([
      {
        label: 'an absolute URL',
        image: 'https://cdn.test/cover.avif',
        expected: 'https://cdn.test/cover.avif',
      },
      { label: 'no image', image: '', expected: '' },
    ])('Given $label When adapted Then the image is left as is', ({ image, expected }) => {
      expect(toProject(dto({ image }), API_URL).image).toBe(expected);
    });
  });

  describe('kind', () => {
    it.each(['production', 'demo', 'script'] as const)(
      'Given the kind %j When adapted Then the project keeps it',
      (kind) => {
        expect(toProject(dto({ kind }), API_URL).kind).toBe(kind);
      },
    );

    it.each([
      { label: 'an unknown kind', kind: 'client' },
      { label: 'a kind with the wrong case', kind: 'Demo' },
      { label: 'an empty kind', kind: '' },
    ])('Given $label When adapted Then the kind is null, never guessed', ({ kind }) => {
      expect(toProject(dto({ kind }), API_URL).kind).toBeNull();
    });

    it('Given an API that does not send the kind yet When adapted Then the kind is null', () => {
      const { kind: _kind, ...withoutKind } = dto();

      expect(toProject(withoutKind, API_URL).kind).toBeNull();
    });

    it('Given a project shaped like a script When its kind is missing Then nothing is inferred from category or links', () => {
      const { kind: _kind, ...withoutKind } = dto({ category: 'Script', liveUrl: null });

      expect(toProject(withoutKind, API_URL).kind).toBeNull();
    });
  });

  describe('gallery', () => {
    it('Given an API that does not send the gallery yet When adapted Then the gallery is empty', () => {
      const { gallery: _gallery, ...withoutGallery } = dto();

      expect(toProject(withoutGallery, API_URL).gallery).toEqual([]);
    });

    it('Given an empty gallery When adapted Then the gallery is empty', () => {
      expect(toProject(dto({ gallery: [] }), API_URL).gallery).toEqual([]);
    });
  });
});

describe('toProjectImage', () => {
  it('Given an API capture with a relative URL When adapted Then it becomes a domain image with an absolute src and no order', () => {
    expect(toProjectImage(imageDto(), API_URL)).toEqual({
      id: 'img-1',
      src: 'https://api.test/api/storage/portfolio-storage/project-images/img-1-0a1b2c3d.avif',
      alt: 'Tableau de bord du mois en cours',
      width: 1600,
      height: 1000,
    });
  });

  it('Given an API capture with an absolute URL When adapted Then the src is left as is', () => {
    expect(toProjectImage(imageDto({ url: 'https://cdn.test/capture.avif' }), API_URL).src).toBe(
      'https://cdn.test/capture.avif',
    );
  });
});

describe('toProject: filled gallery', () => {
  it('Given captures received out of order When adapted Then the gallery follows their order, each capture adapted', () => {
    const gallery = [
      imageDto({ id: 'third', url: '/storage/c.avif', alt: 'Troisième', order: 2 }),
      imageDto({ id: 'first', url: '/storage/a.avif', alt: 'Première', order: 0, width: 800 }),
      imageDto({ id: 'second', url: '/storage/b.avif', alt: 'Deuxième', order: 1, height: 600 }),
    ];

    expect(toProject(dto({ gallery }), API_URL).gallery).toEqual([
      {
        id: 'first',
        src: 'https://api.test/api/storage/a.avif',
        alt: 'Première',
        width: 800,
        height: 1000,
      },
      {
        id: 'second',
        src: 'https://api.test/api/storage/b.avif',
        alt: 'Deuxième',
        width: 1600,
        height: 600,
      },
      {
        id: 'third',
        src: 'https://api.test/api/storage/c.avif',
        alt: 'Troisième',
        width: 1600,
        height: 1000,
      },
    ]);
  });

  it('Given captures sharing the same order When adapted Then they keep the order the API sent them in', () => {
    const gallery = [
      imageDto({ id: 'b', order: 1 }),
      imageDto({ id: 'a', order: 1 }),
      imageDto({ id: 'z', order: 0 }),
    ];

    expect(toProject(dto({ gallery }), API_URL).gallery.map((image) => image.id)).toEqual([
      'z',
      'b',
      'a',
    ]);
  });

  it('Given a gallery When adapted Then the received DTO is left untouched', () => {
    const gallery = [imageDto({ id: 'b', order: 1 }), imageDto({ id: 'a', order: 0 })];

    toProject(dto({ gallery }), API_URL);

    expect(gallery.map((image) => image.id)).toEqual(['b', 'a']);
  });
});
