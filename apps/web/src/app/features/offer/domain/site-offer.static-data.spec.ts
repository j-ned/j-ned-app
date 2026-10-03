import { SITE_OFFER, SITE_OFFER_PRICES } from './site-offer.static-data';

const NBSP = ' ';

const collectStrings = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value !== null && typeof value === 'object')
    return Object.values(value).flatMap(collectStrings);
  return [];
};

describe('SITE_OFFER_PRICES', () => {
  it('fixes the creation price and the monthly maintenance price', () => {
    expect(SITE_OFFER_PRICES).toEqual({ creationEur: 690, maintenanceMonthlyEur: 29 });
  });
});

describe('SITE_OFFER', () => {
  it('states the hero copy word for word', () => {
    expect(SITE_OFFER.hero).toEqual({
      title: 'Le site de votre atelier, en ligne en 7 jours.',
      subtitle:
        "Je suis tourneur CN dans l'aéronautique. Je crée des sites qui montrent à un acheteur ce que vous savez usiner, en trente secondes.",
      ctaLabel: 'Demander mon site',
      priceLabel: `690${NBSP}€, prix final`,
    });
  });

  it('builds every price label from SITE_OFFER_PRICES with a non-breaking space before the euro sign', () => {
    expect(SITE_OFFER.hero.priceLabel).toBe(`${SITE_OFFER_PRICES.creationEur}${NBSP}€, prix final`);
    expect(SITE_OFFER.pricing.creation.priceLabel).toBe(`${SITE_OFFER_PRICES.creationEur}${NBSP}€`);
    expect(SITE_OFFER.pricing.maintenance.priceLabel).toBe(
      `${SITE_OFFER_PRICES.maintenanceMonthlyEur}${NBSP}€/mois`,
    );
  });

  it('gives three reasons, each split into a lead and its detail', () => {
    expect(SITE_OFFER.reasons.map(({ lead, detail }) => ({ lead, detail }))).toEqual([
      { lead: 'Je parle votre langue', detail: 'capacités, matières, tolérances, certifications.' },
      {
        lead: "Je sais ce qu'un acheteur cherche",
        detail: 'parc machines, EN 9100, délais, contact direct.',
      },
      {
        lead: 'Sans surprise',
        detail: 'un site rapide, lisible sur téléphone, sans abonnement caché.',
      },
    ]);
  });

  it('lists the nine deliverables in order', () => {
    expect(SITE_OFFER.deliverables.map((item) => item.toLocaleLowerCase('fr'))).toEqual([
      'savoir-faire',
      'parc machines',
      'matières et secteurs',
      'qualité et certifications',
      'étapes de travail',
      'formulaire de demande de devis',
      'mentions légales',
      'adapté au téléphone',
      'référencement local google',
    ]);
  });

  it('names the four steps with action verbs and their day', () => {
    expect(SITE_OFFER.steps.map(({ verb, when }) => ({ verb, when }))).toEqual([
      { verb: 'Échanger', when: 'jour 1' },
      { verb: 'Construire', when: 'jours 2 à 5' },
      { verb: 'Ajuster', when: 'jour 6' },
      { verb: 'Mettre en ligne', when: 'jour 7' },
    ]);
  });

  it('states the payment terms and what the maintenance covers', () => {
    expect(SITE_OFFER.pricing.creation.terms).toContain('50');
    expect(SITE_OFFER.pricing.creation.terms).toContain('à la commande');
    expect(SITE_OFFER.pricing.creation.terms).toContain('à la mise en ligne');
    expect(SITE_OFFER.pricing.maintenance.terms).toContain('sans engagement');
    expect(SITE_OFFER.pricing.maintenance.includes).toHaveLength(5);
  });

  it('answers the five questions with the validated copy', () => {
    expect(SITE_OFFER.faq.map(({ question, answer }) => ({ question, answer }))).toEqual([
      {
        question: "J'ai déjà un site, ça vaut le coup ?",
        answer:
          "Si votre site ne montre ni votre parc machines, ni vos matières, ni vos certifications, un acheteur ne trouve pas ce qu'il cherche. Je reprends ce qui sert et je refais le reste.",
      },
      {
        question: "Je n'ai pas le temps de m'en occuper.",
        answer:
          "Vingt minutes d'échange et la liste de vos machines suffisent. J'écris les textes, vous relisez.",
      },
      {
        question: 'Mes clients viennent par le réseau.',
        answer:
          "Un acheteur qui reçoit votre nom regarde souvent votre site avant d'appeler. Le site confirme ce que le réseau dit de vous.",
      },
      {
        question: 'Le nom de domaine reste à moi ?',
        answer: 'Oui. Il est enregistré à votre nom, vous en restez propriétaire.',
      },
      {
        question: "Et si j'arrête la maintenance ?",
        answer: "Vous récupérez les fichiers du site et vous l'hébergez où vous voulez.",
      },
    ]);
  });

  it('addresses the request form to a workshop owner, with a prefilled subject', () => {
    expect({
      requestSubject: SITE_OFFER.requestSubject,
      requestIntro: SITE_OFFER.requestIntro,
    }).toEqual({
      requestSubject: 'Site pro pour mon atelier',
      requestIntro:
        'Dites-moi le nom de votre atelier et ce que vous usinez. Je vous rappelle sous 48 h avec une première maquette.',
    });
  });

  it('gives each reason, step and question a distinct id', () => {
    const ids = [...SITE_OFFER.reasons, ...SITE_OFFER.steps, ...SITE_OFFER.faq].map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contains no em dash anywhere in its copy', () => {
    expect(collectStrings(SITE_OFFER).filter((text) => text.includes('—'))).toEqual([]);
  });
});
