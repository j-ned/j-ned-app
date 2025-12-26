import type { ResourceRef } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ContactInfo, SocialLinks, ContactFormData, ContactFormSubmission } from '../models';

export interface ContactGateway {
  getContactInfo(): ResourceRef<ContactInfo>;
  getSocialLinks(): Observable<SocialLinks>;

  // Form submission (future backend)
  submitContactForm(data: ContactFormData): Observable<ContactFormSubmission>;
}

export { CONTACT_GATEWAY } from './contact.gateway.token';
