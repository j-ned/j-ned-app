import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { CONTACT_GATEWAY } from '../gateways';
import type { ContactFormData, ContactFormSubmission } from '../models';

@Injectable()
export class SubmitContactFormUseCase {
  private gateway = inject(CONTACT_GATEWAY);

  execute(data: ContactFormData): Observable<ContactFormSubmission> {
    // Add validation logic here if needed
    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    return this.gateway.submitContactForm(data);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
