import { Component, input, output, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Project } from '@features/projects/domain/models/project.model';
import type { ProjectOutcome } from '@features/projects/domain/models/project-outcome.model';
import { PROJECT_USAGE_LABELS } from '@features/projects/domain/project-outcomes.static-data';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { liveLinkContext, liveLinkLabel } from '../project-kind-copy';
import { ProjectKindStamp } from './project-kind-stamp';

@Component({
  selector: 'app-project-detail-header',
  imports: [RouterLink, AppIcon, Button, ProjectKindStamp],
  host: { class: 'contents' },
  template: `
    @let p = project();
    <header class="page-container pt-8 md:pt-12">
      <a
        routerLink="/projects"
        data-testid="back-link"
        class="group inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-primary"
      >
        <app-icon
          name="arrow-left"
          [size]="16"
          class="transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
        />
        Toutes les réalisations
      </a>
      <div class="mt-7 flex items-center gap-3">
        <p class="font-mono text-[0.8125rem] font-medium text-primary">{{ p.category }}</p>
        @if (p.kind; as kind) {
          <app-project-kind-stamp data-testid="project-detail-kind" [kind]="kind" />
        }
      </div>
      <h1
        data-testid="project-detail-title"
        class="mt-3.5 max-w-4xl text-[clamp(2.75rem,6vw,5.25rem)] font-extrabold leading-none tracking-[-0.04em] text-balance"
      >
        {{ p.title }}
      </h1>
      @if (outcome(); as o) {
        <p
          class="mt-6 max-w-[56ch] text-[clamp(1.1875rem,1.7vw,1.5rem)] font-medium leading-snug tracking-tight text-pretty"
          data-testid="project-outcome"
        >
          {{ o.summary }}
        </p>
        @if (o.usage; as usage) {
          <p class="mt-3 font-mono text-[0.8125rem] text-muted" data-testid="project-usage">
            {{ usageLabels[usage] }}
          </p>
        }
      }
      <p
        class="mt-6 max-w-[62ch] text-[clamp(1.0625rem,1.4vw,1.25rem)] leading-relaxed text-muted text-pretty"
        data-testid="project-detail-description"
      >
        {{ p.description }}
      </p>
      @if (hasLinks()) {
        <div class="mt-8 flex flex-wrap items-center gap-2.5">
          @if (p.liveUrl) {
            <a
              appButton
              [href]="p.liveUrl"
              target="_blank"
              rel="noopener noreferrer"
              (click)="linkClicked.emit()"
            >
              {{ liveLabel() }}<span class="sr-only">{{ liveContext() }}</span>
              <app-icon name="external-link" [size]="14" />
            </a>
          }
          @if (p.repoUrl) {
            <a
              appButton
              variant="outlined"
              [href]="p.repoUrl"
              target="_blank"
              rel="noopener noreferrer"
              (click)="linkClicked.emit()"
              [attr.aria-label]="'Code source de ' + p.title"
            >
              <app-icon name="github" [size]="16" />
              Code source
            </a>
          }
          @if (p.repoUrlFront) {
            <a
              appButton
              variant="outlined"
              [href]="p.repoUrlFront"
              target="_blank"
              rel="noopener noreferrer"
              (click)="linkClicked.emit()"
              [attr.aria-label]="'Code frontend de ' + p.title"
            >
              <app-icon name="github" [size]="16" />
              Frontend
            </a>
          }
          @if (p.repoUrlBack) {
            <a
              appButton
              variant="outlined"
              [href]="p.repoUrlBack"
              target="_blank"
              rel="noopener noreferrer"
              (click)="linkClicked.emit()"
              [attr.aria-label]="'Code backend de ' + p.title"
            >
              <app-icon name="github" [size]="16" />
              Backend
            </a>
          }
        </div>
      }
      @if (p.tags.length > 0) {
        <dl
          class="mt-11 grid gap-1.5 border-y border-foreground/8 py-4.5 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-6"
        >
          <dt class="font-mono text-xs text-muted sm:pt-0.5">stack</dt>
          <dd>
            <ul
              class="flex flex-wrap gap-x-2 font-mono text-[0.8125rem] leading-[1.7]"
              role="list"
              data-testid="project-stack"
            >
              @for (tag of p.tags; track tag) {
                <li class="after:ml-2 after:text-muted after:content-['·'] last:after:content-none">
                  {{ tag }}
                </li>
              }
            </ul>
          </dd>
        </dl>
      }
    </header>
  `,
})
export class ProjectDetailHeader {
  readonly project = input.required<Project>();
  readonly outcome = input<ProjectOutcome | null>(null);
  readonly linkClicked = output<void>();

  protected readonly usageLabels = PROJECT_USAGE_LABELS;
  protected readonly liveLabel = computed(() => liveLinkLabel(this.project().kind));
  protected readonly liveContext = computed(() => liveLinkContext(this.project().title));

  protected readonly hasLinks = computed(() => {
    const p = this.project();
    return Boolean(p.liveUrl || p.repoUrl || p.repoUrlFront || p.repoUrlBack);
  });
}
