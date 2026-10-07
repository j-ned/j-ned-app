import { Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Stamp } from '@shared/ui/stamp';
import type { ContentRow } from '../overview-view';
import { AdminEmptyState } from './admin-empty-state';
import { AdminSectionHead } from './admin-section-head';

@Component({
  selector: 'app-overview-content',
  imports: [AdminSectionHead, NgOptimizedImage, RouterLink, Stamp, AdminEmptyState],
  host: { class: 'block' },
  template: `
    <section aria-labelledby="overview-content-heading">
      <app-admin-section-head heading="Contenu en ligne" headingId="overview-content-heading" />

      @if (rows(); as items) {
        @if (items.length === 0) {
          <app-admin-empty-state stamp="Rien en ligne" class="mt-5">
            <p>Aucune réalisation ni aucun article publié pour l'instant.</p>
          </app-admin-empty-state>
        } @else {
          <ul role="list">
            @for (row of items; track row.key) {
              <li
                data-testid="overview-content-item"
                class="group relative grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-1.5 border-b border-line py-3 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto]"
              >
                <div
                  class="relative row-span-2 self-start overflow-hidden rounded-sm border border-line-strong bg-surface sm:row-span-1 sm:self-center"
                  [class]="row.kind === 'post' ? 'aspect-[1200/630]' : 'aspect-[16/10]'"
                >
                  @if (row.image) {
                    <img [ngSrc]="row.image" alt="" fill class="object-cover" />
                  }
                </div>
                <div class="min-w-0">
                  <h3 class="text-[0.96875rem] font-bold tracking-[-0.01em] font-stretch-104%">
                    <a
                      data-testid="overview-content-link"
                      [routerLink]="row.href"
                      class="after:absolute after:inset-0 group-hover:text-primary"
                      >{{ row.title }}</a
                    >
                  </h3>
                  <p
                    data-testid="overview-content-meta"
                    class="mt-0.5 font-mono text-xs text-muted"
                  >
                    {{ row.meta }}
                  </p>
                </div>
                @if (row.stamp) {
                  <app-stamp
                    data-testid="overview-content-stamp"
                    class="col-start-2 justify-self-start sm:col-start-3 sm:justify-self-end"
                    >{{ row.stamp }}</app-stamp
                  >
                }
              </li>
            }
          </ul>
        }
      }
      <ng-content />
    </section>
  `,
})
export class OverviewContent {
  readonly rows = input.required<readonly ContentRow[] | null>();
}
