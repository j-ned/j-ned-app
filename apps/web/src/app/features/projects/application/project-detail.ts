import { Component, computed, effect, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import type { Project } from '@features/projects/domain/models/project.model';
import { ProjectDetailHeader } from './components/project-detail-header';
import { ProjectDetailTechChoices } from './components/project-detail-tech-choices';
import { ProjectDetailArchDecisions } from './components/project-detail-arch-decisions';
import { ProjectDetailNav } from './components/project-detail-nav';

@Component({
  selector: 'app-project-detail',
  imports: [NgOptimizedImage, ProjectDetailHeader, ProjectDetailTechChoices, ProjectDetailArchDecisions, ProjectDetailNav],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @let p = project();
    <main class="min-h-svh pt-20 pb-20">
      @if (p) {
        <app-project-detail-header [project]="p" (linkClicked)="trackClick()" />

        @if (p.image) {
          <figure class="page-container mt-10 md:mt-14">
            <div
              class="relative w-full aspect-[16/9] sm:aspect-[2/1] lg:aspect-[21/9] overflow-hidden rounded-xl border border-foreground/8"
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

        @if (techChoices().length > 0) {
          <app-project-detail-tech-choices [techChoices]="techChoices()" />
        }

        @if (architectureDecisions().length > 0) {
          <app-project-detail-arch-decisions [architectureDecisions]="architectureDecisions()" />
        }

        <app-project-detail-nav
          [previousProject]="previousProject()"
          [nextProject]="nextProject()"
        />
      } @else if (loading()) {
        <div class="page-container pt-6 md:pt-10" aria-hidden="true">
          <div class="h-4 w-32 rounded bg-surface-elevated mb-10"></div>
          <div class="h-3 w-24 rounded bg-surface-elevated mb-4"></div>
          <div class="h-12 w-3/4 max-w-2xl rounded-lg bg-surface-elevated mb-6"></div>
          <div class="h-4 w-full max-w-xl rounded bg-surface-elevated mb-2"></div>
          <div class="h-4 w-2/3 max-w-md rounded bg-surface-elevated"></div>
          <div class="mt-10 w-full aspect-[16/9] sm:aspect-[2/1] lg:aspect-[21/9] rounded-xl border border-foreground/8 bg-surface-elevated"></div>
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
