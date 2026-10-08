import { Component, ElementRef, computed, input, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

export type AdminPageParent = { readonly label: string; readonly route: string };

// Les pages réservent 22rem à leur colonne d'actions ; un éditeur n'y loge qu'un lien, il la dimensionne au contenu.
const PAGE_LAYOUT =
  'grid gap-6 pb-8 lg:items-end lg:gap-12 lg:has-[>[adminPageAside]]:grid-cols-[minmax(0,1fr)_22rem]';
const EDITOR_LAYOUT =
  'grid gap-6 pb-8 lg:items-end lg:gap-12 lg:has-[>[adminPageAside]]:grid-cols-[minmax(0,1fr)_auto]';

@Component({
  selector: 'app-admin-page-header',
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    <header [class]="layoutClass()">
      <div>
        @if (parent(); as parentPage) {
          <nav data-testid="admin-breadcrumb" aria-label="Fil d'Ariane">
            <ol class="flex flex-wrap items-center gap-2 font-mono text-[0.8125rem] text-muted">
              <li>
                <a
                  data-testid="admin-breadcrumb-parent"
                  [routerLink]="parentPage.route"
                  class="inline-flex min-h-11 items-center text-primary hover:underline"
                >
                  {{ parentPage.label }}
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li data-testid="admin-breadcrumb-current" aria-current="page">{{ heading() }}</li>
            </ol>
          </nav>
        } @else {
          <p
            data-testid="admin-page-overline"
            class="min-h-lh font-mono text-[0.8125rem] text-primary"
          >
            {{ overline() }}
          </p>
        }
        <h1
          #title
          tabindex="-1"
          data-testid="admin-page-title"
          class="mt-3.5 text-[2.5rem] leading-none font-extrabold tracking-[-0.04em] text-balance lg:text-[clamp(2.25rem,3.4vw,3.25rem)]"
        >
          {{ heading() }}
        </h1>
        <div class="mt-4 max-w-[60ch] text-base text-muted empty:hidden lg:text-[1.0625rem]">
          <ng-content />
        </div>
      </div>
      <ng-content select="[adminPageAside]" />
    </header>
  `,
})
export class AdminPageHeader {
  readonly overline = input('');
  readonly parent = input<AdminPageParent>();
  readonly heading = input.required<string>();

  protected readonly layoutClass = computed(() => (this.parent() ? EDITOR_LAYOUT : PAGE_LAYOUT));

  private readonly _title = viewChild.required<ElementRef<HTMLHeadingElement>>('title');

  focusTitle(): void {
    this._title().nativeElement.focus();
  }
}
