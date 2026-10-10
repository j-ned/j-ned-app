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
  PLATFORM_ID,
} from '@angular/core';
import { DatePipe, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { BlogGateway } from '../../domain/gateways/blog.gateway';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { Seo } from '@core/seo/seo';
import { injectMarkNotFound } from '@core/ssr/response-status';
import { truncateAtWord } from '@shared/seo/truncate-at-word';
import { toShareImageUrl } from '@shared/seo/share-image';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { BlogLikeButton } from '../../application/components/blog-like-button';
import { BlogComments } from '../../application/components/blog-comments';
import { BlogArticleBody } from '../../application/components/blog-article-body';
import { CodeCopy } from '../../application/components/code-copy';
import { BlogTagLink } from '../../application/components/blog-tag-link';
import { AppIcon } from '@shared/icons/app-icon';
import { readingTimeMinutes } from '../../domain/reading-time';
import { adjacentPosts } from '../../domain/adjacent-posts';
import type { BlogPost } from '../../domain/models/blog-post.model';

// `updatedAt` peut précéder `publishedAt` (brouillon retouché puis publié) : `dateModified`
// ne doit jamais être antérieur à `datePublished`.
function laterOf(a: string, b: string): string {
  return a > b ? a : b;
}

@Component({
  selector: 'app-blog-detail',
  imports: [
    BlogArticleBody,
    CodeCopy,
    BlogLikeButton,
    BlogComments,
    BlogTagLink,
    DatePipe,
    NgOptimizedImage,
    RouterLink,
    AppIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-svh pt-20 pb-16' },
  template: `
    @let p = post();
    @if (p) {
      <article>
        <header class="mx-auto max-w-[46rem] px-4 pt-12 pb-10 sm:px-6 md:pt-18 md:pb-12">
          <a
            routerLink="/blog"
            class="group inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-primary"
          >
            <app-icon
              name="arrow-left"
              [size]="16"
              class="transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
            />
            Tous les articles
          </a>
          <p class="mt-6 flex flex-wrap gap-x-3.5 gap-y-1.5 font-mono text-[0.8125rem] text-muted">
            @if (p.publishedAt) {
              <time
                class="text-primary"
                [attr.datetime]="p.publishedAt"
                data-testid="published-at"
                >{{ p.publishedAt | date: 'd MMMM y' }}</time
              >
            }
            <span data-testid="reading-time">{{ readingTime() }} min de lecture</span>
            @if (updatedAfterPublication()) {
              <span
                >mis à jour le
                <time [attr.datetime]="p.updatedAt" data-testid="updated-at">{{
                  p.updatedAt | date: 'd MMMM y'
                }}</time></span
              >
            }
          </p>
          <h1
            class="mt-4 text-[clamp(2.125rem,4.4vw,3.5rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-balance"
          >
            {{ p.title }}
          </h1>
          <p
            class="mt-5.5 text-[clamp(1.125rem,1.6vw,1.3125rem)] leading-[1.55] text-muted"
            data-testid="blog-lead"
          >
            {{ p.excerpt }}
          </p>
          <div class="mt-6 flex flex-wrap gap-1.5">
            @for (tag of p.tags; track tag) {
              <app-blog-tag-link [tag]="tag" />
            }
          </div>
        </header>

        @if (p.coverImage) {
          <figure class="mx-auto max-w-5xl px-4 sm:px-6">
            <div
              class="relative aspect-[1200/630] w-full overflow-hidden rounded-xl border border-foreground/8"
            >
              <img
                [ngSrc]="p.coverImage"
                [alt]="coverImageAlt()"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 64rem"
                class="object-cover"
              />
            </div>
          </figure>
        }

        <div class="mx-auto max-w-[46rem] px-4 sm:px-6">
          <div appCodeCopy #codeCopy="appCodeCopy">
            <!-- Un bloc « hydrate never » ne reçoit plus ses entrées : il est recréé à chaque article. -->
            @for (current of [p]; track current.id) {
              @defer (on immediate; hydrate never) {
                <app-blog-article-body class="pt-14 pb-8" [markdown]="current.contentMarkdown" />
              } @placeholder {
                <div
                  data-testid="blog-content-placeholder"
                  class="grid min-h-svh content-start gap-4 pt-14 pb-8"
                  aria-hidden="true"
                >
                  <div class="h-4 w-full rounded-sm bg-foreground/6"></div>
                  <div class="h-4 w-11/12 rounded-sm bg-foreground/6"></div>
                  <div class="h-4 w-4/5 rounded-sm bg-foreground/6"></div>
                </div>
              } @error {
                <p
                  data-testid="blog-content-error"
                  role="alert"
                  class="pt-14 pb-8 text-foreground/85"
                >
                  Le texte de l’article n’a pas pu être chargé.
                  <a
                    [attr.href]="'/blog/' + current.slug"
                    class="text-primary underline underline-offset-3"
                    >Recharger la page</a
                  >
                </p>
              }
            }
          </div>
          <p role="status" data-testid="code-copy-status" class="sr-only">
            {{ codeCopy.status() }}
          </p>
          <div #readSentinel data-testid="article-read-sentinel" aria-hidden="true"></div>
        </div>
      </article>

      <div class="mx-auto max-w-[46rem] px-4 sm:px-6">
        <div
          class="flex flex-wrap items-center justify-between gap-4 border-t border-foreground/8 py-7"
        >
          <app-blog-like-button [slug]="p.slug" [likesCount]="p.likesCount" />
          <a
            href="/rss.xml"
            class="inline-flex min-h-11 items-center font-mono text-[0.8125rem] text-muted transition-colors hover:text-primary"
          >
            Flux RSS
          </a>
        </div>

        @let around = neighbours();
        @if (around.older || around.newer) {
          <nav class="grid gap-3 sm:grid-cols-2" aria-label="Autres articles">
            @if (around.older; as older) {
              <a
                [routerLink]="['/blog', older.slug]"
                class="group grid gap-1 rounded-xl border border-foreground/8 bg-surface p-6 transition-colors hover:border-primary/35"
                data-testid="older-post"
              >
                <span class="font-mono text-xs text-muted">article précédent</span>
                <span
                  class="text-[1.1875rem] font-semibold tracking-tight transition-colors group-hover:text-primary"
                  >{{ older.title }}</span
                >
              </a>
            }
            @if (around.newer; as newer) {
              <a
                [routerLink]="['/blog', newer.slug]"
                class="group grid gap-1 rounded-xl border border-foreground/8 bg-surface p-6 text-right transition-colors hover:border-primary/35 sm:col-start-2"
                data-testid="newer-post"
              >
                <span class="font-mono text-xs text-muted">article suivant</span>
                <span
                  class="text-[1.1875rem] font-semibold tracking-tight transition-colors group-hover:text-primary"
                  >{{ newer.title }}</span
                >
              </a>
            }
          </nav>
        }

        <app-blog-comments [slug]="p.slug" />
      </div>
    }
  `,
})
export class BlogDetail {
  private readonly gateway = inject(BlogGateway);
  private readonly analytics = inject(AnalyticsGateway);
  private readonly seo = inject(Seo);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly markNotFound = injectMarkNotFound();

  private readonly _readSentinel = viewChild<ElementRef<HTMLElement>>('readSentinel');

  readonly slug = input.required<string>();

  // `resource()` (pas `toSignal`) : Angular réutilise la même instance de
  // BlogDetail entre deux navigations `/blog/:slug` de la même config de route
  // (ex. lien "article suivant"), il ne la détruit pas. `params: () => this.slug()`
  // fait que le loader se relance automatiquement à chaque changement de slug —
  // un `toSignal` souscrit une seule fois à l'Observable initial et raterait
  // silencieusement le changement de slug sur une navigation in-page.
  private readonly _postResource = resource({
    params: () => this.slug(),
    loader: async ({ params: slug }) => {
      try {
        return await firstValueFrom(this.gateway.getPostBySlug(slug));
      } catch (error: unknown) {
        // Navigateur : redirection silencieuse vers /blog plutôt qu'une page vide. Serveur : vraie
        // 404 pour un slug inconnu ; une panne d'amont reste en 503 (posé par l'intercepteur),
        // sinon nginx ne servirait pas sa copie périmée.
        if (this.isBrowser) void this.router.navigate(['/blog']);
        else if (error instanceof HttpErrorResponse && error.status === 404) this.markNotFound();
        return undefined;
      }
    },
  });

  protected readonly post = computed(() => this._postResource.value());

  protected readonly readingTime = computed(() =>
    readingTimeMinutes(this.post()?.contentMarkdown ?? ''),
  );

  // Liste publiée chargée une fois (même instance réutilisée d'un slug à l'autre) ; les voisins
  // se recalculent sur le slug courant.
  private readonly _publishedPosts = toSignal(this.gateway.getPublishedPosts(), {
    initialValue: [] as readonly BlogPost[],
  });
  protected readonly neighbours = computed(() =>
    adjacentPosts(this._publishedPosts(), this.slug()),
  );

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

  // Sentinel en fin d'article : visible = article lu jusqu'au bout. Il survit à un changement de
  // slug (instance réutilisée), d'où le dédoublonnage par `post().id` lu à l'intersection.
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
