import { inject, Injectable, resource, type ResourceRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import type { ContactGateway } from '../../domain';
import type {
  ContactInfo,
  SocialLinks,
  ContactFormData,
  ContactFormSubmission,
  ContactMessage,
} from '../../domain';
import { API_BASE_URL } from '../../../../shared/api/api-config';

@Injectable()
export class HttpContactGateway implements ContactGateway {
  private readonly http = inject(HttpClient);

  getContactInfo(): ResourceRef<ContactInfo> {
    return resource({
      loader: () =>
        fetch(`${API_BASE_URL}/contactInfo`)
          .then((res) => res.json() as Promise<ContactInfo[]>)
          .then((data) => data[0]),
    }) as ResourceRef<ContactInfo>;
  }

  getSocialLinks(): Observable<SocialLinks> {
    return this.http.get<SocialLinks[]>(`${API_BASE_URL}/socialLinks`).pipe(
      map((data) => data[0]),
      catchError(() => of({} as SocialLinks)),
    );
  }

  submitContactForm(data: ContactFormData): Observable<ContactFormSubmission> {
    const payload = { ...data, createdAt: new Date().toISOString(), read: false };
    return this.http.post<ContactMessage>(`${API_BASE_URL}/contactMessages`, payload).pipe(
      map(() => ({
        success: true,
        message: 'Votre message a été envoyé avec succès !',
      })),
      catchError(() =>
        of({
          success: false,
          message: "Une erreur est survenue lors de l'envoi. Veuillez réessayer.",
        }),
      ),
    );
  }

  getAllMessages(): Observable<readonly ContactMessage[]> {
    return this.http
      .get<readonly ContactMessage[]>(`${API_BASE_URL}/contactMessages?_sort=-createdAt`)
      .pipe(catchError(() => of([])));
  }

  markMessageAsRead(id: number): Observable<ContactMessage> {
    return this.http.get<ContactMessage[]>(`${API_BASE_URL}/contactMessages?id=${id}`).pipe(
      switchMap((data) => {
        if (data.length === 0) return throwError(() => new Error('Message not found'));
        return this.http.patch<ContactMessage>(`${API_BASE_URL}/contactMessages/${data[0].id}`, {
          read: true,
        });
      }),
    );
  }

  deleteMessage(id: number): Observable<void> {
    return this.http.get<ContactMessage[]>(`${API_BASE_URL}/contactMessages?id=${id}`).pipe(
      switchMap((data) => {
        if (data.length === 0) return throwError(() => new Error('Message not found'));
        return this.http.delete<void>(`${API_BASE_URL}/contactMessages/${data[0].id}`);
      }),
    );
  }

  getUnreadCount(): Observable<number> {
    return this.http
      .get<readonly ContactMessage[]>(`${API_BASE_URL}/contactMessages?read=false`)
      .pipe(
        map((messages) => messages.length),
        catchError(() => of(0)),
      );
  }
}
