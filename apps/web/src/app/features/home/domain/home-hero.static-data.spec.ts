import { HOME_HERO_CTA_LABELS, HOME_WORK_FRAME } from './home-hero.static-data';

describe('home hero copy', () => {
  it('labels the contact and offers calls to action with the validated copy', () => {
    expect(HOME_HERO_CTA_LABELS).toEqual({
      contact: 'Décrire mon projet',
      offers: 'Voir les offres et les prix',
    });
  });

  it('frames the way of working with the validated title, reference, rows and dimension', () => {
    expect(HOME_WORK_FRAME).toEqual({
      title: 'Cadre de travail',
      reference: 'réf. JN-2026',
      rows: [
        { label: 'Prix', value: 'Fixe, annoncé avant de commencer' },
        { label: 'Site vitrine', value: 'En ligne en 7 jours' },
        { label: 'Réponse', value: 'Sous 24\u00a0h ouvrées' },
        { label: 'Propriété', value: 'Le site, le code et le nom de domaine sont à vous' },
        { label: 'Zone', value: 'Yvelines et Île-de-France, rendez-vous possible' },
      ],
      dimension: 'de la demande à la mise en ligne',
    });
  });
});
