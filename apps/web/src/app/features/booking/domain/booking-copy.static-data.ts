import type {
  BookingCancelFailure,
  BookingFailureReason,
  BookingFormat,
} from './models/booking.model';

type BookingFicheRow = { readonly label: string; readonly value: string };

type BookingFiche = { readonly title: string; readonly rows: readonly BookingFicheRow[] };

export const BOOKING_FICHE: BookingFiche = {
  title: 'Appel de cadrage · 30 min',
  rows: [
    { label: 'Durée', value: '30 min' },
    { label: 'Format', value: 'Visio ou téléphone' },
    { label: 'Tarif', value: 'Gratuit' },
    { label: 'Fuseau', value: 'Heure de Paris' },
  ],
};

export const BOOKING_PAGE_COPY = {
  heading: 'Prendre rendez-vous',
  lead: 'Trente minutes pour parler de votre projet : le besoin, le délai, le budget. Vous repartez avec une première orientation, sans engagement.',
  ficheReference: 'réf. RDV-30',
  ficheDimension: 'de votre question à une première orientation',
  slotsHeading: 'Choisir un créneau',
  slotsLead: 'Les horaires affichés sont à l’heure de Paris.',
  loadError: 'Les créneaux n’ont pas pu être chargés.',
  emptyTitle: 'Aucun créneau libre pour le moment.',
  emptyDetail:
    'Écrivez-moi via le formulaire de contact\u00a0: je vous réponds sous 48\u00a0h, le soir.',
  emptyAction: 'Écrire un message',
  timeHeading: 'Heure du rendez-vous',
  timeHint: 'Choisissez d’abord un jour pour voir ses horaires.',
  detailsHeading: 'Vos coordonnées',
  detailsLead: 'Pour vous envoyer l’invitation et préparer l’appel.',
  privacyNotice:
    'Vos coordonnées servent uniquement à organiser ce rendez-vous et sont supprimées six mois après le rendez-vous.',
  privacyLink: 'Politique de confidentialité',
  submit: 'Confirmer le rendez-vous',
  submitting: 'Réservation en cours...',
} as const;

export const BOOKING_FORMAT_LABELS: Readonly<Record<BookingFormat, string>> = {
  video: 'Visio',
  phone: 'Téléphone',
};

export const BOOKING_FAILURE_MESSAGES: Readonly<Record<BookingFailureReason, string>> = {
  'slot-taken':
    'Ce créneau vient d’être réservé. Choisissez un autre horaire\u00a0: vos coordonnées sont conservées.',
  'slot-unavailable':
    'Ce créneau n’est plus disponible. Choisissez un autre horaire\u00a0: vos coordonnées sont conservées.',
  'limit-reached':
    'Vous avez déjà deux rendez-vous à venir avec cette adresse. Annulez-en un depuis son email de confirmation pour en réserver un autre.',
  'rate-limited': 'Trop de tentatives en peu de temps. Réessayez dans quelques minutes.',
  invalid: 'Certaines informations n’ont pas été acceptées. Vérifiez le formulaire puis réessayez.',
  network: 'La connexion a échoué. Vérifiez votre réseau puis réessayez.',
  server:
    'Le service de réservation ne répond pas. Réessayez dans un instant ou écrivez-moi via le formulaire de contact.',
};

export type BookingCancelNotice = 'invalid-link' | 'already-cancelled' | 'not-cancellable';

export const BOOKING_CANCEL_NOTICES: Readonly<Record<BookingCancelNotice, string>> = {
  'invalid-link':
    'Ce lien d’annulation est incomplet. Ouvrez-le tel quel depuis votre email de confirmation.',
  'already-cancelled': 'Ce rendez-vous est déjà annulé. Le créneau a été libéré.',
  'not-cancellable':
    'Ce rendez-vous a commencé ou est passé\u00a0: il ne peut plus être annulé en ligne.',
};

export const BOOKING_CANCEL_FAILURE_MESSAGES: Readonly<Record<BookingCancelFailure, string>> = {
  'not-found':
    'Ce lien d’annulation ne correspond à aucun rendez-vous. Vérifiez qu’il est complet ou écrivez-moi via le formulaire de contact.',
  'too-late': 'Le rendez-vous a commencé\u00a0: il ne peut plus être annulé en ligne.',
  network: 'La connexion a échoué. Vérifiez votre réseau puis réessayez.',
  server: 'Le service de réservation ne répond pas. Réessayez dans un instant.',
};
