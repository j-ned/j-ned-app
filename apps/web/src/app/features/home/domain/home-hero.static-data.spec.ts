import { HOME_HERO_CTA_LABELS, HOME_WORK_FRAME } from './home-hero.static-data';

const NBSP = ' ';

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
        { label: 'Interlocuteur', value: 'Un seul, du devis à la maintenance' },
        { label: 'Site vitrine', value: '7 jours, prix fixe' },
        { label: 'Application', value: 'Devis ferme après cadrage' },
        { label: 'Propriété', value: 'Code et domaine à votre nom' },
        { label: 'Tolérance prix', value: `±${NBSP}0${NBSP}€ hors avenant signé` },
      ],
      dimension: 'de la demande à la mise en ligne',
    });
  });
});
