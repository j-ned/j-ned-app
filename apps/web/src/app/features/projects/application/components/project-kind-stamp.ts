import { Component, computed, input } from '@angular/core';
import type { ProjectKind } from '../../domain/models/project.model';
import { Stamp } from '@shared/ui/stamp';
import { PROJECT_KIND_LABELS } from '../project-kind-copy';

@Component({
  selector: 'app-project-kind-stamp',
  imports: [Stamp],
  template: `<app-stamp>{{ label() }}</app-stamp>`,
})
export class ProjectKindStamp {
  readonly kind = input.required<ProjectKind>();

  protected readonly label = computed(() => PROJECT_KIND_LABELS[this.kind()]);
}
