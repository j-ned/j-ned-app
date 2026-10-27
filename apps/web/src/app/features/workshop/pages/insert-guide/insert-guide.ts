import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { injectMarkNotFound, injectMarkUnavailable } from '@core/ssr/response-status';
import { PageNotFound } from '../../../../pages/page-not-found';
import { INSERT_GUIDE_COPY } from '../../application/insert-guide-copy';
import { noseRadiusLabel } from '../../application/nose-radius-label';
import { materialsOf, rowsFor } from '../../domain/insert-guide-rows';
import { HttpInsertGuideGateway } from '../../infra/gateways/http-insert-guide.gateway';

@Component({
  selector: 'app-insert-guide',
  imports: [PageNotFound],
  host: { class: 'block', '[class.min-h-svh]': '!notFound()', '[class.pt-20]': '!notFound()' },
  template: `
    @if (notFound()) {
      <app-page-not-found />
    } @else {
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
        <p data-testid="insert-guide-disclaimer" class="mt-4 max-w-prose text-sm text-muted">
          {{ copy.disclaimer }}
        </p>
        @if (guide()) {
          @if (materials().length === 0) {
            <p data-testid="insert-guide-empty" class="mt-12 font-medium">{{ copy.empty }}</p>
          } @else {
            <div class="mt-12 max-w-sm">
              <label for="insert-guide-material" class="field-label">{{
                copy.materialLabel
              }}</label>
              <select
                #materialSelect
                id="insert-guide-material"
                data-testid="insert-guide-material"
                class="app-select w-full"
                (change)="chooseMaterial(materialSelect.value)"
              >
                <!-- [selected] sélectionne dans le navigateur, [attr.selected] dans le HTML rendu par le serveur -->
                <option
                  value=""
                  [selected]="material() === ''"
                  [attr.selected]="material() === '' ? '' : null"
                >
                  {{ copy.materialPlaceholder }}
                </option>
                @for (name of materials(); track name) {
                  <option
                    [value]="name"
                    [selected]="name === material()"
                    [attr.selected]="name === material() ? '' : null"
                  >
                    {{ name }}
                  </option>
                }
              </select>
            </div>
            @if (material() !== '') {
              <div
                role="region"
                tabindex="0"
                aria-labelledby="insert-guide-caption"
                class="mt-10 overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <table
                  data-testid="insert-guide-table"
                  class="w-full border-collapse text-left text-[0.9375rem]"
                >
                  <caption id="insert-guide-caption" class="mb-4 text-left text-xl font-bold">
                    {{
                      caption()
                    }}
                  </caption>
                  <thead>
                    <tr class="border-b-[1.5px] border-line-strong">
                      <th scope="col" class="table-head pr-3 text-left">
                        {{ copy.columns.operation }}
                      </th>
                      <th scope="col" class="table-head px-3 text-left">
                        {{ copy.columns.insert }}
                      </th>
                      <th scope="col" class="table-head px-3 text-left">
                        {{ copy.columns.noseRadius }}
                      </th>
                      <th scope="col" class="table-head pl-3 text-left">
                        {{ copy.columns.note }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of rows(); track row.operation + row.insert + row.noseRadius) {
                      <tr data-testid="insert-guide-row" class="border-b border-line align-top">
                        <th scope="row" class="py-3 pr-3 font-semibold">{{ row.operation }}</th>
                        <td class="px-3 py-3 font-mono">{{ row.insert }}</td>
                        <td class="px-3 py-3 whitespace-nowrap tabular-nums">
                          {{ row.noseRadius }}
                        </td>
                        <td class="py-3 pl-3 text-muted">{{ row.note }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
        }
      </div>
    }
  `,
})
export class InsertGuide {
  private readonly _gateway = inject(HttpInsertGuideGateway);
  private readonly _router = inject(Router);
  private readonly _markNotFound = injectMarkNotFound();
  private readonly _markUnavailable = injectMarkUnavailable();

  // eslint-disable-next-line @angular-eslint/no-input-rename -- le nom public est la clé figée des URL partagées (?matiere=), le code reste en anglais
  readonly materialParam = input<string | undefined>(undefined, { alias: 'matiere' });

  protected readonly copy = INSERT_GUIDE_COPY;

  // Guide éteint : vraie 404. Lecture en échec, 404 compris : 503, nginx sert sa dernière copie.
  private readonly _guideResource = rxResource({
    stream: () =>
      this._gateway.getGuide().pipe(
        tap({
          next: ({ enabled }) => {
            if (!enabled) this._markNotFound();
          },
          error: () => this._markUnavailable(),
        }),
      ),
  });
  protected readonly guide = computed(() =>
    this._guideResource.hasValue() ? this._guideResource.value() : undefined,
  );
  protected readonly notFound = computed(() => this.guide()?.enabled === false);
  private readonly _entries = computed(() => this.guide()?.entries ?? []);
  protected readonly materials = computed(() => materialsOf(this._entries()));
  protected readonly material = computed(() => {
    const asked = this.materialParam() ?? '';
    return this.materials().includes(asked) ? asked : '';
  });
  protected readonly caption = computed(() => `${this.copy.tableCaption} ${this.material()}`);
  protected readonly rows = computed(() =>
    rowsFor(this._entries(), this.material()).map((row) => ({
      ...row,
      noseRadius: noseRadiusLabel(row.noseRadius),
    })),
  );

  protected chooseMaterial(material: string): void {
    void this._router.navigate([], {
      queryParams: { matiere: material === '' ? null : material },
      replaceUrl: true,
    });
  }
}
