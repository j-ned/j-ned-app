---
type: intake-audit
---

# Intake audit — repo entier, axe découpage, réutilisation et simplicité

## Description

Audit d'entrée du scope **repo** (repo entier), sur `master` (`acda8c0`), le 2026-10-08.
Aucun diff : la portée est le dépôt.

En plus des dix dimensions habituelles, l'audit vise **le découpage des composants, la réutilisation
et la simplicité (KISS)** :

1. Découper `features/admin/application/components/admin-project-form.ts` (environ 590 lignes, dont
   un gabarit d'environ 420). Ce point est inscrit dans « Suivis restants » de
   `specs/015-refonte-admin.md` (point 1).
2. Analyser tout le projet pour obtenir un découpage propre : repérer ce qui peut être simplifié et
   ce qui peut être réutilisé (doublons de structure, de logique, de copie).

Chaque proposition de découpage ou de mutualisation donne les fichiers et lignes concernés, le gain,
le risque, les tests touchés, la règle qu'elle applique avec sa source, et passe la règle des
« 2 usages réels » (YAGNI de `CLAUDE.md`). Les propositions sont classées par rapport valeur/risque,
puis regroupées en lots de PR.

Règles de découpage appliquées, par ordre de préséance :

- `.claude/CLAUDE.md` et `.claude/project-profile.md` (prévalent en cas de contradiction) ;
- notes Obsidian de l'utilisateur, transmises par la session principale (découpage par lisibilité
  ou réutilisation, formulaire découpé par section, deux sections au gabarit identique = composant
  de section, input custom par `FormValueControl`, le formulaire émet et le parent persiste,
  mutualisation au 2ᵉ ou 3ᵉ consommateur réel, `shared/ui` sans service, primitive ajoutée au fil des
  features). Les notes **ne fixent aucun seuil** de lignes ou de dépendances : les seuils 250 lignes
  et 6 injections ci-dessous sont des **indicateurs**, pas des règles de l'utilisateur.

## Intake audit

**Scope** : repo (`src/` entier, plus outillage et CI)
**Date** : 2026-10-08
**Outils exécutés** : pnpm audit ✅ (aucune vulnérabilité) | madge ✅ (aucun cycle, 479 fichiers) | knip ✅ | depcheck ✅ (sortie bruitée, cf. faux positifs)
**CI auditée** (dim 10, GitHub Actions) : ✅ `.github/workflows/ci.yml` (jobs `verify` et `docker`)
**Gates CI locaux** : tests ✅ (182 fichiers, 3 034 tests, exit 0) / lint ✅ (exit 0, aucun avertissement) / build ✅ (exit 0, 20 routes prérendues, aucun avertissement) — cache invalidé avant (`pnpm exec ng cache clean`)
**Candidats hors-périmètre écartés** : sans objet (scope-repo)

Traces :

- Checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main (greps des dimensions).
- Mutation : le profil ne porte pas d'outil de mutation, dimension 4 « pouvoir de détection » non auditée.
- Validation runtime aux frontières non vérifiée (aucune lib côté front, cf. profil).
- `pnpm build` a régénéré `public/sitemap.xml` et `public/rss.xml` (fichiers versionnés) ; restaurés
  par `git checkout` après mesure (cf. F029).

### Vue d'ensemble

Le dépôt est le front **seul** d'un portfolio : Angular 22 zoneless, Signal Forms, Tailwind v4
CSS-first, environ 20 100 lignes de TypeScript applicatif hors specs (55 400 avec les specs, 479
fichiers). Il est organisé en features hexagonales (`features/<x>/{domain,infra,application}`) pour
`projects`, `blog`, `offer`, `profile`, `home`, `contact`, `auth`, `cv`, `analytics`, plus une feature
`admin` purement `application/` qui consomme les gateways des autres. `core/` porte les singletons
(auth, thème, navigation, intercepteurs), `shared/ui` les primitives du design system, `layout/` le
shell. **Mode de rendu : SSR au build avec prérendu (SSG)** — `outputMode: "server"` dans
`angular.json`, 20 routes prérendues mesurées, servies statiquement par nginx ; l'admin est en
`RenderMode.Client` (`app.routes.server.ts:77`). Tout constat touchant `<head>`, JSON-LD ou le cycle
de vie a été évalué à cette aune (aucune recommandation ci-dessous ne touche un émetteur de `<head>`).

Le site public est bien découpé (`SplitSection` réutilisé par 12 composants, cartes de projet et
d'article minces, présentations pures `to*View`). La dette de découpage est **concentrée dans
l'admin**, refaite par les specs 015 et 016 : un formulaire de projet de 591 lignes, deux éditeurs
jumeaux (349 et 296 lignes) qui dupliquent coque et logique, et un motif de champ (libellé, contrôle,
première erreur) écrit à la main 47 fois dans 11 fichiers, avec une accessibilité inégale. Les gates
sont verts, sans avertissement ; madge et `pnpm audit` sont propres. Les autres constats sont de
l'outillage (pré-commit qui ne lance pas lint-staged, formatage dérivé) et de la copie dupliquée.

### Pistes d'enquête prioritaires

1. `src/app/features/admin/application/components/admin-project-form.ts` — 591 lignes, gabarit de 419 : premier fichier du dépôt en volume de composant, suivi ouvert de la spec 015.
2. `src/app/features/admin/application/admin-project-editor.ts` — 349 lignes, jumeau de l'éditeur d'article.
3. `src/app/features/admin/application/admin-post-editor.ts` — 296 lignes, jumeau.
4. `src/app/features/admin/application/components/admin-post-form.ts` — 254 lignes, même motif de champs que le formulaire de projet.
5. `src/app/features/contact/application/contact-form.ts` — 353 lignes, 41 modifications en 6 mois (premier fichier en churn), formulaire et section mêlés.
6. `src/app/features/blog/application/blog-detail.ts` — 338 lignes, 3 `effect()`, commentaires narratifs.
7. `src/app/shared/ui/button.ts` — primitive de bouton contournée à plusieurs endroits.
8. `src/styles.css` — 19 `@utility`, 31 modifications en 6 mois.
9. `src/app/features/admin/application/overview-view.ts` — héberge `groupedNumber`, importé par 8 fichiers.
10. `src/app/shared/ui/file-dropzone.ts` — 250 lignes, `effect()` nu, consommé par les deux formulaires d'édition.

### Synthèse (classée par impact)

1. F001/F002 — le formulaire de projet concentre 419 lignes de gabarit, dont deux blocs de rangées identiques à 115 lignes près : chaque évolution du formulaire traverse ce fichier.
2. F006/F007 — dans l'admin, les champs obligatoires n'annoncent ni l'état invalide ni le lien vers leur erreur, et une soumission invalide ne déplace pas le focus : l'erreur peut être quatre sections plus haut que la barre d'enregistrement.
3. F003/F004 — les deux éditeurs dupliquent leur coque (environ 130 lignes de gabarit) et leur logique de brouillon (environ 50 lignes) : toute correction se fait deux fois, et elles ont déjà divergé (F005).
4. F008 — le motif « première erreur du champ touché » est écrit 47 fois dans 11 fichiers, sous trois formes différentes.
5. F024 — `lint-staged` est configuré mais jamais lancé ; 9 fichiers sont hors format Prettier et rien ne le détecte (ni pré-commit ni CI).
6. F023 — `CLAUDE.md` cite comme référence un fichier qui n'existe plus (`admin-project-inline-form.ts`).
7. F012/F011 — `Button` porte un bloc `styles:` hors exceptions et ne sait pas exprimer `aria-pressed`/`aria-disabled`, d'où deux boutons natifs recopiés.
8. F014/F015 — pluriels et nombres groupés : un utilitaire existe (`pluralize`) mais le blog et une page admin le réécrivent, et `groupedNumber` vit dans un fichier de vue.
9. F027 — chaque `pnpm build` local modifie deux fichiers versionnés.
10. F022 — six blocs de commentaires narratifs (historique, n° de spec, ADR) dans le code de production.

### Légende des catégories (le compte rendu peut être transmis à un tiers)

**Catégorie** (dimension d'audit) : 1 Délitement architectural · 2 Érosion de la cohérence · 3 Dette de types et contrats · 4 Dette de tests · 5 Dette de dépendances et configuration · 6 Performance et gestion des ressources · 7 Gestion des erreurs et observabilité · 8 Sécurité · 9 Dérive de la documentation · 10 Dette de CI/CD et automatisation.
**Sévérité** : Critique (casse prod / sécurité / régression silencieuse) · Élevée (ralentit le travail courant) · Moyenne (friction modérée) · Faible (cosmétique / pérennité). **Effort** : S ≤ ½ j · M ≤ 2 j · L > 2 j.
**`[dep]`** (scope-chemin uniquement) : constat sur un fichier dépendance directe de la feature ; sans objet ici (scope-repo).

### Constats (problèmes actionnables uniquement)

| ID | Catégorie | fichier:ligne | Sévérité | Effort | Description | Recommandation |
| --- | --- | --- | --- | --- | --- | --- |
| F001 | 1 | src/app/features/admin/application/components/admin-project-form.ts:62 | Élevée | M | Composant de 591 lignes, gabarit de 419 (lignes 62-481) : identité, cartes de nature, présentation, couverture, liens, deux listes répétées et galerie dans un seul gabarit. Plus gros composant du dépôt ; indicateurs de 250 lignes dépassés de plus du double. | Découper par section (propositions P1, P2, P2b) : le composant garde le schéma `form()` et la soumission, les sections reçoivent leur `FieldTree`. Cible ≈ 150 lignes. |
| F002 | 1 | src/app/features/admin/application/components/admin-project-form.ts:340 | Élevée | S | Les blocs « Pourquoi ces outils » (340-394) et « Décisions d'architecture » (396-454) ont le même gabarit à 4 libellés près (en-tête de colonnes, rang sur 2 chiffres, 2 champs, bouton supprimer, bouton ajouter), avec 4 méthodes jumelles (559-585) et 2 chaînes de classes (517-520). Le relevé axe `target-size` des champs « Pourquoi » (suivi 015) devra être corrigé deux fois. | Proposition P1 : un composant de section répétée, branché deux fois. |
| F003 | 1 | src/app/features/admin/application/admin-project-editor.ts:79 | Élevée | M | Coque d'éditeur dupliquée avec `admin-post-editor.ts:57-177` : en-tête (fil d'Ariane, `h1` aux mêmes classes que `AdminPageHeader`, phrase d'intro, lien « Voir l'aperçu »), squelette de chargement, erreur avec lien retour, grille deux colonnes, dialogue de sortie (200-209 / 167-176). Environ 130 lignes de gabarit par fichier, dont ≈ 100 identiques. | Propositions P5a (réutiliser `AdminPageHeader`) et P5b (cadre d'éditeur à emplacements projetés). |
| F004 | 1 | src/app/features/admin/application/admin-project-editor.ts:225 | Moyenne | M | Logique de brouillon dupliquée avec `admin-post-editor.ts:191-241` : `saved`/`draft`/`tags` en `linkedSignal`, `pendingCover`, `coverResetToken`, `saving`, `baseline`/`edited`, `changes`, `toc`, `canLeave`, `warnBeforeUnload`, `rejectCover` (271-275 / 237-241), remise à zéro après enregistrement (334-338 / 264-267) et `notify()` (345-348 / 292-295). | Proposition P5c (objet de brouillon composé, comme `LeaveConfirmation`) et P5d (titre de toast par défaut). |
| F005 | 2 | src/app/features/admin/application/admin-project-editor.ts:320 | Moyenne | S | Les deux éditeurs ont divergé sur la couverture : en mise à jour, le projet envoie l'image **avant** l'écriture (323) et un échec d'image annule l'enregistrement avec une erreur ; l'article écrit d'abord puis envoie l'image (`admin-post-editor.ts:250-260`) et n'émet qu'un avertissement. À la création, le projet suit l'ordre de l'article (300-313). | Trancher le comportement voulu (question ouverte) avant P5c, puis l'écrire une seule fois. |
| F006 | 2 | src/app/features/admin/application/components/admin-project-form.ts:84 | Moyenne | S | Champs obligatoires de l'admin sans `aria-invalid` ni `aria-describedby` vers l'erreur, et erreur sans `id` : titre (84-93), catégorie (100-113), description (257-268), nature (117-157), rangées (355-371) ; idem `admin-post-form.ts:54-65`, `72-83`, `108-131`. Le même formulaire les pose pour la présentation (210-224), le contact et l'authentification aussi : `[formField]` ne pose que `required`/`disabled`/`readonly`/`name` (vérifié dans `@angular/forms/fesm2022/signals.mjs`, `elementAcceptsNativeProperty`). | Proposition P3 : le composant d'erreur porte l'`id`, le champ porte `aria-invalid` et `aria-describedby` par une directive ou à la main, partout pareil. |
| F007 | 7 | src/app/features/admin/application/components/admin-project-form.ts:547 | Moyenne | S | Soumission invalide sans guidage : aucun `onInvalid` dans les deux formulaires d'édition (547-556 ; `admin-post-form.ts:241-247`), alors que le bouton est dans la barre collante hors du formulaire (`admin-save-bar.ts:26-31`). Un choix technique vide en section 04 n'est signalé que là-haut, rien n'est annoncé près du bouton. `contact-form.ts:312` fait déjà `focusBoundControl()` sur le premier champ invalide. | Ajouter `onInvalid` qui focalise le premier champ invalide (même code que le contact, à mutualiser au 3ᵉ usage). |
| F008 | 2 | src/app/features/contact/application/contact-form.ts:100 | Moyenne | M | Le motif « `@let x = form.x()` + `x.touched() && x.invalid()` + `<span/p role="alert" class="form-error">{{ x.errors()[0].message }}` » est écrit 47 fois dans 11 fichiers (contact, 5 formulaires d'auth, 2 formulaires d'édition, 3 composants d'images), sous trois formes (`span` sans `id`, `p` avec `id`, `span` avec `id` et `data-testid`). | Proposition P3 : primitive `shared/ui/field-error.ts`. |
| F009 | 2 | src/app/features/admin/application/components/admin-project-form.ts:82 | Faible | S | Mention « obligatoire » écrite 7 fois avec la même liste de classes (`admin-project-form.ts:82, 98, 121, 255` ; `admin-post-form.ts:52, 70, 105`) ; message `REQUIRED` défini deux fois (`admin-project-form.ts:23`, `admin-post-form.ts:16`) et une troisième en dur (`admin-image-alt-schema.ts:8`). | Proposition P4. |
| F010 | 2 | src/app/features/admin/application/components/admin-project-row.ts:88 | Faible | S | `iconLinkClass` (liste de 9 classes sur un `<a>` natif) recopiée dans `admin-post-row.ts:216`, utilisée sur 4 liens. | Proposition P6 : `@utility icon-link` (ADR-0003). |
| F011 | 2 | src/app/features/admin/application/admin-messages.ts:40 | Faible | S | Bouton contour natif recopié (`admin-audience.ts:74`) avec une bordure `border-muted/30` qui diffère de `link-btn-outline` (`border-foreground/15`) déjà employé sur des `<button>` (`admin-save-bar.ts:31` pour `link-btn-primary`). | Proposition P7. |
| F012 | 2 | src/app/shared/ui/button.ts:30 | Moyenne | M | Bloc `styles:` (30-56 : display, transition, focus, `:active`) hors des exceptions de `CLAUDE.md` (keyframes, pseudo-éléments complexes, texte en dégradé, `:autofill`). `Button` n'expose ni `aria-pressed` ni `aria-disabled`, ce qui explique F011 ; il coexiste avec `link-btn-*` qui stylent aussi des boutons. | Proposition P12 : une source de vérité de bouton en utilities, `Button` les compose. |
| F013 | 2 | src/app/features/projects/application/components/project-grid-card.ts:44 | Faible | S | Lien étiré de carte : même liste de classes (`inline-flex min-h-11 items-center gap-1.5 … text-primary after:absolute after:inset-0 hover:underline`) sur 4 `<a>` natifs : `featured-project-card.ts:46`, `blog-post-row.ts:37`, `offer-card.ts:32` (sans `text-sm`). DESIGN.md décrit le motif trois fois (l. 312, 365, 411). | Proposition P8. |
| F014 | 2 | src/app/features/blog/application/blog-list-copy.ts:17 | Faible | S | Pluriel écrit à la main (`count > 1 ? 's' : ''`) à `blog-list-copy.ts:17` et `29-30`, et `admin-messages.ts:218-222`, alors que `admin/application/pluralize.ts` existe ; `counted()` défini deux fois (`admin-page-copy.ts:35-36` sans groupement des milliers, `overview-view.ts:56-57` avec) : « 1234 projets » d'un côté, « 1 234 » de l'autre. | Proposition P9. |
| F015 | 1 | src/app/features/admin/application/overview-view.ts:60 | Faible | S | `groupedNumber` est exporté par un fichier de vue de la page d'accueil admin et importé par 8 fichiers (Audience, CV, graphiques, tableaux) : couplage à une vue sans rapport (« un concept par fichier », CLAUDE.md). | Proposition P9 : fichier propre. |
| F016 | 1 | src/app/shared/calendar/relative-time.ts:1 | Faible | S | Fichier mort : `relativeTime` et le pipe `RelativeTime` n'ont aucun consommateur (knip, confirmé par `grep -rn relativeTime src`). Il double `receivedAgo` (`admin-messages-view.ts:63`), seul format relatif utilisé. | Supprimer le fichier (et le dossier `shared/calendar/`). |
| F017 | 1 | src/styles.css:327 | Faible | S | `@utility icon-tile` sans aucun usage (le composant `app-icon-tile` l'a remplacé ; le commentaire 320-325 décrit un état passé). | Supprimer le bloc 320-329. |
| F018 | 2 | src/styles.css:357 | Faible | S | Deux styles de libellé : `form-label` (357, `block font-medium`) et `field-label` (365, `flex font-semibold`). Dans l'admin, les éditeurs utilisent `field-label` mais `admin-tags-selector.ts:11` et `admin-gallery-upload-form.ts:23, 42` gardent `form-label` : deux rendus de libellé dans le même écran. | Dans l'admin, passer ces 3 libellés à `field-label` (DESIGN.md l. 489) ; `form-label` reste au public et à l'authentification. |
| F019 | 1 | src/app/shared/ui/toast-store.ts:7 | Faible | M | Service `@Injectable` rangé dans `shared/ui` (`CLAUDE.md` : `shared/` = UI réutilisable, pas de services ; note Obsidian : `shared/ui` sans service). Même remarque pour `shared/seo/seo.ts:30`. 30 fichiers importent `ToastStore`. | Déplacer vers `core/` (`core/notifications/toast-store.ts`, `core/seo/seo.ts`) dans un lot mécanique, en dernier. |
| F020 | 3 | src/app/features/blog/testing/blog-post-builders.ts:30 | Faible | S | Exports consommés seulement dans leur fichier (knip, confirmé par grep) : `PRODUCTION_POST_TAGS` (30), `offer.model.ts:10, 15, 46, 59, 69` (`OfferAmount`, `OfferPeriod`, `OfferReason`, `OfferFaqItem`, `OfferDemoImage`), `admin-nav-groups.ts:1, 10`, `social-link.model.ts:1` (`SocialLink`), `icon-map.ts:3` (`FaStyle`). | Retirer `export` (les types restent nommés localement). |
| F021 | 1 | src/app/shared/identity/contact-info.static-data.ts:1 | Faible | S | `shared/` importe deux types de `features/contact/domain` (1-2) : dépendance à l'envers (`shared` ne connaît pas les features). | Déplacer `ContactInfo`/`SocialLinks` dans `shared/identity/` (seuls consommateurs : ce fichier et `contact-info-panel.ts`). |
| F022 | 2 | src/app/features/blog/application/blog-detail.ts:222 | Faible | S | Commentaires d'archéologie (politique du profil) : `blog-detail.ts:222-230` (« le brief d'origine utilisait `request` … corrigé ici ») et `314-319` (récit de 6 lignes) ; `app.config.ts:158-161` (« (spec 004) », « refaisait ») ; `parse-markdown.ts:79-83` (« cf. ADR-0002 ») ; `http-projects.gateway.ts:19-26` (« Avant, `catchError → []` figeait… ») ; `auth-store.ts:133-136` (récit du NG0200) ; `giscus-config.ts:10-17` (procédure d'installation). | Réduire chacun à une ligne de WHY intemporel ou supprimer ; la procédure Giscus va dans `README.md`. |
| F023 | 9 | .claude/CLAUDE.md:151 | Moyenne | S | La section « Formulaires » cite comme référence `features/admin/application/components/admin-project-inline-form.ts` (tableaux, `linkedSignal`), fichier absent du dépôt (`ls` : aucun fichier). Les tableaux `applyEach` vivent désormais dans `admin-project-form.ts:538-545`. | Mettre à jour la référence (et la cible après P1). |
| F024 | 9 | .husky/pre-commit:3 | Moyenne | S | Le pré-commit lance `npm test` (et non `pnpm`, seul gestionnaire admis) et **jamais** `lint-staged`, pourtant configuré (`package.json:25-37`) et décrit comme actif par le profil. Conséquence mesurée : `pnpm run format:check` sort en 1 sur 9 fichiers (dont `icon-map.ts`, `http-auth.gateway.ts`, `projects.routes.ts`). | `pnpm exec lint-staged` puis `pnpm test` dans le hook ; `prettier --write` sur les 9 fichiers ; corriger le profil. |
| F025 | 10 | .github/workflows/ci.yml:42 | Faible | S | La CI ne vérifie pas le format (`format:check` absent entre Lint et Test) : la dérive F024 passe jusqu'à `master`. | Ajouter `pnpm run format:check` (script déjà présent). |
| F026 | 5 | package.json:78 | Faible | S | `eslint-plugin-prettier` installé mais non chargé (`eslint.config.js:5` ne charge que `eslint-config-prettier`) ; knip et depcheck concordent. | Retirer la dépendance (et le lockfile). |
| F027 | 5 | package.json:9 | Moyenne | S | `pnpm build` régénère `public/sitemap.xml` et `public/rss.xml`, versionnés : après un build local, l'arbre est sale (mesuré : 142 ajouts, 114 retraits, `lastmod` du jour). Risque de committer un artefact figé sur l'API du moment, ou de bloquer un `git checkout`. | Soit ignorer ces deux fichiers (le Dockerfile et la CI les régénèrent), soit les sortir de `public/` vers une étape de build (question ouverte). |
| F028 | 10 | .github/workflows/ci.yml:26 | Faible | S | Actions sur étiquettes flottantes (`actions/checkout@v6`, `pnpm/action-setup@v6`, `actions/setup-node@v6`, `docker/setup-buildx-action@v3`, `docker/build-push-action@v6`, l. 26, 30, 33, 100, 103, 107) : une étiquette déplacée exécute un autre code avec le jeton du dépôt. `permissions: contents: read` limite la portée. | Épingler sur SHA (Dependabot sait les mettre à jour). |
| F029 | 10 | .github/workflows/ci.yml:3 | Faible | S | Aucun filtre `paths-ignore` : un commit qui ne touche que `specs/**`, `docs/**` ou `tasks/**` (17 specs, environ 10 000 lignes, très modifiées) lance `verify` et `docker` (jusqu'à 35 min de budget). | `paths-ignore: ['specs/**', 'docs/**', 'tasks/**', '**/*.md']` sur `push` et `pull_request` (en gardant le check requis satisfait, ou un job léger de repli). |
| F030 | 2 | src/app/shared/ui/toast.ts:100 | Faible | S | Animations d'entrée du toast (100-113) et du tiroir (`drawer.ts:68-101`) sans `prefers-reduced-motion` ; `styles.css` ne coupe que `animate-fade-up`, `animate-ping`, `animate-pulse`. `@keyframes slide-in-right` est en plus défini deux fois avec des valeurs différentes (110 % et opacité / 100 %). | Ajouter `@media (prefers-reduced-motion: reduce) { … animation: none }` dans les deux blocs, ou `motion-reduce:animate-none` sur les éléments. |

Total : 30 constats — 0 Critique, 3 Élevée, 9 Moyenne, 18 Faible.

### Propositions de découpage et de mutualisation

Règle des « 2 usages réels » : ✅ = au moins deux consommateurs réels dans l'arbre courant ;
« lisibilité » = consommateur unique, découpage justifié par la lisibilité d'un gabarit chargé
(note Obsidian « découpage pour réutilisation **ou** lisibilité », « gros formulaire découpé en
sous-composants par section ») et non par la mutualisation : aucune abstraction n'est créée, le
YAGNI de `CLAUDE.md` (abstract class, use case) ne s'y applique pas.

Classement par rapport valeur/risque (1 = à faire d'abord).

| Rang | ID | Proposition | Fichiers:lignes | Gain attendu | Risque | Tests touchés | 2 usages | Règle appliquée (source) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | P3 | Primitive `shared/ui/field-error.ts` : `<app-field-error [field]="form.title" errorId="…" [testId]="…" />` affiche la première erreur du champ touché (`role="alert"`, `class="form-error"`, `id`). En complément, poser `aria-invalid` et `aria-describedby` sur le contrôle (à la main au début ; directive `[formField]` en option, précédent : `markdown-editor.ts` injecte déjà `FormField`). | 47 sites, 11 fichiers : `contact-form.ts:100-131, 153-215`, `login.ts`, `two-factor-verify.ts`, `two-factor-enable-form.ts`, `two-factor-disable-form.ts`, `password-change-form.ts:55-125`, `admin-post-form.ts:50-131`, `admin-project-form.ts:80-268`, `admin-gallery-image-item.ts`, `admin-gallery-upload-form.ts`, `admin-content-image-upload.ts` | ≈ 140 lignes de gabarit en moins ; une seule forme d'erreur ; corrige F006 et F008 | Faible à moyen : les `data-testid` d'erreur (`admin-post-title-error`, `admin-project-kind-error`, `admin-project-<clé>-error`) et les `id` référencés par `aria-describedby` doivent être conservés par entrées ; balise `p` → `span` dans le contact et l'auth (sans effet visuel, `form-error` est `block`) | Specs des 11 composants (sélection par `data-testid`, inchangée si l'attribut est reporté) ; nouveau `field-error.spec.ts` | ✅ 11 fichiers | Signal Forms : première erreur du champ touché sous lui, `role="alert"` (CLAUDE.md) ; primitive DS sans service dans `shared/ui` (note Obsidian) ; mutualisation au 3ᵉ consommateur (note Obsidian) |
| 2 | P1 | Composant de section répétée `admin-pair-rows.ts` (dumb) : en-têtes de colonnes, rang sur 2 chiffres, deux champs, suppression, ajout. Entrées : `rows` (le `FieldTree` du tableau), `first`/`second` (clés), libellés, placeholders, préfixe d'`id`, préfixe de `data-testid`. L'ajout et le retrait passent par `rows().value.update(…)` (le `value` d'un champ Signal Forms est inscriptible) : plus d'`output()` ni de méthodes dans le parent. | `admin-project-form.ts:340-454` (gabarit), `517-520` (classes), `559-585` (4 méthodes) | ≈ 110 lignes de moins dans le formulaire ; le correctif `target-size` des champs « Pourquoi » (suivi 015) se fait une fois | Moyen : typage générique des clés sur un `FieldTree` (garder `strictTemplates` vert) ; `id` `tech-N-techno` / `decision-N-text` et `data-testid` `tech-choice-*` / `decision-*` à reproduire à l'identique | `admin-project-form.spec.ts` (23 références), `admin-project-editor.spec.ts` (1) ; nouveau `admin-pair-rows.spec.ts` | ✅ 2 (choix techniques, décisions) | « Deux sections au gabarit identique deviennent un composant de section réutilisable » (note Obsidian) ; tableaux par `applyEach` et `model.update()` (CLAUDE.md) |
| 3 | P5c | Objet de brouillon composé `admin/application/editor-draft.ts` (classe simple, comme `LeaveConfirmation`) : `baseline`, `edited`, `changes`, `toc`, `pendingCover`, `coverResetToken`, `markSaved()`, `rejectCover()`, `canLeave()`, `warnBeforeUnload()`. Chaque éditeur garde ses appels gateway. | `admin-project-editor.ts:225-275, 334-338` ; `admin-post-editor.ts:191-241, 264-267` | ≈ 45 lignes de moins par éditeur ; une seule règle « modifications non enregistrées » | Moyen : prérequis F005 (ordre de la couverture) ; `linkedSignal`/`computed` créés en initialiseur de champ (contexte d'injection non requis) | `admin-project-editor.spec.ts` et `admin-post-editor.spec.ts` (comportement inchangé, aucun test à réécrire si les `data-testid` restent) ; nouveau `editor-draft.spec.ts` sans TestBed | ✅ 2 éditeurs | Mutualisation au 2ᵉ consommateur (note Obsidian) ; facade seulement si 2 composants partagent l'**état** : ici ce n'est pas une facade injectée, c'est un objet par instance (CLAUDE.md, profil) |
| 4 | P5a | Réutiliser `AdminPageHeader` dans les éditeurs : emplacement projeté pour le fil d'Ariane à la place de l'`overline`, emplacement `[adminPageAside]` (déjà présent) pour « Voir l'aperçu » / « Voir la fiche ». | `admin-page-header.ts:7-30` ; `admin-project-editor.ts:79-130` ; `admin-post-editor.ts:57-95` | ≈ 40 lignes de moins par éditeur ; `h1` focalisable (`tabindex="-1"`, `focusTitle()`) comme les 7 autres pages | Faible : la grille d'aside passe de `auto` à `22rem` (à vérifier visuellement) ; `text-balance` présent sur un seul des deux `h1` | `admin-page-header.spec.ts` ; specs des éditeurs (`admin-page-title`, `admin-breadcrumb-*` inchangés) | ✅ 9 (7 pages + 2 éditeurs) | Réutiliser une primitive existante plutôt qu'en créer une (KISS ; « une primitive s'ajoute au fil des features », note Obsidian) |
| 5 | P6 | `@utility icon-link` dans `src/styles.css` pour le lien icône 44 px. | `admin-project-row.ts:59, 67, 88-89` ; `admin-post-row.ts:185, 194, 216-217` | 2 constantes retirées, une seule définition de la cible tactile | Très faible | Aucun (aucun spec ne lit ces classes) | ✅ 2 fichiers, 4 liens | Liste de classes réutilisée sur un élément natif unique = `@utility` (CLAUDE.md, ADR-0003) |
| 6 | P9 | Formats de copie : déplacer `pluralize` (`admin/application/pluralize.ts`) et `groupedNumber` (`overview-view.ts:37, 60`) dans `shared/format/`, y joindre `format-file-size.ts` (aujourd'hui dans `shared/ui`, ce n'est pas de l'UI) ; un seul `counted()` qui groupe. | `blog-list-copy.ts:17, 29-30` ; `admin-messages.ts:218-222` ; `admin-page-copy.ts:35-36` ; `overview-view.ts:56-60` ; 8 importeurs de `groupedNumber` ; 2 de `formatFileSize` | 3 pluriels manuscrits et un doublon de `counted` retirés ; « 1 234 » partout | Faible : « 1234 » devient « 1 234 » dans `admin-page-copy` (changement visible voulu) | `pluralize.spec.ts` (déplacé), `overview-view.spec.ts`, `admin-page-copy.spec.ts`, `blog-list-copy` (sortie inchangée) | ✅ `pluralize` 10 fichiers dont 1 hors admin ; `groupedNumber` 8 | Un concept par fichier, jamais `utils.ts` (CLAUDE.md) ; mutualisation au 2ᵉ/3ᵉ consommateur (note Obsidian) |
| 7 | P5d | Titre de toast par défaut selon la sévérité dans `ToastStore.add()` (`summary` devient facultatif : « Succès », « Attention », « Erreur »). | `toast-store.ts:19-35`, `toast.types.ts` ; 17 littéraux dans `admin-blog.ts:198, 204`, `admin-messages.ts:164, 171, 194, 200, 221, 229`, `admin-cv.ts:184, 204, 214, 231, 237`, `admin-projects.ts:155, 162`, `admin-project-gallery.ts:173`, `login.ts:178`, `error-toast.ts:26` ; les deux `notify()` | `notify()` supprimé des éditeurs ; ≈ 25 lignes | Faible : le contact garde ses titres propres (« Message envoyé ») | `toast.spec.ts` (+1 cas), `admin-cv.spec.ts`, `admin-project-gallery.spec.ts` (assertions `summary` inchangées) | ✅ 10 fichiers | Simplicité d'abord (CLAUDE.md) |
| 8 | P2 | Sous-composants par section du formulaire de projet : `admin-project-identity-fields.ts` (titre, catégorie, cartes de nature, ordre, mise en avant ; lignes 77-187) et `admin-project-presentation-fields.ts` (accroche, point fort, périmètre, description, couverture ; 197-299). Le `<form [formRoot]>`, le schéma et la soumission restent dans `AdminProjectForm` ; les sections reçoivent `FieldTree<ProjectDraft>`. Liens (309-324, 16 lignes) et pile (après P1) restent en ligne. | `admin-project-form.ts:77-299` | `AdminProjectForm` ≈ 150 lignes : schéma + assemblage lisible | Moyen : `[formField]` dans un enfant reste lié au `formRoot` du parent (même arbre) ; ne pas dupliquer `form()` | `admin-project-form.spec.ts` inchangé si les `data-testid` sont conservés (tests au niveau du formulaire) ; specs propres facultatives | lisibilité (1 consommateur chacun) | « Un gros formulaire se découpe en sous-composants par section » ; « gabarit ultra chargé = signal d'extraire » ; découpage interne d'un dumb libre (notes Obsidian) |
| 9 | P2b | Sortir la galerie du formulaire : elle est déjà hors du `<form>` (458-480) et persiste elle-même. L'éditeur la rend sous le formulaire ; `AdminProjectForm` perd `projectId`, `gallery` et `galleryChange`. | `admin-project-form.ts:458-480, 486-487, 494` ; `admin-project-editor.ts:164-176` | 3 entrées/sorties en moins sur un composant dumb ; le formulaire ne contient plus de composant qui injecte un gateway | Faible : l'ordre visuel et la section « 05 · Galerie » du sommaire restent identiques | `admin-project-form.spec.ts` (cas galerie déplacés vers `admin-project-editor.spec.ts`) | lisibilité | « Le formulaire ne connaît pas le service : il émet, le parent persiste » ; dumb = `input()`/`output()` seulement (notes Obsidian) |
| 10 | P5b | Cadre d'éditeur `admin-editor-frame.ts` (dumb) : chargement (libellé, squelettes), erreur avec lien retour, état « introuvable », grille deux colonnes à emplacements projetés (formulaire + barre / aperçu + sommaire), dialogue de sortie (`[leaveAsked]`, `(leaveAnswered)`). | `admin-project-editor.ts:132-209` ; `admin-post-editor.ts:97-176` | ≈ 60 lignes de moins par éditeur | Moyen : les états divergent (le projet n'a pas d'état `empty`, son lien retour n'est que dans `error`) ; `data-testid` `admin-project-editor-*` / `admin-post-editor-*` à passer en entrée ou à harmoniser dans les specs | Specs des deux éditeurs (≈ 25 références de `data-testid`) | ✅ 2 éditeurs | Mutualisation au 2ᵉ consommateur ; création et édition dans un seul composant (déjà respecté, à préserver) (notes Obsidian) |
| 11 | P13 | Étiquettes dans le brouillon : `AdminTagsSelector` implémente `FormValueControl<readonly string[]>` (`value = model()`), lié par `[formField]="form.tags"` ; le modèle `tags` parallèle disparaît des deux formulaires et des deux éditeurs, `toProjectInput`/`toPostInput` perdent leur paramètre `tags`. | `admin-tags-selector.ts` ; `admin-project-form.ts:334-338, 485` ; `admin-post-form.ts:85-89, 216` ; `admin-project-editor.ts:29-32, 234-236, 248` ; `admin-post-editor.ts:24-27, 203-205, 214` ; `project-draft.ts:51, 80` ; `post-draft.ts:19, 31` | Un seul canal d'état par formulaire (KISS) ; `EditedX` ne compose plus que la couverture | Moyen : passage `Set` → tableau, la détection de changement doit comparer à ordre près (trier, ou comparer en ensemble) | Specs des formulaires, des éditeurs, `project-draft.spec.ts`, `post-draft.spec.ts`, `admin-tags-selector.spec.ts` | ✅ 2 formulaires | « Un input custom passe par `FormValueControl` » (note Obsidian) ; `ControlValueAccessor` toléré seulement pour une lib tierce (CLAUDE.md) |
| 12 | P4 | Mention « obligatoire » : composant `admin/application/components/required-mark.ts` (texte et classes) ; message `REQUIRED` dans un fichier de l'admin, repris par `admin-image-alt-schema.ts`. Option : `aria-hidden="true"` sur la mention, l'état requis étant déjà annoncé par l'attribut natif que pose `[formField]`. | `admin-project-form.ts:23, 82, 98, 121, 255` ; `admin-post-form.ts:16, 52, 70, 105` ; `admin-image-alt-schema.ts:8` | 7 duplications de classe et 3 de message retirées | Très faible ; l'option `aria-hidden` change le nom accessible (« Titre » au lieu de « Titre obligatoire ») : conforme WCAG 2.5.3, le nom visible commence par « Titre » | Specs des deux formulaires si elles lisent le texte du libellé | ✅ 2 formulaires, 7 sites | DESIGN.md l. 489 (mention dans le `label`) ; mutualisation au 2ᵉ consommateur (note Obsidian) |
| 13 | P7 | Boutons contour natifs : appliquer `link-btn-outline` (déjà utilisé sur `<a>` et, pour `link-btn-primary`, sur `<button>`) aux deux boutons, en gardant en ligne les variantes `aria-pressed:` / `aria-disabled:`. | `admin-messages.ts:35-41` ; `admin-audience.ts:69-75` | Une seule définition du contour | Faible : bordure `muted/30` → `foreground/15` à arbitrer (DESIGN.md) | `admin-messages.spec.ts`, `admin-audience.spec.ts` (sélection par `data-testid`, inchangée) | ✅ 2 | Liste de classes sur un élément natif = `@utility` (CLAUDE.md, ADR-0003) |
| 14 | P8 | `@utility card-link` pour le lien étiré des cartes publiques. | `project-grid-card.ts:44` ; `featured-project-card.ts:46` ; `blog-post-row.ts:37` ; `offer-card.ts:32` | Un motif DESIGN.md = une définition | Faible, mais 3 specs testent les classes `after:absolute` / `after:inset-0` / `min-h-11` | `blog-post-row.spec.ts:175`, `featured-project-card.spec.ts:170`, `project-grid-card.spec.ts:81` à réécrire (tester `card-link`) | ✅ 4 | Liste de classes sur un `<a>` natif = `@utility` (CLAUDE.md, ADR-0003). Pas de composant : le contenu diffère (flèche icône ou texte, libellé) |
| 15 | P12 | Sortir le bloc `styles:` de `Button` : utilities `btn`, `btn-primary`, `btn-outline` (renommage de `link-btn*`, qui stylent déjà des `<button>`), `Button` les compose et gagne `pressed`/`ariaDisabled`. | `button.ts:30-56, 62-…` ; `styles.css:249-262` ; 28 usages de `link-btn-*` dans 16 fichiers | Une source de vérité pour tous les boutons ; F011 devient inutile | Moyen : changement visuel possible sur tous les `<app-button>` ; renommage mécanique large | `button.spec.ts` ; aucun spec ne lit `link-btn` (grep) | ✅ | Pas de `styles:` hors exceptions ; `@apply` seulement dans un `@utility` (CLAUDE.md) |

Propositions examinées et **écartées** :

- **Jumeaux publics `ProjectDetailTechChoices` / `ProjectDetailArchDecisions`** (36 lignes chacun) : même
  grille, mais sémantique différente voulue (`ul` + `h3` navigables d'un côté, `dl` de l'autre). Un
  composant commun ajouterait un mode pour 30 lignes : KISS l'emporte.
- **Scinder `ContactForm` en section intelligente et formulaire muet** (la note Obsidian « le formulaire
  ne connaît pas le service » le demanderait) : `CLAUDE.md` cite `contact-form.ts` comme formulaire
  de référence **de page** ; ses deux consommateurs (`home.ts:101`, `offer-page.ts:59`) l'emploient
  comme bloc autonome. `CLAUDE.md` prévaut ; question ouverte.
- **Formats de date** : quatre `Intl.DateTimeFormat` « d MMM y », mais deux en `timeZone: 'UTC'`
  (jours d'analytics) et deux en heure locale (messages, CV) : la différence est sémantique.
- **Tailles de fichier** : le doublon `formatSize` relevé en revue (spec 015, m1) est **soldé** ;
  `formatFileSize` est la seule implémentation (`file-dropzone.ts:181`, `admin-cv-view.ts:20`,
  `admin-page-copy.ts:60`).

### Lots de PR

Intersections calculées sur les fichiers modifiés de chaque lot. Quand elle n'est pas vide, l'ordre
de merge est imposé et nommé (règle 7 du workflow de `CLAUDE.md`).

| Lot | Contenu | Fichiers | Dépend de / intersection |
| --- | --- | --- | --- |
| L1 — Nettoyage | F016, F017, F020 (sauf `icon-map.ts`), F021, F022, F023 | `shared/calendar/relative-time.ts`, `styles.css` (bloc `icon-tile`), `blog-post-builders.ts`, `offer.model.ts`, `admin-nav-groups.ts`, `social-link.model.ts`, `contact-info.static-data.ts`, `contact-info-panel.ts`(+spec), `blog-detail.ts`, `app.config.ts`, `parse-markdown.ts`, `http-projects.gateway.ts`, `auth-store.ts`, `giscus-config.ts`, `README.md`, `.claude/CLAUDE.md` | `styles.css` partagé avec L3 et L8 (blocs distincts) : merger L1 avant |
| L2 — Outillage et CI | F024, F025, F026, F028, F029, `FaStyle` (F020) | `.husky/pre-commit`, `package.json`, `pnpm-lock.yaml`, `.github/workflows/ci.yml`, les 9 fichiers reformatés, `.claude/project-profile.md` | Aucune intersection |
| L3 — Utilitaires d'admin | P6, P7, F018 | `styles.css`, `admin-project-row.ts`, `admin-post-row.ts`, `admin-messages.ts`, `admin-audience.ts`, `admin-tags-selector.ts`, `admin-gallery-upload-form.ts` | `styles.css` (L1, L8) ; `admin-messages.ts` et `admin-audience.ts` partagés avec L4 (imports seulement) : L3 avant L4 |
| L4 — Formats de copie | P9 | `shared/format/*` (nouveaux), `pluralize.ts`(+spec), `overview-view.ts`, `admin-page-copy.ts`, `blog-list-copy.ts`, `admin-messages.ts`, `admin-messages-view.ts`, 8 importeurs de `groupedNumber`, `file-dropzone.ts`, `admin-cv-view.ts`, `admin-save-bar.ts`, `overview-contacts.ts` | Après L3 |
| L5 — Champs de formulaire | P3, P4, F006 (formulaire d'article, contact, auth, images), F007 | `shared/ui/field-error.ts`(+spec), `required-mark.ts`, `contact-form.ts`, 5 formulaires d'auth, `admin-post-form.ts`, `admin-gallery-image-item.ts`, `admin-gallery-upload-form.ts`, `admin-content-image-upload.ts`, `admin-image-alt-schema.ts` | `admin-gallery-upload-form.ts` partagé avec L3 : L3 avant L5. **Exclut** `admin-project-form.ts` (L6) |
| L6 — Formulaire de projet | P1, P2, P2b, F006/F007 côté projet, adoption de P3 et P4 | `admin-project-form.ts`(+spec), `admin-pair-rows.ts`(+spec), `admin-project-identity-fields.ts`, `admin-project-presentation-fields.ts`, `admin-project-editor.ts` (galerie seulement) | Après L5 (consomme `field-error` et `required-mark`) ; `admin-project-editor.ts` partagé avec L7 : L6 avant L7 |
| L7 — Toasts | P5d | `toast-store.ts`, `toast.types.ts`, `toast.spec.ts`, les 8 consommateurs listés en P5d (hors éditeurs) | `admin-messages.ts` (L3, L4) : après L4 |
| L8 — Coque d'éditeur | F005 tranché, P5a, P5c, P5b, retrait de `notify()` | `admin-project-editor.ts`, `admin-post-editor.ts` (+specs), `admin-page-header.ts`(+spec), `editor-draft.ts`(+spec), `admin-editor-frame.ts`(+spec) | Après L6 et L7 |
| L9 — Étiquettes en `FormValueControl` | P13 | `admin-tags-selector.ts`, les deux formulaires, les deux éditeurs, `project-draft.ts`, `post-draft.ts` (+specs) | Après L8 (touche tous ses fichiers) |
| L10 — Boutons | P12, P8, F030 | `button.ts`(+spec), `styles.css`, 16 fichiers `link-btn-*`, 4 cartes et 3 specs, `toast.ts`, `drawer.ts` | Après L3 (`styles.css`) |
| L11 — Couches | F019 | `core/notifications/toast-store.ts`, `core/seo/seo.ts`, ≈ 35 importeurs | En dernier, facultatif (touche presque tous les lots) |

Indépendants entre eux dès le départ : **L1, L2, L3** (L1 et L3 se touchent sur `styles.css`, blocs
disjoints, merger L1 d'abord). Chemin critique de la demande principale : **L3 → L5 → L6** (le
formulaire de projet découpé), puis **L7 → L8** pour la coque.

### Priorités absolues (« si tu ne corriges rien d'autre »)

1. F006/F007 avec P3 — la seule dette qui touche l'usage réel : un champ obligatoire vide dans l'admin n'est ni annoncé comme invalide ni relié à son message, et la soumission ne guide pas vers lui. Esquisse : `field-error` avec `id`, `aria-invalid`/`aria-describedby` sur les contrôles, `onInvalid` qui focalise le premier champ invalide.
2. F001/F002 avec P1 puis P2 — le suivi ouvert de la spec 015 ; P1 seul retire déjà 110 lignes et règle le `target-size` en un endroit.
3. F024 — remettre `lint-staged` dans le pré-commit (et `pnpm`) : sans lui, le format dérive en silence.
4. F003/F004/F005 avec P5c — trancher l'ordre de la couverture, puis écrire la logique de brouillon une fois.

### Gains rapides (effort faible × sévérité moyenne et plus)

- [ ] F023 — corriger la référence `admin-project-inline-form.ts` dans `CLAUDE.md` (pointer `admin-project-form.ts:538-545`).
- [ ] F024 — `.husky/pre-commit` : `pnpm exec lint-staged && pnpm test` ; `pnpm run format` sur les 9 fichiers.
- [ ] F007 — `onInvalid` dans les deux formulaires d'édition (copie du code de `contact-form.ts:312`).
- [ ] F027 — décider du sort de `public/sitemap.xml` et `public/rss.xml` (ignorer ou garder) et l'écrire.

### Bonnes pratiques notables

- Création et édition partagent un seul composant (`id` facultatif dans les deux éditeurs) — conforme à la note Obsidian, à préserver dans P5b.
- Les formulaires d'édition sont muets : ils émettent `submitted`, l'éditeur persiste (`admin-project-form.ts:548-555`, `admin-project-editor.ts:277-285`) ; seule exception, la galerie (P2b).
- La logique d'édition est en fonctions pures testées sans TestBed (`project-draft.ts`, `count-draft-changes.ts`, `form-toc-entries.ts`, `markdown-edit.ts`) et déjà partagée par les deux éditeurs.
- Les gateways de lecture partagent un flux mis en cache qui ne garde jamais un échec (`share` + `ReplaySubject` + `resetOnError`, `http-projects.gateway.ts:27-41`, `http-blog.gateway.ts:25-38`) : plusieurs pages lisent la même liste sans requête de plus.
- La CI vérifie l'artefact livré, pas seulement le build : routes prérendues, CSP hachée, en-têtes nginx, polices et visuels servis (`ci.yml:58-91, 108-176`).

### Faux positifs assumés

- **Gateways en `abstract class` avec une seule implémentation HTTP** (8 dans `app.config.ts:186-193`) — le YAGNI de `CLAUDE.md` demanderait des classes concrètes, mais la règle de dépendance du même fichier (« `application` ne dépend jamais directement de `infra`, câblage dans `app.config.ts` ») exige le contrat abstrait, et chaque feature a un double de test dans `features/<x>/testing/`. Tension interne à `CLAUDE.md`, notée en question.
- **`@utility` utilisés par un seul composant** — `footer-link` (6 liens) et `footer-heading` (3 titres) dans `footer.ts` : en ligne, la liste serait recopiée 6 et 3 fois ; `nav-underline` (`header.ts:49, 60`) porte des variantes `group-[.is-link-active]:` sur deux sites ; `code-syntax` vise les `span.hljs-*` injectés par `innerHTML`, qui ne peuvent pas porter d'utilities. Tous relèvent de l'exception « composition ou état multi-sélecteur » de `CLAUDE.md`.
- **knip « unused »** — `@fortawesome/fontawesome-free` est lu par `scripts/build-icons.mjs:21`, `@sentry/cli` par `scripts/upload-sentry-sourcemaps.mjs:29`, `proxy.conf.cjs` par `angular.json:71`. **depcheck** — les 23 « dépendances manquantes » sont les alias `@core/*`, `@features/*`, `@shared/*` ; les « inutilisées » `@angular/build`, `@angular-eslint/builder`, `tailwindcss`, `@tailwindcss/postcss`, `postcss`, `tslib`, `@tailwindcss/typography` sont chargées par `angular.json`, PostCSS ou `styles.css`.
- **`admin-layout.ts` (8 injections) et `admin-overview.ts` (6)** — au-delà de l'indicateur de 6 : c'est le shell et le tableau de bord. Les compteurs lus par les deux (projets, articles, non lus) passent par les flux partagés des gateways : aucune requête en double.
- **`admin-post-editor.ts:186-196` lit toute la liste pour un article** — même flux partagé et invalidé (`http-blog.gateway.ts:47-53`) que la liste d'articles : pas de requête supplémentaire en navigation interne.
- **`blog-article-body.ts:3` importe `infra/parse-markdown`** (application → infra) — décision actée par ADR-0002 : l'assainissement vit à cet endroit et nulle part ailleurs.
- **Composants de `components/` qui injectent un gateway** (`admin-project-gallery.ts`, `admin-content-image-upload.ts`, `blog-like-button.ts`, `blog-comments.ts`) — îlots autonomes qui écrivent indépendamment de la soumission d'un formulaire (une capture se dépose après création du projet). Seul le cas de la galerie rendue **dans** le formulaire est traité (P2b).
- **`blog-detail.ts` et ses 3 `effect()`** — sous le signal d'alerte de 5 de la note Obsidian, et chacun a un effet de bord distinct (SEO, suivi de vue, observateur de lecture avec nettoyage).
- **`changeDetection: OnPush` explicite** (`button.ts:15`, `contact-form.ts:57`) — redondant en Angular 22, toléré par le profil.

### Questions ouvertes pour l'équipe

- F005 : en mise à jour d'un projet, un échec d'envoi de couverture doit-il annuler l'enregistrement (comportement actuel) ou enregistrer et avertir (comportement de l'article) ?
- P5b : l'éditeur de projet doit-il avoir un état « introuvable » comme l'article, au lieu d'une erreur générique sur 404 ?
- Note Obsidian « les pages vont dans `pages/` avec `export default` » : le profil range les pages de feature dans `features/<x>/application/**` et les routes chargent par nom (`.then((m) => m.X)`), aucun `export default` dans `src/`. `CLAUDE.md` prévaut ; faut-il aligner l'une des deux sources ?
- `ContactForm` injecte `ContactGateway` : à garder comme bloc de page autonome (`CLAUDE.md`), ou à scinder selon la note Obsidian ?
- `CLAUDE.md` dit à la fois « abstract class seulement si 2+ implémentations » et « `application` ne dépend jamais de `infra` » : laquelle des deux règles gouverne les gateways ?
- F027 : `public/sitemap.xml` et `public/rss.xml` doivent-ils rester versionnés (repli si l'API est injoignable au build) ?
- F019 : le déplacement de `ToastStore` vers `core/` (≈ 35 fichiers) vaut-il le coût, ou suffit-il d'acter l'exception dans `CLAUDE.md` ?
- P4 : la mention « obligatoire » doit-elle rester dans le nom accessible (double annonce avec l'état requis natif) ?

## Plan technique

Périmètre : chemin critique **L3 → L5 → L6** de l'audit (le formulaire de projet découpé). L1, L2,
L4, L7 à L11 sont hors de ce plan (cf. « Suite »). Décisions transverses : cf. **ADR-0016** (erreur
de champ partagée, convention ARIA des champs, focus sur soumission invalide).

### Vérification des références de l'audit (master `acda8c0`)

- `admin-project-form.ts` : toutes les lignes citées sont exactes (591 lignes, gabarit 62-481,
  rangées 340-394 / 396-454, classes 517-520, méthodes 559-585, soumission 547-556, galerie
  458-480, identité 77-187, présentation 197-299, liens 309-324, `applyEach` 538-545).
- `admin-post-form.ts` (16, 50-131, 52/70/105, 241-247), `admin-project-editor.ts:164-176`,
  `admin-messages.ts:35-41`, `admin-audience.ts:69-75`, `admin-tags-selector.ts:11`,
  `admin-gallery-upload-form.ts:23, 42`, `admin-image-alt-schema.ts:8`, `contact-form.ts:312`,
  `admin-save-bar.ts:26-31`, `styles.css:357/365` : exactes.
- **Inexact** : `admin-post-row.ts:185, 194, 216-217` (P6/F010) — le fichier fait 128 lignes ; les
  sites réels sont **90, 99, 121-122**.
- **Chiffre corrigé** : F008 annonce 47 écritures ; on mesure **23 affichages d'erreur**
  (`errors()[0]`) dans les 11 fichiers (le chiffre de l'audit compte aussi les `@let` et les
  prédicats). La liste des fichiers est juste.

### Architecture

Aucune nouvelle couche, aucun état partagé, aucun gateway : tout se passe dans
`application/` (composants muets) et `shared/`.

```mermaid
flowchart TD
  E[AdminProjectEditor — persiste, possède draft/tags/gallery] -->|"[(value)] [(tags)] cover*"| F[AdminProjectForm — form(), schéma, submission + onInvalid]
  E -->|"fieldset 05 · Galerie (P2b)"| G[AdminProjectGallery]
  F -->|"[form]=FieldTree<ProjectDraft>"| I[AdminProjectIdentityFields]
  F -->|"[form] + cover I/O"| P[AdminProjectPresentationFields]
  F -->|"[rows]=form.techChoices / form.architectureDecisions"| R[AdminPairRows<A,B>]
  I & P & R --> FE[shared/ui FieldError]
  I & P --> RM[RequiredMark]
  F --> FF[shared/forms focusFirstInvalid]
```

- **Un seul `form()`**, dans `AdminProjectForm`. Les sous-composants reçoivent un `FieldTree` et
  posent `[formField]` dessus : la liaison s'enregistre sur le nœud de champ, pas sur le `<form>`
  (`FormRoot` ne fait que relayer l'événement `submit`, vérifié dans `signals.mjs`). Ils
  n'appellent jamais `form()` ni `submit()`.
- **Pas de presenter** : les sous-composants n'ont aucune dérivation non triviale (seule
  `AdminPairRows.cells`, une projection de 3 lignes). Ce sont des découpes de lisibilité (note
  Obsidian « formulaire découpé par section »), pas des abstractions.
- **Sections** : le `<fieldset app-admin-form-section id="project-…">` reste dans le parent
  (ancres du sommaire `#project-identity`…). Les enfants rendent le **contenu** du fieldset ; leur
  hôte porte la grille (`host: { class: 'grid gap-5' }`) qui remplace le `<div class="grid gap-5">`.
- **Landmarks** : sans objet (aucun `header`/`footer`/`main` touché). Hiérarchie des titres : les
  deux `h2` des rangées (« Pourquoi ces outils », « Décisions d'architecture ») passent dans
  `AdminPairRows` à l'identique.

### Fichiers à créer / modifier

Lot **L3** (PR 1)

| Fichier | Rôle |
| --- | --- |
| `src/styles.css` | `@utility icon-link` (liste de `iconLinkClass`), placée après `link-btn-outline`. |
| `features/admin/application/components/admin-project-row.ts` | `class="icon-link"` sur les 2 liens (59, 67), constante 88-89 supprimée. |
| `features/admin/application/components/admin-post-row.ts` | idem (90, 99, constante 121-122). |
| `features/admin/application/admin-messages.ts` | bouton « Tout marquer comme lu » : `link-btn-outline cursor-pointer` + variantes `aria-disabled:` gardées en ligne. |
| `features/admin/application/admin-audience.ts` | bouton d'exclusion : `link-btn-outline cursor-pointer aria-pressed:border-primary`. |
| `features/admin/application/components/admin-tags-selector.ts` | `form-label` → `field-label` (11). |
| `features/admin/application/components/admin-gallery-upload-form.ts` | `form-label` → `field-label` (23, 42). |

Lot **L5** (PR 2)

| Fichier | Rôle |
| --- | --- |
| `shared/ui/field-error.ts` (+ `.spec.ts`) | Primitive `FieldError` (ADR-0016). |
| `shared/forms/focus-first-invalid.ts` (+ `.spec.ts`) | Fonction pure `focusFirstInvalid(field)` ; nouveau dossier `shared/forms/` (fonction, pas de service). |
| `features/admin/application/components/required-mark.ts` (+ `.spec.ts`) | Mention « obligatoire » (texte + classes). |
| `features/admin/application/components/required-message.ts` | `REQUIRED_MESSAGE = 'Ce champ est obligatoire'`. |
| `features/admin/application/components/admin-post-form.ts` (+ spec) | `FieldError` ×3, `aria-invalid`/`aria-describedby`, `RequiredMark` ×3, `REQUIRED_MESSAGE`, `onInvalid`. |
| `features/admin/application/components/admin-image-alt-schema.ts` | message en dur → `REQUIRED_MESSAGE`. |
| `features/admin/application/components/admin-gallery-image-item.ts` (+ spec) | `FieldError` + ARIA (absents aujourd'hui). |
| `features/admin/application/components/admin-gallery-upload-form.ts` (+ spec) | idem. |
| `features/admin/application/components/admin-content-image-upload.ts` | `FieldError` (ARIA déjà posée). |
| `features/contact/application/contact-form.ts` | `FieldError` ×4 ; `focusFirstInvalidField` remplacé par `focusFirstInvalid`. |
| `features/auth/application/{login,password-change-form,two-factor-disable-form,two-factor-enable-form,two-factor-verify}.ts` | `FieldError` (8 sites, ARIA déjà posée). |

Lot **L6** (PR 3)

| Fichier | Rôle |
| --- | --- |
| `features/admin/application/components/admin-pair-rows.ts` (+ `.spec.ts`) | Section de rangées à deux champs (P1). |
| `features/admin/application/components/admin-project-identity-fields.ts` | Titre, catégorie, nature, position, mise en avant (P2). |
| `features/admin/application/components/admin-project-presentation-fields.ts` | Accroche, point fort, périmètre, description, couverture (P2). |
| `features/admin/application/components/admin-project-form-data.ts` | + `TECH_CHOICE_ROWS`, `DECISION_ROWS` (configurations de `AdminPairRows`). |
| `features/admin/application/components/admin-project-form.ts` (+ spec) | Schéma, soumission, `onInvalid`, assemblage ; perd galerie, rangées, sections de champs. |
| `features/admin/application/admin-project-editor.ts` (+ spec) | Rend la section « 05 · Galerie » sous le formulaire (P2b). |
| `src/styles.css` | `app-select` : `aria-[invalid=true]:border-status-error aria-[invalid=true]:ring-status-error/30` (comme `form-input`). |

### Modèles de données et API publique des nouveaux composants

Aucun modèle de domaine modifié. `ProjectDraft` reste tel quel (`techChoices: TechChoice[]`,
`architectureDecisions: ArchitectureDecision[]`, éléments `readonly`). Profil sans lib de validation
runtime : la validation reste le schéma Signal Forms.

**`FieldError`** (`shared/ui/field-error.ts`, sélecteur `app-field-error`)

- Entrées : `field = input.required<ReadonlyFieldTree<unknown>>()`, `errorId = input.required<string>()`,
  `testId = input<string>()`.
- Rendu : si `field()().touched() && field()().invalid()`, un `<p [id]="errorId()"
  [attr.data-testid]="testId() ?? null" role="alert" class="form-error">` avec
  `errors()[0]?.message`. Rien sinon. `host: { class: 'contents' }`.
- `p` retenu (13 des 23 sites l'emploient déjà ; `form-error` est `block`, aucun écart visuel pour
  les 10 `span`). Aucun site n'est en contexte de contenu phrasé.
- Typage vérifié (`tsc` contre `@angular/forms` 22.2.1) : `FieldTree<string>`, `<number>`,
  `<ProjectKind | ''>`, un champ de rangée sont assignables à `ReadonlyFieldTree<unknown>`.

**Convention ARIA du contrôle** (ADR-0016), écrite partout de la même façon :

```html
@let titleShown = form.title().touched() && form.title().invalid();
<input [formField]="form.title" [attr.aria-invalid]="titleShown"
       [attr.aria-describedby]="titleShown ? 'project-title-error' : null" … />
<app-field-error [field]="form.title" errorId="project-title-error" testId="admin-project-title-error" />
```

Avec indication : `[attr.aria-describedby]="shown ? 'x-hint x-error' : 'x-hint'"`.

**`focusFirstInvalid`** (`shared/forms/focus-first-invalid.ts`)

- `export function focusFirstInvalid(field: ReadonlyFieldTree<unknown>): void` —
  `field().errorSummary()[0]?.fieldTree().focusBoundControl()`. `errorSummary()` est trié par
  position DOM du premier contrôle lié (`compareErrorPosition`, vérifié) : marche à travers les
  sous-composants et les rangées. Branché par `onInvalid: (field) => focusFirstInvalid(field)`.

**`RequiredMark`** (`admin/application/components/required-mark.ts`, sélecteur `app-required-mark`)

- Aucune entrée. Hôte : `class: 'font-mono text-xs font-medium text-muted'`, gabarit `obligatoire`.
  Reste dans le `label`/`legend` (nom accessible inchangé : « Titre obligatoire »).

**`AdminPairRows<A extends string, B extends string>`** (sélecteur `app-admin-pair-rows`)

```ts
export type PairRow<A extends string, B extends string> = { readonly [K in A | B]: string };
export type PairColumn<K extends string> = {
  readonly key: K; readonly label: string; readonly slug: string; readonly placeholder: string;
};
export type PairRowsConfig<A extends string, B extends string> = {
  readonly heading: string; readonly idPrefix: string; readonly testIdPrefix: string;
  readonly first: PairColumn<A>; readonly second: PairColumn<B>;
  readonly removeLabel: string; readonly addLabel: string;
};
// entrées
readonly rows = input.required<FieldTree<PairRow<A, B>[]>>();
readonly config = input.required<PairRowsConfig<A, B>>();
```

- Aucune sortie : ajout `rows()().value.update((rs) => [...rs, blank])`, retrait
  `rows()().value.update((rs) => rs.filter((_, i) => i !== index))` — `FieldState.value` est un
  `WritableSignal<TValue>` (vérifié, `_structure-chunk.d.ts:1388`), la mise à jour remonte au
  `model()` du parent puis au brouillon de l'éditeur.
- `protected readonly cells = computed(...)` : `Array.from(this.rows(), (row) => ({ row, first, second }))`
  (l'itération d'un `FieldTree` de tableau lit sa valeur : `computed` réactif, vérifié dans le
  proxy). L'accès `row[key]` sur une clé **générique** est refusé par TypeScript (TS2536 : le type
  `Subfields` est un type mappé à remappage `as`) : **un seul** transtypage local
  `row as unknown as Readonly<Record<A | B, FieldTree<string>>>`, plus un pour la rangée vide
  `{ [first.key]: '', [second.key]: '' } as PairRow<A, B>`. Aucun dans les appelants.
- Sécurité de type aux appelants **vérifiée avec `ngc` + `strictTemplates`** : le vérificateur de
  gabarits infère `A`/`B` depuis `[config]` ; `[rows]="form.architectureDecisions"
  [config]="TECH_CHOICE_ROWS"` est refusé à la compilation (TS2322), les deux usages réels passent.
- Configurations (dans `admin-project-form-data.ts`, typées `PairRowsConfig<'techno', 'why'>` et
  `PairRowsConfig<'decision', 'rationale'>`) — reproduisent à l'identique les `id`, `data-testid`
  et libellés actuels :

| | `TECH_CHOICE_ROWS` | `DECISION_ROWS` |
| --- | --- | --- |
| `heading` | Pourquoi ces outils | Décisions d'architecture |
| `idPrefix` / `testIdPrefix` | `tech` / `tech-choice` | `decision` / `decision` |
| `first` | `techno`, « Outil », slug `techno`, « NestJS » | `decision`, « Décision », slug `text`, « Architecture hexagonale » |
| `second` | `why`, « Raison », slug `why`, « Pourquoi ce choix » | `rationale`, « Justification », slug `rationale`, « Justification » |
| `removeLabel` / `addLabel` | Supprimer le choix technique / Ajouter un choix technique | Supprimer la décision / Ajouter une décision |

- Dérivés dans le gabarit : `id` = `${idPrefix}-${rank}-${slug}` ; `data-testid` contrôle =
  `${testIdPrefix}-${slug}`, retrait `${testIdPrefix}-remove`, ajout `${testIdPrefix}-add` ; libellé
  `sr-only` « `${label} ${rank}` » ; nom du retrait « `${removeLabel} ${rank}` » ; rang sur deux
  chiffres. Erreur de cellule (F006, nouvelle) : `id` `${id}-error`, `data-testid`
  `${testIdPrefix}-${slug}-error`. Classes `repeatHeadClass`/`repeatRowClass` déplacées en ligne
  (un seul site chacune désormais).
- `@for (cell of cells(); track cell.row)` : le proxy de champ d'un élément est stable (nœud
  suivi par le symbole interne de Signal Forms) ; il remplace `track $index` (liste mutable,
  `CLAUDE.md`). Le rang reste calculé depuis `$index`.

**`AdminProjectIdentityFields`** — entrée `form = input.required<FieldTree<ProjectDraft>>()`.
Porte `categories`, `kinds` (déplacés du parent). Nature : le `fieldset` reçoit
`role="radiogroup"`, `[attr.aria-invalid]`, `[attr.aria-describedby]` → `project-kind-error`
(ADR-0016) ; `data-testid="admin-project-kind-error"` conservé.

**`AdminProjectPresentationFields`** — entrées `form` (idem), `persistedCover = input('')`,
`coverResetToken = input<number>()` ; sorties `coverSelected = output<File>()`,
`coverCleared = output<void>()`, `coverRejected = output<void>()`. Porte `presentation`
(+ `presentationText`), `selectCover`, `currentCoverAlt` (`form().title().value()`) et
`currentKind` (`form().kind().value() || null`). Le parent relaie les trois sorties.

**`AdminProjectForm`** après L6 — entrées/sorties : `value`, `tags`, `persistedCover`,
`coverResetToken`, `submitted`, `coverSelected`, `coverCleared`, `coverRejected`. Retirés :
`projectId`, `gallery`, `galleryChange`, les 4 méthodes de rangées, `selectCover`, les computed de
couverture. Gabarit : `<form>`, 4 fieldsets (identité, présentation, liens en ligne, choix
techniques = sélecteur d'étiquettes + 2 `app-admin-pair-rows`). Taille attendue ≈ 160 lignes
(estimation : imports ≈ 18, gabarit ≈ 90, classe ≈ 55) ; « ≈ 150 » est un ordre de grandeur, le
critère est « schéma + assemblage, aucune section de champs écrite en ligne hors Liens ».

### Réactivité

- Signals uniquement ; aucun `effect()`, aucun RxJS ajouté.
- `AdminPairRows.cells` : `computed`. `FieldError` : lecture directe de l'état du champ (signals).
- Galerie (P2b) : l'éditeur possède déjà `gallery = linkedSignal(...)` et `updateGallery()` ; il
  les branche lui-même.

### État partagé & coordination

Signals locaux. Aucun store, aucune facade, aucun gateway créé. `AdminProjectGallery` reste un îlot
autonome injectant `ProjectsGateway` (faux positif assumé de l'audit), désormais rendu par
l'éditeur et non plus par un composant muet.

### Choix de bibliothèques

Aucune dépendance ajoutée. Pas d'`axe` dans le dépôt : les vérifications ARIA se font par
attributs en test et à la main en revue.

### Tranches

Une tranche = un comportement franchissable ; les tranches marquées **sans RED** sont des refactors
à comportement constant (filet = specs existantes vertes, aucun test nouveau à écrire par `qa`).

**L3 — Utilitaires d'admin (PR 1)**

- **Tranche unique L3 — refactor de style, sans RED** : P6, P7, F018. Aucun spec ne lit ces
  classes (vérifié par l'audit). Preuve : `pnpm test` + `pnpm lint` + build verts, contrôle visuel
  des deux listes, de Messages et d'Audience. P7 change le rendu des deux boutons (bordure
  `foreground/15`, 15 px semi-gras, survol `text-primary`, comme « Annuler » de la barre
  d'enregistrement) : alignement voulu sur la seule définition du contour. Variantes conservées en
  ligne : `aria-disabled:cursor-not-allowed aria-disabled:opacity-55
  aria-disabled:hover:border-foreground/15 aria-disabled:hover:text-foreground` (Messages),
  `aria-pressed:border-primary` (Audience) ; les classes `focus-visible:*` locales sont retirées
  (l'anneau global `:where(a, button…):focus-visible` de `styles.css` les couvre).

**L5 — Champs de formulaire (PR 2)**

- **Tranche L5.1 — l'erreur d'un champ d'article est annoncée et reliée** : `FieldError` +
  adoption dans `admin-post-form.ts` (titre, extrait, contenu).
  - `field-error.spec.ts` (hôte de test avec un `form()` à un champ requis et un `maxLength`) :
    Given champ non touché When rendu Then aucun `[data-testid=x]` ; Given champ touché vide Then
    un `p` `role=alert`, `id` = `errorId`, texte = premier message ; `it.each` sur deux validateurs
    (requis, longueur) pour trianguler le message ; Given champ corrigé Then l'erreur disparaît ;
    Given `testId` absent Then pas d'attribut `data-testid`.
  - `admin-post-form.spec.ts` : `it.each` titre/extrait/contenu — Given champ vidé puis quitté Then
    `aria-invalid="true"`, `aria-describedby` désigne un élément dont le texte est « Ce champ est
    obligatoire » (`post-title-error`, `post-excerpt-error`, `post-content-error`) ; contenu :
    `aria-describedby` = `post-content-hint post-content-error` avec erreur, `post-content-hint`
    sans. `data-testid` `admin-post-*-error` inchangés.
- **Tranche L5.2 — sans RED** : `RequiredMark` et `REQUIRED_MESSAGE` dans `admin-post-form.ts` et
  `admin-image-alt-schema.ts`. Filet : `admin-post-form.spec.ts:172-176` (« Titre obligatoire »…)
  et `:281`, `admin-content-image-upload.spec.ts:133,145`. `required-mark.spec.ts` minimal (rend
  « obligatoire ») écrit par `qa` comme test de primitive, vert d'emblée — c'est assumé.
- **Tranche L5.3 — une soumission d'article invalide amène au premier champ fautif** :
  `focusFirstInvalid` + `onInvalid` dans `admin-post-form.ts` ; `contact-form.ts` passe à la
  fonction partagée (filet : `contact-form.spec.ts:147, 480, 538`).
  - `focus-first-invalid.spec.ts` (hôte avec 3 champs requis liés dans l'ordre a, b, c, et un
    champ requis **non lié**) : `it.each` [a vide → a], [a rempli → b], [a, b remplis → c] ; Given
    tout valide Then le focus ne bouge pas ; Given seul le champ non lié invalide Then rien ne
    lève.
  - `admin-post-form.spec.ts` : `it.each` sur l'événement `submit` du `<form>` : tout vide → titre
    focalisé ; titre rempli → extrait ; titre et extrait → contenu ; rien d'émis.
- **Tranche L5.4 — l'erreur du texte alternatif d'une capture est annoncée et reliée** :
  `admin-gallery-image-item.ts`, `admin-gallery-upload-form.ts` (ARIA absente aujourd'hui).
  - Given texte vidé puis quitté Then `aria-invalid="true"` et `aria-describedby` →
    `gallery-alt-<id>-error` (élément) / `gallery-upload-alt-error` ; `data-testid`
    `admin-gallery-item-alt-error` / `admin-gallery-upload-alt-error` conservés ; Given deux
    captures Then deux `id` d'erreur distincts.
- **Tranche L5.5 — sans RED** : `FieldError` dans `contact-form.ts` (4), les 5 formulaires d'auth
  (8) et `admin-content-image-upload.ts` (1). `errorId` reprend chaque `id` existant
  (`contact-*-error`, `login-*-error`, `twofa-*-error`, `<id>-alt-error`) : les specs qui les
  sélectionnent par `#id` (`login.spec.ts:47`, `password-change-form.spec.ts:57…`,
  `contact-form.spec.ts:112…`) restent vertes sans modification.

**L6 — Formulaire de projet (PR 3)**

- **Tranche L6.1 — une soumission de projet invalide amène au premier champ fautif** :
  `onInvalid: (field) => focusFirstInvalid(field)` dans `admin-project-form.ts` (F007).
  - `admin-project-form.spec.ts`, `it.each` sur l'événement `submit` du `<form id="project-form">`
    (chemin de la barre collante) : tout vide → `admin-project-title` ; titre rempli →
    `admin-project-category` ; titre + catégorie + description → premier radio de nature ;
    identité complète + une rangée « Pourquoi » ajoutée vide → `tech-choice-techno` ; rien n'est
    émis. Le focus se lit sur `document.activeElement`.
- **Tranche L6.2 — les rangées répétées deviennent une section et signalent leurs cellules
  vides** : `AdminPairRows` + `TECH_CHOICE_ROWS` / `DECISION_ROWS` + branchement ×2 ;
  `FieldError` et ARIA par cellule (F006).
  - `admin-pair-rows.spec.ts` (hôte avec `form()` sur `{ rows: { a: string; b: string }[] }`,
    `applyEach` requis) : en-tête `h2` = `heading` ; en-têtes de colonnes `aria-hidden` ; Given 2
    rangées Then libellés « A 1 », « A 2 », `id` `p-1-x`, `p-2-x`, rangs « 01 », « 02 » ; When
    ajout Then le modèle a une rangée vide de plus ; When retrait de la première Then la seconde
    devient « 01 » et le modèle n'a plus la première ; noms de retrait « `<removeLabel>` N » ;
    Given cellule vide quittée Then `p-1-x-error` `role=alert` + `aria-invalid`/`aria-describedby`.
  - `admin-project-form.spec.ts` : les 5 tests « lignes répétées » (619-739) restent verts sans
    changement de sélecteur ; nouveau : Given une rangée ajoutée vide When soumise Then
    `tech-choice-techno-error` et `tech-choice-why-error` affichées, rien d'émis.
- **Tranche L6.3 — les champs obligatoires de l'identité sont annoncés et reliés** :
  `AdminProjectIdentityFields` (extraction en refactor sous vert) ; `FieldError` + ARIA sur titre,
  catégorie, nature ; `RequiredMark` ×3 ; `REQUIRED_MESSAGE` dans le schéma du parent ;
  `app-select` invalide stylé.
  - `it.each` titre / catégorie : Given vidé puis quitté Then `aria-invalid="true"`,
    `aria-describedby` → `project-title-error` / `project-category-error`, `data-testid`
    `admin-project-title-error` / `admin-project-category-error` (nouveaux) ; nature : Given
    soumission sans nature Then `fieldset[data-testid=admin-project-kind]` a `role=radiogroup`,
    `aria-invalid="true"`, `aria-describedby="project-kind-error"`, et
    `admin-project-kind-error` porte cet `id`. Les tests « nature du projet » (303-420) et
    « sections numérotées » restent verts.
- **Tranche L6.4 — la description obligatoire est annoncée et reliée** :
  `AdminProjectPresentationFields` (extraction sous vert, couverture comprise) ; `FieldError` +
  ARIA sur la description ; `RequiredMark`.
  - Given description vidée puis quittée Then `aria-describedby` =
    `project-description-hint project-description-error`, `aria-invalid="true"`,
    `admin-project-description-error` ; sans erreur `aria-describedby` = `project-description-hint`.
    Filet : « présentation » (475-618) et « couverture » (775-840) inchangés.
- **Tranche L6.5 — la galerie est rendue par l'éditeur** (P2b) :
  - `admin-project-form.spec.ts` : `SECTION_CONTROLS` passe à 4 sections, toutes dans
    `project-form` ; Given le formulaire Then aucun `admin-project-gallery` ni
    `admin-project-gallery-pending` dans son hôte ; `renderForm` perd `projectId`/`gallery`/
    `galleries` (le bloc « galerie » 841-906 est retiré de ce fichier).
  - `admin-project-editor.spec.ts` : Given un projet enregistré Then une 5ᵉ section « 05 ·
    Galerie » suit le formulaire, hors de tout `<form>`, avant la barre d'enregistrement, et
    liste ses captures ; Given un nouveau projet Then `admin-project-gallery-pending`. Les tests
    « galerie » existants (733-778) et le sommaire (`#project-gallery`, 1052) restent verts.

Ordre : L5.1 → L5.2 → L5.3 → L5.4 → L5.5 ; L6.1 → L6.2 → L6.3 → L6.4 → L6.5. L6.1 vient d'abord
pour que les extractions suivantes se fassent sous le filet du focus.

### Lots, branches et intersection de fichiers

Règle 7 du workflow : « indépendantes » se prouve par
`git diff --name-only master...<branche>` à intersection vide entre PR ouvertes en même temps.

| Couple | Intersection attendue | Conséquence |
| --- | --- | --- |
| L3 ∩ L5 | `admin-gallery-upload-form.ts` | L5 part de `master` **après** le merge de L3. |
| L5 ∩ L6 | vide en fichiers, mais L6 **importe** `field-error.ts`, `required-mark.ts`, `required-message.ts`, `focus-first-invalid.ts` | L6 part de `master` après le merge de L5 (dépendance de compilation). |
| L3 ∩ L6 | `src/styles.css` (blocs distincts : `icon-link` / `app-select`) | Séquentiel de toute façon. |
| L1 ∩ L3 (hors plan) | `src/styles.css` (`icon-tile` / `icon-link`) | Merger L1 avant L3, ou rebaser L3. |
| L6 ∩ L8 (hors plan) | `admin-project-editor.ts` (+ spec) | L6 avant L8. |

Le chemin est donc **strictement séquentiel** : L3 → L5 → L6, une branche neuve depuis `master`
à chaque fois. Gates de chaque PR : `pnpm install --frozen-lockfile`,
`pnpm run build --configuration production`, `pnpm lint`, `pnpm test` en lisant le code de
sortie.

### Risques & inconnues

- **Nom accessible d'un `fieldset role="radiogroup"`** et `aria-invalid` sur ce groupe :
  happy-dom ne calcule pas les noms ; à contrôler dans un navigateur (lecteur d'écran ou panneau
  d'accessibilité) en revue de L6.3. Repli : `aria-describedby` seul sur le `fieldset`, sans rôle.
- **`track cell.row`** suppose la stabilité du proxy de champ d'un élément après retrait ; si elle
  n'est pas tenue, le rendu reste correct (DOM recréé), seul le gain de stabilité est perdu.
- **P7 change l'apparence** de deux boutons (bordure, taille, survol) ; L10 (hors plan) renommera
  `link-btn-*` : ces deux usages s'ajoutent au renommage.

### Questions ouvertes (non bloquantes, défauts posés)

- P7 : aligner les deux boutons sur `link-btn-outline` tel quel (défaut) ou garder leur graisse
  `font-medium text-sm` ?
- P4 : mention « obligatoire » hors du nom accessible (`aria-hidden`) ? Défaut : non (ADR-0016).
- `CLAUDE.md`, section « Formulaires » : citer `FieldError`, la convention ARIA et
  `focusFirstInvalid` (proposition de patch à valider par le propriétaire, protocole
  d'auto-révision ; touche le même fichier que L1/F023).

### Suite (hors de ce plan)

L1 (nettoyage), L2 (outillage et CI), L4 (formats de copie), L7 (toasts), L8 (coque d'éditeur,
après L6 et la décision F005), L9 (étiquettes en `FormValueControl`), L10 (boutons), L11
(couches).

## Plan de test

Lot **L5** joué en un seul RED (demande de la session principale). Commande : `pnpm test; echo
exit=$?` (`ng test`, typecheck des specs compris). Base avant RED : `182 passed (182)` fichiers,
`3034 passed (3034)` tests, exit 0.

**Échafaudage de signature (à remplacer en GREEN)** : `shared/ui/field-error.ts` (`FieldError`,
entrées `field`/`errorId`/`testId`, gabarit vide) et `shared/forms/focus-first-invalid.ts`
(`focusFirstInvalid`, corps vide). Sans eux, l'import manquant fait échouer la génération du
bundle (`TS2307`, vérifié) et **aucun** test ne tourne ; avec eux, les échecs restent localisés et
sont tous des assertions. Aucun comportement n'y est écrit : `angular-expert` les implémente.

### Tranche L5.1 — l'erreur d'un champ d'article est annoncée et reliée

**`shared/ui/field-error.spec.ts`** (nouveau, hôte avec `form()` : `required`, un second
validateur sur la valeur vide, `maxLength` 5 ; 5 tests)

| Test | Scénario | Assertions clés |
| --- | --- | --- |
| non touché | champ vide, jamais quitté | aucun `[data-testid=name-error]`, aucune `role=alert` |
| message (`it.each` × 2) | vide quitté ; « abcdef » quitté | une seule alerte : `P`, `id` `name-error`, `data-testid` `name-error`, texte = **premier** message (« Le nom est obligatoire » malgré le second validateur ; « 5 caractères au plus ») |
| corrigé | vide quitté puis « Alice » | plus d'erreur ni d'alerte |
| sans `testId` | `testId` `undefined` | une alerte `id` `name-error`, sans attribut `data-testid` |

**`admin-post-form.spec.ts`**, describe « erreur de champ annoncée et reliée » (7 tests)

| Test | Scénario | Assertions clés |
| --- | --- | --- |
| erreur reliée (`it.each` titre / extrait / contenu) | article édité, champ vidé puis quitté | `aria-invalid="true"` ; `aria-describedby` = `post-title-error` / `post-excerpt-error` / `post-content-hint post-content-error` ; l'élément désigné porte `data-testid` `admin-post-*-error`, `role=alert`, « Ce champ est obligatoire » |
| au rendu (`it.each` × 3) | article édité | `aria-invalid="false"` ; `aria-describedby` absent (titre, extrait) / `post-content-hint` (contenu) |
| contenu repris | contenu vidé quitté puis « # Repris » | `aria-invalid="false"`, `aria-describedby` = `post-content-hint`, plus de `#post-content-error` |

RED confirmé via `pnpm test` le 2026-10-08 19:37 : 10 failed / 3060 total pour cette tranche (12
tests neufs, 2 verts d'emblée : « non touché » et « corrigé » de `FieldError`, gardes contre le
faux affichage). Échecs = assertions (`expected [] to deeply equal [...]`, `invalid: null` au lieu
de `'true'`/`'false'`), aucune erreur de harnais.

### Tranche L5.3 — une soumission d'article invalide amène au premier champ fautif

**`shared/forms/focus-first-invalid.spec.ts`** (nouveau, hôte avec a, b, c liés dans cet ordre,
clés du modèle dans l'ordre inverse, `unbound` requis non lié, focus initial sur un bouton
« ailleurs » ; 6 tests)

| Test | Scénario | Assertions clés |
| --- | --- | --- |
| premier fautif (`it.each` × 4) | tout vide ; a rempli ; a et b remplis ; b et `unbound` vides | focus sur `a` ; `b` ; `c` ; `b` (un champ non lié passe après les liés) |
| tout valide | a, b, c remplis | focus reste sur `elsewhere` |
| seul le non lié invalide | `unbound` vide | ne lève pas ; focus reste sur `elsewhere` |

**`admin-post-form.spec.ts`**, describe « soumission invalide » (`it.each` × 3, événement `submit`
du `<form>`) : nouvel article tout vide → `admin-post-title` ; titre rempli → `admin-post-excerpt` ;
titre et extrait → `admin-post-content` ; `document.activeElement`, rien d'émis.

Filet de la bascule de `contact-form.ts` : `contact-form.spec.ts` existant (focus sur `#name`), vert.

RED confirmé via `pnpm test` le 2026-10-08 19:37 : 7 failed / 3060 total pour cette tranche (9
tests neufs ; les 2 gardes « tout valide » et « seul le non lié » passent contre l'échafaudage
vide, c'est attendu). Échecs = assertions (`expected 'elsewhere' to be 'a'`, `focused: null`).

### Tranche L5.4 — l'erreur du texte alternatif d'une capture est annoncée et reliée

**`admin-project-gallery.spec.ts`**, describe « erreur du texte alternatif annoncée et reliée »
(5 tests ; placés dans le spec existant qui rend déjà les deux formulaires de galerie, avec son
harnais, plutôt que dans deux specs neufs)

| Test | Scénario | Assertions clés |
| --- | --- | --- |
| erreur reliée (`it.each` capture 2 / formulaire d'ajout) | texte vidé puis quitté | `aria-invalid="true"` ; `aria-describedby` = `gallery-alt-img-b-error` / `gallery-upload-alt-error` ; l'élément désigné porte `admin-gallery-item-alt-error` / `admin-gallery-upload-alt-error`, `role=alert`, « Ce champ est obligatoire » |
| au rendu (`it.each` × 2) | rien saisi | `aria-invalid="false"`, `aria-describedby` absent |
| deux captures | textes 1 et 2 vidés puis quittés | `gallery-alt-img-a-error`, `gallery-alt-img-b-error`, chacun contenu dans sa propre capture |

RED confirmé via `pnpm test` le 2026-10-08 19:37 : 5 failed / 3060 total pour cette tranche (5
tests neufs). Échecs = assertions (`invalid: null`, `describedBy: null`).

### Sans RED : L5.2 et L5.5

- **L5.2** : aucun test écrit. Le plan prévoit un `required-mark.spec.ts` « vert d'emblée », ce qui
  est impossible tant que `required-mark.ts` n'existe pas (import manquant = bundle en échec), et
  `RequiredMark` est purement présentationnel, déjà couvert par le parent
  (`admin-post-form.spec.ts`, libellés « Titre obligatoire »…). Filet : specs existantes citées par
  le plan.
- **L5.5** : aucun test écrit ; filet = specs existantes qui sélectionnent les `id` d'erreur.

Total du lot : 22 failed / 3060 total (4 fichiers en échec sur 184), exit 1 ; les 3034 tests de la
base restent verts.

## Journal des tranches

- **Tranche L5.1 — l'erreur d'un champ d'article est annoncée et reliée** : GREEN 3059 passed / 3060 total (seul rouge : « sans testId » de `field-error.spec.ts`, défaut du test, cf. ## Verify) · refactor : aucun
- **Tranche L5.2 — sans RED** : GREEN inchangé (filet `admin-post-form.spec.ts`, `admin-content-image-upload.spec.ts`) · refactor : `RequiredMark` ×3 et `REQUIRED_MESSAGE` (2 consommateurs : `admin-post-form.ts`, `admin-image-alt-schema.ts`)
- **Tranche L5.3 — une soumission d'article invalide amène au premier champ fautif** : GREEN 3059 passed / 3060 total · refactor : `focusFirstInvalidField` privé du contact supprimé au profit de `focusFirstInvalid`
- **Tranche L5.4 — l'erreur du texte alternatif d'une capture est annoncée et reliée** : GREEN 3059 passed / 3060 total · refactor : aucun
- **Tranche L5.5 — sans RED** : GREEN 3059 passed / 3060 total · refactor : prédicat « erreur affichée » lu une fois par `@let <champ>InError` dans le contact, l'auth et l'insertion d'image (il était écrit deux à trois fois par champ)

## Verify

Lot L5 entier, 2026-10-08, branche `refactor/form-fields-l5` (non commitée).

Gates (codes de sortie lus) :

- `pnpm test; echo exit=$?` → `Test Files 1 failed | 183 passed (184)`, `Tests 1 failed | 3059 passed (3060)`, **exit=1**. Seul rouge :
  `field-error.spec.ts` « Given no testId … no data-testid ». Défaut du test, pas de l'implémentation :
  `renderHost(testId: string | undefined = 'name-error')` appelé avec `undefined` explicite applique
  la valeur par défaut, l'hôte reçoit donc `'name-error'`. Preuve : copie temporaire du spec (supprimée
  ensuite) où l'appel passe une sentinelle convertie en `undefined` → 5 passed / 5.
  Corrigé ensuite dans le harnais (paramètre `string | null`, appel `renderHost(null)`) : rejoué,
  `Tests 3060 passed (3060)`, **exit=0**.
- `pnpm lint; echo exit=$?` → `All files pass linting.`, **exit=0**.
- `pnpm exec prettier --check <15 fichiers touchés>` → `All matched files use Prettier code style!`, **exit=0**.
- `pnpm run build --configuration production; echo exit=$?` → `Prerendered 20 static routes.`, **exit=0** ;
  puis `git checkout -- public/sitemap.xml public/rss.xml`.

Runtime (`ng serve`, API de prod en lecture via un proxy temporaire hors dépôt ; aucune soumission valide) :

1. `/` (formulaire dans un `@defer (hydrate on viewport)`), défiler jusqu'au contact, vider « Nom » puis
   quitter → `aria-invalid="true"`, `aria-describedby="contact-name-error"`, `p#contact-name-error`
   « Le nom est obligatoire ». Focus sur « Sujet », soumettre → focus sur `#name`, 4 alertes
   (`contact-name/email/subject/message-error`). **PASS**.
2. `/offre-site-industrie` (contact sans `@defer`) : mêmes étapes → même résultat, focus sur `#name`. **PASS**.
3. `/login` : vider « Email » puis quitter → `aria-invalid="true"`, `aria-describedby="login-email-error"`,
   `p#login-email-error` « L'email est obligatoire ». **PASS**.
4. Capture : contact de l'accueil après soumission invalide, 4 erreurs sous leurs champs (capture
   d'écran prise dans le panneau navigateur de la session).
5. Console (onglet neuf) : une seule erreur, `InvalidStateError: Transition was aborted…` (View
   Transitions), présente à l'identique sur `master` servi dans les mêmes conditions : préexistante.
   Aucune `NG0xxx`.

Formulaires d'admin (article, galerie, insertion d'image) : non joués au navigateur (authentification
requise) ; couverts par `admin-post-form.spec.ts`, `admin-project-gallery.spec.ts`,
`admin-content-image-upload.spec.ts`, verts.

## Review code

Lot L5, 2026-10-08, diff de travail `git diff master` + fichiers non suivis (`field-error.ts`(+spec),
`shared/forms/focus-first-invalid.ts`(+spec), `required-mark.ts`, `required-message.ts`).

**Verdict** : APPROVED
**Gates CI locaux** : tests ✅ (`pnpm test` → 184 fichiers / 3060 tests passés, exit=0) / lint ✅ (`pnpm lint` → `All files pass linting.`, exit=0) / build ✅ (`pnpm run build --configuration production` → `Prerendered 20 static routes.`, exit=0, puis `git checkout -- public/sitemap.xml public/rss.xml`)
**Checks mécaniques** : checker non vendoré (`.claude/checks/aak-checks.sh` absent) : auto-checks joués à la main sur le diff (export default, effect, helpers zone, archéologie, tests interdits, sécurité, snapshot) : 0 hit
**Warnings de gate** : aucun (test, lint et build relus en entier)
**Rendu compilé** : N/A (pas de composant à sélecteur attribut ; `app-field-error` est un sélecteur élément)
**Preuve de verify runtime** : ✅ (section `## Verify` cohérente avec le diff, rejouée en `ng serve` API injoignable : `/` contact hydraté, soumission vide → focus `#name`, 4 alertes reliées, `aria-invalid="true"`)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅ (écart `required-mark.spec.ts` non écrit, motivé au `## Plan de test` : composant présentationnel couvert par son parent)

**Tests notables** :
- ✨ `focus-first-invalid.spec.ts` — clés du modèle dans l'ordre inverse du DOM : épingle l'ordre des contrôles liés, pas celui du modèle.
- ✨ `admin-project-gallery.spec.ts` « deux captures » — vérifie que chaque `aria-describedby` désigne une erreur contenue dans sa propre capture (collision d'`id` attrapée).

**Risque résiduel** (advisory) :
- NG0950 signalée en `ng serve` API injoignable : non reproduite (5 essais, avec et sans HMR, 502 immédiat et différé de 4 s, défilement avant et après l'échec, CTA d'en-tête). Seule erreur Angular observée, identique sur `master` : `ResourceValueError` levée par `home.ts:124` (`computed(() => this.bundleResource.value())` lit une ressource en erreur). `FieldError` reçoit des liaisons statiques posées par la passe de mise à jour de `ContactForm` avant son propre rafraîchissement, le même contrat que `ContactInfoPanel` (`input.required`, lu dans le gabarit) sur `master`. Une NG0950 ne peut venir que d'une passe parente interrompue, donc en cascade de cette exception préexistante, hors diff.
- Préexistant, risque produit : en prod, une API en échec côté client lève la même `ResourceValueError` dans `Home` (accueil). À traiter dans une PR séparée.
