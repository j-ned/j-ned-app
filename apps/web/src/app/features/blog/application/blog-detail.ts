import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  viewChild,
  ChangeDetectionStrategy,
  resource,
} from '@angular/core';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { BlogGateway } from '../domain/gateways/blog.gateway';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { parseMarkdown } from '../infra/parse-markdown';
import { Seo } from '@shared/seo/seo';
import { truncateAtWord } from '@shared/seo/truncate-at-word';
import { toShareImageUrl } from '@shared/seo/share-image';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { BlogLikeButton } from './components/blog-like-button';
import { BlogComments } from './components/blog-comments';
import { BlogTagLink } from './components/blog-tag-link';

// `updatedAt` peut précéder `publishedAt` (brouillon retouché puis publié) : `dateModified`
// ne doit jamais être antérieur à `datePublished`.
function laterOf(a: string, b: string): string {
  return a > b ? a : b;
}

@Component({
  selector: 'app-blog-detail',
  imports: [BlogLikeButton, BlogComments, BlogTagLink, DatePipe, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @let p = post();
    <main class="min-h-svh pt-20 pb-20">
      <section class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-8">
        @if (p) {
          <article>
            <div class="flex flex-wrap gap-1.5 mb-4">
              @for (tag of p.tags; track tag) {
                <app-blog-tag-link [tag]="tag" />
              }
            </div>
            <h1 class="text-3xl md:text-4xl font-bold mb-4">{{ p.title }}</h1>
            @if (p.publishedAt) {
              <p class="text-muted text-sm mb-6">
                Publié le
                <time [attr.datetime]="p.publishedAt" data-testid="published-at">{{
                  p.publishedAt | date: 'd MMMM y'
                }}</time>
                @if (updatedAfterPublication()) {
                  · mis à jour le
                  <time [attr.datetime]="p.updatedAt" data-testid="updated-at">{{
                    p.updatedAt | date: 'd MMMM y'
                  }}</time>
                }
              </p>
            }
            @if (p.coverImage) {
              <figure class="mb-8">
                <div
                  class="relative w-full aspect-[16/9] sm:aspect-[2/1] overflow-hidden rounded-xl border border-foreground/8"
                >
                  <img
                    [ngSrc]="p.coverImage"
                    [alt]="coverImageAlt()"
                    fill
                    priority
                    sizes="100vw"
                    class="object-cover"
                  />
                </div>
              </figure>
            }
            <div
              data-testid="blog-content"
              class="prose max-w-none dark:prose-invert break-words prose-pre:overflow-x-auto prose-table:block prose-table:w-full prose-table:overflow-x-auto prose-img:max-w-full prose-img:h-auto"
              [innerHTML]="renderedContent()"
            ></div>
            <div #readSentinel data-testid="article-read-sentinel" aria-hidden="true"></div>
          </article>
          <div class="mt-8">
            <app-blog-like-button [slug]="p.slug" [likesCount]="p.likesCount" />
          </div>
          <app-blog-comments [slug]="p.slug" />
        }
      </section>
    </main>
  `,
})
export class BlogDetail {
  private readonly gateway = inject(BlogGateway);
  private readonly analytics = inject(AnalyticsGateway);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly seo = inject(Seo);
  private readonly router = inject(Router);

  private readonly _readSentinel = viewChild<ElementRef<HTMLElement>>('readSentinel');

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

  protected readonly coverImageAlt = computed(
    () => `Illustration de l’article ${this.post()?.title ?? ''}`,
  );

  // Une correction éditoriale après publication (l'API ne touche pas `updatedAt` sur un like).
  // Comparaison au jour près : une relecture le jour même n'est pas une « mise à jour ».
  protected readonly updatedAfterPublication = computed(() => {
    const p = this.post();
    return !!p?.publishedAt && p.updatedAt.slice(0, 10) > p.publishedAt.slice(0, 10);
  });

  private readonly _applySeo = effect(() => {
    const p = this.post();
    if (!p) return;

    const url = `${SITE_IDENTITY.siteUrl}/blog/${p.slug}`;
    const shareImage = toShareImageUrl(p.coverImage);
    const author = { '@type': 'Person', name: 'Julien Nédellec', url: SITE_IDENTITY.siteUrl };
    this.seo.applySeoData({
      title: `${p.title} | Julien Nédellec`,
      description: truncateAtWord(p.excerpt, 155),
      keywords: [...p.tags, 'Julien Nédellec', 'Blog Développeur'].join(', '),
      url,
      type: 'article',
      image: shareImage,
      imageAlt: this.coverImageAlt(),
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: p.title,
        description: p.excerpt,
        url,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        inLanguage: 'fr',
        keywords: p.tags.join(', '),
        author,
        publisher: author,
        ...(shareImage ? { image: shareImage } : {}),
        ...(p.publishedAt
          ? { datePublished: p.publishedAt, dateModified: laterOf(p.updatedAt, p.publishedAt) }
          : {}),
      },
    });
  });

  private _viewTrackedId: string | null = null;
  private readonly _trackView = effect(() => {
    const p = this.post();
    if (!p || this._viewTrackedId === p.id) return;
    this._viewTrackedId = p.id;
    this.analytics.trackArticleView(p.id, p.title);
  });

  // Sentinel juste après le contenu : sa présence dans le viewport signale que
  // le lecteur a scrollé jusqu'au bout de l'article ("réellement lu", pas
  // juste ouvert). Le sentinel persiste entre deux slugs (même instance de
  // BlogDetail réutilisée, cf. `_postResource`), donc le tracking se
  // dédoublonne par `post().id` lu au moment de l'intersection plutôt que
  // par ré-exécution de l'effect.
  private _readTrackedId: string | null = null;
  private readonly _trackRead = effect((onCleanup) => {
    const sentinel = this._readSentinel();
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const p = this.post();
        if (!p || this._readTrackedId === p.id) continue;
        this._readTrackedId = p.id;
        this.analytics.trackArticleRead(p.id, p.title);
      }
    });

    observer.observe(sentinel.nativeElement);
    onCleanup(() => observer.disconnect());
  });
}
