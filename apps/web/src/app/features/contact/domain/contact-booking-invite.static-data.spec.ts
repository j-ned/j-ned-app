import { CONTACT_BOOKING_INVITE } from './contact-booking-invite.static-data';

describe('contact booking invite copy', () => {
  it('asks whether the visitor would rather talk, then offers the 30 minute call', () => {
    expect(CONTACT_BOOKING_INVITE).toEqual({
      prompt: 'Préférez en parler ?',
      link: 'Réservez un appel de 30 min',
    });
  });
});
