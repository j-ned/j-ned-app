import { NgTemplateOutlet } from '@angular/common';
import { Component, contentChild, input, output, TemplateRef } from '@angular/core';
import { LoadError } from '@shared/ui/load-error';
import type { LoadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';

@Component({
  selector: 'app-admin-list-state',
  imports: [NgTemplateOutlet, LoadError, AppSkeleton],
  template: `
    @switch (state()) {
      @case ('loading') {
        <div
          [attr.data-testid]="testIdPrefix() + '-loading'"
          role="status"
          [class]="'space-y-3 ' + loadingClass()"
        >
          <span class="sr-only">{{ loadingLabel() }}</span>
          @for (line of SKELETON_LINES; track line) {
            <app-skeleton [class]="'block ' + skeletonClass()" />
          }
        </div>
      }
      @case ('error') {
        <app-load-error [message]="errorMessage()" (retry)="retry.emit()" />
      }
      @case ('empty') {
        <ng-container [ngTemplateOutlet]="listEmpty()" />
      }
      @default {
        <ng-container [ngTemplateOutlet]="listReady()" />
      }
    }
  `,
})
export class AdminListState {
  readonly state = input.required<LoadState>();
  readonly testIdPrefix = input.required<string>();
  readonly loadingLabel = input.required<string>();
  readonly errorMessage = input.required<string>();
  readonly skeletonClass = input.required<string>();
  readonly loadingClass = input('');
  readonly retry = output<void>();

  protected readonly listEmpty = contentChild.required('listEmpty', { read: TemplateRef });
  protected readonly listReady = contentChild.required('listReady', { read: TemplateRef });

  protected readonly SKELETON_LINES = [0, 1, 2] as const;
}
