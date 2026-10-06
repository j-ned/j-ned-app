import { Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import type { ProjectKind } from '../../domain/models/project.model';
import { ProjectKindStamp } from './project-kind-stamp';

@Component({
  selector: 'app-project-cover',
  imports: [NgOptimizedImage, ProjectKindStamp],
  host: { class: 'block' },
  template: `
    <figure
      data-testid="project-cover"
      class="relative aspect-[16/10] overflow-hidden rounded-md border border-line-strong bg-surface"
    >
      @if (image()) {
        <img
          data-testid="project-cover-image"
          [ngSrc]="image()"
          [alt]="alt()"
          [priority]="priority()"
          fill
          class="object-cover"
        />
      } @else {
        <div
          data-testid="project-cover-placeholder"
          class="size-full bg-foreground/4"
          aria-hidden="true"
        ></div>
      }
      @if (kind(); as kind) {
        <app-project-kind-stamp
          data-testid="project-cover-kind"
          class="pointer-events-none absolute left-3 top-3 z-10"
          [kind]="kind"
        />
      }
    </figure>
  `,
})
export class ProjectCover {
  readonly image = input.required<string>();
  readonly alt = input.required<string>();
  readonly kind = input.required<ProjectKind | null>();
  readonly priority = input(false);
}
