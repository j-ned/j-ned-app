import { Component, computed, effect, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import type { Project } from '@features/projects/domain/models/project.model';
import { AppIcon } from '@shared/icons/app-icon';

@Component({
  selector: 'app-project-detail',
  imports: [DecimalPipe, NgOptimizedImage, AppIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @let p = project();
    <main class="min-h-svh pt-20 pb-20">
      @if (p) {
        <!-- En-tête éditorial : eyebrow, titre XXL, lede, CTA, stack -->
        <header class="page-container pt-6 md:pt-10">
          <a
            routerLink="/projects"
            data-testid="back-link"
            class="group inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-8"
          >
            <app-icon
              name="arrow-left"
              [size]="18"
              class="transition-transform group-hover:-translate-x-0.5"
            />
            Retour aux projets
          </a>

          <p class="text-accent text-xs font-semibold uppercase tracking-[0.2em] mb-3">
            {{ p.category }}
          </p>

          <h1
            data-testid="project-detail-title"
            class="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance max-w-4xl"
          >
            {{ p.title }}
          </h1>

          <p class="mt-5 text-lg text-muted leading-relaxed max-w-2xl text-pretty">
            {{ p.description }}
          </p>

          @if (hasLinks()) {
            <div class="mt-7 flex flex-wrap items-center gap-3">
              @if (p.liveUrl) {
                <a
                  [href]="p.liveUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  (click)="trackClick()"
                  class="inline-flex items-center gap-2 rounded-full bg-primary-bg px-6 py-3 text-sm font-semibold text-white transition-[transform,opacity] duration-200 hover:opacity-90 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  [attr.aria-label]="'Voir la démo de ' + p.title"
                >
                  <app-icon name="external-link" [size]="18" />
                  Voir la démo
                </a>
              }
              @if (p.repoUrl) {
                <a
                  [href]="p.repoUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  (click)="trackClick()"
                  class="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  [attr.aria-label]="'Code source de ' + p.title"
                >
                  <app-icon name="github" [size]="18" />
                  Code source
                </a>
              }
              @if (p.repoUrlFront) {
                <a
                  [href]="p.repoUrlFront"
                  target="_blank"
                  rel="noopener noreferrer"
                  (click)="trackClick()"
                  class="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  [attr.aria-label]="'Code frontend de ' + p.title"
                >
                  <app-icon name="github" [size]="18" />
                  Frontend
                </a>
              }
              @if (p.repoUrlBack) {
                <a
                  [href]="p.repoUrlBack"
                  target="_blank"
                  rel="noopener noreferrer"
                  (click)="trackClick()"
                  class="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  [attr.aria-label]="'Code backend de ' + p.title"
                >
                  <app-icon name="github" [size]="18" />
                  Backend
                </a>
              }
            </div>
          }

          @if (p.tags.length > 0) {
            <div class="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span class="text-xs font-semibold uppercase tracking-[0.2em] text-muted/70">Stack</span>
              <ul class="flex flex-wrap gap-2" role="list">
                @for (tag of p.tags; track tag) {
                  <li>
                    <span
                      class="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-foreground/90 ring-1 ring-inset ring-primary/20"
                    >
                      {{ tag }}
                    </span>
                  </li>
                }
              </ul>
            </div>
          }
        </header>

        <!-- Visuel cinématique pleine largeur -->
        @if (p.image) {
          <figure
            class="relative mt-10 md:mt-14 w-full aspect-[16/10] sm:aspect-[2/1] md:aspect-[21/9] md:max-h-[28rem] overflow-hidden border-y border-foreground/10"
          >
            <img
              [ngSrc]="p.image"
              [alt]="'Aperçu du projet ' + p.title"
              fill
              priority
              sizes="100vw"
              class="object-cover"
            />
            <div
              class="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/55 via-background/5 to-transparent"
            ></div>
          </figure>
        }

        <!-- Choix techniques : liste numérotée éditoriale -->
        @if (techChoices().length > 0) {
          <section
            data-testid="tech-choices"
            class="page-container mt-14 md:mt-20"
            aria-labelledby="tech-choices-title"
          >
            <div class="flex items-baseline gap-4 mb-6 md:mb-8">
              <h2 id="tech-choices-title" class="text-2xl md:text-3xl font-bold text-foreground">
                Choix techniques
              </h2>
              <span class="text-sm font-medium text-muted tabular-nums">
                {{ techChoices().length | number: '2.0-0' }}
              </span>
            </div>

            <ol class="grid border-t border-foreground/10 lg:grid-cols-2 lg:gap-x-12">
              @for (choice of techChoices(); track choice.techno; let i = $index) {
                <li
                  class="grid grid-cols-[2.5rem_1fr] sm:grid-cols-[3.5rem_1fr] gap-x-4 sm:gap-x-8 py-5 md:py-6 border-b border-foreground/10 animate-fade-up"
                  [style.animation-delay.ms]="i * 60"
                >
                  <span
                    class="text-2xl sm:text-3xl font-bold leading-none text-accent/60 tabular-nums pt-1"
                    aria-hidden="true"
                  >
                    {{ i + 1 | number: '2.0-0' }}
                  </span>
                  <div>
                    <h3 class="text-lg md:text-xl font-semibold text-foreground">
                      {{ choice.techno }}
                    </h3>
                    <p class="mt-1.5 text-muted leading-relaxed max-w-prose text-pretty">
                      {{ choice.why }}
                    </p>
                  </div>
                </li>
              }
            </ol>
          </section>
        }

        <!-- Décisions d'architecture : rangées décision / rationale -->
        @if (architectureDecisions().length > 0) {
          <section
            data-testid="architecture-decisions"
            class="page-container mt-14 md:mt-20"
            aria-labelledby="architecture-decisions-title"
          >
            <h2
              id="architecture-decisions-title"
              class="text-2xl md:text-3xl font-bold text-foreground mb-6 md:mb-8"
            >
              Décisions d'architecture
            </h2>

            <dl class="grid border-t border-foreground/10 lg:grid-cols-2 lg:gap-x-12">
              @for (item of architectureDecisions(); track item.decision; let i = $index) {
                <div
                  class="grid gap-y-1.5 py-5 md:py-6 border-b border-foreground/10 animate-fade-up md:grid-cols-[2fr_3fr] md:gap-x-8 lg:grid-cols-1 lg:gap-x-0"
                  [style.animation-delay.ms]="i * 60"
                >
                  <dt class="flex items-start gap-3 text-base md:text-lg font-semibold text-foreground">
                    <span
                      class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                      aria-hidden="true"
                    ></span>
                    {{ item.decision }}
                  </dt>
                  <dd class="text-muted leading-relaxed max-w-prose text-pretty pl-[1.625rem] md:pl-0 lg:pl-[1.625rem]">
                    {{ item.rationale }}
                  </dd>
                </div>
              }
            </dl>
          </section>
        }

        <!-- Navigation projet précédent / suivant -->
        <nav
          class="page-container mt-16 md:mt-20 pt-8 border-t border-foreground/10 flex items-center justify-between gap-4"
          aria-label="Navigation entre projets"
        >
          @if (previousProject(); as prev) {
            <a
              [routerLink]="['/projects', prev.slug]"
              class="group flex-1 min-w-0 inline-flex flex-col items-start gap-0.5 text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              <span class="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted">
                <app-icon
                  name="chevron-left"
                  [size]="14"
                  class="transition-transform group-hover:-translate-x-0.5"
                />
                Précédent
              </span>
              <span class="truncate max-w-full font-medium text-foreground group-hover:text-primary transition-colors">
                {{ prev.title }}
              </span>
            </a>
          } @else {
            <span class="flex-1"></span>
          }

          <a
            routerLink="/projects"
            class="shrink-0 text-sm font-medium text-muted hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background rounded-lg"
          >
            Tous les projets
          </a>

          @if (nextProject(); as next) {
            <a
              [routerLink]="['/projects', next.slug]"
              class="group flex-1 min-w-0 inline-flex flex-col items-end gap-0.5 text-right rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              <span class="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted">
                Suivant
                <app-icon
                  name="chevron-right"
                  [size]="14"
                  class="transition-transform group-hover:translate-x-0.5"
                />
              </span>
              <span class="truncate max-w-full font-medium text-foreground group-hover:text-primary transition-colors">
                {{ next.title }}
              </span>
            </a>
          } @else {
            <span class="flex-1"></span>
          }
        </nav>
      } @else if (loading()) {
        <!-- État de chargement : squelette sobre le temps de récupérer le projet -->
        <div class="page-container pt-6 md:pt-10" aria-hidden="true">
          <div class="h-4 w-32 rounded bg-surface-elevated mb-10"></div>
          <div class="h-3 w-24 rounded bg-surface-elevated mb-4"></div>
          <div class="h-12 w-3/4 max-w-2xl rounded-lg bg-surface-elevated mb-6"></div>
          <div class="h-4 w-full max-w-xl rounded bg-surface-elevated mb-2"></div>
          <div class="h-4 w-2/3 max-w-md rounded bg-surface-elevated"></div>
          <div class="mt-10 w-full aspect-[16/10] md:aspect-[21/9] md:max-h-[28rem] rounded-none bg-surface-elevated"></div>
        </div>
        <span class="sr-only" role="status">Chargement du projet…</span>
      }
    </main>
  `,
})
export class ProjectDetail {
  private readonly _gateway = inject(ProjectsGateway);
  private readonly _analytics = inject(AnalyticsGateway);
  private readonly _router = inject(Router);

  readonly slug = input.required<string>();

  private readonly _allProjects = toSignal(this._gateway.getAllProjects(), {
    initialValue: [] as readonly Project[],
  });

  protected readonly loading = computed(() => this._allProjects().length === 0);

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

  protected readonly hasLinks = computed(() => {
    const p = this.project();
    return Boolean(p?.liveUrl || p?.repoUrl || p?.repoUrlFront || p?.repoUrlBack);
  });

  protected readonly previousProject = computed(() => {
    const index = this._currentIndex();
    return index > 0 ? this._allProjects()[index - 1] : undefined;
  });
  protected readonly nextProject = computed(() => {
    const list = this._allProjects();
    const index = this._currentIndex();
    return index !== -1 && index < list.length - 1 ? list[index + 1] : undefined;
  });

  private readonly _redirectIfMissing = effect(() => {
    const list = this._allProjects();
    if (list.length > 0 && !list.some((p) => p.slug === this.slug())) {
      void this._router.navigate(['/projects']);
    }
  });

  protected trackClick(): void {
    const p = this.project();
    if (p) {
      this._analytics.trackProjectClick(p.id, p.title);
    }
  }
}
