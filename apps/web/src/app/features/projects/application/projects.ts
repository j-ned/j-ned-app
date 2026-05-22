import {
  Component,
  computed,
  signal,
  inject,
  afterRenderEffect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AppPaginator, type AppPaginatorEvent } from '@shared/ui';
import { ProjectCard } from './components/project-card';
import { ProjectsGateway } from '@features/projects/domain';
import { AppIcon } from '@shared/icons';
import { filterProjects, paginateProjects, calculateTotalPages, FILTER_ALL } from '../domain';

const ALL_LABEL = 'Tous';

const ITEMS_PER_PAGE = 3;


@Component({
  selector: 'app-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  imports: [ProjectCard, AppPaginator, AppIcon],
  template: `
    <main
      class="min-h-screen pt-20 pb-16 bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg"
    >
      <section class="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div class="text-center mb-14">
          <span
            class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-5"
          >
            <app-icon name="desktop" [size]="16" />
            Portfolio
          </span>
          <h1
            class="text-4xl md:text-6xl font-extrabold tracking-tight mb-5"
            style="background: linear-gradient(135deg, var(--color-foreground) 40%, var(--color-primary) 100%); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;"
          >
            Mes Projets
          </h1>
          <p class="text-muted max-w-xl mx-auto text-base md:text-lg leading-relaxed">
            Une sélection de mes derniers projets, expérimentations et contributions open source.
          </p>
        </div>

        <nav class="flex flex-wrap gap-4 mb-12" aria-label="Filtres par categorie">
          @for (filter of filters(); track filter) {
            <button
              type="button"
              (click)="selectFilter(filter)"
              [attr.aria-pressed]="filter === activeFilter()"
              [class]="
                filter === activeFilter()
                  ? 'px-4 py-2 rounded-full text-sm font-medium transition-colors bg-primary-bg text-white'
                  : 'px-4 py-2 rounded-full text-sm font-medium transition-colors bg-background/50 border border-foreground/10 text-muted hover:text-foreground hover:border-primary/50'
              "
            >
              {{ filter }}
            </button>
          }
        </nav>

        <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12" role="list">
          @for (project of paginatedProjects(); track project.id) {
            <li>
              <app-project-card [project]="project" />
            </li>
          }
        </ul>

        @if (filteredProjects().length === 0) {
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
    </main>
  `,
})
export class Projects {
  private readonly _projectsGateway = inject(ProjectsGateway);

  private readonly projectsResource = rxResource({
    stream: () => this._projectsGateway.getAllProjects(),
  });
  protected readonly projects = computed(() => this.projectsResource.value() ?? []);

  private readonly categoriesResource = rxResource({
    stream: () => this._projectsGateway.getCategories(),
  });
  protected readonly filters = computed(() => this.categoriesResource.value() ?? [ALL_LABEL]);

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

  protected readonly paginatorFirst = computed(() => (this.currentPage() - 1) * ITEMS_PER_PAGE);

  protected readonly ITEMS_PER_PAGE = ITEMS_PER_PAGE;

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
