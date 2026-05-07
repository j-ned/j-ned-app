import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import type { ContactGateway } from '../../domain';
import type {
  ContactInfo,
  SocialLink,
  SocialLinks,
  ContactFormData,
  ContactFormSubmission,
  ContactMessage,
} from '../../domain';
import { API_BASE_URL } from '@shared/api';

type RawSocialLink = { id: string; icon: string; label: string; href: string };

const EMPTY_LINK: SocialLink = { url: '', label: '', icon: '' };

function toSubmissionError(err: HttpErrorResponse): ContactFormSubmission {
  switch (err.status) {
    case 0:
      return {
        success: false,
        message:
          'Connexion impossible — vérifiez votre réseau, puis réessayez dans un instant.',
      };
    case 400:
      return {
        success: false,
        message:
          'Certains champs sont invalides. Vérifiez votre saisie et réessayez.',
      };
    case 429:
      return {
        success: false,
        message:
          'Trop de tentatives en peu de temps. Patientez une minute avant de réessayer.',
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        success: false,
        message:
          'Le serveur rencontre un souci temporaire. Réessayez dans quelques minutes.',
      };
    default:
      return {
        success: false,
        message:
          "Une erreur inattendue est survenue lors de l'envoi. Réessayez ou contactez-moi par email.",
      };
  }
}

function toSocialLinks(items: readonly RawSocialLink[]): SocialLinks {
  const find = (keyword: string): SocialLink => {
    const item = items.find(
      (i) =>
        i.label.toLowerCase().includes(keyword) ||
        i.icon.toLowerCase().includes(keyword) ||
        i.href.toLowerCase().includes(keyword),
    );
    return item ? { url: item.href, label: item.label, icon: item.icon } : EMPTY_LINK;
  };
  return {
    linkedin: find('linkedin'),
    github: find('github'),
    twitter: find('twitter') || find('x.com'),
    email: find('mail'),
    phone: find('phone') || find('tel'),
  };
}

@Injectable()
export class HttpContactGateway implements ContactGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  getContactInfo(): Observable<ContactInfo> {
    return this.http
      .get<{ email: string; phone: string; location: string }>(`${this.apiUrl}/contact/info`)
      .pipe(map((data) => ({ email: data.email, phone: data.phone, location: data.location })));
  }

  getSocialLinks(): Observable<SocialLinks> {
    return this.http.get<readonly RawSocialLink[]>(`${this.apiUrl}/social-links`).pipe(
      map((items) => toSocialLinks(items)),
      catchError(() =>
        of({
          linkedin: EMPTY_LINK,
          github: EMPTY_LINK,
          twitter: EMPTY_LINK,
          email: EMPTY_LINK,
          phone: EMPTY_LINK,
        }),
      ),
    );
  }

  submitContactForm(data: ContactFormData): Observable<ContactFormSubmission> {
    return this.http.post(`${this.apiUrl}/contact/messages`, data).pipe(
      map<unknown, ContactFormSubmission>(() => ({
        success: true,
        message: 'Votre message a bien été envoyé — je reviens vers vous rapidement.',
      })),
      catchError((err: HttpErrorResponse) => of(toSubmissionError(err))),
    );
  }

  getAllMessages(): Observable<readonly ContactMessage[]> {
    return this.http.get<{ data: ContactMessage[] }>(`${this.apiUrl}/contact/messages`).pipe(
      map((res) => res.data),
      catchError(() => of([])),
    );
  }

  markMessageAsRead(id: number): Observable<ContactMessage> {
    return this.http.patch<ContactMessage>(`${this.apiUrl}/contact/messages/${id}/read`, {});
  }

  deleteMessage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/contact/messages/${id}`);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/contact/messages/unread-count`).pipe(
      map((res) => res.count),
      catchError(() => of(0)),
    );
  }
}
