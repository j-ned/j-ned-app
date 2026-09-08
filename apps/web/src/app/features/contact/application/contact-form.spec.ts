import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastStore } from '@shared/ui/toast-store';
import { NEVER, of, throwError } from 'rxjs';
import { ContactForm } from './contact-form';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import type { ContactFormData } from '@features/contact/domain/models/contact-form.model';
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

// Builder du domaine : jamais un littéral comme entrée sous test.
function makeContactData(overrides: Partial<ContactFormData> = {}): ContactFormData {
  return {
    name: 'Alice',
    email: 'alice@example.com',
    subject: 'Projet Angular',
    message: 'Bonjour, j’aimerais discuter d’un projet.',
    ...overrides,
  };
}

describe('ContactForm (Signal Forms)', () => {
  async function setup(
    gateway: ContactGateway = makeGatewayStub(),
  ): Promise<ComponentFixture<ContactForm>> {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), ToastStore, { provide: ContactGateway, useValue: gateway }],
    });
    const fixture = TestBed.createComponent(ContactForm);
    await fixture.whenStable();
    return fixture;
  }

  const fill = async (
    fixture: ComponentFixture<ContactForm>,
    data: ContactFormData,
  ): Promise<void> => {
    fixture.componentInstance.contactForm().value.set(data);
    await fixture.whenStable();
  };

  const submitButton = (fixture: ComponentFixture<ContactForm>): HTMLButtonElement =>
    fixture.nativeElement.querySelector('app-button button[type="submit"]');

  const alerts = (fixture: ComponentFixture<ContactForm>): string[] =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="alert"]')].map((el) =>
      el.textContent.trim(),
    );

  describe('Validation at the edge', () => {
    it('an empty form is invalid and every field carries a required error', async () => {
      const fixture = await setup();
      const form = fixture.componentInstance.contactForm;

      expect(form().invalid()).toBe(true);
      for (const field of [form.name, form.email, form.subject, form.message]) {
        expect(
          field()
            .errors()
            .map((e) => e.kind),
        ).toContain('required');
      }
    });

    it.each([
      ['name', 'A', 'minLength'],
      ['subject', 'Hi', 'minLength'],
      ['message', 'court', 'minLength'],
      ['email', 'not-an-email', 'pattern'],
    ] as const)('%s = %j carries a %s error', async (field, value, kind) => {
      const fixture = await setup();
      await fill(fixture, makeContactData({ [field]: value }));

      expect(
        fixture.componentInstance.contactForm[field]()
          .errors()
          .map((e) => e.kind),
      ).toEqual([kind]);
    });

    it('becomes valid once every field is corrected', async () => {
      const fixture = await setup();
      await fill(fixture, makeContactData({ email: 'not-an-email' }));
      expect(fixture.componentInstance.contactForm().valid()).toBe(false);

      await fill(fixture, makeContactData());
      expect(fixture.componentInstance.contactForm().valid()).toBe(true);
    });

    it('does not show an error before the field is touched, then shows it with aria wiring', async () => {
      const fixture = await setup();
      const email = fixture.componentInstance.contactForm.email;
      const input = (): HTMLInputElement => fixture.nativeElement.querySelector('input#email');

      expect(alerts(fixture)).toEqual([]);
      expect(input().getAttribute('aria-invalid')).toBe('false');

      email().markAsTouched();
      await fixture.whenStable();

      expect(input().getAttribute('aria-invalid')).toBe('true');
      expect(input().getAttribute('aria-describedby')).toBe('contact-email-error');
      expect(
        fixture.nativeElement.querySelector('#contact-email-error')?.getAttribute('role'),
      ).toBe('alert');
    });

    it('drops the aria-describedby once the field becomes valid', async () => {
      const fixture = await setup();
      fixture.componentInstance.contactForm.email().markAsTouched();
      await fill(fixture, makeContactData());

      const input: HTMLInputElement = fixture.nativeElement.querySelector('input#email');
      expect(input.getAttribute('aria-invalid')).toBe('false');
      expect(input.getAttribute('aria-describedby')).toBeNull();
    });
  });

  describe('Submitting an incomplete form', () => {
    it('keeps the submit button enabled while the form is invalid', async () => {
      const fixture = await setup();
      expect(submitButton(fixture).disabled).toBe(false);
    });

    it('does not call the gateway, reveals every error and focuses the first invalid field', async () => {
      const submit = vi.fn().mockReturnValue(of({ success: true, message: '' }));
      const fixture = await setup(makeGatewayStub({ submitContactForm: submit }));
      await fill(fixture, makeContactData({ name: '', subject: '', message: '' }));

      await fixture.componentInstance.submitContact();
      await fixture.whenStable();

      expect(submit).not.toHaveBeenCalled();
      expect(alerts(fixture)).toEqual([
        'Le nom est obligatoire',
        'Le sujet est obligatoire',
        'Le message est obligatoire',
      ]);
      expect(document.activeElement?.id).toBe('name');
    });
  });

  describe('Submitting a valid form', () => {
    it('calls the gateway once with the model, then resets the form', async () => {
      const submit = vi.fn().mockReturnValue(of({ success: true, message: 'Envoyé' }));
      const fixture = await setup(makeGatewayStub({ submitContactForm: submit }));
      await fill(fixture, makeContactData());

      await fixture.componentInstance.submitContact();
      await fixture.whenStable();

      expect(submit).toHaveBeenCalledTimes(1);
      expect(submit).toHaveBeenCalledWith(makeContactData());
      expect(fixture.componentInstance.contactForm().value()).toEqual({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      expect(alerts(fixture)).toEqual([]);
    });

    it('disables the submit button only while the message is being sent', async () => {
      const fixture = await setup(makeGatewayStub({ submitContactForm: () => NEVER }));
      await fill(fixture, makeContactData());

      void fixture.componentInstance.submitContact();
      await fixture.whenStable();

      expect(fixture.componentInstance.contactForm().submitting()).toBe(true);
      expect(submitButton(fixture).disabled).toBe(true);
    });

    it('keeps the entered values and surfaces a toast when the gateway fails', async () => {
      const fixture = await setup(
        makeGatewayStub({ submitContactForm: () => throwError(() => new Error('network')) }),
      );
      const toast = TestBed.inject(ToastStore);
      await fill(fixture, makeContactData());

      await expect(fixture.componentInstance.submitContact()).resolves.toBeUndefined();
      await fixture.whenStable();

      expect(toast.messages().at(-1)?.severity).toBe('error');
      expect(fixture.componentInstance.contactForm().value()).toEqual(makeContactData());
      expect(fixture.componentInstance.contactForm().submitting()).toBe(false);
    });
  });
});
