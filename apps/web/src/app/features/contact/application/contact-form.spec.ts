import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastStore } from '@core/notifications/toast-store';
import { NEVER, of, throwError } from 'rxjs';
import { ContactForm } from './contact-form';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import type { ContactFormData } from '@features/contact/domain/models/contact-form.model';
import { stubContactGateway } from '@features/contact/testing/stub-contact-gateway';
import { CONTACT_TIMELINES } from '@features/contact/domain/contact-timelines.static-data';

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
  ): Promise<ComponentFixture<ContactForm>> {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), ToastStore, { provide: ContactGateway, useValue: gateway }],
    });
    const fixture = TestBed.createComponent(ContactForm);
    for (const [name, value] of Object.entries(inputs)) {
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
        projectType: '',
        timeline: '',
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
      expect(fixture.componentInstance.contactForm().value()).toEqual({
        ...makeContactData(),
        projectType: '',
        timeline: '',
      });
      expect(fixture.componentInstance.contactForm().submitting()).toBe(false);
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
        projectType: '',
        timeline: '',
      });
      expect(subjectInput(fixture)?.value).toBe(OFFER_SUBJECT);
    });
  });

  describe('Qualification', () => {
    const NBSP = '\u00a0';
    const PROJECT_TYPES = ['Site vitrine', 'Application métier', 'Autre'];
    const PROJECT_TYPE = 'contact-project-type';
    const TIMELINE = 'contact-timeline';

    const selectOf = (
      fixture: ComponentFixture<ContactForm>,
      testId: string,
    ): HTMLSelectElement | null =>
      fixture.nativeElement.querySelector(`select[data-testid="${testId}"]`);

    const optionValues = (select: HTMLSelectElement | null): string[] =>
      [...(select?.options ?? [])].map((option) => option.value);

    const optionLabels = (select: HTMLSelectElement | null): string[] =>
      [...(select?.options ?? [])]
        .filter((option) => option.value !== '')
        .map((option) => option.textContent.trim());

    const labelOf = (
      fixture: ComponentFixture<ContactForm>,
      select: HTMLSelectElement | null,
    ): string => {
      const id = select?.id ?? '';
      const label: HTMLLabelElement | null = id
        ? fixture.nativeElement.querySelector(`label[for="${id}"]`)
        : null;
      return (label?.textContent ?? '').replace(/\s+/g, ' ').trim();
    };

    const choose = async (
      fixture: ComponentFixture<ContactForm>,
      testId: string,
      value: string,
    ): Promise<void> => {
      const select = selectOf(fixture, testId);
      expect(select).toBeInstanceOf(HTMLSelectElement);
      if (!select) return;
      select.value = value;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await fixture.whenStable();
    };

    describe('project type', () => {
      it('is not asked when no project types are bound', async () => {
        const fixture = await setup();

        expect(selectOf(fixture, PROJECT_TYPE)).toBeNull();
      });

      it('offers the bound project types after an empty default option, under its label', async () => {
        const fixture = await setup(stubContactGateway(), { projectTypes: PROJECT_TYPES });
        const select = selectOf(fixture, PROJECT_TYPE);

        expect(optionValues(select)).toEqual(['', ...PROJECT_TYPES]);
        expect(optionLabels(select)).toEqual(PROJECT_TYPES);
        expect(select?.value).toBe('');
        expect(labelOf(fixture, select).startsWith('Type de projet')).toBe(true);
      });

      it('is optional', async () => {
        const fixture = await setup(stubContactGateway(), { projectTypes: PROJECT_TYPES });
        const select = selectOf(fixture, PROJECT_TYPE);

        expect(select).toBeInstanceOf(HTMLSelectElement);
        expect([select?.required, select?.getAttribute('aria-required')]).toEqual([false, null]);
      });

      it('disappears when the bound project types become empty', async () => {
        const fixture = await setup(stubContactGateway(), { projectTypes: PROJECT_TYPES });
        expect(selectOf(fixture, PROJECT_TYPE)).toBeInstanceOf(HTMLSelectElement);

        fixture.componentRef.setInput('projectTypes', []);
        await fixture.whenStable();

        expect(selectOf(fixture, PROJECT_TYPE)).toBeNull();
      });
    });

    describe('timeline', () => {
      it('is always asked, with the timelines after an empty default option, under its label', async () => {
        const fixture = await setup();
        const select = selectOf(fixture, TIMELINE);

        expect(optionValues(select)).toEqual(['', ...CONTACT_TIMELINES]);
        expect(optionLabels(select)).toEqual(CONTACT_TIMELINES);
        expect(select?.value).toBe('');
        expect(labelOf(fixture, select).startsWith('Délai souhaité')).toBe(true);
      });

      it('is optional', async () => {
        const fixture = await setup();
        const select = selectOf(fixture, TIMELINE);

        expect(select).toBeInstanceOf(HTMLSelectElement);
        expect([select?.required, select?.getAttribute('aria-required')]).toEqual([false, null]);
      });
    });

    describe('sending', () => {
      const MESSAGE = 'Bonjour, j’aimerais discuter d’un projet.';

      it.each([
        [
          'a timeline only',
          [],
          '',
          'Dans le mois',
          `Délai souhaité${NBSP}: Dans le mois\n\n${MESSAGE}`,
        ],
        [
          'a project type only',
          PROJECT_TYPES,
          'Autre',
          '',
          `Type de projet${NBSP}: Autre\n\n${MESSAGE}`,
        ],
        [
          'a project type and a timeline',
          PROJECT_TYPES,
          'Site vitrine',
          'Dès que possible',
          `Type de projet${NBSP}: Site vitrine\nDélai souhaité${NBSP}: Dès que possible\n\n${MESSAGE}`,
        ],
      ])(
        'Given %s chosen When the form is sent Then the gateway receives the composed message and the typed subject, nothing else',
        async (_case, projectTypes, projectType, timeline, composed) => {
          const submit = vi.fn().mockReturnValue(of({ success: true, message: 'Envoyé' }));
          const fixture = await setup(stubContactGateway({ submitContactForm: submit }), {
            projectTypes,
          });
          await fill(fixture, makeContactData({ message: MESSAGE }));
          if (projectType) await choose(fixture, PROJECT_TYPE, projectType);
          if (timeline) await choose(fixture, TIMELINE, timeline);

          await fixture.componentInstance.submitContact();
          await fixture.whenStable();

          expect(submit).toHaveBeenCalledExactlyOnceWith(makeContactData({ message: composed }));
        },
      );

      it('clears the chosen qualification after a successful send', async () => {
        const fixture = await setup(stubContactGateway(), { projectTypes: PROJECT_TYPES });
        await fill(fixture, makeContactData());
        await choose(fixture, PROJECT_TYPE, 'Site vitrine');
        await choose(fixture, TIMELINE, 'Dans le mois');

        await fixture.componentInstance.submitContact();
        await fixture.whenStable();

        expect([
          selectOf(fixture, PROJECT_TYPE)?.value,
          selectOf(fixture, TIMELINE)?.value,
        ]).toEqual(['', '']);
      });
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

      const PREFIX = `Délai souhaité${NBSP}: Dès que possible\n\n`;

      it.each([
        ['a typed message of 5 000 characters, no timeline', 5000, '', true],
        ['a typed message of 5 001 characters, no timeline', 5001, '', false],
        [
          'a composed message of exactly 5 000 characters',
          5000 - PREFIX.length,
          'Dès que possible',
          true,
        ],
        [
          'a composed message of 5 001 characters, the typed one being shorter',
          5001 - PREFIX.length,
          'Dès que possible',
          false,
        ],
      ])(
        'Given %s (%i typed characters, timeline %j) When the validity is read Then the message is valid: %s',
        async (_case, length, timeline, valid) => {
          const fixture = await setup();
          await fill(fixture, makeContactData({ message: 'm'.repeat(length) }));
          if (timeline) await choose(fixture, TIMELINE, timeline);

          expect(fixture.componentInstance.contactForm.message().valid()).toBe(valid);
        },
      );

      it('sends a composed message of exactly 5 000 characters', async () => {
        const submit = vi.fn().mockReturnValue(of({ success: true, message: 'Envoyé' }));
        const fixture = await setup(stubContactGateway({ submitContactForm: submit }));
        const typed = 'm'.repeat(5000 - PREFIX.length);
        await fill(fixture, makeContactData({ message: typed }));
        await choose(fixture, TIMELINE, 'Dès que possible');

        await fixture.componentInstance.submitContact();
        await fixture.whenStable();

        expect(submit).toHaveBeenCalledExactlyOnceWith(
          makeContactData({ message: `${PREFIX}${typed}` }),
        );
      });

      it('does not send a composed message over 5 000 characters and points the visitor to the message', async () => {
        const submit = vi.fn().mockReturnValue(of({ success: true, message: '' }));
        const fixture = await setup(stubContactGateway({ submitContactForm: submit }));
        await fill(fixture, makeContactData({ message: 'm'.repeat(5001 - PREFIX.length) }));
        await choose(fixture, TIMELINE, 'Dès que possible');

        await fixture.componentInstance.submitContact();
        await fixture.whenStable();

        expect(submit).not.toHaveBeenCalled();
        expect(document.activeElement?.id).toBe('message');
        expect(alerts(fixture)).toHaveLength(1);
        expect(fixture.nativeElement.querySelector('#contact-message-error')).not.toBeNull();
      });
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
});
