import { Injectable } from '@angular/core';
import {
  injectStorageHost,
  readStored,
  removeStored,
  writeStored,
} from '@core/storage/browser-storage';
import type { PendingComment } from '../domain/models/comment.model';
import { parsePendingComments } from '../domain/pending-comments';

const keyOf = (slug: string): string => `comments:pending:v1:${slug}`;

// Par onglet (`sessionStorage`) : rien n'est envoyé au serveur ni partagé entre onglets.
@Injectable({ providedIn: 'root' })
export class PendingCommentsStorage {
  private readonly _storage = injectStorageHost();

  read(slug: string): readonly PendingComment[] {
    const stored = readStored(this._storage, 'sessionStorage', keyOf(slug));
    if (!stored) return [];
    try {
      return parsePendingComments(JSON.parse(stored), Date.now());
    } catch {
      // Contenu illisible : la discussion s'affiche sans les envois en attente.
      return [];
    }
  }

  write(slug: string, pending: readonly PendingComment[]): void {
    // Stockage refusé ou plein : l'envoi reste affiché dans la page, seul un rechargement l'oublie.
    if (pending.length === 0) {
      removeStored(this._storage, 'sessionStorage', keyOf(slug));
      return;
    }
    const kept = JSON.stringify(parsePendingComments(pending, Date.now()));
    writeStored(this._storage, 'sessionStorage', keyOf(slug), kept);
  }
}
