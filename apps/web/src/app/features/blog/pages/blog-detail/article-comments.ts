import { DestroyRef, computed, inject, signal, type Signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  toCommentThreadView,
  type CommentSent,
  type CommentSubmissionState,
  type CommentThreadContent,
} from '@features/comments/application/comment-thread-view';
import { CommentsGateway } from '@features/comments/infra/comments.gateway';

// Instanciée par la page : la lecture part avec celle de l'article, pas à l'affichage de la section.
export class ArticleComments {
  private readonly _gateway = inject(CommentsGateway);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _thread = rxResource({
    params: () => this._slug(),
    stream: ({ params: slug }) => this._gateway.getThread(slug),
  });

  readonly content: Signal<CommentThreadContent> = computed(() => {
    if (this._thread.error()) return { status: 'failed' };
    const thread = this._thread.value();
    return thread ? { status: 'ready', view: toCommentThreadView(thread) } : { status: 'loading' };
  });

  private readonly _submission = signal<CommentSubmissionState>({ kind: 'idle' });
  readonly submission = this._submission.asReadonly();

  private readonly _resetToken = signal(0);
  readonly resetToken = this._resetToken.asReadonly();

  constructor(private readonly _slug: Signal<string>) {}

  // Le commentaire envoyé n'entre pas dans la liste : il attend la relecture.
  send({ draft, parentId }: CommentSent): void {
    this._submission.set({ kind: 'sending', parentId });
    this._gateway
      .submit(this._slug(), draft, parentId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result.success) {
          this._submission.set({ kind: 'sent', parentId });
          this._resetToken.update((token) => token + 1);
        } else {
          this._submission.set({ kind: 'failed', parentId, reason: result.error });
        }
      });
  }
}
