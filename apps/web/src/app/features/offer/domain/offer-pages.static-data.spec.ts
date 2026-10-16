import { formatEur } from './format-eur';
import type { OfferPageContent } from './models/offer.model';
import { OFFERS } from './offer-catalog.static-data';
import { OFFER_PAGES } from './offer-pages.static-data';
import { OFFER_PRICES } from './offer-prices.static-data';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';

const NBSP = '\u00a0';
const NARROW_NBSP = '\u202f';
const EVOLUTION = 'evolution-application';

const pageOf = (slug: string): OfferPageContent | undefined =>
  new Map<string, OfferPageContent>(Object.entries(OFFER_PAGES)).get(slug);

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
        title: 'Le site de votre atelier, à prix fixe et délai annoncé.',
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
        steps: 'Le déroulé',
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

    it('names the four steps with action verbs and their moment, never a day count', () => {
      expect(page.steps?.items.map(({ verb, when }) => ({ verb, when }))).toEqual([
        { verb: 'Échanger', when: 'au départ' },
        { verb: 'Construire', when: 'selon le devis' },
        { verb: 'Ajuster', when: 'après la prévisualisation' },
        { verb: 'Mettre en ligne', when: 'après validation' },
      ]);
    });

    it('holds the first exchange by phone in the evening, or at the workshop on Saturday', () => {
      expect(page.steps?.items[0]?.detail).toBe(
        "20 minutes au téléphone le soir, ou à l'atelier le samedi, vous me donnez photos et liste des machines.",
      );
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
          'Dites-moi le nom de votre atelier et ce que vous usinez. Je vous rappelle sous 48 heures, le soir.',
      });
    });
  });

  describe.each([
    {
      slug: 'site-vitrine',
      heroTitle: 'Votre site vitrine, à prix fixe et délai annoncé.',
      subject: 'Site vitrine pour mon entreprise',
      headings: {
        reasons: 'Pourquoi passer par moi',
        deliverables: 'Ce que contient le site',
        examples: 'Exemples',
        steps: 'Le déroulé',
        pricing: 'Tarif',
        faq: 'Questions fréquentes',
      },
      counts: { reasons: 3, deliverables: 9, examples: 2, steps: 4, lines: 2, faq: 5 },
    },
    {
      slug: EVOLUTION,
      heroTitle: 'Ajouter ce qui manque à votre application, sans tout refaire.',
      subject: 'Évolution de mon application',
      headings: {
        reasons: 'Quand faire appel à moi',
        deliverables: 'Ce qui est livré',
        examples: undefined,
        steps: 'Comment ça se passe',
        pricing: 'Tarif',
        faq: 'Questions fréquentes',
      },
      counts: { reasons: 3, deliverables: 5, examples: undefined, steps: 3, lines: 1, faq: 4 },
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
      heroTitle: 'Une tâche Angular ou NestJS, confiée et livrée.',
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
        faq: 4,
      },
    },
  ])('$slug', ({ slug, heroTitle, subject, headings, counts }) => {
    const page = pageOf(slug);

    it('titles the hero and prefills the request subject with the validated copy', () => {
      expect({ title: page?.hero.title, subject: page?.request.subject }).toEqual({
        title: heroTitle,
        subject,
      });
    });

    it('titles each section it has, and only those', () => {
      expect({
        reasons: page?.reasons?.heading,
        deliverables: page?.deliverables?.heading,
        examples: page?.examples?.heading,
        steps: page?.steps?.heading,
        pricing: page?.pricing.heading,
        faq: page?.faq?.heading,
      }).toEqual(headings);
    });

    it('fills each section with the validated number of items', () => {
      expect({
        reasons: page?.reasons?.items.length,
        deliverables: page?.deliverables?.items.length,
        examples: page?.examples?.items.length,
        steps: page?.steps?.items.length,
        lines: page?.pricing.lines.length,
        faq: page?.faq?.items.length,
      }).toEqual(counts);
    });
  });

  describe('evolution-application', () => {
    const page = pageOf(EVOLUTION);

    it('states the hero copy word for word', () => {
      expect(page?.hero).toEqual({
        title: 'Ajouter ce qui manque à votre application, sans tout refaire.',
        subtitle:
          'Une fonctionnalité, un écran, un export, une correction. Je cadre la demande avec vous et je livre en production, par étapes courtes.',
        ctaLabel: 'Décrire mon besoin',
      });
    });

    it('gives three reasons to call on it, each led by the situation', () => {
      expect(page?.reasons?.items.map(({ lead }) => lead)).toEqual([
        'Une fonctionnalité attend',
        'Une ressaisie vous coûte',
        'La demande est précise',
      ]);
    });

    it('frames, develops in the evening and at the weekend, then delivers', () => {
      expect(page?.steps?.items.map(({ verb, when }) => ({ verb, when }))).toEqual([
        { verb: 'Cadrer', when: 'appel de 30 min' },
        { verb: 'Développer', when: 'selon le devis' },
        { verb: 'Livrer', when: 'après validation' },
      ]);
      expect(page?.steps?.items[1]?.detail).toBe(
        "Le soir et le week-end, sur une branche dédiée, avec un lien de test quand c'est possible.",
      );
    });

    it('prices one evolution from a minimum, with a firm quote after the framing call', () => {
      expect(
        page?.pricing.lines.map(({ name, amount, period, label, terms }) => ({
          name,
          amount,
          period,
          label,
          terms,
        })),
      ).toEqual([
        {
          name: 'Évolution',
          amount: { kind: 'from', eur: 390 },
          period: 'once',
          label: `À partir de ${formatEur(390)}`,
          terms:
            "Devis ferme après le cadrage. Ce qui n'y figure pas fait l'objet d'un avenant que vous validez avant.",
        },
      ]);
    });

    it('answers the four validated questions, in order', () => {
      expect(page?.faq?.items.map(({ question }) => question)).toEqual([
        `Sur quelles technologies intervenez-vous${NARROW_NBSP}?`,
        `Et si la demande grossit en cours de route${NARROW_NBSP}?`,
        `Le cadrage est payant${NARROW_NBSP}?`,
        `Et si le code existant est en mauvais état${NARROW_NBSP}?`,
      ]);
    });

    it('asks what to add or fix, and the technology if known', () => {
      expect(page?.request).toEqual({
        subject: 'Évolution de mon application',
        intro:
          "Décrivez ce que vous voulez ajouter ou corriger, et la technologie de l'application si vous la connaissez.",
      });
    });
  });

  describe('renfort-freelance', () => {
    const page = OFFER_PAGES['renfort-freelance'];

    it('states remote work in the evening and at the weekend, on a delimited task, from the hero', () => {
      expect(page.hero.subtitle).toBe(
        'À distance, le soir et le week-end. Je prends une tâche bien délimitée, je travaille dans votre dépôt et je livre une demande de fusion revue et testée.',
      );
    });

    it('works without a daily meeting', () => {
      expect(page.reasons?.items.find(({ id }) => id === 'autonomous')?.detail).toBe(
        'je lis la documentation et le code existant avant de poser des questions, et je travaille sans réunion quotidienne.',
      );
    });

    it('answers the four validated questions, in order', () => {
      expect(page.faq?.items.map(({ question }) => question)).toEqual([
        `Quelles tâches${NARROW_NBSP}?`,
        `Quel rythme${NARROW_NBSP}?`,
        `À distance ou sur site${NARROW_NBSP}?`,
        `Comment contractualiser${NARROW_NBSP}?`,
      ]);
    });

    it.each([
      [
        `Quel rythme${NARROW_NBSP}?`,
        "Le soir en semaine et le week-end, avec un volume d'heures fixé ensemble au départ. Pas de temps plein ni de présence quotidienne.",
      ],
      [
        `À distance ou sur site${NARROW_NBSP}?`,
        'À distance uniquement. Les échanges se font par écrit, ou en visio le soir.',
      ],
    ])('answers « %s » with the validated copy', (question, answer) => {
      expect(page.faq?.items.find((item) => item.question === question)?.answer).toBe(answer);
    });

    it('asks for the stack, the task, the estimated volume and the deadline', () => {
      expect(page.request.intro).toBe(
        "Indiquez la stack, la tâche, le volume estimé et l'échéance.",
      );
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

    it('prices the reinforcement by the day, on request, for occasional remote missions', () => {
      const lines = OFFER_PAGES['renfort-freelance'].pricing.lines;
      expect(
        lines.map(({ name, amount, period, label }) => ({ name, amount, period, label })),
      ).toEqual([
        {
          name: 'Mission',
          amount: { kind: 'on-request' },
          period: 'day',
          label: 'TJM sur demande',
        },
      ]);
      expect(lines[0]?.terms).toBe(
        'Missions ponctuelles, à distance, le soir et le week-end. Contrat direct ou via Malt.',
      );
    });
  });

  describe('commitments of the offers', () => {
    it.each([
      [
        'site-vitrine',
        'Indiquez votre activité et votre ville. Je vous réponds sous 48 heures, le soir.',
      ],
      [
        'site-atelier',
        'Dites-moi le nom de votre atelier et ce que vous usinez. Je vous rappelle sous 48 heures, le soir.',
      ],
    ] as const)('answers %s requests within 48 hours, in the evening', (slug, intro) => {
      expect(OFFER_PAGES[slug].request.intro).toBe(intro);
    });

    it('dates the showcase site steps by the quote, never by a day count', () => {
      expect(OFFER_PAGES['site-vitrine'].steps?.items.map(({ when }) => when)).toEqual([
        'au départ',
        'selon le devis',
        'après la prévisualisation',
        'après validation',
      ]);
    });

    it('holds the showcase site first exchange by phone, in the evening or on Saturday', () => {
      expect(OFFER_PAGES['site-vitrine'].steps?.items[0]?.detail).toBe(
        "20 minutes au téléphone, le soir ou le samedi. Vous m'envoyez textes, logo et photos.",
      );
    });

    it('commits the application evolution to a free first call and to amendments validated before', () => {
      const answers = collectStrings(pageOf(EVOLUTION)?.faq).join(' ');
      expect(
        ['30 minutes est gratuit', "fait l'objet d'un avenant que vous validez avant"].filter(
          (commitment) => !answers.includes(commitment),
        ),
      ).toEqual([]);
    });

    it('dates the audit by the quote and holds its one hour debrief by video, in the evening or on Saturday', () => {
      const audit = OFFER_PAGES['refonte-maintenance'].steps?.items[0];
      expect({ when: audit?.when, detail: audit?.detail }).toEqual({
        when: 'selon le devis',
        detail:
          "Accès en lecture au code et à l'hébergement. Vous recevez un rapport écrit et une restitution d'une heure en visio, le soir ou le samedi.",
      });
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
