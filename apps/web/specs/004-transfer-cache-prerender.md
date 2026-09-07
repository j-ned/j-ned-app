---
id: 004
title: Le transfer cache HTTP est vide sur toutes les routes prérendues — le client refait chaque appel après hydratation
type: fix
status: draft
created: 2026-09-07
related: [specs/003-home-ssr-visibility.md, ADR-0001]
---

# 004 — Transfer cache HTTP vide au prérendu

## Description

Découvert en revue du Lot 1 de la spec 003 (`code-reviewer`, 2026-09-07), puis
mesuré et requalifié : **ce n'est pas une régression de la spec 003, c'est une
condition préexistante à l'échelle du repo.** La spec 003 ne fait que l'étendre
à un bloc supplémentaire, et de la manière la moins exposée qui soit.

### Le constat

`app.config.ts:140-146` configure pourtant le transfer cache :

```ts
provideClientHydration(
  withEventReplay(),
  withIncrementalHydration(),
  withHttpTransferCacheOptions({
    filter: (req) => !req.url.includes('/home-bundle'),
  }),
),
```

Or le `<script id="ng-state">` des pages prérendues ne contient **aucune** entrée
de cache HTTP — uniquement `__nghData__` et, le cas échéant, `__nghDeferData__` :

| Route prérendue | clés de `ng-state` | entrées transfer cache |
|---|---|---|
| `browser/index.html` (home) | `__nghData__`, `__nghDeferData__` | **0** |
| `browser/projects/index.html` | `__nghData__` | **0** |
| `browser/about/index.html` | `__nghData__`, `__nghDeferData__` | **0** |
| `browser/blog/index.html` | `__nghData__` | **0** |

Mesuré le 2026-09-07 sur le build de la branche `feat/home-ssr-visibility`.
`/projects` et `/blog` ne sont **pas** touchées par la spec 003 : le vide est
antérieur et général.

### Conséquence

Le HTML prérendu porte des données figées **à l'heure du build**, et le client
refait chaque appel après hydratation. Deux effets distincts :

1. **Double appel systématique** — la donnée voyage deux fois (une fois inline
   dans le HTML, une fois par le réseau au bootstrap). Le transfer cache existe
   exactement pour l'éviter ; il est configuré et inopérant.
2. **Fenêtre de désynchronisation à l'hydratation** — le DOM servi est construit
   sur les données du build, le client démarre sans elles.

Le point 2 est aggravé par la composition du bundle home. `InMemoryHomeGateway`
conditionne le bundle **entier** à l'appel HTTP :

```ts
getHomeBundle(): Observable<HomeBundle> {
  return this.projectsGateway.getFeaturedProjects().pipe(
    map((featuredProjects) => ({ hero: STATIC_HERO, highlights: [...], featuredProjects: [...] })),
  );
}
```

`hero` et `highlights` sont pourtant **statiques** (`home.static-data.ts`). Au
bootstrap client, tant que le GET `/projects?featured=true` n'a pas répondu,
`bundle()` vaut `undefined` — donc `expertises()` vaut `[]` et le template bascule
sur sa branche `@else` (skeleton), alors que le serveur a rendu les 3 cartes.
**Cette exposition-là est eager, elle est déjà sur `master`, elle ne doit rien
au Lot 1 de la spec 003.**

### Piste de cause à confirmer

`filter: (req) => !req.url.includes('/home-bundle')` garde une URL qui **n'existe
nulle part dans le code** — `grep -rn "home-bundle" src/` ne retourne que la ligne
du filtre elle-même. `InMemoryHomeGateway` est en mémoire ; les appels réels sont
`/projects?featured=true&_sort=order`, `/projects?_sort=order&limit=100`, etc.
Le filtre laisse donc passer toutes les requêtes réelles : **il n'est pas la cause
du vide, mais c'est de la configuration morte** qui a probablement masqué le
problème (elle donne l'apparence d'un transfer cache réfléchi et actif).

La cause reste à établir. Hypothèses à départager :
- comportement du transfer cache en **prérendu au build (SSG)** vs SSR à la requête
- ordre / interaction des features de `provideClientHydration` en Angular 22.0.3
- requêtes émises hors de la fenêtre de sérialisation (après stabilisation)

### Objectif

1. **Établir la cause** du transfer cache vide au prérendu — pas la contourner.
2. Décider si le transfer cache est le bon outil pour des routes **prérendues au
   build** (données figées à l'heure du build : un cache les gèlerait davantage,
   ce qui peut être indésirable pour `featuredProjects`, piloté par l'admin).
3. **Supprimer ou corriger** le filtre `/home-bundle`, configuration morte.
4. **Découpler `hero`/`highlights` de l'appel HTTP** dans `InMemoryHomeGateway` :
   ils sont statiques, rien ne justifie qu'ils attendent le réseau. C'est le
   correctif le plus direct de la fenêtre de désynchronisation eager.

### Périmètre pressenti

- `src/app/app.config.ts` (`withHttpTransferCacheOptions`)
- `src/app/features/home/infra/gateways/in-memory-home.gateway.ts` (découplage)
- **Hors périmètre** : les triggers `@defer` de la spec 003 (livrés et prouvés),
  les Lots 2 et 3 de `tasks/todo.md`.

### Préalable

**Ce diagnostic n'a pas été validé au runtime** : aucun outil navigateur n'était
disponible dans la session du 2026-09-07 (ni playwright/puppeteer, ni extension
Chrome). La première action de cette spec est d'ouvrir la home et de **lire la
console** : présence ou absence d'erreur d'hydratation (NG0500 et apparentées),
et nombre d'appels réseau à `/projects?featured=true` au chargement.
