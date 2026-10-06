import { Component, computed, inject, linkedSignal, ChangeDetectionStrategy } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Button } from '@shared/ui/button';
import { ProjectCaseStudy } from './components/project-case-study';
import { ProjectGridCard } from './components/project-grid-card';
import { ProjectKindFilters } from './components/project-kind-filters';
import { ProjectKindLegend } from './components/project-kind-legend';
import { toProjectsView, type CaseStudyView } from './projects-view';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { filterProjectsByKind } from '../domain/filter-projects-by-kind';
import type { Project, ProjectKindFilter } from '../domain/models/project.model';

@Component({
  selector: 'app-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-svh pt-20 pb-24' },
  imports: [ProjectCaseStudy, ProjectGridCard, ProjectKindFilters, ProjectKindLegend, Button],
  template: `
    @let v = view();
    <section class="page-container" aria-labelledby="projects-heading">
      <header
        class="grid gap-10 pt-18 pb-14 md:pt-26 md:pb-18 lg:grid-cols-[minmax(0,1fr)_23.75rem] lg:items-end lg:gap-16"
      >
        <div>
          <p
            data-testid="projects-count"
            class="animate-fade-up font-mono text-[0.8125rem] font-medium text-primary"
          >
            {{ projectCountLabel() }}
          </p>
          <h1
            id="projects-heading"
            data-testid="projects-title"
            class="mt-4.5 text-[clamp(2.75rem,6vw,5.25rem)] font-extrabold leading-none tracking-[-0.04em]"
          >
            Réalisations
          </h1>
          <p
            data-testid="projects-intro"
            class="animate-fade-up [animation-delay:120ms] mt-5.5 max-w-[56ch] text-[clamp(1.0625rem,1.4vw,1.25rem)] text-muted"
          >
            {{ v.intro }}
          </p>
        </div>
        <app-project-kind-legend
          class="animate-fade-up [animation-delay:200ms]"
          [rows]="v.legend"
        />
      </header>

      @if (failed()) {
        <div class="text-center py-12" role="alert" data-testid="projects-error">
          <p class="text-muted text-lg mb-4">
            Les projets n'ont pas pu être chargés. Vérifiez votre connexion, puis réessayez.
          </p>
          <app-button severity="secondary" variant="outlined" (click)="retry()"
            >Réessayer</app-button
          >
        </div>
      } @else {
        <app-project-kind-filters [options]="v.filters" [(active)]="filter" />
        <p data-testid="projects-visible-count" role="status" class="sr-only">
          {{ visibleCountLabel() }}
        </p>

        @if (projectsResource.hasValue() && v.total === 0) {
          <p data-testid="projects-empty" class="py-16 text-center text-lg text-muted">
            Aucune réalisation pour le moment.
          </p>
        }

        @if (v.caseStudies.length > 0) {
          <section
            data-testid="projects-case-studies"
            class="mt-12"
            aria-labelledby="projects-case-studies-heading"
          >
            <div class="flex items-baseline justify-between gap-4 border-b border-line-strong pb-4">
              <h2 id="projects-case-studies-heading" class="text-2xl font-bold tracking-tight">
                En production
              </h2>
              <p
                data-testid="projects-case-studies-count"
                class="font-mono text-[0.8125rem] text-muted"
              >
                {{ caseStudiesCountLabel() }}
              </p>
            </div>
            <ul role="list">
              @for (caseStudy of v.caseStudies; track caseStudy.id) {
                <li class="border-b border-line py-12 lg:py-16">
                  <app-project-case-study
                    [caseStudy]="caseStudy"
                    [priority]="$first"
                    [reversed]="$even"
                    (liveLinkClicked)="trackLiveLink(caseStudy)"
                  />
                </li>
              }
            </ul>
          </section>
        }

        @if (v.cards.length > 0) {
          <section
            data-testid="projects-cards"
            class="mt-18"
            aria-labelledby="projects-cards-heading"
          >
            <div class="flex items-baseline justify-between gap-4 border-b border-line-strong pb-4">
              <h2 id="projects-cards-heading" class="text-2xl font-bold tracking-tight">
                Démos et outils
              </h2>
              <p data-testid="projects-cards-count" class="font-mono text-[0.8125rem] text-muted">
                {{ cardsCountLabel() }}
              </p>
            </div>
            <ul role="list" class="mt-10 grid gap-x-8 gap-y-12 md:grid-cols-2">
              @for (card of v.cards; track card.id) {
                <li>
                  <app-project-grid-card [card]="card" />
                </li>
              }
            </ul>
          </section>
        }
      }
    </section>
  `,
})
export class Projects {
  private readonly _projectsGateway = inject(ProjectsGateway);
  private readonly _analytics = inject(AnalyticsGateway);

  protected readonly projectsResource = rxResource({
    stream: () => this._projectsGateway.getAllProjects(),
  });
  protected readonly projects = computed(() =>
    this.projectsResource.hasValue() ? this.projectsResource.value() : [],
  );
  protected readonly failed = computed(() => this.projectsResource.status() === 'error');

  protected readonly filter = linkedSignal<readonly Project[], ProjectKindFilter>({
    source: this.projects,
    computation: (projects, previous) =>
      previous && filterProjectsByKind(projects, previous.value).length > 0
        ? previous.value
        : 'all',
  });

  protected readonly view = computed(() => toProjectsView(this.projects(), this.filter()));

  protected readonly projectCountLabel = computed(() => {
    const { total } = this.view();
    return `${total}\u00a0réalisation${total > 1 ? 's' : ''}`;
  });

  protected readonly visibleCountLabel = computed(() => {
    const { visibleCount } = this.view();
    const plural = visibleCount > 1 ? 's' : '';
    return `${visibleCount}\u00a0réalisation${plural} affichée${plural}`;
  });

  protected readonly caseStudiesCountLabel = computed(() => {
    const count = this.view().caseStudies.length;
    return `${count}\u00a0application${count > 1 ? 's' : ''}`;
  });

  protected readonly cardsCountLabel = computed(() => {
    const count = this.view().cards.length;
    return `${count}\u00a0projet${count > 1 ? 's' : ''}`;
  });

  protected retry(): void {
    this.projectsResource.reload();
  }

  protected trackLiveLink({ id, title }: CaseStudyView): void {
    this._analytics.trackProjectClick(id, title);
  }
}
