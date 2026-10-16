import { describe, expect, it } from 'vitest';
import {
  BOOKING_CANCEL_FAILURE_MESSAGES,
  BOOKING_CANCEL_NOTICES,
  BOOKING_FAILURE_MESSAGES,
  BOOKING_FICHE,
  BOOKING_FORMAT_LABELS,
  BOOKING_PAGE_COPY,
} from './booking-copy.static-data';

describe('BOOKING_FICHE', () => {
  it('describes the single bookable call, its length, format, price and time zone', () => {
    expect(BOOKING_FICHE).toEqual({
      title: 'Appel de cadrage · 30 min',
      rows: [
        { label: 'Durée', value: '30 min' },
        { label: 'Format', value: 'Visio ou téléphone' },
        { label: 'Tarif', value: 'Gratuit' },
        { label: 'Fuseau', value: 'Heure de Paris' },
      ],
    });
  });
});

describe('BOOKING_PAGE_COPY', () => {
  it('sends the visitor to the contact form when no slot is free, with an answer within 48 hours, in the evening', () => {
    expect(BOOKING_PAGE_COPY.emptyDetail).toBe(
      'Écrivez-moi via le formulaire de contact\u00a0: je vous réponds sous 48\u00a0h, le soir.',
    );
  });
});

describe('BOOKING_FORMAT_LABELS', () => {
  it('names both call formats', () => {
    expect(BOOKING_FORMAT_LABELS).toEqual({ video: 'Visio', phone: 'Téléphone' });
  });
});

describe('BOOKING_FAILURE_MESSAGES', () => {
  it('tells the visitor what happened and what to do next for every refusal', () => {
    expect(BOOKING_FAILURE_MESSAGES).toEqual({
      'slot-taken':
        'Ce créneau vient d’être réservé. Choisissez un autre horaire : vos coordonnées sont conservées.',
      'slot-unavailable':
        'Ce créneau n’est plus disponible. Choisissez un autre horaire : vos coordonnées sont conservées.',
      'limit-reached':
        'Vous avez déjà deux rendez-vous à venir avec cette adresse. Annulez-en un depuis son email de confirmation pour en réserver un autre.',
      'rate-limited': 'Trop de tentatives en peu de temps. Réessayez dans quelques minutes.',
      invalid:
        'Certaines informations n’ont pas été acceptées. Vérifiez le formulaire puis réessayez.',
      network: 'La connexion a échoué. Vérifiez votre réseau puis réessayez.',
      server:
        'Le service de réservation ne répond pas. Réessayez dans un instant ou écrivez-moi via le formulaire de contact.',
    });
  });
});

describe('BOOKING_CANCEL_NOTICES', () => {
  it('explains why a cancellation link offers nothing to cancel', () => {
    expect(BOOKING_CANCEL_NOTICES).toEqual({
      'invalid-link':
        'Ce lien d’annulation est incomplet. Ouvrez-le tel quel depuis votre email de confirmation.',
      'already-cancelled': 'Ce rendez-vous est déjà annulé. Le créneau a été libéré.',
      'not-cancellable':
        'Ce rendez-vous a commencé ou est passé\u00a0: il ne peut plus être annulé en ligne.',
    });
  });
});

describe('BOOKING_CANCEL_FAILURE_MESSAGES', () => {
  it('tells the visitor what happened and what to do next for every cancellation refusal', () => {
    expect(BOOKING_CANCEL_FAILURE_MESSAGES).toEqual({
      'not-found':
        'Ce lien d’annulation ne correspond à aucun rendez-vous. Vérifiez qu’il est complet ou écrivez-moi via le formulaire de contact.',
      'too-late': 'Le rendez-vous a commencé\u00a0: il ne peut plus être annulé en ligne.',
      network: 'La connexion a échoué. Vérifiez votre réseau puis réessayez.',
      server: 'Le service de réservation ne répond pas. Réessayez dans un instant.',
    });
  });
});
