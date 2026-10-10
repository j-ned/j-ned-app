import { formatEur } from './format-eur';
import { OFFERS } from './offer-catalog.static-data';
import { OFFER_PAGES } from './offer-pages.static-data';
import { OFFER_PRICES } from './offer-prices.static-data';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';

const NBSP = '\u00a0';

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
        subtitle: `${SITE_IDENTITY.journey} Je crée des sites qui montrent à un acheteur ce que vous savez usiner, en trente secondes.`,
        ctaLabel: 'Demander mon site',
      });
    });

    it('titles each section in the words of a workshop owner', () => {
      expect({
        reasons: page.reasons?.heading,
        deliverables: page.deliverables?.heading,
        examples: page.examples?.heading,
        steps: page.steps?.heading,
        pricing: page.pricing.heading,
        faq: page.faq?.heading,
      }).toEqual({
        reasons: "Pourquoi un tourneur plutôt qu'une agence",
        deliverables: 'Ce que contient le site',
        examples: 'Exemples',
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

    it('shows the Delaunay Précision demo with the validated copy, an honest lead and a versioned image', () => {
      expect(page.examples).toEqual({
        heading: 'Exemples',
        lead: 'Des sites de démonstration, construits pour montrer le résultat. Les entreprises sont fictives.',
        items: [
          {
            id: 'site-industrie',
            name: 'Delaunay Précision',
            sector: "Atelier d'usinage CN à Élancourt",
            illustrates: `Ce qu'un acheteur vérifie en trente secondes${NBSP}: savoir-faire, parc machines, certifications et demande de devis.`,
            url: 'https://site-industrie.nedellec-julien.fr/',
            image: {
              file: '/demos/site-industrie-20261005',
              alt: `Page d'accueil de Delaunay Précision sur ordinateur et sur téléphone${NBSP}: un bandeau Site de démonstration, le titre «${NBSP}Vos pièces de précision, usinées au centième près${NBSP}» et un bouton Demander un devis.`,
            },
          },
        ],
      });
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
          terms: 'Une fois. 50\u00a0% à la commande, 50\u00a0% à la mise en ligne.',
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
          question: "J'ai déjà un site, ça vaut le coup\u202f?",
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
          question: 'Le nom de domaine reste à moi\u202f?',
          answer: 'Oui. Il est enregistré à votre nom, vous en restez propriétaire.',
        },
        {
          question: "Et si j'arrête la maintenance\u202f?",
          answer: "Vous récupérez les fichiers du site et vous l'hébergez où vous voulez.",
        },
      ]);
    });

    it('addresses the request form to a workshop owner, with a prefilled subject', () => {
      expect(page.request).toEqual({
        subject: 'Site pro pour mon atelier',
        intro:
          'Dites-moi le nom de votre atelier et ce que vous usinez. Je vous rappelle sous 48 heures ouvrées.',
      });
    });
  });

  describe.each([
    {
      slug: 'site-vitrine',
      heroTitle: 'Votre site vitrine, en ligne en 7 jours.',
      subject: 'Site vitrine pour mon entreprise',
      headings: {
        reasons: 'Pourquoi passer par moi',
        deliverables: 'Ce que contient le site',
        examples: 'Exemples',
        steps: 'Le déroulé en 7 jours',
        pricing: 'Tarif',
        faq: 'Questions fréquentes',
      },
      counts: { reasons: 3, deliverables: 9, examples: 2, steps: 4, lines: 2, faq: 5 },
    },
    {
      slug: 'application-metier',
      heroTitle: 'Une application taillée pour votre façon de travailler.',
      subject: 'Application métier sur mesure',
      headings: {
        reasons: 'Ce qui change avec une application sur mesure',
        deliverables: 'Ce qui est livré',
        examples: undefined,
        steps: 'Comment ça se passe',
        pricing: 'Tarif',
        faq: 'Questions fréquentes',
      },
      counts: { reasons: 3, deliverables: 8, examples: undefined, steps: 4, lines: 2, faq: 5 },
    },
    {
      slug: 'refonte-maintenance',
      heroTitle: 'Votre application existe. Je la reprends, je la sécurise, je la fais durer.',
      subject: 'Audit de mon application',
      headings: {
        reasons: 'Quand faire appel à moi',
        deliverables: "Ce que contient l'audit",
        examples: undefined,
        steps: 'Comment ça se passe',
        pricing: 'Tarif',
        faq: 'Questions fréquentes',
      },
      counts: { reasons: 3, deliverables: 6, examples: undefined, steps: 4, lines: 3, faq: 4 },
    },
    {
      slug: 'renfort-freelance',
      heroTitle: 'Un développeur Angular et NestJS dans votre équipe.',
      subject: 'Proposition de mission Angular / NestJS',
      headings: {
        reasons: "Ce que j'apporte",
        deliverables: 'Stack et pratiques',
        examples: undefined,
        steps: undefined,
        pricing: 'Conditions',
        faq: 'Questions fréquentes',
      },
      counts: {
        reasons: 3,
        deliverables: 6,
        examples: undefined,
        steps: undefined,
        lines: 1,
        faq: 3,
      },
    },
  ] as const)('$slug', ({ slug, heroTitle, subject, headings, counts }) => {
    const page = OFFER_PAGES[slug];

    it('titles the hero and prefills the request subject with the validated copy', () => {
      expect({ title: page.hero.title, subject: page.request.subject }).toEqual({
        title: heroTitle,
        subject,
      });
    });

    it('titles each section it has, and only those', () => {
      expect({
        reasons: page.reasons?.heading,
        deliverables: page.deliverables?.heading,
        examples: page.examples?.heading,
        steps: page.steps?.heading,
        pricing: page.pricing.heading,
        faq: page.faq?.heading,
      }).toEqual(headings);
    });

    it('fills each section with the validated number of items', () => {
      expect({
        reasons: page.reasons?.items.length,
        deliverables: page.deliverables?.items.length,
        examples: page.examples?.items.length,
        steps: page.steps?.items.length,
        lines: page.pricing.lines.length,
        faq: page.faq?.items.length,
      }).toEqual(counts);
    });
  });

  it('shows Coaching Life then Le Vieux Comptoir on the showcase site, with the validated copy and versioned images', () => {
    expect(OFFER_PAGES['site-vitrine'].examples).toEqual({
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
            alt: `Page d'accueil de Coaching Life sur ordinateur et sur téléphone${NBSP}: un bandeau Site de démonstration, le titre «${NBSP}Révélez votre plein potentiel intérieur${NBSP}», un bouton Prendre rendez-vous et la photo d'une coach dans un salon lumineux.`,
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
            alt: `Page d'accueil du Vieux Comptoir sur ordinateur et sur téléphone${NBSP}: un bandeau Site de démonstration, une salle de brasserie aux lustres anciens, le titre «${NBSP}L'Âme de Paris${NBSP}» et les boutons Réserver une table et Découvrir la carte.`,
          },
        },
      ],
    });
  });

  describe('price lines of the new offers', () => {
    it('prices the showcase site like the workshop: fixed creation, fixed monthly maintenance', () => {
      const prices = OFFER_PRICES['site-vitrine'];
      const lines = OFFER_PAGES['site-vitrine'].pricing.lines;
      expect(
        lines.map(({ name, amount, period, label, terms }) => ({
          name,
          amount,
          period,
          label,
          terms,
        })),
      ).toEqual([
        {
          name: 'Création',
          amount: { kind: 'fixed', eur: prices.creationEur },
          period: 'once',
          label: formatEur(prices.creationEur),
          terms: 'Une fois. 50\u00a0% à la commande, 50\u00a0% à la mise en ligne.',
        },
        {
          name: 'Maintenance',
          amount: { kind: 'fixed', eur: prices.maintenanceMonthlyEur },
          period: 'month',
          label: `${formatEur(prices.maintenanceMonthlyEur)}/mois`,
          terms: 'Par mois, sans engagement.',
        },
      ]);
      expect(lines.map(({ includes }) => includes?.length)).toEqual([undefined, 5]);
    });

    it('prices the business application from a minimum, with a maintenance from a monthly minimum', () => {
      const prices = OFFER_PRICES['application-metier'];
      expect(
        OFFER_PAGES['application-metier'].pricing.lines.map(({ name, amount, period, label }) => ({
          name,
          amount,
          period,
          label,
        })),
      ).toEqual([
        {
          name: 'Projet',
          amount: { kind: 'from', eur: prices.projectFromEur },
          period: 'once',
          label: `À partir de ${formatEur(prices.projectFromEur)}`,
        },
        {
          name: 'Maintenance',
          amount: { kind: 'from', eur: prices.maintenanceMonthlyFromEur },
          period: 'month',
          label: `Dès ${formatEur(prices.maintenanceMonthlyFromEur)}/mois`,
        },
      ]);
    });

    it('prices the audit fixed, the works on quote and the maintenance from a monthly minimum', () => {
      const prices = OFFER_PRICES['refonte-maintenance'];
      const lines = OFFER_PAGES['refonte-maintenance'].pricing.lines;
      expect(
        lines.map(({ name, amount, period, label }) => ({ name, amount, period, label })),
      ).toEqual([
        {
          name: 'Audit',
          amount: { kind: 'fixed', eur: prices.auditEur },
          period: 'once',
          label: formatEur(prices.auditEur),
        },
        { name: 'Chantiers', amount: { kind: 'on-request' }, period: 'once', label: 'Sur devis' },
        {
          name: 'Maintenance',
          amount: { kind: 'from', eur: prices.maintenanceMonthlyFromEur },
          period: 'month',
          label: `Dès ${formatEur(prices.maintenanceMonthlyFromEur)}/mois`,
        },
      ]);
      expect(lines.map(({ includes }) => includes?.length)).toEqual([undefined, undefined, 4]);
    });

    it('prices the reinforcement by the day, on request, part time only', () => {
      const lines = OFFER_PAGES['renfort-freelance'].pricing.lines;
      expect(
        lines.map(({ name, amount, period, label }) => ({ name, amount, period, label })),
      ).toEqual([
        { name: 'Régie', amount: { kind: 'on-request' }, period: 'day', label: 'TJM sur demande' },
      ]);
      expect(lines[0]?.terms).toMatch(/^Temps partiel/);
    });
  });

  describe('commitments of the new offers', () => {
    it('answers showcase site requests within 24 working hours', () => {
      expect(OFFER_PAGES['site-vitrine'].request.intro).toContain('sous 48 heures ouvrées');
    });

    it('delivers the showcase site on day 7', () => {
      expect(OFFER_PAGES['site-vitrine'].steps?.items.map(({ when }) => when)).toEqual([
        'jour 1',
        'jours 2 à 5',
        'jour 6',
        'jour 7',
      ]);
    });

    it('commits the business application to a first version in 4 to 8 weeks, a free first call and hosting in France', () => {
      const answers = collectStrings(OFFER_PAGES['application-metier'].faq).join(' ');
      expect(
        ['4 à 8 semaines', '30 minutes est gratuit', 'Hébergement en France'].filter(
          (commitment) => !answers.includes(commitment),
        ),
      ).toEqual([]);
    });

    it('closes the audit with a one hour debrief', () => {
      expect(collectStrings(OFFER_PAGES['refonte-maintenance'].steps).join(' ')).toContain(
        "restitution d'une heure",
      );
    });

    it('offers the reinforcement part time only, from the hero on', () => {
      expect(OFFER_PAGES['renfort-freelance'].hero.subtitle).toContain('à temps partiel');
    });
  });

  it.each(Object.entries(OFFER_PAGES))(
    'gives each reason, demo, step, question and price line of %s a distinct id',
    (_slug, page) => {
      const ids = [
        ...(page.reasons?.items ?? []),
        ...(page.examples?.items ?? []),
        ...(page.steps?.items ?? []),
        ...(page.faq?.items ?? []),
        ...page.pricing.lines,
      ].map(({ id }) => id);
      expect(new Set(ids).size).toBe(ids.length);
    },
  );

  it('names every demo image after its capture date, so that a new capture never hits a stale cache', () => {
    const files = Object.values(OFFER_PAGES).flatMap(
      (page) => page.examples?.items.map(({ image }) => image.file) ?? [],
    );
    expect(files.length).toBeGreaterThan(0);
    expect(files.filter((file) => !/^\/demos\/[a-z0-9-]+-\d{8}$/.test(file))).toEqual([]);
  });

  it('never names a demo, its site or its image in the offer summaries read by the home, the header and the footer', () => {
    const demoStrings = Object.values(OFFER_PAGES).flatMap(
      (page) =>
        page.examples?.items.flatMap(({ name, url, image }) => [name, url, image.file]) ?? [],
    );
    const summaries = collectStrings(OFFERS);

    expect(demoStrings).toHaveLength(9);
    expect(demoStrings.filter((value) => summaries.some((text) => text.includes(value)))).toEqual(
      [],
    );
  });

  it('contains no em dash anywhere in the offers copy', () => {
    expect(collectStrings([OFFERS, OFFER_PAGES]).filter((text) => text.includes('—'))).toEqual([]);
  });
});
