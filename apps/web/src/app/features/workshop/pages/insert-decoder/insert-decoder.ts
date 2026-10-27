import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormField, FormRoot, form, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { injectMarkNotFound, injectMarkUnavailable } from '@core/ssr/response-status';
import { distinctSuggestions } from '@shared/search/suggestion-search';
import { Button } from '@shared/ui/button';
import { SuggestInput } from '@shared/ui/suggest-input';
import { PageNotFound } from '../../../../pages/page-not-found';
import { insertCodeErrorMessage } from '../../application/insert-code-error-message';
import { INSERT_DECODER_COPY } from '../../application/insert-decoder-copy';
import { decodeInsertCode, normalizeInsertCode } from '../../domain/decode-insert-code';
import { HttpInsertGuideGateway } from '../../infra/gateways/http-insert-guide.gateway';

const ERROR_ID = 'insert-decoder-error';
const HINT_ID = 'insert-decoder-hint';

@Component({
  selector: 'app-insert-decoder',
  imports: [PageNotFound, FormRoot, FormField, Button, SuggestInput],
  host: { class: 'block', '[class.min-h-svh]': '!notFound()', '[class.pt-20]': '!notFound()' },
  template: `
    @if (notFound()) {
      <app-page-not-found />
    } @else {
      <div class="page-container pt-18 pb-14 md:pt-26 md:pb-18">
        <h1
          data-testid="insert-decoder-title"
          class="text-[clamp(2.75rem,6vw,5.25rem)] font-extrabold leading-none tracking-[-0.04em]"
        >
          {{ copy.heading }}
        </h1>
        <p
          data-testid="insert-decoder-lead"
          class="mt-5.5 max-w-[56ch] text-[clamp(1.0625rem,1.4vw,1.25rem)] text-muted"
        >
          {{ copy.lead }}
        </p>
        <!-- method/action : sans JavaScript, le navigateur envoie ?code= et le serveur rend le décodage -->
        <form
          method="get"
          action="/atelier/decodeur"
          [formRoot]="codeForm"
          class="mt-12 grid max-w-xl gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
        >
          <div class="min-w-0">
            <label for="insert-decoder-code" class="form-label">{{ copy.codeLabel }}</label>
            <app-suggest-input
              inputId="insert-decoder-code"
              inputTestId="insert-decoder-code"
              inputClass="font-mono"
              autocapitalize="characters"
              [formField]="codeForm"
              [suggestions]="codes()"
              [listLabel]="copy.codeListLabel"
              [markedInvalid]="error() !== undefined"
              [describedBy]="describedBy()"
              (picked)="decodePicked()"
            />
            <p [id]="hintId" class="mt-1.5 text-sm text-muted">{{ copy.codeHint }}</p>
          </div>
          <button
            appButton
            type="submit"
            data-testid="insert-decoder-submit"
            class="sm:mt-[1.625rem]"
          >
            {{ copy.submit }}
          </button>
        </form>
        @if (error(); as error) {
          <p
            [id]="errorId"
            role="alert"
            data-testid="insert-decoder-error"
            class="mt-8 max-w-prose font-medium text-status-error"
          >
            {{ error }}
          </p>
        }
        <div data-testid="insert-decoder-live" aria-live="polite" class="mt-12">
          @if (decoded(); as decoded) {
            <h2 data-testid="insert-decoder-heading" class="text-2xl font-bold">
              {{ copy.resultHeading }} <span class="font-mono">{{ decoded.display }}</span>
            </h2>
            <dl data-testid="insert-decoder-result" class="mt-6 grid max-w-3xl">
              @for (item of decoded.positions; track item.position) {
                <div
                  data-testid="insert-decoder-position"
                  class="grid gap-1 border-b border-line py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-x-6"
                >
                  <dt class="flex flex-wrap items-baseline gap-x-2 font-semibold sm:row-span-2">
                    <span class="font-mono text-sm text-muted">{{ item.position }}</span
                    >&ngsp; <span>{{ item.label }}</span
                    >&ngsp;
                    <span class="font-mono text-primary">{{ item.code }}</span>
                  </dt>
                  <dd>{{ item.meaning }}</dd>
                  <dd class="text-sm text-muted">
                    {{ copy.sourcesLabel }}&nbsp;:
                    @for (source of item.sources; track source.title; let last = $last) {
                      {{ source.publisher }},
                      <a
                        [href]="source.url"
                        rel="noopener"
                        class="underline underline-offset-3 [overflow-wrap:anywhere] hover:text-primary"
                        >{{ source.title }}</a
                      >{{ last ? '' : ' ;' }}
                    }
                  </dd>
                </div>
              }
              @if (decoded.suffix !== '') {
                <div
                  data-testid="insert-decoder-suffix"
                  class="grid gap-1 border-b border-line py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-x-6"
                >
                  <dt class="flex flex-wrap items-baseline gap-x-2 font-semibold">
                    <span>{{ copy.suffixLabel }}</span
                    >&ngsp;
                    <span class="font-mono text-primary [overflow-wrap:anywhere]">{{
                      decoded.suffix
                    }}</span>
                  </dt>
                  <dd>{{ copy.suffixMeaning }}</dd>
                </div>
              }
            </dl>
            <p class="mt-6 max-w-prose text-sm text-muted">{{ copy.sourcesNote }}</p>
          }
        </div>
      </div>
    }
  `,
})
export class InsertDecoder {
  private readonly _gateway = inject(HttpInsertGuideGateway);
  private readonly _router = inject(Router);
  private readonly _markNotFound = injectMarkNotFound();
  private readonly _markUnavailable = injectMarkUnavailable();

  readonly code = input<string | undefined>(undefined);

  protected readonly copy = INSERT_DECODER_COPY;
  protected readonly errorId = ERROR_ID;
  protected readonly hintId = HINT_ID;

  // Interrupteur du décodeur éteint : vraie 404 ; lecture en échec, 503.
  private readonly _guideResource = rxResource({
    stream: () =>
      this._gateway.getGuide().pipe(
        tap({
          next: ({ decoderEnabled }) => {
            if (!decoderEnabled) this._markNotFound();
          },
          error: () => this._markUnavailable(),
        }),
      ),
  });
  protected readonly notFound = computed(
    () => this._guideResource.hasValue() && !this._guideResource.value().decoderEnabled,
  );
  protected readonly codes = computed(() =>
    this._guideResource.hasValue()
      ? distinctSuggestions(this._guideResource.value().entries.map(({ insert }) => insert))
      : [],
  );

  private readonly _decoding = computed(() => {
    const code = this.code();
    return code === undefined ? undefined : decodeInsertCode(code);
  });
  protected readonly decoded = computed(() => {
    const decoding = this._decoding();
    if (decoding?.ok !== true) return undefined;
    const [shape, clearance, tolerance, fixing, ...dimensions] = decoding.positions;
    const letters = [shape, clearance, tolerance, fixing].map(({ code }) => code).join('');
    const digits = dimensions.map(({ code }) => code).join('');
    const suffix = decoding.suffix === '' ? '' : `-${decoding.suffix}`;
    return { ...decoding, display: `${letters} ${digits}${suffix}` };
  });
  protected readonly error = computed(() => {
    const decoding = this._decoding();
    return decoding?.ok === false ? insertCodeErrorMessage(decoding.error) : undefined;
  });
  protected readonly describedBy = computed(() =>
    this.error() ? `${HINT_ID} ${ERROR_ID}` : HINT_ID,
  );

  private readonly _model = linkedSignal(() => this.code() ?? '');
  protected readonly codeForm = form(this._model, {
    name: 'code',
    submission: { action: async (field) => this.showDecoding(field().value()) },
  });

  protected decodePicked(): void {
    void submit(this.codeForm);
  }

  private async showDecoding(raw: string): Promise<void> {
    const code = normalizeInsertCode(raw);
    await this._router.navigate([], {
      queryParams: { code: code === '' ? null : code },
      replaceUrl: true,
    });
  }
}
