import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ToastStore } from '@shared/ui/toast-store';
import { of, throwError } from 'rxjs';
import { ContactForm } from './contact-form';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import type { ContactMessage } from '@features/contact/domain/models/contact-message.model';

function makeGatewayStub(overrides: Partial<ContactGateway> = {}): ContactGateway {
  return {
    submitContactForm: () => of({ success: true, message: 'OK' }),
    getAllMessages: () => of([]),
    markMessageAsRead: () => of({} as ContactMessage),
    deleteMessage: () => of(undefined),
    getUnreadCount: () => of(0),
    invalidateUnreadCount: () => undefined,
    markAllRead: () => of({ count: 0 }),
    ...overrides,
  };
}

describe('ContactForm', () => {
  function setup(gateway: ContactGateway = makeGatewayStub()): ContactForm {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), ToastStore, { provide: ContactGateway, useValue: gateway }],
      schemas: [NO_ERRORS_SCHEMA],
    });
    return TestBed.runInInjectionContext(() => {
      const fixture = TestBed.createComponent(ContactForm);
      return fixture.componentInstance as ContactForm;
    });
  }

  describe('Given an empty form', () => {
    it('form is invalid', () => {
      const component = setup();
      expect(component.form.invalid).toBe(true);
    });

    it('submitContact does not call gateway', () => {
      const submit = vi.fn().mockReturnValue(of({ success: true, message: '' }));
      const component = setup(makeGatewayStub({ submitContactForm: submit }));
      component.submitContact();
      expect(submit).not.toHaveBeenCalled();
    });
  });

  describe('Given a fully valid form', () => {
    it('form is valid with required fields filled', () => {
      const component = setup();
      component.form.setValue({
        name: 'Alice',
        email: 'alice@example.com',
        subject: 'Projet Angular',
        message: 'Bonjour, j\u2019aimerais discuter d\u2019un projet.',
      });
      expect(component.form.valid).toBe(true);
    });

    it('submitContact calls the gateway with form values', () => {
      const submit = vi.fn().mockReturnValue(of({ success: true, message: 'Envoyé' }));
      const component = setup(makeGatewayStub({ submitContactForm: submit }));

      component.form.setValue({
        name: 'Alice',
        email: 'alice@example.com',
        subject: 'Projet Angular',
        message: 'Bonjour, message test de plus de 10 caractères.',
      });
      component.submitContact();

      expect(submit).toHaveBeenCalledWith({
        name: 'Alice',
        email: 'alice@example.com',
        subject: 'Projet Angular',
        message: 'Bonjour, message test de plus de 10 caractères.',
      });
    });

    it('submitContact handles gateway error gracefully', () => {
      const component = setup(
        makeGatewayStub({
          submitContactForm: () => throwError(() => new Error('network')),
        }),
      );

      component.form.setValue({
        name: 'Alice',
        email: 'alice@example.com',
        subject: 'Sujet valide',
        message: 'Message assez long pour passer la validation.',
      });

      expect(() => component.submitContact()).not.toThrow();
    });
  });

  describe('Given invalid email format', () => {
    it('email control has pattern error', () => {
      const component = setup();
      component.form.setValue({
        name: 'Alice',
        email: 'not-an-email',
        subject: 'Valide',
        message: 'Message assez long pour validation.',
      });
      component.form.controls.email.markAsTouched();
      expect(component.form.controls.email.errors?.['pattern']).toBeTruthy();
    });
  });

  describe('Given a too-short message', () => {
    it('message control has minlength error', () => {
      const component = setup();
      component.form.controls.message.setValue('court');
      component.form.controls.message.markAsTouched();
      expect(component.form.controls.message.errors?.['minlength']).toBeTruthy();
    });
  });

  describe('Accessibility — aria attributes', () => {
    function setupFixture(gateway: ContactGateway = makeGatewayStub()): ComponentFixture<ContactForm> {
      TestBed.configureTestingModule({
        providers: [provideRouter([]), ToastStore, { provide: ContactGateway, useValue: gateway }],
      });
      const fixture = TestBed.createComponent(ContactForm);
      fixture.detectChanges();
      return fixture;
    }

    it('exposes aria-invalid=true and aria-describedby on email when touched and invalid', () => {
      const fixture = setupFixture();
      fixture.componentInstance.form.controls.email.markAsTouched();
      fixture.componentInstance.form.controls.email.setValue('');
      fixture.detectChanges();

      const emailInput = fixture.nativeElement.querySelector('input#email') as HTMLInputElement;
      expect(emailInput.getAttribute('aria-invalid')).toBe('true');
      expect(emailInput.getAttribute('aria-describedby')).toBe('contact-email-error');

      const errorMsg = fixture.nativeElement.querySelector('#contact-email-error');
      expect(errorMsg).not.toBeNull();
      expect(errorMsg!.getAttribute('role')).toBe('alert');
    });

    it('removes aria-describedby when field becomes valid', () => {
      const fixture = setupFixture();
      fixture.componentInstance.form.controls.email.markAsTouched();
      fixture.componentInstance.form.controls.email.setValue('valid@example.com');
      fixture.detectChanges();

      const emailInput = fixture.nativeElement.querySelector('input#email') as HTMLInputElement;
      expect(emailInput.getAttribute('aria-invalid')).toBe('false');
      expect(emailInput.getAttribute('aria-describedby')).toBeNull();
    });

    it('applies aria attributes to all 4 fields: name, email, subject, message', () => {
      const fixture = setupFixture();
      const fieldNames = ['name', 'email', 'subject', 'message'] as const;
      for (const fieldName of fieldNames) {
        fixture.componentInstance.form.controls[fieldName].markAsTouched();
        fixture.componentInstance.form.controls[fieldName].setValue('');
      }
      fixture.detectChanges();

      for (const fieldName of fieldNames) {
        const input = fixture.nativeElement.querySelector(`#${fieldName}`) as HTMLElement;
        expect(input).not.toBeNull();
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(input.getAttribute('aria-describedby')).toBe(`contact-${fieldName}-error`);

        const errorMsg = fixture.nativeElement.querySelector(`#contact-${fieldName}-error`);
        expect(errorMsg).not.toBeNull();
      }
    });
  });
});
