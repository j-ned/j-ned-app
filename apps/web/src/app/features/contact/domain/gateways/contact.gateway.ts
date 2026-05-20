import type { Observable } from 'rxjs';
import type {
  ContactFormData,
  ContactFormSubmission,
  ContactMessage,
} from '../models';

export type ContactGateway = {
  submitContactForm(data: ContactFormData): Observable<ContactFormSubmission>;

  getAllMessages(): Observable<readonly ContactMessage[]>;
  markMessageAsRead(id: number): Observable<ContactMessage>;
  deleteMessage(id: number): Observable<void>;
  getUnreadCount(): Observable<number>;
  invalidateUnreadCount(): void;
};
