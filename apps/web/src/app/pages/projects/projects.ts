import {
  Component,
  computed,
  signal,
  inject,
  ChangeDetectionStrategy,
  PLATFORM_ID,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ProjectCard } from './components/project-card';
import { PROJECTS } from './data/projects.data';

@Component({
  selector: 'app-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProjectCard],
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

        <!-- Filter Bar -->
        <div class="flex flex-wrap gap-4 mb-12">
          @for (filter of filters(); track filter; let i = $index) {
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

        <!-- Projects Grid - 3 colonnes -->
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

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="flex items-center justify-center gap-2 mt-12">
            <!-- Bouton Précédent -->
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

            <!-- Numéros de page -->
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

            <!-- Bouton Suivant -->
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

          <!-- Info pagination -->
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

  protected readonly projects = signal(PROJECTS.sort((a, b) => a.order - b.order));
  protected readonly filters = signal(['Tous', 'Application Web', 'Mobile', 'Script']);
  protected readonly activeFilter = signal('Tous');
  protected readonly currentPage = signal(1);
  protected readonly itemsPerPage = 3;

  protected filteredProjects = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'Tous') {
      return this.projects();
    }
    return this.projects().filter((p) => p.category === filter);
  });

  protected totalPages = computed(() => {
    return Math.ceil(this.filteredProjects().length / this.itemsPerPage);
  });

  protected paginatedProjects = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredProjects().slice(startIndex, endIndex);
  });

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
