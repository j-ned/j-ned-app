import { Component, computed, effect, inject, input, linkedSignal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { INSERT_GUIDE_COPY } from '../../application/insert-guide-copy';
import { INSERT_GUIDE_REFERENCE } from '../../application/insert-guide-reference';
import { insertGuideStatus } from '../../application/insert-guide-status';
import { MaterialCombobox } from '../../application/material-combobox';
import { MaterialSheet } from '../../application/material-sheet';
import { OperationPicker } from '../../application/operation-picker';
import { RecommendationPanel } from '../../application/recommendation-panel';
import { resolveGuideState } from '../../domain/find-recommendation';
import { parseGuideSelection } from '../../domain/guide-selection';

@Component({
  selector: 'app-insert-guide',
  imports: [FormField, MaterialCombobox, MaterialSheet, OperationPicker, RecommendationPanel],
  host: { class: 'block min-h-svh pt-20' },
  template: `
    <div class="page-container pt-18 pb-14 md:pt-26 md:pb-18">
      <h1
        data-testid="insert-guide-title"
        class="text-[clamp(2.75rem,6vw,5.25rem)] font-extrabold leading-none tracking-[-0.04em]"
      >
        {{ copy.heading }}
      </h1>
      <p
        data-testid="insert-guide-lead"
        class="mt-5.5 max-w-[56ch] text-[clamp(1.0625rem,1.4vw,1.25rem)] text-muted"
      >
        {{ copy.lead }}
      </p>
      <div class="mt-12 grid gap-12 lg:grid-cols-2 lg:items-start">
        <div class="grid gap-12">
          <section
            data-testid="insert-guide-material"
            aria-labelledby="insert-guide-material-heading"
          >
            <h2 id="insert-guide-material-heading" class="section-title mb-6">
              {{ copy.materialHeading }}
            </h2>
            <app-material-combobox
              [materials]="reference.materials"
              [formField]="guideForm.material"
            />
            @if (material(); as chosen) {
              <app-material-sheet
                [material]="chosen"
                [sources]="reference.sources"
                [isoGroups]="reference.isoGroups"
              />
            }
          </section>
          <section
            data-testid="insert-guide-operation"
            aria-labelledby="insert-guide-operation-heading"
          >
            <h2 id="insert-guide-operation-heading" class="section-title mb-6">
              {{ copy.operationHeading }}
            </h2>
            <app-operation-picker
              [families]="reference.families"
              [formField]="guideForm.operation"
            />
          </section>
        </div>
        <section
          data-testid="insert-guide-recommendation"
          aria-labelledby="insert-guide-recommendation-heading"
        >
          <h2 id="insert-guide-recommendation-heading" class="section-title mb-6">
            {{ copy.recommendationHeading }}
          </h2>
          <app-recommendation-panel [state]="state()" [sources]="reference.sources" />
          <p data-testid="insert-guide-disclaimer" class="mt-6 max-w-prose text-sm text-muted">
            {{ copy.disclaimer }}
          </p>
        </section>
      </div>
      <p role="status" class="sr-only" data-testid="insert-guide-status">{{ status() }}</p>
    </div>
  `,
})
export class InsertGuide {
  private readonly _router = inject(Router);
  protected readonly reference = inject(INSERT_GUIDE_REFERENCE);

  // eslint-disable-next-line @angular-eslint/no-input-rename -- le nom public est la clé figée des URL partagées (?matiere=), le code reste en anglais
  readonly materialParam = input<string | undefined>(undefined, { alias: 'matiere' });
  readonly operation = input<string | undefined>();

  protected readonly copy = INSERT_GUIDE_COPY;

  private readonly _fromUrl = computed(() =>
    parseGuideSelection(this.reference, this.materialParam(), this.operation()),
  );
  private readonly _selection = linkedSignal(() => this._fromUrl());
  protected readonly guideForm = form(this._selection);
  protected readonly material = computed(() =>
    this.reference.materials.find(({ slug }) => slug === this._selection().material),
  );
  protected readonly state = computed(() => resolveGuideState(this.reference, this._selection()));
  protected readonly status = computed(() =>
    insertGuideStatus(this.state(), this.reference.families),
  );

  // Ne navigue que sur un choix de l'utilisateur : au rendu serveur et au retour arrière, le modèle vient de l'URL.
  private readonly _reflectSelectionInUrl = effect(() => {
    const { material, operation } = this._selection();
    const fromUrl = this._fromUrl();
    if (material === fromUrl.material && operation === fromUrl.operation) return;
    void this._router.navigate([], {
      queryParams: {
        matiere: material === '' ? null : material,
        operation: operation === '' ? null : operation,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });
}
