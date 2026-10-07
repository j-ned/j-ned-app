import { Component, computed, input } from '@angular/core';
import type { Project } from '@features/projects/domain/models/project.model';
import { ProjectCaseStudy } from '@features/projects/application/components/project-case-study';
import { ProjectGridCard } from '@features/projects/application/components/project-grid-card';
import { PROJECT_KIND_LABELS } from '@features/projects/application/project-kind-copy';
import { toCaseStudyView, toProjectCardView } from '@features/projects/application/projects-view';

@Component({
  selector: 'app-admin-project-preview',
  imports: [ProjectCaseStudy, ProjectGridCard],
  host: { class: 'block' },
  template: `
    <section
      data-testid="admin-project-preview"
      aria-labelledby="admin-project-preview-title"
      class="rounded-sm border-[1.5px] border-line-strong"
    >
      <div
        class="flex items-center justify-between gap-3 border-b-[1.5px] border-line-strong bg-surface p-3.5 text-sm"
      >
        <div class="grid gap-0.5">
          <h2
            id="admin-project-preview-title"
            data-testid="admin-project-preview-title"
            class="font-display font-bold font-stretch-110%"
          >
            Aperçu public
          </h2>
          @if (kindLabel(); as label) {
            <p data-testid="admin-project-preview-reference" class="font-mono text-xs text-muted">
              Réalisations · {{ label }}
            </p>
          }
        </div>
        <p data-testid="admin-project-preview-live" class="font-mono text-xs text-muted">
          en direct
        </p>
      </div>
      @if (pendingCover()) {
        <p
          data-testid="admin-project-preview-pending-cover"
          class="border-b border-line px-4.5 py-2.5 text-[0.8125rem] text-muted"
        >
          Nouvelle couverture&nbsp;: visible ici après l'enregistrement.
        </p>
      }
      @if (caseStudy(); as study) {
        <div data-testid="admin-project-preview-body" inert class="bg-background p-4.5">
          <app-project-case-study [caseStudy]="study" />
        </div>
      } @else if (card(); as projectCard) {
        <div data-testid="admin-project-preview-body" inert class="bg-background p-4.5">
          <app-project-grid-card [card]="projectCard" />
        </div>
      } @else {
        <p
          data-testid="admin-project-preview-empty"
          class="bg-background px-4.5 py-8 text-center text-sm text-muted"
        >
          Choisissez une nature pour voir la carte.
        </p>
      }
    </section>
  `,
})
export class AdminProjectPreview {
  readonly project = input.required<Project | null>();
  readonly pendingCover = input(false);

  protected readonly kindLabel = computed(() => {
    const kind = this.project()?.kind;
    return kind ? PROJECT_KIND_LABELS[kind] : null;
  });
  protected readonly caseStudy = computed(() => {
    const project = this.project();
    return project?.kind === 'production'
      ? toCaseStudyView(project, Math.max(project.order, 1) - 1)
      : null;
  });
  protected readonly card = computed(() => {
    const project = this.project();
    return project?.kind ? toProjectCardView(project) : null;
  });
}
