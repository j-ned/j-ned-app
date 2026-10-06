import { projectStack } from './project-stack';

describe('projectStack', () => {
  it.each([
    {
      label: 'more tags than the size',
      tags: ['Angular', 'TypeScript', 'TailwindCSS', 'Docker', 'PostgreSQL', 'NestJS'],
      size: 4,
      expected: ['Angular', 'TypeScript', 'TailwindCSS', 'Docker'],
    },
    {
      label: 'exactly the size',
      tags: ['Angular', 'Git', 'PostgreSQL', 'TailwindCSS'],
      size: 4,
      expected: ['Angular', 'Git', 'PostgreSQL', 'TailwindCSS'],
    },
    {
      label: 'fewer tags than the size',
      tags: ['Bash', 'Git'],
      size: 4,
      expected: ['Bash', 'Git'],
    },
    { label: 'no tag', tags: [], size: 4, expected: [] },
    {
      label: 'a short stack',
      tags: ['Astro', 'TailwindCSS', 'Docker'],
      size: 2,
      expected: ['Astro', 'TailwindCSS'],
    },
  ] satisfies readonly {
    label: string;
    tags: readonly string[];
    size: number;
    expected: readonly string[];
  }[])(
    'Given $label When the stack is taken Then it keeps the first tags in their order',
    ({ tags, size, expected }) => {
      expect(projectStack(tags, size)).toEqual(expected);
    },
  );

  it('Given tags When the stack is taken Then the tags are left untouched', () => {
    const tags = ['Angular', 'NestJS', 'PostgreSQL', 'Docker', 'JWT'];

    projectStack(tags, 2);

    expect(tags).toEqual(['Angular', 'NestJS', 'PostgreSQL', 'Docker', 'JWT']);
  });
});
