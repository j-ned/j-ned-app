# Product

## Register

brand

## Users

Le site est le coin personnel de Julien Nédellec, tourneur CN de haute précision dans l'aéronautique, qui code pour le plaisir. Le développement web est un loisir : aucune activité commerciale (spec 029), aucune recherche d'emploi, et depuis le 2026-10-21 un ton amical au tutoiement (spec 031). Il sert deux publics, dans cet ordre.

**1. Développeur (public principal)** : un pair qui arrive presque toujours par une recherche Google sur un problème technique précis (Angular, NestJS, PostgreSQL, auto-hébergement), et atterrit directement sur un article. Il veut une réponse exacte, du code qui tourne pour de vrai, les compromis assumés. Ses questions : est-ce que ça règle mon problème, est-ce que l'auteur sait de quoi il parle, qu'est-ce qu'il a écrit d'autre ?

**2. Curieux (public secondaire)** : quelqu'un qui découvre le parcours de l'atelier au code, ou le métier de tourneur CN (spec 032). Il veut comprendre sans jargon inutile. Le site ne vise pas les recruteurs : le CV reste téléchargeable comme pièce du parcours, sans aucun signal de disponibilité.

Le blog est le moteur du site : c'est par lui qu'arrive le trafic organique. Les réalisations et le parcours en sont la preuve.

## Product Purpose

Partager ce que Julien construit et apprend, et le rendre **trouvable**. Le site réussit quand :

1. un développeur trouve un article par une recherche, obtient sa réponse, puis lit un deuxième article ou ouvre une réalisation ;
2. un curieux qui cherche le nom trouve le parcours, les projets et l'atelier en un clic depuis n'importe quelle page.

Le formulaire de contact reste ouvert à tous (question sur un article, échange entre pairs, prise de contact), sans qualification commerciale.

**SEO, priorité du site** : chaque page publique est rendue côté serveur avec son titre, sa description, son canonical et ses données structurées (`Person`, `ProfilePage`, `BlogPosting`, `BreadcrumbList`). La cible est la longue traîne technique (une question précise, un article qui y répond), pas les requêtes génériques du type « développeur Angular », que les plateformes et les sites d'emploi occupent. Pas de ciblage local : la zone géographique n'a plus d'objet.

## Brand Personality

**Marque** : nom propre, « Julien Nédellec ».

**Trois mots** : *Rigoureux · Curieux · Soigné*.

- **Rigoureux** : la règle de l'atelier appliquée au logiciel, « une pièce hors tolérance ne part pas ». Chaque détail est intentionnel (typo, espacement, a11y, tests). Le site est lui-même un échantillon du travail.
- **Curieux** : autodidacte, il lit la doc et les sources jusqu'à comprendre. Les articles racontent le chemin réel, erreurs comprises.
- **Soigné** : chaleureux sans être brouillon. Couleurs franches et formes rondes (« Copeaux vifs », spec 033), clair et sombre maîtrisés, typographie de lecture d'abord. Le dessin technique (cartouche, cotes, tampon) reste en clin d'œil : le métier d'origine, pas un décor.

**Voix** : amicale et directe, en français, au tutoiement. Julien parle en « je » de ce qu'il construit et tutoie le lecteur comme un collègue d'atelier. Phrases courtes, humour léger bienvenu, jamais au détriment de la précision : chaque fait reste vérifiable. Le vocabulaire technique est le bienvenu. Aucun superlatif. Aucun em-dash. Le ton dit « voilà ce que j'ai construit, pourquoi, et ce que j'en ai appris, erreurs comprises ».

**Émotions cibles** : « enfin une réponse précise », envie de lire l'article suivant, l'impression d'échanger avec un passionné qui sait de quoi il parle.

## Anti-references

- **Vitrine commerciale** : prix, offres, « Décrire mon projet », « Réservez un appel », argumentaire « Pourquoi moi ». Le site ne vend rien.
- **Ton corporate** : « nous », formules de plaquette, vouvoiement distant. Le site est tenu par une personne qui tutoie son lecteur.
- **Signal de recherche d'emploi** : « disponible », « open to work », bloc « Vous recrutez ? ». Julien n'est pas en recherche.
- **Template portfolio générique** : hero centré « Hi, I'm a passionate developer », barres de compétences en pourcentage, nuage de logos de technologies.
- **Preuves inventées** : faux témoignages, chiffres non vérifiables, projets gonflés. Une démo est libellée « Démo ».
- **Awwwards over-design** : cursor custom, scroll-jacking, intro animée. Le lecteur veut lire.
- **Article SEO creux** : contenu étiré pour placer des mots-clés, réponse noyée sous une introduction. Un article répond tôt et prouve par le code.
- **Glassmorphism décoratif partout** : toléré ponctuellement si justifié, jamais comme signature.

## Design Principles

1. **Practice what you preach** : le site tient ce qu'il montre. Lighthouse > 95 partout, a11y WCAG AA strict, SSR et prérendu sans régression, bundle initial minimal.

2. **Chaque section répond à une question du lecteur** : « qui es-tu ? », « qu'est-ce que tu as construit ? », « qu'est-ce que tu as écrit ? », « c'est quoi ton métier ? », « comment te joindre ? ». Une zone qui n'y répond pas disparaît.

3. **Un atelier coloré, pas une console** : un seul accent orange, deux registres égaux (Sable clair, Nuit sombre), formes rondes, Tailwind v4 comme socle (`DESIGN.md`, ADR-0030). La fantaisie reste retenue : un autocollant décoratif par écran, le dessin technique (cartouche pour les fiches, cotes pour les mesures) en clin d'œil.

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
