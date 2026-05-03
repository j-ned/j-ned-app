import {
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { CONTACT_GATEWAY } from '@features/contact/application';
import type { ContactMessage } from '@features/contact/domain';
import { ToastService } from '@shared/ui';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'app-admin-messages',
  imports: [DatePipe, TableModule, Tag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Messages</h1>

    <p-table
      [value]="messages()"
      [paginator]="messages().length > 10"
      [rows]="10"
      [rowHover]="true"
      dataKey="id"
      [expandedRowKeys]="expandedRowKeys()"
      emptyMessage="Aucun message"
    >
      <ng-template #header>
        <tr>
          <th style="width:3rem"></th>
          <th>Statut</th>
          <th pSortableColumn="name">Expéditeur <p-sortIcon field="name" /></th>
          <th pSortableColumn="subject">Sujet <p-sortIcon field="subject" /></th>
          <th pSortableColumn="createdAt">Date <p-sortIcon field="createdAt" /></th>
          <th class="text-right">Actions</th>
        </tr>
      </ng-template>
      <ng-template #body let-msg let-expanded="expanded">
        <tr>
          <td>
            <button
              type="button"
              (click)="toggleExpand(msg.id, $event)"
              aria-label="Voir le message"
              class="btn-outline"
            >
              <i
                [class]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                aria-hidden="true"
              ></i>
            </button>
          </td>
          <td>
            @if (msg.read) {
              <p-tag value="Lu" severity="secondary" />
            } @else {
              <p-tag value="Nouveau" severity="info" />
            }
          </td>
          <td>
            <div class="font-medium text-foreground">{{ msg.name }}</div>
            <div class="text-xs text-muted">{{ msg.email }}</div>
          </td>
          <td class="text-foreground">{{ msg.subject }}</td>
          <td class="text-muted text-sm">
            {{ msg.createdAt | date: 'dd/MM/yyyy HH:mm' }}
          </td>
          <td class="text-right">
            <div class="flex items-center justify-end gap-2">
              @if (!msg.read) {
                <button
                  type="button"
                  (click)="markAsRead(msg, $event)"
                  class="btn-outline"
                >
                  <i class="pi pi-check mr-2" aria-hidden="true"></i>
                  Marquer lu
                </button>
              }
              <button
                type="button"
                (click)="deleteMessage(msg, $event)"
                aria-label="Supprimer"
                class="btn-danger"
              >
                <i class="pi pi-trash" aria-hidden="true"></i>
              </button>
            </div>
          </td>
        </tr>
      </ng-template>
      <ng-template #expandedrow let-msg>
        <tr>
          <td colspan="6" class="bg-foreground/5">
            <p class="text-muted text-sm whitespace-pre-line p-4">{{ msg.message }}</p>
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class AdminMessages {
  private readonly contactGateway = inject(CONTACT_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly messagesRes = rxResource({
    stream: () => this.contactGateway.getAllMessages(),
  });

  readonly messages = computed(() => [...(this.messagesRes.value() ?? [])]);
  readonly expandedRowKeys = signal<Record<number, boolean>>({});

  toggleExpand(id: number, event?: Event): void {
    event?.stopPropagation();
    this.expandedRowKeys.update((current) => {
      const next = { ...current };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return next;
    });
  }

  markAsRead(msg: ContactMessage, event: Event): void {
    event.stopPropagation();
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

  deleteMessage(msg: ContactMessage, event: Event): void {
    event.stopPropagation();
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
