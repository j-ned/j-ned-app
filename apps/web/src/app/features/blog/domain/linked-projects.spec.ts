import { describe, it, expect } from 'vitest';
import { linkedProjects } from './linked-projects';
import { makeBlogPost } from '../testing/blog-post-builders';

describe('linkedProjects', () => {
  it('Given no article When its projects are read Then there is none', () => {
    expect(linkedProjects(undefined)).toEqual([]);
  });

  it('Given an article tagged DashFlow among other tags When its projects are read Then only the DashFlow page is linked', () => {
    const post = makeBlogPost({ tags: ['Angular', 'DashFlow', 'Chiffrement'] });

    expect(linkedProjects(post)).toEqual([{ tag: 'DashFlow', projectSlug: 'dashflow' }]);
  });

  it('Given an article tagged with two projects When its projects are read Then they follow the order of its tags', () => {
    const post = makeBlogPost({ tags: ['Portfolio', 'SSR', 'DashFlow'] });

    expect(linkedProjects(post)).toEqual([
      { tag: 'Portfolio', projectSlug: 'portfolio' },
      { tag: 'DashFlow', projectSlug: 'dashflow' },
    ]);
  });

  it.each([
    ['a free tag whose case differs from a project tag', ['Candidash', 'Angular']],
    ['no project tag', ['Angular', 'TypeScript']],
    ['no tag at all', []],
  ])('Given an article with %s When its projects are read Then there is none', (_case, tags) => {
    expect(linkedProjects(makeBlogPost({ tags }))).toEqual([]);
  });
});
