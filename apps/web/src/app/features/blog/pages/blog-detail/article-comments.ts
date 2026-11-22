import { DestroyRef, computed, inject, linkedSignal, signal, type Signal } from '@angular/core';
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

  // L'instance de la page sert d'un article à l'autre : envoi et réponse ouverte repartent à zéro.
  private readonly _submission = linkedSignal<string, CommentSubmissionState>({
    source: () => this._slug(),
    computation: () => ({ kind: 'idle' }),
  });
  readonly submission = this._submission.asReadonly();

  private readonly _resetToken = signal(0);
  readonly resetToken = this._resetToken.asReadonly();

  // Un seul formulaire de réponse ouvert à la fois.
  private readonly _replyTarget = linkedSignal<string, string | null>({
    source: () => this._slug(),
    computation: () => null,
  });
  readonly replyTarget = this._replyTarget.asReadonly();

  constructor(private readonly _slug: Signal<string>) {}

  // Le commentaire envoyé n'entre pas dans la liste : il attend la relecture.
  send({ draft, parentId }: CommentSent): void {
    const slug = this._slug();
    this._submission.set({ kind: 'sending', parentId });
    this._gateway
      .submit(slug, draft, parentId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        // Réponse tardive d'un article quitté entre-temps : elle ne concerne plus la page.
        if (this._slug() !== slug) return;
        if (result.success) {
          this._submission.set({ kind: 'sent', parentId });
          this._resetToken.update((token) => token + 1);
          if (parentId !== null) this._replyTarget.set(null);
        } else {
          this._submission.set({ kind: 'failed', parentId, reason: result.error });
        }
      });
  }

  openReply(id: string): void {
    this._replyTarget.set(id);
  }

  // Un refus affiché pour la réponse abandonnée disparaît avec son formulaire.
  closeReply(): void {
    const submission = this._submission();
    if (submission.kind === 'failed' && submission.parentId === this._replyTarget()) {
      this._submission.set({ kind: 'idle' });
    }
    this._replyTarget.set(null);
  }
}
