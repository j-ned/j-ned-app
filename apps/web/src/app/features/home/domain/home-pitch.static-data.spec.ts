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
          when: 'jour 1 · 30 min',
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
        'Un seul interlocuteur, joignable directement',
        'Vous partez quand vous voulez, avec vos fichiers',
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
          attribution: 'Julien Nédellec · tourneur CN, puis développeur full-stack',
        },
      });
    });

    it('argues with the three validated points, lead then detail, in order', () => {
      expect(HOME_WHY.points.map(({ lead, detail }) => ({ lead, detail }))).toEqual([
        {
          lead: 'Je connais le terrain',
          detail:
            'Vingt ans en métallurgie et en usinage. Je comprends un atelier, une PME, des délais qui ne glissent pas.',
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

    it('answers the six validated questions, in order', () => {
      expect(HOME_FAQ.items.map(({ question, answer }) => ({ question, answer }))).toEqual([
        {
          question: `Combien de temps pour un site vitrine${NARROW_NBSP}?`,
          answer:
            'Sept jours entre notre premier échange et la mise en ligne, si vous me transmettez textes et photos dans les deux premiers jours.',
        },
        {
          question: `Le nom de domaine reste à moi${NARROW_NBSP}?`,
          answer: 'Oui. Il est enregistré à votre nom. Le code vous appartient aussi.',
        },
        {
          question: `Et si j'arrête la maintenance${NARROW_NBSP}?`,
          answer:
            "Vous récupérez les fichiers du site et pouvez l'héberger ailleurs. Aucune pénalité.",
        },
        {
          question: `Comment est fixé le prix d'une application${NARROW_NBSP}?`,
          answer:
            "Après un cadrage gratuit de 30 minutes, je vous envoie un devis ferme. Ce qui n'y figure pas fait l'objet d'un avenant que vous validez avant.",
        },
        {
          question: `Vous travaillez hors des Yvelines${NARROW_NBSP}?`,
          answer: 'Oui, à distance partout en France. Je me déplace en Île-de-France.',
        },
        {
          question: `Vous facturez la TVA${NARROW_NBSP}?`,
          answer:
            'Non. Je suis entrepreneur individuel en franchise de TVA, art. 293 B du CGI. Le prix affiché est le prix payé.',
        },
      ]);
    });

    it('identifies each question uniquely', () => {
      expect(new Set(idsOf(HOME_FAQ.items)).size).toBe(HOME_FAQ.items.length);
    });
  });
});
