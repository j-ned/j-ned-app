import type {
  AdminBooking,
  BookingScope,
} from '@features/booking/domain/models/booking-admin.model';
import { BOOKING_FORMAT_LABELS } from '@features/booking/domain/booking-copy.static-data';
import { formatParisDateTime } from '@features/booking/domain/paris-format';
import { counted } from '@shared/format/counted';
import { groupedNumber } from '@shared/format/grouped-number';
import type { FilterOption } from '@shared/ui/filter-group';

type AdminBookingContact =
  | { readonly kind: 'video'; readonly href: string }
  | { readonly kind: 'phone'; readonly href: string; readonly label: string };

export type AdminBookingRowView = {
  readonly id: string;
  readonly startsAt: string;
  readonly when: string;
  readonly name: string;
  readonly email: string;
  readonly mailto: string;
  readonly company: string | null;
  readonly format: string;
  readonly contact: AdminBookingContact | null;
  readonly message: string;
  readonly status: string;
  readonly cancelReason: string | null;
  readonly cancellable: boolean;
  readonly cancelLabel: string;
};

export const ADMIN_BOOKINGS_FILTERS: readonly FilterOption<BookingScope>[] = [
  { value: 'upcoming', label: 'À venir' },
  { value: 'past', label: 'Passés' },
];

const toContact = (booking: AdminBooking, now: Date): AdminBookingContact | null => {
  if (booking.format === 'video') {
    // Rejoindre n'a de sens que pour un appel maintenu et pas encore terminé.
    const joinable = booking.status === 'confirmed' && Date.parse(booking.endsAt) > now.getTime();
    return joinable && booking.videoUrl !== null ? { kind: 'video', href: booking.videoUrl } : null;
  }
  if (booking.phone === null) return null;
  return {
    kind: 'phone',
    href: `tel:${booking.phone.replace(/[\s.-]/g, '')}`,
    label: booking.phone,
  };
};

const toStatus = (booking: AdminBooking): string => {
  if (booking.status === 'confirmed') return 'Confirmé';
  if (booking.cancelledBy === 'owner') return 'Annulé par vous';
  if (booking.cancelledBy === 'visitor') return 'Annulé par le visiteur';
  return 'Annulé';
};

export function toAdminBookingRows(
  bookings: readonly AdminBooking[],
  scope: BookingScope,
  now: Date,
): readonly AdminBookingRowView[] {
  return bookings.map((booking) => {
    const when = formatParisDateTime(booking.startsAt);
    return {
      id: booking.id,
      startsAt: booking.startsAt,
      when,
      name: booking.name,
      email: booking.email,
      mailto: `mailto:${booking.email}`,
      company: booking.company,
      format: BOOKING_FORMAT_LABELS[booking.format],
      contact: toContact(booking, now),
      message: booking.message,
      status: toStatus(booking),
      cancelReason: booking.status === 'cancelled' ? booking.cancelReason : null,
      // L'API refuse l'annulation (409) dès que le rendez-vous a commencé.
      cancellable:
        scope === 'upcoming' &&
        booking.status === 'confirmed' &&
        Date.parse(booking.startsAt) > now.getTime(),
      cancelLabel: `Annuler le rendez-vous de ${booking.name} le ${when}`,
    };
  });
}

export function bookingsOverline(count: number, scope: BookingScope): string {
  return scope === 'upcoming'
    ? `${groupedNumber(count)} rendez-vous à venir`
    : counted(count, 'rendez-vous passé', 'rendez-vous passés');
}
