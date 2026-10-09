import { Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import type { ContactMessage } from '@features/contact/domain/models/contact-message.model';
import { counted } from '@shared/format/counted';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { FilterGroup } from '@shared/ui/filter-group';
import { LoadError } from '@shared/ui/load-error';
import { loadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';
import { ToastStore } from '@core/notifications/toast-store';
import {
  toAdminMessagesView,
  type AdminMessagesFilter,
} from '../../application/admin-messages-view';
import { messagesOverline } from '../../application/admin-page-copy';
import { AdminEmptyState } from '../../application/components/admin-empty-state';
import { AdminMessageRow } from '../../application/components/admin-message-row';
import { AdminPageHeader } from '../../application/components/admin-page-header';

@Component({
  selector: 'app-admin-messages',
  imports: [
    AppIcon,
    Button,
    ConfirmDialog,
    FilterGroup,
    LoadError,
    AppSkeleton,
    AdminEmptyState,
    AdminMessageRow,
    AdminPageHeader,
  ],
  host: { class: 'block' },
  template: `
    <app-admin-page-header [overline]="overline()" heading="Messages">
      Les demandes reçues par le formulaire Contact, de la plus récente à la plus ancienne.
      <div adminPageAside class="flex flex-wrap items-center gap-2.5 lg:justify-end">
        <button
          appButton
          variant="outlined"
          type="button"
          data-testid="mark-all-read"
          [attr.aria-disabled]="view().unread === 0 ? 'true' : null"
          (click)="markAllRead()"
          class="aria-disabled:cursor-not-allowed aria-disabled:opacity-55 aria-disabled:hover:border-foreground/15 aria-disabled:hover:text-foreground"
        >
          <app-icon name="check" [size]="16" />
          Tout marquer comme lu
        </button>
      </div>
    </app-admin-page-header>

    @if (listState() === 'ready' || listState() === 'empty') {
      <app-filter-group
        label="Filtrer par lecture"
        [options]="view().filters"
        [(active)]="filter"
      />
    }

    @switch (listState()) {
      @case ('loading') {
        <div data-testid="admin-messages-loading" role="status" class="mt-5 space-y-3">
          <span class="sr-only">Chargement des messages…</span>
          <app-skeleton class="block h-16 rounded-sm" />
          <app-skeleton class="block h-16 rounded-sm" />
          <app-skeleton class="block h-16 rounded-sm" />
        </div>
      }
      @case ('error') {
        <app-load-error
          message="Les messages n'ont pas pu être chargés. Vérifiez votre connexion, puis réessayez."
          (retry)="messagesRes.reload()"
        />
      }
      @case ('empty') {
        <app-admin-empty-state
          stamp="Boîte vide"
          class="mt-5 justify-items-center! py-14! text-center [&_p]:mx-auto"
        >
          <p>
            Aucun message pour le moment. Le formulaire de contact de l'accueil est en ligne&nbsp;;
            chaque envoi arrive ici et par e-mail.
          </p>
        </app-admin-empty-state>
      }
      @default {
        <ul data-testid="admin-messages-list" role="list" class="mt-2">
          @for (row of rows(); track row.message.id) {
            <li
              app-admin-message-row
              [message]="row.message"
              [expanded]="row.expanded"
              (toggle)="toggleExpand(row.message)"
              (markRead)="markAsRead(row.message)"
              (deleteRequested)="pendingDeletion.set(row.message)"
            ></li>
          }
        </ul>
      }
    }

    <app-confirm-dialog
      [open]="pendingDeletion() !== null"
      [heading]="deletionHeading()"
      confirmLabel="Supprimer le message"
      (confirmed)="confirmDeletion()"
      (cancelled)="pendingDeletion.set(null)"
    >
      <p>Le message est supprimé de la boîte de réception. Cette action est définitive.</p>
    </app-confirm-dialog>
  `,
})
export class AdminMessages {
  private readonly contactGateway = inject(ContactGateway);
  private readonly toast = inject(ToastStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _pageHeader = viewChild.required(AdminPageHeader);

  protected readonly messagesRes = rxResource({
    stream: () => this.contactGateway.getAllMessages(),
  });

  private readonly _inbox = computed(() =>
    this.messagesRes.hasValue() ? this.messagesRes.value() : [],
  );
  protected readonly filter = signal<AdminMessagesFilter>('all');
  protected readonly view = computed(() => toAdminMessagesView(this._inbox(), this.filter()));
  private readonly _expandedIds = signal<ReadonlySet<number>>(new Set());
  protected readonly rows = computed(() =>
    this.view().rows.map((message) => ({
      message,
      expanded: this._expandedIds().has(message.id),
    })),
  );

  protected readonly overline = computed(() =>
    this.messagesRes.hasValue() ? messagesOverline(this.messagesRes.value()) : '',
  );
  protected readonly listState = computed(() =>
    loadState(this.messagesRes, () => this._inbox().length === 0),
  );
  protected readonly pendingDeletion = signal<ContactMessage | null>(null);
  protected readonly deletionHeading = computed(
    () => `Supprimer le message de ${this.pendingDeletion()?.name ?? ''}\u202f?`,
  );

  protected toggleExpand(message: ContactMessage): void {
    this._expandedIds.update((current) => {
      const next = new Set(current);
      if (next.has(message.id)) next.delete(message.id);
      else next.add(message.id);
      return next;
    });
  }

  protected markAsRead(message: ContactMessage): void {
    this.contactGateway
      .markMessageAsRead(message.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.messagesRes.update((list) =>
            (list ?? []).map((m) => (m.id === message.id ? updated : m)),
          );
          this.contactGateway.invalidateUnreadCount();
          this.toast.add({ severity: 'success', detail: 'Message marqué comme lu' });
        },
        error: () => this.toast.add({ severity: 'error', detail: 'Erreur lors de la mise à jour' }),
      });
  }

  protected confirmDeletion(): void {
    const message = this.pendingDeletion();
    this.pendingDeletion.set(null);
    this._pageHeader().focusTitle();
    if (message) this.deleteMessage(message);
  }

  private deleteMessage(message: ContactMessage): void {
    const snapshot = this._inbox();
    this.messagesRes.update((list) => (list ?? []).filter((m) => m.id !== message.id));

    this.contactGateway
      .deleteMessage(message.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.contactGateway.invalidateUnreadCount();
          this.toast.add({ severity: 'success', detail: 'Message supprimé' });
        },
        error: () => {
          this.messagesRes.set(snapshot);
          this.toast.add({ severity: 'error', detail: 'Erreur lors de la suppression' });
        },
      });
  }

  protected markAllRead(): void {
    if (this.view().unread === 0) return;
    const snapshot = this._inbox();
    this.messagesRes.update((list) => (list ?? []).map((m) => (m.read ? m : { ...m, read: true })));

    this.contactGateway
      .markAllRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ count }) => {
          this.contactGateway.invalidateUnreadCount();
          this.toast.add({
            severity: 'success',
            detail: counted(count, 'message marqué comme lu', 'messages marqués comme lus'),
          });
        },
        error: () => {
          this.messagesRes.set(snapshot);
          this.toast.add({ severity: 'error', detail: 'Erreur lors de la mise à jour' });
        },
      });
  }
}
