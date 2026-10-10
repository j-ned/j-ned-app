import type { Route } from '@angular/router';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { routes } from './app.routes';

const BLOG_TITLE = 'Blog Angular, NestJS et auto-hébergement | Julien Nédellec';

const blogRoute = (): Route | undefined => routes.find((route) => route.path === 'blog');
const blogSeo = (): Readonly<Record<string, unknown>> | undefined => blogRoute()?.data?.['seo'];

describe('blog route', () => {
  it('titles the page with its subjects, in the tab and in the SEO data, at the unchanged url', () => {
    expect(blogRoute()?.title).toBe(BLOG_TITLE);
    expect(blogSeo()?.['title']).toBe(BLOG_TITLE);
    expect(blogSeo()?.['url']).toBe(`${SITE_IDENTITY.siteUrl}/blog`);
  });

  it('keeps the validated snippet', () => {
    expect(blogSeo()?.['description']).toBe(
      "Retours d'expérience réels sur Angular, NestJS, PostgreSQL et le déploiement self-hosted.",
    );
  });
});
