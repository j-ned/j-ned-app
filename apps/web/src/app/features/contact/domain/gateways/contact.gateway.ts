import type { Observable } from 'rxjs';
import type {
  ContactInfo,
  SocialLinks,
  ContactFormData,
  ContactFormSubmission,
  ContactMessage,
} from '../models';

export type ContactGateway = {
  getContactInfo(): Observable<ContactInfo>;
  getSocialLinks(): Observable<SocialLinks>;

  submitContactForm(data: ContactFormData): Observable<ContactFormSubmission>;

  getAllMessages(): Observable<readonly ContactMessage[]>;
  markMessageAsRead(id: number): Observable<ContactMessage>;
  deleteMessage(id: number): Observable<void>;
  getUnreadCount(): Observable<number>;
  invalidateUnreadCount(): void;
};
