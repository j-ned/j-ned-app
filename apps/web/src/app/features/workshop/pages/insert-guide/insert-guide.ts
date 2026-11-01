import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { tap } from 'rxjs';
import { injectMarkNotFound, injectMarkUnavailable } from '@core/ssr/response-status';
import { SuggestInput } from '@shared/ui/suggest-input';
import { PageNotFound } from '../../../../pages/page-not-found';
import { INSERT_GUIDE_COPY } from '../../application/insert-guide-copy';
import { noseRadiusLabel } from '../../application/nose-radius-label';
import { decodeInsertCode, normalizeInsertCode } from '../../domain/decode-insert-code';
import { materialsOf, rowsFor } from '../../domain/insert-guide-rows';
import { HttpInsertGuideGateway } from '../../infra/gateways/http-insert-guide.gateway';

@Component({
  selector: 'app-insert-guide',
  imports: [PageNotFound, RouterLink, SuggestInput],
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
              <app-suggest-input
                inputId="insert-guide-material"
                inputTestId="insert-guide-material"
                mode="restricted"
                describedBy="insert-guide-material-hint"
                [suggestions]="materials()"
                [listLabel]="copy.materialListLabel"
                [noMatchLabel]="copy.noMaterial"
                [value]="material()"
                (valueChange)="chooseMaterial($event)"
              />
              <p id="insert-guide-material-hint" class="field-hint">{{ copy.materialHint }}</p>
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
                    @for (row of rows(); track row.key) {
                      <tr data-testid="insert-guide-row" class="border-b border-line align-top">
                        <th scope="row" class="py-3 pr-3 font-semibold">
                          {{ row.operation }}
                          @if (row.allMaterials) {
                            <span
                              data-testid="insert-guide-all-materials"
                              class="block text-sm font-normal text-muted"
                              >{{ copy.allMaterials }}</span
                            >
                          }
                        </th>
                        <td class="px-3 py-3 font-mono">
                          @if (row.decoderCode; as code) {
                            <a
                              routerLink="/atelier/decodeur"
                              [queryParams]="{ code }"
                              class="underline underline-offset-3 hover:text-primary"
                              ><span>{{ row.insert }}</span
                              ><span class="sr-only">{{ copy.decodeLinkSuffix }}</span></a
                            >
                          } @else {
                            {{ row.insert }}
                          }
                        </td>
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
  protected readonly materials = computed(() => {
    const materials = materialsOf(this._entries());
    const generic = this._entries().some(({ allMaterials }) => allMaterials);
    return materials.length === 0 && generic ? [this.copy.allMaterials] : materials;
  });
  protected readonly material = computed(() => {
    const asked = this.materialParam() ?? '';
    return this.materials().includes(asked) ? asked : '';
  });
  protected readonly caption = computed(() =>
    this.material() === this.copy.allMaterials
      ? this.copy.allMaterialsCaption
      : `${this.copy.tableCaption} ${this.material()}`,
  );
  // Décodeur éteint : aucun lien, pour ne jamais mener à sa 404.
  private readonly _decoderEnabled = computed(() => this.guide()?.decoderEnabled === true);
  protected readonly rows = computed(() =>
    rowsFor(this._entries(), this.material()).map((row) => ({
      ...row,
      noseRadius: noseRadiusLabel(row.noseRadius),
      decoderCode:
        this._decoderEnabled() && decodeInsertCode(row.insert).ok
          ? normalizeInsertCode(row.insert)
          : undefined,
    })),
  );

  protected chooseMaterial(material: string): void {
    void this._router.navigate([], {
      queryParams: { matiere: material === '' ? null : material },
      replaceUrl: true,
    });
  }
}
