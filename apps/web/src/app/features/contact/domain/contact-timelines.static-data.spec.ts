import { CONTACT_TIMELINES } from './contact-timelines.static-data';

describe('CONTACT_TIMELINES', () => {
  it('offers the four timelines, from the most to the least urgent', () => {
    expect(CONTACT_TIMELINES).toEqual([
      'Dès que possible',
      'Dans le mois',
      "D'ici 3 mois",
      'Pas de date fixée',
    ]);
  });
});
