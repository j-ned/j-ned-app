import {
  Component,
  computed,
  signal,
  inject,
  ChangeDetectionStrategy,
  PLATFORM_ID,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProjectCard } from './components/project-card';
import { PROJECTS_GATEWAY } from '../../core/projects/gateways';
import { FilterProjectsUseCase } from '../../core/projects/use-cases/filter-projects.use-case';
import { PaginateProjectsUseCase } from '../../core/projects/use-cases/paginate-projects.use-case';

@Component({
  selector: 'app-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProjectCard],
  providers: [FilterProjectsUseCase, PaginateProjectsUseCase],
  template: `
    <main
      class="min-h-screen pt-20 pb-16 bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg"
    >
      <section class="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div class="mb-12">
          <h1 class="text-4xl md:text-6xl font-bold mb-6 text-foreground">Mes Projets</h1>
          <p class="text-xl text-muted max-w-2xl leading-relaxed">
            Une sélection de mes derniers projets, expérimentations et contributions open source.
          </p>
        </div>

        <div class="flex flex-wrap gap-4 mb-12">
          @for (filter of filters(); track filter) {
            <button
              (click)="setFilter(filter)"
              [class]="
                filter === activeFilter()
                  ? 'px-4 py-2 rounded-full text-sm font-medium transition-colors bg-primary text-white'
                  : 'px-4 py-2 rounded-full text-sm font-medium transition-colors bg-background/50 border border-foreground/10 text-muted hover:text-foreground hover:border-primary/50'
              "
            >
              {{ filter }}
            </button>
          }
        </div>

        @defer (on viewport) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            @for (project of paginatedProjects(); track project.id) {
              <app-project-card [project]="project" />
            }
          </div>

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
          <div class="flex items-center justify-center gap-2 mt-12">
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
                    ? 'w-10 h-10 rounded-lg text-sm font-medium bg-primary text-white'
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
          </div>

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
  private readonly filterUseCase = inject(FilterProjectsUseCase);
  private readonly paginateUseCase = inject(PaginateProjectsUseCase);

  private projectsResource = this.projectsGateway.getAllProjects();
  protected readonly projects = computed(() => this.projectsResource.value() || []);

  private categoriesObservable = this.projectsGateway.getCategories();
  protected readonly filters = toSignal(this.categoriesObservable, { initialValue: ['Tous'] });

  protected readonly activeFilter = signal('Tous');
  protected readonly currentPage = signal(1);
  protected readonly itemsPerPage = 3;

  protected filteredProjects = this.filterUseCase.execute(this.projects, this.activeFilter);

  protected totalPages = this.paginateUseCase.calculateTotalPages(
    computed(() => this.filteredProjects().length),
    this.itemsPerPage,
  );

  protected paginatedProjects = this.paginateUseCase.execute(
    this.filteredProjects,
    this.currentPage,
    this.itemsPerPage,
  );

  protected pageNumbers = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  protected setFilter(filter: string) {
    this.activeFilter.set(filter);
    this.currentPage.set(1);
  }

  protected goToPage(page: number) {
    this.currentPage.set(page);
    if (isPlatformBrowser(this.platformId)) {
      this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  protected nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      if (isPlatformBrowser(this.platformId)) {
        this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  protected previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      if (isPlatformBrowser(this.platformId)) {
        this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }
}
