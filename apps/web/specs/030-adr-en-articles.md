---
id: 030
title: Les ADR deviennent des articles de blog, avec un maillage interne
type: feature
status: draft
created: 2026-10-21
related: [specs/029-repositionnement-portfolio-passion.md, docs/adr/0011-themes-du-blog-derives-du-catalogue-de-tags.md, docs/adr/0024-rendu-a-la-requete-des-pages-de-contenu.md, PRODUCT.md]
---

# 030 — Les ADR deviennent des articles de blog

## Description

### Objectif

Demande du propriétaire (2026-10-21) : transformer les ADR en articles de blog. C'est la suite
annoncée par la spec 029 (« Hors périmètre : phase SEO active… transformation des ADR en
articles : spec dédiée »). Le site est un portfolio personnel : un lecteur développeur doit y
trouver du raisonnement technique vérifiable, et non une vitrine commerciale. Les ADR contiennent
déjà ce raisonnement (contexte, options, décision, conséquences), mais ils sont rédigés pour le
dépôt, pas pour un lecteur.

### Arbitrages (2026-10-21)

1. **Périmètre : contenu + maillage.** Des articles tirés des ADR, plus le code qui relie les
   articles entre eux et aux projets. Le reste de la phase SEO (`ProfilePage`, etc.) fera l'objet
   d'une autre spec.
2. **Quatre articles d'abord**, un par groupe d'ADR proches :

   | # | Sujet | ADR sources |
   |---|---|---|
   | A1 | Rendu et performance : du HTML frais sans rebuild | 0024, 0001, 0014 |
   | A2 | Sécurité du contenu : Markdown, images, CSP sans `unsafe-inline` | 0002, 0015, 0018 |
   | A3 | Accessibilité vérifiée en CI dans un vrai navigateur | 0025, 0016, 0017 |
   | A4 | Design system : polices, thème, utilities Tailwind v4 | 0006, 0012, 0003 (avec 0017) |

### Exigences

#### Contenu (A1 à A4)

1. Chaque article est **réécrit pour un lecteur**, pas recopié : le problème de départ, les options
   envisagées, la décision, ce qu'elle coûte, ce qu'elle a donné. Un exemple de code court quand il
   éclaire la décision.
2. **Tout fait est vérifiable** : chaque chiffre, comportement ou en-tête cité est revérifié sur le
   code de `master` ou en production au moment de la rédaction, et non repris de l'ADR sans contrôle
   (plusieurs ADR ont été amendés ou remplacés en partie depuis).
3. Chaque article **cite ses ADR** avec un lien vers le fichier sur GitHub (les dépôts
   `j-ned/ng-portfolio-app` et `j-ned/nest-portfolio-app` sont publics).
4. **Règles éditoriales du site** : aucun mot du verrou `editorial-identity.spec.ts` ni de
   `forbidden-wordings.ts`, aucun appel commercial. La fin d'un article renvoie vers le code, l'ADR
   et un autre article, pas vers une prestation.
5. **Tags** pris dans le catalogue (ADR-0011) pour que chaque article tombe dans un thème. Les tags
   manquants (voir Constat 4) sont ajoutés au catalogue, dans le bon thème.
6. Les brouillons sont relus en PR (`docs/articles/`) avant publication. La publication se fait par
   l'admin ; le slug, généré par l'API au premier enregistrement, est ensuite figé.

#### Maillage (code)

7. **Article → articles** : la page d'un article propose jusqu'à trois autres articles publiés,
   choisis par proximité (tags et thème partagés), **dans le HTML servi** (rendu à la requête,
   ADR-0024), et non ajoutés par le navigateur après coup.
8. **Article ↔ projet** : un article qui parle d'un projet renvoie vers sa fiche, et la fiche du
   projet liste les articles publiés qui le concernent. Comment un article « déclare » son projet
   (tag, champ, convention) est à décider dans le plan technique.
9. Les données structurées restent `BlogPosting` (déjà en place) ; le plan technique dit si les liens
   ci-dessus doivent aussi y apparaître (`isBasedOn` vers l'ADR, `about` vers le projet, etc.).
10. Aucune régression : AXE à zéro violation (ADR-0025), verrou éditorial vert, pages de contenu
    toujours rendues à la requête sans rebuild.

### Constat (2026-10-21, `master` `ec11541`)

1. 28 ADR, de 280 à 1 650 mots. Les ADR 0005 et 0026 à 0028 sont obsolètes (spec 029) et ne
   seront jamais publiés. Plusieurs ADR utiles ne sont plus à jour seuls : 0003 est remplacé en partie
   par 0017, 0015 est amendé par 0018, 0024 amende 0023. Les ADR 0016 et 0018 sont encore au
   statut « proposé », alors qu'ils sont appliqués : `shared/ui/field-error.ts` est utilisé dans
   17 fichiers, et nginx relaie `/api/storage/` depuis l'origine du site (`Dockerfile`, bloc
   `location ^~ /api/storage/`). Leur statut est à passer à « accepté » avant de les citer.
2. Le format marche déjà : l'article « Mesurer la fréquentation de son site sans cookie ni bandeau
   de consentement » (publié le 2026-10-18) est tiré des ADR 0021 et 0022.
3. La page d'un article (`features/blog/pages/blog-detail/blog-detail.ts`) émet un JSON-LD
   `BlogPosting` (auteur, dates, mots-clés). Elle ne propose aucun autre article ni aucun projet :
   un lecteur arrivé de Google repart sans lien vers la suite. La fiche projet (`CreativeWork`) ne
   cite aucun article.
4. Le catalogue de tags (`features/blog/domain/models/blog-tag.model.ts`) n'a ni « Performance »,
   ni « SSR », ni « Accessibilité », ni « CSP », ni « Design system », ni « Tailwind CSS ».
   L'API accepte des tags libres (15 au plus) : un tag hors catalogue reste neutre et ne compte
   dans aucun thème (ADR-0011).
5. Les projets ont leurs propres tags (`project.tags`, côté API), sans lien avec ceux du blog.

### Découpage en PR

| # | Dépôt | Périmètre | Dépend de |
|---|---|---|---|
| 1 | front | cette spec (Description) | — |
| 2 | front | plan technique (`architect`), ADR si décision structurante | 1 |
| — | admin (donnée, sans PR) | **avant le déploiement de 3** : fiche projet « Portfolio » créée en production (slug attendu `portfolio`, vérifié par `GET /api/projects` avant le merge de 3) | 1 |
| 3 | front seul (aucune évolution d'API, ADR-0029) | maillage : tags ajoutés, articles proches, lien article ↔ projet, données structurées | 2, fiche « Portfolio » en production |
| — | admin (donnée, sans PR) | tag « Candidash » de l'article sur la mesure d'audience corrigé en « CandiDash » (après le déploiement de 3 ; avant, sans effet) | 3 |
| 4 à 7 | front | un brouillon par PR (`docs/articles/`, gabarit au plan technique), puis publication par l'admin, un par semaine | 3 pour les liens, sinon 1 |

Les articles peuvent être rédigés pendant que le maillage se code : seule leur publication gagne à
attendre la PR 3.

### Hors périmètre

- `ProfilePage`, refonte des titres et descriptions, `llms.txt` : autre spec SEO.
- Les autres ADR (0004, 0007 à 0011, 0013, 0019 à 0023) : candidats d'une deuxième vague, choisis
  après la mesure d'audience des quatre premiers articles.
- Traduction anglaise, newsletter, série d'articles numérotée.

### Arbitrages complémentaires (2026-10-21)

1. **Brouillons dans le dépôt** : un fichier par article dans `docs/articles/` (par exemple
   `docs/articles/030-a1-rendu-et-performance.md`), relu en PR, puis collé dans l'admin. L'historique
   et les faits vérifiés restent traçables.
2. **Un article par semaine**, dans l'ordre A1 à A4 (modifiable). La mesure d'audience de chaque
   article informe la rédaction du suivant.

## Plan technique — PR 3 (maillage, front seul)

Périmètre : exigences 5 (tags), 7 (articles proches), 8 (article ↔ projet), 9 (données
structurées), 10 (non-régression). La rédaction des articles est hors de ce plan, sauf le gabarit de
brouillon (fin de section). Décision structurante : **ADR-0029**.

### Arbitrages du propriétaire (2026-10-21)

1. **Fiche « Portfolio » : oui.** Le propriétaire crée dans l'admin une fiche projet pour le
   portfolio ; A1 à A4 y sont rattachés par le tag catalogue `Portfolio`. Slug attendu `portfolio`
   (l'API le dérive du titre par `slugify` : minuscules, sans diacritiques, `[^a-z0-9]+` → `-`) ;
   la valeur réelle se lit par `GET /api/projects` **avant le merge** de la PR 3 et remplace
   l'attendue si elle diffère. La fiche doit exister en production **avant** le déploiement de la
   PR 3, sinon le lien « Fiche du projet » des articles tagués `Portfolio` mène à une 404.
   Vérifié : `Portfolio` n'est ni dans le catalogue, ni dans `FORBIDDEN_WORDINGS`, ni dans les motifs
   de `editorial-identity.spec.ts` ; ses seules occurrences dans `src/` sont des données de test de
   l'audience admin (`analytics-builders.ts`, `admin-audience.spec.ts`), sans lien avec les tags.
2. **Tag « Candidash » → « CandiDash »** sur l'article mesure d'audience : correction de donnée dans
   l'admin, après le déploiement de la PR 3 (avant, sans effet). Ligne gardée au découpage.
3. **Précédent / suivant gardés** à côté des articles proches, doublons autorisés (D1 inchangé).
4. **`SSR` reste dans Stack** (D8 inchangé).
5. **Textes validés** : « Pour aller plus loin », « Articles sur ce projet », sur-titre « Fiche du
   projet ».

### Faits vérifiés (2026-10-21)

- `BlogDetail` charge déjà la liste publiée (`toSignal(gateway.getPublishedPosts())`) pour
  `adjacentPosts` ; la navigation « article précédent / suivant » est dans le HTML servi (vérifié en
  production, `data-testid="newer-post"` présent). Les articles proches se calculent sur cette liste :
  **zéro appel d'API ajouté** sur la page article.
- `GET /api/blog/posts` renvoie chaque article avec son `contentMarkdown` ; état de transfert d'une
  page article en production : 47 566 octets de `ng-state` pour 3 articles. Fiche projet : 27 452.
- `ProjectDetail` lit `ProjectsGateway.getAllProjects()` (liste partagée en session) par `rxResource`.
- `ssrUpstreamInterceptor` passe la réponse en 503 sur toute lecture en échec (hors 404) : tout appel
  ajouté au rendu est une cause de 503 de plus (nginx sert alors sa copie).
- Projets en production : `dashflow`, `candidash`, `le-vieux-comptoir`, `coaching-life`,
  `labelsync-pro`, `gitpush-auto`. Le portfolio n'a pas encore de fiche (créée par le propriétaire, arbitrage 1). Tags des articles publiés :
  `DashFlow` (catalogue, thème Projets) sur l'article chiffrement, `Candidash` (tag libre, casse
  différente du titre `CandiDash`) sur l'article mesure d'audience.
- API : `cta_click` accepte un `entityId` libre (aucune règle dans `ENTITY_ID_RULES`) ; les clics se
  mesurent sans évolution d'API.
- Précédents réutilisés : `adjacentPosts(posts, slug)` (signature et tri), `blogTagCategory`,
  `SplitSection` (sections de la fiche projet), `ProjectDetailHeader (linkClicked)` (le dumb émet, la
  page mesure), `stubBlogGateway`, `makeBlogPost`, `makeProject`.

### Décisions

| # | Décision | Alternatives écartées |
|---|---|---|
| D1 | **Articles proches calculés côté front** par une fonction pure `relatedPosts(posts, slug)` sur la liste déjà chargée. Score = tags partagés + thèmes partagés (catégories non nulles communes) ; score nul exclu ; tri score ↓, `publishedAt` ↓, `slug` ↑ ; `RELATED_POSTS_LIMIT = 3`. Pas d'exclusion des voisins chronologiques. | Endpoint API `related` (duplique le catalogue, appel de plus) ; calcul après hydratation (absent du HTML). |
| D2 | **Un article déclare son projet par un tag du catalogue** : table `PROJECT_TAGS` (`tag` → `projectSlug`) dans le domaine blog ; la catégorie `projects` du catalogue **dérive** de cette table (tag de projet = tag du catalogue par construction). Entrées : `DashFlow → dashflow`, `CandiDash → candidash`, `Portfolio → portfolio` (arbitrage 1). Une entrée s'ajoute avec le premier article sur un nouveau projet. | Colonne `blog_post.project_id` (PR API + migration + admin pour 3 projets, seuil dans ADR-0029) ; correspondance tag = titre à l'exécution (appel projets sur chaque article, casse fragile) ; `project.tags` (stack, relie tout à tout). |
| D3 | **La page article n'appelle pas l'API des projets** : le lien se construit depuis `PROJECT_TAGS` (le tag est le nom affiché). | Charger les projets pour valider le slug : une cause de 503 de plus pour éviter un cas (slug renommé) déjà accepté par ADR-0019. |
| D4 | **La fiche projet lit la liste du blog seulement si son slug est dans `PROJECT_TAGS`** : `rxResource({ params: () => projectTagOf(slug) ?? undefined, stream: … })` ; `undefined` laisse la ressource inactive, donc aucune requête ni `ng-state` en plus sur les fiches sans tag. Lecture en échec : section absente côté navigateur ; côté serveur, l'intercepteur pose déjà le 503. | Charger toujours (`ng-state` alourdi de ~15 Ko par article sur toutes les fiches) ; état d'erreur visible (contenu secondaire, la fiche reste lisible). |
| D5 | **JSON-LD** : `BlogPosting.about` = projets liés (`{ '@type': 'CreativeWork', name, url: <site>/projects/<slug> }`), clé absente sans projet ; `CreativeWork.subjectOf` = articles du projet (`{ '@type': 'BlogPosting', headline, url: <site>/blog/<slug> }`), clé absente sans article. | `isBasedOn` vers les ADR (donnée absente de l'API, sans effet sur les résultats enrichis ; les ADR sont cités dans le corps) ; articles proches dans le JSON-LD (`relatedLink` est une propriété de `WebPage`, valeur nulle). |
| D6 | **Les clics de maillage sont mesurés** par `trackCtaClick` existant, trois identifiants fixes : `blog_related_post`, `blog_project_link`, `project_article`, libellés constants (pas le titre de la cible). Raison : la mesure de chaque article doit informer le suivant (arbitrage 2), et une page vue interne ne porte pas sa provenance (le `referrer` n'est envoyé qu'à la première page vue, `http-analytics.gateway.ts`) : sans événement, impossible de savoir si le maillage sert. | Ne rien mesurer (le maillage resterait invérifiable) ; nouveau type d'événement (évolution d'API pour un besoin couvert par `cta_click`). |
| D7 | **Carte de lien partagée** `shared/ui/link-card.ts`, composant à sélecteur d'attribut `a[app-link-card]` (sur-titre + titre), qui reprend le visuel des cartes « article précédent / suivant » de `BlogDetail`. `routerLink` et `data-testid` restent sur l'`<a>`. Utilisée par la navigation chronologique (refactor), les articles proches, le lien projet et les articles d'un projet. | Dupliquer les classes dans 4 gabarits (règle « structure réutilisée = composant `shared/ui/` ») ; directive d'attribut seule (les deux `span` internes resteraient dupliqués) ; composant élément enveloppant l'`<a>` (`data-testid` et `routerLink` déportés, tests existants à réécrire). |
| D8 | **Tags ajoutés au catalogue** (exigence 5) : `Performance`, `Accessibilité`, `Design system` → `engineering` ; `CSP` → `security` ; `SSR`, `Tailwind CSS` → `stack` ; `CandiDash`, `Portfolio` → `projects` (via `PROJECT_TAGS`). `SSR` en Stack confirmé par le propriétaire (arbitrage 4). | `SSR` en `engineering` (défendable, écarté par le propriétaire). |
| D9 | **Aucune évolution d'API.** Seuils de migration (colonne `project_id`, liste allégée sans Markdown) consignés dans ADR-0029. | — |

### Architecture

```
BlogDetail (page, smart)
  ├─ _publishedPosts (liste déjà chargée) ─┬─ adjacentPosts  → nav « Autres articles » (LinkCard)
  │                                        └─ relatedPosts   ─┐
  ├─ post() ── linkedProjects(PROJECT_TAGS) ──────────────────┼→ BlogFurtherReading (dumb) ─(linkFollowed)→ trackCtaClick
  └─ _applySeo : BlogPosting + about                          ┘

ProjectDetail (page, smart)
  ├─ _projectsResource (inchangé)
  ├─ _postsResource : rxResource, params = projectTagOf(slug) ?? undefined → BlogGateway.getPublishedPosts()
  │     └─ postsAboutProject(posts, slug) → ProjectArticles (dumb, SplitSection + LinkCard) ─(articleFollowed)→ trackCtaClick
  └─ _applyProjectSeo : CreativeWork + subjectOf
```

- Dérivations = **fonctions pures du domaine blog** (`features/blog/domain/**`), testées sans
  TestBed ; les pages ne font que `computed(() => fn(...))`. Pas de presenter : aucune page ne mêle
  DOM et dérivation non triviale au-delà de l'existant (règle « une API à un seul site »).
- Dépendance inter-feature : `ProjectDetail` et `ProjectArticles` importent le domaine blog
  (`BlogGateway`, `BlogPost`, `PROJECT_TAGS`, `postsAboutProject`). Précédent : `BlogDetail` importe
  `AnalyticsGateway` du domaine analytics. Le blog possède la relation (le tag est une notion du blog).
- **Landmarks** : `BlogFurtherReading` = `<section aria-labelledby>` + `h2`, hors `<article>`,
  entre la barre « J'aime / Flux RSS » et la `nav` « Autres articles » ; aucun `nav` ajouté (la page en
  a déjà un, libellé « Autres articles »). `ProjectArticles` = `SplitSection` (`section` + `h2`),
  après « Décisions d'architecture », avant `app-project-detail-nav`. Aucun `header`/`footer`/`main`.
- **SSR** : aucun `@defer`, aucun `afterNextRender` ; les deux blocs se rendent au serveur avec les
  données lues par `HttpClient` (tâches en attente) et réutilisées à l'hydratation (transfer cache).
- `ProjectDetail` passe à 7 collaborateurs injectés (seuil indicatif 6) : `BlogGateway` est la seule
  source de la liste ; `PLATFORM_ID` et `RESPONSE_INIT` (via `injectMarkNotFound`) sont de
  l'infrastructure. Accepté, sans facade (une facade pour une ressource serait de l'indirection).

### Fichiers

À créer :

| Fichier | Rôle |
|---|---|
| `src/app/features/blog/domain/models/project-tag.model.ts` | `ProjectTag`, `PROJECT_TAGS` (`as const satisfies`), `ProjectBlogTag` dérivé, `projectTagOf(projectSlug)` |
| `src/app/features/blog/domain/related-posts.ts` | `relatedPosts(posts, slug)`, `RELATED_POSTS_LIMIT` |
| `src/app/features/blog/domain/linked-projects.ts` | `linkedProjects(post)` : entrées de `PROJECT_TAGS` portées par l'article, dans l'ordre de ses tags |
| `src/app/features/blog/domain/posts-about-project.ts` | `postsAboutProject(posts, projectSlug)` : articles publiés portant le tag du projet, `publishedAt` ↓ |
| `src/app/shared/ui/link-card.ts` | `a[app-link-card]`, entrées `overline`, `heading`, `align: 'start' \| 'end'` |
| `src/app/features/blog/application/components/blog-further-reading.ts` | Section « Pour aller plus loin » (dumb) : `projects`, `posts`, sortie `linkFollowed: output<FurtherReadingTarget>()` |
| `src/app/features/blog/application/further-reading-copy.ts` | `FURTHER_READING_COPY` : titre de section, sur-titre « Fiche du projet », libellés de mesure |
| `src/app/features/projects/application/components/project-articles.ts` | Section « Articles sur ce projet » (dumb, `SplitSection`) : `posts`, sortie `articleFollowed: output<void>()` |
| `src/app/features/projects/application/project-articles-copy.ts` | `PROJECT_ARTICLES_COPY` : titre, résumé, libellé de mesure |

Tests (écrits par `qa`) : `*.spec.ts` à côté de chaque fichier ci-dessus, plus les specs existants
de `blog-detail`, `project-detail`, `blog-tag.model`.

À modifier :

| Fichier | Changement |
|---|---|
| `src/app/features/blog/domain/models/blog-tag.model.ts` | Tags D8 ; catégorie `projects` = `[...PROJECT_TAGS.map((p) => p.tag), 'Auto-hébergement', 'CI/CD', 'GreenTech']` |
| `src/app/features/blog/pages/blog-detail/blog-detail.ts` | `related`, `linkedProjects` en `computed` ; `<app-blog-further-reading>` ; cartes précédent/suivant en `a[app-link-card]` ; `about` dans le JSON-LD ; `trackCtaClick` sur `linkFollowed` |
| `src/app/features/projects/pages/project-detail/project-detail.ts` | `inject(BlogGateway)`, `_postsResource` (D4), `articles` en `computed` ; `<app-project-articles>` ; `subjectOf` dans le JSON-LD ; `trackCtaClick` sur `articleFollowed` |
| `src/app/testing/editorial-sources.ts` | Enregistre `FURTHER_READING_COPY` et `PROJECT_ARTICLES_COPY` (verrou éditorial) |
| `ci/api-stub/fixtures/projects.json` | Projet `dashflow` minimal (slug réel de `PROJECT_TAGS`) |
| `ci/api-stub/fixtures/blog-posts.json` | `article-temoin` reçoit le tag `DashFlow` ; nouvel article publié `article-voisin` (tag `Angular`) |
| `e2e/a11y/scenarios.ts` | Scénario `/projects/dashflow`, prêt sur `project-articles` |
| `DESIGN.md` | Trois fiches (voir « DESIGN.md ») |

### Modèles de données

```ts
// features/blog/domain/models/project-tag.model.ts
export type ProjectTag = { readonly tag: string; readonly projectSlug: string };

export const PROJECT_TAGS = [
  { tag: 'DashFlow', projectSlug: 'dashflow' },
  { tag: 'CandiDash', projectSlug: 'candidash' },
  { tag: 'Portfolio', projectSlug: 'portfolio' },
] as const satisfies readonly ProjectTag[];

export type ProjectBlogTag = (typeof PROJECT_TAGS)[number]['tag'];
export function projectTagOf(projectSlug: string): ProjectBlogTag | null;

// features/blog/application/components/blog-further-reading.ts
export type FurtherReadingTarget = 'post' | 'project';
```

- Tout est `readonly` ; les fonctions rendent de nouveaux tableaux (`filter` avant `sort`, comme
  `adjacentPosts`), jamais de mutation de l'entrée.
- **Contrainte structurelle encodée dans les types** : un tag de projet est un tag du catalogue
  rangé dans `projects` parce que la catégorie est construite depuis `PROJECT_TAGS` (pas de test
  runtime « le tag existe-t-il ? ») ; `ProjectBlogTag` est une union littérale dérivée.
- Égalité de tag **exacte** (même règle que `blogTagCategory`) : `Candidash` ne vaut pas `CandiDash`.
- Aucune donnée d'API nouvelle, aucun type `infra` touché. Validation runtime aux frontières non
  vérifiée (profil : pas de lib côté front), inchangé.

### Réactivité et chargement (SSR)

- `BlogDetail` : `protected readonly related = computed(() => relatedPosts(this._publishedPosts(), this.slug()))`,
  `protected readonly projects = computed(() => linkedProjects(this.post()))` (liste vide sans
  article). Aucune nouvelle source asynchrone.
- `ProjectDetail` : `_postsResource = rxResource({ params: () => projectTagOf(this.slug()) ?? undefined, stream: () => this._blogGateway.getPublishedPosts() })` ;
  `articles = computed(() => this._postsResource.hasValue() ? postsAboutProject(this._postsResource.value(), this.slug()) : [])`.
  Jamais `.value()` sans `hasValue()` (une ressource en erreur lève à la lecture).
- JSON-LD : les `effect` SEO existants lisent `projects()` / `articles()` et se rejouent quand la
  liste arrive ; le HTML servi porte l'état final (`Seo` remplace le script `ld+json`).
- Instance réutilisée entre deux slugs (`/blog/a` → `/blog/b`, `/projects/x` → `/projects/y`) : tout
  est dérivé de `slug()`, rien à réinitialiser.

### Tranches

- **Tranche 1 — les tags manquants tombent dans leur thème** : `blog-tag.model.ts` (D8, sans
  `CandiDash`). Tests domaine sans TestBed : `blogTagCategory` de chaque tag ajouté (`it.each`),
  `AVAILABLE_BLOG_TAGS` sans doublon, un article tagué `Accessibilité` compte dans `engineering`
  (`countPostsByCategory`).
- **Tranche 2 — la page article propose jusqu'à trois articles proches dans le HTML rendu** :
  `related-posts.ts`, `link-card.ts`, `blog-further-reading.ts` (articles seuls), `further-reading-copy.ts`,
  branchement dans `BlogDetail`, clic mesuré (`blog_related_post`), copie enregistrée au verrou
  éditorial. Tests : domaine (score, exclusion de l'article courant, des brouillons et des scores
  nuls, tri, limite à 3 ; candidat aux propriétés, skill `angular-property-testing`) ; composant
  `BlogDetail` (section absente sans article proche, `h2`, liens `/blog/<slug>`, **un seul appel**
  à `getPublishedPosts`, `trackCtaClick` au clic) ; `LinkCard` (sur-titre, titre, `align`). Refactor
  sous vert par `angular-expert` : cartes précédent / suivant passées en `a[app-link-card]`, tests
  existants inchangés.
- **Tranche 3 — un article renvoie vers la fiche de son projet** : `project-tag.model.ts`
  (`PROJECT_TAGS`, `projectTagOf`, catégorie `projects` dérivée, `CandiDash` et `Portfolio` ajoutés),
  `linked-projects.ts`, partie projet de `BlogFurtherReading` (avant les articles, sur-titre « Fiche
  du projet », titre = tag), clic mesuré (`blog_project_link`). Tests : domaine (`linkedProjects`,
  `projectTagOf`, tout tag de `PROJECT_TAGS` est en `projects`) ; composant (lien
  `/projects/dashflow` présent pour un article tagué `DashFlow`, `/projects/portfolio` pour
  `Portfolio`, absent pour `Candidash`).
- **Tranche 4 — la fiche projet liste les articles qui la concernent** : `posts-about-project.ts`,
  `project-articles.ts`, `project-articles-copy.ts`, `ProjectDetail` (D4), clic mesuré
  (`project_article`), fixtures de la doublure et scénario a11y `/projects/dashflow`. Tests : domaine
  (filtre publié + tag, tri) ; composant (`ProjectDetail` sur `dashflow` : section et liens ;
  sur `mon-site` : **aucun appel** à `getPublishedPosts` ; lecture en échec : fiche rendue sans la
  section). Le `setup` existant de `project-detail.spec.ts` reçoit `stubBlogGateway()` (fait par `qa`).
- **Tranche 5 — les liens figurent dans les données structurées** : `about` (`BlogDetail`) et
  `subjectOf` (`ProjectDetail`). Tests composant sur l'argument de `Seo.applySeoData` : présence avec
  un projet / des articles, **absence de la clé** sinon (`it.each`).

Chaque tranche se ferme par `pnpm test` (lire `$?`) et `pnpm lint` ; la PR par les gates du
Dockerfile (`pnpm install --frozen-lockfile`, `pnpm run build --configuration production`) et le job
`a11y` (zéro violation, clair et sombre, nouveaux scénarios compris).

### DESIGN.md (fiches à ajouter, tranches 2 et 4)

- **Carte de lien (`shared/ui/link-card.ts`)** : `a[app-link-card]` ; carte « Cards / Containers »
  (`rounded-xl border border-foreground/8 bg-surface p-6`), survol par la bordure (`hover:border-primary/35`)
  et le titre en `primary` (`group-hover`), pas d'ombre ; sur-titre mono `text-xs text-muted`, titre
  `text-[1.1875rem] font-semibold tracking-tight` ; `align="end"` aligne à droite ; focus visible
  ring 2 px `primary`. Une seule cible par carte.
- **Pour aller plus loin (`features/blog/application/components/blog-further-reading.ts`)** :
  section titrée `h2`, hors de l'`article`, sous la barre « J'aime / Flux RSS » ; fiche du projet
  d'abord, puis jusqu'à trois articles proches, en grille `sm:grid-cols-2` ; sur-titre = date de
  publication pour un article, « Fiche du projet » pour un projet ; non rendue quand elle est vide.
- **Articles d'un projet (`features/projects/application/components/project-articles.ts`)** :
  `SplitSection` comme « Choix techniques » et « Décisions d'architecture », avant la navigation
  entre projets ; une `LinkCard` par article (sur-titre = date), du plus récent au plus ancien ; non
  rendue sans article.

### Gabarit d'un brouillon (`docs/articles/030-aN-<slug>.md`, PR 4 à 7)

```yaml
---
id: 030-a1
titre: "…"                # 200 caractères au plus (DTO API)
extrait: "…"              # 300 au plus ; les 155 premiers font la meta description (truncateAtWord)
tags: [SSR, Performance, Angular]   # catalogue uniquement (blog-tag.model.ts), 15 au plus
projet: Portfolio         # un tag de PROJECT_TAGS (Portfolio, DashFlow, CandiDash) ou aucun : à mettre aussi dans `tags`
adr: [docs/adr/0024-rendu-a-la-requete-des-pages-de-contenu.md]   # liens GitHub dans le corps
faits-verifies: 2026-10-2x sur master <sha> / en production
statut: brouillon         # brouillon | relu | publié
slug: ""                  # rempli après publication (généré par l'API, figé ensuite)
---
```

Le rattachement à un projet passe **uniquement** par le tag (ADR-0029) : `projet` sert à la relecture.

### Risques et inconnues

- **Fiche « Portfolio » et slug** : déployer la PR 3 avant que la fiche existe, ou avec un slug
  différent de `portfolio`, publie un lien 404 sur chaque article tagué `Portfolio` ; renommer plus
  tard le titre de la fiche change son slug (`slugify` au `PATCH`) et casse le lien de la même façon.
  Contrôle avant merge : `GET /api/projects` contient le slug de `PROJECT_TAGS`.
- **Poids de l'état de transfert** : les fiches `dashflow`, `candidash` et `portfolio` embarquent la liste du blog
  (~15 Ko par article, Markdown compris) ; la page article l'embarque déjà et franchira ~100 Ko vers
  7 articles publiés, indépendamment de cette spec : seuil de la liste allégée côté API (ADR-0029).
- **Articles proches bruités** : les tags génériques (`Angular`, `TypeScript`) rapprochent presque
  tout ; le score ne départage qu'avec des tags spécifiques, d'où l'exigence 5. La formule (poids
  égal tag / thème) parie que les articles portent au moins un tag spécifique : à revoir sur pièce
  après A2 si les propositions sont mauvaises.
