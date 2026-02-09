import { Component, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import type { Project } from '../../domain';
import { TrackingService } from '../../../../shared/tracking/tracking.service';

@Component({
  selector: 'app-project-card',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <article
      class="group relative bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col h-full shadow-lg"
    >
      <figure class="block aspect-video w-full overflow-hidden relative">
        @if (project().image) {
          <img
            [ngSrc]="project().image"
            [alt]="project().title"
            fill
            class="object-cover group-hover:scale-105 transition-transform duration-500"
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
      </figure>

      <div class="p-6 flex flex-col grow">
        <p class="text-accent text-sm font-medium uppercase tracking-wider mb-2">
          {{ project().category }}
        </p>

        <h2 class="text-2xl font-bold mb-3 text-foreground">
          {{ project().title }}
        </h2>

        <p class="text-muted mb-4 grow text-sm leading-relaxed">
          {{ project().description }}
        </p>

        <ul class="flex flex-wrap gap-2 mb-4" role="list">
          @for (tag of project().tags; track tag) {
            <li>
              <span
                class="px-2.5 py-1 text-xs rounded-lg bg-primary/10 text-foreground border border-primary/20"
              >
                {{ tag }}
              </span>
            </li>
          }
        </ul>

        @if (
          project().liveUrl || project().repoUrl || project().repoUrlFront || project().repoUrlBack
        ) {
          <nav
            class="flex flex-wrap gap-3 mt-auto pt-4 border-t border-foreground/10"
            aria-label="Liens du projet"
          >
            @if (project().liveUrl) {
              <a
                [href]="project().liveUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                [attr.aria-label]="'Voir le projet ' + project().title"
                (click)="trackClick()"
              >
                <svg class="w-5 h-5" aria-hidden="true">
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
                [attr.aria-label]="'Code source du projet ' + project().title"
                (click)="trackClick()"
              >
                <svg class="w-5 h-5" aria-hidden="true">
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
                [attr.aria-label]="'Code source frontend du projet ' + project().title"
                (click)="trackClick()"
              >
                <svg class="w-5 h-5" aria-hidden="true">
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
                [attr.aria-label]="'Code source backend du projet ' + project().title"
                (click)="trackClick()"
              >
                <svg class="w-5 h-5" aria-hidden="true">
                  <use href="/icons/sprite.svg#lucide-github"></use>
                </svg>
                Backend
              </a>
            }
          </nav>
        }
      </div>
    </article>
  `,
})
export class ProjectCard {
  private readonly tracking = inject(TrackingService);

  project = input.required<Project>();

  trackClick(): void {
    this.tracking.trackProjectClick(this.project().id, this.project().title);
  }
}
