import {
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import type { ContactMessage } from '@features/contact/domain/models/contact-message.model';
import { filterMessagesByReadStatus } from '@features/contact/domain/use-cases/filter-messages-by-read-status.use-case';
import { ToastStore } from '@shared/ui/toast-store';
import { AdminTable } from './components/admin-table';
import { AdminColExpand } from './components/admin-col-expand';
import { AdminColBadge } from './components/admin-col-badge';
import { AdminColContact } from './components/admin-col-contact';
import { AdminColText } from './components/admin-col-text';
import { AdminColDate } from './components/admin-col-date';
import { AdminColActions, type ExtraAction } from './components/admin-col-actions';

const FILTER_OPTIONS = [
  { id: 'all', label: 'Tous', value: 'all' as const },
  { id: 'unread', label: 'Non lus', value: false as const },
  { id: 'read', label: 'Lus', value: true as const },
] satisfies readonly { id: string; label: string; value: boolean | 'all' }[];

@Component({
  selector: 'app-admin-messages',
  imports: [
    AdminTable,
    AdminColExpand,
    AdminColBadge,
    AdminColContact,
    AdminColText,
    AdminColDate,
    AdminColActions,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <app-admin-table
      title="Messages"
      [items]="messages()"
      [defaultSort]="{ key: 'createdAt', dir: 'desc' }"
      [expandedIds]="expandedIds()"
      [rowClass]="rowClass"
      (rowClick)="toggleExpand($event)"
      emptyMessage="Aucun message"
    >
      <div adminTableHeaderActions class="flex items-center gap-3">
        <div
          class="inline-flex rounded-lg border border-foreground/10 p-0.5"
          role="group"
          aria-label="Filtrer par statut de lecture"
        >
          @for (opt of filterOptions; track opt.id) {
            <button
              type="button"
              [attr.data-testid]="'filter-' + opt.id"
              [attr.aria-pressed]="readFilter() === opt.value"
              [class]="
                readFilter() === opt.value
                  ? 'rounded-md px-3 py-1.5 text-sm font-medium bg-primary-bg text-white transition-colors'
                  : 'rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors'
              "
              (click)="setFilter(opt.value)"
            >
              {{ opt.label }}
            </button>
          }
        </div>
        <button
          type="button"
          data-testid="mark-all-read"
          [disabled]="!hasUnread()"
          (click)="markAllRead()"
          class="inline-flex items-center gap-2 rounded-lg border border-foreground/10 px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Tout marquer comme lu
        </button>
      </div>
      <app-admin-col-expand [isExpanded]="isExpandedAcc" />
      <app-admin-col-badge
        key="read"
        label="Statut"
        [accessor]="statusLabel"
        [toneAccessor]="statusTone"
      />
      <app-admin-col-contact
        key="name"
        label="Expéditeur"
        sortable
        [nameAccessor]="senderName"
        [subAccessor]="senderEmail"
      />
      <app-admin-col-text key="subject" label="Sujet" sortable [accessor]="subject" />
      <app-admin-col-date key="createdAt" label="Date" sortable [accessor]="createdAt" />
      <app-admin-col-actions [extraActions]="extraActions" (delete)="deleteMessage($event)" />
      <ng-template #expandedRow let-msg>
        <tr>
          <td colspan="6" class="border-b border-foreground/5 bg-foreground/3 px-6 py-5">
            <p class="text-muted text-sm whitespace-pre-line leading-relaxed">
              {{ msg.message }}
            </p>
          </td>
        </tr>
      </ng-template>
    </app-admin-table>
  `,
})
export class AdminMessages {
  private readonly contactGateway = inject(ContactGateway);
  private readonly toast = inject(ToastStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly statusLabel = (m: ContactMessage): string => (m.read ? 'Lu' : 'Nouveau');
  protected readonly statusTone = (m: ContactMessage): 'neutral' | 'primary' =>
    m.read ? 'neutral' : 'primary';
  protected readonly senderName = (m: ContactMessage): string => m.name;
  protected readonly senderEmail = (m: ContactMessage): string => m.email;
  protected readonly subject = (m: ContactMessage): string => m.subject;
  protected readonly createdAt = (m: ContactMessage): string | Date => m.createdAt;
  protected readonly isExpandedAcc = (m: ContactMessage): boolean => this._expandedIds().has(m.id);

  protected readonly rowClass = (m: ContactMessage): string =>
    this._expandedIds().has(m.id)
      ? 'admin-row cursor-pointer bg-foreground/3'
      : 'admin-row cursor-pointer';

  protected readonly extraActions: readonly ExtraAction<ContactMessage>[] = [
    {
      icon: 'check',
      label: 'Marquer comme lu',
      visible: (m) => !m.read,
      handler: (m) => this.markAsRead(m),
    },
  ];

  private readonly messagesRes = rxResource({
    stream: () => this.contactGateway.getAllMessages(),
  });

  private readonly allMessages = computed(() => [...(this.messagesRes.value() ?? [])]);
  protected readonly readFilter = signal<boolean | 'all'>('all');
  protected readonly messages = computed(() =>
    filterMessagesByReadStatus(this.allMessages(), this.readFilter()),
  );
  protected readonly hasUnread = computed(() => this.allMessages().some((m) => !m.read));
  private readonly _expandedIds = signal<ReadonlySet<string | number>>(new Set());
  protected readonly expandedIds = this._expandedIds.asReadonly();
  protected readonly filterOptions = FILTER_OPTIONS;

  protected toggleExpand(msg: ContactMessage): void {
    this._expandedIds.update((current) => {
      const next = new Set(current);
      if (next.has(msg.id)) next.delete(msg.id);
      else next.add(msg.id);
      return next;
    });
  }

  private markAsRead(msg: ContactMessage): void {
    this.contactGateway
      .markMessageAsRead(msg.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.messagesRes.update((list) =>
            (list ?? []).map((m) => (m.id === msg.id ? updated : m)),
          );
          this.contactGateway.invalidateUnreadCount();
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Message marqué comme lu',
          });
        },
        error: () =>
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la mise à jour',
          }),
      });
  }

  protected deleteMessage(msg: ContactMessage): void {
    const snapshot = this.messagesRes.value() ?? [];
    this.messagesRes.update((list) => (list ?? []).filter((m) => m.id !== msg.id));

    this.contactGateway
      .deleteMessage(msg.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.contactGateway.invalidateUnreadCount();
          this.toast.add({ severity: 'success', summary: 'Succès', detail: 'Message supprimé' });
        },
        error: () => {
          this.messagesRes.set(snapshot);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la suppression',
          });
        },
      });
  }

  protected markAllRead(): void {
    const snapshot = this.messagesRes.value() ?? [];
    this.messagesRes.update((list) =>
      (list ?? []).map((m) => (m.read ? m : { ...m, read: true })),
    );

    this.contactGateway
      .markAllRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ count }) => {
          this.contactGateway.invalidateUnreadCount();
          const plural = count > 1 ? 's' : '';
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: `${count} message${plural} marqué${plural} comme lu${plural}`,
          });
        },
        error: () => {
          this.messagesRes.set(snapshot);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la mise à jour',
          });
        },
      });
  }

  protected setFilter(value: boolean | 'all'): void {
    this.readFilter.set(value);
  }
}
