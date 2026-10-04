import { formatEur } from './format-eur';
import { OFFERS } from './offer-catalog.static-data';
import { OFFER_PAGES } from './offer-pages.static-data';
import { OFFER_PRICES } from './offer-prices.static-data';

const collectStrings = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value !== null && typeof value === 'object')
    return Object.values(value).flatMap(collectStrings);
  return [];
};

describe('OFFER_PAGES', () => {
  describe('site-atelier', () => {
    const page = OFFER_PAGES['site-atelier'];
    const prices = OFFER_PRICES['site-atelier'];

    it('states the hero copy word for word', () => {
      expect(page.hero).toEqual({
        title: 'Le site de votre atelier, en ligne en 7 jours.',
        subtitle:
          "Je suis tourneur CN dans l'aéronautique. Je crée des sites qui montrent à un acheteur ce que vous savez usiner, en trente secondes.",
        ctaLabel: 'Demander mon site',
      });
    });

    it('titles each section in the words of a workshop owner', () => {
      expect({
        reasons: page.reasons?.heading,
        deliverables: page.deliverables?.heading,
        steps: page.steps?.heading,
        pricing: page.pricing.heading,
        faq: page.faq?.heading,
      }).toEqual({
        reasons: "Pourquoi un tourneur plutôt qu'une agence",
        deliverables: 'Ce que contient le site',
        steps: 'Le déroulé en 7 jours',
        pricing: 'Tarif',
        faq: 'Questions fréquentes',
      });
    });

    it('gives three reasons, each split into a lead and its detail', () => {
      expect(page.reasons?.items.map(({ lead, detail }) => ({ lead, detail }))).toEqual([
        {
          lead: 'Je parle votre langue',
          detail: 'capacités, matières, tolérances, certifications.',
        },
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
      expect(page.deliverables?.items).toEqual([
        'Savoir-faire',
        'Parc machines',
        'Matières et secteurs',
        'Qualité et certifications',
        'Étapes de travail',
        'Formulaire de demande de devis',
        'Mentions légales',
        'Adapté au téléphone',
        'Référencement local Google',
      ]);
    });

    it('names the four steps with action verbs and their day', () => {
      expect(page.steps?.items.map(({ verb, when }) => ({ verb, when }))).toEqual([
        { verb: 'Échanger', when: 'jour 1' },
        { verb: 'Construire', when: 'jours 2 à 5' },
        { verb: 'Ajuster', when: 'jour 6' },
        { verb: 'Mettre en ligne', when: 'jour 7' },
      ]);
    });

    it('prices a one-off creation and a monthly maintenance from OFFER_PRICES', () => {
      expect(
        page.pricing.lines.map(({ name, amount, period, label }) => ({
          name,
          amount,
          period,
          label,
        })),
      ).toEqual([
        {
          name: 'Création',
          amount: { kind: 'fixed', eur: prices.creationEur },
          period: 'once',
          label: formatEur(prices.creationEur),
        },
        {
          name: 'Maintenance',
          amount: { kind: 'fixed', eur: prices.maintenanceMonthlyEur },
          period: 'month',
          label: `${formatEur(prices.maintenanceMonthlyEur)}/mois`,
        },
      ]);
    });

    it('states the payment terms and what the maintenance covers', () => {
      expect(page.pricing.lines.map(({ terms, includes }) => ({ terms, includes }))).toEqual([
        {
          terms: 'Une fois. 50 % à la commande, 50 % à la mise en ligne.',
          includes: undefined,
        },
        {
          terms: 'Par mois, sans engagement.',
          includes: [
            'Hébergement',
            'Nom de domaine',
            'HTTPS',
            'Sauvegardes',
            '30 minutes de modifications par mois',
          ],
        },
      ]);
    });

    it('answers the five questions with the validated copy', () => {
      expect(page.faq?.items.map(({ question, answer }) => ({ question, answer }))).toEqual([
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
      expect(page.request).toEqual({
        subject: 'Site pro pour mon atelier',
        intro:
          'Dites-moi le nom de votre atelier et ce que vous usinez. Je vous rappelle sous 48 h avec une première maquette.',
      });
    });
  });

  it.each(Object.entries(OFFER_PAGES))(
    'gives each reason, step, question and price line of %s a distinct id',
    (_slug, page) => {
      const ids = [
        ...(page.reasons?.items ?? []),
        ...(page.steps?.items ?? []),
        ...(page.faq?.items ?? []),
        ...page.pricing.lines,
      ].map(({ id }) => id);
      expect(new Set(ids).size).toBe(ids.length);
    },
  );

  it('contains no em dash anywhere in the offers copy', () => {
    expect(collectStrings([OFFERS, OFFER_PAGES]).filter((text) => text.includes('—'))).toEqual([]);
  });
});
