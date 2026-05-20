import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ToastService } from '@shared/ui';
import { of, throwError } from 'rxjs';
import { ContactForm } from './contact-form';
import { CONTACT_GATEWAY } from './tokens';
import type { ContactGateway, ContactMessage } from '../domain';

function makeGatewayStub(overrides: Partial<ContactGateway> = {}): ContactGateway {
  return {
    submitContactForm: () => of({ success: true, message: 'OK' }),
    getAllMessages: () => of([]),
    markMessageAsRead: () => of({} as ContactMessage),
    deleteMessage: () => of(undefined),
    getUnreadCount: () => of(0),
    invalidateUnreadCount: () => undefined,
    ...overrides,
  };
}

describe('ContactForm', () => {
  function setup(gateway: ContactGateway = makeGatewayStub()): ContactForm {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), ToastService, { provide: CONTACT_GATEWAY, useValue: gateway }],
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

    it('onSubmit does not call gateway', () => {
      const submit = vi.fn().mockReturnValue(of({ success: true, message: '' }));
      const component = setup(makeGatewayStub({ submitContactForm: submit }));
      component.onSubmit();
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

    it('onSubmit calls the gateway with form values', () => {
      const submit = vi.fn().mockReturnValue(of({ success: true, message: 'Envoyé' }));
      const component = setup(makeGatewayStub({ submitContactForm: submit }));

      component.form.setValue({
        name: 'Alice',
        email: 'alice@example.com',
        subject: 'Projet Angular',
        message: 'Bonjour, message test de plus de 10 caractères.',
      });
      component.onSubmit();

      expect(submit).toHaveBeenCalledWith({
        name: 'Alice',
        email: 'alice@example.com',
        subject: 'Projet Angular',
        message: 'Bonjour, message test de plus de 10 caractères.',
      });
    });

    it('onSubmit handles gateway error gracefully', () => {
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

      expect(() => component.onSubmit()).not.toThrow();
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
});
