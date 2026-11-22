import {
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  linkedSignal,
  signal,
  type Signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { refreshWhenVisible } from '@core/navigation/refresh-when-visible';
import {
  toCommentThreadView,
  type CommentSent,
  type CommentSubmissionState,
  type CommentThreadContent,
} from '@features/comments/application/comment-thread-view';
import type {
  PendingComment,
  PublishedThread,
} from '@features/comments/domain/models/comment.model';
import { withoutPublished } from '@features/comments/domain/pending-comments';
import { CommentsGateway } from '@features/comments/infra/comments.gateway';
import { PendingCommentsStorage } from '@features/comments/infra/pending-comments.storage';

// Instanciée par la page : la lecture part avec celle de l'article, pas à l'affichage de la section.
export class ArticleComments {
  private readonly _gateway = inject(CommentsGateway);
  private readonly _storage = inject(PendingCommentsStorage);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _thread = rxResource({
    params: () => this._slug(),
    stream: ({ params: slug }) =>
      this._gateway.getThread(slug).pipe(tap((thread) => this.settle(slug, thread))),
  });

  // Dernière discussion lue de l'article : une relecture qui échoue ne retire pas la liste affichée.
  private readonly _lastThread = linkedSignal<string, PublishedThread | null>({
    source: () => this._slug(),
    computation: () => null,
  });

  // Lus après le premier rendu : le HTML du serveur, qui ne les connaît pas, s'hydrate à l'identique.
  private readonly _storageReady = signal(false);
  private readonly _pending = linkedSignal<
    { readonly slug: string; readonly ready: boolean },
    readonly PendingComment[]
  >({
    source: () => ({ slug: this._slug(), ready: this._storageReady() }),
    computation: ({ slug, ready }) => (ready ? this._storage.read(slug) : []),
  });

  readonly content: Signal<CommentThreadContent> = computed(() => {
    const thread = this._lastThread();
    if (thread) return { status: 'ready', view: toCommentThreadView(thread, this._pending()) };
    return this._thread.error() ? { status: 'failed' } : { status: 'loading' };
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

  constructor(private readonly _slug: Signal<string>) {
    afterNextRender({
      write: () => {
        this._storageReady.set(true);
        const thread = this._lastThread();
        if (thread) this.settle(this._slug(), thread);
      },
    });
    refreshWhenVisible(() => this._thread.reload());
  }

  // Le commentaire accepté s'affiche tout de suite pour ce lecteur, marqué en attente de relecture.
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
        if (result.id !== null) {
          const { name, body } = draft;
          const entry = {
            id: result.id,
            name,
            body,
            parentId,
            createdAt: new Date().toISOString(),
          };
          this.keepPending(slug, [...this._pending(), entry]);
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

  // Un envoi désormais publié quitte la liste d'attente de l'onglet.
  private settle(slug: string, thread: PublishedThread): void {
    if (this._slug() !== slug) return;
    this._lastThread.set(thread);
    const pending = this._pending();
    const kept = withoutPublished(pending, thread);
    if (kept !== pending) this.keepPending(slug, kept);
  }

  private keepPending(slug: string, pending: readonly PendingComment[]): void {
    this._pending.set(pending);
    this._storage.write(slug, pending);
  }
}
