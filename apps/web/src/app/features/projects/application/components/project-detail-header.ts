import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Project } from '@features/projects/domain/models/project.model';
import { AppIcon } from '@shared/icons/app-icon';

@Component({
  selector: 'app-project-detail-header',
  imports: [RouterLink, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <header class="page-container pt-6 md:pt-10">
      <a
        routerLink="/projects"
        data-testid="back-link"
        class="group inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-8"
      >
        <app-icon
          name="arrow-left"
          [size]="18"
          class="transition-transform group-hover:-translate-x-0.5"
        />
        Retour aux projets
      </a>

      <p class="text-accent text-xs font-semibold uppercase tracking-[0.2em] mb-3">
        {{ project().category }}
      </p>

      <h1
        data-testid="project-detail-title"
        class="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance max-w-4xl"
      >
        {{ project().title }}
      </h1>

      <p class="mt-5 text-lg text-muted leading-relaxed max-w-2xl text-pretty">
        {{ project().description }}
      </p>

      @if (hasLinks()) {
        @let p = project();
        <div class="mt-7 flex flex-wrap items-center gap-3">
          @if (p.liveUrl) {
            <a
              [href]="p.liveUrl"
              target="_blank"
              rel="noopener noreferrer"
              (click)="linkClicked.emit()"
              class="inline-flex items-center gap-2 rounded-full bg-primary-bg px-6 py-3 text-sm font-semibold text-white transition-[transform,opacity] duration-200 hover:opacity-90 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              [attr.aria-label]="'Voir la démo de ' + p.title"
            >
              <app-icon name="external-link" [size]="18" />
              Voir la démo
            </a>
          }
          @if (p.repoUrl) {
            <a
              [href]="p.repoUrl"
              target="_blank"
              rel="noopener noreferrer"
              (click)="linkClicked.emit()"
              class="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              [attr.aria-label]="'Code source de ' + p.title"
            >
              <app-icon name="github" [size]="18" />
              Code source
            </a>
          }
          @if (p.repoUrlFront) {
            <a
              [href]="p.repoUrlFront"
              target="_blank"
              rel="noopener noreferrer"
              (click)="linkClicked.emit()"
              class="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              [attr.aria-label]="'Code frontend de ' + p.title"
            >
              <app-icon name="github" [size]="18" />
              Frontend
            </a>
          }
          @if (p.repoUrlBack) {
            <a
              [href]="p.repoUrlBack"
              target="_blank"
              rel="noopener noreferrer"
              (click)="linkClicked.emit()"
              class="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              [attr.aria-label]="'Code backend de ' + p.title"
            >
              <app-icon name="github" [size]="18" />
              Backend
            </a>
          }
        </div>
      }

      @if (project().tags.length > 0) {
        <div class="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-muted/70">Stack</span>
          <ul class="flex flex-wrap gap-2" role="list">
            @for (tag of project().tags; track tag) {
              <li>
                <span
                  class="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-foreground/90 ring-1 ring-inset ring-primary/20"
                >
                  {{ tag }}
                </span>
              </li>
            }
          </ul>
        </div>
      }
    </header>
  `,
})
export class ProjectDetailHeader {
  readonly project = input.required<Project>();
  readonly linkClicked = output<void>();

  protected readonly hasLinks = computed(() => {
    const p = this.project();
    return Boolean(p.liveUrl || p.repoUrl || p.repoUrlFront || p.repoUrlBack);
  });
}
