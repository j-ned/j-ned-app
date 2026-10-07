import { Component, computed, input, output } from '@angular/core';
import type { ContactMessage } from '@features/contact/domain/models/contact-message.model';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { Stamp } from '@shared/ui/stamp';
import { receivedAgo } from '../admin-messages-view';

@Component({
  selector: 'li[app-admin-message-row]',
  imports: [AppIcon, Button, Stamp],
  host: { 'data-testid': 'admin-message-row', class: 'block border-b border-line' },
  template: `
    <div
      class="grid grid-cols-[2.75rem_minmax(0,1fr)_8.25rem] items-center gap-x-3.5 gap-y-1 py-2.5 md:grid-cols-[2.75rem_minmax(0,14rem)_minmax(0,1fr)_8rem_8.25rem]"
    >
      <button
        type="button"
        data-testid="message-expand"
        [attr.aria-expanded]="expanded()"
        [attr.aria-controls]="bodyId()"
        (click)="toggle.emit()"
        class="row-span-3 inline-grid size-11 place-items-center self-start rounded-md border border-transparent text-foreground transition-colors hover:border-line-strong hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-primary md:row-span-1 md:self-center"
      >
        <app-icon
          name="chevron-right"
          [size]="14"
          class="transition-transform motion-reduce:transition-none"
          [class.rotate-90]="expanded()"
        />
        <span class="sr-only">{{ expandLabel() }}</span>
      </button>
      <p class="min-w-0 font-semibold">
        <span data-testid="message-sender" class="block truncate">{{ message().name }}</span>
        <small
          data-testid="message-email"
          class="block truncate text-[0.8125rem] font-normal text-muted"
          >{{ message().email }}</small
        >
      </p>
      <p
        data-testid="message-subject"
        class="col-span-2 col-start-2 truncate md:col-span-1 md:col-start-auto"
      >
        @if (!message().read) {
          <app-stamp data-testid="message-new" class="mr-2.5">Nouveau</app-stamp>
        }
        <span data-testid="message-subject-text">{{ message().subject }}</span>
      </p>
      <time
        data-testid="message-date"
        [attr.datetime]="message().createdAt"
        class="col-span-2 col-start-2 font-mono text-xs text-muted tabular-nums md:col-span-1 md:col-start-auto"
        >{{ receivedLabel() }}</time
      >
      <div class="col-start-3 row-start-1 flex justify-end md:col-start-auto md:row-start-auto">
        <a
          data-testid="message-reply"
          [href]="mailto()"
          class="inline-flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-primary"
        >
          <app-icon name="mail" [size]="18" />
          <span class="sr-only">{{ replyLabel() }}</span>
        </a>
        @if (!message().read) {
          <app-button
            severity="secondary"
            variant="text"
            size="icon"
            data-testid="message-mark-read"
            [ariaLabel]="markReadLabel()"
            (click)="markRead.emit()"
          >
            <app-icon name="check" [size]="18" />
          </app-button>
        }
        <app-button
          severity="danger"
          variant="text"
          size="icon"
          data-testid="message-delete"
          [ariaLabel]="deleteLabel()"
          (click)="deleteRequested.emit()"
        >
          <app-icon name="trash" [size]="18" />
        </app-button>
      </div>
    </div>
    @if (expanded()) {
      <p
        data-testid="message-body"
        [id]="bodyId()"
        class="max-w-[70ch] pb-4.5 pl-[3.625rem] whitespace-pre-line text-muted"
      >
        {{ message().message }}
      </p>
    }
  `,
})
export class AdminMessageRow {
  readonly message = input.required<ContactMessage>();
  readonly expanded = input.required<boolean>();
  // eslint-disable-next-line @angular-eslint/no-output-native -- `toggle` natif ne vient que de details et des popovers, absents de cet hôte li
  readonly toggle = output<void>();
  readonly markRead = output<void>();
  readonly deleteRequested = output<void>();

  private readonly _now = new Date();

  protected readonly bodyId = computed(() => `message-body-${this.message().id}`);
  protected readonly receivedLabel = computed(() =>
    receivedAgo(this.message().createdAt, this._now),
  );
  protected readonly mailto = computed(() => `mailto:${this.message().email}`);
  protected readonly expandLabel = computed(
    () => `${this.expanded() ? 'Masquer' : 'Afficher'} le message de ${this.message().name}`,
  );
  protected readonly replyLabel = computed(() => `Répondre à ${this.message().name}`);
  protected readonly markReadLabel = computed(
    () => `Marquer comme lu\u00a0: ${this.message().name}`,
  );
  protected readonly deleteLabel = computed(() => `Supprimer le message de ${this.message().name}`);
}
