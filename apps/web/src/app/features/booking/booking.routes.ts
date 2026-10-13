import type { Routes } from '@angular/router';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { Booking } from './pages/booking/booking';
import { BookingCancellation } from './pages/booking-cancellation/booking-cancellation';

const BOOKING_TITLE = 'Prendre rendez-vous, appel de cadrage gratuit | Julien Nédellec';
const BOOKING_URL = `${SITE_IDENTITY.siteUrl}/rendez-vous`;
const CANCELLATION_TITLE = 'Annuler un rendez-vous | Julien Nédellec';

export const BOOKING_ROUTES: Routes = [
  {
    path: '',
    title: BOOKING_TITLE,
    component: Booking,
    data: {
      seo: {
        title: BOOKING_TITLE,
        description:
          'Réservez en ligne un appel de cadrage gratuit de 30 minutes, en visio ou par téléphone, pour parler de votre site ou de votre application.',
        url: BOOKING_URL,
        type: 'website',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_IDENTITY.siteUrl },
            { '@type': 'ListItem', position: 2, name: 'Prendre rendez-vous', item: BOOKING_URL },
          ],
        },
      },
    },
  },
  {
    path: 'annulation',
    title: CANCELLATION_TITLE,
    component: BookingCancellation,
    data: {
      seo: {
        title: CANCELLATION_TITLE,
        description: 'Annulez un rendez-vous réservé en ligne, depuis le lien reçu par email.',
        // Fixe : l'URL courante porte le jeton d'annulation dans son fragment.
        url: `${BOOKING_URL}/annulation`,
        robots: 'noindex, nofollow',
      },
    },
  },
];
