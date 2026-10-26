import { Component, input } from '@angular/core';
import type { IsoGroup, IsoGroupLetter, Material } from '../domain/models/material.model';
import type { Source, SourceId } from '../domain/models/source.model';
import { INSERT_GUIDE_COPY } from './insert-guide-copy';
import { IsoGroupBadge } from './iso-group-badge';
import { SourceCitation } from './source-citation';

@Component({
  selector: 'app-material-sheet',
  imports: [IsoGroupBadge, SourceCitation],
  host: {
    class: 'mt-6 block rounded-card border border-line bg-surface p-5 sm:p-6',
    'data-testid': 'material-sheet',
  },
  template: `
    @let sheet = material();
    @let catalogue = sources();
    <h3 data-testid="material-sheet-name" class="text-xl font-bold text-balance">
      {{ sheet.designations[0].value }}
    </h3>
    <div data-testid="material-sheet-group" class="mt-3">
      <app-iso-group-badge [group]="isoGroups()[sheet.isoGroup.value]" />
      <app-source-citation
        class="mt-1"
        [citation]="sheet.isoGroup.cite"
        [source]="catalogue[sheet.isoGroup.cite.source]"
      />
    </div>
    @for (trait of sheet.behaviour; track $index) {
      <div data-testid="material-behaviour" class="mt-4">
        <p data-testid="material-behaviour-text" class="max-w-prose">{{ trait.value }}</p>
        <app-source-citation
          class="mt-1"
          [citation]="trait.cite"
          [source]="catalogue[trait.cite.source]"
        />
      </div>
    }
    <h4
      data-testid="material-designations-heading"
      class="mt-5 border-t border-line pt-5 text-sm font-semibold"
    >
      {{ copy.designationsHeading }}
    </h4>
    <dl class="mt-3 grid gap-3">
      @for (designation of sheet.designations; track designation.system + designation.value) {
        <div data-testid="material-designation">
          <dt data-testid="material-designation-system" class="text-sm text-muted">
            {{ copy.designationSystems[designation.system] }}
          </dt>
          <dd>
            <span data-testid="material-designation-value" class="font-mono">{{
              designation.value
            }}</span>
            <app-source-citation
              [citation]="designation.cite"
              [source]="catalogue[designation.cite.source]"
            />
          </dd>
        </div>
      }
    </dl>
  `,
})
export class MaterialSheet {
  readonly material = input.required<Material>();
  readonly sources = input.required<Readonly<Record<SourceId, Source>>>();
  readonly isoGroups = input.required<Readonly<Record<IsoGroupLetter, IsoGroup>>>();

  protected readonly copy = INSERT_GUIDE_COPY;
}
