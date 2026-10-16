import type {
  AdminBooking,
  BookingScope,
} from '@features/booking/domain/models/booking-admin.model';
import { anAdminBooking } from '@features/booking/testing/booking-builders';
import {
  ADMIN_BOOKINGS_FILTERS,
  ADMIN_BOOKINGS_ORDERS,
  bookingsOverline,
  defaultBookingOrder,
  sortBookingRows,
  toAdminBookingRows,
  type AdminBookingRowView,
} from './admin-bookings-view';

const NOW = new Date('2026-10-15T10:00:00.000Z');

const rowOf = (
  booking: AdminBooking,
  scope: BookingScope = 'upcoming',
): AdminBookingRowView | undefined => toAdminBookingRows([booking], scope, NOW)[0];

describe('ADMIN_BOOKINGS_FILTERS', () => {
  it('Given the bookings page When its filters are read Then « À venir », « Passés » and « Archivés » follow each other, without counts', () => {
    expect(ADMIN_BOOKINGS_FILTERS).toEqual([
      { value: 'upcoming', label: 'À venir' },
      { value: 'past', label: 'Passés' },
      { value: 'archived', label: 'Archivés' },
    ]);
  });
});

describe('ADMIN_BOOKINGS_ORDERS', () => {
  it('Given the bookings page When its orders are read Then « Date croissante » comes before « Date décroissante », without counts', () => {
    expect(ADMIN_BOOKINGS_ORDERS).toEqual([
      { value: 'asc', label: 'Date croissante' },
      { value: 'desc', label: 'Date décroissante' },
    ]);
  });
});

describe('defaultBookingOrder', () => {
  it.each([
    { scope: 'upcoming' as const, order: 'asc' },
    { scope: 'past' as const, order: 'desc' },
    { scope: 'archived' as const, order: 'desc' },
  ])(
    'Given the $scope list When its default order is read Then it is $order',
    ({ scope, order }) => {
      expect(defaultBookingOrder(scope)).toBe(order);
    },
  );
});

describe('sortBookingRows', () => {
  const rowsAt = (
    bookings: readonly { readonly id: string; readonly startsAt: string }[],
  ): readonly AdminBookingRowView[] =>
    toAdminBookingRows(
      bookings.map((booking) => anAdminBooking(booking)),
      'past',
      NOW,
    );

  const ids = (rows: readonly AdminBookingRowView[]): readonly string[] =>
    rows.map((row) => row.id);

  const ACROSS_THE_YEAR = [
    { id: 'new-year', startsAt: '2027-01-01T07:00:00.000Z' },
    { id: 'october', startsAt: '2026-10-19T07:00:00.000Z' },
    { id: 'new-year-eve', startsAt: '2026-12-31T23:30:00.000Z' },
  ];

  it.each([
    { order: 'asc' as const, sorted: ['october', 'new-year-eve', 'new-year'] },
    { order: 'desc' as const, sorted: ['new-year', 'new-year-eve', 'october'] },
  ])(
    'Given rows in no particular order When they are sorted $order Then they follow their start instant: $sorted',
    ({ order, sorted }) => {
      expect(ids(sortBookingRows(rowsAt(ACROSS_THE_YEAR), order))).toEqual(sorted);
    },
  );

  it.each([
    { order: 'asc' as const, sorted: ['earlier', 'twin-first', 'twin-second'] },
    { order: 'desc' as const, sorted: ['twin-first', 'twin-second', 'earlier'] },
  ])(
    'Given two rows starting at the same instant When they are sorted $order Then they keep the order they came in',
    ({ order, sorted }) => {
      const rows = rowsAt([
        { id: 'twin-first', startsAt: '2026-10-20T08:00:00.000Z' },
        { id: 'earlier', startsAt: '2026-10-19T08:00:00.000Z' },
        { id: 'twin-second', startsAt: '2026-10-20T08:00:00.000Z' },
      ]);

      expect(ids(sortBookingRows(rows, order))).toEqual(sorted);
    },
  );

  it('Given rows When they are sorted Then the rows given are left in their order', () => {
    const rows = rowsAt(ACROSS_THE_YEAR);

    const sorted = sortBookingRows(rows, 'asc');

    expect({ given: ids(rows), sorted: ids(sorted) }).toEqual({
      given: ['new-year', 'october', 'new-year-eve'],
      sorted: ['october', 'new-year-eve', 'new-year'],
    });
  });

  it('Given no row When they are sorted Then the list stays empty', () => {
    expect(sortBookingRows([], 'desc')).toEqual([]);
  });
});

describe('toAdminBookingRows', () => {
  it('Given a confirmed video call ahead When its row is built Then every field reads for the owner', () => {
    expect(
      rowOf(
        anAdminBooking({
          id: 'b-1',
          startsAt: '2026-10-19T07:00:00.000Z',
          name: 'Camille Martin',
          email: 'camille@example.com',
          company: 'Atelier Martin',
          message: 'Refonte d’une application Angular.',
          format: 'video',
          videoUrl: 'https://meet.jit.si/nedellec-a1b2c3d4e5f6g7h8',
        }),
      ),
    ).toEqual({
      id: 'b-1',
      startsAt: '2026-10-19T07:00:00.000Z',
      when: 'lundi 19 octobre 2026 à 09:00',
      name: 'Camille Martin',
      email: 'camille@example.com',
      mailto: 'mailto:camille@example.com',
      company: 'Atelier Martin',
      format: 'Visio',
      contact: { kind: 'video', href: 'https://meet.jit.si/nedellec-a1b2c3d4e5f6g7h8' },
      message: 'Refonte d’une application Angular.',
      status: 'Confirmé',
      cancelReason: null,
      cancellable: true,
      cancelLabel: 'Annuler le rendez-vous de Camille Martin le lundi 19 octobre 2026 à 09:00',
    });
  });

  it.each([
    { phone: '06 12 34 56 78', href: 'tel:0612345678' },
    { phone: '+33 6 12-34.56.78', href: 'tel:+33612345678' },
    { phone: '0612345678', href: 'tel:0612345678' },
  ])(
    'Given a phone call on « $phone » When its row is built Then the number is shown as typed and dialled as $href',
    ({ phone, href }) => {
      const row = rowOf(anAdminBooking({ format: 'phone', phone, videoUrl: null }));

      expect({ format: row?.format, contact: row?.contact }).toEqual({
        format: 'Téléphone',
        contact: { kind: 'phone', href, label: phone },
      });
    },
  );

  it.each([
    { case: 'a video call without link', format: 'video' as const, phone: null, videoUrl: null },
    { case: 'a phone call without number', format: 'phone' as const, phone: null, videoUrl: null },
  ])(
    'Given $case When its row is built Then no contact is offered',
    ({ format, phone, videoUrl }) => {
      expect(rowOf(anAdminBooking({ format, phone, videoUrl }))?.contact).toBeNull();
    },
  );

  it.each([
    {
      case: 'a cancelled video call',
      status: 'cancelled' as const,
      startsAt: '2026-10-20T08:00:00.000Z',
      endsAt: '2026-10-20T08:30:00.000Z',
      joinable: false,
    },
    {
      case: 'a video call already over',
      status: 'confirmed' as const,
      startsAt: '2026-10-15T09:00:00.000Z',
      endsAt: '2026-10-15T09:30:00.000Z',
      joinable: false,
    },
    {
      case: 'a video call in progress',
      status: 'confirmed' as const,
      startsAt: '2026-10-15T09:45:00.000Z',
      endsAt: '2026-10-15T10:15:00.000Z',
      joinable: true,
    },
  ])(
    'Given $case When its row is built Then the video link is offered: $joinable',
    ({ status, startsAt, endsAt, joinable }) => {
      const videoUrl = 'https://meet.jit.si/nedellec-a1b2c3d4e5f6g7h8';
      const row = rowOf(
        anAdminBooking({
          format: 'video',
          videoUrl,
          phone: null,
          status,
          startsAt,
          endsAt,
          ...(status === 'cancelled'
            ? { cancelledAt: '2026-10-14T10:00:00.000Z', cancelledBy: 'visitor' as const }
            : {}),
        }),
        'past',
      );

      expect(row?.contact).toEqual(joinable ? { kind: 'video', href: videoUrl } : null);
    },
  );

  it('Given no company When the row is built Then the company stays empty', () => {
    expect(rowOf(anAdminBooking({ company: null }))?.company).toBeNull();
  });

  it.each([
    { cancelledBy: 'owner' as const, status: 'Annulé par vous' },
    { cancelledBy: 'visitor' as const, status: 'Annulé par le visiteur' },
    { cancelledBy: null, status: 'Annulé' },
  ])(
    'Given a booking cancelled by $cancelledBy When its row is built Then it reads « $status », keeps its reason and cannot be cancelled',
    ({ cancelledBy, status }) => {
      const row = rowOf(
        anAdminBooking({
          status: 'cancelled',
          cancelledBy,
          cancelledAt: '2026-10-14T08:00:00.000Z',
          cancelReason: 'Imprévu de mon côté.',
        }),
      );

      expect({
        status: row?.status,
        cancelReason: row?.cancelReason,
        cancellable: row?.cancellable,
      }).toEqual({ status, cancelReason: 'Imprévu de mon côté.', cancellable: false });
    },
  );

  it('Given a booking cancelled without reason When its row is built Then no reason is shown', () => {
    expect(
      rowOf(anAdminBooking({ status: 'cancelled', cancelledBy: 'visitor', cancelReason: null }))
        ?.cancelReason,
    ).toBeNull();
  });

  it.each([
    {
      case: 'starting in a minute',
      startsAt: '2026-10-15T10:01:00.000Z',
      scope: 'upcoming' as const,
      cancellable: true,
    },
    {
      case: 'starting right now',
      startsAt: '2026-10-15T10:00:00.000Z',
      scope: 'upcoming' as const,
      cancellable: false,
    },
    {
      case: 'already started',
      startsAt: '2026-10-15T09:50:00.000Z',
      scope: 'upcoming' as const,
      cancellable: false,
    },
    {
      case: 'listed with the past ones',
      startsAt: '2026-10-19T07:00:00.000Z',
      scope: 'past' as const,
      cancellable: false,
    },
  ])(
    'Given a confirmed booking $case When its row is built Then it can be cancelled: $cancellable',
    ({ startsAt, scope, cancellable }) => {
      expect(rowOf(anAdminBooking({ status: 'confirmed', startsAt }), scope)?.cancellable).toBe(
        cancellable,
      );
    },
  );

  it.each([
    { startsAt: '2026-11-01T08:00:00.000Z', when: 'dimanche 1er novembre 2026 à 09:00' },
    { startsAt: '2026-10-25T00:30:00.000Z', when: 'dimanche 25 octobre 2026 à 02:30' },
    { startsAt: '2026-10-19T22:30:00.000Z', when: 'mardi 20 octobre 2026 à 00:30' },
  ])(
    'Given a booking at $startsAt When its row is built Then it is dated « $when » in Paris',
    ({ startsAt, when }) => {
      expect(rowOf(anAdminBooking({ startsAt }))?.when).toBe(when);
    },
  );

  it('Given bookings in the order of the API When the rows are built Then that order is kept', () => {
    const rows = toAdminBookingRows(
      [
        anAdminBooking({ id: 'late', startsAt: '2026-10-21T07:00:00.000Z' }),
        anAdminBooking({ id: 'early', startsAt: '2026-10-19T07:00:00.000Z' }),
      ],
      'past',
      NOW,
    );

    expect(rows.map((row) => row.id)).toEqual(['late', 'early']);
  });
});

describe('bookingsOverline', () => {
  it.each([
    { count: 0, scope: 'upcoming' as const, overline: '0 rendez-vous à venir' },
    { count: 1, scope: 'upcoming' as const, overline: '1 rendez-vous à venir' },
    { count: 3, scope: 'upcoming' as const, overline: '3 rendez-vous à venir' },
    { count: 0, scope: 'past' as const, overline: '0 rendez-vous passé' },
    { count: 1, scope: 'past' as const, overline: '1 rendez-vous passé' },
    { count: 3, scope: 'past' as const, overline: '3 rendez-vous passés' },
    { count: 1200, scope: 'past' as const, overline: '1 200 rendez-vous passés' },
    { count: 0, scope: 'archived' as const, overline: 'Aucun rendez-vous archivé' },
    { count: 1, scope: 'archived' as const, overline: '1 rendez-vous archivé' },
    { count: 3, scope: 'archived' as const, overline: '3 rendez-vous archivés' },
    { count: 1200, scope: 'archived' as const, overline: '1 200 rendez-vous archivés' },
  ])(
    'Given $count booking(s) in the $scope list When the overline is written Then it reads « $overline »',
    ({ count, scope, overline }) => {
      expect(bookingsOverline(count, scope)).toBe(overline);
    },
  );
});
