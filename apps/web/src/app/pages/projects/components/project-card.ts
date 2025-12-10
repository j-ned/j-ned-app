import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import type { Project } from '../../../core/projects/models';

@Component({
  selector: 'app-project-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <article
      class="group relative bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col h-full shadow-lg"
    >
      <div class="block aspect-video w-full overflow-hidden relative">
        @if (project().image) {
          <img
            [src]="project().image"
            [alt]="project().title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        } @else {
          <div
            class="w-full h-full flex items-center justify-center text-muted bg-linear-to-br from-primary/10 to-accent/10"
          >
            <span class="text-lg font-medium">Project Preview</span>
          </div>
        }

        <div
          class="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300"
        ></div>
      </div>

      <div class="p-6 flex flex-col grow">
        <span class="text-accent text-sm font-medium uppercase tracking-wider mb-2">
          {{ project().category }}
        </span>

        <h3 class="text-2xl font-bold mb-3 text-foreground">
          {{ project().title }}
        </h3>

        <p class="text-muted mb-4 grow text-sm leading-relaxed">
          {{ project().description }}
        </p>

        <div class="flex flex-wrap gap-2 mb-4">
          @for (tag of project().tags; track tag) {
            <span
              class="px-2.5 py-1 text-xs rounded-lg bg-primary/10 text-foreground border border-primary/20"
            >
              {{ tag }}
            </span>
          }
        </div>

        @if (
          project().liveUrl || project().repoUrl || project().repoUrlFront || project().repoUrlBack
        ) {
          <div class="flex flex-wrap gap-3 mt-auto pt-4 border-t border-foreground/10">
            @if (project().liveUrl) {
              <a
                [href]="project().liveUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <svg class="w-5 h-5">
                  <use href="/icons/sprite.svg#lucide-external-link"></use>
                </svg>
                Voir le projet
              </a>
            }
            @if (project().repoUrl) {
              <a
                [href]="project().repoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"
              >
                <svg class="w-5 h-5">
                  <use href="/icons/sprite.svg#lucide-github"></use>
                </svg>
                Code
              </a>
            }
            @if (project().repoUrlFront) {
              <a
                [href]="project().repoUrlFront"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"
              >
                <svg class="w-5 h-5">
                  <use href="/icons/sprite.svg#lucide-github"></use>
                </svg>
                Frontend
              </a>
            }
            @if (project().repoUrlBack) {
              <a
                [href]="project().repoUrlBack"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"
              >
                <svg class="w-5 h-5">
                  <use href="/icons/sprite.svg#lucide-github"></use>
                </svg>
                Backend
              </a>
            }
          </div>
        }
      </div>
    </article>
  `,
})
export class ProjectCard {
  project = input.required<Project>();
}
