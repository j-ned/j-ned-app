import {
  Component,
  computed,
  signal,
  inject,
  ChangeDetectionStrategy,
  PLATFORM_ID,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ProjectCard } from './components/project-card';
import { PROJECTS_GATEWAY } from './tokens';
import { filterProjects, paginateProjects, calculateTotalPages } from '../domain';

@Component({
  selector: 'app-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  imports: [ProjectCard],
  template: `
    <main
      class="min-h-screen pt-20 pb-16 bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg"
    >
      <section class="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div class="text-center mb-14">
          <span
            class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-5"
          >
            <svg aria-hidden="true" class="w-4 h-4">
              <use href="/icons/sprite.svg#lucide-laptop"></use>
            </svg>
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

        @defer (on viewport) {
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
        } @placeholder {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            @for (i of [1, 2, 3]; track i) {
              <div
                class="h-80 bg-background/50 border border-foreground/10 rounded-2xl animate-pulse"
              ></div>
            }
          </div>
        }

        @if (totalPages() > 1) {
          <nav class="flex items-center justify-center gap-2 mt-12" aria-label="Pagination">
            <button
              (click)="previousPage()"
              [disabled]="currentPage() === 1"
              [class]="
                currentPage() === 1
                  ? 'px-4 py-2 rounded-lg text-sm font-medium bg-background/50 border border-foreground/10 text-muted cursor-not-allowed opacity-50'
                  : 'px-4 py-2 rounded-lg text-sm font-medium bg-background/50 border border-foreground/10 text-foreground hover:border-primary/50 hover:text-primary transition-colors'
              "
            >
              ← Précédent
            </button>

            @for (page of pageNumbers(); track page) {
              <button
                (click)="goToPage(page)"
                [class]="
                  page === currentPage()
                    ? 'w-10 h-10 rounded-lg text-sm font-medium bg-primary-bg text-white'
                    : 'w-10 h-10 rounded-lg text-sm font-medium bg-background/50 border border-foreground/10 text-foreground hover:border-primary/50 hover:text-primary transition-colors'
                "
              >
                {{ page }}
              </button>
            }

            <button
              (click)="nextPage()"
              [disabled]="currentPage() === totalPages()"
              [class]="
                currentPage() === totalPages()
                  ? 'px-4 py-2 rounded-lg text-sm font-medium bg-background/50 border border-foreground/10 text-muted cursor-not-allowed opacity-50'
                  : 'px-4 py-2 rounded-lg text-sm font-medium bg-background/50 border border-foreground/10 text-foreground hover:border-primary/50 hover:text-primary transition-colors'
              "
            >
              Suivant →
            </button>
          </nav>

          <div class="text-center mt-6">
            <p class="text-sm text-muted">
              Page {{ currentPage() }} sur {{ totalPages() }} ({{
                filteredProjects().length
              }}
              projet{{ filteredProjects().length > 1 ? 's' : '' }})
            </p>
          </div>
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

  private categoriesObservable = this.projectsGateway.getCategories();
  protected readonly filters = toSignal(this.categoriesObservable, { initialValue: ['Tous'] });

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

  protected pageNumbers = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  protected setFilter(filter: string): void {
    this.activeFilter.set(filter);
    this.currentPage.set(1);
  }

  protected goToPage(page: number): void {
    this.currentPage.set(page);
    if (isPlatformBrowser(this.platformId)) {
      this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  protected nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      if (isPlatformBrowser(this.platformId)) {
        this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  protected previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      if (isPlatformBrowser(this.platformId)) {
        this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }
}
