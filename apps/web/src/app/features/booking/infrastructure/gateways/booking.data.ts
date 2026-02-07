import type { Booking } from '../../domain/models';

export const MOCK_BOOKINGS: readonly Booking[] = [
  {
    id: 1,
    date: '2026-02-10',
    startTime: '10:00',
    duration: 30,
    name: 'Marie Dupont',
    email: 'marie.dupont@example.com',
    phone: '0612345678',
    subject: 'Consultation projet Angular',
    message: 'Je souhaite discuter de la refonte de mon application.',
    createdAt: '2026-02-05T14:30:00Z',
  },
  {
    id: 2,
    date: '2026-02-12',
    startTime: '14:00',
    duration: 60,
    name: 'Pierre Martin',
    email: 'pierre.martin@example.com',
    phone: '0698765432',
    subject: 'Appel découverte',
    message: "Besoin d'un développeur pour un projet NestJS.",
    createdAt: '2026-02-06T09:15:00Z',
  },
] as const;
