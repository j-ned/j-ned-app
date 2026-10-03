import type { SiteOfferContent } from './models/site-offer.model';

export const SITE_OFFER_PRICES = { creationEur: 690, maintenanceMonthlyEur: 29 } as const;

const CREATION_PRICE = `${SITE_OFFER_PRICES.creationEur}\u00a0€`;
const MAINTENANCE_PRICE = `${SITE_OFFER_PRICES.maintenanceMonthlyEur}\u00a0€/mois`;

export const SITE_OFFER = {
  hero: {
    title: 'Le site de votre atelier, en ligne en 7 jours.',
    subtitle:
      "Je suis tourneur CN dans l'aéronautique. Je crée des sites qui montrent à un acheteur ce que vous savez usiner, en trente secondes.",
    ctaLabel: 'Demander mon site',
    priceLabel: `${CREATION_PRICE}, prix final`,
  },
  reasons: [
    {
      id: 'language',
      lead: 'Je parle votre langue',
      detail: 'capacités, matières, tolérances, certifications.',
    },
    {
      id: 'buyer',
      lead: "Je sais ce qu'un acheteur cherche",
      detail: 'parc machines, EN 9100, délais, contact direct.',
    },
    {
      id: 'mobile',
      lead: 'Sans surprise',
      detail: 'un site rapide, lisible sur téléphone, sans abonnement caché.',
    },
  ],
  deliverables: [
    'Savoir-faire',
    'Parc machines',
    'Matières et secteurs',
    'Qualité et certifications',
    'Étapes de travail',
    'Formulaire de demande de devis',
    'Mentions légales',
    'Adapté au téléphone',
    'Référencement local Google',
  ],
  steps: [
    {
      id: 'exchange',
      verb: 'Échanger',
      when: 'jour 1',
      detail:
        "20 minutes au téléphone ou à l'atelier, vous me donnez photos et liste des machines.",
    },
    {
      id: 'build',
      verb: 'Construire',
      when: 'jours 2 à 5',
      detail: 'Je monte le site et je vous envoie un lien de prévisualisation.',
    },
    { id: 'adjust', verb: 'Ajuster', when: 'jour 6', detail: 'Vos corrections.' },
    {
      id: 'publish',
      verb: 'Mettre en ligne',
      when: 'jour 7',
      detail: 'Sur votre nom de domaine.',
    },
  ],
  pricing: {
    creation: {
      priceLabel: CREATION_PRICE,
      terms: 'Une fois. 50\u00a0% à la commande, 50\u00a0% à la mise en ligne.',
    },
    maintenance: {
      priceLabel: MAINTENANCE_PRICE,
      terms: 'Par mois, sans engagement.',
      includes: [
        'Hébergement',
        'Nom de domaine',
        'HTTPS',
        'Sauvegardes',
        '30 minutes de modifications par mois',
      ],
    },
  },
  faq: [
    {
      id: 'existing-site',
      question: "J'ai déjà un site, ça vaut le coup ?",
      answer:
        "Si votre site ne montre ni votre parc machines, ni vos matières, ni vos certifications, un acheteur ne trouve pas ce qu'il cherche. Je reprends ce qui sert et je refais le reste.",
    },
    {
      id: 'no-time',
      question: "Je n'ai pas le temps de m'en occuper.",
      answer:
        "Vingt minutes d'échange et la liste de vos machines suffisent. J'écris les textes, vous relisez.",
    },
    {
      id: 'network',
      question: 'Mes clients viennent par le réseau.',
      answer:
        "Un acheteur qui reçoit votre nom regarde souvent votre site avant d'appeler. Le site confirme ce que le réseau dit de vous.",
    },
    {
      id: 'domain',
      question: 'Le nom de domaine reste à moi ?',
      answer: 'Oui. Il est enregistré à votre nom, vous en restez propriétaire.',
    },
    {
      id: 'stop-maintenance',
      question: "Et si j'arrête la maintenance ?",
      answer: "Vous récupérez les fichiers du site et vous l'hébergez où vous voulez.",
    },
  ],
  requestSubject: 'Site pro pour mon atelier',
  requestIntro:
    'Dites-moi le nom de votre atelier et ce que vous usinez. Je vous rappelle sous 48 h avec une première maquette.',
} as const satisfies SiteOfferContent;
