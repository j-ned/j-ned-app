import { Injectable, resource, type ResourceRef } from '@angular/core';
import { Observable, of, delay, throwError, map } from 'rxjs';
import type { ContactGateway } from '../../domain/gateways';
import type {
  ContactInfo,
  SocialLinks,
  ContactFormData,
  ContactFormSubmission,
  ContactMessage,
} from '../../domain/models';
import { CONTACT_INFO, SOCIAL_LINKS } from './contact.data';

@Injectable()
export class InMemoryContactGateway implements ContactGateway {
  private messages: ContactMessage[] = [];

  getContactInfo(): ResourceRef<ContactInfo> {
    return resource({
      loader: () => {
        return new Promise<ContactInfo>((resolve) => {
          setTimeout(() => resolve(CONTACT_INFO), 200);
        });
      },
    }) as ResourceRef<ContactInfo>;
  }

  getSocialLinks(): Observable<SocialLinks> {
    return of(SOCIAL_LINKS).pipe(delay(100));
  }

  submitContactForm(data: ContactFormData): Observable<ContactFormSubmission> {
    const msg: ContactMessage = {
      id: this.messages.length + 1,
      ...data,
      createdAt: new Date().toISOString(),
      read: false,
    };
    this.messages.push(msg);
    return of({
      success: true,
      message: 'Votre message a été envoyé avec succès! (simulation)',
    }).pipe(delay(500));
  }

  getAllMessages(): Observable<readonly ContactMessage[]> {
    return of([...this.messages]).pipe(delay(200));
  }

  markMessageAsRead(id: number): Observable<ContactMessage> {
    const msg = this.messages.find((m) => m.id === id);
    if (!msg) return throwError(() => new Error('Message not found'));
    const updated = { ...msg, read: true };
    const index = this.messages.indexOf(msg);
    this.messages[index] = updated;
    return of(updated).pipe(delay(200));
  }

  deleteMessage(id: number): Observable<void> {
    const index = this.messages.findIndex((m) => m.id === id);
    if (index === -1) return throwError(() => new Error('Message not found'));
    this.messages.splice(index, 1);
    return of(undefined as void).pipe(delay(200));
  }

  getUnreadCount(): Observable<number> {
    return this.getAllMessages().pipe(map((msgs) => msgs.filter((m) => !m.read).length));
  }
}
