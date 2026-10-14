import type { BookingAdminFailure } from '@features/booking/domain/models/booking-admin.model';

const SAVE_FAILURES: Partial<Record<BookingAdminFailure, string>> = {
  invalid: 'Les plages ont été refusées : vérifiez les heures, puis réessayez.',
  network: 'Enregistrement impossible : vérifiez votre connexion, puis réessayez.',
};
const SAVE_SERVER_FAILURE =
  "Enregistrement impossible : le serveur n'a pas répondu. Réessayez dans un instant.";

const CREATE_FAILURES: Partial<Record<BookingAdminFailure, string>> = {
  invalid: 'La fermeture a été refusée : vérifiez les dates, puis réessayez.',
  network: 'Ajout impossible : vérifiez votre connexion, puis réessayez.',
};
const CREATE_SERVER_FAILURE =
  "Ajout impossible : le serveur n'a pas répondu. Réessayez dans un instant.";

const DELETE_FAILURES: Partial<Record<BookingAdminFailure, string>> = {
  'not-found': "Cette fermeture n'existe plus. Rechargez la page.",
  network: 'Suppression impossible : vérifiez votre connexion, puis réessayez.',
};
const DELETE_SERVER_FAILURE =
  "Suppression impossible : le serveur n'a pas répondu. Réessayez dans un instant.";

export const saveFailureMessage = (reason: BookingAdminFailure | null): string =>
  (reason && SAVE_FAILURES[reason]) ?? SAVE_SERVER_FAILURE;

export const createFailureMessage = (reason: BookingAdminFailure): string =>
  CREATE_FAILURES[reason] ?? CREATE_SERVER_FAILURE;

export const deleteFailureMessage = (reason: BookingAdminFailure): string =>
  DELETE_FAILURES[reason] ?? DELETE_SERVER_FAILURE;

const DAY_FAILURES: Partial<Record<BookingAdminFailure, string>> = {
  'day-past': 'Ce jour est passé : il ne peut plus être modifié.',
  'day-in-closure':
    'Ce jour est couvert par une fermeture : modifiez-la dans la section Fermetures.',
  network: 'Modification impossible : vérifiez votre connexion, puis réessayez.',
};
const DAY_SERVER_FAILURE =
  "Modification impossible : le serveur n'a pas répondu. Réessayez dans un instant.";

const HOLIDAYS_FAILURES: Partial<Record<BookingAdminFailure, string>> = {
  network: 'Réglage des jours fériés impossible : vérifiez votre connexion, puis réessayez.',
};
const HOLIDAYS_SERVER_FAILURE =
  "Réglage des jours fériés impossible : le serveur n'a pas répondu. Réessayez dans un instant.";

export const dayFailureMessage = (reason: BookingAdminFailure): string =>
  DAY_FAILURES[reason] ?? DAY_SERVER_FAILURE;

export const holidaysFailureMessage = (reason: BookingAdminFailure): string =>
  HOLIDAYS_FAILURES[reason] ?? HOLIDAYS_SERVER_FAILURE;
