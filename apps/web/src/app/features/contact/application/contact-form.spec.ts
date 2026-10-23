import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastStore } from '@core/notifications/toast-store';
import { NEVER, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { ContactForm } from './contact-form';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import type { ContactFormData } from '@features/contact/domain/models/contact-form.model';
import { stubContactGateway } from '@features/contact/testing/stub-contact-gateway';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import type { ContactPlacement } from '@features/analytics/domain/models/analytics.types';
import { stubAnalyticsGateway } from '@features/analytics/testing/stub-analytics-gateway';

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
    gateway: ContactGateway = stubContactGateway(),
    inputs: Readonly<Record<string, string | readonly string[]>> = {},
    analytics: AnalyticsGateway = stubAnalyticsGateway(),
  ): Promise<ComponentFixture<ContactForm>> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        ToastStore,
        { provide: ContactGateway, useValue: gateway },
        { provide: AnalyticsGateway, useValue: analytics },
      ],
    });
    const fixture = TestBed.createComponent(ContactForm);
    for (const [name, value] of Object.entries({ placement: 'home', ...inputs })) {
      fixture.componentRef.setInput(name, value);
    }
    await fixture.whenStable();
    return fixture;
  }

  const fill = async (
    fixture: ComponentFixture<ContactForm>,
    data: ContactFormData,
  ): Promise<void> => {
    const form = fixture.componentInstance.contactForm;
    form.name().value.set(data.name);
    form.email().value.set(data.email);
    form.subject().value.set(data.subject);
    form.message().value.set(data.message);
    await fixture.whenStable();
  };

  const submitButton = (fixture: ComponentFixture<ContactForm>): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button[type="submit"]');

  const alerts = (fixture: ComponentFixture<ContactForm>): string[] =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="alert"]')].map(
      (el) => el.textContent.trim(),
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
      const fixture = await setup(stubContactGateway({ submitContactForm: submit }));
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
      const fixture = await setup(stubContactGateway({ submitContactForm: submit }));
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
      const fixture = await setup(stubContactGateway({ submitContactForm: () => NEVER }));
      await fill(fixture, makeContactData());

      void fixture.componentInstance.submitContact();
      await fixture.whenStable();

      expect(fixture.componentInstance.contactForm().submitting()).toBe(true);
      expect(submitButton(fixture).disabled).toBe(true);
    });

    it('keeps the entered values and surfaces a toast when the gateway fails', async () => {
      const fixture = await setup(
        stubContactGateway({ submitContactForm: () => throwError(() => new Error('network')) }),
      );
      const toast = TestBed.inject(ToastStore);
      await fill(fixture, makeContactData());

      await expect(fixture.componentInstance.submitContact()).resolves.toBeUndefined();
      await fixture.whenStable();

      expect(toast.messages().at(-1)?.severity).toBe('error');
      expect(toast.messages().at(-1)?.detail).toBe(
        "Quelque chose a coincé pendant l'envoi. Réessaie, ou écris-moi par e-mail.",
      );
      expect(fixture.componentInstance.contactForm().value()).toEqual(makeContactData());
      expect(fixture.componentInstance.contactForm().submitting()).toBe(false);
    });
  });

  describe('Measuring a sent form', () => {
    const measured = (): {
      analytics: AnalyticsGateway;
      trackContactSubmit: Mock<AnalyticsGateway['trackContactSubmit']>;
    } => {
      const trackContactSubmit = vi.fn<AnalyticsGateway['trackContactSubmit']>();
      return { analytics: stubAnalyticsGateway({ trackContactSubmit }), trackContactSubmit };
    };

    it.each<ContactPlacement>(['home'])(
      'counts one submission under %s once the API accepts the message',
      async (placement) => {
        const { analytics, trackContactSubmit } = measured();
        const submit = vi.fn().mockReturnValue(of({ success: true, message: 'Envoyé' }));
        const fixture = await setup(
          stubContactGateway({ submitContactForm: submit }),
          { placement },
          analytics,
        );
        await fill(fixture, makeContactData());

        await fixture.componentInstance.submitContact();
        await fixture.whenStable();

        expect(trackContactSubmit.mock.calls).toEqual([[placement]]);
        expect(submit.mock.invocationCallOrder[0]).toBeLessThan(
          trackContactSubmit.mock.invocationCallOrder[0],
        );
      },
    );

    it('counts nothing when the API refuses the message', async () => {
      const { analytics, trackContactSubmit } = measured();
      const fixture = await setup(
        stubContactGateway({
          submitContactForm: () => of({ success: false, message: 'Refusé' }),
        }),
        {},
        analytics,
      );
      await fill(fixture, makeContactData());

      await fixture.componentInstance.submitContact();
      await fixture.whenStable();

      expect(trackContactSubmit).not.toHaveBeenCalled();
    });

    it('counts nothing when sending throws', async () => {
      const { analytics, trackContactSubmit } = measured();
      const fixture = await setup(
        stubContactGateway({ submitContactForm: () => throwError(() => new Error('network')) }),
        {},
        analytics,
      );
      await fill(fixture, makeContactData());

      await fixture.componentInstance.submitContact();
      await fixture.whenStable();

      expect(trackContactSubmit).not.toHaveBeenCalled();
    });

    it('counts nothing when the form is invalid', async () => {
      const { analytics, trackContactSubmit } = measured();
      const submit = vi.fn().mockReturnValue(of({ success: true, message: 'Envoyé' }));
      const fixture = await setup(stubContactGateway({ submitContactForm: submit }), {}, analytics);
      await fill(fixture, makeContactData({ email: 'pas-un-email' }));

      await fixture.componentInstance.submitContact();
      await fixture.whenStable();

      expect({ sent: submit.mock.calls.length, counted: trackContactSubmit.mock.calls }).toEqual({
        sent: 0,
        counted: [],
      });
    });
  });

  describe('Initial subject', () => {
    const OFFER_SUBJECT = 'Site pro pour mon atelier';

    const subjectInput = (fixture: ComponentFixture<ContactForm>): HTMLInputElement | null =>
      fixture.nativeElement.querySelector('[data-testid="contact-subject"]');

    const fillAllButSubject = async (fixture: ComponentFixture<ContactForm>): Promise<void> => {
      const form = fixture.componentInstance.contactForm;
      const { name, email, message } = makeContactData();
      form.name().value.set(name);
      form.email().value.set(email);
      form.message().value.set(message);
      await fixture.whenStable();
    };

    it('leaves the subject empty and required when no initial subject is bound', async () => {
      const fixture = await setup();

      expect(subjectInput(fixture)?.value).toBe('');
      expect(
        fixture.componentInstance.contactForm
          .subject()
          .errors()
          .map((e) => e.kind),
      ).toContain('required');
    });

    it('prefills the subject with the bound initial subject, without any subject error', async () => {
      const fixture = await setup(stubContactGateway(), { initialSubject: OFFER_SUBJECT });

      expect(subjectInput(fixture)?.value).toBe(OFFER_SUBJECT);
      expect(fixture.componentInstance.contactForm.subject().errors()).toEqual([]);
    });

    it('sends the prefilled subject when the visitor leaves it untouched', async () => {
      const submit = vi.fn().mockReturnValue(of({ success: true, message: 'Envoyé' }));
      const fixture = await setup(stubContactGateway({ submitContactForm: submit }), {
        initialSubject: OFFER_SUBJECT,
      });
      await fillAllButSubject(fixture);

      await fixture.componentInstance.submitContact();
      await fixture.whenStable();

      expect(submit).toHaveBeenCalledExactlyOnceWith(makeContactData({ subject: OFFER_SUBJECT }));
    });

    it('lets the visitor rewrite the prefilled subject and sends the rewritten one', async () => {
      const submit = vi.fn().mockReturnValue(of({ success: true, message: 'Envoyé' }));
      const fixture = await setup(stubContactGateway({ submitContactForm: submit }), {
        initialSubject: OFFER_SUBJECT,
      });
      await fillAllButSubject(fixture);

      expect(subjectInput(fixture)).toBeInstanceOf(HTMLInputElement);
      const input = subjectInput(fixture) as HTMLInputElement;
      input.value = 'Refonte du site de mon atelier';
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();

      expect(fixture.componentInstance.contactForm.subject().value()).toBe(
        'Refonte du site de mon atelier',
      );

      await fixture.componentInstance.submitContact();
      await fixture.whenStable();

      expect(submit).toHaveBeenCalledExactlyOnceWith(
        makeContactData({ subject: 'Refonte du site de mon atelier' }),
      );
    });

    it('restores the initial subject, not an empty one, after a successful send', async () => {
      const fixture = await setup(stubContactGateway(), { initialSubject: OFFER_SUBJECT });
      await fill(fixture, makeContactData({ subject: 'Autre chose' }));

      await fixture.componentInstance.submitContact();
      await fixture.whenStable();

      expect(fixture.componentInstance.contactForm().value()).toEqual({
        name: '',
        email: '',
        subject: OFFER_SUBJECT,
        message: '',
      });
      expect(subjectInput(fixture)?.value).toBe(OFFER_SUBJECT);
    });
  });

  describe('Qualification', () => {
    it('no longer asks for a project type nor a timeline', async () => {
      const fixture = await setup();
      const host = fixture.nativeElement as HTMLElement;

      expect([
        host.querySelectorAll('[data-testid="contact-project-type"]').length,
        host.querySelectorAll('[data-testid="contact-timeline"]').length,
        host.querySelectorAll('select').length,
      ]).toEqual([0, 0, 0]);
    });

    it('sends the typed message as is, without any prefix', async () => {
      const submit = vi.fn().mockReturnValue(of({ success: true, message: 'Envoyé' }));
      const fixture = await setup(stubContactGateway({ submitContactForm: submit }));
      await fill(fixture, makeContactData());

      await fixture.componentInstance.submitContact();
      await fixture.whenStable();

      expect(submit).toHaveBeenCalledExactlyOnceWith(makeContactData());
    });

    describe('bounds accepted by the API', () => {
      it.each([
        [200, []],
        [201, ['maxLength']],
      ])('a %i-character subject carries %j errors', async (length, kinds) => {
        const fixture = await setup();
        await fill(fixture, makeContactData({ subject: 's'.repeat(length) }));

        expect(
          fixture.componentInstance.contactForm
            .subject()
            .errors()
            .map((e) => e.kind),
        ).toEqual(kinds);
      });

      it('does not send a subject over 200 characters and points the visitor to it', async () => {
        const submit = vi.fn().mockReturnValue(of({ success: true, message: '' }));
        const fixture = await setup(stubContactGateway({ submitContactForm: submit }));
        await fill(fixture, makeContactData({ subject: 's'.repeat(201) }));

        await fixture.componentInstance.submitContact();
        await fixture.whenStable();

        expect(submit).not.toHaveBeenCalled();
        expect(document.activeElement?.id).toBe('subject');
        expect(alerts(fixture)).toHaveLength(1);
        expect(fixture.nativeElement.querySelector('#contact-subject-error')).not.toBeNull();
      });

      it.each([
        [5000, []],
        [5001, ['maxLength']],
      ])('a %i-character message carries %j errors', async (length, kinds) => {
        const fixture = await setup();
        await fill(fixture, makeContactData({ message: 'm'.repeat(length) }));

        expect(
          fixture.componentInstance.contactForm
            .message()
            .errors()
            .map((e) => e.kind),
        ).toEqual(kinds);
      });

      it('does not send a message over 5 000 characters and points the visitor to it', async () => {
        const submit = vi.fn().mockReturnValue(of({ success: true, message: '' }));
        const fixture = await setup(stubContactGateway({ submitContactForm: submit }));
        await fill(fixture, makeContactData({ message: 'm'.repeat(5001) }));

        await fixture.componentInstance.submitContact();
        await fixture.whenStable();

        expect(submit).not.toHaveBeenCalled();
        expect(document.activeElement?.id).toBe('message');
        expect(alerts(fixture)).toHaveLength(1);
        expect(fixture.nativeElement.querySelector('#contact-message-error')).not.toBeNull();
      });
    });
  });

  describe('Booking invite', () => {
    it('no longer invites the visitor to book a call, the booking is retired', async () => {
      const fixture = await setup();
      const host = fixture.nativeElement as HTMLElement;

      expect([
        host.querySelectorAll('[data-testid^="contact-booking"]').length,
        host.querySelectorAll('a[href^="/rendez-vous"]').length,
      ]).toEqual([0, 0]);
    });
  });

  describe('Wording', () => {
    const collapsed = (element: Element | null | undefined): string =>
      (element?.textContent ?? '').replace(/[ \t\r\n]+/g, ' ').trim();

    it('Given the form When it renders Then the contact section is named « Écris-moi. »', async () => {
      const host = (await setup()).nativeElement as HTMLElement;
      const headingId = host.querySelector('section')?.getAttribute('aria-labelledby');

      expect(collapsed(host.querySelector(`#${headingId}`))).toBe('Écris-moi.');
    });

    it('Given the form When it renders Then the identity fields are grouped under « Tes coordonnées »', async () => {
      const host = (await setup()).nativeElement as HTMLElement;

      expect(collapsed(host.querySelector('fieldset legend'))).toBe('Tes coordonnées');
    });

    it('Given the form When it renders Then every field carries its own distinct label', async () => {
      const host = (await setup()).nativeElement as HTMLElement;

      expect([...host.querySelectorAll('form label')].map(collapsed)).toEqual([
        'Ton nom (requis)',
        'Email (requis)',
        'Sujet (requis)',
        'Message (requis)',
      ]);
    });

    it('Given the form When it renders Then each field suggests what to type, addressed with tu', async () => {
      const host = (await setup()).nativeElement as HTMLElement;

      expect(
        [...host.querySelectorAll('form input, form textarea')].map((field) =>
          field.getAttribute('placeholder'),
        ),
      ).toEqual([
        'Ton nom',
        'toi@exemple.fr',
        'De quoi veux-tu parler\u202f?',
        'Ta question, ta remarque, ou juste un bonjour…',
      ]);
    });

    it('Given the form When it renders Then the privacy note says the data only serves to answer', async () => {
      const host = (await setup()).nativeElement as HTMLElement;

      expect(collapsed(host.querySelector('[data-testid="contact-privacy-note"]'))).toBe(
        'Ton nom, ton e-mail et ton message servent seulement à te répondre. Politique de confidentialité',
      );
    });
  });

  describe('Intro', () => {
    const intro = (fixture: ComponentFixture<ContactForm>): string =>
      (fixture.nativeElement.querySelector('[data-testid="contact-intro"]')?.textContent ?? '')
        .replace(/[ \t\r\n]+/g, ' ')
        .trim();

    it('keeps the default intro when none is bound', async () => {
      const fixture = await setup();

      expect(intro(fixture)).toBe(
        'Une question sur un projet, sur le code de ce site ou sur mon parcours\u00A0: je lis et je réponds personnellement.',
      );
    });

    it('shows the bound intro instead of the default one', async () => {
      const fixture = await setup(stubContactGateway(), {
        intro: 'Dites-moi ce que vous usinez.',
      });

      expect(intro(fixture)).toBe('Dites-moi ce que vous usinez.');
    });
  });

  describe('Shape', () => {
    it('Given the form When it is rendered Then the message panel is a card: card radius, 2 px foreground edge, surface fill', async () => {
      const fixture = await setup();
      const card = (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="contact-form-card"]',
      );

      expect(
        [...(card?.classList ?? [])]
          .filter((token) => /^(?:rounded|border|bg)(?:-|$)/.test(token))
          .sort(),
      ).toEqual(['bg-surface', 'border-2', 'border-foreground', 'rounded-card']);
    });
  });
});
