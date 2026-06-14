import { Component, computed, effect, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProjectsGateway, type Project } from '@features/projects/domain';
import { AppIcon } from '@shared/icons';

@Component({
  selector: 'app-project-detail',
  imports: [NgOptimizedImage, AppIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @let p = project();
    <main class="min-h-svh pt-20 pb-16">
      <section class="page-container pt-8">
        <a
          routerLink="/projects"
          data-testid="back-link"
          class="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-8"
        >
          <app-icon name="arrow-left" [size]="20" />
          Retour aux projets
        </a>

        @if (p) {
          <article class="bg-surface border border-foreground/8 rounded-xl overflow-hidden mb-10">
            @if (p.image) {
              <figure class="block aspect-[2/1] w-full overflow-hidden relative">
                <img
                  [ngSrc]="p.image"
                  [alt]="p.title"
                  fill
                  priority
                  sizes="100vw"
                  class="object-cover"
                />
              </figure>
            }

            <div class="p-6 md:p-8">
              <p class="text-accent text-xs font-medium uppercase tracking-wider mb-2">
                {{ p.category }}
              </p>

              <h1
                data-testid="project-detail-title"
                class="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground"
              >
                {{ p.title }}
              </h1>

              <p class="text-muted text-base md:text-lg leading-relaxed max-w-prose mb-5">
                {{ p.description }}
              </p>

              @if (p.tags.length > 0) {
                <ul class="flex flex-wrap gap-1.5" role="list">
                  @for (tag of p.tags; track tag) {
                    <li>
                      <span
                        class="px-2.5 py-1 text-xs rounded-lg bg-primary/10 text-foreground border border-primary/20"
                      >
                        {{ tag }}
                      </span>
                    </li>
                  }
                </ul>
              }
            </div>
          </article>

          <section data-testid="tech-choices" class="mb-10" aria-labelledby="tech-choices-title">
            <h2 id="tech-choices-title" class="text-2xl font-bold mb-5 text-foreground">
              Choix techniques
            </h2>

            @if (techChoices().length > 0) {
              <ul class="grid grid-cols-1 md:grid-cols-2 gap-5" role="list">
                @for (choice of techChoices(); track $index) {
                  <li
                    class="bg-surface border border-foreground/8 rounded-xl p-5 hover:border-primary/30 transition-colors"
                  >
                    <h3 class="text-lg font-semibold mb-1.5 text-foreground">{{ choice.techno }}</h3>
                    <p class="text-muted text-sm leading-relaxed">{{ choice.why }}</p>
                  </li>
                }
              </ul>
            } @else {
              <p class="text-muted text-sm">Aucun choix technique documenté pour ce projet.</p>
            }
          </section>

          <section
            data-testid="architecture-decisions"
            aria-labelledby="architecture-decisions-title"
          >
            <h2 id="architecture-decisions-title" class="text-2xl font-bold mb-5 text-foreground">
              Décisions d'architecture
            </h2>

            @if (architectureDecisions().length > 0) {
              <ul class="grid grid-cols-1 md:grid-cols-2 gap-5" role="list">
                @for (item of architectureDecisions(); track $index) {
                  <li
                    class="bg-surface border border-foreground/8 rounded-xl p-5 hover:border-primary/30 transition-colors"
                  >
                    <h3 class="text-lg font-semibold mb-1.5 text-foreground">{{ item.decision }}</h3>
                    <p class="text-muted text-sm leading-relaxed">{{ item.rationale }}</p>
                  </li>
                }
              </ul>
            } @else {
              <p class="text-muted text-sm">Aucune décision d'architecture documentée pour ce projet.</p>
            }
          </section>
        }
      </section>
    </main>
  `,
})
export class ProjectDetail {
  private readonly _gateway = inject(ProjectsGateway);
  private readonly _router = inject(Router);

  readonly slug = input.required<string>();

  private readonly _allProjects = toSignal(this._gateway.getAllProjects(), {
    initialValue: [] as readonly Project[],
  });

  protected readonly project = computed(() =>
    this._allProjects().find((p) => p.slug === this.slug()),
  );
  protected readonly techChoices = computed(() => this.project()?.techChoices ?? []);
  protected readonly architectureDecisions = computed(
    () => this.project()?.architectureDecisions ?? [],
  );

  private readonly _redirectIfMissing = effect(() => {
    const list = this._allProjects();
    if (list.length > 0 && !list.some((p) => p.slug === this.slug())) {
      void this._router.navigate(['/projects']);
    }
  });
}
