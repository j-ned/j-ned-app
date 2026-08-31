import { Component, computed, effect, inject, input, ChangeDetectionStrategy, resource } from '@angular/core';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { BlogGateway } from '../domain/gateways/blog.gateway';
import { parseMarkdown } from '../infra/parse-markdown';
import { Seo } from '@shared/seo/seo';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { BlogLikeButton } from './components/blog-like-button';
import { BlogComments } from './components/blog-comments';
import { AppTag } from '@shared/ui/tag';

@Component({
  selector: 'app-blog-detail',
  imports: [BlogLikeButton, BlogComments, AppTag, DatePipe, NgOptimizedImage, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @let p = post();
    <main class="page-container min-h-svh pt-20 pb-20 max-w-3xl mx-auto">
      @if (p) {
        <div class="flex flex-wrap gap-1.5 mb-4">
          @for (tag of p.tags; track tag) {
            <a data-testid="tag-link" routerLink="/blog" [queryParams]="{ tag }">
              <app-tag [value]="tag" severity="info" />
            </a>
          }
        </div>
        <h1 class="text-3xl md:text-4xl font-bold mb-4">{{ p.title }}</h1>
        @if (p.publishedAt) {
          <p class="text-muted text-sm mb-6">{{ p.publishedAt | date: 'd MMMM y' }}</p>
        }
        @if (p.coverImage) {
          <figure class="mb-8">
            <div class="relative w-full aspect-[16/9] sm:aspect-[2/1] overflow-hidden rounded-xl border border-foreground/8">
              <img
                [ngSrc]="p.coverImage"
                [alt]="'Illustration de l’article ' + p.title"
                fill
                priority
                sizes="100vw"
                class="object-cover"
              />
            </div>
          </figure>
        }
        <div data-testid="blog-content" class="prose max-w-none dark:prose-invert" [innerHTML]="renderedContent()"></div>
        <div class="mt-8">
          <app-blog-like-button [slug]="p.slug" [likesCount]="p.likesCount" />
        </div>
        <app-blog-comments [slug]="p.slug" />
      }
    </main>
  `,
})
export class BlogDetail {
  private readonly gateway = inject(BlogGateway);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly seo = inject(Seo);
  private readonly router = inject(Router);

  readonly slug = input.required<string>();

  // `resource()` (pas `toSignal`) : Angular réutilise la même instance de
  // BlogDetail entre deux navigations `/blog/:slug` de la même config de route
  // (ex. lien "article suivant"), il ne la détruit pas. `params: () => this.slug()`
  // fait que le loader se relance automatiquement à chaque changement de slug —
  // un `toSignal` souscrit une seule fois à l'Observable initial et raterait
  // silencieusement le changement de slug sur une navigation in-page.
  // NB : sur Angular 22, l'option `resource()` s'appelle `params` (et la clé
  // correspondante dans `ResourceLoaderParams` aussi) — le brief d'origine
  // utilisait `request`, nom antérieur à cette release ; corrigé ici.
  private readonly _postResource = resource({
    params: () => this.slug(),
    loader: async ({ params: slug }) => {
      try {
        return await firstValueFrom(this.gateway.getPostBySlug(slug));
      } catch {
        // 404 (slug inconnu ou dépublié) → redirection silencieuse vers /blog
        // plutôt qu'une page vide, même pattern que `_redirectIfMissing` dans
        // ProjectDetail.
        void this.router.navigate(['/blog']);
        return undefined;
      }
    },
  });

  protected readonly post = computed(() => this._postResource.value());

  protected readonly renderedContent = computed(() => {
    const p = this.post();
    if (!p) return '';
    return this.sanitizer.bypassSecurityTrustHtml(parseMarkdown(p.contentMarkdown));
  });

  private readonly _applySeo = effect(() => {
    const p = this.post();
    if (!p) return;

    this.seo.applySeoData({
      title: `${p.title} | Blog — Julien Nédellec`,
      description: p.excerpt,
      keywords: [...p.tags, 'Julien Nédellec', 'Blog Développeur'].join(', '),
      url: `${SITE_IDENTITY.siteUrl}/blog/${p.slug}`,
      type: 'article',
      image: p.coverImage,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: p.title,
        description: p.excerpt,
        author: { '@type': 'Person', name: 'Julien Nédellec', url: SITE_IDENTITY.siteUrl },
        ...(p.coverImage ? { image: p.coverImage } : {}),
        ...(p.publishedAt ? { datePublished: p.publishedAt } : {}),
      },
    });
  });
}
