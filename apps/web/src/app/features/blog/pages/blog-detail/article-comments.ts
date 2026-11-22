import { computed, inject, type Signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  toCommentThreadView,
  type CommentThreadContent,
} from '@features/comments/application/comment-thread-view';
import { CommentsGateway } from '@features/comments/infra/comments.gateway';

// Instanciée par la page : la lecture part avec celle de l'article, pas à l'affichage de la section.
export class ArticleComments {
  private readonly _gateway = inject(CommentsGateway);

  private readonly _thread = rxResource({
    params: () => this._slug(),
    stream: ({ params: slug }) => this._gateway.getThread(slug),
  });

  readonly content: Signal<CommentThreadContent> = computed(() => {
    if (this._thread.error()) return { status: 'failed' };
    const thread = this._thread.value();
    return thread ? { status: 'ready', view: toCommentThreadView(thread) } : { status: 'loading' };
  });

  constructor(private readonly _slug: Signal<string>) {}
}
