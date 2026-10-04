import type { HomeFaq, HomeMethod, HomeWhy } from './models/home-pitch.model';

export const HOME_METHOD: HomeMethod = {
  heading: 'Comment je travaille.',
  lead: "La même méthode qu'en atelier : une gamme claire, des contrôles à chaque étape, rien ne part sans être vérifié.",
  steps: [
    {
      id: 'frame',
      verb: 'Cadrer',
      when: 'jour 1 · 30 min',
      detail: 'On parle de votre besoin. Vous recevez un devis ferme : périmètre, délai, prix.',
    },
    {
      id: 'build',
      verb: 'Construire',
      when: "selon l'offre",
      detail:
        "Je vous envoie un lien de prévisualisation. Vous voyez avancer le travail, pas un tableau d'avancement.",
    },
    {
      id: 'launch',
      verb: 'Mettre en ligne',
      when: 'après validation',
      detail:
        'Sur votre nom de domaine, en HTTPS, avec les mentions légales et le référencement de base.',
    },
    {
      id: 'maintain',
      verb: 'Maintenir',
      when: 'sans engagement',
      detail: 'Hébergement, sauvegardes, mises à jour et petites modifications, au mois.',
    },
  ],
  commitments: [
    'Prix annoncé avant de commencer, sans dépassement',
    'Code, contenus et nom de domaine à votre nom',
    'Un seul interlocuteur, joignable directement',
    'Vous partez quand vous voulez, avec vos fichiers',
  ],
};

export const HOME_WHY: HomeWhy = {
  heading: 'Pourquoi travailler avec moi.',
  quote: {
    text: "En usinage aéronautique, une pièce hors tolérance ne part pas. J'applique la même règle au logiciel.",
    attribution: 'Julien Nédellec · tourneur CN, puis développeur full-stack',
  },
  points: [
    {
      id: 'field',
      lead: 'Je connais le terrain',
      detail:
        'Vingt ans en métallurgie et en usinage. Je comprends un atelier, une PME, des délais qui ne glissent pas.',
    },
    {
      id: 'end-to-end',
      lead: 'Je livre seul, de bout en bout',
      detail:
        'Conception, développement, hébergement, maintenance. Personne entre vous et celui qui fait le travail.',
    },
    {
      id: 'standards',
      lead: 'Je tiens mes standards',
      detail:
        "Sites rapides, accessibles, sécurisés. Ce site en est l'échantillon : vous pouvez le mesurer.",
    },
  ],
  aboutLinkLabel: 'Mon parcours',
};

export const HOME_FAQ: HomeFaq = {
  heading: 'Questions fréquentes.',
  lead: "Les réponses aux questions qu'on me pose au premier appel.",
  items: [
    {
      id: 'showcase-delay',
      question: 'Combien de temps pour un site vitrine ?',
      answer:
        'Sept jours entre notre premier échange et la mise en ligne, si vous me transmettez textes et photos dans les deux premiers jours.',
    },
    {
      id: 'domain-ownership',
      question: 'Le nom de domaine reste à moi ?',
      answer: 'Oui. Il est enregistré à votre nom. Le code vous appartient aussi.',
    },
    {
      id: 'stop-maintenance',
      question: "Et si j'arrête la maintenance ?",
      answer: "Vous récupérez les fichiers du site et pouvez l'héberger ailleurs. Aucune pénalité.",
    },
    {
      id: 'application-price',
      question: "Comment est fixé le prix d'une application ?",
      answer:
        "Après un cadrage gratuit de 30 minutes, je vous envoie un devis ferme. Ce qui n'y figure pas fait l'objet d'un avenant que vous validez avant.",
    },
    {
      id: 'outside-yvelines',
      question: 'Vous travaillez hors des Yvelines ?',
      answer: 'Oui, à distance partout en France. Je me déplace en Île-de-France.',
    },
    {
      id: 'vat',
      question: 'Vous facturez la TVA ?',
      answer:
        'Non. Je suis entrepreneur individuel en franchise de TVA, art. 293 B du CGI. Le prix affiché est le prix payé.',
    },
  ],
};
