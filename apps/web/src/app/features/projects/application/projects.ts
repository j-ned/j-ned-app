import {
  Component,
  computed,
  signal,
  inject,
  afterRenderEffect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AppPaginator, type AppPaginatorEvent } from '@shared/ui/paginator';
import { Button } from '@shared/ui/button';
import { AppIcon } from '@shared/icons/app-icon';
import { RouterLink } from '@angular/router';
import { ProjectCard } from './components/project-card';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { filterProjects, FILTER_ALL } from '../domain/use-cases/filter-projects.use-case';
import {
  paginateProjects,
  calculateTotalPages,
} from '../domain/use-cases/paginate-projects.use-case';

const ALL_LABEL = 'Tous';

/** Première phrase d'une description, pour l'index compact. */
const firstSentence = (text: string): string => text.split(/(?<=\.)\s/)[0] ?? text;

// La pagination ne s'active qu'au-delà d'une page pleine : 6 projets tiennent sur une page.
const ITEMS_PER_PAGE = 12;

/** Nombre d'outils de la stack affichés dans l'index compact. */
const INDEX_STACK_SIZE = 3;

@Component({
  selector: 'app-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-svh pt-20 pb-24' },
  imports: [ProjectCard, AppPaginator, Button, AppIcon, RouterLink],
  template: `
    <section class="page-container" aria-labelledby="projects-heading">
      <header class="pt-18 pb-14 md:pt-26 md:pb-18">
        <p class="animate-fade-up font-mono text-[0.8125rem] font-medium text-primary">
          {{ projectCountLabel() }}
        </p>
        <h1
          id="projects-heading"
          class="animate-fade-up [animation-delay:60ms] mt-4.5 text-[clamp(2.75rem,6vw,5.25rem)] font-extrabold leading-none tracking-[-0.04em]"
        >
          Projets
        </h1>
        <p
          class="animate-fade-up [animation-delay:120ms] mt-5.5 max-w-[56ch] text-[clamp(1.0625rem,1.4vw,1.25rem)] text-muted"
        >
          Des applications en production et les outils qui m'aident à les livrer. Chaque fiche
          détaille les choix techniques et les décisions d'architecture.
        </p>
      </header>

      <div
        class="flex w-fit max-w-full flex-wrap gap-1 rounded-[10px] border border-foreground/8 p-1"
        role="group"
        aria-label="Filtrer par catégorie"
      >
        @for (filter of filterOptions(); track filter.label) {
          <button
            type="button"
            (click)="selectFilter(filter.label)"
            [attr.aria-pressed]="filter.label === activeFilter()"
            class="inline-flex min-h-10 items-center gap-2 rounded-[7px] px-3.5 text-sm font-medium text-muted transition-colors hover:text-foreground aria-pressed:bg-surface-elevated aria-pressed:text-foreground aria-pressed:ring-1 aria-pressed:ring-foreground/15"
          >
            {{ filter.label }}
            <span class="font-mono text-xs" [class.text-primary]="filter.label === activeFilter()">
              {{ filter.count }}
            </span>
          </button>
        }
      </div>

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
        @if (featuredOnPage().length > 0) {
          <ul class="mt-12 grid gap-6 md:grid-cols-2" role="list" aria-label="Projets mis en avant">
            @for (project of featuredOnPage(); track project.id) {
              <li><app-project-card [project]="project" [showKeyDecision]="true" /></li>
            }
          </ul>
        }

        @if (indexOnPage().length > 0) {
          <section class="mt-18" aria-labelledby="projects-index-heading">
            <h2
              id="projects-index-heading"
              class="flex justify-between gap-4 border-b border-foreground/8 pb-3 font-mono text-[0.8125rem] font-medium text-muted"
            >
              <span>{{ indexLabel() }}</span>
              <span>{{ indexOnPage().length }}</span>
            </h2>
            <ul role="list">
              @for (project of indexOnPage(); track project.id) {
                <li class="border-b border-foreground/8">
                  <a
                    [routerLink]="['/projects', project.slug]"
                    class="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1.5 py-5.5 lg:grid-cols-[15rem_minmax(0,1fr)_14rem_auto]"
                    data-testid="project-index-link"
                  >
                    <span
                      class="text-[1.1875rem] font-semibold tracking-tight transition-colors group-hover:text-primary"
                      >{{ project.title }}</span
                    >
                    <span
                      class="col-span-full line-clamp-2 text-[0.9375rem] text-muted lg:col-span-1"
                      >{{ project.summary }}</span
                    >
                    <span class="hidden font-mono text-[0.78125rem] text-muted lg:block">{{
                      project.stack
                    }}</span>
                    <app-icon
                      name="arrow-right"
                      [size]="18"
                      class="row-start-1 col-start-2 text-muted transition-[color,translate] duration-300 group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none lg:row-start-auto lg:col-start-auto"
                    />
                  </a>
                </li>
              }
            </ul>
          </section>
        }
      }

      @if (!failed() && projectsResource.hasValue() && filteredProjects().length === 0) {
        <div class="text-center py-16">
          <p class="text-muted text-lg">Aucun projet trouvé pour ce filtre.</p>
        </div>
      }

      @if (totalPages() > 1) {
        <app-paginator
          class="block mt-12"
          [rows]="ITEMS_PER_PAGE"
          [totalRecords]="filteredProjects().length"
          [first]="paginatorFirst()"
          (pageChange)="goToPage($event)"
        />
      }
    </section>
  `,
})
export class Projects {
  private readonly _projectsGateway = inject(ProjectsGateway);

  protected readonly projectsResource = rxResource({
    stream: () => this._projectsGateway.getAllProjects(),
  });
  protected readonly projects = computed(() =>
    this.projectsResource.hasValue() ? this.projectsResource.value() : [],
  );
  protected readonly failed = computed(() => this.projectsResource.status() === 'error');

  private readonly categoriesResource = rxResource({
    stream: () => this._projectsGateway.getCategories(),
  });
  protected readonly filters = computed(() =>
    this.categoriesResource.hasValue() ? this.categoriesResource.value() : [ALL_LABEL],
  );

  protected readonly activeFilter = signal(ALL_LABEL);
  protected readonly currentPage = signal(1);

  protected readonly filteredProjects = computed(() => {
    const f = this.activeFilter();
    return filterProjects(this.projects(), f === ALL_LABEL ? FILTER_ALL : f);
  });

  protected readonly totalPages = computed(() =>
    calculateTotalPages(this.filteredProjects().length, ITEMS_PER_PAGE),
  );

  protected readonly paginatedProjects = computed(() =>
    paginateProjects(this.filteredProjects(), this.currentPage(), ITEMS_PER_PAGE),
  );

  // « Tous » : les projets mis en avant en grandes cartes, les autres dans l'index compact.
  // Filtre actif : tout passe dans l'index.
  private readonly showFeatured = computed(() => this.activeFilter() === ALL_LABEL);

  protected readonly featuredOnPage = computed(() =>
    this.showFeatured() ? this.paginatedProjects().filter((p) => p.featured) : [],
  );

  protected readonly indexOnPage = computed(() =>
    this.paginatedProjects()
      .filter((p) => !this.showFeatured() || !p.featured)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        summary: firstSentence(p.description),
        stack: p.tags.slice(0, INDEX_STACK_SIZE).join(' · '),
      })),
  );

  protected readonly indexLabel = computed(() =>
    this.showFeatured() ? 'Autres projets' : this.activeFilter(),
  );

  protected readonly filterOptions = computed(() =>
    this.filters().map((label) => ({
      label,
      count:
        label === ALL_LABEL
          ? this.projects().length
          : this.projects().filter((p) => p.category === label).length,
    })),
  );

  protected readonly projectCountLabel = computed(() => {
    const count = this.projects().length;
    return `${count} projet${count > 1 ? 's' : ''}`;
  });

  protected readonly paginatorFirst = computed(() => (this.currentPage() - 1) * ITEMS_PER_PAGE);

  protected readonly ITEMS_PER_PAGE = ITEMS_PER_PAGE;

  protected retry(): void {
    this.projectsResource.reload();
    this.categoriesResource.reload();
  }

  constructor() {
    // Scroll-to-top a chaque changement de page (skip render initial).
    // afterRenderEffect = no-op SSR, pas besoin de isPlatformBrowser.
    let isInitial = true;
    afterRenderEffect({
      write: () => {
        this.currentPage();
        if (isInitial) {
          isInitial = false;
          return;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  }

  protected selectFilter(filter: string): void {
    this.activeFilter.set(filter);
    this.currentPage.set(1);
  }

  protected goToPage(event: AppPaginatorEvent): void {
    this.currentPage.set(event.page + 1);
  }
}
