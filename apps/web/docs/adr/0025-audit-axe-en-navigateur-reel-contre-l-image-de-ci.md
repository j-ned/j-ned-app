# ADR-0025 — Audit axe en navigateur réel contre l'image de CI, zéro violation, sans couche axe dans Vitest

- **Statut** : accepté (2026-10-11, arbitrages du propriétaire en fin de spec 023), appliqué par la spec 023
- **Date** : 2026-10-11
- **Contexte spec** : `specs/023-axe-automatise.md`
- **Préserve** : ADR-0024 (image unique nginx + Node, doublure `ci/api-stub`), ADR-0003 (utilities Tailwind)

## Context

CLAUDE.md exige WCAG AA et « doit passer AXE », mais aucun outil axe n'est installé : chaque revue a
vérifié l'accessibilité à la main, et les régressions de contraste n'ont été attrapées qu'après coup
(#208, #210). Le propriétaire veut une vérification automatique à chaque PR.

Faits vérifiés le 2026-10-11 :

1. **happy-dom ne permet pas la règle `color-contrast`.** axe-core 4.14 exécuté dans happy-dom 20.9
   (l'environnement de `pnpm test`) sur un paragraphe `#bbb` sur `#fff` : `button-name` et
   `image-alt` sont bien en violation, mais `color-contrast` tombe en *incomplete* avec
   `error-occurred` : « Cannot read properties of null (reading 'canvas') Skipping color-contrast
   rule ». Même constat documenté pour JSDOM par jest-axe (« Color contrast checks do not work in
   JSDOM so are turned off »). happy-dom ne calcule pas non plus la mise en page : `target-size`
   (WCAG 2.2 AA), le recouvrement et la visibilité réelle ne sont pas évaluables. Or le contraste est
   précisément la classe de régression vécue sur ce repo.
2. **Pas d'intégration Vitest maintenue.** `@axe-core/vitest` n'existe pas sur npm (404, alors que la
   skill `angular-accessibility` le cite) ; `vitest-axe` est en 0.1.0, sans évolution.
3. **Playwright documente le chemin** (`playwright.dev/docs/accessibility-testing`) : `@axe-core/playwright`,
   `withTags`, fixture partagée, `testInfo.attach` des résultats complets ; il prévient que l'audit
   automatique ne détecte qu'une partie des problèmes. Sa page CI déconseille de mettre en cache les
   binaires du navigateur (restauration aussi longue que le téléchargement, dépendances système non
   cachables).
4. **Le navigateur de la page vise l'API de production** : `PUBLIC_API_BASE_URL`
   (`https://api.nedellec-julien.fr/api`) est câblé en dur côté navigateur (`shared/api/api-config.ts`).
   Un audit contre l'image doit donc fermer le réseau et rediriger ces appels vers la doublure,
   sinon il lit (et écrit, `POST`) la production.
5. **Audit exploratoire** (image de `2cb06f9`, doublure `STUB_ADMIN_SESSION=1`, Chromium 145 headless
   shell, `@axe-core/playwright` 4.13.0, tags `wcag2a wcag2aa wcag21a wcag21aa wcag22aa`, 52 analyses,
   2 min en séquentiel) : **zéro violation** sur 13 pages publiques, menu mobile, 11 pages admin et
   dialogue de confirmation, en clair et en sombre. Détection vérifiée par injection (texte `#ccc`
   sur `#fff` attrapé, contraste évalué sur 36 à 172 nœuds par page). Mais les pages admin à
   données (liste des articles, messages, audience, tableau de bord) n'ont été vues qu'en **état
   d'erreur** : la doublure ne sert ni `/api/blog/posts/admin`, ni `/api/contact/messages*`, ni
   `/api/analytics/stats/*`.

## Decision

1. **Niveau** : un seul niveau d'audit axe, **Playwright + `@axe-core/playwright` en Chromium contre
   l'image Docker de CI** (le même artefact que Dokploy déploie) et la doublure `ci/api-stub`. **Pas
   de couche axe dans Vitest** : elle ne verrait pas le contraste, doublerait les assertions de rôle
   et de nom déjà écrites dans les specs composant, et dépendrait d'un paquet non maintenu.
2. **Règles** : tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`. `wcag21a` est ajouté à
   la liste demandée, sinon les règles A introduites par WCAG 2.1 ne tournent pas (exemple officiel
   Playwright). Pas de `best-practice` dans la gate (hors WCAG, bruit sur les landmarks déjà tranchés).
3. **Politique zéro violation** : aucune règle désactivée, aucun `exclude`, aucune baseline. Une
   exception future se décide par amendement de cet ADR (règle, scénario, justification, vérification
   manuelle qui la remplace, date de réexamen), jamais par une liste silencieuse dans le code.
   Les résultats *incomplete* (revue humaine requise) ne bloquent pas ; ils sont listés dans le
   rapport.
4. **Réseau fermé** : chaque contexte navigateur laisse passer l'origine de l'image, redirige
   `api.nedellec-julien.fr` vers la doublure, et coupe tout le reste (Giscus, Sentry, tiers). Aucune
   requête ne sort vers la production.
5. **Déterminisme** : thème forcé par la clé `j-ned:theme` avant le premier script
   (`addInitScript`) et par `colorScheme` du contexte ; `reducedMotion: 'reduce'` ; attente d'un
   repère de page explicite (jamais `networkidle`, déconseillé par Playwright) ; `retries: 0`.
6. **CI** : job `a11y` parallèle au job `docker`, qui reconstruit l'image depuis le cache GHA
   (lecture seule), installe le seul *headless shell* Chromium à chaque run (pas de cache, doc
   Playwright), démarre la pile par le même script que le poste local, et publie le rapport HTML et
   les JSON axe en artefact en cas d'échec. Bloquant (check requis) une fois la tranche de
   correction passée.
7. **Versions figées exactes** : `@playwright/test` 1.63.0, `@axe-core/playwright` 4.13.0 (qui fixe
   `axe-core` ~4.13.0). Un changement de version d'axe change le jeu de règles : il passe par une PR
   dédiée, jamais par un `^`.

## Consequences

- Le contraste, la taille des cibles (2.5.8) et les noms accessibles sont vérifiés sur le rendu réel,
  dans les deux thèmes, à chaque PR ; les revues n'ont plus à le refaire à la main.
- Environ 20 Mo de dépendances de dev dans `node_modules` (playwright-core 13,4 Mo, axe 6,5 Mo), plus
  le *headless shell* Chromium téléchargé par la CI (hors `node_modules`, hors image). L'image de
  production ne change pas : l'étage `deps` installe `--prod --ignore-scripts`, et `e2e/` est exclu du
  contexte Docker pour ne pas invalider la couche de build.
- Un job CI de plus, estimé 4 à 6 min en parallèle du job `docker` (minutes gratuites, dépôt public).
- Le TypeScript des tests Playwright n'est pas vérifié par Playwright (transpilation seule) : un
  `tsc --noEmit` dédié devient une gate.
- axe ne couvre qu'une partie de WCAG : ordre de focus, pertinence des textes alternatifs, clavier et
  annonces restent des vérifications humaines et des tests composant.
- La doublure grossit (routes admin en lecture), ce qui sert aussi aux preuves runtime locales.

## Alternatives considered

- **axe dans Vitest (happy-dom) seul** : rapide et par composant, mais aveugle au contraste et à la
  mise en page (fait 1), donc à la régression la plus fréquente du repo. Rejeté.
- **Les deux niveaux** : double maintenance pour un gain marginal (les violations structurelles qu'il
  attraperait sont aussi attrapées en navigateur, sur toutes les pages). Rejeté tant que la gate
  navigateur tient ; à rouvrir si un composant partagé change souvent sans page témoin.
- **Vitest browser mode (Playwright provider)** : contraste réel par composant, mais deuxième
  configuration de test, composants hors du shell (thème, landmarks, CSP) et pas d'audit des pages
  servies. Rejeté.
- **pa11y-ci / Lighthouse CI** : pa11y embarque son propre Puppeteer et des règles HTML_CodeSniffer
  en plus d'axe ; Lighthouse ne rapporte qu'un sous-ensemble d'axe sous forme de score. Ni l'un ni
  l'autre ne pilote les états interactifs (menu ouvert, dialogue) aussi simplement. Rejeté.
- **Audit contre `pnpm start`** : pas l'artefact déployé (ni nginx, ni CSP, ni SSR à la requête).
  Rejeté.
- **Cache du navigateur en CI** : déconseillé par la doc Playwright ; l'image officielle
  `mcr.microsoft.com/playwright` en conteneur de job éviterait le téléchargement mais ne peut pas
  lancer `docker run` pour la pile sans Docker-in-Docker. Rejeté.

## Amendement (2026-10-26) : l'audit sort des pull requests

Décision du propriétaire, pour une CI minimale à l'échelle du projet : l'audit axe (zéro violation,
WCAG 2.0/2.1/2.2 A et AA, navigateur réel contre l'image) n'est plus un check de pull request. Il
tourne dans le workflow `a11y.yml`, **chaque lundi sur master et à la demande**, dans l'image
officielle Playwright (ni `apt-get` ni téléchargement de Chromium). Avant une PR qui touche
l'interface, il se lance en local (`CLAUDE.md`, « Audit axe »). Le seuil et la politique d'audit
ne changent pas ; seul le moment change. Contrepartie acceptée : une régression d'accessibilité
peut atteindre la production avant le run hebdomadaire.

