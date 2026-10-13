import { PLATFORM_ID, type Provider } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SectionScroller } from '@core/navigation/section-scroller';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { pressTestId } from '@shared/testing/press-test-id';
import { settle, settleBounded } from '@shared/testing/settle';
import { NEVER, defer, of, throwError, type Observable } from 'rxjs';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { stubAnalyticsGateway } from '@features/analytics/testing/stub-analytics-gateway';
import {
  BOOKING_FAILURE_MESSAGES,
  BOOKING_FICHE,
  BOOKING_FORMAT_LABELS,
} from '../../domain/booking-copy.static-data';
import { BookingGateway } from '../../domain/gateways/booking.gateway';
import type {
  BookingFailureReason,
  BookingRequest,
  BookingSlot,
  BookingSubmission,
} from '../../domain/models/booking.model';
import {
  aBookingConfirmation,
  aBookingRequest,
  aBookingSlot,
} from '../../testing/booking-builders';
import { radioLabel, radiosOf } from '../../testing/radio-label';
import { stubBookingGateway } from '../../testing/stub-booking-gateway';
import { Booking } from './booking';

const MONDAY_19_AT_9 = aBookingSlot({
  startsAt: '2026-10-19T07:00:00.000Z',
  endsAt: '2026-10-19T07:30:00.000Z',
});
const MONDAY_19_AT_930 = aBookingSlot({
  startsAt: '2026-10-19T07:30:00.000Z',
  endsAt: '2026-10-19T08:00:00.000Z',
});
const TUESDAY_20_AT_10 = aBookingSlot({
  startsAt: '2026-10-20T08:00:00.000Z',
  endsAt: '2026-10-20T08:30:00.000Z',
});
const MONDAY_26_AT_9 = aBookingSlot({
  startsAt: '2026-10-26T08:00:00.000Z',
  endsAt: '2026-10-26T08:30:00.000Z',
});
const TWO_WEEKS: readonly BookingSlot[] = [
  MONDAY_19_AT_9,
  MONDAY_19_AT_930,
  TUESDAY_20_AT_10,
  MONDAY_26_AT_9,
];

type GetSlots = Mock<BookingGateway['getSlots']>;

const later = <T>(value: T): Observable<T> => defer(() => of(value));

const serving = (...responses: readonly Observable<readonly BookingSlot[]>[]): GetSlots => {
  let call = 0;
  return vi.fn<BookingGateway['getSlots']>(() => responses[Math.min(call++, responses.length - 1)]);
};

type Rendered = {
  readonly fixture: ComponentFixture<Booking>;
  readonly host: HTMLElement;
};

async function renderPage(
  getSlots: GetSlots,
  extraProviders: Provider[] = [],
  gatewayOverrides: Partial<BookingGateway> = {},
): Promise<Rendered> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: BookingGateway, useValue: stubBookingGateway({ getSlots, ...gatewayOverrides }) },
      { provide: AnalyticsGateway, useValue: stubAnalyticsGateway() },
      ...extraProviders,
    ],
  });
  const fixture = TestBed.createComponent(Booking);
  await settleBounded(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

const present = (host: HTMLElement, ...testIds: readonly string[]): Record<string, boolean> =>
  Object.fromEntries(testIds.map((testId) => [testId, byTestId(host, testId) !== null]));

const STATE_MARKERS = [
  'booking-slots-loading',
  'load-error',
  'booking-empty',
  'booking-day-picker',
] as const;

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

async function pickRadio(
  fixture: ComponentFixture<Booking>,
  testId: string,
  index: number,
): Promise<void> {
  radiosOf(fixture.nativeElement as HTMLElement, testId)[index]?.click();
  await settle(fixture);
}

type CreateBooking = Mock<BookingGateway['createBooking']>;

const answering = (...results: readonly BookingSubmission[]): CreateBooking => {
  let call = 0;
  return vi.fn<BookingGateway['createBooking']>(() =>
    later(results[Math.min(call++, results.length - 1)]),
  );
};

const CONFIRMED: BookingSubmission = { success: true, data: aBookingConfirmation() };

async function renderBookable(
  createBooking: CreateBooking = answering(CONFIRMED),
  getSlots: GetSlots = serving(later(TWO_WEEKS)),
): Promise<Rendered> {
  return renderPage(getSlots, [], { createBooking });
}

const control = (host: HTMLElement, testId: string): HTMLInputElement | null => {
  const element = byTestId(host, testId);
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
    ? (element as HTMLInputElement)
    : null;
};

async function typeIn(rendered: Rendered, testId: string, text: string): Promise<void> {
  const field = control(rendered.host, testId);
  expect(field, testId).not.toBeNull();
  if (field === null) return;
  field.value = text;
  field.dispatchEvent(new Event('input'));
  field.dispatchEvent(new Event('change'));
  await settle(rendered.fixture);
}

async function fillDetailsInPage(rendered: Rendered, request: BookingRequest): Promise<void> {
  await typeIn(rendered, 'booking-name', request.name);
  await typeIn(rendered, 'booking-email', request.email);
  if (request.format === 'phone') {
    control(rendered.host, 'booking-format-phone')?.click();
    await settle(rendered.fixture);
  }
  if (request.phone !== null) await typeIn(rendered, 'booking-phone', request.phone);
  if (request.company !== null) await typeIn(rendered, 'booking-company', request.company);
  await typeIn(rendered, 'booking-message', request.message);
}

async function chooseMonday9(rendered: Rendered): Promise<void> {
  await pickRadio(rendered.fixture, 'booking-day-option', 0);
  await pickRadio(rendered.fixture, 'booking-time-option', 0);
}

async function submitBooking(rendered: Rendered): Promise<void> {
  byTestId(rendered.host, 'booking-form')?.dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  );
  await settleBounded(rendered.fixture);
  await settle(rendered.fixture);
}

async function bookMonday9(rendered: Rendered, request: BookingRequest): Promise<void> {
  await chooseMonday9(rendered);
  await fillDetailsInPage(rendered, request);
  await submitBooking(rendered);
}

const focusedTestId = (): string | null =>
  document.activeElement?.getAttribute('data-testid') ?? null;

const isLabelled = (host: HTMLElement, element: HTMLElement | null): boolean => {
  if (element === null || element.id === '') return false;
  const labels = [...host.querySelectorAll('label')].filter(
    (label) => label.getAttribute('for') === element.id,
  );
  return labels.length === 1 && normalized(labels[0]) !== '';
};

const alertTexts = (host: HTMLElement): readonly string[] =>
  [...host.querySelectorAll('[role="alert"]')].map(normalized);

describe('Booking', () => {
  describe('prerender and loading', () => {
    it('Given the page is prerendered on the server When rendered Then the fiche and the slot skeleton are there and no slot is requested', async () => {
      const getSlots = serving(later(TWO_WEEKS));

      const { host } = await renderPage(getSlots, [{ provide: PLATFORM_ID, useValue: 'server' }]);

      expect({
        calls: getSlots.mock.calls.length,
        fiche: byTestId(host, 'booking-fiche') !== null,
        ...present(host, ...STATE_MARKERS),
      }).toEqual({
        calls: 0,
        fiche: true,
        'booking-slots-loading': true,
        'load-error': false,
        'booking-empty': false,
        'booking-day-picker': false,
      });
    });

    it('Given the browser is waiting for the slots When rendered Then it shows the very skeleton the server prerendered', async () => {
      const server = await renderPage(serving(later(TWO_WEEKS)), [
        { provide: PLATFORM_ID, useValue: 'server' },
      ]);
      const prerendered = byTestId(server.host, 'booking-slots-loading')?.outerHTML;
      TestBed.resetTestingModule();

      const browser = await renderPage(serving(NEVER));

      expect({
        prerendered: prerendered !== undefined,
        same: byTestId(browser.host, 'booking-slots-loading')?.outerHTML === prerendered,
      }).toEqual({ prerendered: true, same: true });
    });
  });

  describe('fiche', () => {
    it('Given the page When rendered Then the cartouche titles the call and lists its fiche rows', async () => {
      const { host } = await renderPage(serving(NEVER));
      const fiche = byTestId(host, 'booking-fiche');
      const rows = [...(fiche?.querySelectorAll('[data-testid="cartouche-row"]') ?? [])].map(
        (row) => ({
          label: testIdText(row, 'cartouche-label'),
          value: testIdText(row, 'cartouche-value'),
        }),
      );

      expect({
        title: fiche === null ? null : testIdText(fiche, 'cartouche-title'),
        rows,
      }).toEqual({ title: BOOKING_FICHE.title, rows: BOOKING_FICHE.rows });
    });
  });

  describe('load states', () => {
    it('Given the slots failed to load When the visitor retries Then the slots are requested again and the days appear', async () => {
      const getSlots = serving(
        throwError(() => new Error('down')),
        later(TWO_WEEKS),
      );
      const { fixture, host } = await renderPage(getSlots);
      const failed = present(host, ...STATE_MARKERS);

      await pressTestId(fixture, 'load-error-retry');

      expect({
        failed,
        calls: getSlots.mock.calls.length,
        after: present(host, ...STATE_MARKERS),
      }).toEqual({
        failed: {
          'booking-slots-loading': false,
          'load-error': true,
          'booking-empty': false,
          'booking-day-picker': false,
        },
        calls: 2,
        after: {
          'booking-slots-loading': false,
          'load-error': false,
          'booking-empty': false,
          'booking-day-picker': true,
        },
      });
    });

    it('Given no free slot When loaded Then the empty state shows instead of the pickers', async () => {
      const { host } = await renderPage(serving(later([])));

      expect(present(host, ...STATE_MARKERS, 'booking-time-picker')).toEqual({
        'booking-slots-loading': false,
        'load-error': false,
        'booking-empty': true,
        'booking-day-picker': false,
        'booking-time-picker': false,
      });
    });

    it('Given no free slot When the visitor follows the empty state contact action Then the page scrolls to the contact form', async () => {
      const { fixture } = await renderPage(serving(later([])));
      const scrollTo = vi.spyOn(TestBed.inject(SectionScroller), 'scrollTo').mockReturnValue();

      await pressTestId(fixture, 'booking-empty-contact');

      expect(scrollTo.mock.calls).toEqual([['contact']]);
    });
  });

  describe('choosing a day and a time', () => {
    it('Given free slots When loaded Then the first week days are offered and no time yet', async () => {
      const { host } = await renderPage(serving(later(TWO_WEEKS)));

      expect({
        week: testIdText(host, 'booking-week-label'),
        days: radiosOf(host, 'booking-day-option').map(radioLabel),
        timePicker: byTestId(host, 'booking-time-picker') !== null,
      }).toEqual({
        week: 'Semaine du 19 octobre',
        days: ['lundi 19 octobre', 'mardi 20 octobre'],
        timePicker: false,
      });
    });

    it('Given a day is chosen When the times show Then each time of that day is a native radio named by its Paris wall time', async () => {
      const { fixture, host } = await renderPage(serving(later(TWO_WEEKS)));

      await pickRadio(fixture, 'booking-day-option', 0);
      const times = radiosOf(host, 'booking-time-option');

      expect({
        times: times.map((radio) => ({
          name: radioLabel(radio),
          value: radio.value,
          checked: radio.checked,
        })),
        sharedName: new Set(times.map((radio) => radio.name)).size === 1,
        legend: normalized(times[0]?.closest('fieldset')?.querySelector('legend')),
      }).toEqual({
        times: [
          { name: '09:00', value: MONDAY_19_AT_9.startsAt, checked: false },
          { name: '09:30', value: MONDAY_19_AT_930.startsAt, checked: false },
        ],
        sharedName: true,
        legend: 'lundi 19 octobre',
      });
    });

    it('Given a day is chosen When the visitor picks a time Then that time alone is checked', async () => {
      const { fixture, host } = await renderPage(serving(later(TWO_WEEKS)));
      await pickRadio(fixture, 'booking-day-option', 0);

      await pickRadio(fixture, 'booking-time-option', 1);

      expect(radiosOf(host, 'booking-time-option').map((radio) => radio.checked)).toEqual([
        false,
        true,
      ]);
    });

    it('Given a time is picked When the visitor changes day then comes back Then no time is checked any more', async () => {
      const { fixture, host } = await renderPage(serving(later(TWO_WEEKS)));
      await pickRadio(fixture, 'booking-day-option', 0);
      await pickRadio(fixture, 'booking-time-option', 1);

      await pickRadio(fixture, 'booking-day-option', 1);
      const otherDay = radiosOf(host, 'booking-time-option').map((radio) => radio.value);
      await pickRadio(fixture, 'booking-day-option', 0);

      expect({
        otherDay,
        checked: radiosOf(host, 'booking-time-option').filter((radio) => radio.checked).length,
      }).toEqual({ otherDay: [TUESDAY_20_AT_10.startsAt], checked: 0 });
    });

    it('Given two weeks When the visitor moves to the next week Then its days are offered and only going back stays possible', async () => {
      const { fixture, host } = await renderPage(serving(later(TWO_WEEKS)));
      const before = byTestId(host, 'booking-week-previous')?.getAttribute('aria-disabled');

      await pressTestId(fixture, 'booking-week-next');

      expect({
        before,
        week: testIdText(host, 'booking-week-label'),
        days: radiosOf(host, 'booking-day-option').map(radioLabel),
        previous: byTestId(host, 'booking-week-previous')?.getAttribute('aria-disabled'),
        next: byTestId(host, 'booking-week-next')?.getAttribute('aria-disabled'),
      }).toEqual({
        before: 'true',
        week: 'Semaine du 26 octobre',
        days: ['lundi 26 octobre'],
        previous: null,
        next: 'true',
      });
    });
  });

  describe('page structure', () => {
    it('Given the page inside the shell When rendered Then it has a single h1 and leaves the landmarks to the shell', async () => {
      const { host } = await renderPage(serving(later(TWO_WEEKS)));

      expect({
        h1: host.querySelectorAll('h1').length,
        landmarks: host.querySelectorAll('header, main, footer').length,
      }).toEqual({ h1: 1, landmarks: 0 });
    });
  });

  describe('booking details', () => {
    it('Given free slots When loaded Then each detail field is a labelled control with its autofill purpose', async () => {
      const { host } = await renderBookable();
      const describeField = (testId: string): Record<string, unknown> => {
        const field = byTestId(host, testId);
        return {
          tag: field?.tagName ?? null,
          type: field?.getAttribute('type') ?? null,
          autocomplete: field?.getAttribute('autocomplete') ?? null,
          labelled: isLabelled(host, field),
        };
      };

      expect(
        [
          'booking-name',
          'booking-email',
          'booking-phone',
          'booking-company',
          'booking-message',
        ].map(describeField),
      ).toEqual([
        { tag: 'INPUT', type: 'text', autocomplete: 'name', labelled: true },
        { tag: 'INPUT', type: 'email', autocomplete: 'email', labelled: true },
        { tag: 'INPUT', type: 'tel', autocomplete: 'tel', labelled: true },
        { tag: 'INPUT', type: 'text', autocomplete: 'organization', labelled: true },
        { tag: 'TEXTAREA', type: null, autocomplete: null, labelled: true },
      ]);
    });

    it('Given free slots When loaded Then the call format is a group of two native radios, video checked', async () => {
      const { host } = await renderBookable();
      const formats = ['booking-format-video', 'booking-format-phone'].map((testId) =>
        control(host, testId),
      );

      expect({
        names: formats.map((radio) => (radio === null ? null : radioLabel(radio))),
        types: formats.map((radio) => radio?.type ?? null),
        checked: formats.map((radio) => radio?.checked ?? null),
        sharedName:
          formats[0] !== null && formats[0].name !== '' && formats[0].name === formats[1]?.name,
        sameFieldset:
          formats[0]?.closest('fieldset') != null &&
          formats[0]?.closest('fieldset') === formats[1]?.closest('fieldset'),
      }).toEqual({
        names: [BOOKING_FORMAT_LABELS.video, BOOKING_FORMAT_LABELS.phone],
        types: ['radio', 'radio'],
        checked: [true, false],
        sharedName: true,
        sameFieldset: true,
      });
    });

    it('Given the video format When the visitor picks a phone call Then only the phone becomes required, next to the always required name, email and message', async () => {
      const rendered = await renderBookable();
      const required = (): Record<string, boolean> =>
        Object.fromEntries(
          [
            'booking-name',
            'booking-email',
            'booking-phone',
            'booking-company',
            'booking-message',
          ].map((testId) => [
            testId,
            byTestId(rendered.host, testId)?.getAttribute('aria-required') === 'true',
          ]),
        );
      const byVideo = required();

      control(rendered.host, 'booking-format-phone')?.click();
      await settle(rendered.fixture);

      expect({ byVideo, byPhone: required() }).toEqual({
        byVideo: {
          'booking-name': true,
          'booking-email': true,
          'booking-phone': false,
          'booking-company': false,
          'booking-message': true,
        },
        byPhone: {
          'booking-name': true,
          'booking-email': true,
          'booking-phone': true,
          'booking-company': false,
          'booking-message': true,
        },
      });
    });

    it('Given free slots When loaded Then the trap field is out of the tab order, hidden from assistive tech and never autofilled', async () => {
      const { host } = await renderBookable();
      const trap = control(host, 'booking-website');

      expect({
        tabIndex: trap?.tabIndex ?? null,
        autocomplete: trap?.getAttribute('autocomplete') ?? null,
        hidden: trap?.closest('[aria-hidden="true"]') != null,
      }).toEqual({ tabIndex: -1, autocomplete: 'off', hidden: true });
    });

    it('Given free slots When loaded Then the privacy notice links to the privacy policy', async () => {
      const { host } = await renderBookable();
      const links = [...(byTestId(host, 'booking-privacy-notice')?.querySelectorAll('a') ?? [])];

      expect(links.map((link) => link.getAttribute('href'))).toEqual(['/confidentialite']);
    });

    it('Given free slots When loaded Then an empty status region waits for the outcome of the send', async () => {
      const { host } = await renderBookable();
      const status = byTestId(host, 'booking-status');

      expect({ role: status?.getAttribute('role') ?? null, text: normalized(status) }).toEqual({
        role: 'status',
        text: '',
      });
    });
  });

  describe('booking summary', () => {
    it('Given a day and a phone call When the visitor picks a time Then the summary reads the Paris day, time and format', async () => {
      const rendered = await renderBookable();
      await pickRadio(rendered.fixture, 'booking-day-option', 0);
      control(rendered.host, 'booking-format-phone')?.click();
      await settle(rendered.fixture);
      const before = byTestId(rendered.host, 'booking-summary') !== null;

      await pickRadio(rendered.fixture, 'booking-time-option', 0);

      expect({
        before,
        when: testIdText(rendered.host, 'booking-summary-when'),
        format: testIdText(rendered.host, 'booking-summary-format'),
      }).toEqual({
        before: false,
        when: 'lundi 19 octobre 2026 à 09:00',
        format: BOOKING_FORMAT_LABELS.phone,
      });
    });
  });

  describe('submitting an incomplete booking', () => {
    it('Given no day is chosen When the visitor submits Then the missing time is reported once and nothing is sent', async () => {
      const createBooking = answering(CONFIRMED);
      const rendered = await renderBookable(createBooking);
      await fillDetailsInPage(rendered, aBookingRequest());

      await submitBooking(rendered);

      expect({
        errors: [...rendered.host.querySelectorAll('[data-testid="booking-start-error"]')].map(
          normalized,
        ),
        calls: createBooking.mock.calls.length,
      }).toEqual({ errors: ['Choisissez un horaire'], calls: 0 });
    });

    it('Given a day without a time When the visitor submits Then the missing time is reported and the focus lands on a time of that day', async () => {
      const createBooking = answering(CONFIRMED);
      const rendered = await renderBookable(createBooking);
      await pickRadio(rendered.fixture, 'booking-day-option', 0);
      await fillDetailsInPage(rendered, aBookingRequest());

      await submitBooking(rendered);

      expect({
        errors: [...rendered.host.querySelectorAll('[data-testid="booking-start-error"]')].map(
          normalized,
        ),
        focused: focusedTestId(),
        calls: createBooking.mock.calls.length,
      }).toEqual({
        errors: ['Choisissez un horaire'],
        focused: 'booking-time-option',
        calls: 0,
      });
    });

    it('Given the missing time is reported When the visitor picks a time Then the report goes away', async () => {
      const rendered = await renderBookable();
      await pickRadio(rendered.fixture, 'booking-day-option', 0);
      await submitBooking(rendered);
      const reported = byTestId(rendered.host, 'booking-start-error') !== null;

      await pickRadio(rendered.fixture, 'booking-time-option', 0);

      expect({ reported, after: byTestId(rendered.host, 'booking-start-error') !== null }).toEqual({
        reported: true,
        after: false,
      });
    });

    it('Given a time and no details When the visitor submits Then each required detail shows its error, the focus lands on the name and nothing is sent', async () => {
      const createBooking = answering(CONFIRMED);
      const rendered = await renderBookable(createBooking);
      await chooseMonday9(rendered);

      await submitBooking(rendered);

      expect({
        alerts: alertTexts(rendered.host),
        errors: [
          'booking-name',
          'booking-email',
          'booking-phone',
          'booking-company',
          'booking-message',
        ].map((testId) => testIdText(rendered.host, `${testId}-error`)),
        focused: focusedTestId(),
        calls: createBooking.mock.calls.length,
      }).toEqual({
        alerts: [
          'Indiquez votre nom',
          'Indiquez votre email',
          'Décrivez votre besoin en quelques mots',
        ],
        errors: [
          'Indiquez votre nom',
          'Indiquez votre email',
          '',
          '',
          'Décrivez votre besoin en quelques mots',
        ],
        focused: 'booking-name',
        calls: 0,
      });
    });

    it('Given the email error is shown When the visitor corrects the email Then the field is no longer marked invalid nor described by the error', async () => {
      const rendered = await renderBookable();
      await chooseMonday9(rendered);
      await submitBooking(rendered);
      const email = (): HTMLElement | null => byTestId(rendered.host, 'booking-email');
      const errorId = byTestId(rendered.host, 'booking-email-error')?.id ?? '';
      const reported = {
        invalid: email()?.getAttribute('aria-invalid') ?? null,
        describedByError: errorId !== '' && email()?.getAttribute('aria-describedby') === errorId,
        role: byTestId(rendered.host, 'booking-email-error')?.getAttribute('role') ?? null,
      };

      await typeIn(rendered, 'booking-email', 'camille@example.com');

      expect({
        reported,
        corrected: {
          invalid: email()?.getAttribute('aria-invalid') ?? null,
          describedBy: email()?.getAttribute('aria-describedby') ?? null,
        },
      }).toEqual({
        reported: { invalid: 'true', describedByError: true, role: 'alert' },
        corrected: { invalid: 'false', describedBy: null },
      });
    });

    it('Given a phone call without a number When the visitor submits Then the phone error asks for a number and nothing is sent', async () => {
      const createBooking = answering(CONFIRMED);
      const rendered = await renderBookable(createBooking);

      await bookMonday9(rendered, aBookingRequest({ format: 'phone', phone: null }));

      expect({
        error: testIdText(rendered.host, 'booking-phone-error'),
        focused: focusedTestId(),
        calls: createBooking.mock.calls.length,
      }).toEqual({
        error: 'Indiquez le numéro auquel vous joindre',
        focused: 'booking-phone',
        calls: 0,
      });
    });

    it('Given an invalid booking When the visitor submits Then the send button stays enabled', async () => {
      const rendered = await renderBookable();

      await submitBooking(rendered);

      const submit = byTestId(rendered.host, 'booking-submit');
      expect({
        tag: submit?.tagName ?? null,
        disabled: (submit as HTMLButtonElement | null)?.disabled ?? null,
      }).toEqual({
        tag: 'BUTTON',
        disabled: false,
      });
    });
  });

  describe('sending the booking', () => {
    it('Given a time and the entered details When the visitor submits Then the booking request mirrors what was entered', async () => {
      const createBooking = answering(CONFIRMED);
      const rendered = await renderBookable(createBooking);
      const request = aBookingRequest({
        format: 'phone',
        phone: '06 12 34 56 78',
        company: 'Atelier Martin',
      });

      await bookMonday9(rendered, request);

      expect(createBooking.mock.calls).toEqual([[request]]);
    });

    it('Given a booking is on its way When the visitor looks at the send button Then it is disabled until the API answers', async () => {
      const rendered = await renderBookable(vi.fn<BookingGateway['createBooking']>(() => NEVER));

      await bookMonday9(rendered, aBookingRequest());

      expect(
        (byTestId(rendered.host, 'booking-submit') as HTMLButtonElement | null)?.disabled,
      ).toBe(true);
    });

    it('Given a video booking When the API confirms it Then the confirmation replaces the form, takes the focus and gives the time, format, invitation address and video link', async () => {
      const rendered = await renderBookable(answering(CONFIRMED));

      await bookMonday9(rendered, aBookingRequest());

      expect({
        confirmation: byTestId(rendered.host, 'booking-confirmation') !== null,
        form: byTestId(rendered.host, 'booking-form') !== null,
        focused: focusedTestId(),
        when: testIdText(rendered.host, 'booking-confirmation-when'),
        format: testIdText(rendered.host, 'booking-confirmation-format'),
        email: testIdText(rendered.host, 'booking-confirmation-email'),
        video: byTestId(rendered.host, 'booking-confirmation-video')?.getAttribute('href') ?? null,
      }).toEqual({
        confirmation: true,
        form: false,
        focused: 'booking-confirmation-heading',
        when: 'lundi 19 octobre 2026 à 09:00',
        format: BOOKING_FORMAT_LABELS.video,
        email: 'camille@example.com',
        video: 'https://meet.jit.si/nedellec-a1b2c3d4e5f6g7h8',
      });
    });

    it('Given a phone booking When the API confirms it Then the confirmation names the phone format and offers no video link', async () => {
      const rendered = await renderBookable(
        answering({
          success: true,
          data: aBookingConfirmation({ format: 'phone', videoUrl: null }),
        }),
      );

      await bookMonday9(rendered, aBookingRequest({ format: 'phone', phone: '06 12 34 56 78' }));

      expect({
        format: testIdText(rendered.host, 'booking-confirmation-format'),
        video: byTestId(rendered.host, 'booking-confirmation-video') !== null,
      }).toEqual({ format: BOOKING_FORMAT_LABELS.phone, video: false });
    });

    it.each<BookingFailureReason>([
      'slot-taken',
      'slot-unavailable',
      'limit-reached',
      'rate-limited',
      'invalid',
      'network',
      'server',
    ])(
      'Given a valid booking When the API answers %s Then the status region tells the visitor what to do',
      async (reason) => {
        const rendered = await renderBookable(answering({ success: false, reason }));

        await bookMonday9(rendered, aBookingRequest());

        expect({
          status: testIdText(rendered.host, 'booking-status'),
          confirmation: byTestId(rendered.host, 'booking-confirmation') !== null,
        }).toEqual({ status: BOOKING_FAILURE_MESSAGES[reason], confirmation: false });
      },
    );

    it('Given the chosen slot was just taken When the API refuses it Then the slots are reloaded, no time is checked, the details are kept and the focus returns to the time step', async () => {
      const getSlots = serving(later(TWO_WEEKS), later(TWO_WEEKS));
      const rendered = await renderBookable(
        answering({ success: false, reason: 'slot-taken' }),
        getSlots,
      );

      await bookMonday9(rendered, aBookingRequest());

      expect({
        slotRequests: getSlots.mock.calls.length,
        checked: radiosOf(rendered.host, 'booking-time-option').filter((radio) => radio.checked)
          .length,
        times: radiosOf(rendered.host, 'booking-time-option').length,
        name: control(rendered.host, 'booking-name')?.value ?? null,
        message: control(rendered.host, 'booking-message')?.value ?? null,
        focused: focusedTestId(),
      }).toEqual({
        slotRequests: 2,
        checked: 0,
        times: 2,
        name: 'Camille Martin',
        message: 'Refonte d’une application Angular.',
        focused: 'booking-time-heading',
      });
    });

    it('Given the network failed When the visitor sends again Then the booking is confirmed', async () => {
      const createBooking = answering({ success: false, reason: 'network' }, CONFIRMED);
      const rendered = await renderBookable(createBooking);
      await bookMonday9(rendered, aBookingRequest());
      const failed = testIdText(rendered.host, 'booking-status');

      await submitBooking(rendered);

      expect({
        failed,
        calls: createBooking.mock.calls.length,
        confirmation: byTestId(rendered.host, 'booking-confirmation') !== null,
      }).toEqual({ failed: BOOKING_FAILURE_MESSAGES.network, calls: 2, confirmation: true });
    });
  });
});
