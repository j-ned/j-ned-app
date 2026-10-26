import { Component, computed, input } from '@angular/core';
import { isoInsertCode } from '../domain/iso-insert-code';
import type { IsoInsertDesignation as Designation } from '../domain/models/recommendation.model';
import type { Source, SourceId } from '../domain/models/source.model';
import { INSERT_GUIDE_COPY } from './insert-guide-copy';
import { SourceCitation } from './source-citation';

@Component({
  selector: 'app-iso-insert-designation',
  imports: [SourceCitation],
  host: { class: 'block' },
  template: `
    @let catalogue = sources();
    <ul class="grid divide-y divide-line">
      @for (proposal of proposals(); track proposal.situation) {
        <li data-testid="iso-insert-proposal" class="py-5 first:pt-0 last:pb-0">
          <h4 data-testid="iso-insert-situation" class="font-semibold">{{ proposal.label }}</h4>
          <p data-testid="iso-insert-code" class="font-mono text-3xl font-bold tracking-wider">
            {{ proposal.code }}
          </p>
          @for (principle of proposal.choice; track $index) {
            <div data-testid="iso-insert-choice" class="mt-1">
              <app-source-citation [citation]="principle" [source]="catalogue[principle.source]" />
            </div>
          }
          <dl class="mt-4 grid gap-3">
            @for (field of proposal.fields; track $index) {
              <div data-testid="iso-insert-field" class="grid grid-cols-[3rem_1fr] gap-x-3">
                <dt data-testid="iso-insert-field-name" class="col-span-2 text-sm text-muted">
                  {{ field.value.field }}
                </dt>
                <dd data-testid="iso-insert-field-code" class="font-mono text-lg font-semibold">
                  {{ field.value.code }}
                </dd>
                <dd>
                  <span data-testid="iso-insert-field-meaning">{{ field.value.meaning }}</span>
                  <app-source-citation
                    [citation]="field.cite"
                    [source]="catalogue[field.cite.source]"
                  />
                </dd>
              </div>
            }
          </dl>
        </li>
      }
    </ul>
  `,
})
export class IsoInsertDesignation {
  readonly insert = input.required<Designation>();
  readonly sources = input.required<Readonly<Record<SourceId, Source>>>();

  protected readonly proposals = computed(() =>
    this.insert().proposals.map((proposal) => ({
      ...proposal,
      label: INSERT_GUIDE_COPY.situations[proposal.situation],
      code: isoInsertCode(proposal),
    })),
  );
}
