import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { SeoService } from '../../shared/services/seo.service';
import { PROJECTS } from './data/projects.data';

export const projectsSeoResolver: ResolveFn<void> = () => {
  const seoService = inject(SeoService);

  seoService.addStructuredData({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: PROJECTS.sort((a, b) => a.order - b.order).map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'CreativeWork',
        name: project.title,
        description: project.description,
        url: project.liveUrl || project.repoUrl || 'https://www.julien-nedellec.fr/projects',
      },
    })),
  });
};
