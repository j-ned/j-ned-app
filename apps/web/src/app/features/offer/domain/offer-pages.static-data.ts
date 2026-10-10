import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { formatEur } from './format-eur';
import type { OfferPages } from './models/offer.model';
import { OFFER_PRICES } from './offer-prices.static-data';

const SHOWCASE_PRICES = OFFER_PRICES['site-vitrine'];
const WORKSHOP_PRICES = OFFER_PRICES['site-atelier'];
const APPLICATION_PRICES = OFFER_PRICES['application-metier'];
const REWORK_PRICES = OFFER_PRICES['refonte-maintenance'];

export const OFFER_PAGES: OfferPages = {
  'site-vitrine': {
    hero: {
      title: 'Votre site vitrine, en ligne en 7 jours.',
      subtitle:
        'Un site clair, rapide sur téléphone, qui donne envie de vous appeler. Un prix fixe, un seul interlocuteur.',
      ctaLabel: 'Demander mon site',
    },
    reasons: {
      heading: 'Pourquoi passer par moi',
      items: [
        {
          id: 'fixed-price',
          lead: 'Un prix fixe',
          detail: `${formatEur(SHOWCASE_PRICES.creationEur)}, annoncé avant de commencer, sans dépassement.`,
        },
        {
          id: 'single-contact',
          lead: 'Un seul interlocuteur',
          detail: 'la personne qui vous répond est celle qui construit le site.',
        },
        {
          id: 'no-lock-in',
          lead: 'Rien ne vous enferme',
          detail: 'le nom de domaine et les fichiers sont à votre nom.',
        },
      ],
    },
    deliverables: {
      heading: 'Ce que contient le site',
      items: [
        "Présentation de l'entreprise",
        'Services et prestations',
        "Zone d'intervention",
        'Réalisations en photos',
        'Formulaire de demande de devis',
        'Fiche Google Business reliée',
        'Mentions légales et RGPD',
        'Adapté au téléphone',
        'Référencement local Google',
      ],
    },
    examples: {
      heading: 'Exemples',
      lead: 'Des sites de démonstration, construits pour montrer le résultat. Les entreprises sont fictives.',
      items: [
        {
          id: 'coaching-life',
          name: 'Coaching Life',
          sector: 'Coaching de vie, coaching équin et accompagnement parental',
          illustrates:
            'Trois activités sur un seul site, et la prise de rendez-vous à portée de clic sur chaque page.',
          url: 'https://coaching-life.nedellec-julien.fr/',
          image: {
            file: '/demos/coaching-life-20261005',
            alt: "Page d'accueil de Coaching Life sur ordinateur et sur téléphone\u00a0: un bandeau Site de démonstration, le titre «\u00a0Révélez votre plein potentiel intérieur\u00a0», un bouton Prendre rendez-vous et la photo d'une coach dans un salon lumineux.",
          },
        },
        {
          id: 'le-vieux-comptoir',
          name: 'Le Vieux Comptoir',
          sector: 'Brasserie parisienne',
          illustrates:
            "Une ambiance qui se voit dès la première image, la carte en ligne et la réservation d'une table.",
          url: 'https://vieux-comptoir.nedellec-julien.fr/',
          image: {
            file: '/demos/le-vieux-comptoir-20261005',
            alt: "Page d'accueil du Vieux Comptoir sur ordinateur et sur téléphone\u00a0: un bandeau Site de démonstration, une salle de brasserie aux lustres anciens, le titre «\u00a0L'Âme de Paris\u00a0» et les boutons Réserver une table et Découvrir la carte.",
          },
        },
      ],
    },
    steps: {
      heading: 'Le déroulé en 7 jours',
      items: [
        {
          id: 'exchange',
          verb: 'Échanger',
          when: 'jour 1',
          detail: "20 minutes au téléphone. Vous m'envoyez textes, logo et photos.",
        },
        {
          id: 'build',
          verb: 'Construire',
          when: 'jours 2 à 5',
          detail: 'Je monte le site et vous envoie un lien de prévisualisation.',
        },
        { id: 'adjust', verb: 'Ajuster', when: 'jour 6', detail: 'Vos corrections.' },
        {
          id: 'publish',
          verb: 'Mettre en ligne',
          when: 'jour 7',
          detail: 'Sur votre nom de domaine.',
        },
      ],
    },
    pricing: {
      heading: 'Tarif',
      lines: [
        {
          id: 'creation',
          name: 'Création',
          amount: { kind: 'fixed', eur: SHOWCASE_PRICES.creationEur },
          period: 'once',
          label: formatEur(SHOWCASE_PRICES.creationEur),
          terms: 'Une fois. 50\u00a0% à la commande, 50\u00a0% à la mise en ligne.',
        },
        {
          id: 'maintenance',
          name: 'Maintenance',
          amount: { kind: 'fixed', eur: SHOWCASE_PRICES.maintenanceMonthlyEur },
          period: 'month',
          label: `${formatEur(SHOWCASE_PRICES.maintenanceMonthlyEur)}/mois`,
          terms: 'Par mois, sans engagement.',
          includes: [
            'Hébergement',
            'Nom de domaine',
            'HTTPS',
            'Sauvegardes',
            '30 minutes de modifications par mois',
          ],
        },
      ],
    },
    faq: {
      heading: 'Questions fréquentes',
      items: [
        {
          id: 'no-content',
          question: "Je n'ai ni textes ni photos, c'est un problème\u202f?",
          answer:
            'Non. On les prépare au premier échange\u00a0: je rédige à partir de vos réponses, vous validez.',
        },
        {
          id: 'existing-site',
          question: "J'ai déjà un site, ça vaut le coup\u202f?",
          answer:
            'Si votre site est lent, illisible sur téléphone ou absent de Google, oui. Je reprends les contenus utiles.',
        },
        {
          id: 'domain',
          question: 'Le nom de domaine reste à moi\u202f?',
          answer: 'Oui, il est à votre nom.',
        },
        {
          id: 'stop-maintenance',
          question: "Et si j'arrête la maintenance\u202f?",
          answer: "Vous récupérez les fichiers du site et pouvez l'héberger ailleurs.",
        },
        {
          id: 'more-pages',
          question: 'Je pourrai ajouter des pages plus tard\u202f?',
          answer:
            "Oui. Les petites modifications entrent dans les 30 minutes mensuelles\u202f; une nouvelle page fait l'objet d'un devis avant travaux.",
        },
      ],
    },
    request: {
      subject: 'Site vitrine pour mon entreprise',
      intro: 'Indiquez votre activité et votre ville. Je vous réponds sous 24 heures ouvrées.',
    },
  },
  'site-atelier': {
    hero: {
      title: 'Le site de votre atelier, en ligne en 7 jours.',
      subtitle: `${SITE_IDENTITY.journey} Je crée des sites qui montrent à un acheteur ce que vous savez usiner, en trente secondes.`,
      ctaLabel: 'Demander mon site',
    },
    reasons: {
      heading: "Pourquoi un tourneur plutôt qu'une agence",
      items: [
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
    },
    deliverables: {
      heading: 'Ce que contient le site',
      items: [
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
    },
    examples: {
      heading: 'Exemples',
      lead: 'Des sites de démonstration, construits pour montrer le résultat. Les entreprises sont fictives.',
      items: [
        {
          id: 'site-industrie',
          name: 'Delaunay Précision',
          sector: "Atelier d'usinage CN à Élancourt",
          illustrates:
            "Ce qu'un acheteur vérifie en trente secondes\u00a0: savoir-faire, parc machines, certifications et demande de devis.",
          url: 'https://site-industrie.nedellec-julien.fr/',
          image: {
            file: '/demos/site-industrie-20261005',
            alt: "Page d'accueil de Delaunay Précision sur ordinateur et sur téléphone\u00a0: un bandeau Site de démonstration, le titre «\u00a0Vos pièces de précision, usinées au centième près\u00a0» et un bouton Demander un devis.",
          },
        },
      ],
    },
    steps: {
      heading: 'Le déroulé en 7 jours',
      items: [
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
    },
    pricing: {
      heading: 'Tarif',
      lines: [
        {
          id: 'creation',
          name: 'Création',
          amount: { kind: 'fixed', eur: WORKSHOP_PRICES.creationEur },
          period: 'once',
          label: formatEur(WORKSHOP_PRICES.creationEur),
          terms: 'Une fois. 50\u00a0% à la commande, 50\u00a0% à la mise en ligne.',
        },
        {
          id: 'maintenance',
          name: 'Maintenance',
          amount: { kind: 'fixed', eur: WORKSHOP_PRICES.maintenanceMonthlyEur },
          period: 'month',
          label: `${formatEur(WORKSHOP_PRICES.maintenanceMonthlyEur)}/mois`,
          terms: 'Par mois, sans engagement.',
          includes: [
            'Hébergement',
            'Nom de domaine',
            'HTTPS',
            'Sauvegardes',
            '30 minutes de modifications par mois',
          ],
        },
      ],
    },
    faq: {
      heading: 'Questions fréquentes',
      items: [
        {
          id: 'existing-site',
          question: "J'ai déjà un site, ça vaut le coup\u202f?",
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
          question: 'Le nom de domaine reste à moi\u202f?',
          answer: 'Oui. Il est enregistré à votre nom, vous en restez propriétaire.',
        },
        {
          id: 'stop-maintenance',
          question: "Et si j'arrête la maintenance\u202f?",
          answer: "Vous récupérez les fichiers du site et vous l'hébergez où vous voulez.",
        },
      ],
    },
    request: {
      subject: 'Site pro pour mon atelier',
      intro:
        'Dites-moi le nom de votre atelier et ce que vous usinez. Je vous rappelle sous 24 heures ouvrées.',
    },
  },
  'application-metier': {
    hero: {
      title: 'Une application taillée pour votre façon de travailler.',
      subtitle:
        'Outil interne, back-office, portail client. Je cadre le besoin avec vous, je livre en production et je maintiens.',
      ctaLabel: 'Décrire mon besoin',
    },
    reasons: {
      heading: 'Ce qui change avec une application sur mesure',
      items: [
        {
          id: 'no-rekeying',
          lead: 'Fini les ressaisies',
          detail: 'une donnée saisie une fois, disponible partout où elle sert.',
        },
        {
          id: 'fits-your-trade',
          lead: 'Adaptée à votre métier',
          detail: "vos étapes, vos statuts, vos documents, pas ceux d'un logiciel générique.",
        },
        {
          id: 'ownership',
          lead: 'Elle vous appartient',
          detail: 'code source, données et hébergement à votre nom.',
        },
      ],
    },
    deliverables: {
      heading: 'Ce qui est livré',
      items: [
        'Cadrage écrit (écrans, règles métier, priorités)',
        'Application web utilisable sur ordinateur et téléphone',
        "Comptes utilisateurs et droits d'accès",
        'Base de données sauvegardée',
        'Exports CSV ou PDF selon le besoin',
        'Mise en production',
        'Code source et documentation',
        'Tests automatisés sur les règles métier',
      ],
    },
    steps: {
      heading: 'Comment ça se passe',
      items: [
        {
          id: 'scope',
          verb: 'Cadrer',
          when: 'semaine 1',
          detail:
            'Ateliers avec les futurs utilisateurs. Vous recevez un devis ferme\u00a0: périmètre, planning, prix.',
        },
        {
          id: 'build',
          verb: 'Construire',
          when: 'itérations de 2 semaines',
          detail: 'Une version utilisable à chaque itération, sur un lien de test.',
        },
        {
          id: 'release',
          verb: 'Mettre en production',
          when: 'fin du planning',
          detail: 'Reprise des données existantes, prise en main par les utilisateurs.',
        },
        {
          id: 'maintain',
          verb: 'Maintenir',
          when: 'au mois, sans engagement',
          detail: 'Corrections, mises à jour de sécurité, évolutions sur devis.',
        },
      ],
    },
    pricing: {
      heading: 'Tarif',
      lines: [
        {
          id: 'project',
          name: 'Projet',
          amount: { kind: 'from', eur: APPLICATION_PRICES.projectFromEur },
          period: 'once',
          label: `À partir de ${formatEur(APPLICATION_PRICES.projectFromEur)}`,
          terms:
            "Devis ferme après le cadrage. Ce qui n'y figure pas fait l'objet d'un avenant que vous validez avant.",
        },
        {
          id: 'maintenance',
          name: 'Maintenance',
          amount: { kind: 'from', eur: APPLICATION_PRICES.maintenanceMonthlyFromEur },
          period: 'month',
          label: `Dès ${formatEur(APPLICATION_PRICES.maintenanceMonthlyFromEur)}/mois`,
          terms: "Sans engagement, montant fixé selon la taille de l'application.",
        },
      ],
    },
    faq: {
      heading: 'Questions fréquentes',
      items: [
        {
          id: 'first-version',
          question: 'Combien de temps pour une première version\u202f?',
          answer:
            'Pour un outil de taille moyenne, 4 à 8 semaines. Le planning exact figure dans le devis.',
        },
        {
          id: 'off-the-shelf',
          question: 'Pourquoi pas un logiciel du marché\u202f?',
          answer:
            "S'il couvre votre besoin, je vous le dirai au cadrage. Le sur mesure se justifie quand vous adaptez votre travail à l'outil au lieu de l'inverse.",
        },
        {
          id: 'scoping-cost',
          question: 'Le cadrage est payant\u202f?',
          answer:
            'Le premier échange de 30 minutes est gratuit. Le cadrage détaillé est compris dans le projet.',
        },
        {
          id: 'data-protection',
          question: 'Mes données sont-elles protégées\u202f?',
          answer:
            'Hébergement en France, connexions chiffrées, sauvegardes quotidiennes, double authentification possible.',
        },
        {
          id: 'evolution',
          question: "Je pourrai faire évoluer l'application\u202f?",
          answer:
            'Oui. Le code vous appartient\u00a0: vous pouvez aussi confier la suite à un autre prestataire.',
        },
      ],
    },
    request: {
      subject: 'Application métier sur mesure',
      intro:
        "Décrivez ce que vous utilisez aujourd'hui (tableur, logiciel, papier) et ce qui vous fait perdre du temps.",
    },
  },
  'refonte-maintenance': {
    hero: {
      title: 'Votre application existe. Je la reprends, je la sécurise, je la fais durer.',
      subtitle:
        'Prestataire parti, versions dépassées, bugs qui reviennent. Je commence par un audit chiffré, puis vous décidez.',
      ctaLabel: 'Demander un audit',
    },
    reasons: {
      heading: 'Quand faire appel à moi',
      items: [
        {
          id: 'provider-gone',
          lead: "Le prestataire n'est plus là",
          detail: 'personne ne connaît le code et chaque modification inquiète.',
        },
        {
          id: 'outdated',
          lead: 'Les versions sont dépassées',
          detail: 'le framework ou les dépendances ne reçoivent plus de correctifs de sécurité.',
        },
        {
          id: 'recurring-bugs',
          lead: 'Les bugs reviennent',
          detail: 'les mêmes problèmes réapparaissent, faute de tests.',
        },
      ],
    },
    deliverables: {
      heading: "Ce que contient l'audit",
      items: [
        'État des versions et des dépendances',
        'Failles de sécurité connues',
        "Qualité du code et de l'architecture",
        'Performance et accessibilité mesurées',
        'Couverture de tests',
        "Plan d'action priorisé et chiffré",
      ],
    },
    steps: {
      heading: 'Comment ça se passe',
      items: [
        {
          id: 'inspect',
          verb: 'Auditer',
          when: 'semaine 1',
          detail:
            "Accès en lecture au code et à l'hébergement. Vous recevez un rapport écrit et une restitution d'une heure.",
        },
        {
          id: 'decide',
          verb: 'Décider',
          when: 'après la restitution',
          detail: 'Vous choisissez les actions. Chaque chantier a son devis ferme.',
        },
        {
          id: 'modernize',
          verb: 'Moderniser',
          when: 'selon le plan',
          detail: 'Montées de version, corrections, tests, par étapes mises en production.',
        },
        {
          id: 'maintain',
          verb: 'Maintenir',
          when: 'au mois, sans engagement',
          detail: 'Mises à jour de sécurité, surveillance, corrections.',
        },
      ],
    },
    pricing: {
      heading: 'Tarif',
      lines: [
        {
          id: 'audit',
          name: 'Audit',
          amount: { kind: 'fixed', eur: REWORK_PRICES.auditEur },
          period: 'once',
          label: formatEur(REWORK_PRICES.auditEur),
          terms: 'Une fois. Rapport écrit et restitution.',
        },
        {
          id: 'works',
          name: 'Chantiers',
          amount: { kind: 'on-request' },
          period: 'once',
          label: 'Sur devis',
          terms: "Chaque chantier issu de l'audit a son devis ferme.",
        },
        {
          id: 'maintenance',
          name: 'Maintenance',
          amount: { kind: 'from', eur: REWORK_PRICES.maintenanceMonthlyFromEur },
          period: 'month',
          label: `Dès ${formatEur(REWORK_PRICES.maintenanceMonthlyFromEur)}/mois`,
          terms: "Sans engagement, montant fixé après l'audit.",
          includes: [
            'Mises à jour de sécurité',
            'Montées de version mineures',
            'Corrections de bugs',
            'Surveillance des erreurs en production',
          ],
        },
      ],
    },
    faq: {
      heading: 'Questions fréquentes',
      items: [
        {
          id: 'foreign-code',
          question: "Vous reprenez du code que vous n'avez pas écrit\u202f?",
          answer:
            "Oui, c'est l'objet de l'audit. Je travaille surtout sur Angular et NestJS\u202f; pour une autre technologie, je vous le dis avant de commencer.",
        },
        {
          id: 'commitment',
          question: "L'audit m'engage pour la suite\u202f?",
          answer: 'Non. Le rapport vous appartient, vous pouvez le confier à un autre prestataire.',
        },
        {
          id: 'rewrite',
          question: 'Faut-il tout refaire\u202f?',
          answer:
            "Rarement. L'audit distingue ce qui se corrige de ce qui doit être réécrit, avec le coût de chaque option.",
        },
        {
          id: 'maintenance-price',
          question: 'Comment est fixé le prix de la maintenance\u202f?',
          answer: `Après l'audit, selon la taille de l'application et le niveau de suivi. À partir de ${formatEur(REWORK_PRICES.maintenanceMonthlyFromEur)}/mois, sans engagement.`,
        },
      ],
    },
    request: {
      subject: 'Audit de mon application',
      intro:
        "Indiquez la technologie si vous la connaissez, depuis quand l'application existe et ce qui vous inquiète.",
    },
  },
  'renfort-freelance': {
    hero: {
      title: 'Un développeur Angular et NestJS dans votre équipe.',
      subtitle:
        "En régie à temps partiel, à distance ou sur site en Île-de-France. Je m'intègre à vos outils et à vos rituels, et je livre en production.",
      ctaLabel: 'Proposer une mission',
    },
    reasons: {
      heading: "Ce que j'apporte",
      items: [
        {
          id: 'full-stack',
          lead: 'Full-stack réel',
          detail:
            'Angular récent (signals, SSR), NestJS, PostgreSQL, Docker. Du composant au déploiement.',
        },
        {
          id: 'autonomous',
          lead: 'Autonome',
          detail: 'je lis la documentation et le code existant avant de poser des questions.',
        },
        {
          id: 'rigorous',
          lead: 'Rigoureux',
          detail: "tests, revues de code, conventions de l'équipe respectées.",
        },
      ],
    },
    deliverables: {
      heading: 'Stack et pratiques',
      items: [
        'Angular 22, signals, SSR',
        'NestJS, API REST',
        'PostgreSQL, Drizzle',
        'Docker, CI/CD',
        'Vitest, tests automatisés',
        'Accessibilité WCAG AA',
      ],
    },
    pricing: {
      heading: 'Conditions',
      lines: [
        {
          id: 'staffing',
          name: 'Régie',
          amount: { kind: 'on-request' },
          period: 'day',
          label: 'TJM sur demande',
          terms: 'Temps partiel, contrat direct ou via Malt. Démarrage sous 2 semaines.',
          link: 'malt',
        },
      ],
    },
    faq: {
      heading: 'Questions fréquentes',
      items: [
        {
          id: 'part-time',
          question: 'Temps plein ou temps partiel\u202f?',
          answer:
            'Temps partiel pour le moment. Pour une mission à temps plein, décrivez-la dans votre message\u00a0: on en parle.',
        },
        {
          id: 'remote',
          question: 'À distance ou sur site\u202f?',
          answer: 'À distance partout en France, sur site en Île-de-France.',
        },
        {
          id: 'contract',
          question: 'Comment contractualiser\u202f?',
          answer:
            'En direct par contrat de prestation, ou via Malt, qui gère le contrat et la facturation.',
        },
      ],
    },
    request: {
      subject: 'Proposition de mission Angular / NestJS',
      intro: 'Indiquez la stack, la durée, le rythme et le mode (distance ou sur site).',
    },
  },
};
