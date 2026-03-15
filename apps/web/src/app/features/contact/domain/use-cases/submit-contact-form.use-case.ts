import type { Observable } from 'rxjs';
import type { ContactGateway } from '../gateways';
import type { ContactFormData, ContactFormSubmission } from '../models';

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function submitContactForm(
  gateway: ContactGateway,
  data: ContactFormData,
): Observable<ContactFormSubmission> {
  if (!isValidEmail(data.email)) {
    throw new Error('Invalid email format');
  }
  return gateway.submitContactForm(data);
}
