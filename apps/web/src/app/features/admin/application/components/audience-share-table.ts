import { Component, computed, input } from '@angular/core';
import type { ShareRow } from '../audience-view';
import { groupedNumber } from '../overview-view';
import { AdminSectionHead } from './admin-section-head';

@Component({
  selector: 'app-audience-share-table',
  imports: [AdminSectionHead],
  host: { class: 'block min-w-0' },
  template: `
    <section [attr.aria-labelledby]="headingId()">
      <app-admin-section-head [heading]="heading()" [headingId]="headingId()" />
      @if (lines().length > 0) {
        <table class="w-full table-fixed border-collapse text-[0.90625rem]">
          <caption class="sr-only">
            {{
              heading()
            }}
          </caption>
          <thead>
            <tr class="border-b-[1.5px] border-line-strong">
              <th scope="col" class="table-head pr-3 text-left">{{ labelHeader() }}</th>
              <th scope="col" class="table-head w-24 pl-3 text-right">{{ unitLabel() }}</th>
              <th scope="col" class="table-head w-16 pl-3 text-right">Part</th>
            </tr>
          </thead>
          <tbody>
            @for (row of lines(); track $index) {
              <tr data-testid="share-row" class="border-b border-line">
                <td class="py-2.5">
                  <span
                    data-testid="share-label"
                    class="block truncate"
                    [class.font-mono]="row.isPath"
                    >{{ row.label }}</span
                  >
                  <span aria-hidden="true" class="mt-1.5 block h-1 rounded-xs bg-line">
                    <span
                      data-testid="share-bar"
                      class="block h-full rounded-xs bg-primary"
                      [style.width.%]="row.width"
                    ></span>
                  </span>
                </td>
                <td
                  data-testid="share-count"
                  class="py-2.5 pl-3 text-right align-top font-mono text-[0.8125rem] font-semibold tabular-nums"
                >
                  {{ row.count }}
                </td>
                <td
                  data-testid="share-part"
                  class="py-2.5 pl-3 text-right align-top font-mono text-xs whitespace-nowrap text-muted"
                >
                  {{ row.share }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <p data-testid="share-empty" class="mt-5 text-sm text-muted">
          Aucune donnée sur la période.
        </p>
      }
    </section>
  `,
})
export class AudienceShareTable {
  readonly heading = input.required<string>();
  readonly headingId = input.required<string>();
  readonly labelHeader = input.required<string>();
  readonly unitLabel = input.required<string>();
  readonly rows = input.required<readonly ShareRow[]>();

  protected readonly lines = computed(() =>
    this.rows().map((row) => ({
      label: row.label,
      isPath: row.label.startsWith('/'),
      count: groupedNumber(row.count),
      share: row.share,
      width: row.width,
    })),
  );
}
