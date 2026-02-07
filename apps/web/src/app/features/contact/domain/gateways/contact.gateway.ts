import type { ResourceRef } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  ContactInfo,
  SocialLinks,
  ContactFormData,
  ContactFormSubmission,
  ContactMessage,
} from '../models';

export type ContactGateway = {
  getContactInfo(): ResourceRef<ContactInfo>;
  getSocialLinks(): Observable<SocialLinks>;

  // Form submission (future backend)
  submitContactForm(data: ContactFormData): Observable<ContactFormSubmission>;

  // Admin messages
  getAllMessages(): Observable<readonly ContactMessage[]>;
  markMessageAsRead(id: number): Observable<ContactMessage>;
  deleteMessage(id: number): Observable<void>;
  getUnreadCount(): Observable<number>;
};

export { CONTACT_GATEWAY } from './contact.gateway.token';
