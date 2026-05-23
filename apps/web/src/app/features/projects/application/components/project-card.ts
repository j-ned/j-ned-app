import { Component, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import type { Project } from '../../domain';
import { AnalyticsGateway } from '@features/analytics/domain';
import { AppIcon } from '@shared/icons';

@Component({
  selector: 'app-project-card',
  imports: [NgOptimizedImage, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full animate-fade-up' },
  template: `
    <article
      class="group relative bg-surface border border-foreground/8 rounded-xl overflow-hidden hover:border-primary/30 hover:bg-surface-elevated transition-colors duration-200 flex flex-col h-full"
    >
      <figure class="block aspect-[16/9] md:aspect-[2/1] w-full overflow-hidden relative">
        @if (project().image) {
          <img
            [ngSrc]="project().image"
            [alt]="project().title"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            class="object-cover"
          />
        } @else {
          <div
            class="w-full h-full flex items-center justify-center text-muted bg-primary/10"
          >
            <span class="text-lg font-medium">Project Preview</span>
          </div>
        }
      </figure>

      <div class="p-5 flex flex-col grow">
        <p class="text-accent text-xs font-medium uppercase tracking-wider mb-1.5">
          {{ project().category }}
        </p>

        <h2 class="text-xl md:text-2xl font-bold mb-2 text-foreground">
          {{ project().title }}
        </h2>

        <p class="text-muted mb-3 grow text-sm leading-relaxed line-clamp-2">
          {{ project().description }}
        </p>

        <ul class="flex flex-wrap gap-1.5 mb-3" role="list">
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
            class="flex flex-wrap gap-3 mt-auto pt-3 border-t border-foreground/10"
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
                <app-icon name="external-link" [size]="20" />
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
                <app-icon name="github" [size]="20" />
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
                <app-icon name="github" [size]="20" />
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
                <app-icon name="github" [size]="20" />
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
  private readonly _analytics = inject(AnalyticsGateway);

  readonly project = input.required<Project>();

  protected trackClick(): void {
    this._analytics.trackProjectClick(this.project().id, this.project().title);
  }
}
