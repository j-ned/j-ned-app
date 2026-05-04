import {
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { CONTACT_GATEWAY } from '@features/contact/application';
import type { ContactMessage } from '@features/contact/domain';
import { ToastService } from '@shared/ui';
import { AdminTable } from './components/admin-table';
import {
  AdminColExpand,
  AdminColBadge,
  AdminColContact,
  AdminColText,
  AdminColDate,
  AdminColActions,
  type ExtraAction,
} from './components/admin-column';

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
  private readonly contactGateway = inject(CONTACT_GATEWAY);
  private readonly toast = inject(ToastService);
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
      icon: 'pi pi-check',
      label: 'Marquer comme lu',
      visible: (m) => !m.read,
      handler: (m) => this.markAsRead(m),
    },
  ];

  private readonly messagesRes = rxResource({
    stream: () => this.contactGateway.getAllMessages(),
  });

  protected readonly messages = computed(() => [...(this.messagesRes.value() ?? [])]);
  private readonly _expandedIds = signal<ReadonlySet<string | number>>(new Set());
  protected readonly expandedIds = this._expandedIds.asReadonly();

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
        next: () =>
          this.toast.add({ severity: 'success', summary: 'Succès', detail: 'Message supprimé' }),
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
}
