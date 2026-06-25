import type { Observable } from 'rxjs';
import type { ContactFormData, ContactFormSubmission } from '@features/contact/domain/models/contact-form.model';
import type { ContactMessage } from '@features/contact/domain/models/contact-message.model';

export abstract class ContactGateway {
  abstract submitContactForm(data: ContactFormData): Observable<ContactFormSubmission>;

  abstract getAllMessages(): Observable<readonly ContactMessage[]>;
  abstract markMessageAsRead(id: number): Observable<ContactMessage>;
  abstract deleteMessage(id: number): Observable<void>;
  abstract getUnreadCount(): Observable<number>;
  abstract invalidateUnreadCount(): void;
  abstract markAllRead(): Observable<{ readonly count: number }>;
}
