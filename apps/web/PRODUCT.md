# Product

## Register

brand

## Users

Le site est le portfolio personnel de Julien Nédellec, tourneur CN de haute précision dans l'aéronautique et développeur web full-stack par passion. Ce n'est plus une activité commerciale : aucune offre, aucun tarif, aucune prise de rendez-vous (repositionnement du 2026-10-20, spec 029). Il sert deux publics, dans cet ordre.

**1. Développeur (public principal)** : un pair qui arrive presque toujours par une recherche Google sur un problème technique précis (Angular, NestJS, PostgreSQL, auto-hébergement), et atterrit directement sur un article. Il veut une réponse exacte, du code qui tourne en production, les compromis assumés. Ses questions : est-ce que ça règle mon problème, est-ce que l'auteur sait de quoi il parle, qu'est-ce qu'il a écrit d'autre ?

**2. Recruteur ou tech lead (public secondaire)** : arrive par le nom, LinkedIn ou GitHub. Il veut vérifier en quelques minutes le niveau réel : projets en production, choix techniques argumentés, parcours, CV. Ses questions : qu'est-ce qu'il a construit, comment il raisonne, d'où il vient ? Julien n'est pas en recherche : le site ne porte **aucun signal de disponibilité** (ni bloc « Vous recrutez ? », ni « disponible en CDI », ni bouton d'embauche). Le CV reste téléchargeable comme pièce du parcours, pas comme candidature.

Le blog est le moteur du site : c'est par lui qu'arrive le trafic organique. Les réalisations et le parcours en sont la preuve.

## Product Purpose

Partager ce que Julien construit et apprend, et le rendre **trouvable**. Le site réussit quand :

1. un développeur trouve un article par une recherche, obtient sa réponse, puis lit un deuxième article ou ouvre une réalisation ;
2. un recruteur ou un pair qui cherche le nom trouve projets, parcours et CV en un clic depuis n'importe quelle page.

Le formulaire de contact reste ouvert à tous (question sur un article, échange entre pairs, prise de contact), sans qualification commerciale.

**SEO, priorité du site** : chaque page publique est rendue côté serveur avec son titre, sa description, son canonical et ses données structurées (`Person`, `ProfilePage`, `BlogPosting`, `BreadcrumbList`). La cible est la longue traîne technique (une question précise, un article qui y répond), pas les requêtes génériques du type « développeur Angular », que les plateformes et les sites d'emploi occupent. Pas de ciblage local : la zone géographique n'a plus d'objet.

## Brand Personality

**Marque** : nom propre, « Julien Nédellec ».

**Trois mots** : *Rigoureux · Curieux · Soigné*.

- **Rigoureux** : la règle de l'atelier appliquée au logiciel, « une pièce hors tolérance ne part pas ». Chaque détail est intentionnel (typo, espacement, a11y, tests). Le site est lui-même un échantillon du travail.
- **Curieux** : autodidacte, il lit la doc et les sources jusqu'à comprendre. Les articles racontent le chemin réel, erreurs comprises.
- **Soigné** : éditorial dans la respiration et la typographie, clair et sombre maîtrisés. Le motif visuel vient du dessin technique (cartouche, cotes) : le métier d'origine, pas un décor.

**Voix** : directe, en français, phrases courtes. Le vocabulaire technique est le bienvenu partout : le lecteur principal est développeur. Aucun superlatif. Aucun em-dash. Le ton dit « voici ce que j'ai construit, pourquoi, et ce que ça m'a appris ».

**Émotions cibles** : « enfin une réponse précise », envie de lire l'article suivant, confiance dans le sérieux de l'auteur.

## Anti-references

- **Vitrine commerciale** : prix, offres, « Décrire mon projet », « Réservez un appel », argumentaire « Pourquoi moi ». Le site ne vend rien.
- **Signal de recherche d'emploi** : « disponible », « open to work », bloc « Vous recrutez ? ». Julien n'est pas en recherche.
- **Template portfolio générique** : hero centré « Hi, I'm a passionate developer », barres de compétences en pourcentage, nuage de logos de technologies.
- **Preuves inventées** : faux témoignages, chiffres non vérifiables, projets gonflés. Une démo est libellée « Démo ».
- **Awwwards over-design** : cursor custom, scroll-jacking, intro animée. Le lecteur veut lire.
- **Article SEO creux** : contenu étiré pour placer des mots-clés, réponse noyée sous une introduction. Un article répond tôt et prouve par le code.
- **Glassmorphism décoratif partout** : toléré ponctuellement si justifié, jamais comme signature.

## Design Principles

1. **Practice what you preach** : le site tient ce qu'il montre. Lighthouse > 95 partout, a11y WCAG AA strict, SSR et prérendu sans régression, bundle initial minimal.

2. **Chaque section répond à une question du lecteur** : « qui es-tu ? », « qu'est-ce que tu as construit ? », « qu'est-ce que tu as écrit ? », « comment te joindre ? ». Une zone qui n'y répond pas disparaît.

3. **Identité visuelle stable** : l'identité indigo + clair/sombre + Tailwind v4 reste le socle. Le motif du dessin technique (cartouche pour les fiches, cotes pour les mesures) est la seule signature, utilisée avec retenue.

4. **Le contenu d'abord** : la typographie de lecture (articles, fiches projet) prime sur la décoration. Le code est lisible, coloré, copiable.

5. **Trouvable par construction** : une page publique sans titre, description, canonical et données structurées rendus côté serveur est une régression, au même titre qu'une violation a11y.

## Accessibility & Inclusion

- **Cible** : WCAG 2.2 niveau **AA strict**, vérifié en CI via **axe-core** (zéro violation tolérée sur les pages publiques).
- **Lighthouse** : score a11y minimum 95 sur la home, le blog (liste et article), les réalisations (liste et fiche) et le parcours.
- **Navigation clavier** : tous les éléments interactifs atteignables au `Tab`, ordre logique, focus visible non ambigu (`:focus-visible` avec contraste suffisant).
- **Contraste** : 4.5:1 minimum sur texte courant, 3:1 sur composants UI et texte large.
- **Reduced motion** : `prefers-reduced-motion: reduce` respecté — toutes les transitions de route et animations décoratives désactivées.
- **Lecteurs d'écran** : sémantique HTML stricte (`<main>`, `<nav aria-label>`, `<section aria-labelledby>`), landmarks identifiés, `<h1>` unique par page, hiérarchie de headings sans saut.
- **Formulaires** : `<label for>` systématique, `aria-required`, `aria-invalid`, messages d'erreur en `role="alert"`, autofill respecté en dark et light.
- **Daltonisme** : aucune information portée uniquement par la couleur (toujours doublée d'un icône, texte ou pattern).
- **Mobile** : cibles tactiles ≥ 44×44 px, scroll natif (pas de scroll-jacking), zoom utilisateur autorisé.
