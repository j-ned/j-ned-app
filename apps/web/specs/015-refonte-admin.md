---
id: 015
title: Refonte visuelle de l'administration dans le langage éditorial du site (vue d'ensemble, projets, éditeur, articles, audience)
type: feat
status: draft
created: 2026-10-07
related: [specs/012-refonte-realisations.md, specs/013-cartes-accueil.md, specs/014-refonte-blog.md, DESIGN.md]
---

# 015 — Refonte de l'administration

## Description

### Contexte

Les specs 012 à 014 ont installé sur le site public le vocabulaire du « dessin technique » de
`DESIGN.md` : sur-titre mono, grand titre serré, cartouche titré, tampons de nature, listes de
repères `dl`, filtres en onglets soulignés avec leur compte, filets `line` plutôt que cartes
bordées, un seul indigo, deux registres (Console et Ivoire).

L'administration (`src/app/features/admin/**`, environ 4 250 lignes hors tests) est restée sur
l'ancien gabarit « dashboard SaaS » : cartes à bordure, pastilles colorées, libellés anglais.
Cette spec en fait l'audit, puis propose une maquette à valider avant tout plan technique.

Maquette et captures (hors dépôt, scratchpad de session) : `maquette-admin/index.html`
(autonome, tokens et polices du dépôt, bascule clair/sombre), `maquette-admin/captures/*.jpg`
(8 écrans × 2 registres en 1 440 px, plus le tiroir et la vue d'ensemble en 390 px). axe-core
(WCAG 2.2 AA + best-practice) : 0 violation sur les 20 rendus, aucun défilement horizontal.

### Constat

Relevé sur le code de `feat/refonte-admin` (= `master` à `30ef475`) et sur les captures de prod
du 2026-10-07 (registre sombre). Classement par gravité.

#### A. Bugs et risques fonctionnels

1. **Suppression sans confirmation, partout.** Un clic sur la corbeille retire immédiatement un
   projet (`admin-projects.ts:202-227`, déclenché par `admin-project-row.ts:76`), un article
   (`admin-blog.ts:79-85` puis `157-176`) ou le CV en ligne (`admin-cv.ts:44`, `172`). La mise à
   jour optimiste masque la perte : aucun « Annuler » dans le toast, aucun dialog. Aucun
   `confirm`/`dialog` dans toute la feature.
2. **La période affichée d'Analytics ment.** L'état vaut `'30d'` (`admin-analytics.ts:245`), mais
   le `<select [value]>` dont les `option` viennent d'un `@for`
   (`components/admin-analytics-header.ts:45-53`) affiche « 7 derniers jours » : la valeur est
   posée avant que les options existent. En prod, la capture montre « 7 derniers jours » au-dessus
   d'une courbe du 07/09 au 05/10 (30 jours). Les 42 visiteurs sont donc **sur 30 jours**, pas 7
   (la maquette le dit ainsi). Cause probable à confirmer par un test en RED.
3. **Erreur = zéro ou vide.** Aucun écran ne distingue « chargement », « erreur » et « vide » :
   la liste des projets affiche « Aucun projet » pendant le chargement et en erreur
   (`admin-projects.ts:79-85`, `value() ?? []` en `108`) ; idem « Aucun article »
   (`admin-blog.ts:88-91`, `111`) ; le tableau de bord affiche `0` message non lu et `0` CV si
   l'API tombe (`admin-dashboard.ts:169`, `184`). Le site public, lui, a un `role="alert"` avec
   « Réessayer » (`projects.ts`, `blog-list.ts`).
4. **Thème non maîtrisé dans l'admin.** La classe `.app-dark` n'est posée que par le `Header`
   public (`layout/components/header/header.ts:188-195`), qui n'est pas rendu sous `/admin`
   (`app.ts:19-21`) ; `index.html` ne la pose pas. Conséquence : un rechargement direct de
   `/admin` s'affiche en **Ivoire** quelle que soit la préférence enregistrée, et l'admin n'a
   aucun bouton de thème (`admin-layout.ts`, `admin-nav.ts`). Les captures de prod en sombre ne
   sont obtenues qu'en arrivant depuis le site.
5. **Lecture des messages impossible au clavier.** Une ligne de message ne s'ouvre qu'au clic sur
   le `<tr>` (`components/admin-table.ts:84`) ; la colonne « expand » n'est qu'une icône sans
   bouton (`components/admin-col-expand.ts`). Les en-têtes triables sont des `<th role="button">`
   sans `tabindex` ni gestion clavier (`components/admin-table.ts:54-59`), et ce `role` écrase
   `columnheader`, donc l'`aria-sort` n'est plus annoncé.

#### B. Incohérences avec le site

6. **Libellés anglais ou franglais** : « Dashboard » (`admin-layout.ts:91`,
   `admin.routes.ts:11`), « Analytics » (`admin-layout.ts:106`, `admin.routes.ts:35`,
   `components/admin-analytics-header.ts:26`), « Featured » (`admin-project-row.ts:59`,
   `admin-project-inline-form.ts:302`), statut brut « published » (`admin-blog.ts:59`),
   « Likes » (`admin-blog.ts:49`), « Export CSV » (`admin-analytics-header.ts:57`),
   « Upload nouveau CV », « Aucun CV uploadé » (`admin-cv.ts:59`, `53`). Nombres au format
   anglais : « 88.1% », « 1.3 pages / session », « 22s », « 1m 05s »
   (`admin-analytics.ts:356`, `components/admin-analytics-kpis.ts:52`,
   `analytics/domain/analytics-presenter.ts:23`, `28`) ; dates du graphique en ISO « 2026-09-07 »
   (`analytics-presenter.ts:45`).
7. **Cartes à bordure partout**, là où le site pose des filets : ligne de projet
   (`admin-project-row.ts:18`), KPI (`admin-analytics-kpis.ts:13`, `28`, `43`, `58`), graphique
   (`admin-analytics-visitors-chart.ts:12`), listes (`analytics-bar-list.ts:12`), formulaires
   (`admin-project-inline-form.ts:98`, `admin-blog-form.ts:39`), CV et paramètres
   (`admin-cv.ts:19`, `52`, `57`, `admin-settings.ts:23`). Les rayons varient (`rounded-xl`,
   `rounded-2xl`, `rounded-lg`).
8. **Plusieurs accents au lieu d'un** (One Indigo Rule) : violet `accent` pour la carte CV et la
   seconde série du graphique (`admin-dashboard.ts:63-66`,
   `admin-analytics-visitors-chart.ts:21`), vert « succès » comme couleur décorative des barres
   « Pays » et d'icônes (`admin-analytics.ts:145-150`, `159`), ambre « warn » pour
   « Featured », qui n'est pas un avertissement (`admin-project-row.ts:59`), ambre/vert pour des
   icônes de KPI (`admin-analytics-kpis.ts:45`, `60`). Le filtre des messages est un segmenté
   plein `bg-primary-bg` (`admin-messages.ts:62-66`), pas l'onglet souligné du site
   (`shared/ui/filter-group.ts`).
9. **Typographie et hiérarchie hétérogènes.** `h1` en `text-3xl` (tableau de bord, analytics,
   paramètres : `admin-dashboard.ts:27`, `admin-analytics-header.ts:26`, `admin-settings.ts:13`)
   ou `text-2xl` (projets, blog, CV, messages : `admin-projects.ts:31`, `admin-blog.ts:29`,
   `admin-cv.ts:16`, `admin-table.ts:27`), jamais l'Archivo élargi serré des pages publiques ; un
   `h2` « Admin » dans la barre latérale précède le `h1` de chaque page
   (`components/admin-nav.ts:28`) ; libellés de groupe et pastille de compte en `text-[10px]`
   (`admin-nav.ts:60`, `78`). Aucun sur-titre mono, aucun cartouche, aucun tampon de nature
   alors que le modèle `kind` existe (`admin-project-inline-form.ts:136-155`).
10. **Tableau de bord pauvre.** « Bonjour, <e-mail> » (`admin-dashboard.ts:28`), deux compteurs à
    zéro, une date figée au chargement du module (`admin-dashboard.ts:13`), un raccourci
    « Nouveau projet » qui ouvre seulement la liste (`admin-dashboard.ts:142`) et une carte « CV
    téléchargés » qui mène à Analytics (`admin-dashboard.ts:62`). Rien sur l'audience ni sur le
    contenu en ligne.

#### C. Accessibilité (WCAG 2.2 AA)

Contrastes calculés (conversion OKLCH → sRGB, formule WCAG 2.x) sur les tokens de `styles.css`.

11. **Pastilles de statut sous 4,5:1 en Ivoire** : texte `status-success` sur
    `status-success/15` = **2,80:1**, `status-warn` sur `status-warn/15` = **2,82:1**
    (« published », « Featured » : `shared/ui/tag.ts:7-8`, utilisés par `admin-blog.ts:58-61`,
    `admin-project-row.ts:59`). Bons en Console (7,0:1).
12. **Rouge de palette brute** : « Supprimer » des lignes de choix techniques et décisions en
    `text-red-400` (`admin-project-inline-form.ts:325`, `349`) = **2,54:1** sur Ivoire, et hors
    tokens. Bouton danger plein en Console : icône blanche sur `status-error` = **2,75:1**
    (`shared/ui/button.ts:99`, via `admin-project-row.ts:76`).
13. **Bords de champs à 1,6:1** (`border-muted/30`, `styles.css` `@utility form-input`,
    `app-select`) : un champ n'est délimité que par ce trait, sous le 3:1 de 1.4.11. Le champ
    « Ordre » a ses propres classes et un `focus:` au lieu de `focus-visible`
    (`admin-project-inline-form.ts:311`), la case « Featured » aussi (`296`).
14. **Champs sans étiquette** : les lignes de choix techniques et de décisions n'ont qu'un
    `placeholder` (`admin-project-inline-form.ts:320-321`, `340-345`).
15. **Noms d'actions non distincts** : « Modifier » / « Supprimer » identiques sur chaque ligne
    (`admin-project-row.ts:67`, `76`, `admin-blog.ts:72-85`, `components/admin-col-actions.ts`),
    pas d'`aria-expanded` sur le bouton qui déplie l'édition en ligne (`admin-project-row.ts:64-75`),
    lien actif de la navigation sans `aria-current` (`routerLinkActive` sans
    `ariaCurrentWhenActive`, `admin-nav.ts:67`, `96`), pastille de non-lus lue « 3 » sans contexte
    (`admin-nav.ts:76-82`), navigation réduite nommée par `title` seulement (`admin-nav.ts:71`),
    `target="_blank"` sans mention ni `rel` (`admin-cv.ts:38`). Le graphique n'a pas d'alternative
    textuelle (`admin-analytics-visitors-chart.ts:29`).

#### D. Mobile

16. Les tableaux (articles, messages) passent en défilement horizontal (`admin-table` utilise
    `min-w-max`, `styles.css` `@utility admin-table`) ; la catégorie et « Featured » d'un projet
    disparaissent sous `sm` (`admin-project-row.ts:56`) ; le formulaire inline, déjà long de
    quinze champs sans sections, s'ouvre sous une ligne de 48 px de vignette carrée qui rogne une
    couverture 16/10 (`admin-project-row.ts:23-28`).

#### E. Dette de structure (à traiter avec la refonte, pas avant)

17. `admin-table.ts` (244 lignes) et ses sept `admin-col-*` ne servent qu'à `admin-messages.ts` :
    une abstraction générique pour un seul consommateur. `THEME_FALLBACK` recopie les tokens
    (`admin-analytics.ts:38-48`). Six `@utility admin-*` de `styles.css` deviendront orphelins avec
    la nouvelle grammaire. `DESIGN.md` § Admin Table décrit des boutons `h-9` quand l'utility est
    en `h-11`.

### Ce qui est proposé (maquette)

Une seule grammaire pour le site et l'admin, plus dense côté admin :

- **Coque** : barre latérale sobre (filet `line`, aucune carte), monogramme « JN » du header
  public, groupes **Contenu** (Projets, Articles, CV), **Audience** (Audience, Messages),
  **Compte** (Paramètres), libellés de groupe mono 12 px. Page active : texte `foreground`
  semi-gras souligné de 2 px `primary`, comme `FilterGroup` ; `aria-current="page"`. Comptes en
  mono à droite (projets 6, articles 2, non-lus 0 avec « non lu » en `sr-only`). Pied : « Voir le
  site », bascule de thème, déconnexion, e-mail. Mobile : barre supérieure (monogramme, titre de
  la page, menu 44 px) et tiroir `Drawer` existant.
- **En-tête de page** partout : sur-titre mono `primary` porteur d'une donnée, `h1` Archivo 800
  élargi serré (environ 52 px au lieu de 84 px public), phrase d'introduction, action principale
  ou cartouche à droite.
- **Vue d'ensemble** : sur-titre « Mercredi 7 octobre 2026 · 30 derniers jours », phrase de
  synthèse générée (« 42 visiteurs en 30 jours, dont 18 venus de Google. Aucun message en
  attente… »), cartouche « En ligne » (2 en production, 2 démos, 2 scripts, 2 articles), relevé
  « Audience » (42 en grand + courbe à traits droits, puis 56 pages vues, 88,1 %, 22 s), relevé
  « Contacts » (0 non lu, 0 CV), état vide dessiné (tampon « Boîte vide » + phrase + lien), contenu
  en ligne avec vignettes et tampons, actions rapides.
- **Projets** : lignes éditoriales (numéro d'ordre, couverture 16/10 avec tampon de nature,
  sur-titre « 01 · Application Web », titre, accroche, repères Stack et « Accueil : mis en avant »),
  signalement d'une accroche vide (CandiDash), trois boutons icônes nommés (« Modifier :
  DashFlow »…), filtre par **nature** en onglets (Tous 6, En production 2, Démos 2, Scripts 2) à
  la place du `select` par catégorie.
- **Éditeur de projet** : page dédiée, fil d'Ariane, sections `01 · Identité`,
  `02 · Présentation dans les Réalisations`, `03 · Liens`, `04 · Choix techniques`,
  `05 · Galerie` ; nature choisie par trois cartes-radios portant le tampon et sa définition ;
  compteurs « 137 / 160 » ; champs répétés avec étiquettes ; aperçu de la carte publique et
  sommaire d'état à droite (collants) ; barre d'actions collante « N modifications non
  enregistrées · Annuler · Enregistrer ».
- **Articles** : tableau sans cadre (filets), vignette, sujets en mono, tampon « Publié » /
  « Brouillon » (trait tireté), date « 9 sept. 2026 », durée de lecture, j'aime, actions nommées,
  filtre Tous / Publiés / Brouillons.
- **Audience** : période en onglets (supprime le bug du point 2), relevé de quatre chiffres
  séparés par des filets (pas quatre cartes), courbe visiteurs `primary` plein + pages vues
  `foreground` tiretée (une seule teinte), dates françaises, tableau de données en
  `details`, pages et provenance en tableaux à barres fines avec part en %, événements en listes
  de repères. Les donuts disparaissent.
- **Messages, CV, Paramètres** : même en-tête ; état vide dessiné ; gabarit de ligne de message
  (bouton de dépliage avec `aria-expanded`, tampon « Nouveau », actions nommées) ; CV en
  cartouche ; paramètres en lignes (double authentification, session, thème Système / Clair /
  Sombre).

Données de la maquette : relevées en prod le 2026-10-07 (KPI, pages, provenance, projets,
articles, CV). Inventées et marquées comme telles dans la maquette : les accroches hors DashFlow
(l'API n'en fournit pas encore), la durée de lecture du second article, la ligne « Brouillon »,
le message de démonstration, la section « Ce que les visiteurs font », la ligne « Accès direct »
(42 − 20 sessions) et « Autres pages » (56 − 45 vues), la courbe (redessinée d'après la capture,
totaux respectés).

### Hors périmètre

- Aucune évolution de l'API (sauf arbitrage 5 si retenu).
- Pages `login`, `two-factor` et le parcours de configuration 2FA (`settings/security`) : même
  gabarit plus tard.
- Éditeur Markdown riche : le formulaire d'article garde sa zone Markdown et son aperçu.

### Contraintes

- `CLAUDE.md` et `DESIGN.md` : Tailwind seul, `shared/ui` pour toute structure réutilisée
  (`Cartouche`, `Stamp`, `FilterGroup`, `FactList` existent déjà), One Indigo, Two Registers,
  Decorative Line Rule, aucune police ni dépendance nouvelle.
- Signal Forms pour l'éditeur (pas de retour à Reactive Forms).
- Le bord de champ doit atteindre 3:1 : proposer un token `--color-field` (`foreground` à 50 % en
  Ivoire, 38 % en Console, seuils de la Decorative Line Rule) plutôt que `muted/30`.

## Arbitrages proposés

1. **Nom de « Analytics ».** Options : « Audience », « Statistiques », « Fréquentation ».
   *Recommandation : « Audience »*, cohérent avec le groupe de navigation et avec ce que la page
   mesure (des personnes, pas des requêtes). « Statistiques » reste un bon second choix si
   d'autres chiffres non liés aux visiteurs y entrent. L'URL `/admin/analytics` peut rester, ou
   devenir `/admin/audience` avec redirection (le fichier de routes en a déjà dix).
2. **Éditeur de projet : inline ou page dédiée `/admin/projects/:id` (et `/new`) ?**
   *Recommandation : page dédiée.* Le formulaire fait quinze champs plus deux listes répétées et
   une galerie ; inline, il casse la lecture de la liste, interdit l'aperçu latéral et le lien
   direct, et oblige à gérer un seul « en édition » à la fois. Une route donne un `title`, un
   `CanDeactivateFn` pour les modifications non enregistrées, et le raccourci « Nouveau projet »
   du tableau de bord devient vrai. Même choix pour les articles (`/admin/blog/:id`).
3. **Aperçu en direct de la carte publique ?** *Recommandation : oui, à partir de `lg`*, en
   réutilisant les composants publics (`ProjectCaseStudy` / `ProjectGridCard`) alimentés par un
   `computed()` du modèle du formulaire, et non une copie. Coût faible, et c'est le seul moyen de
   voir l'effet d'une accroche ou d'un changement de nature avant le redéploiement. Sous `lg` :
   un lien « Aperçu » ancré, pas de panneau.
4. **Périmètre de la première PR.** *Recommandation : trois PR indépendantes, dans cet ordre :*
   (a) **correctifs sans refonte** : confirmation de suppression, période d'Audience, états
   chargement / erreur / vide, thème appliqué sous `/admin`, lecture des messages au clavier,
   libellés français (points 1 à 6, 14, 15) ; (b) **coque + vue d'ensemble + en-têtes de pages**
   (navigation, thème, grammaire commune, Audience) ; (c) **projets : liste, page d'édition,
   aperçu**, puis articles. (a) répare des risques réels en prod et ne dépend pas de la
   validation visuelle.
5. **Contenu de la vue d'ensemble.** La phrase de synthèse et les relevés n'utilisent que des
   endpoints existants (`overview`, `chart`, `referrers`, compteurs). *Recommandation : s'en
   tenir là*, sans « dernier déploiement » ni statut 2FA tant que l'API ne les expose pas (la
   maquette renvoie la 2FA vers Paramètres plutôt que d'afficher un état inventé).
6. **Densité.** *Recommandation : densité « atelier »* : corps 15 px, tableaux 14,5 px, mono
   12 px minimum (plus de 10 px), `h1` vers 52 px, cibles 44 px conservées, filets plutôt que
   cartes. Le public reste plus aéré ; l'admin garde la même grammaire avec des marges
   resserrées. À ajuster sur les captures si la vue d'ensemble paraît trop éditoriale.

### Réponses (2026-10-07)

1. **Direction visuelle** de la maquette : validée.
2. **« Analytics » devient « Audience ».** URL canonique `/admin/audience` ; `/admin/analytics`
   (et ses anciennes redirections `stats`, `analytics/visits`, `analytics/projects`) redirige
   dessus. Justification au § Plan, tranche B1.
3. **Édition en page dédiée** pour les projets et les articles (`/admin/projects/new`,
   `/admin/projects/:id`, `/admin/blog/new`, `/admin/blog/:id`), aperçu en direct de la carte
   publique à droite à partir de `lg`, `CanDeactivateFn` contre les modifications non
   enregistrées (ADR-0013).
4. **Trois PR, dans l'ordre (a) → (b) → (c)** ; (c) est scindée en **c1** (édition : projets et
   articles) et **c2** (Audience, Messages, CV, Paramètres, nettoyage).
5. **Par défaut, à confirmer en revue** : vue d'ensemble construite sur les endpoints existants
   seulement ; densité intermédiaire (corps 15 px, tableaux 14,5 px, mono 12 px minimum, `h1`
   vers 52 px, cibles 44 px, filets plutôt que cartes) ; nouveau token `--color-field` pour le
   bord des champs (≥ 3:1).

## Plan technique

> Profil lu (`.claude/project-profile.md`). Validation runtime aux frontières non vérifiée
> (adapters purs, pas de lib côté front) : inchangé par cette spec. ADR : **ADR-0012** (thème),
> **ADR-0013** (édition en pages dédiées, aperçu public). Aucune évolution d'API, aucune
> dépendance nouvelle, aucune police nouvelle.

### 1. Décisions structurantes

| # | Décision | Où |
|---|---|---|
| D1 | `ThemeStore` (`core/theme/`) seule source de vérité du thème, instancié par `App`, script de pré-peinture dans `index.html`, `ThemeWatcher` supprimé | ADR-0012, A4 |
| D2 | `/admin/audience` canonique, `/admin/analytics` redirigé | B1 |
| D3 | `App` reste seul propriétaire de `<main>` ; la coque admin n'émet ni `main` ni `aside`, seulement un `<nav aria-label="Administration">` | B1 |
| D4 | Confirmation de suppression par un `<dialog>` natif modal (`shared/ui/confirm-dialog.ts`) | A1 |
| D5 | Erreur ≠ vide : les gateways admin cessent d'avaler les erreurs (`catchError → [] / 0`), précédent `HttpProjectsGateway.allProjects$` | A3 |
| D6 | Token `--color-field` (bord de champ, ≥ 3:1) et `--color-on-status-error` (texte sur rouge plein) | § 3, A1, A7 |
| D7 | Frontière presenter : **fonctions pures `toXView`** + `computed()` dans la page (précédent `toProjectsView`, `toBlogListView`), pas de classe presenter ; une **facade** `AudienceReport` pour Audience seule (11 ressources) | § 5, C7 |
| D8 | Éditeur : la page possède le brouillon, le formulaire l'édite en `model()` ; aperçu par les composants publics via builders exportés et requêtes de conteneur | ADR-0013, C1 à C6 |
| D9 | Composants de grammaire admin dans `features/admin/application/components/` (un seul consommateur de feature) ; dans `shared/ui/` seulement ce qui sert ou servira hors admin (`ConfirmDialog`, `LoadError`) | § 6 |
| D10 | Coque en barre latérale à partir de `lg` (1 024 px, breakpoint Tailwind natif) au lieu des 900 px de la maquette | B1 |

### 2. Architecture

```mermaid
flowchart LR
  subgraph core
    TS[ThemeStore]
    AUTH[AuthStore]
  end
  APP[App: main + router-outlet] --> TS
  HDR[Header public] --> TS
  subgraph admin[features/admin/application]
    LAY[AdminLayout + AdminNav] --> TS
    LAY --> GWs
    PAGES[Pages: Overview, Projects, Blog, CV, Messages, Audience, Settings] --> VIEWS[toXView purs]
    ED[AdminProjectEditor / AdminPostEditor] --> FORM[AdminProjectForm / AdminPostForm via model]
    ED --> PREV[AdminProjectPreview / AdminPostPreview inert]
    AUD[AdminAudience] --> FAC[AudienceReport facade]
  end
  PREV --> PUB[projects / blog application: ProjectCaseStudy, ProjectGridCard, BlogPostRow, toCaseStudyView, toProjectCardView, toBlogPostRowView]
  PAGES --> GWs[ProjectsGateway, BlogGateway, ContactGateway, CvGateway, AnalyticsGateway]
  ED --> GWs
  FAC --> GWs
  GWs --> API[(API NestJS, repo séparé)]
```

- **Couches** : `domain` (inchangé hors suppressions), `infra` (gateways contact, projets, blog :
  erreurs et cache), `application` admin (pages smart + composants dumb + builders purs), `core/theme`
  (nouveau), `shared/ui` (`ConfirmDialog`, `LoadError`, retouches `Button`, `Tag`, `Stamp`,
  `FilterGroup`).
- **Frontière `admin` ↔ `projects` / `blog`** : l'admin importe les **composants de carte**, les
  **builders de vue** exportés et le **domaine** (`countProjectsByKind`, `filterProjectsByKind`,
  `projectPitch`, `projectStack`, `readingTimeMinutes`, libellés `PROJECT_KIND_*`) ; jamais l'inverse.
  Les brouillons (`ProjectDraft`, `PostDraft`) et leurs adapters vers `Project` / `BlogPost` vivent
  dans l'admin. Le seul changement imposé aux features publiques : exporter trois builders et passer
  deux cartes en requêtes de conteneur (ADR-0013 §4).
- **Landmarks (ownership unique)** : `App` possède `<main>` (seul `main` de toute page), le `Header`
  public possède `banner` et le `Footer` `contentinfo`, tous deux absents sous `/admin`. La coque
  admin ne rend **ni** `<main>` **ni** `<aside>` (aujourd'hui `admin-layout.ts` imbrique un second
  `main` dans celui d'`App`) : barre latérale = `div` portant `<nav aria-label="Administration">`,
  barre mobile = `div`. Le `Drawer` existant porte `role="dialog"`.
- **Presenter / view-model** : chaque écran dérivé (vue d'ensemble, liste projets, liste articles,
  Audience, messages, CV) a son builder pur `toXView(...)` testé sans TestBed ; le composant ne garde
  que la glue (ressources, interaction, focus). Heuristique appliquée : tout composant qui mêle DOM
  (focus, `dialog`, `viewChild`) et dérivation non triviale sort la dérivation dans un builder.
  Composants purement présentationnels (lignes, relevé, en-tête) : pas de builder.

### 3. Tokens et contrastes (calculés)

Méthode : OKLCH → sRGB linéaire (matrices d'Ottosson), `color-mix(in srgb, X p%, transparent)`
composé sur le fond en sRGB encodé, luminance relative et ratio WCAG 2.x
`(L1 + 0,05) / (L2 + 0,05)`. Fonds : Ivoire `oklch(97% 0.008 87)`, surface Ivoire blanche ;
Console `oklch(14.5% 0.003 286)`, surface Console = blanc 3 % composé. Valeurs vérifiées par script
(mêmes résultats que la `## Description` : 2,80 / 2,82 / 2,54 / 2,75 / 1,6).

| Usage | Avant | Après | Ivoire | Console | Seuil |
|---|---|---|---|---|---|
| Bord de champ (`form-input`, `app-select`) | `muted/30` : 1,60 fond / 1,62 surface (Iv.), 1,66 / 1,71 (Co.) | `--theme-field` = `foreground` 50 % (Iv.), 38 % (Co.) | 3,04 fond / 3,11 surface | 3,41 fond / 3,47 surface | 3:1 (1.4.11) |
| Texte de substitution | `muted/60` : 2,92 (Iv.) | `muted` | 7,86 | 7,14 | 4,5:1 |
| Texte sur rouge plein (`Button` danger solide) | blanc : 6,42 (Iv.), **2,75** (Co.) | `--theme-on-status-error` = blanc (Iv.), `var(--theme-background)` (Co.) | 6,42 | 7,20 | 4,5:1 |
| « Supprimer » des lignes répétées | `text-red-400` : **2,54** (Iv.) | `Button` danger texte (`status-error`) | 5,89 (survol 4,90) | 7,20 (survol 6,48) | 4,5:1 |
| Pastilles « published », « Featured » | `status-*` sur `status-*/15` : **2,80 / 2,82** (Iv.) | `Stamp` (`foreground` sur fond) | 14,02 | 18,95 | 4,5:1 |
| Tag « info » restant (`primary` sur `primary/10`) | inchangé | inchangé | 6,81 | 7,28 | 4,5:1 |
| Sur-titre `text-primary`, page | — | — | 8,04 | 8,25 | 4,5:1 |
| Série « Visiteurs » (trait `primary`) | — | — | 8,04 | 8,25 | 3:1 |
| Série « Pages vues » (`foreground` 55 %, tiretée) | `accent` (2ᵉ teinte) | une seule teinte | 3,49 | 6,04 | 3:1 |

Choix : 50 % en Ivoire est le seuil de la Decorative Line Rule (`DESIGN.md`), marge faible (3,04) ;
38 % en Console laisse de la marge sur la surface translucide. Les traits `line` / `line-strong`
restent décoratifs (inchangés). `color-scheme: dark` sur `:root` et `light` sur
`:root:not(.app-dark)` : contrôles natifs (case à cocher, liste de `select`, barres de défilement) au
registre du thème ; pas de ratio à poser, rendu natif contrôlé par axe au navigateur.

### 4. Modèles de données

Immuables (`readonly`), `type`, unions plutôt qu'enums. Les modèles Signal Forms gardent des champs
mutables (précédent `ProjectFormModel` : le `FieldTree` écrit par `model.update`).

```ts
// core/theme/theme-preference.ts
export type ThemePreference = 'system' | 'light' | 'dark';
export function parseThemePreference(raw: string | null): ThemePreference; // 'dark' | 'light', sinon 'system'
export function resolveIsDark(preference: ThemePreference, systemPrefersDark: boolean): boolean;

// features/admin/application/admin-nav-groups.ts
export type AdminNavKey = 'overview' | 'projects' | 'posts' | 'cv' | 'audience' | 'messages' | 'settings';
export type AdminNavItem = {
  readonly key: AdminNavKey; readonly route: string; readonly icon: string; readonly label: string;
  readonly exact: boolean; readonly count: number | null; readonly countSuffix: string; // « non lu », sr-only
};
export type AdminNavGroup = { readonly label: string | null; readonly items: readonly AdminNavItem[] };
export type AdminNavCounts = { readonly projects: number | null; readonly posts: number | null; readonly unread: number | null };

// features/admin/application/project-draft.ts (ProjectFormModel actuel, renommé et exporté)
export type ProjectDraft = { title: string; category: string; description: string; liveUrl: string;
  repoUrl: string; repoUrlFront: string; repoUrlBack: string; featured: boolean; order: number;
  kind: ProjectKind | ''; techChoices: TechChoice[]; architectureDecisions: ArchitectureDecision[];
  pitch: string; highlight: string; scope: string };
export function toProjectDraft(project: Project | null): ProjectDraft;
export function toProjectInput(draft: ProjectDraft, tags: ReadonlySet<string>, kind: ProjectKind): ProjectInput;
export function toPreviewProject(draft: ProjectDraft, tags: ReadonlySet<string>, base: Project | null): Project | null;

// features/admin/application/post-draft.ts
export type PostDraft = Pick<BlogPostInput, 'title' | 'excerpt' | 'contentMarkdown' | 'status'>;
```

- **Compile-time plutôt que runtime** : `toProjectInput` exige `kind: ProjectKind` (le `''` du
  brouillon est exclu par la signature, garde `isProjectKind` existante en amont) ; `AdminNavKey`
  ferme les testids de navigation ; `FilterOption<T extends string>` type les filtres
  (`ProjectKindFilter`, `'all' | 'published' | 'draft'`, `'all' | 'unread' | 'read'`, `DateRangeKey`).
- `toPreviewProject` renvoie `null` tant que `kind === ''` (l'aperçu dépend de la nature) ;
  `pitch` vide → `null` (le public reprend alors la première phrase de la description,
  `projectPitch`) ; liens vides → `null` ; `image` = `base?.image ?? ''` ; `slug`, `id`, `gallery`
  repris de `base` (ou `''` / `[]`).

### 5. Réactivité et état partagé

- **Signals locaux** par défaut ; ressources `rxResource` (précédent du repo).
- **`resource.value()` lève en état d'erreur (Angular ≥ 20)** : toute lecture passe par
  `hasValue()` (`res.hasValue() ? res.value() : repli`), jamais `value() ?? repli` sur une
  ressource qui peut échouer. C'est la condition pour que D5 ne casse pas les `computed`.
- **Store** : `ThemeStore` seulement (possède la préférence, partagée par 5 consommateurs non liés,
  mutations = commandes internes). Expose `preference` et `isDark` en `Signal<T>` (`asReadonly()`).
- **Facade** : `AudienceReport` (`features/admin/application/audience-report.ts`, fournie dans les
  `providers` de la page, instance-scopée) : front de `AnalyticsGateway` sur une période, ré-expose
  les vues dérivées ; pas un store, pas de suffixe `Store`.
- **Gateways** (contrats abstraits existants, inchangés dans leur forme) : `ContactGateway` et
  `BlogGateway` gagnent un flux partagé invalidable (précédent `allProjects$` :
  `retry(1)` + `share({ connector: ReplaySubject(1), resetOnError: true, resetOnComplete: false,
  resetOnRefCountZero: false })`). Aucun `HttpClient` dans un composant.
- **Comptes de navigation** : la coque et les pages s'abonnent au **même** flux de gateway
  (projets, articles admin, non-lus) ; une écriture invalide le flux, la coque se met à jour sans
  store dédié.
- **Horloge** : la date du jour est lue à la construction de la page (`new Date()`), plus jamais
  figée au chargement du module (`FORMATTED_DATE` actuel) ; tests sous `vi.setSystemTime`.

### 6. Fichiers

Chemins relatifs à `src/app/` sauf mention. `(+spec)` = spec créé ou modifié dans la même tranche.

**PR a** — créer : `shared/ui/confirm-dialog.ts` (+spec), `shared/ui/load-error.ts` (+spec),
`core/theme/theme-store.ts` (+spec), `core/theme/theme-preference.ts` (+spec). Modifier :
`app.ts`, `layout/components/header/header.ts` (+spec), `shared/ui/button.ts` (+spec),
`shared/ui/tag.ts` (+spec), `features/blog/application/components/blog-comments.ts` (+spec),
`features/contact/infra/gateways/http-contact.gateway.ts` (+spec),
`features/projects/domain/gateways/projects.gateway.ts`,
`features/projects/infra/gateways/http-projects.gateway.ts` (+spec),
`features/analytics/domain/analytics-presenter.ts` (+spec), `features/admin/admin.routes.ts`,
`features/admin/application/{admin-layout,admin-projects,admin-blog,admin-cv,admin-messages,admin-dashboard,admin-analytics}.ts`
(+specs), `features/admin/application/components/{admin-nav,admin-project-row,admin-project-inline-form,admin-analytics-header,admin-analytics-kpis,admin-table,admin-column-base,admin-col-expand,admin-col-actions,analytics-entity-list}.ts`
(+specs), `shared/ui/file-dropzone.ts` (+spec), `src/index.html`, `src/styles.css`, `DESIGN.md`. Supprimer :
`shared/theme/theme-watcher.ts` (+spec), `features/projects/domain/models/project-filter.model.ts`.

**PR b** — créer (dans `features/admin/application/`) : `admin-nav-groups.ts` (+spec),
`admin-page-copy.ts` (+spec), `admin-overview.ts` (+spec), `overview-view.ts` (+spec),
`overview-copy.ts` (+spec), `chart-palette.ts` (+spec), `with-first-of-month.ts`,
`pluralize.ts` (+spec), `capitalize.ts` (+spec), `components/admin-page-header.ts` (+spec),
`components/admin-section-head.ts`, `components/admin-readout.ts` (+spec),
`components/admin-empty-state.ts` (+spec), `components/overview-audience.ts` (+spec),
`components/overview-contacts.ts` (+spec), `components/overview-content.ts` (+spec),
`admin-layout.spec.ts`, `components/admin-nav.spec.ts` ; builders de test
`features/analytics/testing/analytics-builders.ts`, `features/auth/testing/user-builders.ts`.
Modifier : `admin.routes.ts`, `admin-layout.ts`, `components/admin-nav.ts`, pages (en-têtes),
`features/blog/domain/gateways/blog.gateway.ts`,
`features/blog/infra/http-blog.gateway.ts` (+spec), `features/analytics/domain/analytics-presenter.ts`
(+spec). Supprimer : `admin-dashboard.ts` (+spec).

**PR c1** — créer : `admin-project-editor.ts` (+spec), `admin-post-editor.ts` (+spec),
`project-draft.ts` (+spec), `post-draft.ts` (+spec), `admin-projects-view.ts` (+spec),
`admin-posts-view.ts` (+spec), `count-draft-changes.ts` (+spec), `unsaved-changes-guard.ts` (+spec),
`components/admin-form-section.ts` (+spec), `components/admin-save-bar.ts` (+spec),
`components/admin-form-toc.ts` (+spec), `components/admin-project-preview.ts` (+spec),
`components/admin-post-preview.ts` (+spec). Renommer (`git mv`, puis restructurer) :
`components/admin-project-inline-form.ts` → `components/admin-project-form.ts` (+spec),
`components/admin-blog-form.ts` → `components/admin-post-form.ts` (+spec). Modifier :
`admin.routes.ts`, `admin-projects.ts`, `admin-blog.ts`, `components/admin-project-row.ts`,
`admin-overview.ts`, `shared/ui/stamp.ts` (+spec), `features/projects/application/projects-view.ts`,
`features/projects/application/components/project-case-study.ts` (+spec),
`features/blog/application/blog-list-view.ts`,
`features/blog/application/components/blog-post-row.ts` (+spec),
`features/projects/domain/gateways/projects.gateway.ts`,
`features/projects/infra/gateways/http-projects.gateway.ts` (+spec), `DESIGN.md`.

**PR c2** — créer : `audience-report.ts` (+spec), `audience-view.ts` (+spec), `admin-cv-view.ts`
(+spec), `admin-messages-view.ts` (+spec), `components/audience-chart.ts` (+spec),
`components/audience-share-table.ts` (+spec), `components/audience-tally.ts` (+spec),
`components/admin-message-row.ts` (+spec), `admin-cv.spec.ts`, `admin-settings.spec.ts`. Renommer :
`admin-analytics.ts` → `admin-audience.ts` (+spec). Modifier : `admin.routes.ts`, `admin-messages.ts`,
`admin-cv.ts`, `admin-settings.ts`, `features/auth/application/two-factor-setup.ts` (+spec),
`shared/ui/filter-group.ts` (+spec),
`features/analytics/domain/analytics-presenter.ts` (+spec), `src/styles.css`, `DESIGN.md`. Supprimer :
`components/{admin-analytics-header,admin-analytics-kpis,admin-analytics-visitors-chart,admin-analytics-cv-panel,analytics-bar-list,analytics-donut-panel,analytics-entity-list,admin-table,admin-col-actions,admin-col-badge,admin-col-contact,admin-col-date,admin-col-expand,admin-col-text,admin-column-base}.ts`
(+specs), `shared/ui/tag.ts` (+spec) si plus aucun consommateur, les onze `@utility admin-*` de
`styles.css`.

### 7. Tranches

Chaque tranche : `qa` écrit les tests de la tranche (RED prouvé), `angular-expert` les fait passer
(GREEN) puis refactore sous vert. Les tranches d'une PR sont ordonnées ; aucune ne casse une tranche
antérieure.

#### PR a — correctifs sans refonte (branche `fix/admin-correctifs`)

- **Tranche A1 — supprimer demande confirmation (projet, article, CV, message).**
  - Fichiers : `shared/ui/confirm-dialog.ts` (nouveau), `shared/ui/button.ts`, `src/styles.css`
    (token `on-status-error`), `admin-projects.ts`, `components/admin-project-row.ts`,
    `admin-blog.ts`, `admin-cv.ts`, `admin-messages.ts` (+specs).
  - Contrat `ConfirmDialog` (`app-confirm-dialog`) : `open = input.required<boolean>()`,
    `heading = input.required<string>()`, `confirmLabel = input.required<string>()`,
    `cancelLabel = input('Annuler')` ; `confirmed = output<void>()`, `cancelled = output<void>()` ;
    contenu projeté = conséquence. `<dialog aria-labelledby aria-describedby>` piloté par
    `afterRenderEffect({ write })` (`showModal()` / `close()`), Échap (événement `cancel`) et
    « Annuler » → `cancelled` ; focus initial sur « Annuler » (`autofocus`) ; confirmation =
    `app-button severity="danger"` plein. testids `confirm-dialog`, `confirm-dialog-heading`,
    `confirm-dialog-confirm`, `confirm-dialog-cancel`.
  - Pages : `pendingDeletion = signal<T | null>(null)` ; la corbeille ne fait que le poser ;
    `confirmed` lance la suppression existante (optimiste conservée) ; `cancelled` remet `null`
    sans appel. Après suppression confirmée, focus sur le `h1` de la page (`tabindex="-1"`, testid
    `admin-page-title`) : le déclencheur a disparu. Textes (copie à valider) : « Supprimer le
    projet DashFlow ? » / « Le projet disparaît des Réalisations et de l'accueil au prochain
    déploiement, avec ses captures. Cette action est définitive. » / bouton « Supprimer
    DashFlow » ; même gabarit pour l'article, le message (« Supprimer le message de Claire
    Martin ? ») et le CV (« Retirer le CV du site ? »).
  - testids des déclencheurs : `admin-project-delete`, `admin-post-delete`, `admin-cv-delete`,
    `message-delete`.
  - `Button` danger plein : `text-white` → `text-on-status-error` (corrige aussi
    `two-factor-disable-form` en Console, 2,75 → 7,20).
  - Tests : dialog (ouverture = `dialog.open`, Échap → `cancelled`, confirmation → `confirmed`) ;
    par page (`it.each` sur les 4 pages possible) : clic corbeille → dialog visible et gateway non
    appelé ; confirmer → `delete*` appelé une fois ; annuler → jamais.
  - Supprimé : rien. Risques : happy-dom 20.9 implémente `HTMLDialogElement.showModal` (vérifié)
    mais l'Échap n'y émet pas `cancel` → le test émet l'événement `cancel` lui-même ; la
    suppression d'un **message** n'était pas dans la liste de la PR a, ajoutée car même défaut,
    même composant (signalé à la session principale).

- **Tranche A2 — la période d'Audience affichée est celle des données.**
  - Fichiers : `components/admin-analytics-header.ts` (+spec).
  - Cause : `[value]` posé sur le `<select>` avant que le `@for` crée les `<option>` ; le
    navigateur retombe sur la première (« 7 derniers jours »), et la liaison ne se rejoue jamais
    tant que le signal ne change pas.
  - Contrat : plus de `[value]` sur le `select` ; chaque option porte
    `[selected]="opt.value === dateRange()"` ; `(change)` inchangé.
  - Tests : `it.each` sur les 4 valeurs : `setInput('dateRange', v)` → `select.value === v` et
    libellé de l'option sélectionnée attendu (RED sur `'30d'` aujourd'hui).
  - Supprimé : rien. Risque : même défaut latent sur le filtre par catégorie des projets
    (`admin-projects.ts`), masqué parce que la valeur initiale est la première option ; supprimé en
    C2, pas corrigé ici.

- **Tranche A3 — chargement, erreur et vide sont trois états distincts.**
  - Fichiers : `shared/ui/load-error.ts` (nouveau), `http-contact.gateway.ts`,
    `projects.gateway.ts`, `http-projects.gateway.ts`, `admin-projects.ts`, `admin-blog.ts`,
    `admin-messages.ts`, `admin-dashboard.ts`, `admin-cv.ts`, `admin-layout.ts` (+specs).
  - Contrat `LoadError` (`app-load-error`) : `message = input.required<string>()`,
    `retry = output<void>()` ; hôte `role="alert"` ; `app-button` secondaire « Réessayer ».
    testids `load-error`, `load-error-retry`. (Le site public a ce gabarit en ligne dans
    `projects.ts` et `blog-list.ts` : migration hors spec.)
  - Gateways : `getAllMessages()` sans `catchError → []` ; non-lus sans `catchError → 0`, flux
    partagé au précédent `allProjects$` (`retry(1)`, `resetOnError: true`) ; la liste admin des
    projets lit `getAllProjects()` (erreurs propagées, invalidée après écriture) au lieu de
    `filterProjects({})` qui avalait les erreurs.
  - Chaque page : `@if (chargement initial)` squelette (`admin-<x>-loading`, `AppSkeleton` +
    texte `sr-only` en `role="status"`), `@else if (status() === 'error')` `app-load-error`
    → `reload()`, `@else if (vide)` texte vide (`admin-<x>-empty`), sinon contenu. Tableau de bord :
    compteurs indisponibles affichés « — » + `sr-only` « indisponible »
    (`dashboard-unread-count`, `dashboard-cv-count`). CV : chargement manuel `loadCv()` remplacé
    par une `rxResource` ; le toast d'échec de chargement disparaît (l'état le remplace). Coque :
    pastille de non-lus masquée en erreur.
  - Tests : par page, `it.each` sur (chargement, erreur, vide, données) → un seul des quatre
    testids présent ; `retry` relance la requête (`HttpTestingController`) ; gateway contact :
    erreur HTTP propagée, nouvel abonnement après erreur → nouvelle requête.
  - Supprimé : `ProjectsGateway.filterProjects` (+ impl + specs), `project-filter.model.ts`,
    `AdminCv.loadCv`, les deux `catchError` de `HttpContactGateway`.
  - Risque : `errorToastInterceptor` émet aussi un toast sur un GET ≥ 500 (double signal assumé,
    inchangé).

- **Tranche A4 — le thème est juste sous `/admin` et partagé avec le site (ADR-0012).**
  - Fichiers : `core/theme/theme-preference.ts`, `core/theme/theme-store.ts` (nouveaux),
    `app.ts`, `header.ts`, `blog-comments.ts`, `admin-analytics.ts`, `components/admin-nav.ts`,
    `admin-layout.ts`, `src/index.html`, `src/styles.css` (`color-scheme`) (+specs).
  - Contrat `ThemeStore` : `preference: Signal<ThemePreference>`, `isDark: Signal<boolean>`,
    `setPreference(p)`, `toggle()`. Clé `j-ned:theme` inchangée, `'system'` = clé absente,
    écriture au seul choix explicite. `App` injecte le store (instanciation au démarrage). Le
    `Header` lit `isDark()` et appelle `toggle()`. Bouton dans la coque admin : testid
    `admin-theme-toggle`, texte visible « Passer en mode clair » / « Passer en mode sombre ».
  - Pré-peinture, en tête de `<head>` (exemple) :
    ```html
    <script>try{var t=localStorage.getItem('j-ned:theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('app-dark')}catch(e){}</script>
    ```
  - Tests : `parseThemePreference` / `resolveIsDark` (`it.each`, TS pur) ; store : préférence
    stockée → classe posée, `setPreference('system')` retire la clé, changement `matchMedia`
    → `isDark` suit en `'system'` ; `toggle()` ; `Header` et coque admin : clic → classe et
    stockage ; `BlogComments` : thème Giscus suit `isDark` (doublure du store au lieu de
    `ThemeWatcher`).
  - Supprimé : `shared/theme/theme-watcher.ts` (+spec), logique de stockage du `Header`
    (`readStoredTheme`, `applyTheme`, `afterNextRender`, `effect`).
  - Risques : `header.spec.ts` attend aujourd'hui l'écriture de la valeur résolue au premier rendu
    (comportement retiré, test réécrit) ; règle dupliquée dans le script (ADR-0012).

- **Tranche A5 — messages ouvrables au clavier, tri annoncé.**
  - Fichiers : `components/admin-table.ts`, `components/admin-column-base.ts` (`isLabelHidden`,
    en-tête de la colonne de dépliage en `sr-only`), `components/admin-col-expand.ts`,
    `admin-messages.ts` (+specs).
  - Contrat : en-tête triable = `<th scope="col" [attr.aria-sort]>` (rôle `columnheader`
    conservé, `aria-sort` posé sur la colonne triée seulement) contenant
    `<button type="button" data-testid="sort-<key>">` ; colonne de dépliage =
    `<button type="button" data-testid="message-expand" [attr.aria-expanded]
    [attr.aria-controls]="'message-body-' + id">` avec `sr-only` « Afficher le message de X » /
    « Masquer le message de X » ; `AdminColExpand` reçoit `toggle: (row) => void` et
    `label: (row) => string` ; cellule dépliée `id="message-body-<id>"` (testid `message-body`).
  - Tests : un bouton par ligne, `aria-expanded` bascule, `aria-controls` = `id` du corps ;
    aucun `th[role=button]` ; clic sur le bouton de tri → `aria-sort` passe de `ascending` à
    `descending`.
  - Supprimé : `AdminTable.rowClick`, le `(click)` sur `<tr>`, `cursor-pointer` de `rowClass`.

- **Tranche A6 — libellés et nombres en français.**
  - Fichiers : `admin.routes.ts` (titres « Vue d'ensemble | Admin », « Articles | Admin »,
    « Audience | Admin »), `admin-layout.ts` (« Vue d'ensemble », « Articles », « Audience »),
    `admin-analytics-header.ts` (`h1` « Audience », « Exporter en CSV »),
    `admin-analytics-kpis.ts`, `admin-analytics.ts`, `admin-blog.ts` (« Publié » / « Brouillon »,
    « J'aime », date `d MMM y`), `admin-cv.ts` (« Mettre en ligne », « Mise en ligne… »,
    « Mis en ligne le », « Aucun CV en ligne »), `admin-project-row.ts`,
    `admin-project-inline-form.ts` (« Mettre en avant sur l'accueil », « Position dans la
    liste »), `analytics-presenter.ts` (+specs).
  - Contrat (domaine pur, `Intl` fr-FR) : `formatDuration(22)` → `22 s`, `formatDuration(65)` →
    `1 min 05 s` ; `pagesPerSession` → `1,3` ; nouveau `formatPercent(88.1)` → `88,1 %` ; libellés
    du graphique `formatChartDay('2026-09-07')` → `7 sept.` (`timeZone: 'UTC'`, sinon décalage d'un
    jour à l'ouest de Greenwich). Espace avant l'unité = U+00A0 (convention du repo), écrit
    explicitement, non délégué à `Intl` (dont le séparateur varie selon l'ICU). Libellé « 1,3 page
    par session » (singulier sous 2). CSV inchangé (format machine).
  - Tests : `it.each` sur les formateurs (0, 59, 60, 65, 3 600 s ; 0 session ; 0 / 88,1 / 100 %) ;
    textes des pages par testid.
  - Supprimé : `toFixed` locaux d'`admin-analytics.ts`.

- **Tranche A7 — contrastes, étiquettes et noms d'action.**
  - Fichiers : `src/styles.css` (`--theme-field`, `--color-field` ; `form-input` et `app-select` :
    `border-field`, `placeholder:text-muted`), `shared/ui/tag.ts`, `admin-blog.ts`,
    `components/admin-project-row.ts`, `components/analytics-entity-list.ts`,
    `components/admin-project-inline-form.ts`, `components/admin-col-actions.ts`,
    `admin-messages.ts`, `components/admin-nav.ts`, `admin-cv.ts`, `DESIGN.md` (+specs).
  - Contrat :
    - pastilles → `app-stamp` (« Publié », « Brouillon », « Mis en avant ») ; liste d'entités :
      `success` → `info` ; `AppTagSeverity` réduit à `'info' | 'secondary'` (variantes sans
      consommateur supprimées) ;
    - lignes répétées : `<label class="sr-only" for="tech-<i>-techno">Outil <i></label>`,
      « Raison <i> », « Décision <i> », « Justification <i> » ; boutons « Supprimer le choix
      technique <i> » / « Supprimer la décision <i> » en `app-button severity="danger"
      variant="text"` ;
    - « Position dans la liste » en `form-input` ; case « Mettre en avant » native
      (`accent-primary-bg size-5`, plus de `focus:` local : focus global `:focus-visible`) ;
    - ligne de projet : `aria-expanded` + `aria-controls` sur la bascule d'édition (testid
      `admin-project-edit-toggle`), noms « Modifier : X », « Fermer l'édition : X »,
      « Supprimer : X » ; articles « Modifier : X » / « Supprimer : X »
      (`admin-post-edit`, `admin-post-delete`) ; messages « Marquer comme lu : X » /
      « Supprimer le message de X » (libellés calculés par ligne dans `AdminColActions`) ;
    - navigation : `ariaCurrentWhenActive="page"` sur chaque lien, pastille « 3 » suivie de
      `<span class="sr-only"> non lus</span>` (testid `nav-unread-count`) ;
    - CV : `rel="noopener noreferrer"` + `sr-only` « (nouvel onglet) ».
  - Tests : structure (attributs, `label[for]` ↔ `id`, nom accessible distinct par ligne via
    `aria-label`/texte), `Tag` (deux sévérités) ; ratios non testables en unitaire → § 3 et axe au
    navigateur.
  - Supprimé : sévérités `success`, `warn`, `error` d'`AppTag` ; classes `text-red-400`,
    `border-foreground/20`, `focus:` locales.
  - Risque : `form-input` sert aussi le formulaire de contact public et la connexion : le bord
    plus foncé y apparaît (amélioration voulue, mentionnée dans la PR).

#### PR b — coque, vue d'ensemble, en-têtes (branche `feat/admin-coque`, depuis `master` après merge de a)

- **Tranche B1 — coque : navigation groupée, thème, « Voir le site », tiroir.**
  - Fichiers : `admin-nav-groups.ts` (nouveau), `admin-layout.ts`, `components/admin-nav.ts`,
    `admin.routes.ts`, `blog.gateway.ts`, `http-blog.gateway.ts`, `admin-blog.ts` (+specs).
  - Contrat `adminNavGroups(counts: AdminNavCounts): readonly AdminNavGroup[]` : `[null :
    Vue d'ensemble] · [Contenu : Projets (n), Articles (n), CV] · [Audience : Audience, Messages
    (n non lus)] · [Compte : Paramètres]` ; `activeNavLabel(groups, url)` pour la barre mobile.
  - `AdminNav` (dumb) : `groups = input.required<readonly AdminNavGroup[]>()`,
    `email = input<string>()`, `isDark = input.required<boolean>()` ; `navigate`, `themeToggle`,
    `logout` en `output<void>()`. `<nav aria-label="Administration">`, groupe = `div role="group"
    aria-labelledby` + libellé mono 12 px ; lien actif : `routerLinkActive` +
    `ariaCurrentWhenActive="page"`, style par variantes `aria-[current=page]:` (texte `foreground`
    semi-gras, soulignement 2 px `primary` comme `FilterGroup`) ; compte mono (`nav-count-<key>`,
    absent si `null`). Pied : « Voir le site » (`href="/"`, `target="_blank"`, `rel="noopener"`,
    `sr-only` « (nouvel onglet) », `admin-view-site`), bascule de thème (`admin-theme-toggle`),
    « Se déconnecter » (`admin-logout`), e-mail en mono. testids `nav-link-<key>`.
  - `AdminLayout` : barre latérale `hidden lg:flex sticky top-0 h-svh` (filet `line`, monogramme
    « JN » comme le `Header`), barre mobile `lg:hidden sticky top-0` (monogramme, libellé de la page
    active, bouton menu 44 px `aria-expanded` `aria-controls="admin-drawer"`, `admin-menu-button`),
    `Drawer` existant (`position="left"`, `heading="Administration"`). **Ni `main` ni `aside`**
    (D3). Contenu : `max-w-[72.5rem]`, `px-4 pt-7 pb-24 lg:px-14 lg:pt-11`, corps 15 px.
  - Comptes : la coque s'abonne à `getAllProjects()`, `getAllPostsForAdmin()` et
    `getUnreadCount()` ; `BlogGateway` gagne un flux admin partagé et `invalidateAdminPosts()`
    (précédent `allProjects$`) ; `AdminBlog` invalide au lieu de `reload()` après écriture.
  - Routes : `audience` (titre « Audience | Admin ») ; `analytics`, `analytics/visits`,
    `analytics/projects`, `stats` → `redirectTo: 'audience'`. Justification : l'URL est lue dans la
    barre d'adresse et l'historique au même titre que le libellé ; l'admin n'est ni prérendu ni
    indexé (aucun coût SEO) ; le fichier de routes porte déjà une section de redirections d'anciennes
    URL, les favoris restent valides. Le dossier `features/analytics` garde son nom (domaine du
    suivi, pas un libellé).
  - Tests : `adminNavGroups` (`it.each` : ordre, comptes `null` / 0 / n, suffixe) ; `AdminNav` sous
    `RouterTestingHarness` : `aria-current="page"` sur le seul lien actif, comptes, émissions ;
    `AdminLayout` : **aucun** élément `main` ni `aside` rendu, bouton menu → tiroir ouvert et
    `aria-expanded="true"` ; router : `/admin/analytics` → `/admin/audience`.
  - Supprimé : `collapsed`, `showCollapseButton`, `collapseToggle`, `displayName`,
    `AdminNavItem.badge: Signal`, `h2` « Admin », « Retour au site », `AppIconTile` de la coque.
  - Risque : `lg` (1 024 px) au lieu de 900 px (D10) : tiroir entre 900 et 1 023 px.

- **Tranche B2 — un en-tête de page commun.**
  - Fichiers : `components/admin-page-header.ts`, `admin-page-copy.ts` (nouveaux), toutes les pages
    (`admin-projects`, `admin-blog`, `admin-cv`, `admin-messages`, `admin-analytics-header`,
    `admin-settings`) (+specs).
  - Contrat `AdminPageHeader` (`app-admin-page-header`) : `overline = input.required<string>()`,
    `heading = input.required<string>()` ; contenu projeté par défaut = phrase d'introduction,
    `[adminPageAside]` = action principale ou cartouche. `<header class="grid gap-7 pb-8
    lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:gap-12">` ; sur-titre
    `font-mono text-[0.8125rem] text-primary` (`admin-page-overline`) ; `h1` (`admin-page-title`,
    `tabindex="-1"`) `text-[clamp(2.25rem,3.4vw,3.25rem)] font-extrabold leading-none
    tracking-[-0.04em]` ; introduction `max-w-[60ch] text-[1.0625rem] text-muted`.
  - `admin-page-copy.ts` (purs) : `projectsOverline` (« 6 réalisations · 2 mises en avant »),
    `postsOverline` (« 2 articles · 2 publiés · 0 brouillon »), `messagesOverline` (« 0 non lu ·
    0 au total »), `cvOverline` (« PDF · 76 Ko · mis en ligne le 19 sept. 2026 »),
    `audienceOverline(range, now)` (« 7 sept. au 6 oct. 2026 · 30 derniers jours »),
    `todayOverline(now)` (« Mercredi 7 octobre 2026 »).
  - Tests : composant (sur-titre, titre, projections) ; copies `it.each` (0, 1, n ; pluriels).
  - Supprimé : les `h1` ad hoc de chaque page. (`AdminTable.title`, `newRoute`, `newLabel` et son
    bloc d'en-tête : déjà supprimés en PR a, A1, quand le `h1` de Messages est passé dans
    `admin-messages.ts`.)

- **Tranche B3 — vue d'ensemble : en-tête, cartouche « En ligne », actions rapides.**
  - Fichiers : `admin-overview.ts`, `overview-view.ts` (nouveaux), `admin.routes.ts` (+specs) ;
    supprimer `admin-dashboard.ts` (+spec).
  - Contrat : sur-titre `todayOverline(now) + ' · 30 derniers jours'` ; `h1` « Vue d'ensemble » ;
    aside = `app-cartouche title="En ligne" reference="nedellec-julien.fr"
    [rows]="onlineRows()"` avec `toOnlineRows(projects, posts)` (« En production » → « 2 projets »,
    « Démos », « Scripts », « Articles » → « 2 publiés ») ; actions rapides (`quick-new-project` →
    `/admin/projects` en B, `/admin/projects/new` en C1 ; `quick-new-post` → `/admin/blog` ;
    `quick-cv` → `/admin/cv` ; `quick-audience` → `/admin/audience`). États par ressource
    (squelette / `LoadError`).
  - Tests : `toOnlineRows` (`it.each`, nature `null` ignorée, brouillons exclus) ; page : date du
    jour sous `vi.setSystemTime`, rangées du cartouche, liens.
  - Supprimé : `AdminDashboard`, `FORMATTED_DATE`, « Bonjour, <e-mail> », carte `accent`.

- **Tranche B4 — vue d'ensemble : relevé « Audience ».**
  - Fichiers : `components/admin-readout.ts`, `components/overview-audience.ts`,
    `chart-palette.ts` (nouveaux), `overview-view.ts`, `analytics-presenter.ts`,
    `admin-analytics.ts`, `admin-overview.ts` (+specs).
  - Contrat `AdminReadout` : `items = input.required<readonly ReadoutItem[]>()`,
    `ReadoutItem = { readonly label: string; readonly value: string; readonly unit: string;
    readonly detail: string }` ; `<dl>` filets (`border-t-[1.5px] border-line-strong`, séparateurs
    `line`), testids `readout-item`, `readout-value`, `readout-detail`.
  - `OverviewAudience` (dumb) : `visitors`, `sessions`, `readout`, `chartData`, `chartOptions`,
    `chartSummary` ; grand chiffre (`overview-visitors`), courbe `app-chart` dans un `<figure>`
    avec `figcaption sr-only` = `chartSummary(points)` (« Visiteurs par jour du 7 septembre au
    6 octobre 2026 : maximum 6 le 7 septembre. »).
  - Présentateur : `buildVisitorsChartData(rows, palette)` → une teinte (`primary` plein,
    `foreground` 55 % tireté `borderDash: [4, 4]`), `tension: 0`, libellés `formatChartDay` ; la
    page Audience l'adopte aussi. `readChartPalette(document)` lit `--theme-primary-text` et
    `--theme-foreground` au calcul (dépendance `ThemeStore.isDark()`), repli couleur système
    `CanvasText` (valide en canvas, sans couleur en dur).
  - Tests : `toAudienceReadout` (`it.each`, valeurs fr), `chartSummary` (vide, un pic, égalités),
    `buildVisitorsChartData` (une teinte, tirets, `tension 0`) ; composant : relevé et légende.
  - Supprimé : `THEME_FALLBACK`, `DEFAULT_PALETTE`, `accent` dans le graphique.

- **Tranche B5 — vue d'ensemble : contacts, contenu en ligne, phrase de synthèse.**
  - Fichiers : `components/admin-empty-state.ts`, `components/overview-contacts.ts`,
    `components/overview-content.ts`, `overview-copy.ts` (nouveaux), `overview-view.ts`,
    `admin-overview.ts` (+specs).
  - Contrat `AdminEmptyState` : `stamp = input.required<string>()`, texte et action projetés ;
    cadre tireté `line-strong` ; testid `empty-state`.
  - `OverviewContacts` : `unread: number | null`, `cvDownloads: number | null`,
    `latest: readonly ContactMessage[]`, `unreadLoading` / `cvLoading` (`boolean`, squelette au
    lieu de « indisponible » pendant le chargement) ; chiffres liés (`/admin/messages`,
    `/admin/cv`), unité accordée (« 1 message », « 2 téléchargements ») ; vide →
    `AdminEmptyState` « Boîte vide », « Aucun message pour l'instant. Le formulaire de contact de
    l'accueil est en ligne ; un nouveau message apparaîtra ici avec son sujet. » + lien « Voir le
    site » (`href="/"`, nouvel onglet). Décision de la revue de la PR b : pas de lien vers
    `/#contact`, l'accueil n'expose jamais la section en ancre (`home.ts`).
  - `OverviewContent` : `rows: readonly ContentRow[]` (`toContentRows(projects, posts, 5)` :
    articles publiés par date décroissante puis projets par `order`) ; vignette 16/10 ou 1200/630
    (`NgOptimizedImage fill`, `alt=""`), titre lien étiré, méta mono, `app-stamp` (nature ou
    « Publié »).
  - `overviewSummary(input)` (pur) : « 42 visiteurs en 30 jours, dont 18 venus de google.com.
    Aucun message en attente, aucun CV téléchargé. Six réalisations et deux articles sont en
    ligne. » ; chaque proposition omise si sa source est en erreur ou en chargement ; source de
    trafic = premier référent non vide, nom tel que renvoyé par l'API (pas de table de
    correspondance inventée).
  - Tests : `overviewSummary` (`it.each` : 0, 1, n, sources manquantes, aucun référent),
    `toContentRows` ; composants : état vide, liste.
  - Supprimé : rien de plus.

#### PR c1 — édition des projets et des articles (branche `feat/admin-edition`, après merge de b)

- **Tranche C1 — page d'édition d'un projet.**
  - Fichiers : `admin-project-editor.ts`, `project-draft.ts`, `components/admin-form-section.ts`
    (nouveaux) ; `git mv components/admin-project-inline-form.ts components/admin-project-form.ts`
    (+spec) ; `admin.routes.ts` (`projects/new`, `projects/:id`, avant `projects`),
    `admin-projects.ts`, `components/admin-project-row.ts`, `admin-overview.ts`
    (`quick-new-project` → `/admin/projects/new`) (+specs).
  - Contrat `AdminProjectForm` (dumb) : `value = model.required<ProjectDraft>()`,
    `tags = model.required<ReadonlySet<string>>()`, `projectId = input<string | null>(null)`,
    `gallery = input<readonly ProjectImage[]>([])`, `persistedCover = input('')` ;
    `submitted = output<ProjectInput>()`, `coverSelected = output<File>()`,
    `galleryChange = output<readonly ProjectImage[]>()`. `<form id="project-form" [formRoot]>`,
    sections `fieldset[app-admin-form-section]` : `01 · Identité` (titre, catégorie, nature en trois
    cartes-radios `input type="radio" [formField]="form.kind"` + `app-project-kind-stamp` +
    `PROJECT_KIND_DEFINITIONS`, position, mise en avant), `02 · Présentation dans les
    Réalisations` (accroche, point fort, périmètre avec compteurs « 137 / 160 », description,
    couverture), `03 · Liens` (sans préfixe `https://` : format stocké inchangé), `04 · Choix
    techniques` (tags `AdminTagsSelector`, lignes répétées étiquetées), `05 · Galerie`
    (`AdminProjectGallery` si `projectId`, sinon « Enregistrez le projet pour ajouter des
    captures. », `admin-project-gallery-pending`). testids conservés (`admin-project-pitch`,
    `-highlight`, `-scope`, `-*-error`, `admin-project-presentation`) ; `admin-project-kind` passe
    sur le `fieldset` de nature, options `admin-project-kind-<kind>` ; compteurs
    `admin-project-<champ>-count`.
  - `AdminFormSection` : sélecteur d'attribut sur `fieldset` (le `legend` reste enfant direct) ;
    `number`, `heading`, `description` requis ; testid `form-section`.
  - `AdminProjectEditor` (page) : `id = input<string>()` (absent sur `new`) ;
    `projectResource = rxResource({ params: () => this.id(), stream: ({ params }) =>
    gateway.getProjectById(params) })` ; `draft`, `tags`, `baseline` en `linkedSignal` sur la
    ressource ; enregistrement repris d'`AdminProjects` (création → téléversement de couverture →
    invalidations → `router.navigate(['/admin/projects', id], { replaceUrl: true })` ; mise à jour
    → téléversement puis `PATCH`, ligne de base remise à jour). En-tête : fil d'Ariane
    `nav aria-label="Fil d'Ariane"` « Projets / DashFlow », `h1` = titre ou « Nouveau projet »,
    lien « Voir la fiche publique » (nouvel onglet) si existant. États : squelette, `LoadError`
    + lien retour. Collaborateurs : `ProjectsGateway`, `HomeGateway`, `ToastStore`, `Router`.
  - Liste : la bascule d'édition devient `<a routerLink>` « Modifier : X » (`admin-project-edit`),
    « Nouveau projet » devient un lien.
  - Tests : `toProjectDraft` / `toProjectInput` (le « golden » du payload d'`admin-project-inline-form.spec`
    est déplacé ici), sections, radio → `kind`, soumission → `submitted` ; page : chargement par
    `id`, création → navigation `replaceUrl`, mise à jour → téléversement puis `PATCH`.
  - Supprimé : `editingId`, `showNewForm`, `toggleEdit`, `toggleNewForm`, `createProject`,
    `updateProject`, `updateGallery` d'`AdminProjects` (déplacés) ; `isEditing`, `editToggled`,
    `saved`, `cancelled`, `galleryChange` d'`AdminProjectRow` ; `cancelled` du formulaire.
  - Risque : `form()` sur un `ModelSignal` et `[formField]` sur des radios à prouver en RED dès
    cette tranche ; repli si refus : modèle interne en `linkedSignal` + `output` de valeur (renvoi
    de tranche à l'architecte).

- **Tranche C2 — liste éditoriale des projets, filtre par nature.**
  - Fichiers : `admin-projects-view.ts` (nouveau), `admin-projects.ts`,
    `components/admin-project-row.ts`, `projects.gateway.ts`, `http-projects.gateway.ts` (+specs).
  - Contrat `toAdminProjectsView(projects, filter)` : `filters` (Tous + 3 natures, comptes,
    `disabled` à 0, via `countProjectsByKind`), `rows` filtrées (`filterProjectsByKind`),
    `AdminProjectRowView = { id, slug, order: '01', overline: '01 · Application Web', title,
    pitch: string | null, image, kind, facts: readonly Fact[] }` (Stack 4 + « +N »,
    « Accueil : Mis en avant » si `featured`).
  - `AdminProjectRow` : `row = input.required<AdminProjectRowView>()`,
    `deleteRequested = output<void>()` ; grille `lg:grid-cols-[2.25rem_13.5rem_minmax(0,1fr)_auto]`,
    empilée dessous ; `app-project-cover` (16/10 + tampon) ; `h2` ; accroche `line-clamp-2` ;
    ligne « Accroche vide : la carte publique reprend la première phrase de la description. »
    (`admin-project-pitch-missing`) ; `app-fact-list` ; actions icônes nommées « Voir la fiche
    publique : X (nouvel onglet) » (`admin-project-view`), « Modifier : X », « Supprimer : X ».
    testid `admin-project-row`.
  - Page : `app-filter-group label="Filtrer par nature" [(active)]="filter"` ; confirmation A1
    conservée.
  - Tests : builder `it.each` (filtre, compteurs, nature `null` sous « Tous » seulement, accroche
    vide) ; ligne (noms d'action, lien externe) ; page (filtre).
  - Supprimé : `<select>` par catégorie, `selectedCategory`, `categoriesResource`,
    `ProjectsGateway.getCategories()` (+ impl + specs, dernier consommateur), `AppTag` de la ligne.

- **Tranche C3 — aperçu en direct de la carte publique (ADR-0013).**
  - Fichiers : `projects-view.ts` (export `toCaseStudyView`, `toProjectCardView` renommé de
    `toCardView`), `components/project-case-study.ts` (+spec : `@container` sur l'hôte, `lg:` →
    `@min-[60rem]:`), `project-draft.ts` (`toPreviewProject`), `components/admin-project-preview.ts`
    (nouveau), `admin-project-editor.ts` (+specs).
  - Contrat `AdminProjectPreview` : `project = input.required<Project | null>()`,
    `pendingCover = input(false)` ; cadre cartouche « Aperçu public » + référence
    « Réalisations · <nature> » + « en direct » ; corps `inert` (`admin-project-preview-body`) :
    `production` → `app-project-case-study [caseStudy]="toCaseStudyView(p, max(order,1) - 1)"`,
    `demo` / `script` → `app-project-grid-card [card]="toProjectCardView(p)"` ; `null` →
    « Choisissez une nature pour voir la carte. » ; `pendingCover` → « Nouvelle couverture :
    visible ici après l'enregistrement. » (`NgOptimizedImage` refuse `blob:`).
  - Page : `lg:grid-cols-[minmax(0,1fr)_25rem]`, aperçu `sticky top-6` à partir de `lg` ; sous
    `lg`, pas de colonne : le bloc d'aperçu suit le formulaire et un lien « Voir l'aperçu » de
    l'en-tête y mène (`routerLink="."` + `fragment`, cf. C4).
  - Tests : `toPreviewProject` (`it.each` : nature vide → `null`, accroche vide → `null`, liens
    vides → `null`, image et slug de la base) ; aperçu : étude de cas pour `production`, carte pour
    `demo`, attribut `inert` ; page : saisir l'accroche met à jour le texte de l'aperçu.
    `project-case-study.spec.ts` : l'assertion `lg:order-last` devient `@min-[60rem]:order-last`.
  - Supprimé : rien. Risque : bande de 16 px sur `/projects` (bascule à 1 008 px au lieu de
    1 024 px, ADR-0013 §4), à vérifier au navigateur à 1 008, 1 023 et 1 024 px.

- **Tranche C4 — modifications non enregistrées : barre, sommaire, garde.**
  - Fichiers : `count-draft-changes.ts`, `unsaved-changes-guard.ts`, `components/admin-save-bar.ts`,
    `components/admin-form-toc.ts` (nouveaux), `admin-project-editor.ts`, `admin.routes.ts`
    (+specs).
  - Contrat : `countChangedFields<T extends object>(a: T, b: T): number` (égalité profonde des
    lignes répétées, ensembles de tags comparés par contenu) ; `type LeaveConfirmable = { canLeave():
    boolean | Promise<boolean> }` ; `unsavedChangesGuard: CanDeactivateFn<LeaveConfirmable>`.
    L'éditeur ouvre son `ConfirmDialog` (« Quitter sans enregistrer ? », « Quitter sans
    enregistrer », « Continuer l'édition ») et résout la promesse ; `host: { '(window:beforeunload)':
    'warnBeforeUnload($event)' }`.
  - `AdminSaveBar` : `formId`, `changes`, `submitting`, `cancelRoute` requis ; `sticky bottom-0`,
    filet `line-strong` ; état `role="status"` « 2 modifications non enregistrées » / « Aucune
    modification » (`savebar-state`) ; « Annuler » lien (`savebar-cancel`) ; « Enregistrer »
    `<button type="submit" [attr.form]="formId">` (`savebar-submit`), désactivé **seulement**
    pendant l'envoi (règle Signal Forms de `CLAUDE.md`).
  - `AdminFormToc` : `sections: readonly { id; label; state: 'modifié' | '' }[]` ;
    `<nav aria-label="Sections du formulaire">`, liens `routerLink="." [fragment]="id"` (un
    `href="#id"` sous `<base href="/">` naviguerait vers `/#id`) ; `withInMemoryScrolling`
    (`anchorScrolling` déjà actif) fait défiler.
  - Tests : `countChangedFields` (`it.each`) ; garde (renvoie `canLeave()`) ; éditeur : saisie →
    « 1 modification… », navigation → dialog, confirmer → navigation faite, annuler → reste ;
    après enregistrement → pas de dialog (ligne de base remise **avant** la navigation
    `replaceUrl`).
  - Supprimé : rien.

- **Tranche C5 — page d'édition d'un article et aperçu.**
  - Fichiers : `admin-post-editor.ts`, `post-draft.ts`, `components/admin-post-preview.ts`
    (nouveaux) ; `git mv components/admin-blog-form.ts components/admin-post-form.ts` (+spec) ;
    `blog-list-view.ts` (export `toBlogPostRowView`, renommé de `toRowView`),
    `blog/application/components/blog-post-row.ts` (+spec, `@container`, `lg:` → `@min-[60rem]:`),
    `admin.routes.ts` (`blog/new`, `blog/:id`, garde), `admin-blog.ts` (+specs).
  - Contrat `AdminPostForm` : `value = model.required<PostDraft>()`,
    `tags = model.required<ReadonlySet<string>>()`, `persistedCover = input('')` ;
    `submitted = output<BlogPostInput>()`, `coverSelected = output<File>()` ; sections
    `01 · Article` (titre, extrait, sujets), `02 · Contenu` (Markdown + aperçu Markdown existant,
    ADR-0002), `03 · Couverture`, `04 · Publication` (radios Brouillon / Publié + mention de
    redéploiement).
  - `AdminPostEditor` : article trouvé dans `getAllPostsForAdmin()` (flux partagé B1) par
    `findPostById` (pur) → état « introuvable » ; même enregistrement qu'`AdminBlog.onSaved`
    (deux surfaces d'erreur conservées) ; `invalidateAdminPosts()` ; navigation `replaceUrl`
    après création ; `AdminSaveBar`, `AdminFormToc`, garde (C4) réutilisés.
  - `AdminPostPreview` : `app-blog-post-row [post]="toBlogPostRowView(p, false)"` dans un corps
    `inert`, temps de lecture en direct.
  - Tests : `toPostDraft`, `toPostInput`, `toPreviewPost`, `findPostById` (`it.each`) ; page :
    chargement, introuvable, création, mise à jour, garde ; aperçu.
  - Supprimé : `AdminBlog.editing`, `startCreate`, `onSaved`, `finishSave` ; nom `AdminBlogForm`.

- **Tranche C6 — liste des articles.**
  - Fichiers : `admin-posts-view.ts` (nouveau), `admin-blog.ts`, `shared/ui/stamp.ts` (+specs).
  - Contrat `toAdminPostsView(posts, filter, sortDir)` : `filters` Tous / Publiés / Brouillons
    (comptes, `disabled` à 0), `rows` (`id`, `slug`, `title`, `subjects` « A · B · C », `cover`,
    `status`, `publishedAt`, `readingTime` « 13 min », `likes`), tri par `publishedAt` (brouillons
    en fin dans les deux sens). `Stamp` gagne `dashed = input(false)` (Brouillon).
  - Page : `table` avec `caption sr-only`, colonnes Article / Statut / Publié le (triable, `th
    aria-sort` + `button`, `sort-published`) / Lecture / J'aime / actions ; actions nommées « Lire
    en ligne : X (nouvel onglet) » (publiés), « Modifier : X », « Supprimer : X » (A1). Sous `md`,
    Publié le, Lecture et J'aime masqués et repris dans la méta de l'article ; vignette masquée sous
    `sm` ; aucun défilement horizontal à 375 px.
  - Tests : builder (`it.each`), tri annoncé, filtre, `Stamp dashed`.
  - Supprimé : usages `admin-table-shell`, `admin-table`, `admin-th`, `admin-td`, `admin-row` dans
    `admin-blog.ts`.

#### PR c2 — Audience, Messages, CV, Paramètres (branche `feat/admin-audience`, après merge de c1)

- **Tranche C7 — Audience.**
  - Fichiers : `git mv admin-analytics.ts admin-audience.ts` (+spec) ; `audience-report.ts`,
    `audience-view.ts`, `components/audience-chart.ts`, `components/audience-share-table.ts`,
    `components/audience-tally.ts` (nouveaux) ; `shared/ui/filter-group.ts` (`count` facultatif,
    rendu seulement s'il est défini) ; `analytics-presenter.ts` ; `admin.routes.ts` (+specs).
  - `AudienceReport` (facade, `providers` de la page) : `range = signal<DateRangeKey>('30d')`,
    les onze ressources existantes, vues dérivées (`readout`, `pages`, `referrers`, `events`,
    `chart`) ; la page garde l'interaction (période, export, exclusion, visiteurs actifs).
  - En-tête : `AdminPageHeader` (sur-titre `audienceOverline`, introduction
    `audienceLead(overview, topReferrer)`), aside : visiteurs actifs (texte, pas de région live :
    rafraîchi toutes les 30 s), `device-exclusion-toggle` (`aria-pressed`, « Cet appareil est
    exclu » / « Exclure cet appareil »), « Exporter en CSV ». Période : `app-filter-group
    label="Période" [(active)]` (7 jours, 30 jours, 90 jours, Depuis le début).
  - `AudienceChart` : `app-chart` + `figcaption sr-only` + `<details>` « Voir les données en
    tableau » (table jour / visiteurs / pages vues, `audience-chart-table`).
  - `AudienceShareTable` : `title`, `unitLabel`, `rows: readonly ShareRow[]` avec
    `toShareRows(entries, total, limit, fallbackLabel)` → `{ label, count, share: '43 %', width }`
    et ligne « Autres » au-delà de `limit` ; barre `h-1 bg-primary` sur piste `bg-line` ;
    testid `share-row`.
  - `AudienceTally` : listes `dl` nom → nombre (projets cliqués, articles ouverts, lus jusqu'au
    bout, CTA, navigateurs, systèmes, pays) remplaçant les listes d'entités et les donuts.
  - Tests : `toShareRows` (`it.each` : somme, arrondi, « Autres », total 0), `audienceLead`,
    facade (changer la période relance les ressources avec les nouvelles dates, doublure
    `defer(() => of(...))`), tableau de données (une ligne par jour), `FilterGroup` sans compte.
  - Supprimé : `admin-analytics-header`, `admin-analytics-kpis`, `admin-analytics-visitors-chart`,
    `admin-analytics-cv-panel`, `analytics-bar-list`, `analytics-donut-panel`,
    `analytics-entity-list` (+specs) ; `buildDonutChartData`, `buildDonutOptions`, `buildPalette`,
    `barWidth` (+specs) ; `shared/ui/tag.ts` (+spec) si `grep` ne trouve plus de consommateur.

- **Tranche C8 — Messages.**
  - Fichiers : `components/admin-message-row.ts`, `admin-messages-view.ts` (nouveaux),
    `admin-messages.ts`, `src/styles.css`, `DESIGN.md` (+specs).
  - Contrat `AdminMessageRow` : `message = input.required<ContactMessage>()`,
    `expanded = input.required<boolean>()` ; `toggle`, `markRead`, `deleteRequested` en
    `output<void>()` ; bouton de dépliage (`message-expand`, `aria-expanded`, `aria-controls`),
    expéditeur + e-mail, sujet précédé d'`app-stamp` « Nouveau » si non lu, date relative dans un
    `<time datetime>`, actions « Répondre à X » (`mailto:`, `message-reply`), « Marquer comme
    lu : X » (`message-mark-read`, si non lu), « Supprimer le message de X » (`message-delete`,
    A1) ; corps `message-body`.
  - Page : `ul role="list"` triée par date décroissante ; `app-filter-group` Tous / Non lus / Lus
    (comptes, `disabled` à 0) au-dessus de `filterMessagesByReadStatus` (domaine existant) ;
    « Tout marquer comme lu » dans l'aside, `aria-disabled="true"` sans effet quand rien n'est non lu
    (reste focusable et annoncé) ; vide → `AdminEmptyState` « Boîte vide ».
  - Tests : builder (`it.each` filtre, ordre, comptes) ; ligne (noms, `aria-expanded`, lien
    `mailto`) ; page (vide, filtre, tout marquer).
  - Supprimé : `admin-table.ts`, `admin-column-base.ts`, les six `admin-col-*.ts` (+specs) ; les onze
    `@utility` `admin-table-shell`, `admin-table`, `admin-th`, `admin-th-sortable`, `admin-td`,
    `admin-row`, `admin-empty`, `admin-icon-btn`, `admin-icon-btn-danger`, `admin-pager-btn`,
    `admin-pager-btn-active` (`grep` à zéro avant suppression) ; § « Admin Table » de `DESIGN.md`
    remplacé par « Admin ». Risque : pagination retirée (0 message en prod ; au-delà de 100,
    règle de défilement virtuel de `CLAUDE.md` à reprendre).

- **Tranche C9 — CV.**
  - Fichiers : `admin-cv-view.ts` (nouveau), `admin-cv.ts`, `admin-cv.spec.ts` (nouveau).
  - Contrat : `toCvRows(cv, downloads)` → `CartoucheRow[]` (Mis en ligne `d MMM y`, Taille,
    Téléchargé « 0 fois en 30 j ») ; `formatFileSize(bytes)` (`76 Ko`, `1,2 Mo`) ; en-tête aside =
    `app-cartouche title="CV en ligne" [reference]="fileName"` ; « Ouvrir le PDF (nouvel onglet) »,
    « Retirer le CV du site… » (`app-button severity="danger" variant="text"`, A1) ; section
    « Remplacer le fichier » / « Mettre un CV en ligne » avec `FileDropzone` existant ; vide →
    `AdminEmptyState` « Aucun CV ».
  - Tests : builder (`it.each`), page (vide, en ligne, téléversement, retrait confirmé).
  - Supprimé : `formatDate`, `formatSize` privés, `formattedSelectedSize` (sans consommateur).

- **Tranche C10 — Paramètres.**
  - Fichiers : `admin-settings.ts`, `admin-settings.spec.ts` (nouveau).
  - Contrat : sections « Sécurité » (double authentification → `/admin/settings/security`,
    « Configurer » ; session « Connecté en tant que <e-mail> » + « Se déconnecter ») et
    « Apparence » : `<fieldset>` + `<legend>` « Thème de l'administration », radios natives
    Système / Clair / Sombre `[checked]="preference() === p"` `(change)="setPreference(p)"`
    (`theme-option-<p>`) ; phrase « Le même réglage que sur le site public, enregistré dans ce
    navigateur. » Pas de Signal Forms : réglage appliqué à la sélection (précédent du filtre en
    `[value]` + `(change)` de `CLAUDE.md`), pas de soumission.
  - Tests : radio cochée = préférence du store ; changement → `setPreference` ; `'system'`
    retire la clé.
  - `/admin/settings/security` (relevé par axe en PR a, page hors du reste de la spec) : la page
    reçoit un `h1` (`page-has-heading-one`, deux registres) et le statut « activée » de la double
    authentification passe au contraste AA en clair (`text-status-success` sur
    `status-success/10` échoue `color-contrast`). Fichier :
    `features/auth/application/two-factor-setup.ts`, composant de la route (+spec : `h1` présent,
    statut en tampon ou en texte contrasté).
  - Option (relevé de la revue de la PR b, à trancher avec l'utilisateur) : repères « CV en
    ligne » et « Sécurité » sous les actions rapides de la vue d'ensemble (maquette), non repris en
    B5.
  - Supprimé : carte bordée, `AppIconTile`.

### 8. Vérification au navigateur (pas d'e2e)

Méthode des revues 011, 012 et 014, étendue à l'admin. Aucun identifiant saisi, **aucune écriture
vers la prod** :

1. `pnpm run build --configuration production` (puis `git checkout public/rss.xml
   public/sitemap.xml`), `dist/angular-portfolio-app/browser` servi en local avec repli sur
   `index.csr.html` (port 4310).
2. Playwright (Chromium) : `localStorage['auth:session'] = '1'` ; **toutes** les requêtes vers
   `https://api.nedellec-julien.fr/**` interceptées : `GET /api/auth/me` → utilisateur fictif ;
   `GET` projets, articles admin, messages, non-lus, CV, statistiques → copies locales des
   réponses ; `GET /api/storage/**` laissé passer ; **toute autre méthode annulée** (`route.abort()`).
   Les suppressions et enregistrements se vérifient par la requête annulée (méthode, URL, corps),
   jamais par un appel réel.
3. Cas à rejouer par PR : (a) annuler puis confirmer une suppression (0 puis 1 `DELETE` annulé) ;
   `GET` en 500 → état d'erreur puis « Réessayer » ; rechargement direct de `/admin` en
   `j-ned:theme = 'dark'` → `.app-dark` présent **avant** le premier rendu (capture à
   `domcontentloaded`) ; période affichée = 30 jours ; messages au clavier seul (Tab, Entrée) ;
   axe-core WCAG 2.2 AA sur chaque page, deux registres. (b) navigation au clavier, `aria-current`,
   tiroir à 375 px, aucun `main` imbriqué (un seul `main` par page), `/admin/analytics` →
   `/admin/audience`. (c) édition, aperçu qui suit la saisie, garde à la navigation et au
   rechargement, `PATCH` / `POST` annulés avec le bon corps, `/projects` à 1 008, 1 023 et
   1 024 px ; captures 1 440 et 390 px comparées à la maquette, aucun défilement horizontal.
4. Après déploiement de (a) : `curl -s https://nedellec-julien.fr/ | grep -c "j-ned:theme"` ≥ 1
   (le script est dans le HTML prérendu servi, pas seulement dans `dist/`).

### 9. Ordre de merge et indépendance des PR (item 7 de `CLAUDE.md`)

- Les PR **ne sont pas indépendantes** : `git diff --name-only` de chacune contient
  `features/admin/admin.routes.ts`, `admin-layout.ts`, `components/admin-nav.ts` (a, b),
  `admin-projects.ts`, `admin-blog.ts` (a, b, c1), `admin-messages.ts`, `admin-cv.ts`,
  `admin-analytics.ts` (a, b, c2), `src/styles.css` et `DESIGN.md` (a, c1, c2) : intersections non
  vides.
- **Ordre imposé** : (a) `fix/admin-correctifs` → (b) `feat/admin-coque` → (c1)
  `feat/admin-edition` → (c2) `feat/admin-audience`. Chaque branche part de `master` **après** le
  merge de la précédente (une branche mergée est morte) ; pas de branche empilée.
- Gates avant chaque PR (item 8) : `pnpm install --frozen-lockfile` puis `pnpm run build
  --configuration production` (aucun changement de `package.json` ni du lockfile prévu).
- Aucune évolution d'API : l'item 10 ne s'applique pas. (a) modifie `index.html`, donc tout le HTML
  prérendu : vérification en prod après déploiement (§ 8.4).

### 10. Bibliothèques

Aucune nouvelle. `<dialog>` natif plutôt qu'un CDK Dialog (pas de `@angular/cdk` à ajouter, focus
piégé et Échap natifs) ; requêtes de conteneur natives de Tailwind v4 (`@container`,
`@min-[…]:`) ; Chart.js conservé (déjà chargé par l'admin), donuts supprimés ; `Intl` pour les
formats français.

### 11. Risques et inconnues

- `form()` sur un `ModelSignal` et radios sous `[formField]` (C1) ; `resource.value()` qui lève en
  erreur (§ 5) ; Échap de `<dialog>` non émis par happy-dom (A1) : tous prouvés en RED, repli prévu.
- Copie produite non validée : textes des dialogues, phrases de synthèse (`overviewSummary`,
  `audienceLead`), référent affiché tel que l'API le nomme (« google.com », pas « Google »).
- Écarts assumés à la maquette, à confirmer en revue : barre latérale à 1 024 px (D10), liens sans
  préfixe `https://`, couverture en attente absente de l'aperçu, pagination des messages retirée.

## Plan de test

Commun aux trois tranches. Les sélecteurs sont des `data-testid`. Les tests suivent le motif
Given/When/Then, avec `it.each` dès qu'un cas se répète. Les insécables sont écrites en échappement
` ` ou ` `, et `grep -P '\x{00A0}|\x{202F}'` ne trouve rien dans les fichiers touchés. Le
motif d'archéologie ne trouve rien non plus. Prettier et ESLint passent sur les 15 fichiers.

Le titre d'un dialogue suit la règle de `editorial-typography.spec.ts` : U+202F avant « ? ». Le
plan l'écrivait avec une espace simple, ce RED fixe l'insécable fine.

Nouveaux outils de test, sans dépendance à `vi` (ils sont inclus par `tsconfig.app.json`) :

- `shared/testing/press-test-id.ts` :
  - `settle` : `detectChanges`, `whenStable`, `detectChanges` ;
  - `settleBounded` : deux passes où `whenStable` est en course avec une macro-tâche. Une
    ressource en chargement (`NEVER`) est une tâche en attente : `whenStable` ne se résout alors
    jamais, et le test expirait (mesuré : 6 expirations à 5 s avant ce garde-fou) ;
  - `byTestId`, `testIdText` ;
  - `pressTestId` : clique le `button` natif, que le testid soit sur l'hôte `app-button` ou sur
    le bouton ;
  - `captureCrash` : transforme l'exception levée par `resource.value()` en état d'erreur en
    valeur assertable (`crash: null`) plutôt qu'en `Error` de test.
- `shared/ui/testing/confirm-dialog-page.ts` (PageModel) :
  - `readConfirmDialog` → `{ open, heading, description, confirm, cancel }`. `description` est
    résolue par `aria-describedby`, et la normalisation ne replie que les blancs ASCII, pas les
    insécables ;
  - `answerConfirmDialog(fixture, 'confirm' | 'cancel' | 'escape')`.
- `features/contact/testing/contact-message-builders.ts` : `makeContactMessage`, avec les mêmes
  défauts que les anciens `msg()` locaux.

Adaptation mécanique, sur la construction des entrées et les imports seulement :

- `admin-messages.spec.ts` et `admin-dashboard.spec.ts` : `msg()` local remplacé par
  `makeContactMessage` (défauts identiques). Le double inline est remplacé par la doublure
  partagée `stubContactGateway` (le défaut `markMessageAsRead` est conservé). Prettier a
  reformaté ces deux fichiers et `admin-blog.spec.ts` (indentation, aucune ligne de test
  modifiée).
- `button.spec.ts` : `renderButton` reçoit des entrées optionnelles, ses appels existants sont
  inchangés.

Aucune valeur attendue d'un test existant n'est modifiée.

### Tranche A1 — supprimer demande confirmation (projet, article, CV, message)

Couverture :

- `ConfirmDialog` est monté par un hôte à signaux, avec contenu projeté.
- La variante danger pleine de `Button` est vérifiée.
- Le parcours de suppression est rejoué sur les 4 pages réelles (`TestBed`, doubles de
  gateway) : corbeille → dialogue → réponse → appel au gateway, fermeture et focus.

Les testids de pages restent ceux du plan. Sur Messages, le `h1` `admin-page-title` est porté par
`admin-messages.ts` ; l'en-tête d'`AdminTable` (`title`, `newRoute`, `newLabel`) est supprimé.

Échap : happy-dom 20.9 n'émet pas `cancel`. Le PageModel envoie lui-même
`new Event('cancel', { cancelable: true })` sur le `<dialog>`.

Contrats fixés par ce RED :

- **`ConfirmDialog`** (`shared/ui/confirm-dialog.ts`, `app-confirm-dialog`) :
  - API du plan ;
  - `confirm-dialog` est l'élément `<dialog>` lui-même, ouvert par `showModal()` (un appel par
    ouverture) et fermé quand `open` repasse à `false` ;
  - `aria-labelledby` = `id` (non vide) de `confirm-dialog-heading` ;
  - `aria-describedby` désigne un élément interne au dialogue qui contient la conséquence
    projetée ;
  - `confirm-dialog-cancel` : `button` natif avec l'attribut `autofocus` ;
  - `confirm-dialog-confirm` : bouton aux classes `bg-status-error` et `text-on-status-error` ;
  - Annuler et Échap émettent `cancelled` ; Confirmer émet `confirmed`.
- **`Button`** danger plein : `bg-status-error text-on-status-error border border-status-error
  shadow-sm hover:bg-status-error/90` (tailles par défaut).
- **Pages** :
  - `pendingDeletion` est posé par la corbeille ; tant que l'utilisateur n'a pas répondu, aucun
    appel `delete*` ;
  - Confirmer → un seul appel avec l'identifiant, retrait optimiste, dialogue fermé, focus sur le
    `h1` `admin-page-title` (`tabindex="-1"`) ;
  - Annuler ou Échap → aucun appel, liste intacte, dialogue fermé ;
  - les méthodes existantes (`deleteProject`, `remove`, `deleteMessage`, `deleteCv`) restent
    l'action lancée à la confirmation : leurs tests directs restent valides.
- **Textes** (titre et bouton figés, conséquence figée pour le projet seulement) :

  | Page | Titre | Bouton de confirmation |
  |---|---|---|
  | Projet | « Supprimer le projet DashFlow ? » | « Supprimer DashFlow » |
  | Article | « Supprimer l'article <titre> ? » | « Supprimer <titre> » |
  | Message | « Supprimer le message de Claire Martin ? » | « Supprimer le message » |
  | CV | « Retirer le CV du site ? » | « Retirer le CV » |

  Dans chaque titre, l'espace avant « ? » est U+202F. Conséquence du projet : « Le projet
  disparaît des Réalisations et de l'accueil au prochain déploiement, avec ses captures. Cette
  action est définitive. »

**`shared/ui/confirm-dialog.spec.ts`** (TestBed, 12 tests, nouveau)

| Test | Scénario | Assertions clés |
|---|---|---|
| état natif (`it.each` × 2) | `open` vrai, faux | `tagName` `DIALOG`, `open` exact |
| ouverture modale | faux → vrai | `open`, `showModal` appelé 1 fois |
| fermeture | vrai → faux | `open` faux |
| contenu | ouvert | `toEqual` de `{ open, heading, description, confirm, cancel: 'Annuler' }` |
| nom et description | ouvert | `aria-labelledby` = id du titre, description dans le dialogue |
| libellé d'annulation | `cancelLabel` « Garder le CV » | confirm et cancel exacts |
| réponses (`it.each` × 3) | confirmer, annuler, Échap (`cancel` émis) | comptes `confirmed` et `cancelled` exacts |
| focus initial | ouvert | `autofocus` sur le bouton natif d'annulation |
| bouton danger | ouvert | `bg-status-error`, `text-on-status-error` |

**`shared/ui/button.spec.ts`** (+1 test)

| Test | Scénario | Assertions clés |
|---|---|---|
| danger plein | `severity: 'danger'` | liste de classes exacte avec `text-on-status-error` |

**Pages** : `admin-projects.spec.ts`, `admin-blog.spec.ts`, `admin-messages.spec.ts`, nouveau
`admin-cv.spec.ts`. Chacun ajoute 5 tests, 20 au total.

| Test | Scénario | Assertions clés |
|---|---|---|
| corbeille | 2 éléments, corbeille du premier | dialogue ouvert avec titre et libellés, 0 appel, liste intacte |
| réponses (`it.each` × 3) | confirmer, annuler, Échap | appels exacts (`[['p-1']]` ou `[]`), dialogue fermé, liste attendue |
| focus | confirmation | `H1`, `tabindex="-1"`, `document.activeElement` |

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-07 11:35, 25 failed / 1720 total).

Sur l'arbre réel, `pnpm test` (après `ng cache clean` et purge de `node_modules/.vite`) s'arrête
à la compilation. Les erreurs ne portent que sur des symboles applicatifs dus au GREEN :

- `TS2307` `./confirm-dialog` ;
- `NG1010` et `TS18046` qui en découlent.

Les specs n'ont aucune faute de type propre.

Mesure du rouge comportemental, avec un squelette jetable posé puis retiré : `ConfirmDialog` et
`LoadError` ont leur API exacte et un gabarit vide, les pages ne changent pas. Résultat de
l'exécution complète : **65 failed / 1720 total**, tous en `AssertionError`. 25 de ces échecs
appartiennent à A1 :

- 12 dialogue ;
- 1 bouton ;
- 12 pages (corbeille, confirmation et focus, × 4).

8 tests sont verts par nature : Annuler et Échap × 4. Sans dialogue, rien n'est supprimé.

### Tranche A2 — la période d'Audience affichée est celle des données

Contrat fixé par ce RED : le `select` porte `data-testid="analytics-date-range"`, ajouté par
cette tranche.

Le test monte `AdminAnalyticsHeader` seul. L'entrée `dateRange` est posée **avant** le premier
rendu, ce qui reproduit le chargement de la page. La vraie cause est reproduite sous happy-dom (vérifié par une
sonde jetable) : `[value]` posé avant le `@for` laisse `select.value` à `7d`.

**`components/admin-analytics-header.spec.ts`** (+6 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| premier rendu (`it.each` × 4) | `7d`, `30d`, `90d`, `all` | `{ value, label }` de l'option sélectionnée |
| suivi | `30d` puis `90d` | `{ value: '90d', label: '90 derniers jours' }` |
| choix utilisateur | `select.value = 'all'` + `change` | `dateRangeChanged` émet `['all']` |

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-07 11:35, 3 failed / 1720 total).

Sur l'arbre réel, la compilation s'arrête sur les symboles de A1 et de A3 (aucun pour A2).

Mesure : même squelette, plus le seul attribut `data-testid` posé à titre jetable sur le
`select`. Les 3 échecs sont des `AssertionError` sur `30d`, `90d` et `all`, avec pour valeur reçue
`{ value: '7d', label: '7 derniers jours' }` : l'option affichée ne correspond pas à l'état.
`7d`, le suivi et l'émission sont verts par nature (3).

Sans l'attribut de test, les 6 tests tombent sur `select` absent : ce n'est pas la cause
mesurée, d'où l'attribut jetable.

### Tranche A3 — chargement, erreur et vide sont trois états distincts

Couverture :

- `LoadError` est monté seul.
- `HttpContactGateway` est testé par `HttpTestingController` avec `verify()`.
- Les 4 pages et le tableau de bord sont testés avec des doubles de gateway. Les 4 états sont
  produits par :
  - `NEVER` pour le chargement ;
  - `throwError` pour l'erreur ;
  - `of([])` ou `of(null)` pour le vide ;
  - des données pour l'état chargé.
- La relance est vérifiée par le nombre d'appels au double.
- Messages a aussi un test d'intégration avec le vrai `HttpContactGateway` (503 → alerte →
  « Réessayer » → nouveau `GET` → liste).
- La coque (`admin-layout.spec.ts`, nouveau) vérifie la pastille.

Contrats fixés par ce RED :

- **`LoadError`** (`shared/ui/load-error.ts`) :
  - l'hôte porte `role="alert"` et `data-testid="load-error"` ;
  - le message est dans `load-error-message` (testid ajouté par ce RED) ;
  - `load-error-retry` est un `button` natif `type="button"` au texte « Réessayer » ;
  - un clic émet `retry` une fois.
- **`HttpContactGateway`** :
  - `getAllMessages()` propage l'erreur, sans relance (une requête) ;
  - `getUnreadCount()` relance une fois puis propage l'erreur. Un échec n'est pas gardé : le
    prochain abonné relance la requête. Deux abonnés simultanés partagent une requête.
- **Pages** : un seul des quatre testids est présent, et aucune exception n'est levée
  (`crash: null`) :

  | Page | Chargement | Erreur | Vide | Données |
  |---|---|---|---|---|
  | Projets | `admin-projects-loading` | `load-error` | `admin-projects-empty` | `admin-projects-list` |
  | Articles | `admin-posts-loading` | `load-error` | `admin-posts-empty` | `admin-posts-list` |
  | Messages | `admin-messages-loading` | `load-error` | `admin-messages-empty` | `admin-messages-list` |
  | CV | `admin-cv-loading` | `load-error` | `admin-cv-empty` | `admin-cv-current` |

  - L'élément de chargement porte `role="status"`.
  - « Réessayer » relance le flux : 2 appels au total, puis l'état Données.
  - Projets : la liste lit `getAllProjects()`.
  - CV : aucun toast sur un échec de chargement.
- **Tableau de bord** :
  - `dashboard-unread-count` et `dashboard-cv-count` contiennent le nombre ;
  - en erreur, ils contiennent « — » suivi de « indisponible ». La comparaison ignore les
    blancs ASCII.
- **Coque** :
  - `nav-unread-count` (testid introduit dès A3 ; A7 y ajoute le suffixe `sr-only`) est présent
    une fois, et commence par « 3 », pour 3 non-lus ;
  - il est absent pour 0 et en erreur, sans exception.

**`shared/ui/load-error.spec.ts`** (3 tests, nouveau)

| Test | Scénario | Assertions clés |
|---|---|---|
| alerte | message donné | `role`, testid d'hôte, message exact, « Réessayer » |
| relance | clic | `retry` émis 1 fois |
| bouton natif | — | `BUTTON`, `type="button"` |

**`infra/gateways/http-contact.gateway.spec.ts`** (+5 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| messages en erreur | 500 | rejet, une seule requête |
| messages, nouvel abonnement | 500 puis `{ data: [] }` | nouvelle requête, `[]` (vert par nature) |
| non-lus en erreur | 503 × 2 | 1 relance, rejet |
| échec non gardé | 500 × 2, puis abonné suivant | `{ first: 'error', relaunched: 1, next: 4 }` |
| partage | 2 abonnés simultanés | une requête, `[2, 2]` (vert par nature) |

**Pages** : `admin-projects`, `admin-blog`, `admin-cv` et `admin-messages`.

| Test | Scénario | Assertions clés |
|---|---|---|
| états (`it.each` × 4) | chargement, erreur, vide, données | `{ crash: null, present: [testid] }` |
| chargement annoncé | `NEVER` | `role="status"` |
| relance | erreur puis données, clic « Réessayer » | `{ crash: null, calls: 2, present: [données] }` |
| CV : pas de toast | `getCurrent` en erreur | `toast.add` non appelé |
| Messages : relance HTTP | 503, clic, `GET` rejoué | alerte, 1 requête relancée, liste, `verify()` |

Projets, Articles et CV ont 6 tests de ce tableau chacun, Messages 5 plus l'intégration HTTP. Le
CV ajoute le test de toast.

**`admin-dashboard.spec.ts`** (+4 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| compteurs (`it.each` × 4) | les deux OK, non-lus en erreur, CV en erreur, les deux en erreur | `['5', '42']`, `['—indisponible', '42']`, etc. |

**`admin-layout.spec.ts`** (+3 tests, nouveau)

| Test | Scénario | Assertions clés |
|---|---|---|
| pastille (`it.each` × 3) | 3, 0, erreur | 1 pastille « 3… » ; 0 ; 0 sans exception (0 non-lu : vert par nature) |

Sweep :

- `filterProjects` et `ProjectFilter` dans tout `src/**/*.spec.ts` :
  - `admin-projects.spec.ts` : 9 seeds repointés sur `getAllProjects` (mêmes listes, mêmes
    attentes). Son double dérive `filterProjects` de `getAllProjects` avec `catchError → []`,
    fidèle à l'implémentation actuelle : les tests existants et A1 restent verts avant A3, et le
    test d'erreur est rouge pour la vraie cause (l'erreur avalée).
  - `http-projects.gateway.spec.ts` : le test `filterProjects({category:Web})` et la ligne
    `filterProjects()` de l'`it.each` d'adaptation sont retirés. Ce sont des tests morts : la
    méthode est supprimée par A3.
- Les catch de `HttpContactGateway` ne sont asserts par aucune autre suite.
- `stubContactGateway` est inchangé.

**Dette à solder.** Une fois `ProjectsGateway.filterProjects` supprimée en GREEN, la clé
`filterProjects` du double d'`admin-projects.spec.ts` devient du code mort. Le typage `as` ne la
signale pas. Le retrait revient à `qa`, à la clôture de A3.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-07 11:35, 37 failed / 1720 total).

Sur l'arbre réel, la compilation s'arrête sur `TS2307` `./load-error` (dû au GREEN).

Mesure, avec le même squelette : 37 échecs `AssertionError` :

| Suite | Échecs |
|---|---|
| `LoadError` | 3 |
| gateway | 3 |
| Projets | 6 |
| Articles | 6 |
| Messages | 6 |
| CV | 7 |
| Tableau de bord | 4 |
| Coque | 2 |

Plusieurs échecs portent `crash` = `ResourceValueError` : l'exception de `value()` en état
d'erreur, exactement le défaut visé. 3 tests sont verts par nature.

**Harnais vérifié** pour A1 à A3. Une implémentation jetable complète a été posée :

- `ConfirmDialog` sur `afterRenderEffect` ;
- `LoadError` ;
- `Button` ;
- `[selected]` par option ;
- gateway en `retry(1)` + `share` ;
- 4 pages en `rxResource`, `hasValue()`, dialogue et focus ;
- tableau de bord ;
- coque ;
- testids.

Résultat : **1720 passed / 1720**, sans `NG0` ni `stderr`.

L'implémentation a ensuite été retirée : 13 fichiers restaurés (`git checkout`, `md5sum -c` OK)
et deux composants supprimés. `git status` ne montre que les specs et les outils de test.

Non-régression : la base était à 1643 passed / 1643. 1720 = 1643 − 2 (`filterProjects`) + 79
nouveaux. Aucun test existant ne tombe, ni sous le squelette, ni sous l'implémentation jetable.

Intestable ou hors portée en happy-dom :

- le focus initial natif par `autofocus` : `showModal()` ne déplace pas le focus. Seul l'attribut
  est vérifié ;
- le piège de focus du modal et la fermeture native par Échap ;
- le rendu de la classe `text-on-status-error` : le token `--color-on-status-error` de
  `styles.css` n'est pas compilé en test. Il faut le vérifier au navigateur (§ 8) ;
- la liste « Derniers messages » du tableau de bord en erreur : non couverte, l'écran est
  remplacé en PR b.

### Tranche A3bis — corrective : retours du GREEN A1 à A3

Trois défauts relevés au GREEN et à la vérification navigateur d'A1 à A3. Le plan n'est pas en
cause : la tranche s'ajoute au découpage sans le modifier.

Contrats fixés par ce RED :

- **Projets** : si `getAllProjects` échoue et que `getCategories` dérive du même échec, la page
  affiche `load-error`, sans exception, et ne reste pas en chargement.
- **Audience** (`admin-analytics.ts`) : aucune ressource en erreur ne fait lever la page. Un
  endpoint en échec donne **une seule** `load-error` pour toute la page. « Réessayer » relance la
  ressource en échec, et l'alerte disparaît quand elle répond.
- **Toasts des non-lus** : pour une requête relancée par la gateway, le visiteur voit au plus un
  toast. Deux échecs donnent 1 toast. Un échec suivi d'une relance réussie n'en donne aucun.
  Mécanisme attendu : la première tentative porte `SKIP_ERROR_TOAST`
  (`core/interceptors/skip-error-toast.ts`), la relance passe sans marque. C'est faisable
  proprement : `catchError` vers une seconde requête non marquée remplace `retry(1)`, sans toucher
  à l'intercepteur ni au partage (`share`) existant. Les 5 tests de la gateway déjà verts restent
  valables.

**`admin-projects.spec.ts`** (+1 test)

| Test | Scénario | Assertions clés |
|---|---|---|
| liste et catégories en erreur | `getCategories` = `getAllProjects().pipe(map(…))`, en échec | `{ crash: null, present: ['load-error'] }` |

Ce test est **vert dès maintenant** : le GREEN d'A3 a déjà corrigé le défaut avec `hasValue()`.
C'est un test de non-régression.

**`admin-analytics.spec.ts`** (+6 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| endpoint en erreur (`it.each` × 5) | overview, chart, metrics, project stats, article read stats | `{ crash: null, errors: 1 }` |
| relance | overview en échec puis en succès, clic `load-error-retry` | `{ crash: null, retried: 1, errors: 0 }` |

**`http-contact.gateway.spec.ts`** (+2 tests, vrai `errorToastInterceptor` + `ToastStore` doublé)

| Test | Scénario | Assertions clés |
|---|---|---|
| toasts (`it.each` × 2) | 500 puis 500 ; 500 puis 200 | `{ toasts: 1, outcome: 'error' }` ; `{ toasts: 0, outcome: 4 }` |

Tous les tests de cette tranche échouent à ce stade, sauf le test de non-régression (RED confirmé
via la commande test du profil le 2026-10-07 12:09, 8 failed / 1791 total).

Mesure avec le squelette décrit sous A4 : 8 `AssertionError`. Dans les tests d'Audience, la
valeur reçue est `crash: ResourceValueError`, ou une alerte absente, ce qui est exactement le
défaut visé. Côté toasts, les valeurs reçues sont 2 et 1.

### Tranche A4 — le thème est juste sous `/admin` et partagé avec le site (ADR-0012)

Couverture :

- `theme-preference.ts` est testé en TypeScript pur.
- `ThemeStore` est testé par `TestBed.inject`, avec le vrai `localStorage` et la classe réelle
  sur `<html>`. `TestBed.tick()` vide les effets.
- La préférence du système est une frontière d'I/O. Elle est simulée par un nouvel outil de test,
  `core/theme/testing/system-color-scheme.ts` (`installSystemColorScheme(dark)` → `set`,
  `restore`). Il remplace `window.matchMedia`, gère `addEventListener` et `addListener`, et ne
  dépend pas de `vi`.
- `App`, `Header` et la coque admin utilisent le vrai store.

Contrats fixés par ce RED :

- **`core/theme/theme-preference.ts`** :
  - `parseThemePreference` renvoie `'dark'` ou `'light'` pour ces valeurs exactes, et `'system'`
    pour tout le reste (`null`, `''`, `'system'`, `'Dark'`, `'sepia'`) ;
  - `resolveIsDark(p, systemDark)` suit le système seulement pour `'system'`.
- **`core/theme/theme-store.ts`** (`ThemeStore`, racine) :
  - `preference` et `isDark` sont des signaux en lecture. La classe `app-dark` suit `isDark`.
  - Au démarrage, **rien n'est écrit**. Une valeur inconnue (`'sepia'`) reste en place et vaut
    `'system'`.
  - `setPreference('system')` retire la clé. `'dark'` et `'light'` l'écrivent.
  - `toggle()` enregistre l'inverse du thème effectif.
  - En `'system'`, un changement du système est suivi sans écriture. Une préférence explicite
    l'ignore.
  - Côté serveur (`PLATFORM_ID` `server`), `isDark` vaut `true` même avec `'light'` stocké, et le
    document n'est pas touché.
- **`App`** instancie le store : un chargement direct de `/admin` avec `'dark'` stocké pose
  `app-dark`, même sans le `Header` public (remplacé par une doublure dans ce test).
- **`Header`** :
  - la bascule écrit dans le store partagé (`preference()` vaut `'light'`) ;
  - sans préférence stockée, l'en-tête suit le système et **n'écrit rien** au premier rendu.
- **Coque admin** : `admin-theme-toggle` affiche « Passer en mode clair » en sombre. Un clic
  retire `app-dark`, écrit `'light'` et le libellé devient « Passer en mode sombre ».
- **`BlogComments`** lit `ThemeStore.isDark`.

**`core/theme/theme-preference.spec.ts`** (13 tests, nouveau)

| Test | Scénario | Assertions clés |
|---|---|---|
| lecture (`it.each` × 7) | `dark`, `light`, `null`, `''`, `system`, `Dark`, `sepia` | préférence exacte |
| résolution (`it.each` × 6) | 3 préférences × système clair ou sombre | booléen exact |

**`core/theme/theme-store.spec.ts`** (12 tests, nouveau)

| Test | Scénario | Assertions clés |
|---|---|---|
| démarrage (`it.each` × 5) | stocké `dark`, `light`, absent × 2, `sepia` | `{ preference, isDark, htmlDark, stored }` exact, `stored` inchangé |
| choix explicite (`it.each` × 3) | `dark`, `light`, `system` depuis `light` stocké | état exact, clé retirée pour `system` |
| double bascule | système sombre, `toggle()` × 2 | `light` stocké, puis `dark` |
| système suivi | `system`, le système passe en sombre | `isDark`, classe, rien stocké |
| système ignoré | `light` stocké, le système passe en sombre | reste clair |
| serveur | `PLATFORM_ID` `server`, `light` stocké | `{ isDark: true, htmlDark: false }` |

**`app.spec.ts`** (+1 test) : chargement direct de `/admin`, `Header` et `Footer` doublés, `dark`
stocké → `app-dark` posé.

**`header.spec.ts`** : les deux tests de `toggle de thème` sont **réécrits**. Ils lisaient
`isDarkTheme` et appelaient `toggleTheme` en interne, deux membres retirés par le plan. Ils sont
remplacés par trois tests sur le DOM :

| Test | Scénario | Assertions clés |
|---|---|---|
| bascule | `dark` stocké, clic sur le bouton de thème | libellés avant et après, `preference: 'light'`, classe retirée, `light` stocké |
| suivi du système (`it.each` × 2) | rien de stocké, système sombre ou clair | libellé, classe, `stored: null` |

Le test du tiroir (`drawer-theme-toggle`) est inchangé.

**`admin-layout.spec.ts`** (+1 test) : bascule `admin-theme-toggle`, état avant et après.

**`blog-comments.spec.ts`** : adaptation mécanique de la doublure. Le fournisseur `ThemeWatcher`
devient `ThemeStore`, avec la même forme `{ isDark }`.

**`shared/theme/theme-watcher.spec.ts`** : supprimé (4 tests). C'est un test mort, puisque le plan
supprime `ThemeWatcher`.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-07 12:09, 23 failed / 1791 total).

Sur l'arbre réel, après `ng cache clean` et purge de `node_modules/.vite`, `pnpm test` s'arrête à
la compilation. Les erreurs ne portent que sur des symboles dus au GREEN :

- `TS2307` sur `./theme-preference`, `./theme-store` et `@core/theme/theme-store` ;
- `TS2571`, qui en découle (`header.spec.ts`) ;
- `TS2305` sur `formatPercent` et `formatChartDay` (A6) ;
- `TS2739` dans `tag.spec.ts` (A7, voulu, voir plus bas).

Les specs n'ont aucune faute de type propre.

**Squelette jetable de mesure**, posé puis retiré :

- `theme-preference.ts` renvoie toujours `'system'` et `false` ;
- `ThemeStore` a des signaux figés et des commandes vides ;
- `formatPercent` et `formatChartDay` renvoient `''` ;
- `AppTagSeverity` est réduit à `'info' | 'secondary'`, et ses trois consommateurs sont repointés
  sur `info` ou `secondary`.

Résultat de l'exécution complète : **84 failed / 1791 total**, tous en `AssertionError` (aucun
`TypeError`, `NG0` ni délai dépassé). 23 appartiennent à A4 :

| Suite | Échecs |
|---|---|
| préférence | 5 |
| store | 11 |
| `App` | 1 |
| `Header` | 3 |
| coque | 1 |
| `BlogComments` | 2 |

8 tests de préférence et le démarrage `system` sans sombre sont verts sous le squelette, parce que
ses valeurs de repli coïncident avec l'attendu. Sur l'arbre réel, ils tombent à la compilation.

**Harnais vérifié** pour A3bis à A7 : une implémentation jetable complète a été posée sur les
20 fichiers applicatifs concernés, puis retirée. Elle a donné **1791 passed / 1791**, sans
`stderr` ni `NG0`. Les 20 fichiers ont été restaurés depuis l'instantané (`md5sum` identique) et
les deux fichiers créés ont été supprimés.

Preuve navigateur attendue, la pré-peinture n'étant pas testable en unitaire :

- script en tête de `index.html` ;
- rechargement direct de `/admin`, avec `j-ned:theme = 'dark'`, puis `'light'`, puis la clé
  absente sous `prefers-color-scheme: dark` émulé : `.app-dark` doit être présent ou absent dès
  `domcontentloaded`, avant tout rendu Angular ;
- même chose sur `/` prérendu ;
- aucun flash d'Ivoire sur une capture prise à `domcontentloaded` ;
- `color-scheme` des contrôles natifs dans les deux registres ;
- après déploiement : `curl -s https://nedellec-julien.fr/ | grep -c "j-ned:theme"` ≥ 1.

### Tranche A5 — messages ouvrables au clavier, tri annoncé

Le test passe par la page Messages réelle, avec `AdminTable` et les colonnes rendues. Deux
messages : Claire Martin (non lu, le plus récent) et Paul Durand (lu).

Contrats fixés par ce RED, en plus de ceux du plan :

- `message-expand` est le `button` natif lui-même ou son hôte. Son nom est le texte visible ou
  `sr-only` : « Afficher le message de X », puis « Masquer le message de X ».
- `message-body` est l'élément qui porte `id="message-body-<id>"`. Son texte est le message.
- `sort-<key>` est le `button` natif ; sa `th` porte `scope="col"`. `aria-sort` est **absent** des
  colonnes non triées.

**`admin-messages.spec.ts`** (+5 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| boutons de dépliage | rendu | 2 × `{ BUTTON, type: 'button', expanded: 'false', name: 'Afficher le message de …' }` |
| ouverture | clic sur le premier | `expanded: 'true'`, `controls: 'message-body-1'`, nom « Masquer… », un seul corps `{ id, text }` |
| fermeture | deux clics | `expanded: 'false'`, aucun corps |
| en-têtes | rendu | aucun `th[role=button]` ; `name`, `subject`, `createdAt` en `BUTTON`, `scope: 'col'` ; `aria-sort` `descending` sur la date seule |
| tri | `sort-name` × 2 | `ascending` puis `descending`, date sans `aria-sort`, ordre des lignes inversé |

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-07 12:09, 5 failed / 1791 total).

Mesure : 5 `AssertionError` sous le squelette, car aucun `message-expand` ni `sort-<key>` n'existe
encore. Les tests directs existants (`toggleExpand`, `extraActions[0].handler`) restent verts.

### Tranche A6 — libellés et nombres en français

Contrats fixés par ce RED. Les insécables sont écrites `\u00a0` dans les specs.

- **Domaine** (`analytics-presenter.ts`) :

  | Fonction | Entrée | Sortie |
  |---|---|---|
  | `formatDuration` | 0, 22, 59 | `0 s`, `22 s`, `59 s` |
  | `formatDuration` | 60, 65, 600 | `1 min 00 s`, `1 min 05 s`, `10 min 00 s` |
  | `formatDuration` | 3 600 | `60 min 00 s` (pas d'heure : choix fixé par ce RED) |
  | `pagesPerSession` | — | `5,0`, `3,3`, `1,3` ; `0` sans session |
  | `formatPercent` (nouveau) | 0, 88.1, 12.34, 100 | `0 %`, `88,1 %`, `12,3 %`, `100 %` (au plus une décimale) |
  | `formatChartDay` (nouveau) | `2026-09-07`, `2026-06-01`, `2026-01-31` | `7 sept.`, `1 juin`, `31 janv.` |

  Dans les sorties, l'espace avant `s`, `min` et `%` est U+00A0 ; l'espace entre `min` et les
  secondes est ordinaire. `buildVisitorsChartData` produit ces libellés de jour.
- **KPI de la page Audience** :
  - `kpi-bounce-rate` : `12,3 %` ;
  - `kpi-avg-duration` : `1 min 30 s` ou `22 s` ;
  - `kpi-pages-per-session` : « 3,0 pages par session », ou « 1,3 page par session » (singulier
    sous 2).
- **En-tête Audience** : le `h1` porte `admin-page-title` et le texte « Audience ».
  `analytics-export-csv` affiche « Exporter en CSV », et un clic émet `exportCsvClicked` une fois.
- **Titres des routes** :
  - « Vue d'ensemble | Admin », « Articles | Admin », « Audience | Admin » ;
  - les autres inchangés.
- **Navigation de la coque**, lue par `href` :
  - « Vue d'ensemble », « Projets », « Articles », « CV », « Messages », « Audience »,
    « Paramètres ».
- **Articles** :
  - en-têtes « Titre », « Statut », « Date », « J'aime » ;
  - `admin-post-status` affiche « Publié » ou « Brouillon » ;
  - `admin-post-date` affiche `9 sept. 2026` (`LOCALE_ID` `fr-FR`, comme en production).
- **CV** :
  - `admin-cv-empty` affiche « Aucun CV en ligne » ;
  - `admin-cv-uploaded-at-label` affiche « Mis en ligne le » ;
  - `admin-cv-upload` affiche « Mettre en ligne », puis « Mise en ligne… » pendant l'envoi
    (un appel).
- **Projets** :
  - `admin-project-featured` affiche « Mis en avant » sur le seul projet mis en avant ;
  - les étiquettes de `admin-project-featured-input` et `admin-project-order` sont « Mettre en
    avant sur l'accueil » et « Position dans la liste ».

**Suites et tests**

| Suite | Tests | Nature |
|---|---|---|
| `analytics-presenter.spec.ts` | `formatDuration` 7, `pagesPerSession` 1 + 3, `formatPercent` 4, `formatChartDay` 3, libellés du graphique 1 | contrat réaligné, et nouveaux formateurs |
| `admin-analytics.spec.ts` | KPI : 1 réécrit, 2 en `it.each` | DOM par testid |
| `admin-analytics-header.spec.ts` | +2 | titre, export et clic |
| `admin.routes.spec.ts` | 1 | nouveau, golden des titres |
| `admin-layout.spec.ts` | +1 | libellés par `href` |
| `admin-blog.spec.ts` | 1 réécrit, +1 | statut et date ; en-têtes |
| `admin-cv.spec.ts` | +3 | vide, date, envoi |
| `admin-projects.spec.ts` | +1 | « Mis en avant » |
| `admin-project-inline-form.spec.ts` | +1 | étiquettes |

Tests existants modifiés : c'est un réalignement de contrat, et ces tests repassent par un vrai
rouge d'assertion.

- `analytics-presenter.spec.ts` :
  - `formatDuration` (4 cas anglais → 7 cas français) ;
  - `pagesPerSession` (`5.0`, `3.3` → `it.each` `5,0`, `3,3`, `1,3`) ;
  - libellés du graphique (`2026-06-01` → `1 juin`).
- `admin-analytics.spec.ts` :
  - « expose les KPI » : `bounceRateFormatted() === '12.3'` devient `kpi-bounce-rate` =
    `12,3 %` ;
  - « formate la durée moyenne et les pages par session » : `toBeTypeOf('string')` et
    `toBeDefined()`, assertions qui ne pouvaient pas échouer, deviennent un `it.each` de valeurs
    DOM exactes.
- `admin-blog.spec.ts` : « affiche la date de publication (ou « Brouillon ») » (`toContain('2026')`)
  devient le statut et la date exacts par testid, avec le builder `makeBlogPost` au lieu du `post()`
  local. Le `setup` reçoit `LOCALE_ID` `fr-FR` (et `registerLocaleData(localeFr)`, comme
  `app.config.ts`).

Sweep : `formatDuration`, `pagesPerSession`, `bounceRateFormatted`, `toFixed`, « Dashboard »,
« Analytics », « Likes », « Featured », « Export CSV », « uploadé » et « Upload » sur tout
`src/**/*.spec.ts`. Seuls les tests listés ci-dessus encodaient l'ancien contrat. Le
`tag.spec.ts` utilisait « Featured » comme simple valeur d'exemple : elle est gardée.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-07 12:09, 32 failed / 1791 total).

Mesure : 32 `AssertionError` sous le squelette.

| Suite | Échecs |
|---|---|
| domaine | 18 |
| KPI | 3 |
| en-tête | 2 |
| routes | 1 |
| coque | 1 |
| articles | 2 |
| CV | 3 |
| projets | 1 |
| formulaire | 1 |

Intestable dans l'environnement de test : le décalage d'un jour sans `timeZone: 'UTC'` ne se voit
qu'à l'ouest de Greenwich. Les tests tournent en Europe/Paris, donc `formatChartDay` fixe la sortie
mais ne prouve pas l'option. Le plan l'impose.

### Tranche A7 — contrastes, étiquettes et noms d'action

Contrats fixés par ce RED. Le nom accessible est `aria-label` s'il existe, sinon le texte normalisé
du `button` natif. Le deux-points suit la règle du repo : U+00A0 avant « : ».

- **`AppTag`** n'a plus que `'info' | 'secondary'`. La preuve est **au typecheck** :
  `SEVERITY_LOOK: Record<AppTagSeverity, …>` n'a que ces deux clés, donc `tsc` échoue tant que
  l'union en compte cinq. Les tests d'exécution couvrent les classes des deux sévérités.
- **Tampons** :
  - `admin-post-status` et `admin-project-featured` sont des hôtes `APP-STAMP` ;
  - « Publié », « Brouillon », « Mis en avant ».
- **Noms d'action** :
  - articles : `admin-post-edit` (« Modifier : X »), `admin-post-delete` (« Supprimer : X ») ;
  - projets : `admin-project-edit-toggle` (« Modifier : X », puis « Fermer l'édition : X »),
    `admin-project-delete` (« Supprimer : X ») ;
  - messages : `message-mark-read` (« Marquer comme lu : X », non-lus seulement), `message-delete`
    (« Supprimer le message de X »).
- **Bout des actions** :
  - `admin-post-edit` ouvre l'article dans le formulaire (`editing()`) ;
  - `message-mark-read` appelle `markMessageAsRead(1)` ;
  - `admin-project-edit-toggle` passe `aria-expanded` à `true`. Son `aria-controls` désigne un
    élément de la page qui contient le formulaire d'édition.
- **Formulaire de projet** :
  - `tech-choice-techno`, `tech-choice-why`, `decision-text` et `decision-rationale` ont chacun un
    `id` unique et un seul `label[for]` : « Outil n », « Raison n », « Décision n »,
    « Justification n » (n à partir de 1) ;
  - `tech-choice-remove` et `decision-remove` sont nommés « Supprimer le choix technique n » et
    « Supprimer la décision n », avec `text-status-error` ;
  - après un retrait, la numérotation repart de 1 ;
  - `admin-project-order` porte `form-input`, `admin-project-featured-input` porte
    `accent-primary-bg` et `size-5`, et aucun des deux ne garde de classe `focus:`.
- **Coque** :
  - sur `/admin/messages`, seul le lien Messages porte `aria-current="page"` ;
  - `nav-unread-count` se lit « 3 non lus » ou « 1 non lu ». Le suffixe est dans un `.sr-only`.
    Le singulier est un ajout de ce RED au « non lus » du plan.
- **CV** : `admin-cv-view` est un `A` avec `target="_blank"` et `rel="noopener noreferrer"`. Il se
  lit « Voir le CV (nouvel onglet) », la parenthèse en `.sr-only`.

**Suites et tests**

| Suite | Tests | Nature |
|---|---|---|
| `tag.spec.ts` | 7 au lieu de 13 | variantes `success`, `warn`, `error` retirées (tests morts) ; la boucle `for` génératrice devient `it.each` ; preuve par le typecheck |
| `admin-blog.spec.ts` | +3 | tampons, noms, clic sur Modifier |
| `admin-projects.spec.ts` | +3 | tampon, noms et `aria-expanded`, bascule et panneau |
| `admin-messages.spec.ts` | +2 | noms, clic sur « Marquer comme lu » |
| `admin-project-inline-form.spec.ts` | +4 | classes et focus, étiquettes numérotées, retraits nommés, renumérotation |
| `admin-layout.spec.ts` | +3 | `aria-current`, pastille (`it.each` × 2) |
| `admin-cv.spec.ts` | +1 | lien |

Sweep : `AppTagSeverity`, `severity="success|warn|error"`, `app-tag` et `text-red-400` sur tout
`src/**/*.spec.ts`. Seul `tag.spec.ts` asserte les variantes retirées. `analytics-entity-list.spec.ts`
ne lit pas la sévérité. Le passage de `success` à `info` de la liste d'entités est garanti par le
typecheck du template.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-07 12:09, 16 failed / 1791 total).

Mesure : 16 `AssertionError` sous le squelette.

| Suite | Échecs |
|---|---|
| articles | 3 |
| projets | 3 |
| messages | 2 |
| formulaire | 4 |
| coque | 3 |
| CV | 1 |

Les 7 tests de `tag.spec.ts` sont verts sous le squelette, puisque l'union y est déjà réduite :
leur rouge est le `TS2739` de l'arbre réel.

Non testable en unitaire, à prouver au navigateur avec axe-core, dans les deux registres :

- les ratios du § 3 ;
- `--color-field` et `border-field` sur `form-input` et `app-select` ;
- `placeholder:text-muted` ;
- le rendu de `accent-primary-bg`.

Aucun test source-based sur `styles.css` n'est ajouté.

### Bilan du RED A3bis à A7

- Base : 1720 passed / 1720.
- Arbre de tests : 1791 = 1720 − 4 (`theme-watcher.spec.ts`) − 6 (`tag.spec.ts`) + 81 nouveaux.
- Sous le squelette : 84 failed (8 + 23 + 5 + 32 + 16), tous en `AssertionError`.
- Sous l'implémentation jetable : 1791 passed.
- Aucun test existant ne tombe pour une autre raison que le contrat réaligné ci-dessus.
- Prettier et ESLint passent sur les 18 fichiers touchés.
- Ni le motif d'archéologie ni `grep -P '\x{00A0}|\x{202F}'` ne trouvent rien.

### Correctifs de la revue de la PR a

Points de la `## Review code` couverts par un test (les autres sont de forme, sans comportement).

**`shared/ui/file-dropzone.spec.ts`** (+4 tests, sélecteurs passés en `data-testid`)

| Test | Scénario | Assertions clés |
|---|---|---|
| champ fichier masqué | rendu | `input[type=file]` : `tabindex="-1"`, `aria-hidden="true"` |
| nom du bouton | rendu, `label` + `helperText` | ni `aria-label` ni `aria-labelledby` ; texte qui commence par le `label` et contient l'aide |
| focus après choix | focus sur `file-dropzone-trigger`, `change` avec un fichier | `document.activeElement` = `file-dropzone-replace` |
| focus après retrait | fichier choisi, clic sur `file-dropzone-clear` | `document.activeElement` = `file-dropzone-trigger` |

Contrat réaligné : les deux tests existants sélectionnaient le bouton par `[aria-label="Choisir un
fichier"]`, attribut retiré par le correctif (il provoquait `label-content-name-mismatch`) ; ils
passent par `data-testid="file-dropzone-trigger"`, assertions inchangées.

**`admin-projects.spec.ts`** (+1 test, m1) : liste et catégories en échec, puis en succès ;
« Réessayer » → `getCategories` appelé deux fois, `categories()` = `['Tous', 'Mobile']`.

**`analytics-presenter.spec.ts`** (+5 cas, m2) : `pagesPerSessionLabel` accorde « page » sur le
nombre affiché (arrondi à une décimale) : 0/0 « 0 page », 56/42 « 1,3 page », 194/100 « 1,9 page »,
196/100 « 2,0 pages », 300/100 « 3,0 pages ».

RED constaté : `file-dropzone` sur le composant d'avant (4 failed / 4, avant l'ajout des tests de
focus), puis les 2 tests de focus sur le correctif sans relais (2 failed / 6) ; le test m1
(`calls: 1`, catégories `['Tous']`), les cas m2 (export `pagesPerSessionLabel` absent, échec de
compilation).

### Outils de test de la PR b (suivi m7)

`shared/testing/press-test-id.ts` regroupait six aides. Il est découpé, un concept par fichier :

- `shared/testing/settle.ts` : `settle`, `settleBounded`. La macro-tâche de `settleBounded` est
  gardée et commentée d'une ligne : une ressource en attente (`NEVER`) laisse la fixture
  instable, et seule une macro-tâche garantit que les micro-tâches des chargeurs sont vidées.
  Elle ne se combine pas avec `vi.useFakeTimers()` (le `setTimeout` serait gelé) : les specs sous
  faux minuteurs (Audience) n'utilisent que `captureCrash` et `advanceTimersByTimeAsync`.
- `shared/testing/by-test-id.ts` : `byTestId`, `testIdText` ;
- `shared/testing/capture-crash.ts` : `captureCrash` ;
- `shared/testing/press-test-id.ts` : `pressTestId` seul.

Adaptation mécanique : `app.spec.ts`, `confirm-dialog.spec.ts`, `load-error.spec.ts`,
`testing/confirm-dialog-page.ts`, `admin-messages.spec.ts`, `admin-projects.spec.ts`,
`admin-layout.spec.ts`, `admin-blog.spec.ts`, `admin-cv.spec.ts`,
`admin-analytics-header.spec.ts`, `admin-dashboard.spec.ts`, `admin-analytics.spec.ts` — 12 sites
d'import repointés, aucune valeur attendue modifiée.

Nouveau builder : `features/auth/testing/user-builders.ts` (`makeUser`), pour l'e-mail de la coque
et des Paramètres.

### Tranche B1 — coque : navigation groupée, thème, « Voir le site », tiroir

Contrats fixés par ce RED :

- **`admin-nav-groups.ts`** : `adminNavGroups(counts)` rend quatre groupes, dans l'ordre
  `[null : overview] · [Contenu : projects, posts, cv] · [Audience : audience, messages] ·
  [Compte : settings]`. Routes : `/admin` (seule `exact`), `/admin/projects`, `/admin/blog`,
  `/admin/cv`, `/admin/audience`, `/admin/messages`, `/admin/settings`. `count` vaut le compte
  reçu pour projets, articles et non-lus, `null` ailleurs ou si la source est inconnue.
  `countSuffix` vaut `'non lu'` pour 0 et 1, `'non lus'` au-delà, `''` hors messages. Le libellé
  ne porte pas d'espace : le gabarit l'ajoute.
- `activeNavLabel(groups, url)` ignore `?` et `#`, compare par segment (`/admin/blogroll` n'est
  pas Articles, `/admin/projects/new` est Projets) et rend « Administration » sans
  correspondance.
- **`AdminNav`** : entrées `groups` (requise), `email`, `isDark` (requise) ; sorties `navigate`,
  `themeToggle`, `logout`. Un seul `nav` nommé « Administration » ; « Vue d'ensemble » hors
  groupe ; chaque groupe est un `role="group"` dont le nom est résolu par `aria-labelledby`.
  Aucun titre (`h1` à `h6`) dans la coque. testids : `nav-link-<key>`, `nav-count-<key>` (dans
  le lien, absent si `null`, `sr-only` pour le suffixe), `admin-view-site`,
  `admin-theme-toggle`, `admin-logout` (« Se déconnecter »), `admin-user-email`.
- **`AdminLayout`** : ni `main`, ni `aside`, ni titre, tiroir ouvert ou fermé. Comptes lus sur
  `ProjectsGateway.getAllProjects()`, `BlogGateway.getAllPostsForAdmin()` et
  `ContactGateway.getUnreadCount()` ; une source en erreur retire son compte sans faire tomber
  la coque ; une nouvelle émission du flux partagé met le compte à jour. Barre mobile :
  `admin-topbar-title` = `activeNavLabel` de l'URL courante, suit la navigation ;
  `admin-menu-button` porte `aria-expanded` et un `aria-controls` qui désigne l'élément
  contenant le `role="dialog"` du tiroir. Un lien du tiroir navigue et ferme le tiroir ;
  « Se déconnecter » du tiroir ferme le tiroir et appelle `AuthStore.logout()`.
- **Routes** : `audience` (titre « Audience | Admin ») ; `analytics`, `analytics/visits`,
  `analytics/projects` et `stats` y redirigent.
- **`BlogGateway.invalidateAdminPosts()`** ; `HttpBlogGateway.getAllPostsForAdmin()` partagé :
  un second lecteur ne relance pas la requête, l'invalidation la relance et pousse la liste aux
  lecteurs vivants, un échec est relancé une fois puis n'est pas gardé.
- **`AdminBlog`** : création, mise à jour et suppression réussies appellent
  `invalidateAdminPosts()` une fois et ne réabonnent pas la liste ; une suppression en échec
  restaure la liste sans invalider.

**`admin-nav-groups.spec.ts`** (20 tests, nouveau)

| Test | Scénario | Assertions clés |
|---|---|---|
| groupes | comptes 6 / 2 / 3 | libellés de groupe, `key`, `route`, `label`, `exact` |
| comptes | idem | `count` et `countSuffix` des 7 entrées |
| suffixe (`it.each` × 4) | 0, 1, 2, 12 non-lus | `{ count, countSuffix }` |
| source inconnue (`it.each` × 3) | projets, articles, non-lus à `null` | seul ce compte vaut `null` |
| barre mobile (`it.each` × 11) | URL, requête, fragment, sous-page, préfixe trompeur, inconnue | libellé exact |

**`components/admin-nav.spec.ts`** (21 tests, nouveau, vrai `Router`)

| Test | Scénario | Assertions clés |
|---|---|---|
| structure | rendu | un `nav` « Administration », trois groupes nommés et leurs liens, aucun titre |
| liens | comptes `null` | `href` et texte des 7 liens |
| page courante (`it.each` × 6) | `/admin`, projets, articles, audience, messages, sécurité | `aria-current="page"` sur le seul lien attendu |
| page qui change | `/admin` puis `/admin/messages` | `aria-current` suit |
| comptes | 6 / 2 / 3 | présents sur 3 clés, « 3 non lus », suffixe en `sr-only`, compte dans le lien |
| comptes faibles (`it.each` × 2) | 0, 1 | « 0 non lu », « 1 non lu » |
| comptes inconnus | `null` partout | aucun `nav-count-*` |
| « Voir le site » | rendu | `a`, `href="/"`, `_blank`, `noopener`, « (nouvel onglet) » en `sr-only` |
| e-mail | `email` fourni | texte |
| libellé du thème (`it.each` × 2) | sombre, clair | « Passer en mode clair » / « sombre » |
| lien suivi | clic sur Projets | `navigate` × 1, URL `/admin/projects` |
| actions (`it.each` × 2) | thème, déconnexion | seule la sortie concernée émet |
| déconnexion | rendu | `button` « Se déconnecter » |

**`admin-layout.spec.ts`** (16 tests, réécrit)

| Test | Scénario | Assertions clés |
|---|---|---|
| landmarks (`it.each` × 2) | tiroir fermé, ouvert | 0 `main`, 0 `aside`, 0 titre, `nav` « Administration » présent |
| comptes | 6 projets, 2 articles, 3 non-lus | « 6 », « 2 », « 3 non lus », aucune exception |
| flux partagé | `BehaviorSubject` 6 puis 5 | compte 6 puis 5 |
| source en erreur (`it.each` × 3) | projets, articles, non-lus | compte absent, coque rendue |
| barre mobile (`it.each` × 3) | `/admin`, messages, sécurité | `admin-topbar-title` |
| barre mobile qui suit | `/admin` puis `/admin/audience` | « Audience » |
| ouverture du tiroir | clic sur `admin-menu-button` | `aria-expanded` `false` puis `true`, `aria-controls` désigne le tiroir, navigation dedans |
| lien du tiroir | clic sur Messages | URL `/admin/messages`, tiroir fermé, `aria-expanded="false"` |
| déconnexion du tiroir | clic | `logout` × 1, tiroir fermé |
| pied de la barre latérale | rendu puis clic | e-mail, `logout` × 1 |
| bascule de thème | inchangé | inchangé |

**`admin.routes.spec.ts`** (+5 tests) : `/admin/audience`, `/admin/analytics`,
`/admin/analytics/visits`, `/admin/analytics/projects`, `/admin/stats` → URL `/admin/audience`,
titre « Audience | Admin » (vrai `Router`, `TitleStrategy` par défaut).

**`http-blog.gateway.spec.ts`** (+3 tests) : second lecteur sans requête ; invalidation → une
requête, `[['a-1'], ['a-1', 'a-2']]` reçus ; échec relancé une fois, non gardé, nouveau lecteur
servi (URL de couverture résolue).

**`admin-blog.spec.ts`** (+4 tests) : création, mise à jour, suppression (`it.each` × 3) →
`{ invalidations: 1, listSubscriptions: 1 }` ; suppression en échec puis réussie → liste
restaurée sans invalidation, puis une invalidation.

Contrat réaligné (changement de contrat acté par le plan, pas une adaptation mécanique) :

- `admin-layout.spec.ts` : les 8 tests de la PR a sont remplacés. « pastille des non-lus »
  (3 tests, testid `nav-unread-count`, 0 non lu masqué) devient `nav-count-messages`, avec
  « 0 non lu » affiché comme dans la maquette ; « navigation en français » et « page courante »
  passent dans `admin-nav.spec.ts`, avec `/admin/audience` au lieu de `/admin/analytics` ;
  « non-lus annoncés » (2 tests) devient le test des comptes faibles. La bascule de thème est
  gardée telle quelle (fournisseurs ajoutés pour les deux nouvelles sources).
- `admin.routes.spec.ts` : le titre d'Audience est lu sous la clé `audience` au lieu
  d'`analytics`, valeur inchangée.
- `admin-blog.spec.ts` : le double `makeBlogGateway` reçoit `invalidateAdminPosts` (construction
  des entrées seulement).

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-07 13:15, 65 failed / 1897 total).

Sur l'arbre réel, après `ng cache clean` et purge de `node_modules/.vite`, `pnpm test` s'arrête à
la compilation, sur des symboles dus au GREEN seulement : `TS2307` (`admin-nav-groups`,
`admin-page-copy`, `admin-page-header`), `TS2339` (`invalidateAdminPosts` sur
`HttpBlogGateway`, `logout` sur `AdminNav`), `TS2353` (`invalidateAdminPosts` absent de
`Partial<BlogGateway>`), et les `TS7006` / `TS7031` / `NG1010` qui en découlent. Les specs n'ont
aucune faute de type propre ; Prettier et ESLint passent sur les 24 fichiers touchés.

**Squelette jetable de mesure** (B1 et B2 ensemble), posé puis retiré : `adminNavGroups` rend
`[]`, `activeNavLabel` rend `''`, copies vides, `AdminPageHeader` sans gabarit, `AdminNav` gagne
`groups`, `email` et `logout` sans les rendre, `invalidateAdminPosts` abstrait et vide.
Résultat : **100 failed / 1897 total**, tous en `AssertionError` (aucun `TypeError`, `NG0`, délai
dépassé ni erreur de `HttpTestingController`). 65 appartiennent à B1 :

| Suite | Échecs |
|---|---|
| `admin-nav-groups` | 20 / 20 |
| `admin-nav` | 17 / 21 |
| `admin-layout` | 15 / 16 |
| routes | 6 / 6 |
| `http-blog.gateway` | 3 / 3 |
| `admin-blog` (invalidation) | 4 / 4 |

Verts sous le squelette, rouges sur l'arbre réel (compilation) : la bascule de thème de la coque
et les trois tests de thème d'`AdminNav` (contrat de la PR a conservé), et « aucun compte
inconnu » (le squelette ne rend aucun compte).

**Harnais vérifié** : une implémentation jetable complète de B1 et B2 (14 fichiers applicatifs,
11 modifiés et 3 créés) a donné **1897 passed / 1897**, sans `stderr` ni `NG0`. Les fichiers
modifiés ont été restaurés depuis l'instantané (`md5sum -c` : 12 OK), les 3 fichiers créés
supprimés.

Preuve navigateur attendue (mise en page et focus, hors de portée de happy-dom) :

- 375 px : barre latérale absente, barre mobile visible ; `admin-menu-button` ouvre le tiroir à
  gauche ; Tab et Maj+Tab restent dans le tiroir ; Échap le ferme et rend le focus au bouton
  menu ; un lien du tiroir navigue et ferme le tiroir ;
- 1 008, 1 023 et 1 024 px : bascule barre mobile / barre latérale à `lg` (D10), aucun
  défilement horizontal ; barre latérale collante sur toute la hauteur ;
- clavier seul sur la barre latérale : ordre des liens, `aria-current`, soulignement de la page
  active visible dans les deux registres ;
- axe-core WCAG 2.2 AA sur `/admin` et une page par groupe, deux registres : plus de
  `landmark-no-duplicate-main`, `landmark-main-is-top-level`, `landmark-unique` ; un seul `main`
  par page ;
- `/admin/analytics` dans la barre d'adresse → `/admin/audience`, titre d'onglet « Audience |
  Admin ».

### Tranche B2 — un en-tête de page commun

Contrats fixés par ce RED :

- **`components/admin-page-header.ts`** (`app-admin-page-header`) : `overline` et `heading`
  requis. Un `header` contient, dans l'ordre, le sur-titre (`admin-page-overline`), le `h1`
  (`admin-page-title`, `tabindex="-1"`, seul `h1`), puis l'introduction projetée ; l'action
  `[adminPageAside]` est projetée après l'introduction, hors de son conteneur (seconde colonne).
  Sans contenu projeté, seuls le sur-titre et le titre portent du texte.
- **`admin-page-copy.ts`** (fonctions pures) :
  - `projectsOverline(projects)` : « 6 réalisations · 2 mises en avant » (`featured`) ;
  - `postsOverline(posts)` : « 3 articles · 1 publié · 2 brouillons » ;
  - `messagesOverline(messages)` : « 2 non lus · 3 au total » ;
  - `cvOverline(cv | null)` : « PDF · 76 Ko · mis en ligne le 19 sept. 2026 », tailles en `o`,
    `Ko` (arrondi) et `Mo` à virgule (« 1,2 Mo ») ; `null` → « Aucun CV en ligne » ;
  - `audienceOverline(range, now)` : « 7 sept. au 6 oct. 2026 · 30 derniers jours », du jour
    `now − n` à la veille de `now`, année répétée si elle change, `all` → « Tout le temps » ;
  - `todayOverline(now)` : « Mercredi 7 octobre 2026 », jour de la semaine en capitale.
  - Singulier pour 0 et 1, pluriel au-delà ; espaces simples (aucune règle de
    `editorial-typography.spec.ts` ne s'applique), dates `Intl` `fr-FR`.
- **Pages** : Projets, Articles, Messages, CV, Audience et Paramètres rendent l'en-tête commun,
  avec un seul `h1`. Titres : « Projets », « Articles », « Messages », « CV » (au lieu de
  « Gestion du CV », comme la maquette), « Audience », « Paramètres ». Sur-titre de Paramètres :
  l'e-mail du compte (`AuthStore.currentUser()`). Sur-titre d'Audience : suit la période.

**`components/admin-page-header.spec.ts`** (4 tests, nouveau, hôte de test)

| Test | Scénario | Assertions clés |
|---|---|---|
| titre | sur-titre et titre | textes, `H1`, `tabindex="-1"`, un `h1`, même `header`, sur-titre avant |
| projections | introduction et action | dans le `header`, introduction après le titre, action après l'introduction, conteneurs distincts |
| réactivité | signaux de l'hôte changés | sur-titre et titre suivent |
| sans projection | balise nue | seuls `admin-page-overline` et `admin-page-title` portent du texte |

**`admin-page-copy.spec.ts`** (25 tests, nouveau, TypeScript pur, builders)

| Test | Cas |
|---|---|
| `projectsOverline` (`it.each` × 5) | 0/0, 1/0, 1/1, 2/1, 6/2 |
| `postsOverline` (`it.each` × 5) | 0/0, 1/0, 0/1, 2/0, 1/2 |
| `messagesOverline` (`it.each` × 4) | 0/0, 1/0, 0/2, 2/1 |
| `cvOverline` (`it.each` × 3, + 1) | 512 o, 76 Ko, 1,2 Mo ; `null` |
| `audienceOverline` (`it.each` × 5) | 7, 30, 90 jours le 7 oct. 2026 ; 30 jours le 10 janv. 2026 ; `all` |
| `todayOverline` (`it.each` × 2) | mercredi matin, dimanche 23 h 30 |

**Câblage des pages** (+6 tests, un par page) : `admin-projects.spec.ts` (« 2 réalisations ·
1 mise en avant »), `admin-blog.spec.ts` (« 2 articles · 1 publié · 1 brouillon »),
`admin-messages.spec.ts` (« 1 non lu · 2 au total »), `admin-cv.spec.ts` (« PDF · 76 Ko · mis
en ligne le 19 sept. 2026 », titre « CV »), `admin-analytics.spec.ts` (7 oct. 2026 sous
`vi.setSystemTime` : 30 jours puis 7 jours après changement de période),
`admin-settings.spec.ts` (nouveau, créé ici plutôt qu'en C10 parce que B2 modifie la page :
e-mail du compte, « Paramètres »). Chacun vérifie le sur-titre, le titre et un seul `h1`. Les
tests A1 qui attendent le focus sur `admin-page-title` après une suppression restent la preuve
que la page sait toujours focaliser le titre une fois celui-ci dans le composant.

Adaptation mécanique : `admin-projects.spec.ts`, `setup()` rend aussi la `fixture` (aucun appel
existant modifié).

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-07 13:15, 35 failed / 1897 total).

Même exécution que B1 (arbre réel arrêté à la compilation, squelette jetable, harnais vérifié).
Sous le squelette, 35 échecs, tous en `AssertionError` : copies 25 / 25, en-tête 4 / 4, pages
6 / 6.

Points de copie à valider en revue (non tranchés par le plan) : « Tout le temps » pour la période
`all`, « Aucun CV en ligne » comme sur-titre sans CV, le jour 1 écrit « 1 » (pas « 1er »), et la
période affichée qui s'arrête la veille alors que `dateRangeToParams` envoie `endDate` = aujourd'hui.

### Bilan du RED B1 et B2

- Base : 1801 passed / 1801.
- Arbre de tests : 1897 = 1801 − 8 (anciens tests de la coque) + 104 nouveaux.
- Sous le squelette : 100 failed (65 + 35), tous en `AssertionError`.
- Sous l'implémentation jetable : 1897 passed.
- Ni le motif d'archéologie ni `grep -P '\x{00A0}|\x{202F}'` ne trouvent rien dans les 24
  fichiers touchés.

### Outils de test des tranches B3 à B5

- `features/analytics/testing/analytics-builders.ts` (nouveau) : `makeStatsOverview` (défauts =
  relevé de prod du 2026-10-07 : 42 visiteurs, 56 pages vues, 42 sessions, 37 rebonds, 88,1 %,
  22 s), `makeChartPoint`, `makeMetricEntry`. Les `overview()` locaux d'`admin-analytics.spec.ts`
  et d'`analytics-presenter.spec.ts` restent en place (dette notée, hors de ces tranches).
- Conventions communes de la vue d'ensemble : `null` en entrée d'une fonction pure ou d'un
  composant dumb = source **indisponible** (chargement ou erreur, la page décide de l'affichage) ;
  jamais remplacé par `0` ou `[]`. La page sous `vi.useFakeTimers({ toFake: ['Date'] })` (seule
  l'horloge est figée, `settleBounded` garde son `setTimeout`) ; `OverviewAudience` est rendu sans
  `AppChart` (`overrideComponent` + `CUSTOM_ELEMENTS_SCHEMA`) : le `<canvas>` de happy-dom n'a pas
  de contexte, et la propriété `data` de l'élément `app-chart` reste lisible pour vérifier le
  câblage.

### Tranche B3 — vue d'ensemble : en-tête, cartouche « En ligne », actions rapides

Contrats fixés par ce RED :

- **`overview-view.ts`** : `toOnlineRows(projects: readonly Project[] | null, posts: readonly
  BlogPost[] | null): readonly CartoucheRow[]` rend toujours quatre rangées, dans l'ordre
  « En production », « Démos », « Scripts » (« n projet(s) », singulier pour 0 et 1, nature `null`
  ignorée), « Articles » (« n publié(s) », brouillons exclus). Source `null` → valeur
  « indisponible » sur ses rangées, jamais « 0 ».
- **`AdminOverview`** (`admin-overview.ts`, `app-admin-overview`) : `AdminPageHeader` avec le
  sur-titre `todayOverline(now) + ' · 30 derniers jours'`, `now` lu à la construction de la page
  (le cas du 8 octobre fait tomber une date figée au chargement du module), titre « Vue
  d'ensemble », seul `h1`. Aside `[adminPageAside]` `data-testid="overview-online"` dans le
  `header` : `app-cartouche` « En ligne », référence « nedellec-julien.fr », `[rows]` =
  `toOnlineRows`. Tant que projets **ou** articles chargent : `overview-online-loading` à la place
  du cartouche (aucune rangée). Source en erreur : rangées « indisponible » ; l'alerte et
  « Réessayer » sont portées par la section « Contenu en ligne » (B5), une seule par source.
- **Actions rapides** : `section` `overview-quick` nommée par son `h2` « Actions rapides » ;
  quatre `a` : `quick-new-project` « Nouveau projet » → `/admin/projects`, `quick-new-post`
  « Nouvel article » → `/admin/blog`, `quick-cv` « Remplacer le CV » → `/admin/cv`,
  `quick-audience` « Voir l'audience » → `/admin/audience`. Chaque lien est suivi au clic (vrai
  `Router`), pas seulement rendu.
- **Routes** : la route `''` charge `AdminOverview` ; `admin-dashboard.ts` est supprimé au GREEN.

Choix documenté — « Nouveau projet » : le plan fixe `/admin/projects` en PR b et
`/admin/projects/new` en C1 (première vraie page de création). Le test épingle `/admin/projects`
et le libellé de la maquette ; C1 mettra à jour l'`href` attendu dans ce même test (contrat
modifié, pas un test parallèle). D'ici là, le lien mène à la liste dont l'action principale est
« Nouveau projet ». « Exporter l'audience » (maquette) devient « Voir l'audience » : un lien
« Exporter » qui ne télécharge rien reproduirait le défaut du point 10 de la `## Description`.

**`overview-view.spec.ts` — `toOnlineRows`** (8 tests, nouveau, TypeScript pur, builders)

| Test | Cas |
|---|---|
| comptes (`it.each` × 5) | catalogue 2/2/2 + 2 publiés ; rien ; un de chaque ; nature `null` ; brouillons |
| source indisponible (`it.each` × 3) | projets, articles, les deux à `null` → « indisponible » |

**`admin-overview.spec.ts` — B3** (11 tests, nouveau, vrai `Router`)

| Test | Scénario | Assertions clés |
|---|---|---|
| en-tête (`it.each` × 2) | 7 puis 8 oct. 2026 | sur-titre « Mercredi 7 octobre 2026 · 30 derniers jours » / « Jeudi 8 … », « Vue d'ensemble », un `h1`, aucune exception |
| cartouche | catalogue de prod | dans le `header`, titre, référence, 4 rangées libellé/valeur |
| cartouche en erreur (`it.each` × 2) | projets, articles | valeurs « indisponible » sur la seule source tombée |
| cartouche en chargement | projets `NEVER` | `overview-online-loading`, aucune valeur |
| actions rapides | rendu | quatre liens dans la section nommée « Actions rapides » |
| liens suivis (`it.each` × 4) | clic | `A`, libellé, `href`, URL du routeur après clic |

**`admin.routes.spec.ts`** (+1 test) : `loadComponent()` de la route `''` rend `AdminOverview`.

Tests supprimés : `admin-dashboard.spec.ts` (7 tests). Ses contrats passent à la vue d'ensemble :
non-lus et CV « — indisponible » (B5, `OverviewContacts` et page), trois derniers messages triés
(B5, `latestMessages`).

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-07 13:56, 20 failed / 2005 total).

### Tranche B4 — vue d'ensemble : relevé « Audience »

Contrats fixés par ce RED :

- **`components/admin-readout.ts`** : `ReadoutItem = { label, value, unit, detail }` (tous
  `string`) ; `items` requis ; un seul `dl`, chaque entrée `readout-item` = `dt` (libellé) +
  `dd` portant `readout-value` (valeur suivie de l'unité) et `readout-detail`.
- **`overview-view.ts`** :
  - `toAudienceReadout(overview)` : « Pages vues » (nombre `fr-FR`, « 12 345 » avec U+202F,
    détail `pagesPerSessionLabel`), « Rebond » (valeur de `formatPercent` sans l'unité, unité
    U+00A0 « % », détail « n session(s) sur N » à partir de `bounces` / `sessions`), « Durée
    moyenne » (valeur de `formatDuration` sans le « s » final, unité U+00A0 « s », détail « par
    page ») ;
  - `chartSummary(points)` : « Aucune visite sur la période. » sans point ; « Visiteurs le
    7 septembre 2026 : 6. » pour un seul jour ; sinon « Visiteurs par jour du 7 septembre au
    6 octobre 2026 : maximum 6 le 7 septembre. », égalités listées (« le 7 septembre et le
    20 septembre », « le 1er septembre, le 3 septembre et le 9 septembre »), « aucune visite »
    si le maximum vaut 0, année sur chaque date quand la période change d'année ; jours
    calendaires UTC, « 1er » pour le premier du mois, U+00A0 avant « : ».
- **`chart-palette.ts`** : `readChartPalette(document): { primary, foreground }` lit
  `--theme-primary-text` et `--theme-foreground` sur la racine ; jeton vide → `'CanvasText'`.
- **`analytics-presenter.ts`** : `buildVisitorsChartData(rows, { primary, foreground })` (plus
  d'`accent`) : « Visiteurs » trait `primary` plein, « Pages vues » `alpha(foreground, 55)`,
  `borderDash: [4, 4]`, `tension: 0` sur les deux ; toute clé `*Color` dérive de `primary` ou de
  `foreground`. La page Audience l'adopte.
- **`components/overview-audience.ts`** : entrées `visitors`, `sessions` (nombres), `readout`,
  `chartData`, `chartOptions`, `chartSummary` ; `section` nommée par son `h2` « Audience » ;
  `overview-visitors` (« 1 234 » groupé), `overview-sessions` (« 1 session », « 42 sessions ») ;
  `app-chart` de type `line` dans un `figure` dont le `figcaption` est `chartSummary` ;
  `overview-audience-link` → `/admin/audience` ; `app-admin-readout`.
- **Page** : `data-testid="overview-audience"` ; `getOverview`, `getChart` et
  `getMetrics('referrer', …)` appelés une fois chacun avec `dateRangeToParams('30d', now)`
  (« 2026-09-07 », « 2026-10-07 ») ; statistiques en chargement → `overview-audience-loading`,
  aucun chiffre ; en erreur → une `LoadError` dans la section, aucun `overview-visitors` ni
  relevé, « Réessayer » relance `getOverview` ; courbe seule en erreur → chiffres gardés et une
  `LoadError` ; palette relue quand `ThemeStore.isDark` change.

**`overview-view.spec.ts` — Audience** (10 tests) : `toAudienceReadout` (`it.each` × 3 : relevé
de prod, grands nombres et durée > 1 min, période vide) ; `chartSummary` (`it.each` × 7 : vide,
un jour, un pic, deux égalités, trois égalités avec « 1er », aucune visite, deux années).

**`chart-palette.spec.ts`** (3 tests, nouveau) : deux jetons, aucun, un seul.

**`analytics-presenter.spec.ts`** (1 test modifié, +2) : datasets (signature à palette, couleur
de « Pages vues », `tension: 0`) ; plein / tirets ; une seule teinte.

**`admin-analytics.spec.ts`** (+1 test) : `chartData()` de la page Audience à traits droits,
« Pages vues » tiretée.

**`components/admin-readout.spec.ts`** (2 tests, nouveau) : structure `dl` / `dt` / `dd` et
textes ; réactivité de `items`.

**`components/overview-audience.spec.ts`** (6 tests, nouveau)

| Test | Assertions clés |
|---|---|
| section | nom « Audience » par `aria-labelledby` (`H2`), visiteurs, sessions, 3 entrées de relevé |
| figure | `figcaption` = résumé, `app-chart` de type `line`, `data` = la donnée reçue |
| lien | `A` vers `/admin/audience` |
| nombres (`it.each` × 3) | 1 / 1, 0 / 0, 1 234 / 1 500 : singulier, groupement |

**`admin-overview.spec.ts` — B4** (7 tests) : relevé prêt (42, « 42 sessions », valeurs du
relevé, légende) ; période des requêtes ; statistiques en erreur ; « Réessayer » (2 requêtes,
plus d'erreur, 42) ; courbe seule en erreur ; chargement ; bascule de thème (couleur du trait
« Visiteurs » relue).

Contrat réaligné : le test « mappe labels et deux datasets » d'`analytics-presenter.spec.ts` passe
de `(rows, '#primary', '#accent')` à `(rows, palette)` et attend la couleur de « Pages vues »
dérivée du texte, conformément au plan (`accent` retiré du graphique). Changement de contrat, pas
une adaptation mécanique.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-07 13:56, 31 failed / 2005 total).

Vert sous le squelette, rouge sur l'arbre réel (compilation) : « une seule teinte » (le squelette
passait `foreground` comme second trait).

### Tranche B5 — vue d'ensemble : contacts, contenu en ligne, phrase de synthèse

Contrats fixés par ce RED :

- **`overview-copy.ts`** : `OverviewSummaryInput = { overview: StatsOverview | null; referrers:
  readonly MetricEntry[] | null; unread: number | null; projects: readonly Project[] | null;
  posts: readonly BlogPost[] | null }` ; `overviewSummary(input)` rend jusqu'à trois phrases
  séparées d'une espace :
  - audience : « 42 visiteurs en 30 jours, dont 18 venus de google.com. » (premier référent au nom
    non vide, nom tel que l'API le donne), « 1 visiteur …, dont 1 venu de … », « Aucun visiteur en
    30 jours. », sans référent nommé ou référents indisponibles : « 42 visiteurs en 30 jours. » ;
  - contacts : « Aucun message en attente, aucun CV téléchargé. », « 3 messages en attente, 1 CV
    téléchargé. », CV lus sur `overview.cvDownloads` (même période de 30 jours que le reste) ;
    chaque moitié omise si sa source manque, majuscule reportée sur la première restante ;
  - contenu : nombres de 2 à 10 en lettres (« Six », « dix »), « Une réalisation » / « un
    article », chiffres au-delà de 10 ; « … et … sont en ligne. », « Six réalisations sont en
    ligne, aucun article. », « Deux articles sont en ligne, aucune réalisation. », « Rien n'est en
    ligne. » ; source indisponible : seule l'autre est citée (« Deux articles sont en ligne. »,
    « Aucun article n'est en ligne. ») ; articles = publiés seulement.
  - toutes les sources indisponibles : `''`.
- **`overview-view.ts`** :
  - `ContentRow = { key, kind: 'post' | 'project', title, href, image, meta, stamp: string |
    null }` ; `toContentRows(projects | null, posts | null, limit)` : articles publiés par date de
    publication décroissante (`updatedAt` à défaut), puis projets par `order` ; `key`
    `post:<id>` / `project:<id>` ; `href` `/admin/blog` / `/admin/projects` (pages d'édition en
    C1) ; méta « Article · 9 sept. 2026 · 2 min » (`readingTimeMinutes`, U+00A0 avant « min »,
    « 1er ») et « Projet · Application Web · mis en avant » ; tampon « Publié » ou
    `PROJECT_KIND_LABELS[kind]`, `null` sans nature ; source `null` = liste vide de cette source ;
  - `latestMessages(messages, limit)` : plus récents d'abord.
- **`components/admin-empty-state.ts`** : `stamp` requis ; `empty-state` contient le tampon
  (`empty-state-stamp`, en premier) puis le texte et l'action projetés.
- **`components/overview-contacts.ts`** : `unread`, `cvDownloads` (`number | null`), `latest`
  (`readonly ContactMessage[] | null`). Liens `overview-unread` → `/admin/messages` et
  `overview-cv` → `/admin/cv` contenant `overview-unread-count` / `overview-cv-count` ; `null` →
  « — » `aria-hidden` + « indisponible » `sr-only`. `latest` vide → `AdminEmptyState` « Boîte
  vide » avec `overview-contact-page` (`/#contact`, `_blank`, `noopener`, « (nouvel onglet) » en
  `sr-only`, contrat révisé par les correctifs de la revue de la PR b : « Voir le site », `/`) ; `null` → ni liste ni état vide ; sinon `overview-message` (expéditeur et sujet) avec
  `overview-message-link` → `/admin/messages`.
- **`components/overview-content.ts`** : `rows` requis ; `section` nommée par son `h2` « Contenu
  en ligne » ; `overview-content-item` avec `overview-content-link`, `overview-content-meta`,
  `overview-content-stamp` (absent si `null`) ; `img` `alt=""` seulement si `image` non vide ;
  aucune rangée → `AdminEmptyState` « Rien en ligne ».
- **Page** : `overview-summary` (introduction projetée de l'en-tête) ; `overview-contacts` :
  trois derniers messages, `getAllMessages` en chargement → `overview-contacts-loading`, en erreur
  → `LoadError` sans état vide, « Réessayer » relance ; `overview-content` : cinq rangées,
  `overview-content-loading` tant qu'une des deux sources charge, `LoadError` si projets ou
  articles en erreur (rangées de l'autre source gardées), « Réessayer » relance la source tombée
  et rétablit aussi le cartouche.

**`overview-view.spec.ts` — contenu et messages** (10 tests) : ordre et forme des cinq rangées ;
`it.each` × 5 (limite 2, tout, projets absents, articles absents, rien) ; article publié sans date
de publication ; `latestMessages` (`it.each` × 3).

**`overview-copy.spec.ts`** (21 tests, nouveau) : phrase complète de la maquette ; audience
(`it.each` × 4) ; contacts (`it.each` × 3) ; contenu (`it.each` × 10) ; sources manquantes
(`it.each` × 3).

**`components/admin-empty-state.spec.ts`** (2 tests, nouveau, hôte de test) : tampon, texte et
action dans `empty-state`, tampon en premier ; réactivité du tampon.

**`components/overview-contacts.spec.ts`** (8 tests, nouveau) : chiffres et liens ;
indisponibles (`it.each` × 3) ; tiret caché aux aides techniques ; deux messages ; état vide et
lien Contact ; `latest` à `null`.

**`components/overview-content.spec.ts`** (4 tests, nouveau) : nom de section ; rangées
(lien, méta, tampon) ; image décorative seulement avec couverture ; état vide.

**`admin-overview.spec.ts` — B5** (14 tests) : synthèse complète ; synthèse sans statistiques ni
non-lus ; contacts (3, 2, David / Bob / Chloé) ; chiffre indisponible (`it.each` × 2) ; boîte
vide ; messages en erreur ; « Réessayer » des messages ; messages en chargement ; contenu (ordre
des cinq titres) ; projets en erreur ; « Réessayer » des projets (2 requêtes, 5 rangées, cartouche
rétabli) ; articles en chargement ; toutes les sources en panne (« indisponible » partout, aucun
visiteur, synthèse vide, au moins une alerte, page debout).

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-07 13:56, 55 failed / 2005 total).

Verts sous le squelette (cas dégénérés, la valeur attendue est vide), rouges sur l'arbre réel :
`toContentRows` « rien en ligne », `latestMessages` « aucun message », `overviewSummary` « toutes
les sources indisponibles », `OverviewContacts` « `latest` à `null` ».

### Bilan du RED B3 à B5

- Base : 1902 passed / 1902 (B1 et B2 verts, non commités).
- Arbre de tests : 2005 = 1902 − 7 (`admin-dashboard.spec.ts`) + 110 nouveaux (B3 20, B4 31 hors
  test modifié, B5 59).
- Arbre réel, après `ng cache clean` et purge de `node_modules/.vite` : `pnpm test` s'arrête à la
  compilation, sur des symboles dus au GREEN seulement : `TS2307` (`admin-overview`,
  `overview-view`, `overview-copy`, `chart-palette`, `admin-readout`, `admin-empty-state`,
  `overview-audience`, `overview-contacts`, `overview-content`), `TS2554` (×3, nouvelle signature
  de `buildVisitorsChartData` dans `analytics-presenter.spec.ts`), et les `TS7006` / `NG1010` qui en
  découlent. Aucune faute de type propre aux specs ; Prettier et ESLint passent sur les 13 fichiers
  touchés.
- **Squelette jetable** (9 fichiers créés : fonctions pures qui rendent `[]` / `''`, composants
  sans gabarit, `AdminOverview` vide ; `buildVisitorsChartData` à la nouvelle signature avec
  l'ancien rendu ; route `''` laissée sur le tableau de bord) : **106 failed / 2005**, tous en
  `AssertionError` (aucun `TypeError`, `NG0`, délai dépassé ni `stderr`) : B3 20, B4 31, B5 55.
- **Harnais vérifié** : implémentation jetable complète (9 fichiers créés, 3 modifiés) :
  **2005 passed / 2005**, sans `stderr` ni `NG0`. Fichiers modifiés restaurés depuis l'instantané
  (`md5sum -c` : 3 OK), fichiers créés supprimés.
- Ni le motif d'archéologie ni `grep -P '\x{00A0}|\x{202F}'` ne trouvent rien dans les 13
  fichiers touchés ; les insécables y sont écrites en échappement.

Hors de portée de happy-dom (à prouver au navigateur) : la courbe dessinée (canvas), sa couleur
effective dans les deux registres, la mise en page du cartouche à droite à partir de `lg`, les
vignettes `fill` 16/10 et 1200/630, le rendu de l'état vide tireté.

Points de copie à valider en revue (non tranchés par le plan) : « Voir l'audience » au lieu
d'« Exporter l'audience » ; « indisponible » dans le cartouche ; nombres en lettres jusqu'à dix ;
« Rien n'est en ligne. », « Rien en ligne » (tampon) ; « Article · date · n min » (durée de
lecture plutôt que j'aime) ; « Visiteurs le … : n. » pour un seul jour ; CV de la synthèse et du
relevé « Contacts » lus sur `overview.cvDownloads` (30 jours) plutôt que `getCvDownloadCount()`
sans période, comme l'ancien tableau de bord.

### Correctifs de la revue de la PR b

Points de la `## Review code` (PR b, revue du 2026-10-07) couverts par un test. Les tests sont
écrits avec le correctif, à la demande de la session principale (pas de passage `qa` séparé).

**Changement de contrat acté par la revue (point 1)** : le sur-titre d'Audience dérive ses bornes
de `dateRangeToParams(range, now)`, celles qu'on envoie à l'API (dates calendaires UTC, jour de fin
inclus en entier par l'API). La période finit donc **aujourd'hui** et non plus la veille. Seules les
attentes de date de fin changent :

| Test | Avant | Après |
|---|---|---|
| `admin-page-copy.spec.ts`, `7d`, 7 oct. 2026 | « 30 sept. au 6 oct. 2026 » | « 30 sept. au 7 oct. 2026 » |
| idem `30d` | « 7 sept. au 6 oct. 2026 » | « 7 sept. au 7 oct. 2026 » |
| idem `90d` | « 9 juil. au 6 oct. 2026 » | « 9 juil. au 7 oct. 2026 » |
| idem `30d`, 10 janv. 2026 | « 11 déc. 2025 au 9 janv. 2026 » | « 11 déc. 2025 au 10 janv. 2026 » |
| `admin-analytics.spec.ts`, câblage 30 j puis 7 j | « … au 6 oct. 2026 » | « … au 7 oct. 2026 » |

**Point 2, `overview-contacts.spec.ts`** (test de l'état vide réécrit) : texte « Aucun message pour
l'instant. Le formulaire de contact de l'accueil est en ligne ; un nouveau message apparaîtra ici
avec son sujet. » (U+202F avant « ; »), lien `overview-contact-page` « Voir le site (nouvel
onglet) », `href="/"`, `_blank`, `noopener`.

**m1, `overview-contacts.spec.ts`** (+4 cas) : unités `overview-unread-unit` / `overview-cv-unit`
accordées : 1 et 0 → « message » / « téléchargement », 2 et 12 → pluriel, `null` → pluriel.

**m6, `overview-contacts.spec.ts`** (+2 cas) et **`admin-overview.spec.ts`** (+1) : `unreadLoading`
ou `cvLoading` → `overview-unread-loading` / `overview-cv-loading` présent, aucun « indisponible » ;
page avec statistiques en attente → squelette du chiffre CV, pas « indisponible ». Les non-lus
suivent la même règle (même défaut, même composant).

**m3, `analytics-presenter.spec.ts`** (+1) : `buildVisitorsOnlyChartData` rend les mêmes libellés et
un seul jeu de données, égal à la courbe « Visiteurs » de `buildVisitorsChartData`.

**m5, `pluralize.spec.ts`** (+4 cas : 0, 1, 2, 1 500) et **`capitalize.spec.ts`** (+4 cas, dont
initiale accentuée et chaîne vide).

## Journal des tranches

- **Tranche A1 — supprimer demande confirmation** : GREEN 1720 passed / 1720 total · refactor : `ConfirmDialog` ferme le `<dialog>` avant d'émettre (sinon le reste de la page reste inerte et le focus ne peut pas atteindre le `h1`) ; requête `viewChild` de titre remontée sous les dépendances injectées sur les 4 pages (ordre `CLAUDE.md`).
- **Tranche A2 — la période d'Audience affichée est celle des données** : GREEN 1720 passed / 1720 total · refactor : aucun.
- **Tranche A3 — chargement, erreur et vide sont trois états distincts** : GREEN 1720 passed / 1720 total · refactor : l'état d'écran des 4 pages (Projets, Articles, Messages, CV) sorti dans `shared/ui/load-state.ts` (`loadState`, 4 sites d'appel) ; instantanés des suppressions optimistes lus par les `computed` gardés par `hasValue()` au lieu de `value() ?? []` ; `categories` de Projets gardé par `hasValue()` (défaut trouvé au navigateur, non couvert par les doubles : la ressource en erreur figeait l'écran en chargement).
- **Tranche A3bis — corrective : retours du GREEN A1 à A3** : GREEN 1791 passed / 1791 total · refactor : lectures d'Audience regroupées derrière un `valueOr` local gardé par `hasValue()` (11 sites dans le même fichier), relance limitée aux ressources en échec (`_failedSources`).
- **Tranche A4 — le thème est juste sous `/admin` et partagé avec le site** : GREEN 1791 passed / 1791 total · refactor : l'`effect` d'Audience qui recopiait la palette dans un `signal` devient un `computed` dépendant de `ThemeStore.isDark` (plus d'`effect` qui réécrit un signal).
- **Tranche A5 — messages ouvrables au clavier, tri annoncé** : GREEN 1791 passed / 1791 total · refactor : `stopPropagation` et méthodes `onExtraClick` / `onDeleteClick` d'`AdminColActions` supprimés (la ligne n'est plus cliquable, plus rien à stopper).
- **Tranche A6 — libellés et nombres en français** : GREEN 1791 passed / 1791 total · refactor : aucun.
- **Tranche A7 — contrastes, étiquettes et noms d'action** : GREEN 1791 passed / 1791 total · refactor : `tagSeverity` d'`AnalyticsEntityList` supprimé (les quatre appelants passaient la valeur par défaut `info` une fois `success` retiré).
- **Correctifs de la revue** : GREEN 1801 passed / 1801 total · refactor : aucun. Points 1 à 5, m1, m2, m4, m9 de la `## Review code`. `FileDropzone` : champ fichier hors tabulation et hors arbre accessible, nom du bouton tiré de son contenu, focus relayé à « Remplacer » après un choix et au bouton de la zone après un retrait (le bouton focalisé disparaissait avec l'état, le focus tombait sur `body`, constaté au navigateur). « Réessayer » de Projets recharge aussi les catégories. Pluriel des pages par session décidé dans le presenter (`pagesPerSessionLabel`) sur le nombre arrondi. Rattrapage du journal : `admin-column-base.ts` (`isLabelHidden`, en-tête de la colonne de dépliage en `sr-only`) a été modifié en A5 sans y figurer.
- **Tranche B1 — coque : navigation groupée, thème, « Voir le site », tiroir** : GREEN 1902 passed / 1902 total · refactor : espacement des groupes passé de `[class.pt-3.5]` (classe à point non appliquée, vu au navigateur) à `[class]` ; couleur du compte des non-lus décidée sur la clé `messages` au lieu du suffixe ; commentaire du flux partagé d'articles réduit à une ligne. Hors liste du plan : `App` masque Header et Footer publics dès le premier rendu (adresse initiale lue par `Location.path()`, +4 tests), `Drawer` retient Maj+Tab quand le focus est sur le panneau lui-même (le focus sortait du tiroir à l'ouverture, constaté au navigateur, +1 test), lien « Audience » du tableau de bord pointé sur `/admin/audience`.
- **Tranche B2 — un en-tête de page commun** : GREEN 1902 passed / 1902 total · refactor : le focus du titre après suppression passe par `AdminPageHeader.focusTitle()` (4 pages, plus de requête `#pageTitle`) ; « 1er » pour le premier jour du mois dans les dates des sur-titres (aucun test ne fige « 1 »).
- **Tranche B3 — vue d'ensemble : en-tête, cartouche « En ligne », actions rapides** : GREEN 2005 passed / 2005 total · refactor : `withFirstOfMonth` sorti d'`admin-page-copy.ts` dans `with-first-of-month.ts` (3 consommateurs : sur-titres, méta des articles, légende de la courbe).
- **Tranche B4 — vue d'ensemble : relevé « Audience »** : GREEN 2005 passed / 2005 total · refactor : `THEME_FALLBACK` et `DEFAULT_PALETTE` d'Audience remplacés par `readThemeColor` (repli couleur système, partagé avec la vue d'ensemble) ; garde `isPlatformBrowser` retirée (l'admin n'est rendu que côté client, `readThemeColor` tolère un document sans fenêtre).
- **Tranche B5 — vue d'ensemble : contacts, contenu en ligne, phrase de synthèse** : GREEN 2005 passed / 2005 total · refactor : titre de section (`h2` + filet + lien) répété quatre fois sorti dans `components/admin-section-head.ts` (Audience, Contacts, Contenu en ligne, Actions rapides). Hors contrat : les composants de section prennent `null` (« indisponible ») sur leurs entrées principales et projettent l'état (squelette ou `LoadError`) fourni par la page, ce qui garde le `h2` de la section dans les quatre états.
- **Correctifs de la revue de la PR b** : GREEN 2021 passed / 2021 total · refactor : accord singulier/pluriel (4 sites) et mise en capitale (2 sites) remplacés par `pluralize.ts` et `capitalize.ts` ; courbe « Visiteurs » seule tirée de `buildVisitorsOnlyChartData` (jeu de données partagé avec `buildVisitorsChartData`) au lieu d'un filtre sur le libellé ; lignes vides retirées des imports. Points 1 et 2, m1, m2, m3, m5, m6, m7, m8 de la revue ; m4 et la taille d'`admin-overview.ts` tolérés. Hors liste : le chiffre des non-lus suit la même règle de chargement que le CV (`unreadLoading`, même défaut, même composant).

## Verify

Tranches A1 à A3, build de production servi en local, Chromium (Playwright), axe-core 4.14.

**Steps reproductibles.**

1. `pnpm run build --configuration production`, puis `git checkout public/rss.xml public/sitemap.xml`.
2. `dist/angular-portfolio-app/browser` servi sur `http://localhost:4310`, `/admin/**` réécrit vers `index.csr.html`.
3. Script `scratchpad/v/a13.mjs` : `localStorage['auth:session'] = '1'` ; `navigator.sendBeacon` neutralisé ;
   toute requête non-GET **annulée** (`route.abort()`) et journalisée ; GET de l'API servis par fixtures
   (`/auth/me`, messages, non-lus, CV, statistiques), listes de projets et d'articles copiées une fois
   en GET public ; tout autre origine annulée. Registre Console posé à la main sous `/admin` (A4 non
   livrée).
4. Cas joués, en clair et en sombre : corbeille → dialogue → Annuler, Échap, Confirmer (Projets) ;
   ouverture + Échap (Articles, Messages, CV) ; `/admin/analytics` ; `/projects` en 500 puis
   « Réessayer » ; `/admin` avec non-lus et téléchargements de CV en 500.

**Résultats.**

| Cas | Observé |
|---|---|
| Ouverture | `dialog.open`, `:modal`, focus sur « Annuler », titre « Supprimer le projet DashFlow ? » (U+202F) |
| Annuler, Échap | dialogue fermé, 0 `DELETE`, focus rendu à la corbeille |
| Confirmer | 1 `DELETE /projects/<id>` annulé par le harnais, dialogue fermé, focus sur `h1[admin-page-title]` ; la suppression annulée restaure la ligne (optimiste + réconciliation) |
| Bouton danger | clair : texte `oklch(1 0 0)` sur `oklch(0.505 0.213 27.5)` ; sombre : texte `oklch(0.145 …)` (fond) sur `oklch(0.715 0.18 22)` |
| Audience | `select.value = 30d`, option affichée « 30 derniers jours » |
| Erreur | `role="alert"`, message, aucun « Aucun projet » ; « Réessayer » → nouveau `GET` → liste |
| Tableau de bord | compteurs « — indisponible » (×2), pastille de non-lus absente |
| axe, dialogue ouvert | **0 violation** sur les 4 dialogues, deux registres |

**axe sur les pages** : aucune violation sur les éléments ajoutés (dialogue, `LoadError`, états,
compteurs). Restent des violations antérieures, sur des éléments non touchés et déjà inventoriées par la
`## Description`, traitées par des tranches suivantes : `color-contrast` des pastilles `app-tag`
« Featured » / « published » / point « visiteur actif » en clair (constat 11, A7) ;
`landmark-no-duplicate-main`, `landmark-main-is-top-level`, `landmark-unique` (`main` imbriqué, D3,
B1) ; `aria-allowed-attr` sur `th[role=button]` (constat 5, A5) ; `empty-table-header` (colonne
d'actions des articles, colonne de dépliage des messages, A5/C2) ; `label` et
`label-content-name-mismatch` du champ fichier de `app-file-dropzone` (CV, hors spec).

**Console** : propre de toute erreur applicative. Restent des artefacts du harnais : `404
/api/config` (route du serveur SSR, absente du service statique), les `500` simulés, et les
`net::ERR_FAILED` des requêtes annulées (le `DELETE`, les images `/api/storage` après la relance).
Pendant l'erreur, `errorToastInterceptor` affiche **deux** toasts (la requête initiale et sa relance
`retry(1)`), en plus de l'alerte : double signal assumé par le plan, doublé par la relance.

**Captures** (scratchpad) : `a13-dialog-projet-{light,dark}.jpg`, `a13-apres-confirmation-{light,dark}.jpg`,
`a13-dialog-article-light.jpg`, `a13-dialog-message-light.jpg`, `a13-dialog-cv-{light,dark}.jpg`,
`a13-audience-30j-{light,dark}.jpg`, `a13-erreur-projets-{light,dark}.jpg`,
`a13-dashboard-indisponible-{light,dark}.jpg`, rapport `a13-report.json`.

**Verdict : PASS.**

### Tranches A3bis à A7

Build de production servi en local, Chromium (Playwright), axe-core 4.14, **CSP des pages appliquée**
(sans `bypassCSP`, contrairement à A1 à A3) pour prouver que le script de pré-peinture est autorisé
par son hachage.

**Steps reproductibles.**

1. `pnpm run build --configuration production` (postbuild : « CSP hardened on 21 page(s) »), puis
   `git checkout public/rss.xml public/sitemap.xml`. Le hachage du script de thème est présent dans
   le `script-src` de `index.csr.html`, `index.html` et `about/index.html`, sans `'unsafe-inline'`,
   et la `<meta>` CSP précède le script.
2. `docker build -t ng-portfolio-app:ci .` puis le script de l'étape « Smoke test the image » de
   `ci.yml` : sortie 0.
3. `dist/angular-portfolio-app/browser` servi sur `http://localhost:4310`, `/admin/**` réécrit vers
   `index.csr.html`. Script `scratchpad/v/a47.mjs` : session admin simulée
   (`localStorage['auth:session'] = '1'`), préférence de thème posée une seule fois par contexte,
   GET de l'API servis par fixtures (listes de projets et d'articles copiées une fois en GET public),
   **toute requête non-GET annulée** et journalisée, toute autre origine annulée. Sonde de thème :
   classe `app-dark` relevée à l'insertion de `<body>` (avant tout script module) et à
   `DOMContentLoaded`.
4. Cas joués : pré-peinture sur `/admin` et `/` (stocké sombre, stocké clair, absent sous système
   sombre, absent sous système clair) ; bascule dans la coque, rechargement, puis site public et
   retour ; messages au clavier (Tab jusqu'au premier `message-expand`, Entrée ; tri par Entrée puis
   Espace sur `sort-name`) ; libellés et axe sur les 8 pages admin (vue d'ensemble, projets avec et
   sans édition ouverte, articles, CV, messages, audience, paramètres, sécurité), en clair et en
   sombre ; Audience avec `/analytics/stats/metrics` en 500 ; `/`, `/projects/`, `/blog/` en clair
   et en sombre.

**Résultats.**

| Cas | Observé |
|---|---|
| Pré-peinture `/admin` et `/` | `app-dark` présent à `<body>` et à `DOMContentLoaded` pour « stocké sombre » et « absent, système sombre », absent pour les deux autres ; `color-scheme` calculé `dark` / `light` en accord ; 0 violation CSP |
| Capture à `DOMContentLoaded` (stocké sombre) | fond Console, aucun flash d'Ivoire (`/admin` et `/`) |
| Bascule coque | « Passer en mode clair » → clic → classe retirée, `light` stocké, libellé « Passer en mode sombre » ; rechargement : reste clair, rien de réécrit |
| Partage avec le site | `/` ouvert ensuite en clair ; bascule du `Header` → `dark` stocké ; retour sur `/admin` en sombre |
| Site public | `/`, `/projects/`, `/blog/` : classe et `color-scheme` conformes à la préférence, aucune erreur ni violation CSP |
| Messages au clavier | arrêts de tabulation : filtres, « Tout marquer comme lu », `sort-name`, `sort-subject`, `sort-createdAt`, puis « Afficher le message de Claire Martin » ; Entrée → `aria-expanded="true"`, nom « Masquer le message de Claire Martin », focus conservé, corps `message-body-1` affiché |
| Tri annoncé | `aria-sort` absent des colonnes non triées ; Entrée → `ascending`, Espace → `descending` sur Expéditeur, date sans `aria-sort` ; ordre des lignes inversé |
| Noms d'action | « Marquer comme lu : Claire Martin », « Supprimer le message de X » ; « Modifier : X » (articles, projets), « Fermer l'édition : DashFlow » + `aria-expanded="true"` + panneau existant |
| Libellés | titres « Vue d'ensemble \| Admin », « Articles \| Admin », « Audience \| Admin » ; navigation « Vue d'ensemble, Projets, Articles, CV, Messages, Audience, Paramètres », `aria-current="page"` sur la seule page courante, pastille « 1 non lu » ; KPI « 88,1 % », « 1 min 05 s », « 1,3 page par session » ; « Exporter en CSV » ; statut « Publié » en `APP-STAMP`, date « 9 sept. 2026 » ; CV « Mis en ligne le », « Voir le CV (nouvel onglet) » avec `rel="noopener noreferrer"` |
| Champs | bord `form-input` = `foreground` 50 % (clair) / 38 % (sombre), texte de substitution = `muted`, case à cocher `accent-color` = `primary-bg` |
| Audience, `metrics` en 500 | une seule `load-error`, aucune exception |
| Écritures | 0 requête non-GET émise sur tout le parcours |

**axe (WCAG 2.2 AA + best-practice), deux registres.** Plus aucune violation `color-contrast`
(pastilles remplacées par des tampons), `aria-allowed-attr` (`th[role=button]` retiré) ni
`empty-table-header` (en-têtes « Actions » et « Détail » en `sr-only`). Restent :

- sur toutes les pages : `landmark-main-is-top-level`, `landmark-no-duplicate-main`,
  `landmark-unique` (`main` imbriqué de la coque) → **renvoyé à la PR b** (D3, B1) ;
- CV et édition de projet (galerie) : `label` et `label-content-name-mismatch` du champ fichier de
  `app-file-dropzone` → **hors spec**, non renvoyé explicitement à b ou c (composant partagé non
  listé) : écart signalé ;
- `/admin/settings/security` : `page-has-heading-one` (deux registres) et `color-contrast` du statut
  « activée » de la double authentification (`text-status-success` sur `status-success/10`, clair)
  → **hors spec**, écart signalé (page non couverte par le plan).

**Console** : aucune erreur applicative. Restent des artefacts du harnais : `404 /api/config` (route
du serveur SSR, absente du service statique), les `500` simulés, et une violation CSP « inline
script » par page auditée, qui est l'injection d'axe-core par le harnais (absente des passages sans
axe).

**Captures** (scratchpad) : `a47-admin-domcontentloaded-sombre.jpg`,
`a47-site-domcontentloaded-sombre.jpg`, `a47-admin-overview-{sombre,clair}.jpg`,
`a47-site-apres-bascule.jpg`, `a47-messages-ouvert-clavier-clair.jpg`,
`a47-messages-tri-sombre.jpg`, `a47-<page>-{clair,sombre}.jpg` pour vue-ensemble, projets,
projet-edition, articles, cv, messages, audience, parametres, securite,
`a47-audience-erreur-clair.jpg`, rapport `a47-report.json`.

**Verdict : PASS** (exceptions listées ci-dessus).

### Correctifs de la revue

Build de production servi en local (port 4330), Chromium (Playwright), axe-core 4.14 (WCAG 2.2 AA
+ best-practice), CSP de la page appliquée.

**Steps reproductibles.**

1. `pnpm run build --configuration production` (exit 0, « Prerendered 20 static routes », « CSP
   hardened on 21 page(s) », 0 avertissement), puis `git checkout public/rss.xml public/sitemap.xml`.
2. Script `scratchpad/v/rv2.mjs` : même harnais que A3bis à A7 (session simulée
   `localStorage['auth:session'] = '1'`, GET de l'API servis par fixtures, **toute requête non-GET
   annulée** et journalisée, toute autre origine annulée).
3. `/admin/cv` et `/admin/projects` avec l'édition du premier projet ouverte (dropzone d'image et
   formulaire d'ajout à la galerie), en clair et en sombre : état des dropzones, axe.
4. `/admin/cv`, clair, clavier seul : focus sur le `h1`, Tab jusqu'au bouton de la zone, Entrée →
   sélecteur de fichier natif (`filechooser`), choix d'un PDF ; Tab, Entrée sur « Retirer le
   fichier » ; Entrée → second sélecteur.

**Résultats.**

| Cas | Observé |
|---|---|
| Champ fichier | `tabindex="-1"`, `aria-hidden="true"` sur les 3 dropzones rendues (CV, image du projet, galerie) |
| Nom du bouton | sans `aria-label` ; « Fichier PDF Glisse un fichier ici… », « Image de la capture Glisse un fichier ici… » |
| Arrêts de tabulation (CV) | « Voir le CV (nouvel onglet) », « Supprimer le CV », bouton de la zone ; le champ fichier n'est jamais atteint |
| Choix au clavier | Entrée → `filechooser` ; fichier `cv-test.pdf` affiché (« 15 o », « Remplacer ») ; focus sur `file-dropzone-replace` |
| Retrait au clavier | Tab → `file-dropzone-clear`, Entrée → focus sur `file-dropzone-trigger` ; Entrée → second `filechooser` |
| axe, 4 passages (CV, galerie × clair, sombre) | `landmark-main-is-top-level`, `landmark-no-duplicate-main`, `landmark-unique` seulement (`main` imbriqué, PR b) ; plus de `label` ni de `label-content-name-mismatch` |
| Écritures | 0 requête non-GET émise |

**Console** : aucune erreur applicative. Seul le `404 http://localhost:4330/api/config` (route du
serveur SSR, absente du service statique).

**Captures** (scratchpad `rv2/`) : `rv2-cv-{clair,sombre}.jpg`, `rv2-projet-galerie-{clair,sombre}.jpg`,
`rv2-cv-fichier-choisi-clavier.jpg`, rapport `rv2-report.json`.

**Verdict : PASS.**

### Tranches B1 et B2

Build de production servi en local (port 4340), Chromium (Playwright), axe-core 4.14 (WCAG 2.2 AA
+ best-practice), CSP de la page appliquée.

**Steps reproductibles.**

1. `pnpm run build --configuration production` (exit 0, « Prerendered 20 static routes », « CSP
   hardened on 21 page(s) »), puis `git checkout public/rss.xml public/sitemap.xml`.
2. Script `scratchpad/v/b12.mjs` (harnais de `rv2.mjs`) : session simulée
   (`localStorage['auth:session'] = '1'`), GET de l'API servis par fixtures (listes de projets et
   d'articles copiées une fois en GET public), **toute requête non-GET annulée** et journalisée,
   toute autre origine annulée ; sonde `MutationObserver` posée avant tout script, qui note si
   `app-header` ou `app-footer` est monté une seule fois.
3. Cas joués : les 7 pages de la coque à 1 440 px en clair et en sombre ; `/admin/messages` à
   375 px en clair et en sombre (Entrée sur le bouton menu, 16 × Tab, 16 × Maj+Tab, Échap, puis
   lien « Projets » du tiroir) ; Maj+Tab juste après l'ouverture (`b12-shift.mjs`) ; `/admin` à
   1 008, 1 023 et 1 024 px ; Tab depuis le haut de `/admin/projects` ; `/admin/analytics`,
   `/admin/stats`, `/admin/analytics/visits` ; `/admin/projects` capturé dès `commit` ; `/`,
   `/projects/`, `/blog/` à 1 440 et 375 px.

**Résultats.**

| Cas | Observé |
|---|---|
| Landmarks | 1 `main`, 0 `aside`, 1 `h1` sur chaque page (le tableau de bord garde son `h1` jusqu'à B3) |
| axe | **0 violation** sur les 7 pages × 2 registres, à 375 px tiroir fermé et ouvert ; plus aucune règle `landmark-*` |
| `aria-current` | sur le seul lien de la page (`nav-link-settings` pour Paramètres), soulignement intérieur 2 px `oklch(0.433 0.21 278)` en clair |
| Comptes | « 6 », « 2 », « 1 non lu » |
| Sur-titres | « 6 réalisations · 2 mises en avant », « 2 articles · 2 publiés · 0 brouillon », « 1 non lu · 2 au total », « PDF · 178 Ko · mis en ligne le 20 sept. 2026 », « 7 sept. au 6 oct. 2026 · 30 derniers jours », e-mail du compte |
| Tiroir | `aria-expanded` `false` → `true`, `aria-controls="admin-drawer"`, focus sur le panneau ; Tab et Maj+Tab restent dedans (16 arrêts chacun, boucle bouton Fermer → liens → pied) ; Maj+Tab à l'ouverture → « Se déconnecter » (sortait vers la page avant le correctif du `Drawer`) ; Échap → tiroir fermé, `aria-expanded="false"`, focus sur `admin-menu-button` ; lien « Projets » → `/admin/projects`, tiroir fermé, barre « Projets » |
| Bascule | 1 008 et 1 023 px : barre mobile, pas de barre latérale ; 1 024 px : barre latérale, pas de barre mobile ; aucun défilement horizontal |
| Clavier, barre latérale | liens dans l'ordre de la maquette, puis « Voir le site », thème, « Se déconnecter », puis l'en-tête de page |
| Redirections | `/admin/analytics`, `/admin/stats`, `/admin/analytics/visits` → `/admin/audience`, onglet « Audience \| Admin », `nav-link-audience` courant |
| Premier rendu | `app-header` et `app-footer` jamais montés sous `/admin/projects`, dès `commit` comme après `networkidle` |
| Site public | `/`, `/projects/`, `/blog/` : Header présent, 1 `main`, 1 `h1`, 0 violation CSP, aucune erreur applicative |
| Écritures | 0 requête non-GET émise |

**Console** : aucune erreur applicative. Seul le `404 /api/config` (route du serveur SSR, absente du
service statique).

**Écarts avec la maquette** : icônes Font Awesome pleines du sprite du site au lieu des pictos au
trait (aucune icône nouvelle) ; tiroir rendu par le `Drawer` existant (titre « Administration » et
bouton Fermer, voile noir flouté) au lieu de l'en-tête au monogramme ; bascule à 1 024 px (D10) ;
listes, filtres et cartouches des pages inchangés jusqu'à C1 et C2 ; vue d'ensemble inchangée
jusqu'à B3.

**Captures** (scratchpad) : `b12-<page>-1440-{clair,sombre}.jpg` pour vue-ensemble, projets,
articles, cv, messages, audience, parametres ; `b12-messages-375-{clair,sombre}.jpg`,
`b12-tiroir-375-{clair,sombre}.jpg`, `b12-vue-ensemble-{1008,1023,1024}-clair.jpg`,
`b12-public-{accueil,realisations,blog}-{1440,375}.jpg`, rapport `b12-report.json`.

**Verdict : PASS.**

### Tranches B3 à B5

Build de production servi en local (port 4350), Chromium (Playwright), axe-core 4.14 (WCAG 2.2 AA
+ best-practice), CSP de la page appliquée.

**Steps reproductibles.**

1. `pnpm run build --configuration production` (exit 0, « Prerendered 20 static routes », « CSP
   hardened on 21 page(s) », aucun avertissement), puis `git checkout public/rss.xml public/sitemap.xml`.
2. Script `scratchpad/v/b35.mjs` (harnais de `b12.mjs`) : session simulée
   (`localStorage['auth:session'] = '1'`), GET de l'API servis par fixtures (listes de projets et
   d'articles copiées une fois en GET public, référents `''` 20 et `google.com` 18), **toute requête
   non-GET annulée** et journalisée, toute autre origine annulée.
3. Cas joués : `/admin` à 1 440 et 375 px en clair et en sombre ; couleur dominante des pixels opaques
   du `<canvas>` comparée à `--theme-primary-text` résolu ; bascule de thème dans la coque, courbe
   relue ; 500 sur `/analytics/stats/overview`, `/analytics/stats/chart`, `/contact/messages`,
   `/projects`, puis « Réessayer » de la section, panne retirée ; projets, articles et messages vides
   en clair et en sombre ; `/admin/audience` en clair et en sombre.

**Résultats.**

| Cas | Observé |
|---|---|
| En-tête | « Mercredi 7 octobre 2026 · 30 derniers jours », 1 `h1` « Vue d'ensemble », synthèse « 42 visiteurs en 30 jours, dont 18 venus de google.com. 1 message en attente, 2 CV téléchargés. Six réalisations et deux articles sont en ligne. » |
| Cartouche | « En production 2 projets », « Démos 2 projets », « Scripts 2 projets », « Articles 2 publiés », colonne de droite à 1 440 px, sous l'introduction à 375 px |
| Audience | 42, « 42 sessions », relevé « 56 / 1,3 page par session », « 88,1 % / 37 sessions sur 42 », « 1 min 05 s / par page » ; `figcaption` = résumé des pics |
| Courbe | clair : pixel dominant `64,48,191` = `--theme-primary-text` ; sombre : `148,160,255` = jeton ; bascule en direct : `64,48,191` → `148,160,255` |
| Contacts | non-lus 1, CV 2, deux derniers messages |
| Contenu | 5 rangées : 2 articles (« 9 sept. 2026 · 13 min », « 1er sept. 2026 · 6 min », « Publié »), puis 3 projets dans l'ordre public (tampon de nature) |
| Erreurs partielles | statistiques : une `LoadError` dans Audience, CV « — indisponible », synthèse sans audience ni CV ; courbe seule : chiffres gardés + une `LoadError` ; messages : une `LoadError` dans Contacts, pas d'état vide ; projets : une `LoadError` dans Contenu, 2 articles gardés, cartouche « indisponible » sur les trois natures. « Réessayer » : une seule nouvelle requête vers la source tombée, section rétablie |
| États vides | « Boîte vide » + « Ouvrir la page Contact », « Rien en ligne », cartouche à 0, synthèse « … Rien n'est en ligne. » |
| Audience (page) | courbe dessinée (`1026x288`), aucune erreur, deux registres |
| axe | **0 violation** sur tous les passages (vue d'ensemble × 4, erreurs × 4, vides × 2, Audience × 2) |
| Mise en page | aucun défilement horizontal à 375 px |
| Écritures | 0 requête non-GET émise |

**Console** : aucune erreur applicative. Seul le `404 /api/config` (route du serveur SSR, absente du
service statique). En erreur, `errorToastInterceptor` affiche aussi son toast (`role="alert"` hors
section, double signal assumé par le plan).

**Écarts avec la maquette** : courbe des visiteurs seule, sans axes (comme la maquette ; « Pages
vues » reste sur la page Audience) ; « Voir l'audience » au lieu d'« Exporter l'audience » (choix du
RED) ; méta des articles en durée de lecture au lieu des j'aime (choix du RED) ; synthèse en texte
courant, sans le gras de « 42 visiteurs » ; compte « 6 projets · 2 articles » du titre « Contenu en
ligne » et repères « CV en ligne » / « Sécurité » sous les actions rapides non repris (hors contrat) ;
lien « Ouvrir la page Contact » vers `/#contact` ; icônes du sprite du site.

**Captures** (scratchpad) : `b35-vue-ensemble-{1440,375}-{clair,sombre}.jpg`,
`b35-bascule-sombre.jpg`, `b35-erreur-{statistiques,courbe,messages,projets}.jpg`,
`b35-vides-{clair,sombre}.jpg`, `b35-audience-{clair,sombre}.jpg`, rapport `b35-report.json`.

**Verdict : PASS.**

### Correctifs de la revue de la PR b

Build de production servi en local (port 4370), Chromium (Playwright), axe-core 4.14 (WCAG 2.2 AA
+ best-practice), CSP de la page appliquée.

**Steps reproductibles.**

1. `pnpm run build --configuration production` (exit 0, « Prerendered 20 static routes », « CSP
   hardened on 21 page(s) », 0 avertissement), puis `git checkout public/rss.xml public/sitemap.xml`.
2. Script `scratchpad/v/rvb.mjs` (harnais de `b35.mjs`) : session simulée
   (`localStorage['auth:session'] = '1'`), GET de l'API servis par fixtures, **toute requête
   non-GET annulée** et journalisée, toute autre origine annulée. Horloge réelle : 7 oct. 2026.
3. Cas joués : `/admin/audience` en clair et en sombre ; `/admin` avec 1 non-lu et 1 CV à 1 440 et
   375 px, deux registres ; `/admin` avec la réponse des statistiques retardée de 4 s ; `/admin`
   sans message, deux registres, puis clic sur « Voir le site ».

**Résultats.**

| Cas | Observé |
|---|---|
| Sur-titre d'Audience | « 7 sept. au 7 oct. 2026 · 30 derniers jours » ; requêtes `startDate=2026-09-07&endDate=2026-10-07` (mêmes bornes) |
| Accords | « Non lus 1 message », « CV · 30 j 1 téléchargement » (nom accessible du lien « Non lus 1 message ») ; à 0 non-lu : « message » ; 2 CV : « téléchargements » |
| Chargement | statistiques en attente : squelette `overview-cv-loading` dans le chiffre CV, texte lu « chargement », jamais « indisponible » ; puis « 2 » |
| Boîte vide | « Aucun message pour l'instant. Le formulaire de contact de l'accueil est en ligne ; un nouveau message apparaîtra ici avec son sujet. » (U+202F avant « ; ») ; lien « Voir le site (nouvel onglet) », `href="/"`, `_blank`, `noopener` ; le clic ouvre `http://localhost:4370/` dans un nouvel onglet |
| axe | **0 violation** sur les 8 passages (Audience × 2, vue d'ensemble × 4, vide × 2) |
| Mise en page | aucun défilement horizontal à 375 px |
| Écritures | 0 requête non-GET émise |

**Console** : aucune erreur applicative. Seul le `404 /api/config` (route du serveur SSR, absente du
service statique). La violation CSP « inline script » relevée vient de l'injection d'axe par le
harnais (`addScriptTag`, 0 avant, 1 après l'injection, mesuré).

**Captures** (scratchpad `rvb/`) : `rvb-audience-{light,dark}.jpg`,
`rvb-overview-singulier-{light,dark}-{1440,375}.jpg`, `rvb-overview-chargement.jpg`,
`rvb-vide-{light,dark}.jpg`, rapport `rvb-report.json`.

**Verdict : PASS.**

## Review code

PR a (`fix/admin-correctifs`, base `master` `30ef475`, diff non commité + fichiers non suivis), revue du 2026-10-07.

**Verdict** : REJECTED
**Gates CI locaux** : install `pnpm install --frozen-lockfile` exit 0 / tests `pnpm test` exit 0 (138 fichiers, 1791 passed / 1791) / lint `pnpm lint` exit 0 (« All files pass linting ») / build `pnpm run build --configuration production` exit 0 (20 routes prérendues, « CSP hardened on 21 page(s) ») / Docker `docker build` + script « Smoke test the image » de `ci.yml` exit 0. `public/rss.xml` et `public/sitemap.xml` restaurés.
**Checks mécaniques** : checker non vendoré : auto-checks joués à la main. Archéologie (motif du profil, lignes ajoutées) : 0 hit. Insécables littérales dans le TS : 0 (seul `index.html`, préexistant). `fakeAsync`/`waitForAsync` : 0. `export default` : 0. `innerHTML`/`console` : 0. `value() ??` sur ressource dans l'admin : 0. `effect` : 2 (`ThemeStore` classe sur `<html>`, `BlogComments` postMessage), aucun ne réécrit un signal. Exports sans consommateur hors fichier : 3 (point 4).
**Warnings de gate** : aucun (0 `stderr`, `NG0`, `▲` ou `WARNING` dans les sorties test, lint et build).
**Rendu compilé** : ✅ (sélecteurs élément uniquement ; `text-on-status-error`, `border-field`, `accent-primary-bg`, `placeholder:text-muted`, `color-scheme` et les deux tokens présents dans `styles-*.css`)
**Preuve de verify runtime** : ✅ (preuves A1 à A3 et A3bis à A7 de `## Verify` complètes, rejouées par la revue avec un harnais indépendant, cf. ci-dessous)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ❌ (points 3 à 5)
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ❌ (points 1 et 2, mineurs m9 et m10)

Verify de la revue (build servi en local, port 4320, Chromium, CSP de la page appliquée, toute requête non-GET annulée, axe-core 4.14) :

- CSP : hachage du script de thème présent dans le `script-src` des 21 pages (20 prérendues + `index.csr.html`), une seule occurrence par page, `<meta>` CSP avant le script, aucun `'unsafe-inline'`. L'en-tête nginx (`Dockerfile`) ne porte que `frame-ancestors 'none'` : aucun conflit. 0 événement `securitypolicyviolation` sur `/` et `/admin` (quatre préférences chacun).
- Pré-peinture : `app-dark` présent à `<body>` et à `DOMContentLoaded` pour « stocké sombre » et « absent, système sombre », absent sinon ; `color-scheme` cohérent.
- Site public : `/`, `/projects/`, `/blog/`, `/blog/<slug>/` en clair et en sombre conformes ; bascule du `Header` écrit la préférence ; `data-theme` du script Giscus = registre courant. HTML prérendu comparé à un build de `master` : titres, `meta`, canonical, JSON-LD, `h1`-`h3` et texte identiques sur les 21 pages ; seules différences : le script de thème, la CSP, le CSS critique (nouveaux tokens) et la numérotation des templates d'hydratation.
- Admin : dialogues (projet : Échap et Annuler → 0 `DELETE`, focus rendu à la corbeille ; Confirmer → 1 `DELETE` annulé, focus sur `h1`) ; article, message, CV : 1 `DELETE` annulé chacun ; axe 0 violation dialogue ouvert. Quatre états × 4 pages : un seul testid présent, `role="status"` en chargement, « Réessayer » relance la requête. Audience : `30d` / « 30 derniers jours », « 88,1 % », « 1 min 05 s », « 1,3 page par session ». Messages au clavier : Tab jusqu'à « Afficher le message de Claire Martin », Entrée → `aria-expanded="true"` et corps affiché ; tri Entrée puis Espace → `ascending` puis `descending`. Aucune requête non-GET hors suppressions volontairement annulées. Console : seul le `404 /api/config` du service statique.
- axe, deux registres : restent `landmark-*` (main imbriqué, PR b), `label` + `label-content-name-mismatch` (`app-file-dropzone`, CV et galerie), `page-has-heading-one` + `color-contrast` (`/admin/settings/security`).

**Altitude composant** (advisory, non bloquant) :
- ⚠️ `admin-messages.ts` 242 → 330 LOC, `admin-projects.ts` 232 → 310, `admin-blog.ts` 183 → 254, `admin-cv.ts` 202 → 259 (seuil 250 franchi), `admin-analytics.ts` 394 → 429. Découpe prévue par le plan (builders `toXView`, `AdminPageHeader`, facade `AudienceReport`) en PR b et c.

**Duplication / dérivation** (advisory) :
- ⚠️ bloc de chargement (`role="status"` + `sr-only` + `app-skeleton`) ×4 (`admin-projects.ts`, `admin-blog.ts`, `admin-messages.ts`, `admin-cv.ts`) et `confirmDeletion()` ×4 : candidat composant `shared/ui` à côté de `LoadError`, à faire en PR b avec l'en-tête commun.

**Risque résiduel** (advisory) :
- réversibilité : profil muet · monitoring : Sentry (profil)
- `index.html` change tout le HTML prérendu : vérification en prod après déploiement (§ 8.4).
- non couvert par les gates : le `Header` public reste rendu sous `/admin` jusqu'au premier `NavigationEnd` (préexistant).

**Points à corriger** (bloquants) :
1. `src/app/shared/ui/file-dropzone.ts:21-27` et `:96-98` — axe `label` (champ fichier `sr-only` focusable sans nom) et `label-content-name-mismatch` (`aria-label` du bouton différent du texte visible), sur CV et galerie de projet, deux pages que cette PR rend accessibles. Aucune PR ne le prend en charge. Corriger ici : sortir l'`input` de l'ordre de tabulation et de l'arbre accessible (`tabindex="-1"`, `aria-hidden="true"`, le bouton pilote le choix) et faire commencer le nom du bouton par son texte visible ; ajouter le cas au plan de test.
2. `src/app/core/interceptors/skip-error-toast.ts:3-7` — la JSDoc dit le jeton « réservé au fire-and-forget (tracking analytics) » ; `http-contact.gateway.ts:67` l'emploie désormais pour la première tentative des non-lus. Le diff rend ce contrat faux. Réécrire en une ligne de WHY intemporel (« l'échec de cette requête n'est pas signalé par un toast »).
3. `src/app/features/admin/application/components/admin-analytics-cv-panel.ts:11-12` — reformatage Prettier seul, fichier hors plan : revenir à `master`.
4. Exports sans consommateur hors du fichier : `LoadState` (`shared/ui/load-state.ts:3`), `ConfirmDialogView` (`shared/ui/testing/confirm-dialog-page.ts:4`), `escapeConfirmDialog` (`:32`). Retirer `export`.
5. `src/app/features/admin/application/admin-messages.ts:152` — `[id]="bodyId(msg)"` : appel de fonction dans le template alors qu'une expression suffit (`[id]="'message-body-' + msg.id"`).

**Mineurs** (à traiter ici si peu coûteux, sinon à noter) :
- m1. `admin-projects.ts:101` — « Réessayer » ne recharge que `projectsResource` ; `categoriesResource`, dérivé du même flux, reste en erreur et le filtre n'offre plus que « Tous ». Recharger les deux, ou dériver les catégories de `projects()` par `computed`.
- m2. `admin-analytics.ts:269-272` — le pluriel relit la chaîne formatée (`Number(perSession.replace(',', '.'))`) : décider sur le ratio brut.
- m3. `admin-project-row.ts:80` — bascule d'édition en `button` brut qui recopie le style « outlined » de `Button` (`border-muted/30`…) ; envisager un `aria-expanded`/`aria-controls` sur `Button`.
- m4. `src/index.html:50` — le commentaire dit le script placé après la CSP « pour être haché » ; le post-build hache tous les scripts quelle que soit leur position : la raison réelle est d'être soumis à la CSP.
- m5. `admin-col-expand.ts`, `admin-col-actions.ts`, `admin-table.ts` — accesseurs appelés dans les templates (`toggle()(row)`, `controlsId()(row)`, `buttonLabel()(row, expanded)`, `deleteLabel()(row)`, `extra.label(row)`, `col.isLabelHidden()`) : motif préexistant d'`AdminTable`, toléré parce que le composant est supprimé en c2.
- m6. `admin-projects.ts:54-63` — `<select [value]>` dont les options viennent d'un `@for`, contraire à la règle que ce même lot ajoute à `CLAUDE.md` ; sans effet visible (valeur initiale = première option), supprimé en C2 comme prévu.
- m7. `shared/testing/press-test-id.ts` — six aides de test sous le nom d'une seule (« un concept par fichier ») ; `settleBounded` dépend d'une course avec `setTimeout(0)`.
- m8. `admin-blog.spec.ts:16` — `post()` local doublon de `makeBlogPost` (préexistant, informatif).
- m9. Cohérence de la spec : le plan de test A1 dit que l'en-tête d'`AdminTable` porte `admin-page-title` pour Messages, alors que le `h1` est désormais dans `admin-messages.ts` ; la tranche B2 liste encore la suppression de `AdminTable.title`, `newRoute`, `newLabel`, déjà faite ici ; `admin-column-base.ts` (`isLabelHidden`) est absent du § 6 et du journal.
- m10. ADR-0012 et ADR-0013 au statut « proposé » : passer à « accepté » au merge.

**Écarts signalés par l'implémentation** :
- Champ fichier de `app-file-dropzone` : **à corriger dans la PR a** (point 1).
- `/admin/settings/security` (pas de `h1`, contraste du statut « activée » en clair) : **reportable**, la page est hors périmètre de la spec. À inscrire nommément dans la tranche c2 (Paramètres), pas comme simple « écart signalé ».
- JSDoc de `SKIP_ERROR_TOAST` : **à corriger dans la PR a** (point 2).
- `main` imbriqué : **reportable en PR b** (D3, B1 le prévoient, test `AdminLayout` « aucun `main` ni `aside` » déjà planifié).
- `Header` public rendu sous `/admin` avant le premier `NavigationEnd` : **reportable en PR b** ; préexistant, sans effet de thème depuis ADR-0012.

**Suite donnée à la revue** (correctifs du 2026-10-07, cf. journal et `### Correctifs de la revue`
de `## Verify`) :

- Corrigés dans la PR a : points 1 à 5, m1, m2, m4, m9 (plan de test A1, tranche B2, § 6 et
  tranche A5 pour `admin-column-base.ts`, `/admin/settings/security` inscrit nommément dans la
  tranche C10 et dans le § 6 de la PR c2).
- Suivis, laissés tels quels :
  - m3 (bascule d'édition en `button` brut dans `admin-project-row.ts`) → **PR c1** (C2, la liste
    éditoriale des projets remplace la ligne) ;
  - m5 (accesseurs appelés dans les templates d'`AdminTable` et de ses colonnes) → **PR c2** (C8,
    suppression d'`admin-table.ts` et des `admin-col-*`) ;
  - m6 (`<select [value]>` du filtre de Projets) → **PR c1** (C2, filtre par nature) ;
  - m7 (`shared/testing/press-test-id.ts` : six aides sous un nom, `settleBounded`) → **PR b**,
    premier lot de tests à les réemployer ;
  - m8 (`post()` local d'`admin-blog.spec.ts`) → **PR c1** (C6, liste des articles).
- m10 : statut des ADR-0012 et ADR-0013 inchangé (« proposé »), passage à « accepté » au merge.

### PR b (`feat/admin-coque`), revue du 2026-10-07

Base `master` `86177a6`, diff non commité + fichiers non suivis, tranches B1 à B5.

**Verdict** : REJECTED
**Gates CI locaux** : install `pnpm install --frozen-lockfile` exit 0 / tests `pnpm test` exit 0 (151 fichiers, 2005 passed / 2005) / lint `pnpm lint` exit 0 (« All files pass linting ») / build `pnpm run build --configuration production` exit 0 (« Prerendered 20 static routes », « CSP hardened on 21 page(s) ») / Docker `docker build -t ng-portfolio-app:ci .` exit 0 + script « Smoke test the image » de `ci.yml` exit 0. `public/rss.xml` et `public/sitemap.xml` restaurés.
**Checks mécaniques** : checker non vendoré : auto-checks joués à la main sur les lignes ajoutées. Archéologie (motif du profil) : 0. Insécables littérales : 0 (échappements et `&nbsp;` seulement). `fakeAsync`/`waitForAsync` : 0. `export default` : 0. `console`/`innerHTML` : 0. `effect(` ajouté : 0. `value() ??` hors garde `hasValue()` : 0. Snapshot, `fireEvent`, `.only`/`.skip` : 0. Exports sans consommateur hors fichier : 2 (mineur m4). Restes de code mort (`admin-dashboard`, `AdminDashboard`, `THEME_FALLBACK`, `DEFAULT_PALETTE`, `FORMATTED_DATE`, `nav-unread-count`, `collapseToggle`, liens `/admin/analytics`) : 0.
**Warnings de gate** : aucun (0 `stderr`, `NG0`, `▲` ou `WARNING` dans les sorties test, lint et build).
**Rendu compilé** : ✅ (sélecteurs élément uniquement ; rendu contrôlé au navigateur, ci-dessous)
**Preuve de verify runtime** : ✅ (preuves B1-B2 et B3-B5 de `## Verify` complètes, rejouées par la revue avec un harnais indépendant, cf. ci-dessous)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ❌ (points 1 et 2)

Verify de la revue (build de la branche servi en local, port 4360, Chromium, CSP de la page appliquée, session simulée, GET de l'API servis par fixtures, **toute requête non-GET annulée** : 0 émise ; axe-core 4.14 WCAG 2.2 AA + best-practice) :

- Site public : HTML prérendu des 21 pages comparé à un build de `master` (worktree jetable) : titres, `meta`, canonical, JSON-LD, `h1`-`h6`, texte, présence d'`app-header` / `app-footer` et nombre de `main` **identiques** (0 différence). `/`, `/projects/`, `/blog/` à 375 px : menu `Drawer` ouvert au clavier, Tab et Maj+Tab bouclent dans le panneau, Maj+Tab depuis le panneau va désormais au dernier focusable (sortait avant), Échap ferme et rend le focus au bouton menu, défilement déverrouillé, bascule de thème du tiroir écrit `dark` ; axe 0 violation tiroir ouvert.
- Coque : 1 `main`, 0 `aside`, 1 `h1` sur les 7 pages, `app-header`/`app-footer` jamais montés sous `/admin` ; `aria-current="page"` sur le seul lien attendu (Paramètres pour `/admin/settings/security`) ; `/admin/analytics`, `/admin/stats`, `/admin/analytics/visits`, `/admin/analytics/projects` → `/admin/audience`, onglet « Audience | Admin » ; axe 0 violation sur les 7 pages (sombre), seule `page-has-heading-one` sur `/admin/settings/security` (renvoyé à C10). Tiroir à 375 px : `aria-expanded` `false` → `true`, `aria-controls="admin-drawer"`, focus sur le panneau, Maj+Tab → « Se déconnecter », Tab × 18 et Maj+Tab × 18 restent dans le dialogue, Échap → `aria-expanded="false"`, focus sur `admin-menu-button` ; lien « Projets » du tiroir → `/admin/projects`, tiroir fermé, barre « Projets ».
- Barre latérale (écart 5) : à 1 440 × 800, après 457 px de défilement, la colonne reste `top 0` / `bottom 800`. Le bord qui s'arrête sur une capture pleine page est un artefact de capture (`h-svh` vaut la hauteur de la fenêtre, pas du document) : **pas un défaut** en navigation réelle.
- Vue d'ensemble 1 440 et 375 px, deux registres : axe 0 violation, aucun défilement horizontal ; courbe : pixel dominant `64,48,191` (clair) et `148,160,255` (sombre) = `--theme-primary-text` résolu ; bascule de thème dans la coque : `64,48,191` → `148,160,255` en direct. Erreur par source (statistiques, courbe, référents, messages, non-lus, projets, articles) : une seule `LoadError` dans la section concernée, `h2` gardé, les autres sections intactes, synthèse privée de la seule phrase touchée ; chargement (statistiques, courbe, messages) : squelette `role="status"` dans la section ; vides, deux registres : « Boîte vide », « Rien en ligne », cartouche à 0, synthèse « … Rien n'est en ligne. », axe 0. Comparaison avec `specs/assets/015/01-vue-ensemble-1440-sombre.jpg` : grille, cartouche, relevé, contacts, contenu et actions conformes, aux écarts listés près.
- `/#contact` (écart 4) : l'élément `#contact` existe dans le HTML prérendu de l'accueil, mais l'ouverture directe de `/#contact` laisse la page en haut (`scrollY 0`, section à 4 968 px) : point 2.
- Console : seul le `404 /api/config` du service statique.

**Écarts signalés par l'implémentation** :
1. Courbe des visiteurs seule : **accepté** (maquette ; « Pages vues » reste sur Audience). Voir m3 pour la manière.
2. « Voir l'audience » au lieu d'« Exporter l'audience » : **accepté** (un « Exporter » qui ne télécharge rien reproduirait le défaut 10).
3. Non repris (gras de « 42 visiteurs », compte « 6 projets · 2 articles » de « Contenu en ligne », repères « CV en ligne » / « Sécurité ») : **accepté** pour cette PR ; les repères CV et Sécurité sont à inscrire en C10 s'ils sont voulus.
4. `/#contact` : **à corriger** (point 2).
5. Barre latérale `sticky h-svh` : **pas un défaut** (mesuré, ci-dessus).
6. Piège de focus du `Drawer` : **aucune régression** sur le menu public (mesuré sur trois pages) ; le changement corrige aussi la fuite par Maj+Tab du menu public.
7. `App` et `Location.path()` : **accepté** ; HTML prérendu identique à `master`, Header jamais monté sous `/admin`, `/administration` couvert par le test.
- Points de copie du RED : « Tout le temps », « Aucun CV en ligne », « 1er », « indisponible », nombres en lettres jusqu'à dix, « Rien n'est en ligne. », durée de lecture, « Visiteurs le … : n. », CV sur 30 jours : **acceptés**. La période qui s'arrête la veille : **refusée** (point 1).

**Altitude composant** (advisory, non bloquant) :
- ⚠️ `admin-overview.ts` — 265 LOC, 6 collaborateurs injectés (seuils 250 / 6) ; gabarit 100 lignes. Candidat : sortir la palette et les options de courbe (`_palette`, `chartData`, `chartOptions`, lignes 226-254) dans un builder pur à côté de `chart-palette.ts`, partagé avec Audience.
- ⚠️ `admin-blog.ts` 254 → 266 LOC (découpe prévue en C1).

**Duplication / dérivation** (advisory) :
- ⚠️ accord singulier/pluriel réécrit à 4 sites : `counted` (`admin-page-copy.ts:51`, `overview-view.ts:55`), `plural` (`overview-copy.ts:209`), `sessionsLabel` (`overview-audience.ts:195`) ; mise en capitale à 2 sites (`overview-copy.ts:207`, `admin-page-copy.ts:98`). Un seul helper suffit (m5).

**Risque résiduel** (advisory) :
- réversibilité : profil muet · monitoring : Sentry (profil)
- `/admin/analytics` reste une URL valide (redirection) : favoris et smoke test CI (`ci.yml:126`) inchangés.
- non couvert par les gates : un échec du flux partagé d'articles après invalidation fait tomber le compte de la coque jusqu'au prochain abonné (comportement du précédent `allProjects$`, assumé par le plan).

**Points à corriger** (bloquants) :
1. `src/app/features/admin/application/admin-page-copy.ts:86-94` — `audienceOverline` affiche une période qui s'arrête la veille (`now.getDate() - 1`), en dates locales, alors que `dateRangeToParams` (`analytics-presenter.ts:15-23`) demande `endDate` = aujourd'hui en UTC et que l'API inclut ce jour entier (`nest-portfolio-app/src/analytics/analytics-stats.service.ts:249-252`, `endOfDay(endDate)`). Le sur-titre d'Audience annonce « 7 sept. au 6 oct. » pour des données qui vont jusqu'au 7 oct. : c'est le défaut que A2 a corrigé (« la période affichée est celle des données »). Dériver le sur-titre des bornes réellement envoyées (`dateRangeToParams(range, now)`), pas d'un second calcul ; recaler `admin-page-copy.spec.ts` (cas `audienceOverline`) et le test de câblage d'`admin-analytics.spec.ts`.
2. `src/app/features/admin/application/components/overview-contacts.ts:76-82` — « Ouvrir la page Contact » mène à `/#contact` : l'ancre existe, mais l'ouverture directe de `/#contact` laisse la page en haut (mesuré : `scrollY 0`, section à 4 968 px), et `src/app/features/home/application/home.ts:95-96` pose que la section n'est **jamais** exposée en ancre dans l'URL. Le lien ment sur sa destination. Choisir avec l'utilisateur : soit un lien honnête vers l'accueil (« Ouvrir le site »), soit un vrai support du fragment à l'arrivée (et la règle de `home.ts` révisée) ; mettre à jour `overview-contacts.spec.ts` et la `## Description`/le plan B5.

**Mineurs** (à traiter ici si peu coûteux, sinon à noter) :
- m1. `overview-contacts.ts:44` et `:64` — « messages » et « téléchargements » figés sous le chiffre : « 1 messages », « 1 téléchargements » (nom accessible du lien « Non lus 1 messages »). Accorder sur la valeur.
- m2. `overview-contacts.ts:72` — « Aucun message reçu sur la période » alors que `latest` n'est pas filtré par période (vide = aucun message du tout).
- m3. `admin-overview.ts:238` — la courbe garde ses données en filtrant les datasets sur le libellé `'Visiteurs'` : couplage à une chaîne du presenter. Préférer un builder dédié (ou une option) dans `analytics-presenter.ts`.
- m4. `admin-nav-groups.ts:1` (`AdminNavKey`) et `:10` (`AdminNavItem`) — exportés sans consommateur hors du fichier (prescrits par le § 4 du plan, donc tolérés) : retirer `export` ou les consommer (`AdminNav` pourrait typer ses testids).
- m5. Helpers d'accord et de capitale dupliqués (cf. Duplication).
- m6. `admin-overview.ts:102` — pendant le chargement des statistiques, le chiffre CV des Contacts annonce « indisponible » (`null` = chargement ou erreur, convention du RED) : acceptable, mais une aide technique entend « indisponible » pendant une seconde.
- m7. Ligne vide au milieu des imports : `overview-audience.ts:132`, `overview-contacts.ts:6`, `overview-content.ts:118`.
- m8. Cohérence de la spec : la tranche B2 et le § 6 (PR b) listent encore `components/admin-table.ts` (+specs) à modifier, alors que rien n'y est touché (fait en PR a) ; `with-first-of-month.ts`, `components/admin-section-head.ts` et les builders de test (`analytics-builders.ts`, `user-builders.ts`) sont au journal mais absents du § 6.
- Suivis de la revue de la PR a : m7 traité ici (`settle.ts`, `by-test-id.ts`, `capture-crash.ts`, `press-test-id.ts`, un concept par fichier, `settleBounded` commenté d'une ligne) ; m3 et m6 restent en C1, m5 en C2, m8 en C1, comme décidé.
