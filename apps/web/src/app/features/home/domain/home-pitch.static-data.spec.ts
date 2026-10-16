import { HOME_FAQ, HOME_METHOD, HOME_WHY } from './home-pitch.static-data';

const NBSP = ' ';
const NARROW_NBSP = ' ';

const idsOf = (items: readonly { readonly id: string }[]): readonly string[] =>
  items.map(({ id }) => id);

describe('home pitch copy', () => {
  describe('method', () => {
    it('states the validated heading and lead', () => {
      expect({ heading: HOME_METHOD.heading, lead: HOME_METHOD.lead }).toEqual({
        heading: 'Comment je travaille.',
        lead: `La même méthode qu'en atelier${NBSP}: une gamme claire, des contrôles à chaque étape, rien ne part sans être vérifié.`,
      });
    });

    it('sequences the four validated steps, in order', () => {
      expect(HOME_METHOD.steps.map(({ verb, when, detail }) => ({ verb, when, detail }))).toEqual([
        {
          verb: 'Cadrer',
          when: '30 min, le soir ou le samedi',
          detail: `On parle de votre besoin. Vous recevez un devis ferme${NBSP}: périmètre, délai, prix.`,
        },
        {
          verb: 'Construire',
          when: "selon l'offre",
          detail:
            "Je vous envoie un lien de prévisualisation. Vous voyez avancer le travail, pas un tableau d'avancement.",
        },
        {
          verb: 'Mettre en ligne',
          when: 'après validation',
          detail:
            'Sur votre nom de domaine, en HTTPS, avec les mentions légales et le référencement de base.',
        },
        {
          verb: 'Maintenir',
          when: 'sans engagement',
          detail: 'Hébergement, sauvegardes, mises à jour et petites modifications, au mois.',
        },
      ]);
    });

    it('lists the four validated commitments, in order', () => {
      expect(HOME_METHOD.commitments).toEqual([
        'Prix annoncé avant de commencer, sans dépassement',
        'Code, contenus et nom de domaine à votre nom',
        'Un seul interlocuteur, joignable le soir et le samedi',
        'Vous partez quand vous voulez, avec vos fichiers',
      ]);
    });

    it('offers the booking page from the framing step only', () => {
      expect(HOME_METHOD.steps.map(({ id, link }) => [id, link ?? null])).toEqual([
        ['frame', { label: "Réserver l'appel de cadrage", href: '/rendez-vous' }],
        ['build', null],
        ['launch', null],
        ['maintain', null],
      ]);
    });

    it('identifies each step uniquely', () => {
      expect(new Set(idsOf(HOME_METHOD.steps)).size).toBe(HOME_METHOD.steps.length);
    });
  });

  describe('why work with me', () => {
    it('states the validated heading, quote and attribution', () => {
      expect({ heading: HOME_WHY.heading, quote: HOME_WHY.quote }).toEqual({
        heading: 'Pourquoi travailler avec moi.',
        quote: {
          text: "En usinage aéronautique, une pièce hors tolérance ne part pas. J'applique la même règle au logiciel.",
          attribution: 'Julien Nédellec · tourneur CN et développeur full-stack',
        },
      });
    });

    it('argues with the three validated points, lead then detail, in order', () => {
      expect(HOME_WHY.points.map(({ lead, detail }) => ({ lead, detail }))).toEqual([
        {
          lead: 'Je connais le terrain',
          detail:
            'En chaudronnerie et en usinage aéronautique. Je comprends un atelier, une PME, des délais qui ne glissent pas.',
        },
        {
          lead: 'Je livre seul, de bout en bout',
          detail:
            'Conception, développement, hébergement, maintenance. Personne entre vous et celui qui fait le travail.',
        },
        {
          lead: 'Je tiens mes standards',
          detail: `Sites rapides, accessibles, sécurisés. Ce site en est l'échantillon${NBSP}: vous pouvez le mesurer.`,
        },
      ]);
    });

    it('labels the link to the career page with the validated copy', () => {
      expect(HOME_WHY.aboutLinkLabel).toBe('Mon parcours');
    });

    it('identifies each point uniquely', () => {
      expect(new Set(idsOf(HOME_WHY.points)).size).toBe(HOME_WHY.points.length);
    });
  });

  describe('faq', () => {
    it('states the validated heading and lead', () => {
      expect({ heading: HOME_FAQ.heading, lead: HOME_FAQ.lead }).toEqual({
        heading: 'Questions fréquentes.',
        lead: "Les réponses aux questions qu'on me pose au premier appel.",
      });
    });

    it('asks the seven validated questions, in order', () => {
      expect(HOME_FAQ.items.map(({ question }) => question)).toEqual([
        `Combien de temps pour un site vitrine${NARROW_NBSP}?`,
        `Pourquoi le soir et le week-end${NARROW_NBSP}?`,
        `Le nom de domaine reste à moi${NARROW_NBSP}?`,
        `Et si j'arrête la maintenance${NARROW_NBSP}?`,
        `Comment est fixé le prix d'une évolution d'application${NARROW_NBSP}?`,
        `Vous travaillez hors des Yvelines${NARROW_NBSP}?`,
        `Vous facturez la TVA${NARROW_NBSP}?`,
      ]);
    });

    it.each([
      [
        `Combien de temps pour un site vitrine${NARROW_NBSP}?`,
        `Le délai figure dans le devis. Il dépend des contenus à produire et du nombre de missions en cours${NBSP}: je n'en prends pas plus que je ne peux en tenir.`,
      ],
      [
        `Le nom de domaine reste à moi${NARROW_NBSP}?`,
        'Oui. Il est enregistré à votre nom. Le code vous appartient aussi.',
      ],
      [
        `Et si j'arrête la maintenance${NARROW_NBSP}?`,
        "Vous récupérez les fichiers du site et pouvez l'héberger ailleurs. Aucune pénalité.",
      ],
      [
        `Comment est fixé le prix d'une évolution d'application${NARROW_NBSP}?`,
        "Après un cadrage gratuit de 30 minutes, réservable en ligne, je vous envoie un devis ferme. Ce qui n'y figure pas fait l'objet d'un avenant que vous validez avant.",
      ],
      [
        `Vous travaillez hors des Yvelines${NARROW_NBSP}?`,
        'Oui, à distance partout en France. En Île-de-France, un rendez-vous sur place est possible le samedi.',
      ],
      [
        `Vous facturez la TVA${NARROW_NBSP}?`,
        'Non. Je suis entrepreneur individuel en franchise de TVA, art. 293 B du CGI. Le prix affiché est le prix payé.',
      ],
    ])('answers « %s » with the validated copy', (question, answer) => {
      expect(HOME_FAQ.items.find((item) => item.question === question)?.answer).toBe(answer);
    });

    it('explains the evening and weekend frame by the day job as a CNC turner', () => {
      const answer =
        HOME_FAQ.items.find(
          ({ question }) => question === `Pourquoi le soir et le week-end${NARROW_NBSP}?`,
        )?.answer ?? '';

      expect([
        answer.includes('tourneur CNC'),
        answer.includes('le soir et le week-end'),
        answer.includes('délai annoncé'),
      ]).toEqual([true, true, true]);
    });

    it('links the booking page from the answer about the free framing call only', () => {
      expect(
        HOME_FAQ.items.filter(({ link }) => link !== undefined).map(({ id, link }) => [id, link]),
      ).toEqual([
        ['application-price', { label: 'Réserver le cadrage gratuit', href: '/rendez-vous' }],
      ]);
    });

    it('identifies each question uniquely', () => {
      expect(new Set(idsOf(HOME_FAQ.items)).size).toBe(HOME_FAQ.items.length);
    });
  });
});
