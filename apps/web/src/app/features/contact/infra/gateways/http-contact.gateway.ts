import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of, tap, type MonoTypeOperatorFunction, type Observable } from 'rxjs';
import { ContactGateway } from '../../domain/gateways/contact.gateway';
import type {
  ContactFormData,
  ContactFormSubmission,
} from '../../domain/models/contact-form.model';
import type { ContactMessage } from '../../domain/models/contact-message.model';
import { API_BASE_URL } from '@shared/api/api-config';
import { refreshable } from '@shared/api/refreshable';
import { silentErrors } from '@core/interceptors/skip-error-toast';

function toSubmissionError(err: HttpErrorResponse): ContactFormSubmission {
  switch (err.status) {
    case 0:
      return {
        success: false,
        message: 'Connexion impossible. Vérifie ton réseau, puis réessaie dans un instant.',
      };
    case 400:
      return {
        success: false,
        message: 'Certains champs ne vont pas. Vérifie ta saisie et réessaie.',
      };
    case 429:
      return {
        success: false,
        // Fenêtre de l'API : 3 messages par heure et par IP.
        message:
          "Trop d'envois en peu de temps. Réessaie dans une heure, ou écris-moi directement par e-mail.",
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        success: false,
        message: 'Le serveur a un souci passager. Réessaie dans quelques minutes.',
      };
    default:
      return {
        success: false,
        message: "Quelque chose a coincé pendant l'envoi. Réessaie, ou écris-moi par e-mail.",
      };
  }
}

@Injectable()
export class HttpContactGateway extends ContactGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  // Au premier chargement, seule la relance peut toaster ; une relecture de fond reste muette.
  private readonly unreadCount = refreshable((background) =>
    background
      ? this.fetchUnreadCount(silentErrors())
      : this.fetchUnreadCount(silentErrors()).pipe(catchError(() => this.fetchUnreadCount())),
  );

  submitContactForm(data: ContactFormData): Observable<ContactFormSubmission> {
    return this.http.post(`${this.apiUrl}/contact/messages`, data).pipe(
      map<unknown, ContactFormSubmission>(() => ({
        success: true,
        message: 'Message bien reçu, merci\u202f! Je te réponds dès que je peux.',
      })),
      this.recountOnSuccess(),
      catchError((err: HttpErrorResponse) => of(toSubmissionError(err))),
    );
  }

  // Lue par l'admin seul, qui affiche son propre état d'erreur.
  getAllMessages(): Observable<readonly ContactMessage[]> {
    return this.http
      .get<{ data: ContactMessage[] }>(`${this.apiUrl}/contact/messages`, {
        context: silentErrors(),
      })
      .pipe(map((res) => res.data));
  }

  // Les écritures de l'admin : la page restaure son état et nomme l'échec elle-même. Une écriture
  // réussie relit le compteur de non-lus.
  markMessageAsRead(id: number): Observable<ContactMessage> {
    return this.http
      .patch<ContactMessage>(
        `${this.apiUrl}/contact/messages/${id}/read`,
        {},
        { context: silentErrors() },
      )
      .pipe(this.recountOnSuccess());
  }

  deleteMessage(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/contact/messages/${id}`, { context: silentErrors() })
      .pipe(this.recountOnSuccess());
  }

  private fetchUnreadCount(context = new HttpContext()): Observable<number> {
    return this.http
      .get<{ count: number }>(`${this.apiUrl}/contact/messages/unread-count`, { context })
      .pipe(map((res) => res.count));
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount.value$;
  }

  invalidateUnreadCount(): void {
    this.unreadCount.refresh();
  }

  markAllRead(): Observable<{ readonly count: number }> {
    return this.http
      .patch<{
        count: number;
      }>(`${this.apiUrl}/contact/messages/mark-all-read`, {}, { context: silentErrors() })
      .pipe(this.recountOnSuccess());
  }

  private recountOnSuccess<T>(): MonoTypeOperatorFunction<T> {
    return tap(() => this.invalidateUnreadCount());
  }
}
