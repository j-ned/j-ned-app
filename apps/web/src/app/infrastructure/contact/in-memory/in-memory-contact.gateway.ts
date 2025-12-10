import { Injectable, resource, type ResourceRef } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import type { ContactGateway } from '../../../core/contact/gateways';
import type { ContactInfo, SocialLinks, ContactFormData, ContactFormSubmission } from '../../../core/contact/models';
import { CONTACT_INFO, SOCIAL_LINKS } from './contact.data';

@Injectable()
export class InMemoryContactGateway implements ContactGateway {
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
    // Simulate form submission
    console.log('Contact form submitted (in-memory):', data);
    return of({
      success: true,
      message: 'Votre message a été envoyé avec succès! (simulation)',
    }).pipe(delay(500));
  }
}
