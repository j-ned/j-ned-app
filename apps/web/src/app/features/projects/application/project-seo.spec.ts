import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import type { Project } from '../domain/models/project.model';
import { makeProject } from '../testing/project-builders';
import { projectSeo } from './project-seo';

describe('projectSeo', () => {
  it('Given a project with links and posts about it When its SEO is derived Then page meta and CreativeWork JSON-LD are emitted in this exact form', () => {
    const project = makeProject({
      title: 'DashFlow',
      slug: 'dashflow',
      category: 'Web',
      tags: ['Angular', 'NestJS'],
      description: 'desc',
      image: 'https://cdn.test/dashflow.avif',
      liveUrl: 'https://dashflow.test',
      repoUrl: 'https://github.com/j-ned/dashflow',
    });
    const articles = [makeBlogPost({ title: 'Titre recent', slug: 'recent' })];

    const { structuredData, ...meta } = projectSeo(project, articles);

    expect({ meta, jsonLd: JSON.stringify(structuredData) }).toEqual({
      meta: {
        title: 'DashFlow | Julien Nédellec',
        description: 'desc',
        keywords: 'Web, Angular, NestJS, Julien Nédellec, Portfolio Développeur',
        url: 'https://nedellec-julien.fr/projects/dashflow',
        type: 'article',
        image: 'https://cdn.test/dashflow.avif?variant=share',
      },
      jsonLd:
        '{"@context":"https://schema.org","@type":"CreativeWork","name":"DashFlow","description":"desc",' +
        '"creator":{"@type":"Person","@id":"https://nedellec-julien.fr/#person","name":"Julien Nédellec","url":"https://nedellec-julien.fr"},' +
        '"keywords":"Angular, NestJS","url":"https://dashflow.test","codeRepository":"https://github.com/j-ned/dashflow",' +
        '"subjectOf":[{"@type":"BlogPosting","headline":"Titre recent","url":"https://nedellec-julien.fr/blog/recent"}]}',
    });
  });

  it.each<{ readonly scenario: string; readonly links: Partial<Project> }>([
    { scenario: 'cleared links', links: { liveUrl: null, repoUrl: null } },
    { scenario: 'absent links', links: {} },
  ])(
    'Given a project with $scenario and no post about it When its SEO is derived Then url, codeRepository and subjectOf are left out',
    ({ links }) => {
      const project = makeProject(links);

      expect(Object.keys(projectSeo(project, []).structuredData ?? {})).toEqual([
        '@context',
        '@type',
        'name',
        'description',
        'creator',
        'keywords',
      ]);
    },
  );
});
