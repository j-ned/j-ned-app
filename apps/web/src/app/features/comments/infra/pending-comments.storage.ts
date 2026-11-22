import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { injectIsBrowser } from '@core/ssr/inject-is-browser';
import type { PendingComment } from '../domain/models/comment.model';
import { parsePendingComments } from '../domain/pending-comments';

const keyOf = (slug: string): string => `comments:pending:v1:${slug}`;

// Par onglet (`sessionStorage`) : rien n'est envoyé au serveur ni partagé entre onglets.
@Injectable({ providedIn: 'root' })
export class PendingCommentsStorage {
  private readonly _view = injectIsBrowser() ? inject(DOCUMENT).defaultView : null;

  read(slug: string): readonly PendingComment[] {
    try {
      const stored = this._view?.sessionStorage.getItem(keyOf(slug));
      return stored ? parsePendingComments(JSON.parse(stored), Date.now()) : [];
    } catch {
      // Stockage refusé ou contenu illisible : la discussion s'affiche sans les envois en attente.
      return [];
    }
  }

  write(slug: string, pending: readonly PendingComment[]): void {
    try {
      const storage = this._view?.sessionStorage;
      if (!storage) return;
      if (pending.length === 0) {
        storage.removeItem(keyOf(slug));
        return;
      }
      storage.setItem(keyOf(slug), JSON.stringify(parsePendingComments(pending, Date.now())));
    } catch {
      // Stockage refusé ou plein : l'envoi reste affiché dans la page, seul un rechargement l'oublie.
    }
  }
}
