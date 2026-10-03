# Product

## Register

brand

## Users

Le site sert trois publics. Les deux premiers partagent la home, la navigation et le ton. Le troisième a sa propre page.

**1. Recruteur tech (CDI)** : recruteur tech senior, CTO, lead engineer évaluant un profil pour un poste CDI senior (full-stack TypeScript / Angular) en Île-de-France. Lecture rapide (30s à 2min), souvent sur desktop entre deux entretiens, parfois sur mobile en réunion. Il cherche à répondre à trois questions :

1. Est-ce un ingénieur sérieux ou un junior qui se survend ?
2. La stack et les choix techniques sont-ils alignés avec ce qu'on fait chez nous ?
3. Vaut-il le coup de proposer un échange (ou de lui épargner le test technique générique) ?

**2. Client tech (freelance via Malt)** : CTO, lead engineer ou fondateur qui cherche un développeur Angular / NestJS pour une mission. Il arrive souvent depuis le profil Malt, ou y repart pour contractualiser. Mêmes questions que le recruteur, plus une : est-il disponible, et sous quelle forme ? La réponse est visible sous le CTA du hero (`SITE_IDENTITY.availability`).

**Lecteur associé** : pair tech (autre dev) qui audite le code GitHub en parallèle pour juger l'architecture et la rigueur d'exécution, pour le compte de l'un ou l'autre.

**3. Gérant d'atelier mécanique (page d'offre)** : gérant ou responsable commercial d'un atelier d'usinage, de décolletage ou de mécanique de précision des Yvelines, 5 à 50 salariés. Peu technique, il lit sur téléphone entre deux réglages. Il ne cherche pas un ingénieur : il veut un site qui montre son savoir-faire à un acheteur, à un prix fixe et sans surprise. Il arrive par la prospection directe (visite, téléphone, email, LinkedIn), pas par la home.

Le site n'est ni un blog ni un lab. Pour les publics 1 et 2, c'est un outil de qualification senior, court et dense. Pour le public 3, c'est une page d'offre commerciale, isolée du reste.

## Product Purpose

**Site principal (publics 1 et 2)** : démontrer en moins de 2 minutes qu'un recruteur ou un client a en face de lui un ingénieur full-stack mature, capable de livrer en production seul une application Angular + NestJS + PostgreSQL + observability + SSR avec une qualité non négociable.

Succès = un recruteur ou un client qui passe de la home à un message contact, à un booking ou au profil Malt, sans appel de filtrage intermédiaire. Le portfolio remplace la lettre de motivation, le CV brut et le pre-screen.

**Page d'offre `/offre-site-industrie` (public 3)** : présenter l'offre « Site pro en 7 jours » (690 €, prix final, maintenance optionnelle à 29 €/mois) et recueillir la demande via le formulaire de contact existant, sujet prérempli. Le site est désormais édité par un entrepreneur individuel (SIRET dans `SITE_IDENTITY.business`), les mentions légales sont en version professionnelle. Détail : `specs/007-offre-site-industrie.md`.

Succès = un gérant qui lit l'offre sur son téléphone et envoie une demande depuis la page.

**Séparation des publics** : la page d'offre vit à part. Elle n'apparaît ni sur la home, ni dans le menu principal. Son seul point d'entrée interne est un lien discret dans le pied de page, à côté des liens légaux (« Sites pour ateliers »). Elle parle le vocabulaire du métier (tolérances, parc machines, EN 9100), pas celui du web. La voix reste la même partout : phrases courtes, aucun superlatif, aucun em-dash. Elle ne cite jamais l'employeur de Julien.

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
