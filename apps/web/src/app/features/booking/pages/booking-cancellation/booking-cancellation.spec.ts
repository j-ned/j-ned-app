import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { pressTestId } from '@shared/testing/press-test-id';
import { settleBounded } from '@shared/testing/settle';
import { NEVER, defer, of, type Observable } from 'rxjs';
import { describe, expect, it, vi, type Mock } from 'vitest';
import {
  BOOKING_CANCEL_FAILURE_MESSAGES,
  BOOKING_CANCEL_NOTICES,
  BOOKING_FORMAT_LABELS,
} from '../../domain/booking-copy.static-data';
import { BookingGateway } from '../../domain/gateways/booking.gateway';
import type {
  BookingCancelFailure,
  BookingCancelPreviewResult,
  BookingCancelResult,
} from '../../domain/models/booking.model';
import { aBookingCancelPreview } from '../../testing/booking-builders';
import { stubBookingGateway } from '../../testing/stub-booking-gateway';
import { BookingCancellation } from './booking-cancellation';

const CANCELLATION_URL = '/rendez-vous/annulation';
const TOKEN = 'k3Jd9_x-Qm2LpZ7vR4tYw8NcB1sHf6Ga0UeOiXyTq5n';

@Component({ template: '' })
class Landing {}

type PreviewCancellation = Mock<BookingGateway['previewCancellation']>;
type CancelBooking = Mock<BookingGateway['cancelBooking']>;

const later = <T>(value: T): Observable<T> => defer(() => of(value));

const previewing = (...results: readonly BookingCancelPreviewResult[]): PreviewCancellation => {
  let call = 0;
  return vi.fn<BookingGateway['previewCancellation']>(() =>
    later(results[Math.min(call++, results.length - 1)]),
  );
};

const cancelling = (...results: readonly BookingCancelResult[]): CancelBooking => {
  let call = 0;
  return vi.fn<BookingGateway['cancelBooking']>(() =>
    later(results[Math.min(call++, results.length - 1)]),
  );
};

const CANCELLABLE: BookingCancelPreviewResult = { success: true, data: aBookingCancelPreview() };
const CANCELLED: BookingCancelResult = { success: true, data: null };

type Rendered = {
  readonly fixture: ComponentFixture<unknown>;
  readonly host: HTMLElement;
  readonly previewCancellation: PreviewCancellation;
  readonly cancelBooking: CancelBooking;
};

async function openCancellation(
  fragment: string | null,
  previewCancellation: PreviewCancellation = previewing(CANCELLABLE),
  cancelBooking: CancelBooking = cancelling(CANCELLED),
): Promise<Rendered> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'rendez-vous/annulation', component: BookingCancellation },
        { path: 'rendez-vous', component: Landing },
        { path: '', component: Landing },
      ]),
      {
        provide: BookingGateway,
        useValue: stubBookingGateway({ previewCancellation, cancelBooking }),
      },
    ],
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(
    fragment === null ? CANCELLATION_URL : `${CANCELLATION_URL}#${fragment}`,
  );
  await settleBounded(harness.fixture);
  return {
    fixture: harness.fixture,
    host: harness.fixture.nativeElement as HTMLElement,
    previewCancellation,
    cancelBooking,
  };
}

async function confirmCancellation(rendered: Rendered): Promise<void> {
  await pressTestId(rendered.fixture, 'booking-cancel-confirm');
}

async function follow(rendered: Rendered, testId: string): Promise<void> {
  byTestId(rendered.host, testId)?.click();
  await settleBounded(rendered.fixture);
}

const present = (host: HTMLElement, ...testIds: readonly string[]): Record<string, boolean> =>
  Object.fromEntries(testIds.map((testId) => [testId, byTestId(host, testId) !== null]));

const STATE_MARKERS = [
  'booking-cancel-invalid',
  'booking-cancel-loading',
  'load-error',
  'booking-cancel-not-found',
  'booking-cancel-preview',
  'booking-cancel-result',
] as const;

const onlyState = (state: (typeof STATE_MARKERS)[number]): Record<string, boolean> =>
  Object.fromEntries(STATE_MARKERS.map((marker) => [marker, marker === state]));

const confirmButton = (host: HTMLElement): HTMLButtonElement | null => {
  const element = byTestId(host, 'booking-cancel-confirm');
  return element instanceof HTMLButtonElement ? element : null;
};

const focusedTestId = (): string | null =>
  document.activeElement?.getAttribute('data-testid') ?? null;

const currentUrl = (): string => TestBed.inject(Router).url;

const stayOnPage = async (): Promise<void> => undefined;

describe('BookingCancellation', () => {
  describe('reading the link', () => {
    it.each<[string, string | null]>([
      ['no fragment', null],
      ['an empty fragment', ''],
      ['a token one character short', TOKEN.slice(0, 42)],
      ['a token one character too long', `${TOKEN}x`],
      ['a token with a dot', `${TOKEN.slice(0, 42)}.`],
      ['a token with base64 padding', `${TOKEN.slice(0, 42)}=`],
    ])(
      'Given a link with %s When the page opens Then it says the link is invalid without asking the API',
      async (_case, fragment) => {
        const rendered = await openCancellation(fragment);

        expect({
          states: present(rendered.host, ...STATE_MARKERS),
          notice: testIdText(rendered.host, 'booking-cancel-invalid'),
          previews: rendered.previewCancellation.mock.calls.length,
          cancels: rendered.cancelBooking.mock.calls.length,
        }).toEqual({
          states: onlyState('booking-cancel-invalid'),
          notice: BOOKING_CANCEL_NOTICES['invalid-link'],
          previews: 0,
          cancels: 0,
        });
      },
    );

    it('Given a well-formed token When the page opens Then the booking is looked up once with that token', async () => {
      const rendered = await openCancellation(TOKEN);

      expect(rendered.previewCancellation.mock.calls).toEqual([[TOKEN]]);
    });
  });

  describe('looking up the booking', () => {
    it('Given the lookup is on its way When the page opens Then a status skeleton stands in for the booking', async () => {
      const previewCancellation = vi.fn<BookingGateway['previewCancellation']>(() => NEVER);
      const { host } = await openCancellation(TOKEN, previewCancellation);

      expect({
        states: present(host, ...STATE_MARKERS),
        role: byTestId(host, 'booking-cancel-loading')?.getAttribute('role') ?? null,
      }).toEqual({ states: onlyState('booking-cancel-loading'), role: 'status' });
    });

    it.each<[string, BookingCancelPreviewResult, string, string]>([
      ['a video call', CANCELLABLE, 'lundi 19 octobre 2026 à 09:00', BOOKING_FORMAT_LABELS.video],
      [
        'a phone call on the first of the month',
        {
          success: true,
          data: aBookingCancelPreview({
            startsAt: '2026-11-01T08:00:00.000Z',
            endsAt: '2026-11-01T08:30:00.000Z',
            format: 'phone',
          }),
        },
        'dimanche 1er novembre 2026 à 09:00',
        BOOKING_FORMAT_LABELS.phone,
      ],
    ])(
      'Given %s that can still be cancelled When the lookup answers Then the page recaps it in Paris time and offers to cancel it',
      async (_case, preview, when, format) => {
        const { host } = await openCancellation(TOKEN, previewing(preview));
        const button = confirmButton(host);

        expect({
          states: present(host, ...STATE_MARKERS),
          when: testIdText(host, 'booking-cancel-when'),
          format: testIdText(host, 'booking-cancel-format'),
          button: button === null ? null : { type: button.type, disabled: button.disabled },
          label: testIdText(host, 'booking-cancel-confirm'),
          unavailable: byTestId(host, 'booking-cancel-unavailable') !== null,
        }).toEqual({
          states: onlyState('booking-cancel-preview'),
          when,
          format,
          button: { type: 'button', disabled: false },
          label: 'Annuler ce rendez-vous',
          unavailable: false,
        });
      },
    );

    it('Given a cancellable booking When the visitor follows the way back Then the home page opens', async () => {
      const rendered = await openCancellation(TOKEN);
      const href = byTestId(rendered.host, 'booking-cancel-home')?.getAttribute('href') ?? null;

      await follow(rendered, 'booking-cancel-home');

      expect({ href, url: currentUrl() }).toEqual({ href: '/', url: '/' });
    });

    it('Given a cancellable booking When the page shows it Then the status region is there and still silent', async () => {
      const { host } = await openCancellation(TOKEN);
      const status = byTestId(host, 'booking-cancel-status');

      expect({
        role: status?.getAttribute('role') ?? null,
        text: testIdText(host, 'booking-cancel-status'),
      }).toEqual({ role: 'status', text: '' });
    });

    it.each<[string, BookingCancelPreviewResult, string]>([
      [
        'already cancelled',
        { success: true, data: aBookingCancelPreview({ status: 'cancelled', cancellable: false }) },
        BOOKING_CANCEL_NOTICES['already-cancelled'],
      ],
      [
        'started or past',
        { success: true, data: aBookingCancelPreview({ cancellable: false }) },
        BOOKING_CANCEL_NOTICES['not-cancellable'],
      ],
    ])(
      'Given a booking %s When the lookup answers Then the page recaps it and says why it cannot be cancelled, without a cancel button',
      async (_case, preview, notice) => {
        const { host } = await openCancellation(TOKEN, previewing(preview));

        expect({
          states: present(host, ...STATE_MARKERS),
          when: testIdText(host, 'booking-cancel-when'),
          notice: testIdText(host, 'booking-cancel-unavailable'),
          button: byTestId(host, 'booking-cancel-confirm') !== null,
        }).toEqual({
          states: onlyState('booking-cancel-preview'),
          when: 'lundi 19 octobre 2026 à 09:00',
          notice,
          button: false,
        });
      },
    );

    it('Given an unknown token When the lookup answers Then the page says the link matches no booking', async () => {
      const { host } = await openCancellation(
        TOKEN,
        previewing({ success: false, reason: 'not-found' }),
      );

      expect({
        states: present(host, ...STATE_MARKERS),
        message: testIdText(host, 'booking-cancel-not-found'),
        button: byTestId(host, 'booking-cancel-confirm') !== null,
      }).toEqual({
        states: onlyState('booking-cancel-not-found'),
        message: BOOKING_CANCEL_FAILURE_MESSAGES['not-found'],
        button: false,
      });
    });

    it.each<BookingCancelFailure>(['network', 'server'])(
      'Given the lookup fails with a %s error When the visitor retries Then the booking is looked up again and shown',
      async (reason) => {
        const previewCancellation = previewing({ success: false, reason }, CANCELLABLE);
        const rendered = await openCancellation(TOKEN, previewCancellation);
        const failed = present(rendered.host, ...STATE_MARKERS);

        await pressTestId(rendered.fixture, 'load-error-retry');

        expect({
          failed,
          calls: previewCancellation.mock.calls,
          after: present(rendered.host, ...STATE_MARKERS),
        }).toEqual({
          failed: onlyState('load-error'),
          calls: [[TOKEN], [TOKEN]],
          after: onlyState('booking-cancel-preview'),
        });
      },
    );
  });

  describe('cancelling the booking', () => {
    it('Given a cancellable booking When the visitor confirms Then the booking is cancelled with the token of the link', async () => {
      const rendered = await openCancellation(TOKEN);

      await confirmCancellation(rendered);

      expect(rendered.cancelBooking.mock.calls).toEqual([[TOKEN]]);
    });

    it('Given a cancellation on its way When the visitor looks at the button Then it is disabled until the API answers', async () => {
      const rendered = await openCancellation(
        TOKEN,
        previewing(CANCELLABLE),
        vi.fn<BookingGateway['cancelBooking']>(() => NEVER),
      );
      const before = confirmButton(rendered.host)?.disabled ?? null;

      await confirmCancellation(rendered);

      expect({ before, during: confirmButton(rendered.host)?.disabled ?? null }).toEqual({
        before: false,
        during: true,
      });
    });

    it('Given a cancellation on its way When the visitor clicks again before the page updates Then a single request is sent', async () => {
      const rendered = await openCancellation(
        TOKEN,
        previewing(CANCELLABLE),
        vi.fn<BookingGateway['cancelBooking']>(() => NEVER),
      );
      const button = confirmButton(rendered.host);

      button?.click();
      button?.click();
      await settleBounded(rendered.fixture);

      expect(rendered.cancelBooking.mock.calls).toEqual([[TOKEN]]);
    });

    it('Given a cancellable booking When the API confirms the cancellation Then the cancelled state replaces the recap and takes the focus', async () => {
      const rendered = await openCancellation(TOKEN);

      await confirmCancellation(rendered);

      expect({
        states: present(rendered.host, ...STATE_MARKERS),
        button: byTestId(rendered.host, 'booking-cancel-confirm') !== null,
        heading: testIdText(rendered.host, 'booking-cancel-result-heading'),
        focused: focusedTestId(),
      }).toEqual({
        states: onlyState('booking-cancel-result'),
        button: false,
        heading: 'Rendez-vous annulé',
        focused: 'booking-cancel-result-heading',
      });
    });

    it('Given the booking is cancelled When the visitor follows the link to book again Then the booking page opens', async () => {
      const rendered = await openCancellation(TOKEN);
      await confirmCancellation(rendered);
      const href =
        byTestId(rendered.host, 'booking-cancel-book-again')?.getAttribute('href') ?? null;

      await follow(rendered, 'booking-cancel-book-again');

      expect({ href, url: currentUrl() }).toEqual({ href: '/rendez-vous', url: '/rendez-vous' });
    });

    it.each<[BookingCancelFailure, boolean]>([
      ['too-late', false],
      ['not-found', false],
      ['network', true],
      ['server', true],
    ])(
      'Given a cancellable booking When the API refuses with %s Then the status region explains it and the button is offered again only if retrying can help',
      async (reason, retryable) => {
        const rendered = await openCancellation(
          TOKEN,
          previewing(CANCELLABLE),
          cancelling({ success: false, reason }),
        );

        await confirmCancellation(rendered);
        const button = confirmButton(rendered.host);

        expect({
          states: present(rendered.host, ...STATE_MARKERS),
          status: testIdText(rendered.host, 'booking-cancel-status'),
          button: button === null ? null : { disabled: button.disabled },
        }).toEqual({
          states: onlyState('booking-cancel-preview'),
          status: BOOKING_CANCEL_FAILURE_MESSAGES[reason],
          button: retryable ? { disabled: false } : null,
        });
      },
    );

    it('Given the cancellation failed on the network When the visitor confirms again Then it is sent again and the booking ends cancelled', async () => {
      const cancelBooking = cancelling({ success: false, reason: 'network' }, CANCELLED);
      const rendered = await openCancellation(TOKEN, previewing(CANCELLABLE), cancelBooking);

      await confirmCancellation(rendered);
      await confirmCancellation(rendered);

      expect({
        calls: cancelBooking.mock.calls,
        states: present(rendered.host, ...STATE_MARKERS),
      }).toEqual({ calls: [[TOKEN], [TOKEN]], states: onlyState('booking-cancel-result') });
    });
  });

  describe('keeping the token private', () => {
    it.each<[string, string, (rendered: Rendered) => Promise<void>, string]>([
      ['the recap', TOKEN, stayOnPage, 'booking-cancel-preview'],
      ['the cancelled state', TOKEN, confirmCancellation, 'booking-cancel-result'],
      ['the invalid link notice', `${TOKEN}x`, stayOnPage, 'booking-cancel-invalid'],
    ])(
      'Given %s When it is on screen Then the token appears nowhere in the document',
      async (_case, fragment, reach, marker) => {
        const rendered = await openCancellation(fragment);
        await reach(rendered);

        expect({
          shown: byTestId(rendered.host, marker) !== null,
          leaked: document.documentElement.outerHTML.includes(fragment),
        }).toEqual({ shown: true, leaked: false });
      },
    );
  });

  describe('page structure', () => {
    it.each<[string, string | null, (rendered: Rendered) => Promise<void>]>([
      ['the invalid link notice', null, stayOnPage],
      ['the recap', TOKEN, stayOnPage],
      ['the cancelled state', TOKEN, confirmCancellation],
    ])(
      'Given %s inside the shell When rendered Then the page has a single h1 and leaves the landmarks to the shell',
      async (_case, fragment, reach) => {
        const rendered = await openCancellation(fragment);
        await reach(rendered);

        expect({
          h1: rendered.host.querySelectorAll('h1').length,
          landmarks: rendered.host.querySelectorAll('header, main, footer').length,
        }).toEqual({ h1: 1, landmarks: 0 });
      },
    );
  });
});
