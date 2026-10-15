import type { BookingFeedSubscription } from '@features/booking/domain/models/booking-admin.model';
import { formatParisDateTime } from '@features/booking/domain/paris-format';

export type BookingFeedView =
  | { readonly kind: 'unconfigured' }
  | { readonly kind: 'none'; readonly actionLabel: "Créer le lien d'abonnement" }
  | {
      readonly kind: 'active';
      readonly since: string;
      readonly url: string;
      readonly webcalUrl: string;
      readonly actionLabel: 'Régénérer le lien';
    };

export function toBookingFeedView(subscription: BookingFeedSubscription): BookingFeedView {
  switch (subscription.kind) {
    case 'unconfigured':
      return { kind: 'unconfigured' };
    case 'none':
      return { kind: 'none', actionLabel: "Créer le lien d'abonnement" };
    case 'active':
      return {
        kind: 'active',
        since: formatParisDateTime(subscription.createdAt),
        url: subscription.url,
        webcalUrl: toWebcalUrl(subscription.url),
        actionLabel: 'Régénérer le lien',
      };
  }
}

export function toWebcalUrl(url: string): string {
  return url.replace(/^https?:/, 'webcal:');
}
