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

  // L'instance de la page sert d'un article à l'autre : envois et réponse ouverte repartent à zéro.
  // Un état par formulaire : une réponse n'agit ni sur le bouton ni sur le message du principal.
  private readonly _submission = linkedSignal<string, CommentSubmissionState>({
    source: () => this._slug(),
    computation: () => ({ kind: 'idle' }),
  });
  readonly submission = this._submission.asReadonly();

  private readonly _replySubmission = linkedSignal<string, CommentSubmissionState>({
    source: () => this._slug(),
    computation: () => ({ kind: 'idle' }),
  });
  readonly replySubmission = this._replySubmission.asReadonly();

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
    const state = parentId === null ? this._submission : this._replySubmission;
    if (state().kind === 'sending') return;
    const slug = this._slug();
    state.set({ kind: 'sending', parentId });
    this._gateway
      .submit(slug, draft, parentId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        // Réponse tardive d'un article quitté entre-temps : elle ne concerne plus la page.
        if (this._slug() !== slug) return;
        if (!result.success) {
          state.set({ kind: 'failed', parentId, reason: result.error });
          return;
        }
        state.set({ kind: 'sent', parentId });
        // Seul le formulaire principal est vidé ; celui d'une réponse se ferme.
        if (parentId === null) this._resetToken.update((token) => token + 1);
        else if (this._replyTarget() === parentId) this._replyTarget.set(null);
      });
  }

  openReply(id: string): void {
    this._replyTarget.set(id);
  }

  // Un refus affiché pour la réponse abandonnée disparaît avec son formulaire.
  closeReply(): void {
    const submission = this._replySubmission();
    if (submission.kind === 'failed' && submission.parentId === this._replyTarget()) {
      this._replySubmission.set({ kind: 'idle' });
    }
    this._replyTarget.set(null);
  }
}
