import {
  Component,
  computed,
  signal,
  inject,
  ChangeDetectionStrategy,
  PLATFORM_ID,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { Paginator, type PaginatorState } from 'primeng/paginator';
import { ProjectCard } from './components/project-card';
import { PROJECTS_GATEWAY } from './tokens';
import { AppIcon } from '@shared/icons';
import { filterProjects, paginateProjects, calculateTotalPages } from '../domain';

@Component({
  selector: 'app-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  imports: [ProjectCard, Paginator, AppIcon],
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

        <nav class="flex flex-wrap gap-4 mb-12" aria-label="Filtres" role="menu">
          @for (filter of filters(); track filter) {
            <button
              (click)="setFilter(filter)"
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
          <p-paginator
            [rows]="itemsPerPage"
            [totalRecords]="filteredProjects().length"
            [first]="paginatorFirst()"
            (onPageChange)="onPageChange($event)"
            styleClass="justify-center bg-transparent mt-12"
          />
        }
      </section>
    </main>
  `,
})
export class Projects {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly projectsGateway = inject(PROJECTS_GATEWAY);

  private readonly projectsResource = rxResource({
    stream: () => this.projectsGateway.getAllProjects(),
  });
  protected readonly projects = computed(() => this.projectsResource.value() || []);

  private readonly categoriesResource = rxResource({
    stream: () => this.projectsGateway.getCategories(),
  });
  protected readonly filters = computed(() => this.categoriesResource.value() ?? ['Tous']);

  protected readonly activeFilter = signal('Tous');
  protected readonly currentPage = signal(1);
  protected readonly itemsPerPage = 3;

  protected readonly filteredProjects = computed(() =>
    filterProjects(this.projects(), this.activeFilter()),
  );

  protected readonly totalPages = computed(() =>
    calculateTotalPages(this.filteredProjects().length, this.itemsPerPage),
  );

  protected readonly paginatedProjects = computed(() =>
    paginateProjects(this.filteredProjects(), this.currentPage(), this.itemsPerPage),
  );

  protected readonly paginatorFirst = computed(() => (this.currentPage() - 1) * this.itemsPerPage);

  protected setFilter(filter: string): void {
    this.activeFilter.set(filter);
    this.currentPage.set(1);
  }

  protected onPageChange(event: PaginatorState): void {
    this.currentPage.set((event.page ?? 0) + 1);
    if (isPlatformBrowser(this.platformId)) {
      this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
