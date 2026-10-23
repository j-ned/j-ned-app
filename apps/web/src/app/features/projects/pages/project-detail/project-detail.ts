import {
  Component,
  computed,
  effect,
  inject,
  input,
  ChangeDetectionStrategy,
  PLATFORM_ID,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import { projectTagOf } from '@features/blog/domain/models/project-tag.model';
import { postsAboutProject } from '@features/blog/domain/posts-about-project';
import { Seo } from '@core/seo/seo';
import { injectMarkNotFound } from '@core/ssr/response-status';
import { truncateAtWord } from '@shared/seo/truncate-at-word';
import { toShareImageUrl } from '@shared/seo/share-image';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import type { Project } from '@features/projects/domain/models/project.model';
import { projectOutcome } from '@features/projects/domain/project-outcome';
import { ProjectDetailHeader } from '../../application/components/project-detail-header';
import { ProjectDetailTechChoices } from '../../application/components/project-detail-tech-choices';
import { ProjectDetailArchDecisions } from '../../application/components/project-detail-arch-decisions';
import { ProjectDetailNav } from '../../application/components/project-detail-nav';
import { ProjectGallery } from '../../application/components/project-gallery';
import { ProjectArticles } from '../../application/components/project-articles';
import { PROJECT_ARTICLES_COPY } from '../../application/project-articles-copy';
import { Button } from '@shared/ui/button';

@Component({
  selector: 'app-project-detail',
  imports: [
    NgOptimizedImage,
    ProjectDetailHeader,
    ProjectDetailTechChoices,
    ProjectDetailArchDecisions,
    ProjectDetailNav,
    ProjectGallery,
    ProjectArticles,
    Button,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-svh pt-20 pb-16' },
  template: `
    @let p = project();
    @if (p) {
      <app-project-detail-header [project]="p" [outcome]="outcome()" (linkClicked)="trackClick()" />

      @if (p.image) {
        <figure class="page-container mt-12 mb-22 md:mt-14 md:mb-30">
          <div
            class="relative w-full aspect-[16/9] sm:aspect-[2/1] lg:aspect-[21/9] overflow-hidden rounded-block border border-foreground/8"
          >
            <img
              [ngSrc]="p.image"
              [alt]="'Aperçu du projet ' + p.title"
              fill
              priority
              sizes="100vw"
              class="object-cover"
            />
          </div>
        </figure>
      }

      @if (p.gallery.length > 0) {
        <app-project-gallery [images]="p.gallery" />
      }

      @if (techChoices().length > 0) {
        <app-project-detail-tech-choices [techChoices]="techChoices()" />
      }

      @if (architectureDecisions().length > 0) {
        <app-project-detail-arch-decisions [architectureDecisions]="architectureDecisions()" />
      }

      @let posts = articles();
      @if (posts.length > 0) {
        <app-project-articles [posts]="posts" (articleFollowed)="trackArticleClick()" />
      }

      <app-project-detail-nav [previousProject]="previousProject()" [nextProject]="nextProject()" />
    } @else if (failed()) {
      <div class="page-container pt-10 text-center" role="alert" data-testid="project-error">
        <p class="text-muted text-lg mb-4">
          Le projet n'a pas pu être chargé. Vérifie ta connexion, puis réessaie.
        </p>
        <button appButton type="button" variant="outlined" (click)="retry()">Réessayer</button>
      </div>
    } @else if (loading()) {
      <div class="page-container pt-6 md:pt-10" aria-hidden="true">
        <div class="h-4 w-32 rounded bg-surface-elevated mb-10"></div>
        <div class="h-3 w-24 rounded bg-surface-elevated mb-4"></div>
        <div class="h-12 w-3/4 max-w-2xl rounded-part bg-surface-elevated mb-6"></div>
        <div class="h-4 w-full max-w-xl rounded bg-surface-elevated mb-2"></div>
        <div class="h-4 w-2/3 max-w-md rounded bg-surface-elevated"></div>
        <div
          class="mt-10 w-full aspect-[16/9] sm:aspect-[2/1] lg:aspect-[21/9] rounded-block border border-foreground/8 bg-surface-elevated"
        ></div>
      </div>
      <span class="sr-only" role="status">Chargement du projet…</span>
    }
  `,
})
export class ProjectDetail {
  private readonly _gateway = inject(ProjectsGateway);
  private readonly _analytics = inject(AnalyticsGateway);
  private readonly _blogGateway = inject(BlogGateway);
  private readonly _router = inject(Router);
  private readonly _seo = inject(Seo);
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _markNotFound = injectMarkNotFound();

  readonly slug = input.required<string>();

  // Une ressource plutôt qu'un `toSignal` : elle distingue chargement, erreur et liste chargée,
  // et `reload()` relance la requête (la gateway ne garde plus un échec en cache).
  private readonly _projectsResource = rxResource({
    stream: () => this._gateway.getAllProjects(),
  });
  private readonly _allProjects = computed((): readonly Project[] =>
    this._projectsResource.hasValue() ? this._projectsResource.value() : [],
  );

  // `params` à `undefined` laisse la ressource inactive : aucune lecture du blog sans tag de projet.
  private readonly _postsResource = rxResource({
    params: () => projectTagOf(this.slug()) ?? undefined,
    stream: () => this._blogGateway.getPublishedPosts(),
  });
  protected readonly articles = computed(() =>
    this._postsResource.hasValue()
      ? postsAboutProject(this._postsResource.value(), this.slug())
      : [],
  );

  protected readonly loading = computed(() => this._projectsResource.isLoading());
  protected readonly failed = computed(() => this._projectsResource.status() === 'error');

  private readonly _currentIndex = computed(() =>
    this._allProjects().findIndex((p) => p.slug === this.slug()),
  );

  protected readonly project = computed(() => {
    const index = this._currentIndex();
    return index === -1 ? undefined : this._allProjects()[index];
  });
  protected readonly techChoices = computed(() => this.project()?.techChoices ?? []);
  protected readonly architectureDecisions = computed(
    () => this.project()?.architectureDecisions ?? [],
  );

  protected readonly outcome = computed(() => projectOutcome(this.project()?.slug));

  protected readonly previousProject = computed(() => {
    const index = this._currentIndex();
    return index > 0 ? this._allProjects()[index - 1] : undefined;
  });
  protected readonly nextProject = computed(() => {
    const list = this._allProjects();
    const index = this._currentIndex();
    return index !== -1 && index < list.length - 1 ? list[index + 1] : undefined;
  });

  protected retry(): void {
    this._projectsResource.reload();
  }

  private readonly _redirectIfMissing = effect(() => {
    const list = this._allProjects();
    if (list.length > 0 && !list.some((p) => p.slug === this.slug())) {
      if (this._isBrowser) void this._router.navigate(['/projects']);
      else this._markNotFound();
    }
  });

  private readonly _applyProjectSeo = effect(() => {
    const p = this.project();
    if (!p) return;

    const subjectOf = this.articles().map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${SITE_IDENTITY.siteUrl}/blog/${post.slug}`,
    }));
    this._seo.applySeoData({
      title: `${p.title} | Julien Nédellec`,
      description: truncateAtWord(p.description, 155),
      keywords: [p.category, ...p.tags, 'Julien Nédellec', 'Portfolio Développeur'].join(', '),
      url: `${SITE_IDENTITY.siteUrl}/projects/${p.slug}`,
      type: 'article',
      image: toShareImageUrl(p.image),
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: p.title,
        description: p.description,
        creator: { '@type': 'Person', name: 'Julien Nédellec', url: SITE_IDENTITY.siteUrl },
        keywords: p.tags.join(', '),
        ...(p.liveUrl ? { url: p.liveUrl } : {}),
        ...(p.repoUrl ? { codeRepository: p.repoUrl } : {}),
        ...(subjectOf.length > 0 ? { subjectOf } : {}),
      },
    });
  });

  protected trackArticleClick(): void {
    this._analytics.trackCtaClick('project_article', PROJECT_ARTICLES_COPY.articleCtaLabel);
  }

  protected trackClick(): void {
    const p = this.project();
    if (p) {
      this._analytics.trackProjectClick(p.id, p.title);
    }
  }
}
