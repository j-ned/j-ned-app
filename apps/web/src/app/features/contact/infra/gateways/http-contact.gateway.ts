import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import {
  catchError,
  map,
  Observable,
  of,
  ReplaySubject,
  share,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { ContactGateway } from '../../domain/gateways/contact.gateway';
import type {
  ContactFormData,
  ContactFormSubmission,
} from '../../domain/models/contact-form.model';
import type { ContactMessage } from '../../domain/models/contact-message.model';
import { API_BASE_URL } from '@shared/api/api-config';
import { SKIP_ERROR_TOAST } from '@core/interceptors/skip-error-toast';

function toSubmissionError(err: HttpErrorResponse): ContactFormSubmission {
  switch (err.status) {
    case 0:
      return {
        success: false,
        message: 'Connexion impossible. Vérifiez votre réseau, puis réessayez dans un instant.',
      };
    case 400:
      return {
        success: false,
        message: 'Certains champs sont invalides. Vérifiez votre saisie et réessayez.',
      };
    case 429:
      return {
        success: false,
        message: 'Trop de tentatives en peu de temps. Patientez une minute avant de réessayer.',
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        success: false,
        message: 'Le serveur rencontre un souci temporaire. Réessayez dans quelques minutes.',
      };
    default:
      return {
        success: false,
        message:
          "Une erreur inattendue est survenue lors de l'envoi. Réessayez ou contactez-moi par email.",
      };
  }
}

@Injectable()
export class HttpContactGateway extends ContactGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  private readonly _unreadRefresh$ = new Subject<void>();
  // Seule la relance peut afficher un toast : un échec suivi d'une relance réussie reste muet.
  private readonly unreadCount$ = this._unreadRefresh$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.fetchUnreadCount(new HttpContext().set(SKIP_ERROR_TOAST, true)).pipe(
        catchError(() => this.fetchUnreadCount()),
      ),
    ),
    share({
      connector: () => new ReplaySubject<number>(1),
      resetOnError: true,
      resetOnComplete: false,
      resetOnRefCountZero: false,
    }),
  );

  submitContactForm(data: ContactFormData): Observable<ContactFormSubmission> {
    return this.http.post(`${this.apiUrl}/contact/messages`, data).pipe(
      map<unknown, ContactFormSubmission>(() => ({
        success: true,
        message: 'Votre message a bien été envoyé. Je reviens vers vous rapidement.',
      })),
      catchError((err: HttpErrorResponse) => of(toSubmissionError(err))),
    );
  }

  getAllMessages(): Observable<readonly ContactMessage[]> {
    return this.http
      .get<{ data: ContactMessage[] }>(`${this.apiUrl}/contact/messages`)
      .pipe(map((res) => res.data));
  }

  markMessageAsRead(id: number): Observable<ContactMessage> {
    return this.http.patch<ContactMessage>(`${this.apiUrl}/contact/messages/${id}/read`, {});
  }

  deleteMessage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/contact/messages/${id}`);
  }

  private fetchUnreadCount(context?: HttpContext): Observable<number> {
    return this.http
      .get<{ count: number }>(`${this.apiUrl}/contact/messages/unread-count`, { context })
      .pipe(map((res) => res.count));
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount$;
  }

  invalidateUnreadCount(): void {
    this._unreadRefresh$.next();
  }

  markAllRead(): Observable<{ readonly count: number }> {
    return this.http.patch<{ count: number }>(`${this.apiUrl}/contact/messages/mark-all-read`, {});
  }
}
