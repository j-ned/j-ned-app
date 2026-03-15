import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { CONTACT_GATEWAY } from '@features/contact/application';
import type { ContactMessage } from '@features/contact/domain';
import { ToastService } from '@shared/toast';

@Component({
  selector: 'app-admin-messages',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Messages</h1>

    <div class="space-y-4">
      @for (msg of messages(); track msg.id) {
        <div
          role="button"
          tabindex="0"
          class="bg-background border rounded-2xl p-6 shadow-lg transition-colors cursor-pointer"
          [class.border-primary-30]="!msg.read"
          [class.border-foreground-10]="msg.read"
          (click)="toggleExpand(msg.id)"
          (keydown.enter)="toggleExpand(msg.id)"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 text-sm text-muted mb-2">
                @if (!msg.read) {
                  <span class="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                }
                <span class="font-medium text-foreground">{{ msg.name }}</span>
                <span>&middot;</span>
                <span>{{ msg.email }}</span>
                <span>&middot;</span>
                <time class="text-xs" [attr.datetime]="msg.createdAt">
                  {{ msg.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                </time>
              </div>
              <p class="text-sm font-medium text-foreground">{{ msg.subject }}</p>
              @if (expandedId() === msg.id) {
                <p class="text-muted text-sm mt-3 whitespace-pre-line">{{ msg.message }}</p>
              }
            </div>
            <div class="flex items-center gap-2 shrink-0">
              @if (!msg.read) {
                <button
                  (click)="markAsRead(msg, $event)"
                  class="px-3 py-1.5 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  Marquer lu
                </button>
              }
              <button
                (click)="deleteMessage(msg, $event)"
                class="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      } @empty {
        <p class="text-center text-muted py-12">Aucun message</p>
      }
    </div>
  `,
})
export class AdminMessages {
  private readonly contactGateway = inject(CONTACT_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly messagesRes = rxResource({
    stream: () => this.contactGateway.getAllMessages(),
  });

  readonly messages = (): readonly ContactMessage[] => this.messagesRes.value() ?? [];
  readonly expandedId = signal<number | null>(null);

  toggleExpand(id: number): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  markAsRead(msg: ContactMessage, event: Event): void {
    event.stopPropagation();
    this.contactGateway
      .markMessageAsRead(msg.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messagesRes.reload();
          this.toast.success('Message marqué comme lu');
        },
        error: () => this.toast.error('Erreur lors de la mise à jour'),
      });
  }

  deleteMessage(msg: ContactMessage, event: Event): void {
    event.stopPropagation();
    this.contactGateway
      .deleteMessage(msg.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messagesRes.reload();
          this.toast.success('Message supprimé');
        },
        error: () => this.toast.error('Erreur lors de la suppression'),
      });
  }
}
