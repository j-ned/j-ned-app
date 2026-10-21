import { describe, it, expect } from 'vitest';
import { PROJECT_TAGS, projectTagOf } from './project-tag.model';
import { blogTagCategory } from './blog-tag.model';

describe('PROJECT_TAGS', () => {
  it('maps each project tag of the catalogue to the slug of its public page', () => {
    expect(PROJECT_TAGS).toEqual([
      { tag: 'DashFlow', projectSlug: 'dashflow' },
      { tag: 'CandiDash', projectSlug: 'candidash' },
      { tag: 'Portfolio', projectSlug: 'portfolio' },
    ]);
  });

  it.each(PROJECT_TAGS.map(({ tag }) => tag))(
    'Given the project tag "%s" When its theme is read Then it belongs to the projects theme of the catalogue',
    (tag) => {
      expect(blogTagCategory(tag)).toBe('projects');
    },
  );
});

describe('projectTagOf', () => {
  it.each([
    ['dashflow', 'DashFlow'],
    ['candidash', 'CandiDash'],
    ['portfolio', 'Portfolio'],
  ])('Given the project slug "%s" When its tag is looked up Then it is "%s"', (slug, tag) => {
    expect(projectTagOf(slug)).toBe(tag);
  });

  it.each(['le-vieux-comptoir', 'DashFlow', 'Portfolio', ''])(
    'Given "%s", which is not the slug of a tagged project, When its tag is looked up Then there is none',
    (slug) => {
      expect(projectTagOf(slug)).toBeNull();
    },
  );
});
