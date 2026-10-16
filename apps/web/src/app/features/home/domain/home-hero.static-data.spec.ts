import { HOME_HERO_CTA_LABELS, HOME_WORK_FRAME } from './home-hero.static-data';

describe('home hero copy', () => {
  it('labels the contact and offers calls to action, then the booking link, with the validated copy', () => {
    expect(HOME_HERO_CTA_LABELS).toEqual({
      contact: 'Décrire mon projet',
      offers: 'Voir les offres et les prix',
      booking: 'ou réserver un appel de 30\u00a0min',
    });
  });

  it('frames the way of working with the validated title, reference, rows and dimension', () => {
    expect(HOME_WORK_FRAME).toEqual({
      title: 'Cadre de travail',
      reference: 'réf. JN-2026',
      rows: [
        { label: 'Prix', value: 'Fixe, annoncé avant de commencer' },
        { label: 'Délai', value: 'Fixé au devis, selon la demande' },
        { label: 'Réponse', value: 'Sous 48\u00a0h, le soir' },
        { label: 'Disponibilité', value: 'Le soir et le week-end' },
        { label: 'Propriété', value: 'Le site, le code et le nom de domaine sont à vous' },
        { label: 'Zone', value: 'Yvelines et Île-de-France, rendez-vous possible le samedi' },
      ],
      dimension: 'de la demande à la mise en ligne',
    });
  });
});
