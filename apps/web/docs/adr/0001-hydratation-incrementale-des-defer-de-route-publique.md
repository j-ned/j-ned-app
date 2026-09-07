# ADR-0001 — Hydratation incrémentale des blocs `@defer` des routes publiques

- **Statut** : accepté
- **Date** : 2026-09-07
- **Contexte spec** : `specs/003-home-ssr-visibility.md`

## Context

`app.config.ts` active `provideClientHydration(withIncrementalHydration(), withEventReplay())`
et le build prérend 5 routes statiques. Sous hydratation incrémentale, le runtime Angular
arbitre le rendu serveur d'un bloc `@defer` sur la **seule** présence d'un trigger `hydrate` :

```js
// @angular/core — shouldAttachRegularTrigger()
if (ngServerMode) return !incrementalHydrationEnabled || !hasHydrateTriggers;
```

Sans trigger `hydrate`, les triggers réguliers restent attachés côté serveur, `on viewport`
n'y déclenche rien, et le bloc sérialise son `@placeholder`. Avec un trigger `hydrate`, chaque
instruction `ɵɵdeferHydrateOn*` appelle `triggerDeferBlock(2, …)` en mode serveur et rend le
contenu réel.

Le repo pratiquait les deux conventions en parallèle : `about.ts` posait `hydrate on viewport`,
`home.ts` ne posait rien. A/B sur un même build : `dist/angular-portfolio-app/browser/about/index.html`
contient les 6 composants différés ; `…/browser/index.html` (home) contient deux `<div>` vides.
La route qui encaisse tout le trafic était la seule sans contenu principal indexable.

## Decision

1. **Tout bloc `@defer` situé sur une route publique rendue par SSR/prérendu porte un trigger
   `hydrate`.** L'absence de trigger `hydrate` sur une telle route est un défaut, pas un choix.
2. **`hydrate on viewport` est le trigger par défaut du repo.** Il aligne le coût
   d'hydratation sur la visibilité réelle sans jamais amputer le HTML servi.
3. **`hydrate on interaction` est proscrit sur tout sous-arbre contenant un formulaire réactif.**
   `setUpControlValueAccessor()` appelle `dir.valueAccessor.writeValue(control.value)` au
   branchement des directives : l'hydratation réécrit la valeur du `FormControl` (vide) dans
   l'input DOM et **efface la saisie faite avant hydratation**. `withEventReplay()` rejoue
   l'événement déclencheur, pas l'état de valeur du DOM.
4. **Les triggers réguliers (`on viewport`, `when <expr>`, `prefetch on *`) sont conservés à côté
   du trigger `hydrate`.** Ils ne sont pas redondants : `shouldAttachRegularTrigger()` ne les
   attache que lorsque le bloc **n'a pas** été rendu par le serveur — c'est-à-dire sur le chemin
   de navigation SPA (arrivée sur la route par le Router, pas par le document). Les supprimer
   laisserait ces blocs bloqués sur leur `@placeholder` en navigation interne.
5. **`hydrate never` est réservé au contenu strictement statique** (aucun listener, aucun signal) :
   il gèle le sous-arbre entier, aucun trigger `hydrate` imbriqué ne se déclenche plus.

## Consequences

- Le HTML servi des routes publiques contient le contenu principal : crawlers, aperçus de partage
  et navigation sans JS voient la page réelle.
- Le découpage en chunks est inchangé : le trigger `hydrate` ne modifie pas la résolution des
  dépendances différées (`dependencyResolverFn` + `import()` dynamique). Les composants différés
  restent hors du bundle initial du navigateur — contrôle de non-régression obligatoire à chaque
  passage d'un bloc en `hydrate` (cf. spec 003 § contrôle de chunking).
- Le coût de rendu serveur augmente : les dépendances différées sont chargées et exécutées au
  prérendu. Tout composant passant en `hydrate` doit être **SSR-safe** (aucun accès `window` /
  `document` / `localStorage` au montage).
- `withEventReplay()` reste utile mais ne dispense d'aucune garantie de valeur : voir décision 3.
- Le trigger `when <expr>` devient inopérant sur le chemin d'entrée SSR. Tout mécanisme qui s'appuie
  dessus pour « forcer » le rendu (ici `SectionScroller.eager`) ne couvre plus que la navigation SPA.

## Alternatives considered

- **Supprimer les `@defer` de la home.** Rejeté : `HomeProjects` et `ContactForm` ne sont référencés
  que dans des blocs `@defer` ; les retirer ferait entrer `ProjectCard`, `NgOptimizedImage` et le
  formulaire réactif dans le chunk eager de `path: ''`. Le bug est le trigger manquant, pas le `@defer`.
- **`hydrate on immediate` partout.** Rejeté : hydrate tout le document au chargement, ce qui annule
  le bénéfice de l'hydratation incrémentale sans rien apporter au SEO (déjà réglé par le rendu serveur).
- **`hydrate on interaction` sur le formulaire de contact.** Rejeté : cf. décision 3, perte de saisie
  mécanique et reproductible.
- **Rendre les routes publiques entièrement eager (sans `@defer`).** Rejeté : régression de bundle
  initial sur la route par défaut, qui n'est pas lazy-loadée.
