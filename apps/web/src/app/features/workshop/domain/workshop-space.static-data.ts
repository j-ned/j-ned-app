import type { WorkshopSpace } from './models/workshop-space.model';

export const WORKSHOP_SPACE: WorkshopSpace = {
  heading: "L'atelier",
  intro: [
    "À l'atelier comme dans le code, une règle tient tout : une pièce hors tolérance ne part pas.",
    "Cet espace rassemble ce que j'apprends derrière mon tour CN, mis en forme en outils et en fiches que tu peux utiliser. Que tu sois dev curieux ou usineur qui débute, prends ce qui te sert.",
  ],
  toolsHeading: 'Les outils',
  tools: [
    {
      id: 'insert-guide',
      overline: 'Outil',
      title: 'Guide des plaquettes',
      summary:
        "Choisis ta matière\u00a0: le guide te donne les plaquettes que j'utilise, opération par opération.",
      path: '/atelier/plaquettes',
    },
  ],
};
