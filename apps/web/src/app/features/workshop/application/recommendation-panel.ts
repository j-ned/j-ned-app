import { Component, input } from '@angular/core';
import type { GuideState } from '../domain/models/recommendation.model';
import type { Source, SourceId } from '../domain/models/source.model';
import { INSERT_GUIDE_COPY } from './insert-guide-copy';
import { IsoInsertDesignation } from './iso-insert-designation';
import { SourceCitation } from './source-citation';

@Component({
  selector: 'app-recommendation-panel',
  imports: [IsoInsertDesignation, SourceCitation],
  host: { class: 'block rounded-card border border-line bg-surface p-5 sm:p-6' },
  template: `
    @let current = state();
    @switch (current.status) {
      @case ('incomplete') {
        <p data-testid="recommendation-incomplete" class="text-muted">{{ copy.incomplete }}</p>
      }
      @case ('unavailable') {
        <p data-testid="insert-guide-unavailable" class="font-medium">{{ copy.unavailable }}</p>
      }
      @case ('available') {
        @let entry = current.entry;
        @let catalogue = sources();
        <div data-testid="recommendation-block">
          <h3 class="text-xl font-bold">{{ copy.insertHeading }}</h3>
          @if (entry.insert.kind === 'iso-1832') {
            <app-iso-insert-designation
              class="mt-3"
              [insert]="entry.insert"
              [sources]="catalogue"
            />
          }
        </div>
        <div data-testid="recommendation-block" class="mt-6 border-t border-line pt-5">
          <h3 class="text-xl font-bold">{{ copy.geometryHeading }}</h3>
          <ul class="mt-2 grid gap-3">
            @for (line of entry.geometry; track $index) {
              <li>
                <p data-testid="recommendation-value" class="max-w-prose">{{ line.value }}</p>
                <app-source-citation
                  class="mt-1"
                  [citation]="line.cite"
                  [source]="catalogue[line.cite.source]"
                />
              </li>
            }
          </ul>
        </div>
        <div data-testid="recommendation-block" class="mt-6 border-t border-line pt-5">
          <h3 class="text-xl font-bold">{{ copy.gradeHeading }}</h3>
          <p data-testid="recommendation-value" class="mt-2 max-w-prose">
            {{ entry.grade.value }}
          </p>
          <app-source-citation
            class="mt-1"
            [citation]="entry.grade.cite"
            [source]="catalogue[entry.grade.cite.source]"
          />
        </div>
        @if (entry.pitfalls.length > 0) {
          <div data-testid="recommendation-block" class="mt-6 border-t border-line pt-5">
            <h3 class="text-xl font-bold">{{ copy.pitfallsHeading }}</h3>
            <ul class="mt-2 grid gap-3">
              @for (pitfall of entry.pitfalls; track $index) {
                <li>
                  <p data-testid="recommendation-value" class="max-w-prose">{{ pitfall.value }}</p>
                  <app-source-citation
                    class="mt-1"
                    [citation]="pitfall.cite"
                    [source]="catalogue[pitfall.cite.source]"
                  />
                </li>
              }
            </ul>
          </div>
        }
      }
    }
  `,
})
export class RecommendationPanel {
  readonly state = input.required<GuideState>();
  readonly sources = input.required<Readonly<Record<SourceId, Source>>>();

  protected readonly copy = INSERT_GUIDE_COPY;
}
