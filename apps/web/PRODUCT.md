# Product

## Register

brand

## Users

**Primary**: Recruteur tech senior, CTO, lead engineer évaluant un profil pour un poste CDI senior (full-stack TypeScript / Angular). Lecture rapide (30s à 2min), souvent sur desktop entre deux entretiens, parfois sur mobile en réunion. Il cherche à répondre à trois questions :

1. Est-ce un ingénieur sérieux ou un junior qui se survend ?
2. La stack et les choix techniques sont-ils alignés avec ce qu'on fait chez nous ?
3. Vaut-il le coup de proposer un échange (ou de lui épargner le test technique générique) ?

**Secondaire**: pair tech (autre dev) qui audite le code GitHub en parallèle pour juger l'architecture et la rigueur d'exécution.

Le site n'est **pas** une vitrine pour clients freelance. Il n'est pas non plus un blog ni un lab. C'est un outil de qualification senior, court et dense.

## Product Purpose

Démontrer en moins de 2 minutes qu'un recruteur a en face de lui un ingénieur full-stack mature, capable de livrer en production seul une application Angular 21 + NestJS + PostgreSQL + observability + SSR avec une qualité non négociable.

Succès = un recruteur qui passe de la home à un message contact (ou à un booking) sans avoir besoin d'un appel filtrage RH intermédiaire. Le portfolio remplace la lettre de motivation, le CV brut et le pre-screen.

## Brand Personality

**Trois mots** : *Rigoureux · Confiant · Soigné*.

- **Rigoureux** — chaque détail est intentionnel (typo, espacement, copy, a11y). Aucune approximation visible. Le site est lui-même un échantillon de code de production.
- **Confiant** — parti pris technique affirmé (Angular 21 zoneless, Clean Architecture, signals, Tailwind v4, SSR), assumé sans surenchère. Pas de "passionate developer" générique.
- **Soigné** — éditorial dans la respiration et la typographie ; premium dans le rendu (dark/light maîtrisés, transitions de route, identité visuelle cohérente).

**Voix** : technique, directe, en français pour le contenu rédactionnel, en anglais pour le code et les labels techniques. Phrases courtes. Aucun superlatif marketing ("amazing", "passionate", "rockstar"). Aucun em-dash. Le ton dit "je sais ce que je fais et je sais pourquoi".

**Émotions cibles** : confiance immédiate, envie d'engager la conversation, sentiment "ce profil sait ce qu'il vaut".

## Anti-references

- **Template Bootstrap junior 2018** : hero centré générique, cards alignées avec icône stock, bleu marine + orange, "About me" avec photo formatée. Disqualifie en 2 secondes.
- **Personal SaaS marketing creux** : "Big hero gradient", faux dashboard mockup, sections "Features", boutons "Get Started" partout. Le portfolio n'a rien à vendre, il qualifie.
- **Awwwards over-design** : cursor custom, smooth scroll bloquant, intro animée, son d'ambiance, scroll-jacking. Impressionne 30s puis fatigue. Mauvais signal pour un poste senior (priorité à l'usage, pas au show).
- **Portfolio designer pur** : grosse typo éditoriale + galerie d'images dominantes où le code devient invisible. Ici, l'ingénieur doit primer sur le directeur artistique.
- **Glassmorphism décoratif partout** : surfaces translucides en réflexe esthétique. Toléré ponctuellement si justifié, jamais comme signature visuelle.

## Design Principles

1. **Practice what you preach** — Le site doit être un échantillon vivant des standards techniques affichés : Lighthouse > 95 partout, a11y WCAG AA strict, SSR + hydration sans regression, bundle initial minimal. Si le portfolio ne tient pas ses propres promesses, le reste perd toute crédibilité.

2. **Densité utile, pas remplissage** — Un recruteur a 90 secondes. Chaque section doit répondre à une question qu'il se pose, dans cet ordre : "qui ?", "quel niveau ?", "quoi en production ?", "comment le contacter ?". Pas de section "fun facts", pas de "my passions". Si une zone n'aide pas à la décision, elle disparaît.

3. **Identité visuelle stable, choix visuels frais** — L'identité indigo + dark/light + Tailwind v4 reste le socle (cohérence cross-pages, mémorabilité). À l'intérieur de ce socle, les variations visuelles peuvent et doivent être audacieuses (layouts, typographie, micro-interactions) tant qu'elles servent la lecture du recruteur.

4. **Le code est visible partout, pas seulement dans GitHub** — Les choix techniques affichés (Angular 21, NestJS, SSR, Drizzle, Sentry) doivent transparaitre dans le rendu : transitions de route fluides, formulaires accessibles, états de chargement nets, erreurs gérées. Le site est sa propre démonstration.

5. **Zéro friction sur la conversion** — Le chemin vers `contact` ou `booking` doit être atteignable depuis n'importe quelle page en un clic visible, sans modal piégeux, sans formulaire à rallonge. La conversion est la fonction primaire de la home.

## Accessibility & Inclusion

- **Cible** : WCAG 2.2 niveau **AA strict**, vérifié en CI via **axe-core** (zéro violation tolérée sur les pages publiques).
- **Lighthouse** : score a11y minimum 95 sur home, about, projects, contact, booking.
- **Navigation clavier** : tous les éléments interactifs atteignables au `Tab`, ordre logique, focus visible non ambigu (`:focus-visible` avec contraste suffisant).
- **Contraste** : 4.5:1 minimum sur texte courant, 3:1 sur composants UI et texte large.
- **Reduced motion** : `prefers-reduced-motion: reduce` respecté — toutes les transitions de route et animations décoratives désactivées.
- **Lecteurs d'écran** : sémantique HTML stricte (`<main>`, `<nav aria-label>`, `<section aria-labelledby>`), landmarks identifiés, `<h1>` unique par page, hiérarchie de headings sans saut.
- **Formulaires** : `<label for>` systématique, `aria-required`, `aria-invalid`, messages d'erreur en `role="alert"`, autofill respecté en dark et light.
- **Daltonisme** : aucune information portée uniquement par la couleur (toujours doublée d'un icône, texte ou pattern).
- **Mobile** : cibles tactiles ≥ 44×44 px, scroll natif (pas de scroll-jacking), zoom utilisateur autorisé.
