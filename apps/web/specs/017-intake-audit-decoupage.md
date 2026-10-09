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

Périmètre : chemin critique **L3 → L5 → L6** de l'audit (le formulaire de projet découpé), puis
**L4 → L7** (cf. « Lots L4 et L7 », en fin de plan). L1, L2, L8 à L11 sont hors de ce plan (cf.
« Suite »). Décisions transverses : cf. **ADR-0016** (erreur de champ partagée, convention ARIA des
champs, focus sur soumission invalide).

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

L1 (nettoyage), L2 (outillage et CI), L8 (coque d'éditeur, après L6, L7 et la décision F005),
L9 (étiquettes en `FormValueControl`), L10 (boutons), L11 (couches).

### Lots L4 et L7 (ajout, master `61c02d6`)

#### Vérification des références de l'audit (P9, P5d)

- `pluralize` : **10 importeurs, tous dans l'admin** (`audience-view`, `admin-audience`,
  `admin-page-copy`, `audience-report`, `overview-copy`, `overview-view`, `admin-messages-view`,
  `components/overview-audience`, `components/admin-save-bar`, `components/overview-contacts`).
  L'audit annonce « dont 1 hors admin » : **inexact**, le blog l'écrit à la main
  (`blog-list-copy.ts:17, 29-30`, exacts) ; c'est L4 qui crée le premier consommateur hors admin.
- `groupedNumber` (`overview-view.ts:60`, `GROUPED` l. 37, `NNBSP` l. 35) : 8 importeurs,
  **exact** (`audience-view`, `admin-audience`, `admin-cv-view`, `audience-report`,
  `overview-copy`, `components/overview-audience`, `components/audience-chart`,
  `components/audience-share-table`), plus son propre fichier.
- `formatFileSize` : **3 importeurs** et non 2 (`shared/ui/file-dropzone.ts:18`,
  `admin-cv-view.ts:3`, `admin-page-copy.ts:9`).
- `counted` : `admin-page-copy.ts:35-36` (sans groupement) et `overview-view.ts:56-57` (avec),
  **exacts**. `messagesOverline` écrit en plus `${messages.length} au total` sans groupement
  (l. 54), non relevé par l'audit.
- Toasts : **18 littéraux** `summary` et non 17 — `admin-messages.ts` 164, 171, 194, 200, 221,
  229 ; `admin-cv.ts` 184, 204, 214, 231, 237 ; `admin-blog.ts` 198, 204 ; `admin-projects.ts`
  155, 162 ; `admin-project-gallery.ts:173` ; `login.ts:167` (et non 178) ;
  `core/interceptors/error-toast.ts:26`. Tous valent exactement « Succès » (success) ou
  « Erreur » (error). Le contact garde ses 3 titres (`contact-form.ts:310, 313, 318`).
- `ToastMessage.summary` est **déjà facultatif** (`toast.types.ts:5`) ; ce qui manque est la
  valeur par défaut. `ToastEntry.summary` est facultatif aussi et le gabarit le garde par
  `@if (msg.summary)` (`toast.ts:71`).
- Il n'existe **pas** de `toast-store.spec.ts` : la règle se teste là, pas dans `toast.spec.ts`
  (qui rend des entrées déjà construites).

#### Architecture

Aucune couche nouvelle, aucun état partagé. L4 : fonctions pures dans un nouveau dossier
`shared/format/` (précédent : `shared/forms/` créé par L5 pour une fonction pure), un concept par
fichier. L7 : la règle « titre par sévérité » vit dans `ToastStore.add()`, seul point d'entrée des
toasts ; les consommateurs ne passent plus que `severity` et `detail`.

- **Emplacement de `groupedNumber` et `counted`** : leurs consommateurs sont tous dans l'admin
  aujourd'hui. Ils vont quand même dans `shared/format/`, à côté de `pluralize` (qui, lui, sert
  admin **et** blog) : `counted` compose les deux, et le séparer de ses briques couperait la
  famille en deux dossiers. Choix assumé, pas d'abstraction nouvelle (fonctions pures).
- **`capitalize.ts` et `with-first-of-month.ts`** (admin) ne bougent pas : un seul domaine
  consommateur, hors du périmètre de P9.
- **Blog** : adopte `pluralize` **seul**. Il garde son espace insécable entre le nombre et le nom
  (`${count}${NBSP}…`) et ne groupe pas : sortie inchangée (`blog-list-copy.spec.ts`). Divergence
  explicite avec `counted` (espace simple, groupement), cf. question ouverte.
- **Compile-time** : les titres par défaut sont un `Record<ToastSeverity, string>` exhaustif ;
  ajouter une sévérité à l'union sans titre casse la compilation, aucun `if` runtime.

#### Fichiers — lot L4 (PR « formats de copie »)

| Fichier | Rôle |
| --- | --- |
| `shared/format/pluralize.ts` (+ `.spec.ts`) | Déplacé (`git mv`) depuis `features/admin/application/`, contenu et spec inchangés. |
| `shared/format/grouped-number.ts` (+ `.spec.ts`) | `groupedNumber` extrait d'`overview-view.ts` avec `GROUPED`, `NNBSP` et le commentaire ICU. Spec nouvelle. |
| `shared/format/format-file-size.ts` (+ `.spec.ts`) | Déplacé (`git mv`) depuis `shared/ui/`, inchangé. |
| `shared/format/counted.ts` (+ `.spec.ts`) | `counted(count, singular, plural)` = `` `${groupedNumber(count)} ${pluralize(count, singular, plural)}` `` : la seule définition. |
| `features/admin/application/overview-view.ts` | Perd la définition de `groupedNumber` et ses constantes `GROUPED`, `NNBSP` (seul usage, l. 61) ; l'importe depuis `@shared/format/grouped-number` (encore utilisé l. 91, 99, 124, 132). Son `counted` local est supprimé en L4.2. |
| `features/admin/application/admin-page-copy.ts` (+ spec) | `counted` local supprimé, import partagé ; `${messages.length} au total` → `groupedNumber(...)`. **Changement visible** : « 1234 » → « 1 234 » (espace fine insécable). |
| `features/admin/application/admin-messages.ts` | `markAllRead` : pluriel manuscrit (218-222) → `counted(count, 'message marqué comme lu', 'messages marqués comme lus')`. |
| `features/blog/application/blog-list-copy.ts` | `articleCountLabel`, `visibleArticleCountLabel` → `pluralize` (sortie inchangée). |
| `features/admin/application/{audience-view,audience-report,overview-copy}.ts`, `components/overview-audience.ts` | Import `@shared/format/*` ; le motif `${groupedNumber(n)} ${pluralize(n, …)}` devient `counted(n, …)` (audience-view 51 et 58, audience-report 105, overview-copy 35, 38 et 48, overview-audience 71) : sortie identique. |
| `features/admin/application/{admin-messages-view.ts, components/admin-save-bar.ts}` | `${n} ${pluralize(n, …)}` → `counted(n, …)` (identique sous 1 000, groupé au-delà). |
| `features/admin/application/{admin-audience,admin-cv-view}.ts`, `components/{audience-chart,audience-share-table,overview-contacts}.ts`, `shared/ui/file-dropzone.ts` | Chemins d'import seulement. |
| `features/admin/application/pluralize.ts` (+ spec), `shared/ui/format-file-size.ts` (+ spec) | Supprimés par le déplacement. |

#### Fichiers — lot L7 (PR « toasts »)

| Fichier | Rôle |
| --- | --- |
| `shared/ui/toast-store.ts` | `DEFAULT_SUMMARY: Record<ToastSeverity, string>` = success « Succès », info « Information », warn « Attention », error « Erreur » ; `add()` pose `summary: message.summary ?? DEFAULT_SUMMARY[severity]`. |
| `shared/ui/toast-store.spec.ts` | Nouveau. |
| `shared/ui/toast.types.ts` | `ToastEntry.summary` devient obligatoire (`string`). `ToastMessage` inchangé (déjà facultatif). |
| `shared/ui/toast.ts` | `@if (msg.summary)` retiré (le titre est toujours présent). |
| `features/admin/application/{admin-messages,admin-cv,admin-blog,admin-projects}.ts`, `components/admin-project-gallery.ts`, `features/auth/application/login.ts`, `core/interceptors/error-toast.ts` | Les 18 `summary` littéraux retirés. |
| `features/admin/application/admin-cv.spec.ts`, `components/admin-project-gallery.spec.ts` | 6 assertions (`admin-cv.spec.ts:351, 381` ; gallery 419, 517, 697, 810) qui figent `summary: 'Erreur'/'Succès'` dans l'appel à `add()`. |
| **Non touchés** | `contact-form.ts` (titres propres) ; `notify()` d'`admin-project-editor.ts:369` et d'`admin-post-editor.ts:292` (L8, attend l'arbitrage F005). |

#### Réactivité / état

L4 : aucun signal ajouté, fonctions pures. L7 : `ToastStore.messages` inchangé (le profil ne pose
pas de clé d'immutabilité ; on ne change pas son exposition dans ce lot, hors périmètre P5d).

#### Tranches

Leçon L5/L6 pour `qa` : **un import vers un module absent fait échouer la génération du bundle
(`TS2307`) et aucun test ne tourne**. Tout fichier nouveau qu'un spec RED importe reçoit au RED
un **squelette de signature** (export typé, corps neutre, aucun comportement), à remplacer en
GREEN ; les échecs restent alors des assertions localisées. Seconde leçon (L6.2) : un attendu ne
se construit pas sur des objets partagés que Signal Forms marque — sans objet ici (aucun
formulaire), à garder en tête.

**L4 — Formats de copie**

- **Tranche L4.1 — déplacement, sans RED** : `pluralize` et `format-file-size` déplacés par
  `git mv` (specs comprises), `groupedNumber` extrait dans `shared/format/grouped-number.ts`, tous
  les importeurs repointés (tableau ci-dessus). Structure porteuse des tranches suivantes ; aucune
  sortie ne change. Filet : `pluralize.spec.ts`, `format-file-size.spec.ts` (déplacés),
  `overview-view.spec.ts`, `audience-view.spec.ts`, `overview-audience.spec.ts`,
  `audience-share-table.spec.ts`, `audience-chart.spec.ts`, `admin-cv-view.spec.ts` (ils
  assertent déjà `1 234` / `1 500`). Preuve : `pnpm test; echo exit=$?` = même total
  qu'avant, exit 0 ; `grep -rn "application/pluralize\|ui/format-file-size\|groupedNumber.*overview-view" src` vide.
- **Tranche L4.2 — les compteurs des en-têtes d'admin groupent les milliers** : `counted`
  partagé, adopté par `admin-page-copy.ts` et `overview-view.ts` (locaux supprimés) ;
  `au total` groupé.
  - **Squelette RED** : `shared/format/counted.ts` exportant
    `counted(count: number, singular: string, plural: string): string` au corps `return ''`.
  - `counted.spec.ts` : `it.each` [0 → « 0 projet »], [1 → « 1 projet »], [2 → « 2 projets »],
    [1234 → « 1 234 projets »], [1500000 → « 1 500 000 projets »].
  - `grouped-number.spec.ts` (primitive déplacée sans spec directe, vert d'emblée — assumé, même
    statut que `required-mark.spec.ts` en L5.2) : `it.each` 0, 999, 1234, 12345 ; aucun espace
    autre que U+202F dans la sortie.
  - `admin-page-copy.spec.ts` : cas ajoutés aux `it.each` existants — `projectsOverline` 1234
    réalisations dont 1000 en avant → « 1 234 réalisations · 1 000 mises en avant » ;
    `postsOverline` 1000 publiés et 234 brouillons → « 1\u202f234 articles · 1\u202f000 publiés · 234 brouillons » ; `messagesOverline` 1200 non lus, 34 lus →
    « 1 200 non lus · 1 234 au total ». RED attendus : ces trois cas (sortie actuelle
    « 1234 ») et les 5 cas de `counted.spec.ts` (le squelette rend `''`) ; tout le reste vert.
- **Tranche L4.3 — adoption, sans RED** : `counted` dans `audience-view`, `audience-report`,
  `overview-copy`, `overview-audience` (sortie identique), `admin-save-bar`,
  `admin-messages-view` (identique sous 1 000) ; `admin-messages.ts` `markAllRead` ;
  `blog-list-copy.ts` → `pluralize`. Filet : `audience-view.spec.ts`, `audience-report.spec.ts`,
  `overview-copy.spec.ts`, `overview-audience.spec.ts`, `admin-save-bar.spec.ts`,
  `admin-messages-view.spec.ts`, `admin-messages.spec.ts` (`severities` seulement : le texte du
  succès n'y est pas asserté, il reste « 2 messages marqués comme lus »), `blog-list-copy.spec.ts`.
  Preuve de fin de lot : `grep -rnE "> 1 \? 's'" src` vide ; `grep -rn "const counted" src` vide.

Ordre : L4.1 → L4.2 → L4.3.

**L7 — Toasts** (branche neuve depuis `master` **après** le merge de L4)

- **Tranche L7.1 — un toast sans titre prend celui de sa sévérité** : `DEFAULT_SUMMARY` dans
  `ToastStore.add()`, `ToastEntry.summary` obligatoire, `@if` du gabarit retiré.
  - Pas de squelette : `toast-store.ts` existe.
  - `toast-store.spec.ts` (`TestBed.inject(ToastStore)`, `life: 0` pour n'armer aucun minuteur) :
    `it.each` success/info/warn/error — Given `add({ severity, detail })` Then
    `messages()[0].summary` = « Succès » / « Information » / « Attention » / « Erreur » ;
    Given `add({ detail })` Then sévérité `info` et titre « Information » ; Given
    `add({ severity: 'success', summary: 'Message envoyé' })` Then le titre fourni est gardé.
    RED attendus : les 5 premiers (titre `undefined` aujourd'hui) ; le dernier est vert d'emblée
    (non-régression du contact, assumé).
  - `admin-cv.spec.ts` (351, 381) et `admin-project-gallery.spec.ts` (419, 517, 697, 810) :
    projeter les appels sur `{ severity, detail }` (même forme que l'aide `toasts()` des specs
    d'éditeur, `admin-project-editor.spec.ts:161`) au lieu de figer `summary`. Verts avant et
    après : le titre est désormais prouvé par `toast-store.spec.ts`, plus par chaque appelant.
- **Tranche L7.2 — retrait des littéraux, sans RED** : les 18 `summary` retirés (fichiers
  ci-dessus). Les titres affichés sont identiques (défauts = littéraux retirés). Filet :
  `admin-messages.spec.ts`, `admin-blog.spec.ts`, `admin-projects.spec.ts`, `admin-cv.spec.ts`,
  `admin-project-gallery.spec.ts`, `login.spec.ts`, `error-toast.spec.ts`, `contact-form.spec.ts`
  (titre propre conservé). Preuve de fin de lot :
  `grep -rn "summary: '" src | grep -v '\.spec\.ts'` ne liste plus que les 3 titres du contact
  (les `notify()` d'éditeur passent par un tableau local, hors de ce motif, et restent pour L8).

Ordre : L7.1 → L7.2.

#### Changements visibles

- L4 : nombres ≥ 1 000 des sous-titres d'en-tête d'admin (Réalisations, Articles, Messages) et du
  total de messages groupés par une espace fine insécable ; toast « tout marquer comme lu »,
  barre d'enregistrement et âge des messages groupés au-delà de 999. Rien sous 1 000. Blog
  inchangé.
- L7 : aucun (titres par défaut = littéraux retirés). Un toast `info` sans titre afficherait
  « Information » ; aucun appelant n'en émet aujourd'hui.

#### Intersection de fichiers L4 ∩ L7

| Couple | Intersection | Conséquence |
| --- | --- | --- |
| L4 ∩ L7 | **`admin-messages.ts`**, même littéral d'objet (`markAllRead`, l. 218-222 : L4 réécrit `detail`, L7 retire `summary` deux lignes plus haut) | **Confirmé** : conflit textuel certain en parallèle. L7 part de `master` après le merge de L4. `admin-cv.ts` (L7) ≠ `admin-cv-view.ts` (L4) : pas d'intersection. |
| L4 ∩ L8 / L7 ∩ L8 | vide en fichiers (L7 ne touche pas les éditeurs) | L8 dépend de L7 **sémantiquement** : le retrait de `notify()` suppose le titre par défaut. |
| L4, L7 ∩ L1/L2 | vide (`styles.css`, outillage non touchés) | Indépendants. |

Gates de chaque PR : `pnpm install --frozen-lockfile`, `pnpm run build --configuration
production`, `pnpm lint`, `pnpm test; echo exit=$?` (code de sortie lu, pas le résumé).

#### Risques & inconnues

- **Titre « Information »** pour `info` : choisi pour l'exhaustivité du `Record`, aucun appelant ;
  à valider en revue si un autre libellé est préféré.
- **`counted` à espace simple** vs blog à espace insécable : deux typographies du « nombre + nom »
  coexistent (admin / public). Défaut : on ne touche pas le blog (sortie inchangée demandée par
  l'audit). Question ouverte : `counted` doit-il passer à l'insécable (≈ 30 attendus de specs
  d'admin à réécrire) ?
- **ICU du runner** : `groupedNumber` normalise tout blanc en U+202F ; ses tests restent stables
  quel que soit l'ICU de Node, c'est précisément le rôle du `replace`.

### Lot L8 — Coque d'éditeur (ajout, branche `refactor/editor-shell-l8` empilée sur L7 #188)

Décisions utilisateur du 2026-10-08, appliquées ici :

- **F005** : en mise à jour d'un projet, un échec d'envoi de la couverture **n'annule plus**
  l'enregistrement. On écrit, puis on envoie l'image, puis on avertit en cas d'échec. Les deux
  éditeurs suivent le même ordre en création et en mise à jour.
- **P5b** : sur un 404, l'éditeur de projet affiche un état **« introuvable »** (message et lien
  retour vers la liste), comme l'article.

#### Vérification des références de l'audit (branche L8, `e661067`)

L6 a ajouté la galerie dans `admin-project-editor.ts` (373 lignes, et non 349). Ses numéros de
ligne ont donc tous bougé. Ceux d'`admin-post-editor.ts` (296 lignes) et d'`admin-page-header.ts`
sont exacts.

| Réf. audit | Projet, audit → actuel | Article |
| --- | --- | --- |
| En-tête (F003, P5a) | 79-130 → **83-134** | 57-95, exact |
| États et grille (P5b) | 132-209 → **136-222** | 97-165, exact (lien retour 155-165, après le `@switch`) |
| Dialogue de sortie | 200-209 → **224-233** | 167-176, exact |
| Brouillon (F004) | 225-275 → **256-299** | 201-241, exact |
| `rejectCover` | 271-275 → **295-299** | 237-241, exact |
| Remise à zéro | 334-338 → **358-362** (`markSaved`) | 264-267, exact |
| `notify()` | 345-348 → **369-372** | 292-295, exact |
| Couverture (F005) | création 300-313 → **316-342**, mise à jour 320/323 → **344-356** (envoi l. 347, avant le `PATCH` l. 348) | 244-290, exact |

- Le projet n'a **pas** d'état `empty` : `loadState(this.projectResource, () => false)` (l. 254).
  Son lien retour n'existe que dans `@case ('error')` (155-163). L'article le pose après le
  `@switch`, pour `error` **et** `empty` (155-165).
- `uploadImage` et `uploadCoverImage` renvoient la **clé** de stockage (`res.key`), pas une URL
  résolue (`http-projects.gateway.ts:83-89`, `http-blog.gateway.ts:80-88`). Pour afficher la
  nouvelle couverture après l'envoi, il faut donc **relire** l'entité. L'article le fait déjà
  (`postsResource.reload()`, l. 262).
- `getProjectById` n'a qu'un seul consommateur, l'éditeur. Un `GET` en 404 ne déclenche pas de
  toast : `errorToastInterceptor` le laisse passer (`error-toast.ts:20-22`).
- `AdminPageHeader` est utilisé par 7 pages. 4 d'entre elles appellent `focusTitle()` après un
  dialogue de suppression (`admin-projects.ts:139`, `admin-blog.ts:184`, `admin-cv.ts:212`,
  `admin-messages.ts:172`). `overline` est `input.required`. Les éditeurs n'ont pas de `tabindex`
  sur leur `h1`. Seul celui de l'article porte `text-balance`.
- `data-testid` de la coque lus par les specs : **18 références** dans chaque spec d'éditeur
  (`admin-page-title` ×5, `admin-breadcrumb*` ×5 côté projet et ×4 côté article,
  `admin-*-editor-loading/back/missing`, `admin-*-aside`, `admin-*-preview-link`,
  `admin-project-public-link`, `load-error*`). Aucun autre fichier de `src/` ni de la doc ne les
  lit.

#### Verdict KISS par morceau

| Morceau | Verdict | Raison |
| --- | --- | --- |
| P5a, en-tête | **Gardé, mais réduit** : pas d'emplacement projeté. `AdminPageHeader` reçoit une entrée facultative `parent`. Quand elle est fournie, il rend le fil d'Ariane à la place de l'`overline`. | Le dernier élément du fil d'Ariane, c'est le titre lui-même. Dans l'en-tête, il se déduit de `heading()` au lieu d'être recopié par chaque éditeur. On évite ainsi un composant `AdminBreadcrumb` et un emplacement à contenu de repli. |
| P5c, `editor-draft.ts` | **Gardé, et élargi** à l'ordre d'enregistrement (`save()`). | L'audit recommande, pour F005, d'« écrire une seule fois » cet ordre. C'est justement la logique qui a divergé (F005). Avec `save()`, elle vit en un seul endroit et se teste sans TestBed. Les appels au gateway, les toasts, l'invalidation des caches et la navigation restent dans les éditeurs. |
| P5b, `admin-editor-frame.ts` | **Gardé**, sans spec dédiée. | Gain net modeste : environ 60 lignes de moins par éditeur, contre environ 95 lignes de cadre. Ce qui le justifie : la machine d'états (chargement, erreur, introuvable, lien retour) s'écrit une fois, alors qu'elle a déjà divergé (lien retour) et qu'elle grandirait encore avec la décision 2. Ses deux consommateurs testent déjà tous les états : un `admin-editor-frame.spec.ts` dupliquerait ces tests. |
| Retrait de `notify()` | **Fait** | Le titre par défaut de L7 rend ce tableau local inutile. |

#### Architecture

```mermaid
flowchart TD
  E[AdminProjectEditor / AdminPostEditor — resource, gateway, toasts, caches, navigation]
  E -->|"[heading] [parent] + intro + actions [adminPageAside]"| H[AdminPageHeader — fil d'Ariane ou overline, h1 tabindex=-1]
  E -->|"[state] [copy] [leaveAsked] (retry) (leaveAnswered) + ng-template #editorForm / #editorAside"| F[AdminEditorFrame — chargement, erreur, introuvable, retour, grille, dialogue]
  E -->|"new EditorDraft({ loaded, toDraft, sections })"| D[EditorDraft — saved, value, tags, couverture, changes, toc, leave, save()]
  D --> C[countChangedFields / toFormTocEntries / LeaveConfirmation — existants]
  E -->|"getProjectById → Project | null"| G[ProjectsGateway]
```

- **Pas de presenter, pas de facade, pas de store.** `EditorDraft` est un **objet par instance**,
  créé dans un initialiseur de champ (précédent : `LeaveConfirmation`). Il n'est ni injecté ni
  `@Injectable`, et il n'a ni I/O ni dépendance Angular autre que les primitives de signal.
  `signal`, `computed` et `linkedSignal` n'exigent pas de contexte d'injection, et aucun
  `effect()` n'est ajouté. Ce n'est pas une facade, puisqu'il ne coordonne aucun gateway : il
  reçoit des fonctions `write` et `uploadCover`. Ce n'est pas un store non plus : rien n'est
  partagé entre composants.
- **Cadre à gabarits (`<ng-template>`), pas `<ng-content>`.** Le formulaire et l'aperçu ne
  doivent exister qu'à l'état `ready`. Or Angular instancie toujours le contenu projeté par
  `<ng-content>`, même quand l'emplacement est sous un `@switch` ou un `@if` faux (doc
  angular.dev, « Content projection »). Le formulaire, `AdminProjectGallery` (qui injecte un
  gateway) et l'éditeur Markdown tourneraient alors en arrière-plan pendant le chargement. Le
  cadre lit donc `contentChild.required('editorForm', { read: TemplateRef })` et
  `contentChild.required('editorAside', …)`, puis les rend par `NgTemplateOutlet` dans
  `@default`. Les gabarits sont déclarés dans l'éditeur et gardent son contexte de liaison.
- **L'en-tête reste hors du cadre.** Il est affiché dans tous les états (titre « Modifier un
  projet » pendant le chargement). Ses actions diffèrent aussi d'un éditeur à l'autre (« Voir la
  fiche » seulement pour le projet). Le cadre ne reprojette rien.
- **Landmarks** : le `<header>` d'`AdminPageHeader` remplace celui de l'éditeur, qui disparaît.
  Le nombre d'éléments `header` ne change pas, et un `header` placé dans `main` n'est pas un
  `banner`. Le dialogue reste unique (dans le cadre).
- **404 → `null` dans le gateway, pas dans l'application.** Le contrat de domaine devient
  `getProjectById(id): Observable<Project | null>`, avec `null` = introuvable. L'adapter HTTP
  traduit le statut 404, comme la frontière infra le doit. L'éditeur ne lit aucun
  `HttpErrorResponse`. La contrainte est encodée dans le type : le compilateur oblige l'éditeur à
  traiter `null`. On obtient la même forme que l'article (`findPostById` → `null`) et la même
  dérivation d'état : `loadState(resource, () => this.loaded() === null)`. Les autres échecs
  (500, réseau) restent des erreurs, avec « Réessayer ».
- **Ordre d'enregistrement unique** (F005), dans `EditorDraft.save()` :
  1. `write()` ; en cas d'échec, `{ success: false, error }`, et le brouillon est intact ;
  2. si une couverture est en attente, `uploadCover(cover, saved.id)` ; un échec est **capturé**
     et rendu dans le résultat ;
  3. `markSaved(saved)` dans tous les cas où l'écriture a réussi ;
  4. `{ success: true, data: { saved, cover } }`.

  L'éditeur en déduit les toasts (erreur, avertissement puis succès), invalide ses caches, relit
  l'entité si la couverture est partie **et** qu'il s'agit d'une mise à jour (les deux éditeurs,
  faute d'URL dans la réponse d'envoi), et navigue vers `/…/:id` après une création.

#### Fichiers

| Fichier | Rôle |
| --- | --- |
| `features/admin/application/editor-draft.ts` (+ `.spec.ts`) | **Nouveau.** `EditorDraft<TEntity, TDraft>`, `EditedDraft<TDraft>`, `CoverUpload`, `SaveResult<TEntity>` (API ci-dessous). |
| `features/admin/application/components/admin-editor-frame.ts` | **Nouveau.** Cadre muet `app-admin-editor-frame`, avec le type `AdminEditorCopy`. Pas de spec (cf. verdict). |
| `features/admin/application/components/admin-page-header.ts` (+ spec) | `parent = input<AdminPageParent>()` et rendu du fil d'Ariane. `overline` devient `input('')`. `text-balance` sur le `h1`. Import de `RouterLink`. |
| `shared/ui/load-state.ts` | `export type LoadState` (aujourd'hui local), pour l'entrée `state` du cadre. |
| `features/admin/application/admin-project-editor.ts` (+ spec) | Adopte l'en-tête, le cadre et `EditorDraft` ; F005 ; état introuvable ; `notify()` retiré. `EditedProject`, `toEditedProject` et les 8 signaux de brouillon disparaissent. Taille visée ≈ 215 lignes (estimation : imports ≈ 26, constantes ≈ 35, gabarit ≈ 75, classe ≈ 80). |
| `features/admin/application/admin-post-editor.ts` (+ spec) | Mêmes adoptions, `notify()` retiré. Taille visée ≈ 170 lignes. |
| `features/projects/domain/gateways/projects.gateway.ts` | `getProjectById(id: string): Observable<Project \| null>`. |
| `features/projects/infra/gateways/http-projects.gateway.ts` (+ spec) | `catchError` : statut 404 → `of(null)`, tout le reste relancé. |
| `features/projects/testing/stub-projects-gateway.ts` | Inchangé : `of(makeProject())` reste assignable. |

**Non touchés** : `styles.css` (l'intersection L1/L3 ∩ L8 prévue par l'audit tombe),
`toast-store.ts`, `LeaveConfirmation`, `count-draft-changes.ts`, `form-toc-entries.ts`,
`project-draft.ts`, `post-draft.ts`, les formulaires, `unsaved-changes-guard.ts`,
`admin.routes.ts`.

#### API des nouveaux modules (signatures, à titre de contrat)

```ts
// editor-draft.ts
type EditorEntity = { readonly id: string; readonly tags: readonly string[] };
export type EditedDraft<TDraft> = TDraft & {
  readonly tags: ReadonlySet<string>;
  readonly cover: File | null;
};
export type CoverUpload =
  | { readonly status: 'none' }
  | { readonly status: 'sent' }
  | { readonly status: 'failed'; readonly error: unknown };
export type SaveResult<TEntity> =
  | { readonly success: true; readonly data: { readonly saved: TEntity; readonly cover: CoverUpload } }
  | { readonly success: false; readonly error: unknown };

export class EditorDraft<TEntity extends EditorEntity, TDraft extends object> {
  constructor(options: {
    readonly loaded: () => TEntity | null;
    readonly toDraft: (entity: TEntity | null) => TDraft;
    readonly sections: readonly FormTocSection<EditedDraft<TDraft>>[];
  });
  readonly saved: Signal<TEntity | null>;            // linkedSignal(loaded), exposé en lecture seule
  readonly value: WritableSignal<TDraft>;             // [(value)] du formulaire
  readonly tags: WritableSignal<ReadonlySet<string>>; // [(tags)] du formulaire (jusqu'à L9)
  readonly pendingCover: Signal<File | null>;
  readonly coverResetToken: Signal<number>;
  readonly saving: Signal<boolean>;
  readonly changes: Signal<number>;
  readonly toc: Signal<readonly FormTocEntry[]>;
  readonly leave: LeaveConfirmation;
  selectCover(file: File): void;
  clearCover(): void;
  rejectCover(): void;                                // vide la couverture et incrémente le jeton, sans toast
  canLeave(): boolean | Promise<boolean>;
  warnBeforeUnload(event: BeforeUnloadEvent): void;
  save(
    write: () => Promise<TEntity>,
    uploadCover: (cover: File, id: string) => Promise<unknown>,
  ): Promise<SaveResult<TEntity>>;
}
```

- `value` et `tags` restent des `WritableSignal` publics. C'est la seule écriture externe admise :
  `[(value)]` et `[(tags)]` exigent un signal inscriptible (`model()` du formulaire). Tout le reste
  est exposé par `.asReadonly()` (règle « encapsuler » de `CLAUDE.md`) et ne s'écrit que par les
  méthodes.
- `baseline` = `linkedSignal(() => ({ ...toDraft(loaded()), tags: new Set(loaded()?.tags ?? []), cover: null }))`
  et `edited` = `computed`, tous deux privés. `markSaved(saved)` (privé) fait, dans cet ordre :
  `saved` ← entité, couverture à `null`, jeton + 1, `baseline` ← `edited()`. C'est l'ordre
  actuel des deux éditeurs : la couverture est vidée **avant** de figer la référence.
- `saving` passe à `true` au début de `save()` et revient à `false` dans un `finally`. La
  navigation qui suit une création a lieu **après** (cf. risques).
- Le formateur de toast reste dans l'éditeur : `rejectCover()` dans l'éditeur appelle
  `draft.rejectCover()` puis `toast.add({ severity: 'error', detail: 'Seules les images sont acceptées.' })`.
- Le champ `draft` est déclaré **après** `loaded` dans la classe de l'éditeur (ordre des
  initialiseurs de champ).
- L. 243 de l'article : le commentaire de WHY (« une couverture refusée après l'écriture laisse
  l'article enregistré ») part sur `save()`, en une ligne et en termes neutres (« l'entité »).

```ts
// admin-editor-frame.ts — sélecteur app-admin-editor-frame
export type AdminEditorCopy = {
  readonly testIdPrefix: 'admin-project' | 'admin-post';
  readonly loading: string;    // « Chargement du projet… »
  readonly loadError: string;  // « Le projet n'a pas pu être chargé. Vérifiez votre connexion, puis réessayez. »
  readonly missing: string;    // « Ce projet n'existe pas ou a été supprimé. »
  readonly backRoute: string;  // '/admin/projects'
  readonly backLabel: string;  // « Retour aux projets »
  readonly leave: string;      // « Les modifications non enregistrées de ce projet seront perdues. »
};
// entrées : state = input.required<LoadState>(), copy = input.required<AdminEditorCopy>(), leaveAsked = input(false)
// sorties : retry = output<void>(), leaveAnswered = output<boolean>()
// gabarits : contentChild.required('editorForm', { read: TemplateRef }), idem 'editorAside'
```

- Gabarit du cadre, transposé des éditeurs **sans changer aucune classe** :
  - `loading` : `role="status"`, `sr-only` = `copy().loading`, 4 squelettes ;
  - `error` : `app-load-error [message]="copy().loadError" (retry)="retry.emit()"` ;
  - `empty` : `<p class="py-8 text-center text-muted">` = `copy().missing` ;
  - après le `@switch`, pour `error` **ou** `empty`, le lien retour (forme de l'article,
    l. 155-165) ;
  - `@default` : la grille `2xl:grid-cols-[minmax(0,1fr)_25rem]`, `<div class="min-w-0">` +
    gabarit `editorForm`, puis `<div id="apercu" …sticky>` + gabarit `editorAside` ;
  - le `app-confirm-dialog` (titre et libellés identiques, corps = `copy().leave`) branché sur
    `leaveAsked` / `leaveAnswered`.
- `data-testid` **conservés à l'identique** (aucune réécriture de sélecteur dans les specs pour
  le cadre), dérivés de `testIdPrefix` : `${p}-editor-loading`, `${p}-editor-back`,
  `${p}-editor-missing`, `${p}-aside`. Pour le projet, cela donne
  `admin-project-editor-missing`, qui est nouveau.
- Squelettes : une seule série pour les deux éditeurs, celle du projet (`h-12`, `h-28`, `h-12`,
  `h-40`), cf. changements visibles.
- L'éditeur : `<app-admin-editor-frame [state]="state()" [copy]="COPY" [leaveAsked]="draft.leave.asked()" (retry)="…Resource.reload()" (leaveAnswered)="draft.leave.answer($event)">`.
  Le projet range dans `#editorForm` le formulaire, la section « 05 · Galerie » et la barre
  d'enregistrement. L'article y range le formulaire et la barre. `#editorAside` contient
  l'aperçu et le sommaire. `PROJECT_EDITOR_COPY` et `POST_EDITOR_COPY` sont des constantes
  locales à chaque éditeur (un seul consommateur chacune).

**`AdminPageHeader`** après L8

- `export type AdminPageParent = { readonly label: string; readonly route: string }`.
- `layoutClass = computed(...)` : colonne d'actions `minmax(0,1fr)_auto` quand `parent` est défini
  (éditeurs : un ou deux liens), `minmax(0,1fr)_22rem` sinon (pages). Deux constantes de classes
  complètes, pour que Tailwind les détecte.
- `parent = input<AdminPageParent>()`. Quand il est défini, l'en-tête rend le
  `nav[aria-label="Fil d'Ariane"]` actuel des éditeurs, avec les mêmes classes, au lieu du
  `<p admin-page-overline>`. Le lien parent porte `data-testid="admin-breadcrumb-parent"`
  (harmonisé : un composant générique ne porte pas de nom de feature). Le courant
  `admin-breadcrumb-current` vaut `{{ heading() }}`, avec `aria-current="page"`.
- `overline = input('')`. Les 7 pages continuent de le passer. L'exclusion mutuelle avec
  `parent` ne s'exprime pas en entrées de signal : on l'accepte (cf. risques).
- `h1` : `tabindex="-1"` et `focusTitle()` inchangés. Les éditeurs en héritent. **Aucun appel à
  `focusTitle()` n'est ajouté dans les éditeurs** : leur seul dialogue (sortie) se ferme soit par
  une navigation, soit par un retour natif du focus à l'élément déclencheur (`<dialog>.close()`).
  Le `mt-1.5` du `h1` des éditeurs devient le `mt-3.5` de l'en-tête (cf. changements visibles).
- Les éditeurs projettent l'intro (`<p>`, texte inchangé) en contenu par défaut, et
  `<div adminPageAside class="flex flex-wrap gap-2.5 lg:justify-end">` pour « Voir l'aperçu »
  (`admin-*-preview-link`, inchangé) et, côté projet, « Voir la fiche »
  (`admin-project-public-link`, inchangé).

#### Réactivité / état

- Signaux uniquement : aucun `effect()` ni RxJS ajouté (le `catchError` du gateway mis à part).
  `rxResource` reste dans les éditeurs.
- `loaded` (projet) = `projectResource.hasValue() ? projectResource.value() : null`. `null`
  compte comme une valeur : `hasValue()` = `isValueDefined()`, vérifié dans
  `@angular/core/fesm2022/_resource-chunk.mjs`. Un 404 donne donc `ready` → `empty`.
- Après une relecture (`reload()`), le `linkedSignal` de `EditorDraft` se réaligne sur l'entité
  serveur, comme l'article le fait aujourd'hui. Pendant la relecture, `hasValue()` reste vrai :
  pas de retour au squelette.

#### Tranches

Leçons des lots précédents pour `qa`, à appliquer dans chaque tranche :

- **Squelette de signature au RED** pour tout module neuf ou membre neuf que le spec importe ou
  lie. Sans lui, la génération du bundle échoue (`TS2307`, ou `NG8002` pour une entrée inconnue
  liée dans le gabarit d'un hôte) et **aucun** test ne tourne. Concrètement :
  - L8.3 : `editor-draft.ts` entier (types exportés, classe aux membres typés, corps neutres :
    signaux à leur valeur initiale, `save` → `{ success: false, error: null }`) ;
  - L8.4 : `AdminPageParent` exporté et `parent = input<AdminPageParent>()` déclaré, sans rendu ;
  - L8.6 : la signature abstraite `Observable<Project | null>`. Dans
    `http-projects.gateway.spec.ts:179-206`, élargir le type des `call` à
    `Observable<Project | readonly Project[] | null>` dès le RED, sinon l'implémentation GREEN
    casse le typecheck des specs.
- **Pas de valeur par défaut piégée dans les harnais.** Un paramètre `x: T | undefined = défaut`
  appelé avec `undefined` prend le défaut (L5, `field-error.spec.ts`). Pour « pas d'entité »,
  passer `null` explicitement (`makeDraft(null)`), sans paramètre par défaut.
- **Copier les objets partagés passés à Signal Forms** (L6.2). Les fixtures de module
  (`DASHFLOW`, `CHIFFREMENT`) traversent les stubs jusqu'au formulaire, qui marque ses tableaux
  d'un symbole. Tout attendu se construit sur une copie neuve (appel de builder par test, ou
  `structuredClone`), jamais sur la référence servie au formulaire. Dans `editor-draft.spec.ts`,
  chaque test construit sa propre entité.
- `toEqual` ignore une clé à `undefined` mais échoue sur une clé définie : c'est le levier de L8.2.

**L8.1 — En mise à jour, un projet est enregistré même si sa couverture échoue (F005)**

- Pas de squelette : aucun module neuf.
- `admin-project-editor.spec.ts`, describe « mise à jour » :
  - **réécrit** (478) : « Given a new cover for an existing project When it is saved Then the
    project is patched first, then the cover uploaded for its id ». On attend
    `uploads: [[COVER, 'p-1']]`, `patches: 1`, et l'appel à `updateProject` **avant**
    `uploadImage` (même forme que `admin-post-editor.spec.ts:481`).
  - **réécrit** (514) : « …Then the project is requested again and the current cover and the
    preview show the uploaded image ». `getProjectById` répond d'abord `DASHFLOW` (copie), puis
    le même projet avec `image: 'https://cdn.test/projects/p-1.avif'`. On attend
    `requested: 2`, la couverture courante et l'aperçu sur cette URL, plus d'aperçu
    « en attente », et la barre à « Aucune modification ».
  - **nouveau** : « Given the cover upload fails after the update When the project is saved Then
    a warning then the update are told, the new title stays and nothing is left to save ». Avec
    `uploadImage` en erreur et le titre modifié en « Après », on attend `toasts` =
    `[{ warn, "Projet mis à jour, mais l'envoi de l'image a échoué. Réessayez." }, { success, 'Projet mis à jour' }]`,
    `patches: 1`, titre de page « Après », barre « Aucune modification », `requested: 1`.
  - RED attendus : ces 3 tests (ordre inversé, `requested: 1`, toast d'erreur sans `PATCH`).
- GREEN : l'éditeur de projet suit l'ordre de l'article (écriture, envoi, avertissement), puis
  `projectResource.reload()` si la couverture est partie. Il n'y a plus de branche
  `create`/`update` séparée pour la couverture.

**L8.2 — Les éditeurs laissent le titre du toast au store**

- Pas de squelette.
- `admin-project-editor.spec.ts:162` et `admin-post-editor.spec.ts:180` : l'aide `toasts()`
  rend l'argument **brut** de `add()` (`toast.mock.calls.map(([message]) => message)`, typé
  `ToastMessage`). C'est la variante retenue par la revue L7 pour `admin-cv.spec.ts`. Aucun
  attendu ne change.
- RED attendus : tout test qui compare un toast entier (`toEqual` sur `{ severity, detail }`),
  car `notify()` y ajoute `summary`. Les tests qui ne projettent que `severity` restent verts.
  `qa` relève le compte exact.
- GREEN : `notify()` est supprimé des deux éditeurs. Chaque appel devient
  `this.toast.add({ severity, detail })`.

**L8.3 — Le brouillon d'édition s'écrit une fois (P5c)**

- Squelette : `editor-draft.ts` (cf. leçons).
- `editor-draft.spec.ts`, **sans TestBed**. Entité de test locale
  `{ id, title, tags }`, `toDraft` = `{ title }`, deux sections (`title` / `tags`, `cover`).
  `loaded` est un `signal` du test. Cas :
  - Given une entité chargée Then `value` = `toDraft(entité)`, `tags` = ses étiquettes,
    `saved` = l'entité, `changes` = 0, sommaire sans « modifié ».
  - `it.each` modifications : titre changé, étiquette ajoutée, couverture choisie → `changes` = 1
    et la bonne section du sommaire marquée « modifié ». Titre rétabli, ou couverture choisie
    puis retirée par `clearCover()` → 0.
  - Given une couverture choisie When `rejectCover()` Then `pendingCover` = `null` et jeton + 1.
  - Given `loaded` qui change Then `value`, `tags` et `saved` se réalignent.
  - `canLeave` : sans changement → `true` ; avec changement → une promesse,
    `leave.asked()` = `true`, puis `leave.answer(true)` la résout à `true`.
  - `warnBeforeUnload` (`it.each` 0 / 1 changement) : `preventDefault` appelé seulement s'il y a
    un changement (événement factice `{ preventDefault: vi.fn() }`).
  - `save`, écriture réussie sans couverture : `{ success: true, data: { saved, cover: { status: 'none' } } }`,
    `uploadCover` jamais appelé, `saved()` = l'entité renvoyée, `changes` = 0.
  - `save`, avec couverture : `uploadCover(cover, saved.id)` appelé **après** `write`, statut
    `'sent'`, couverture vidée, jeton + 1.
  - `save`, envoi de couverture rejeté : statut `'failed'` avec l'erreur, et le brouillon est
    **quand même** marqué enregistré (`changes` = 0). C'est le contrat F005 au niveau unitaire.
  - `save`, écriture rejetée : `{ success: false, error }`, `uploadCover` jamais appelé,
    `changes` inchangé, couverture conservée.
  - `saving` : `true` tant que `write` est en attente (promesse contrôlée par le test), `false`
    après un succès **et** après un échec.
  - RED attendus : tous, sauf l'état initial de `coverResetToken` s'il est asserté seul. Le
    squelette rend des valeurs neutres.
- GREEN : les deux éditeurs adoptent `EditorDraft` (`[(value)]="draft.value"`,
  `[(tags)]="draft.tags"`, `draft.selectCover($event)`, `host` →
  `draft.warnBeforeUnload($event)`, `canLeave()` → `draft.canLeave()`, `save()` →
  `draft.save(…)`). Filet : les deux specs d'éditeur, inchangées, et en particulier
  « modifications non enregistrées », « quitter la page », « couverture retirée ou refusée »,
  « création » et « mise à jour ».

**L8.4 — Les éditeurs partagent l'en-tête d'admin, fil d'Ariane compris (P5a)**

- Squelette : `AdminPageParent` et `parent` (cf. leçons).
- `admin-page-header.spec.ts` : nouvel hôte avec `[parent]` et `provideRouter([])`.
  - Given un parent Then un `nav` « Fil d'Ariane » dans le `header`, lien
    `admin-breadcrumb-parent` (texte = libellé, `href` = route), `admin-breadcrumb-current`
    = titre avec `aria-current="page"`, aucun `admin-page-overline`, un seul `h1`, `tabindex`
    `-1`.
  - Given le titre qui change Then le courant du fil d'Ariane suit.
  - Les 4 tests existants restent verts (sans parent, l'overline est rendue).
- Specs d'éditeur :
  - `admin-breadcrumb-projects` (×3) et `admin-breadcrumb-posts` (×2) deviennent
    `admin-breadcrumb-parent` ;
  - le test d'ouverture d'un projet existant (et son pendant côté article) ajoute
    `titleTabindex: '-1'`. Ne pas compter les `header` de la page : l'aperçu du projet en rend
    d'autres (`project-detail-header.ts`). Le `h1` unique est déjà asserté.
- RED attendus : en-tête, 2 tests ; éditeurs, les tests de fil d'Ariane (lien absent) et les 2
  tests d'ouverture (`tabindex` `null`).
- GREEN : en-tête + adoption dans les deux éditeurs (leur `<header>` disparaît).

**L8.5 — Cadre d'éditeur, sans RED (P5b)**

- `admin-editor-frame.ts` extrait des deux éditeurs, `LoadState` exporté. Comportement constant
  pour l'article. Pour le projet, le lien retour reste affiché sur erreur, et l'état `empty`
  n'est pas encore atteignable (L8.6).
- Filet, inchangé : « chargement et erreur » des deux specs (statut, `load-error`, « Réessayer »,
  `*-editor-back`), « introuvable » de l'article (`admin-post-editor-missing`), « quitter la
  page » (dialogue), les tests de colonne de l'aperçu (`admin-*-aside`, `#apercu`), la galerie
  (`compareDocumentPosition` hors `<form>`). Ce dernier prouve que le gabarit `editorForm`
  garde l'ordre formulaire → galerie → barre.
- Preuve de fin de tranche : `grep -c "app-skeleton\|app-confirm-dialog\|app-load-error" src/app/features/admin/application/admin-*-editor.ts` → 0 et 0.

**L8.6 — Un projet introuvable le dit et ramène à la liste (P5b, décision 2)**

- Squelette : signature abstraite `Observable<Project | null>` (cf. leçons).
- `http-projects.gateway.spec.ts` : `it.each` statut 404 → la valeur émise est `null` ;
  statut 500 → l'observable est en erreur avec le même statut (le 500 n'est pas avalé).
  `httpController.verify()` en `afterEach`, comme le fichier.
- `admin-project-editor.spec.ts`, describe « chargement et erreur » → « chargement, erreur et
  introuvable » : « Given an id the API does not know When the page renders Then it says the
  project is not found and leads back, without form nor error ». Avec
  `getProjectById: vi.fn((): Observable<Project | null> => of(null))`, on attend `crash: null`,
  `admin-project-editor-missing` = « Ce projet n'existe pas ou a été supprimé. », aucun
  `load-error`, aucun `admin-project-form`, et `admin-project-editor-back` = `A` vers
  `/admin/projects` (forme de `admin-post-editor.spec.ts`, « introuvable »).
- RED attendus : le 404 de la spec du gateway (erreur au lieu de `null`) et le test de l'éditeur
  (formulaire rendu, pas de message). Le 500 est vert d'emblée (non-régression, assumé).
- GREEN : `catchError` dans `HttpProjectsGateway.getProjectById`, et
  `state = loadState(this.projectResource, () => this.loaded() === null)`.

Ordre : L8.1 → L8.2 → L8.3 → L8.4 → L8.5 → L8.6.

- **L8.1 avant L8.3** : on ne factorise l'ordre d'enregistrement qu'une fois les deux éditeurs
  alignés. `save()` est alors un refactor sous vert pour les éditeurs.
- **L8.2 avant L8.3** : `notify()` ne passe pas dans l'objet partagé.
- **L8.5 avant L8.6** : l'état introuvable s'écrit une seule fois, dans le cadre.

Preuves de fin de lot :

- `grep -n "notify\|summary" src/app/features/admin/application/admin-*-editor.ts` → vide ;
- `grep -rn "Fil d'Ariane" src/app/features/admin/application --include=*.ts | grep -v spec` →
  `admin-page-header.ts` seul ;
- `grep -n "linkedSignal" src/app/features/admin/application/admin-post-editor.ts` → vide (le
  projet garde celui de `gallery`).

#### Changements visibles

- **Projet, mise à jour avec couverture en échec** : le projet est enregistré, puis un
  avertissement « Projet mis à jour, mais l'envoi de l'image a échoué. Réessayez. » et le succès
  sont affichés. Avant, un toast d'erreur s'affichait et rien n'était enregistré (décision
  F005).
- **Projet, mise à jour avec couverture réussie** : une requête `GET /projects/:id` de plus
  (relecture), et la couverture affichée est celle de l'entité relue.
- **Projet sur 404** : « Ce projet n'existe pas ou a été supprimé. » et « Retour aux projets »,
  au lieu de l'erreur de chargement avec « Réessayer » (décision P5b).
- **En-tête des deux éditeurs**, rendu par `AdminPageHeader` :
  - `pb-6` → `pb-8` ;
  - `h1` `mt-1.5` → `mt-3.5`, soit 8 px de plus sous le fil d'Ariane ;
  - intro `mt-3` → `mt-4` ;
  - à partir de `lg`, colonne d'actions dimensionnée au contenu (`auto`) dans les éditeurs, 22rem
    conservés sur les pages : décision prise après la mesure de l'implémentation (cf. `## Verify` ›
    Lot L8, point d'attention soldé) ;
  - `h1` focalisable par script (`tabindex="-1"`, invisible au clavier) ;
  - `text-balance` sur tous les `h1` d'admin : effet nul sur les titres d'un mot des 7 pages,
    retour à la ligne équilibré pour les titres longs de projet (l'article l'avait déjà).
- **Squelette de chargement de l'article** : `h-20` / `h-60` → `h-28` / `h-40` (série unique).
- **Toasts** : aucun. Les titres par défaut sont ceux que posait `notify()`.

#### Intersection de fichiers

| Couple | Intersection | Conséquence |
| --- | --- | --- |
| L7 ∩ L8 | Vide en fichiers. L8 dépend de L7 **sémantiquement** : sans titre par défaut, le retrait de `notify()` (L8.2) enlève le titre des toasts. | La branche est empilée sur L7 (#188). On la rebase sur `master` une fois #188 mergée, et la PR L8 part après. |
| L1 / L3 ∩ L8 | Vide : L8 ne touche plus `styles.css`, contrairement au tableau de l'audit. | Indépendants. |
| L8 ∩ L9 | Les deux éditeurs et leurs specs. L9 retire en plus `tags` de `EditorDraft` (le champ passe dans `value`). | L9 après L8, `editor-draft.ts` ajouté à la liste de L9. |
| L8 ∩ L11 | Les éditeurs importent `ToastStore` (chemin `shared/ui`). | L11 en dernier, comme prévu. |

Gates : `pnpm install --frozen-lockfile`, `pnpm run build --configuration production` (puis
`git checkout -- public/sitemap.xml public/rss.xml`), `pnpm lint`, `pnpm test; echo exit=$?`
(code de sortie lu). Le runtime de l'admin exige le faux backend local décrit au `## Verify` du
lot L6 : il faut y simuler un `PATCH` réussi suivi d'un envoi d'image en 500, et un
`GET /projects/inconnu` en 404.

#### Risques & inconnues

- **`saving` repasse à `false` avant la navigation qui suit une création** (avant : pendant). Le
  bouton « Enregistrer » est réactivé pendant la navigation `replaceUrl`. `canLeave()` vaut
  `true` (aucun changement), donc pas de dialogue parasite. Un double envoi reste théoriquement
  possible pendant ces quelques millisecondes. Si la revue le juge gênant, repli : l'éditeur
  garde son propre `try/finally` autour de la navigation.
- **Requêtes de debug à travers `NgTemplateOutlet`** : les specs lisent `By.directive(AdminProjectForm)`
  et `By.directive(FileDropzone)`. Les vues insérées depuis un gabarit déclaré dans l'éditeur
  sont dans l'arbre de debug du DOM ; à confirmer au premier GREEN de L8.5. Si une requête ne
  trouve plus l'élément, `qa` est saisi par renvoi de tranche (pas de contournement dans le
  cadre).
- **Exclusion `overline` / `parent` non typée** : une page qui passerait les deux n'aurait que le
  fil d'Ariane, et une page qui n'en passerait aucun aurait une overline vide (comme aujourd'hui
  avec `''`). Le couplage implicite `fragment="apercu"` (en-tête de l'éditeur) ↔ `id="apercu"`
  (cadre) est couvert par le test de colonne de l'aperçu.

### Lot L9 — Étiquettes en `FormValueControl` (P13, ajout, branche `refactor/tags-form-value-control-l9` depuis master `fc1f214`)

Les étiquettes deviennent un champ du brouillon comme les autres. `AdminTagsSelector` implémente
`FormValueControl<readonly string[]>` et se lie par `[formField]="form.tags"`. Le canal `tags`
parallèle (modèle `Set` des formulaires, liaison `[(tags)]` des éditeurs, signal `tags`
d'`EditorDraft`, paramètre `tags` des conversions) disparaît.

#### Vérification des références de l'audit (master `fc1f214`)

L6 et L8 ont tout déplacé. Seules les références de `post-draft.ts` tiennent encore.

| Réf. audit (P13) | Actuel |
| --- | --- |
| `admin-project-form.ts:334-338` (sélecteur) | **98-102** (`[(selectedTags)]="tags"` l. 101) |
| `admin-project-form.ts:485` | modèle `tags` **111**, appel `toProjectInput(draft, this.tags(), draft.kind)` **159** |
| `admin-post-form.ts:85-89` (sélecteur) | **89-93** (`[(selectedTags)]="tags"` l. 92) |
| `admin-post-form.ts:216` | modèle `tags` **223**, appel `toPostInput(this.value(), this.tags())` **251** |
| `admin-project-editor.ts:29-32, 234-236, 248` | les signaux de brouillon sont partis dans `EditorDraft` (L8). Restent : `[(tags)]="draft.tags"` **118**, aperçu `toPreviewProject(…, this.draft.tags(), …)` **201-203** |
| `admin-post-editor.ts:24-27, 203-205, 214` | idem : `[(tags)]="draft.tags"` **83**, aperçu **139-141** |
| *(hors audit, créé par L8)* `editor-draft.ts` | `EditorEntity.tags` **6**, `EditedDraft` (clé `tags: ReadonlySet`) **8-11**, membre `tags` **35**, `linkedSignal` **52**, `baseline` **53-57**, `edited` **58-62** |
| `project-draft.ts:51, 80` | `toProjectInput(draft, tags, kind)` **49-53** (`tags: [...tags]` l. 57), `toPreviewProject(draft, tags, base)` **78-82** (appel l. 85) |
| `post-draft.ts:19, 31` | `toPostInput` **19**, exact (`tags: [...tags]` l. 24) ; `toPreviewPost` **29-32** (l. 31 dans la plage) |
| `AdminTagsSelector` | `selectedTags = model.required<ReadonlySet<string>>()` **30**, `chips` **32-39**, `toggleTag` (public) **41-49** |

Consommateurs vérifiés par `grep` : `AdminTagsSelector` n'a que les deux formulaires ;
`toProjectInput`, `toPostInput`, `toPreview*` et `EditedDraft` n'ont que les formulaires, les
éditeurs, `editor-draft.ts` et leurs specs. Aucun autre fichier de `src/` ni de la doc vivante
n'est touché.

#### Contrat réel de `FormValueControl` (lu dans `node_modules/@angular/forms`, 22.2.1)

- `types/signals.d.ts:636-650` : `FormValueControl<TValue> extends FormUiControl<TValue>`. **Seul
  membre requis** : `readonly value: ModelSignal<TValue>`. `checked` est interdit (réservé à
  `FormCheckboxControl`). Le type est exporté par `@angular/forms/signals`.
- `FormUiControl` (l. 521-628) : tout le reste est **facultatif**. Ce sont des entrées
  (`errors`, `disabled`, `disabledReasons`, `readonly`, `hidden`, `invalid`, `pending`,
  `touched`, `dirty`, `name`, `required`, `min`/`max`, `minLength`/`maxLength`, `pattern`), une
  sortie `touch`, et les méthodes `focus()` et `reset()`. La directive ne les lie **que si le
  composant les déclare**.
- Exécution (`fesm2022/signals.mjs:951-977`, `customControlCreate`) :
  - écriture du `model` `value` par le composant → `controlValue.set()`, qui **marque le champ
    `dirty`** (`_validation_errors-chunk.mjs:1538-1544`) ;
  - le champ ne passe `touched` **que** sur la sortie `touch` du composant. Il n'y a aucun
    écouteur `blur` sur un contrôle personnalisé : le `blur` (l. 1098) ne vaut que pour les
    éléments natifs ;
  - aucune propriété DOM native n'est posée sur l'hôte : `elementAcceptsNativeProperty` rend
    `false` hors `input`/`select`/`textarea` (l. 1392-1395, `forms.mjs:1303-1305`). Donc ni
    `name`, ni `disabled`, ni `required` sur `<app-admin-tags-selector>` ;
  - `focusBoundControl()` appelle `focus()` sur l'élément hôte si le composant n'implémente pas
    `focus()` (l. 1263).
- Les éléments **primitifs** d'un tableau ne sont pas marqués : le symbole d'identité ne vise que
  les éléments objets (`_validation_errors-chunk.mjs:1179-1180`). La copie champ par champ de L6
  ne s'applique donc pas aux étiquettes. Une copie du tableau reste prescrite (cf. modèles).
- `FieldTree` gère `ReadonlyArray` (`_structure-chunk.d.ts:1153`) : `form.tags` existe pour un
  champ `readonly string[]`.

**Membres implémentés : `value` seul.** Pas de `touch`, `disabled`, `errors` ni `focus` (YAGNI).
Aucune règle de schéma ne porte sur les étiquettes, aucun formulaire n'est désactivé, et rien ne
lit `form.tags().touched()`. Comme le champ ne peut pas être invalide, `focusFirstInvalid` ne
l'atteint jamais, et le repli de focus sur l'hôte (non focalisable) reste sans effet. Le jour où
une règle portera sur les étiquettes (un nombre maximal, par exemple), il faudra ajouter `focus()`
(première puce) et `touch` : c'est noté en risque.

#### Verdict KISS

**Gardé**, au périmètre minimal. Ce qu'on gagne : un seul canal d'état par formulaire, ce qui
retire 2 `model.required`, 2 liaisons `[(tags)]` dans les éditeurs, le membre `tags` et son
`linkedSignal` dans `EditorDraft`, un paramètre dans 4 fonctions de conversion, et la liaison
`tags` des deux harnais de spec de formulaire. On s'aligne aussi sur la doctrine (« Tout
formulaire = Signal Forms », `[formField]` possède le contrôle ; CLAUDE.md, section
« Formulaires »). Ce que ça coûte : la comparaison en ensemble doit migrer (L9.2), plus une
projection privée et un `Omit` dans `EditorDraft`. Le bilan en lignes est légèrement négatif.
Aucun membre facultatif de `FormUiControl` n'est implémenté.

#### Architecture

```mermaid
flowchart LR
  E[Éditeur] -->|"[(value)]=draft.value"| F[AdminProjectForm / AdminPostForm — form(value)]
  F -->|"[formField]=form.tags"| S[AdminTagsSelector — value = model&lt;readonly string[]&gt;]
  E -->|"new EditorDraft(...)"| D[EditorDraft — value (tags compris), edited/baseline : tags projetés en Set]
  D --> C[countChangedFields — branche Set existante]
```

- **Rien de nouveau** : ni composant, ni presenter, ni store, ni facade. Le sélecteur reste muet
  (une entrée, un `model`).
- **Où vit la comparaison à l'ordre près : dans `EditorDraft`.** C'est le seul endroit qui
  compare le brouillon à sa référence. Sa projection privée `toEdited(draft, cover)` convertit
  `draft.tags` en `ReadonlySet<string>` pour `edited` **et** `baseline`. La comparaison
  proprement dite reste celle de `countChangedFields` : sa branche `Set` existe déjà (taille et
  appartenance, `count-draft-changes.ts:12-14`) et elle est déjà testée (« the same tags in
  another order » → 0, `count-draft-changes.spec.ts:99`). Variantes écartées :
  - **trier** (dans `toXDraft` et dans le sélecteur) : le `PATCH` réordonnerait les étiquettes
    stockées. Or l'ordre est visible en public (`project-detail-header.ts:110`,
    `blog-detail.ts:100`, `blog-list-view.ts:50` qui ne garde que les premières). Ce serait un
    changement visible, hors du périmètre d'un refactor ;
  - **comparer en ensemble tout tableau de chaînes dans `sameValue`** : le comparateur générique
    mentirait pour toute future liste ordonnée de chaînes ;
  - **ranger dans le sélecteur selon `availableTags`** : la référence serveur n'est pas dans cet
    ordre, et filtrer par `availableTags` perdrait les étiquettes hors catalogue.
- **Ordre du tableau, identique à celui du `Set` actuel** : un retrait filtre, un ajout va en
  fin, et une étiquette hors catalogue (sans puce) est conservée. Le payload garde donc l'ordre
  serveur suivi des ajouts. Retirer puis rajouter une étiquette la place en fin, ce que fait déjà
  l'ordre d'insertion du `Set`. Sans changement de modification compté (L9.2), comme aujourd'hui.

#### Modèles et signatures (à titre de contrat)

```ts
// admin-tags-selector.ts
export class AdminTagsSelector implements FormValueControl<readonly string[]> {
  readonly availableTags = input.required<readonly string[]>();
  readonly value = model<readonly string[]>([]);
  protected readonly chips: Signal<readonly TagChip[]>; // selected = value().includes(tag)
  protected toggleTag(tag: string): void;               // value.update : filtre ou ajout en fin
}

// project-draft.ts / post-draft.ts
export type ProjectDraft = { title: string; category: string; tags: readonly string[]; /* … */ };
export type PostDraft = { title: string; excerpt: string; tags: readonly string[]; /* … */ };
toProjectDraft(project)          // tags: [...(project?.tags ?? [])]
toProjectInput(draft, kind)      // tags: [...draft.tags]
toPreviewProject(draft, base)
toPostDraft(post)                // tags: [...(post?.tags ?? [])]
toPostInput(draft)               // tags: [...draft.tags]
toPreviewPost(draft, base)

// editor-draft.ts (après L9.2)
type EditorEntity = { readonly id: string };
type TaggedDraft = { readonly tags: readonly string[] };
export type EditedDraft<TDraft extends TaggedDraft> = Omit<TDraft, 'tags'> & {
  readonly tags: ReadonlySet<string>; // comparées en ensemble : l'ordre de sélection ne compte pas
  readonly cover: File | null;
};
export class EditorDraft<TEntity extends EditorEntity, TDraft extends TaggedDraft> { /* sans membre `tags` */ }
```

- `value = model<readonly string[]>([])`, **pas** `model.required`. C'est la directive
  `FormField` qui écrit ce modèle, pas une liaison de gabarit. `required` n'apporterait donc
  aucune vérification à la compilation, et une lecture avant la première écriture lèverait
  NG0950.
- `readonly string[]` **des deux côtés** (champ du brouillon et `model`). La vérification de
  type de `[formField]` compare le type du champ à celui du `model` : un `string[]` d'un côté et
  un `readonly string[]` de l'autre la ferait échouer.
- Les copies `[...x]` dans `toXDraft` / `toXInput` découplent le modèle du formulaire de l'entité
  chargée, et le payload du modèle (immutabilité). Ce n'est pas le marquage de Signal Forms,
  puisque les chaînes ne sont pas marquées.
- `toggleTag` passe `protected` (gabarit seul ; les specs cliquent les puces).
- `EditedDraft` reste exporté : les `FORM_SECTIONS` des éditeurs le typent, et leurs clés
  (`'tags'` comprise) ne changent pas.

#### Fichiers

| Fichier | Rôle |
| --- | --- |
| `components/admin-tags-selector.ts` (+ spec) | `FormValueControl<readonly string[]>` : `value` remplace `selectedTags`, `toggleTag` protégé. |
| `components/admin-project-form.ts` (+ spec) | Modèle `tags` supprimé. `[formField]="form.tags"` à la place de `[(selectedTags)]="tags"`. Soumission : `toProjectInput(draft, draft.kind)`. |
| `components/admin-post-form.ts` (+ spec) | Idem : `toPostInput(this.value())`. |
| `project-draft.ts` (+ spec) | `tags` dans `ProjectDraft`, `toProjectDraft` ; `toProjectInput` et `toPreviewProject` perdent `tags`. |
| `post-draft.ts` (+ spec) | Idem pour `PostDraft`, `toPostInput`, `toPreviewPost`. |
| `editor-draft.ts` (+ spec) | Membre `tags` supprimé, `EditorEntity` réduit à `id`. Projection `toEdited` et `EditedDraft` en `Omit` (L9.2). |
| `admin-project-editor.ts` (+ spec) | Liaison `[(tags)]` retirée ; aperçu `toPreviewProject(this.draft.value(), this.draft.saved())`. Spec : un test neuf (L9.2). |
| `admin-post-editor.ts` | Liaison `[(tags)]` retirée ; aperçu `toPreviewPost(this.draft.value(), this.draft.saved())`. Spec inchangée (filet). |
| `count-draft-changes.spec.ts` | Type local `Edited` (l. 5) → `Omit<ProjectDraft, 'tags'> & { readonly tags: ReadonlySet<string> }`. Sans cela, `ProjectDraft.tags: readonly string[]` intersecté avec un `Set` refuse les fixtures. Aucun attendu ne change. |

**Non touchés** : `count-draft-changes.ts`, `form-toc-entries.ts`, `admin-project-form-data.ts`,
`blog-tag.model.ts`, les composants d'aperçu, `admin-editor-frame.ts`, `styles.css`.

**`data-testid` conservés à l'identique** : `tag-chip` (puces), `admin-project-tags` et
`admin-post-tags`, posés sur l'hôte `<app-admin-tags-selector>`, qui porte désormais aussi
`[formField]`. La liste des contrôles de la section « 04 · Choix techniques »
(`admin-project-form.spec.ts:168`) et de « 01 · Article » (`admin-post-form.spec.ts:115`) ne
change pas.

#### Réactivité / état

- Aucun `effect()`, aucun RxJS. Le flux est le suivant : clic sur une puce → `value.update()` →
  `FormField` → modèle du formulaire → `draft.value` (`linkedSignal` d'`EditorDraft`, par
  `[(value)]`) → `edited` / `changes` / `toc` / aperçu.
- Le rechargement de l'entité (`reload()` après envoi de couverture) réaligne `value`, étiquettes
  comprises, par le seul `linkedSignal` de `value`. Celui des étiquettes disparaît.

#### Tranches

Leçons des lots précédents pour `qa`, à appliquer dans chaque tranche :

- **Échafaudage de signature au RED.** Sans lui, les specs réécrites ne compilent pas
  (`TS2554`, argument en trop ; `TS2339`, `draft.tags` ; NG8002, `[(tags)]` sur un formulaire
  qui n'a plus l'entrée) et **aucun** test ne tourne. Le contenu exact est donné dans L9.1.
- **Pas de valeur par défaut piégée dans les harnais.** `project-draft.spec.ts:248-250` a
  aujourd'hui `previewOf(overrides, tags: ReadonlySet<string> = new Set(BASE.tags), base)`. Le
  paramètre disparaît, et les étiquettes passent par `overrides` (`{ tags: [...] }`),
  explicitement. Pour « pas d'entité », passer `null`.
- **Copier les objets passés à Signal Forms.** Toute entité ou tout brouillon servi à un
  formulaire est construit **par test** (appel de builder, littéral neuf). Aucun attendu n'est
  construit sur la référence servie. Le test L9.2 de l'éditeur ne réutilise pas `DASHFLOW` (son
  `techChoices` serait marqué) : il construit son projet par `makeProject({ … })`. L'hôte
  `[formField]` du sélecteur crée son `signal({ tags: [...] })` dans chaque test.
- **Jamais d'U+202F / U+00A0 littéral** dans une spec : écrire ` ` / ` ` (forme déjà
  utilisée dans `admin-project-form.spec.ts:421-430`).
- `toEqual` sur un `Set` compare le contenu sans l'ordre, sur un tableau avec l'ordre. Les
  attendus d'étiquettes deviennent des tableaux : l'ordre y compte (c'est voulu, cf. L9.1).

**L9.1 — Les étiquettes passent par le champ `tags` du formulaire (P13)**

- **Échafaudage (à remplacer en GREEN), signatures seules, corps neutres** :
  - `AdminTagsSelector` : `selectedTags` remplacé par `readonly value = model<readonly string[]>([])`,
    `chips` rend toutes les puces non pressées, et `toggleTag` a un corps vide ;
  - `ProjectDraft` / `PostDraft` : champ `tags: readonly string[]`, et `toXDraft` rend
    `tags: []`. `toProjectInput(draft, kind)`, `toPostInput(draft)`,
    `toPreviewProject(draft, base)` et `toPreviewPost(draft, base)` rendent `tags: []` ;
  - formulaires : modèle `tags` supprimé, sélecteur **sans liaison** (ni `[(selectedTags)]` ni
    `[formField]`), appels de soumission à la nouvelle signature ;
  - éditeurs : `[(tags)]` retiré, appels d'aperçu à la nouvelle signature ;
  - `editor-draft.ts` **non touché** : son membre `tags` survit, sans lecteur, jusqu'au GREEN.
    Il compile, car `EditedDraft<ProjectDraft>` intersecte `readonly string[]` et
    `ReadonlySet<string>`.
- `admin-tags-selector.spec.ts` (réécrit, `setInput('value', [...])`, lecture de
  `componentInstance.value()`) :
  - puces pressées selon `value` (`aria-pressed`) ;
  - `it.each`, cliquer sur une puce : depuis `['Angular']`, PBKDF2 → `['Angular', 'PBKDF2']`, puis
    Angular → `['PBKDF2']` ; une étiquette retirée puis rajoutée passe **en fin** (depuis
    `['Angular', 'PBKDF2']` : Angular, Angular → `['PBKDF2', 'Angular']`) ;
  - étiquette hors catalogue conservée : `value` `['Héritée', 'Angular']`, disponibles
    `['Angular', 'PBKDF2']`, clic sur PBKDF2 → `['Héritée', 'Angular', 'PBKDF2']`, et aucune puce
    « Héritée » ;
  - **hôte `[formField]`** (`imports: [AdminTagsSelector, FormField]`, modèle
    `signal({ tags: ['Angular'] })` et `form(model)` en initialiseurs de champ) : la puce Angular
    est pressée ; un clic sur PBKDF2 → `model().tags` = `['Angular', 'PBKDF2']` ; un
    `model.set({ tags: ['PBKDF2'] })` externe → les puces suivent ;
  - les 6 lignes de couleur, attendus inchangés (rouges au RED : la puce cliquée ne passe pas en
    `solid`).
- `admin-project-form.spec.ts` / `admin-post-form.spec.ts` : `tags` retiré de `RenderedForm` et
  du harnais (l. 26, 47, 51, 64 / 31, 52, 56, 65) ; `[...rendered.tags()]` →
  `rendered.value().tags` (l. 270 / 242) ; `toProjectInput(toProjectDraft(project), 'script')`
  (l. 287) et `toPostInput(toPostDraft(EDITABLE))` (l. 258). Un test **neuf** dans chaque spec :
  « Given an edited project/post When the form renders Then its tags are pressed » (puces de
  `admin-project-tags` / `admin-post-tags`, `aria-pressed` = `'true'` sur les étiquettes de
  l'entité seulement).
- `project-draft.spec.ts` / `post-draft.spec.ts` : un argument en moins à chaque appel (l. 138,
  169, 185, 194, 210, 227, 266, 325 / 54, 70, 77, 87, 101, 117, 140), et les étiquettes passent
  par le brouillon. Le test « selection order » (l. 191-198) devient « Given draft tags When the
  payload is built Then they are sent in the draft order, as a copy » : même ordre,
  `payload.tags` `not.toBe(draft.tags)`. `toXDraft` d'une entité → `tags` = ses étiquettes, et
  copie (`not.toBe(entity.tags)`).
- `editor-draft.spec.ts` : `NoteDraft = { title; tags: readonly string[] }` ; `toNoteDraft` copie
  les étiquettes ; `draft.tags()` → `draft.value().tags` (l. 47, 135) ; « a tag added » →
  `draft.value.update((v) => ({ ...v, tags: [...v.tags, 'RxJS'] }))` (l. 73).
- `count-draft-changes.spec.ts` : type `Edited` (cf. fichiers).
- RED attendus, tous par assertion : pression et clic du sélecteur (hôte `[formField]` compris),
  les tests de puce des deux formulaires, les deux tests neufs « pressed », les tests de
  conversion porteurs d'étiquettes, « a tag added » d'`editor-draft.spec.ts` (le `tags` de
  l'ancien membre écrase celui de `value`), `pickTag` → 1 modification
  (`admin-project-editor.spec.ts:1108`) et `pickSubject` → payload `['Angular']`
  (`admin-post-editor.spec.ts:371-380`). Les tests qui comparent deux appels des conversions
  échafaudées (`admin-project-form.spec.ts:280`, `admin-post-form.spec.ts:258`) restent verts. Le
  `tags: []` de création (`admin-project-editor.spec.ts:381`) aussi. `qa` relève le compte exact.
- GREEN : le sélecteur dérive les puces de `value` et `toggleTag` filtre ou ajoute en fin ; les
  formulaires lient `[formField]="form.tags"` ; les conversions copient `tags` ; `EditorDraft`
  perd son membre `tags`, `EditorEntity` se réduit à `id`, et `edited` / `baseline` deviennent
  `{ ...draft, cover }`. Pas de projection en `Set` à ce stade (comparaison **à l'ordre près**,
  volontairement naïve) : c'est L9.2.

**L9.2 — Retirer puis rajouter une étiquette ne compte pas comme une modification**

- Pas d'échafaudage.
- `editor-draft.spec.ts`, `it.each` sur une entité `tags: ['Angular', 'RxJS']` :
  - `value.tags` ← `['RxJS', 'Angular']` → `changes` 0, sommaire sans « modifié » ;
  - `value.tags` ← `['Angular', 'Zod']` → `changes` 1 (triangulation, vert d'emblée, assumé).
- `admin-project-editor.spec.ts`, describe « modifications non enregistrées » : « Given a project
  tagged Angular and TypeScript When Angular is unpicked then picked again Then nothing is
  reported as changed ». `getProjectById` répond `makeProject({ id: 'p-1', kind: 'production', tags: ['Angular', 'TypeScript'] })`,
  construit dans le test. `pickTag` deux fois sur « Angular ». On attend la barre
  « Aucune modification » et le sommaire `['', '', '', '', '']`.
- RED attendus : la ligne 0 de l'`it.each` et le test de l'éditeur (« 1 modification non
  enregistrée », section 04 « modifié »).
- GREEN : `EditedDraft` en `Omit<TDraft, 'tags'> & { tags: ReadonlySet<string>; cover }`,
  contrainte `TDraft extends TaggedDraft`, et une projection privée `toEdited(draft, cover)`
  utilisée par `baseline` et `edited`. Une ligne de commentaire de WHY sur la clé `tags` de
  `EditedDraft` (« l'ordre de sélection ne compte pas »).

Ordre : L9.1 → L9.2. L9.2 suppose que le brouillon porte les étiquettes en tableau. Sans L9.1, la
comparaison est déjà en `Set` et le test de l'éditeur serait vert d'emblée.

Preuves de fin de lot :

- `grep -rn "selectedTags\|\[(tags)\]\|draft\.tags" src/app` → vide ;
- `grep -rn "ReadonlySet<string>" src/app/features/admin/application --include=*.ts | grep -v spec`
  → `editor-draft.ts` seul (la clé `tags` d'`EditedDraft`) ;
- `grep -n "formField]=\"form.tags\"" src/app/features/admin/application/components/admin-*-form.ts`
  → une ligne par formulaire.

#### Changements visibles

Aucun. Les puces, `aria-pressed`, les couleurs, l'ordre des étiquettes dans le payload (ordre
serveur, puis ajouts), le compteur de la barre et le sommaire sont identiques. Retirer puis
rajouter une étiquette ne compte toujours pas comme une modification. Dans ce cas, comme
aujourd'hui, l'étiquette passe en fin au prochain enregistrement motivé par un autre champ.

#### Intersection de fichiers

| Couple | Intersection | Conséquence |
| --- | --- | --- |
| L8 ∩ L9 | L8 mergé (#189) : la branche part de `fc1f214`. | Aucune. |
| L10 ∩ L9 | Ni `styles.css` ni `link-btn-*` touchés par L9. | Indépendants, sous réserve du plan L10. |
| L11 ∩ L9 | Les imports des fichiers d'admin touchés ici. | L11 en dernier, comme prévu. |

Gates : `pnpm install --frozen-lockfile`, `pnpm run build --configuration production` (puis
`git checkout -- public/sitemap.xml public/rss.xml`), `pnpm lint`, `pnpm test; echo exit=$?`.
Runtime (faux backend local du `## Verify` de L6) : ouvrir un projet à 2 étiquettes ; cocher une
étiquette → « 1 modification », section 04 « modifié » ; la décocher → « Aucune modification » ;
retirer puis rajouter une étiquette existante → « Aucune modification » ; enregistrer après un
ajout → corps du `PATCH` avec `tags` dans l'ordre serveur puis l'ajout. Même parcours, abrégé,
sur un article (création : `POST` avec `tags`).

#### Risques & inconnues

- **Vérification de type de `[formField]` sur un contrôle personnalisé.** Si le compilateur
  refuse `FieldTree<readonly string[]>` ↔ `ModelSignal<readonly string[]>` (variance, ou
  `FieldTree` d'un tableau en lecture seule), on le saura au premier GREEN de L9.1. Repli :
  `tags: string[]` des deux côtés, mutation toujours interdite par `value.update` (nouvelle
  référence). Pas de cast.
- **`touched` jamais posé, focus sur un hôte non focalisable** : sans effet aujourd'hui (aucune
  règle sur `tags`). Une future règle de schéma exigera `focus()` (première puce) et la sortie
  `touch`, sans quoi `focusFirstInvalid` resterait muet sur ce champ.
- **`Omit` sur un générique dans `EditorDraft`** : le spread `{ ...draft, tags: new Set(…), cover }`
  peut ne pas être reconnu assignable à `Omit<TDraft, 'tags'> & …`. Repli : une fonction
  `toEdited` typée qui déstructure (`const { tags, ...rest } = draft`), toujours sans cast. Si
  ce repli échoue aussi, `qa` est saisi par renvoi de tranche.

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

Lot **L6** joué en un seul RED (demande de la session principale), branche
`refactor/project-form-split-l6`. Commande : `pnpm test; echo exit=$?`, après `ng cache clean` et
purge de `node_modules/.vite`. Base avant RED : `184 passed (184)` fichiers, `3061 passed (3061)`
tests, exit 0.

**Échafaudage de signature (à remplacer en GREEN)** : `components/admin-pair-rows.ts`
(`AdminPairRows<A, B>`, entrées `rows`/`config`, types `PairRow`, `PairColumn`, `PairRowsConfig`,
gabarit vide), importé par son spec. `AdminProjectIdentityFields` et
`AdminProjectPresentationFields` n'ont pas d'échafaudage : composants de découpe sans logique
propre, ils sont testés à travers `admin-project-form.spec.ts`, qui n'importe que le parent.
`PairRow` est écrit `Readonly<Record<A | B, string>>` (même type que le type mappé du plan, que
`@typescript-eslint/consistent-indexed-object-style` refuse).

### Tranche L6.1 — une soumission de projet invalide amène au premier champ fautif

**`admin-project-form.spec.ts`**, describe « soumission invalide » (`it.each` × 4, événement
`submit` du `<form>`, focus lu sur `document.activeElement`, rien d'émis)

| Cas | Brouillon | Focus attendu |
| --- | --- | --- |
| rien de rempli | nouveau projet | `admin-project-title` |
| titre seul | titre | `admin-project-category` |
| titre, catégorie, description | sans nature | `admin-project-kind-production` |
| identité complète + rangée « Pourquoi » ajoutée vide | nature `demo` | `tech-choice-techno` |

RED confirmé via `pnpm test` le 2026-10-08 20:12 : 4 failed / 3083 total pour cette tranche (4
tests neufs). Échecs = assertions (`focused: null` au lieu du `data-testid` attendu).

### Tranche L6.2 — les rangées répétées deviennent une section et signalent leurs cellules vides

**`components/admin-pair-rows.spec.ts`** (nouveau ; hôte avec `form()` sur
`{ rows: PairRow<'a','b'>[] }`, `applyEach` requis « Requis », configuration `p` / `pair`, colonnes
`A`/`x` et `B`/`y` ; 9 tests)

| Test | Scénario | Assertions clés |
| --- | --- | --- |
| titre | 2 rangées | un seul titre de section : `H2 Paires` |
| en-têtes de colonnes | 2 rangées | un seul bloc `aria-hidden="true"` non vide, enfants `N°`, `A`, `B` |
| cellules | 2 rangées | libellés `A 1`/`A 2`, `B 1`/`B 2` ; `id` `p-1-x`, `p-2-x`, `p-1-y`, `p-2-y` ; valeurs ; `placeholder` ; rangs `pair-rank` « 01 », « 02 » |
| noms de retrait | 2 rangées | « Retirer la paire 1 », « Retirer la paire 2 » |
| ajout | `pair-add` pressé | libellé « Ajouter une paire » ; modèle = 2 rangées + `{ a: '', b: '' }` ; 3ᵉ cellule `p-3-x` |
| retrait | `pair-remove` n° 0 pressé | modèle = seconde rangée seule ; cellule restante `p-1-x` « A 1 » valeur `a2` ; rang « 01 » ; retrait « Retirer la paire 1 » |
| erreur de cellule (`it.each` `pair-x` / `pair-y`) | rangée vide, une cellule quittée | `aria-invalid="true"`, `aria-describedby` = `p-1-<slug>-error` ; erreur `data-testid` `pair-<slug>-error`, `role=alert`, « Requis » ; l'autre cellule `aria-invalid="false"` sans `aria-describedby` |
| erreur de la bonne rangée | 2ᵉ rangée vidée, quittée | une seule `pair-x-error`, `id` `p-2-x-error` |

**`admin-project-form.spec.ts`**, describe « cellules de rangée vides » (1 test) : projet édité,
rangée « Pourquoi » ajoutée vide, soumis → rien d'émis ; `tech-choice-techno-error`
(`id` `tech-1-techno-error`) et `tech-choice-why-error` (`id` `tech-1-why-error`), `role=alert`,
« Ce champ est obligatoire ».

Filet : les 5 tests « lignes répétées » de `admin-project-form.spec.ts`, inchangés.

RED confirmé via `pnpm test` le 2026-10-08 20:12 : 10 failed / 3083 total pour cette tranche (10
tests neufs). Échecs = assertions (`expected [] to deeply equal [...]` contre le gabarit vide ;
`errors` vides côté formulaire).

### Tranche L6.3 — les champs obligatoires de l'identité sont annoncés et reliés

**`admin-project-form.spec.ts`**, describe « identité, erreur annoncée et reliée » (6 tests)

| Test | Scénario | Assertions clés |
| --- | --- | --- |
| erreur reliée (`it.each` titre / catégorie) | nouveau projet, champ quitté vide | `aria-invalid="true"` ; `aria-describedby` = `project-title-error` / `project-category-error` ; l'élément porte `admin-project-title-error` / `admin-project-category-error`, `role=alert`, « Ce champ est obligatoire » |
| au rendu (`it.each` × 2) | projet édité | `aria-invalid="false"`, aucun `aria-describedby` |
| nature invalide | soumission sans nature | `fieldset[admin-project-kind]` : `role=radiogroup`, `aria-invalid="true"`, `aria-describedby` = `project-kind-error` ; `admin-project-kind-error` porte cet `id` |
| nature valide | projet `demo` édité | `role=radiogroup`, `aria-invalid="false"`, aucun `aria-describedby` |

Le scénario « vidé puis quitté » du plan devient « quitté vide » sur un nouveau projet : une
catégorie ne se vide pas (option vide `disabled`). Filet : « nature du projet » et « sections
numérotées », inchangés.

RED confirmé via `pnpm test` le 2026-10-08 20:12 : 6 failed / 3083 total pour cette tranche (6 tests
neufs). Échecs = assertions (`role: null`, `invalid: null`/`undefined`).

### Tranche L6.4 — la description obligatoire est annoncée et reliée

**`admin-project-form.spec.ts`**, describe « description, erreur annoncée et reliée » (3 tests) :
vidée puis quittée → `aria-invalid="true"`, `aria-describedby` = `project-description-hint
project-description-error`, erreur `admin-project-description-error`, `role=alert` ; au rendu →
`aria-invalid="false"`, `project-description-hint` seul ; reprise (« Reprise ») → idem, plus
d'élément `project-description-error`.

Filet : « présentation dans les Réalisations » et « couverture », inchangés.

RED confirmé via `pnpm test` le 2026-10-08 20:12 : 3 failed / 3083 total pour cette tranche (3 tests
neufs). Échecs = assertions (`invalid: null` au lieu de `'true'`/`'false'`).

### Tranche L6.5 — la galerie est rendue par l'éditeur

**`admin-project-form.spec.ts`** (changement de contrat) : `renderForm` perd `projectId`,
`gallery`, `galleries` et ses fournisseurs (`ProjectsGateway`, `ToastStore`, inutiles sans
galerie) ; `SECTION_CONTROLS` passe à 4 sections ; « cinq fieldsets » → « quatre » ; « quatre
sections dans `project-form` et la galerie dehors » → `inForm` = 4 × `true` ; nouveau `it.each`
(nouveau projet / projet enregistré) : ni `admin-project-gallery` ni
`admin-project-gallery-pending` dans l'hôte. Le describe « galerie » (4 tests) est retiré : trois
sont repris dans l'éditeur ci-dessous, la suppression d'une capture l'est déjà par
`admin-project-editor.spec.ts` (« galerie », 2 tests existants).

**`admin-project-editor.spec.ts`**, describe « galerie » (2 tests neufs ; l'hôte du formulaire est
lu par `By.directive(AdminProjectForm)`)

| Test | Scénario | Assertions clés |
| --- | --- | --- |
| projet enregistré | `/admin/projects/p-1` | 5ᵉ `form-section` « 05 · Galerie », **hors** de l'hôte `AdminProjectForm`, après lui, hors de tout `<form>`, avant `savebar-submit` ; 2 `admin-gallery-item`, aucun titre `h1`-`h6`, pas de `pending` |
| nouveau projet | `/admin/projects/new` | section hors de l'hôte du formulaire ; pas d'`admin-project-gallery` ; « Enregistrez le projet pour ajouter des captures. » |

Filet : « galerie » (suppression, titre conservé) et sommaire (`#project-gallery`), inchangés.

RED confirmé via `pnpm test` le 2026-10-08 20:12 : 6 failed / 3083 total pour cette tranche (4
tests du formulaire, dont 2 réécrits, et 2 de l'éditeur). Échecs = assertions (5 fieldsets au lieu
de 4, `pending` présent, `renderedByForm: true`).

Sans test : style invalide d'`app-select` (CSS, aucun projet de test visuel) et `RequiredMark`
(présentationnel, couvert par les libellés du parent).

Total du lot : 29 failed / 3083 total (3 fichiers en échec sur 185), exit 1 ; les 3054 autres
tests passent, soit la base moins les 4 tests de galerie retirés, la 5ᵉ entrée de
`SECTION_CONTROLS` et les 2 tests réécrits.

Lot **L4** : RED de la seule tranche L4.2, branche `refactor/copy-formats-l4` (L4.1 pas encore
jouée). Commande : `pnpm test; echo exit=$?`, après `ng cache clean` et purge de
`node_modules/.vite`. Base avant RED : `184 passed (184)` fichiers, `3083 passed (3083)` tests.

**Échafaudage de signature (à remplacer en GREEN)** : `shared/format/counted.ts`, `counted(_count,
_singular, _plural): string` au corps `return ''` (paramètres préfixés `_` pour la règle
`no-unused-vars`, à renommer en GREEN). Le spec n'importe que `counted` : `pluralize` et
`groupedNumber` ne sont pas encore à leur emplacement `shared/format/`.

### Sans RED : L4.1 et L4.3

- **L4.1** (déplacements `git mv`, extraction de `groupedNumber`) : aucun test écrit, filet = specs
  existantes citées par le plan. Le `grouped-number.spec.ts` que le plan range sous L4.2 n'est pas
  écrit : il importe `shared/format/grouped-number.ts`, créé par L4.1, et serait vert d'emblée ;
  il se joint à L4.1.
- **L4.3** (adoption de `counted` et `pluralize`, sortie identique) : aucun test écrit, filet =
  specs existantes citées par le plan.

### Tranche L4.2 — les compteurs des en-têtes d'admin groupent les milliers

Les attendus écrivent le séparateur de milliers en échappement ` ` (espace fine insécable,
celle que produit `Intl.NumberFormat('fr-FR')` sous Node 24, vérifié), jamais en littéral.

**`shared/format/counted.spec.ts`** (nouveau, `it.each` × 8, unité `projet`/`projets`)

| Nombre | Attendu |
| --- | --- |
| 0, 1 | `0 projet`, `1 projet` |
| 2, 999 | `2 projets`, `999 projets` |
| 1000, 1234 | `1 000 projets`, `1 234 projets` |
| 12 345, 1 500 000 | `12 345 projets`, `1 500 000 projets` |

Espace simple entre le nombre et le nom (le plan fixe cette typographie pour `counted`).

**`admin-page-copy.spec.ts`** (3 cas ajoutés aux `it.each` existants)

| Fonction | Données | Attendu |
| --- | --- | --- |
| `projectsOverline` | 1234 réalisations, 1000 en avant | `1 234 réalisations · 1 000 mises en avant` |
| `postsOverline` | 1000 publiés, 234 brouillons | `1 234 articles · 1 000 publiés · 234 brouillons` |
| `messagesOverline` | 1200 non lus, 34 lus | `1 200 non lus · 1 234 au total` |

RED confirmé via `pnpm test` le 2026-10-08 20:44 : 11 failed / 3094 total (2 fichiers en échec sur
186), exit 1. Échecs = assertions : `expected '' to be '…'` (8, squelette) et `expected '1234
réalisations · 1000 mises en avant…'` sans groupement (3). Les 3083 tests de la base restent verts.

Lot **L7** : RED de la seule tranche L7.1, branche `refactor/toast-default-summary-l7` (depuis
master `0d7758b`, L4 mergé). Commande : `pnpm test; echo exit=$?`, après `ng cache clean` et purge
de `node_modules/.vite`. Base avant RED : `187 passed (187)` fichiers, `3099 passed (3099)` tests.
Aucun squelette : `toast-store.ts` existe.

### Sans RED : L7.2

Retrait des 18 `summary` littéraux : aucun test écrit, filet = specs citées par le plan
(`admin-messages`, `admin-blog`, `admin-projects`, `admin-cv`, `admin-project-gallery`, `login`,
`error-toast`, `contact-form`). Sweep des specs : seuls `admin-cv.spec.ts` et
`admin-project-gallery.spec.ts` figeaient « Succès »/« Erreur » sur un toast ; aucun autre
consommateur n'asserte le titre.

### Tranche L7.1 — un toast sans titre prend celui de sa sévérité

**`shared/ui/toast-store.spec.ts`** (nouveau, `TestBed.inject(ToastStore)`, `life: 0` : aucun
minuteur ; lu par le signal `messages()`, projeté sur `{ severity, summary }` ; 6 tests)

| Test | Scénario | Assertions clés |
| --- | --- | --- |
| titre par sévérité (`it.each` × 4) | `add({ severity, detail })` | success « Succès », info « Information », warn « Attention », error « Erreur » |
| sans sévérité ni titre | `add({ detail })` | `{ severity: 'info', summary: 'Information' }` |
| titre fourni | `add({ severity: 'success', summary: 'Message envoyé' })` | titre gardé ; vert d'emblée (non-régression du contact, assumé) |

**Réduction prescrite par le plan** (le titre est désormais prouvé par le store, plus par chaque
appelant) : `admin-cv.spec.ts` (2 assertions) et `admin-project-gallery.spec.ts` (4, via une aide
locale `toasts()`) projettent les appels à `add()` sur `{ severity, detail }` ; `summary` retiré
des 6 attendus, aucun autre attendu modifié. Verts avant et après.

RED confirmé via `pnpm test` le 2026-10-08 21:10 : 5 failed / 3105 total (1 fichier en échec sur
188), exit 1. Échecs = assertions : `"summary": undefined` reçu au lieu du titre attendu (5). Les
3099 tests de la base et le test « titre fourni » restent verts.

Lot **L8** joué en un seul RED (demande de la session principale), branche
`refactor/editor-shell-l8` (master `51b3e6c`, L7 mergé). Commande : `pnpm test; echo exit=$?`, après
`ng cache clean` et purge de `node_modules/.vite`. Base avant RED : `188 passed (188)` fichiers,
`3105 passed (3105)` tests, exit 0.

**Échafaudage de signature (à remplacer en GREEN)** :

- `features/admin/application/editor-draft.ts` : types exportés du plan (`EditedDraft`,
  `CoverUpload`, `SaveResult`) et classe `EditorDraft` aux membres typés, corps neutres (signaux à
  leur valeur initiale, `value` = `toDraft(null)`, méthodes vides, `canLeave` → `true`, `save` →
  `{ success: false, error: null }`).
- `components/admin-page-header.ts` : `AdminPageParent` exporté, `parent = input<AdminPageParent>()`
  déclaré sans rendu, et `overline` passé de `input.required` à `input('')` (prévu au plan pour le
  GREEN, avancé ici : l'hôte de test qui ne passe que `parent` lèverait sinon l'erreur de
  compilation d'entrée requise, et aucun test du fichier ne tournerait).
- `projects/domain/gateways/projects.gateway.ts` : `getProjectById(id): Observable<Project | null>`.
  `HttpProjectsGateway` (`Observable<Project>`) et `stubProjectsGateway` restent assignables, le
  typecheck des specs passe.

Aucun comportement n'y est écrit : `angular-expert` les implémente.

### Tranche L8.1 — en mise à jour, un projet est enregistré même si sa couverture échoue

**`admin-project-editor.spec.ts`**, describe « mise à jour » (2 tests réécrits, 1 nouveau)

| Test | Scénario | Assertions clés |
| --- | --- | --- |
| écriture puis envoi (réécrit) | couverture choisie sur `p-1`, enregistrée | `uploads` `[[COVER, 'p-1']]`, `patches` 1, `updateProject` appelé avant `uploadImage` |
| relecture (réécrit) | `getProjectById` répond une copie de `DASHFLOW`, puis le même projet avec `image` `https://cdn.test/projects/p-1.avif` | `requested` 2, couverture courante et aperçu sur cette URL, pas d'aperçu « en attente », barre « Aucune modification » |
| envoi en échec (nouveau) | titre « Après », couverture choisie, `uploadImage` en erreur | `toasts` = `[{ warn, "Projet mis à jour, mais l'envoi de l'image a échoué. Réessayez." }, { success, 'Projet mis à jour' }]`, `patches` 1, titre « Après », « Aucune modification », `requested` 1 |

RED confirmé via `pnpm test` le 2026-10-08 21:36 : 3 failed / 3129 total pour cette tranche.
Échecs = assertions (`patchFirst: false` ; `requested: 1`, `current: undefined` ; `patches: 0`,
« 2 modifications non enregistrées », toast d'erreur). Le 3ᵉ compare des toasts entiers par l'aide
brute de L8.2 : après le GREEN de L8.1, il ne doit plus échouer que sur `summary`, jusqu'au GREEN de
L8.2.

### Tranche L8.2 — les éditeurs laissent le titre du toast au store

Aide `toasts()` des deux specs d'éditeur : rend l'argument brut de `add()`
(`toast.mock.calls.map(([message]) => message)`, typé `ToastMessage`). Aucun attendu modifié.

RED confirmé via `pnpm test` le 2026-10-08 21:36 : 23 failed / 3129 total pour cette tranche. Échecs
= assertions, tous de la forme `+ "summary": "Succès" | "Attention" | "Erreur"` reçu en plus :

- `admin-project-editor.spec.ts` (12) : création (2), mise à jour (titre édité, `PATCH` en échec),
  détail du refus de l'API (5 `it.each` + 2 couvertures en 400 / 500), fichier qui n'est pas une
  image ;
- `admin-post-editor.spec.ts` (11) : création (2), mise à jour (titre édité, écriture en échec),
  détail du refus de l'API (4 `it.each` + 2 couvertures), fichier qui n'est pas une image.

Les tests qui ne projettent que `severity` restent verts.

### Tranche L8.3 — le brouillon d'édition s'écrit une fois

**`editor-draft.spec.ts`** (nouveau, sans TestBed ; entité locale `{ id, title, tags }` construite
par appel de `aNote()` dans chaque test, `toDraft` = `{ title }`, sections `note-text`
(`title`, `tags`) et `note-cover` (`cover`), `loaded` = `signal` du test, `makeDraft(null)`
explicite pour une entité neuve ; 18 tests)

| Test | Scénario | Assertions clés |
| --- | --- | --- |
| état initial | entité chargée | `value` `{ title: 'Carnet' }`, `tags` `['Angular']`, `saved` = l'entité, `changes` 0, sommaire à 2 entrées sans « modifié » |
| modifications (`it.each` × 5) | titre changé ; étiquette ajoutée ; couverture choisie ; titre rétabli ; couverture choisie puis `clearCover()` | `changes` 1 / 1 / 1 / 0 / 0, sommaire `['modifié', '']` / `['modifié', '']` / `['', 'modifié']` / `['', '']` / `['', '']` |
| couverture refusée | `selectCover` puis `rejectCover()` | choisie = `COVER`, puis `pendingCover` `null`, jeton 1, `changes` 0 |
| réalignement | titre édité, puis `loaded` → `n-2` « Journal » `['RxJS']` | `value`, `tags`, `saved` suivent, `changes` 0 |
| quitter sans changement | — | `canLeave()` `true`, `leave.asked()` `false` |
| quitter avec changement | titre édité | une promesse, `asked` `true`, `answer(true)` la résout à `true` |
| `warnBeforeUnload` (`it.each` × 2) | édité / intact | `preventDefault` appelé 1 / 0 fois |
| `save` sans couverture | titre édité | `{ success: true, data: { saved, cover: { status: 'none' } } }`, aucun envoi, `saved()` = l'entité écrite, `changes` 0 |
| `save` avec couverture | entité neuve, écriture → `n-9` | `cover` `{ status: 'sent' }`, `uploadCover` `[[COVER, 'n-9']]` après `write`, couverture vidée, jeton 1, `changes` 0 |
| envoi rejeté | couverture choisie | `cover` `{ status: 'failed', error }`, `saved` « Après », couverture vidée, `changes` 0 |
| écriture rejetée | titre et couverture | `{ success: false, error }`, aucun envoi, `saved` « Carnet », couverture conservée, `changes` 2 |
| `saving` (`it.each` × 2) | écriture tenue par le test, puis résolue / rejetée | `true` pendant, `false` après |

RED confirmé via `pnpm test` le 2026-10-08 21:36 : 16 failed / 3129 total pour cette tranche (18
tests neufs ; verts d'emblée contre l'échafaudage : « quitter sans changement » et
`warnBeforeUnload` intact, gardes contre le faux positif). Échecs = assertions (`value: { title: '' }`,
`changes: 0`, `toc: []`, `{ success: false, error: null }`, `during: false`).

Le test `saving` suppose que `save()` appelle `write()` de façon synchrone (avant tout `await`),
comme le font les éditeurs aujourd'hui.

### Tranche L8.4 — les éditeurs partagent l'en-tête d'admin, fil d'Ariane compris

**`admin-page-header.spec.ts`**, describe « with a parent page » (hôte `[heading]` + `[parent]`
`{ Projets, /admin/projects }`, sans `overline`, `provideRouter([])` ; 2 tests)

| Test | Scénario | Assertions clés |
| --- | --- | --- |
| fil d'Ariane | parent fourni | `admin-breadcrumb` `NAV` « Fil d'Ariane », dans le même `header` que le titre et avant lui ; `admin-breadcrumb-parent` `A` « Projets » `href` `/admin/projects` ; `admin-breadcrumb-current` « DashFlow », `aria-current="page"` ; aucun `admin-page-overline` ; un seul `h1`, `tabindex` `-1` |
| titre qui change | `heading` → « DashFlow 2 » | courant et titre « DashFlow 2 » |

Les 4 tests existants restent verts.

**Specs d'éditeur** : `admin-breadcrumb-projects` (×3) et `admin-breadcrumb-posts` (×2) deviennent
`admin-breadcrumb-parent` ; le test d'ouverture du projet existant et l'`it.each` d'ouverture de
l'article (× 2) ajoutent `titleTabindex: '-1'`.

RED confirmé via `pnpm test` le 2026-10-08 21:36 : 20 failed / 3129 total pour cette tranche. Échecs
= assertions :

- en-tête (2) : `breadcrumb.tag: undefined`, `overline` présent, courant vide ;
- ouverture (3 : projet, article × 2) : `titleTabindex: null` ;
- fil d'Ariane (6 : `it.each` × 2 et « suivre le lien » par éditeur) : lien absent ;
- sortie par le fil d'Ariane (9) : l'aide `followBreadcrumb` clique `admin-breadcrumb-parent`, qui
  n'existe pas encore, donc l'adresse ne change pas et le dialogue ne s'ouvre pas. Projet : « quitter
  la page » (sans changement, avec changement, réponse `confirm`) et « enregistré puis quitter » ;
  article : les mêmes 4, plus « gras depuis la barre puis quitter ». Les réponses `cancel` / `escape`
  et « dialogue écarté » restent vertes (elles attendent l'adresse de l'éditeur).

### Sans RED : L8.5

Aucun test écrit (cadre extrait, comportement constant). Filet : specs existantes citées par le plan.
L'état `empty` du projet, que le cadre rendra, est éprouvé par L8.6.

### Tranche L8.6 — un projet introuvable le dit et ramène à la liste

**`http-projects.gateway.spec.ts`**, describe « Projet introuvable » (`it.each` × 2, issue lue par
`then(value → { value }, erreur → { failedWith: status })`, `verify()` en fin de test comme le
reste du fichier) : 404 → `{ value: null }` ; 500 → `{ failedWith: 500 }`. Type des `call` de
« Adaptation des réponses » élargi à `Observable<Project | readonly Project[] | null>`.

**`admin-project-editor.spec.ts`**, describe renommé « chargement, erreur et introuvable », 1 test :
`/admin/projects/p-404` avec `getProjectById` → `of(null)` ; `crash` `null`,
`admin-project-editor-missing` « Ce projet n'existe pas ou a été supprimé. », aucun `load-error`, aucun
`admin-project-form`, `admin-project-editor-back` `A` vers `/admin/projects`.

RED confirmé via `pnpm test` le 2026-10-08 21:36 : 2 failed / 3129 total pour cette tranche (3 tests
neufs ; le 500 est vert d'emblée, non-régression assumée). Échecs = assertions (`{ failedWith: 404 }`
au lieu de `{ value: null }` ; formulaire rendu, pas de message).

Total du lot : 64 failed / 3129 total (5 fichiers en échec sur 189), exit 1. 64 = 3 + 23 + 16 + 20
+ 2 ; 60 `AssertionError` affichées (Vitest regroupe les erreurs identiques), aucune erreur de
compilation, de harnais, `NG0` ni dépassement de délai. Les 3065 autres tests passent : la base
(3105) moins les 43 tests existants rendus rouges (dont les 2 réécrits de L8.1), plus les 3 neufs
verts d'emblée (24 tests neufs, 21 rouges).

Lot **L9**, branche `refactor/tags-form-value-control-l9` (master `fc1f214`, L8 mergé). Commande :
`pnpm test; echo exit=$?`, après `ng cache clean` et purge de `node_modules/.vite`. Base avant RED :
`189 passed (189)` fichiers, `3129 passed (3129)` tests, exit 0. L9.2 est jouée après le GREEN de L9.1.

**Échafaudage de signature (à remplacer en GREEN)**, conforme au plan :

- `components/admin-tags-selector.ts` : `implements FormValueControl<readonly string[]>`,
  `value = model<readonly string[]>([])` à la place de `selectedTags`, `chips` rend toutes les puces
  non pressées (teinte `tint`), `toggleTag` `protected` à corps vide (seule erreur `pnpm lint` du
  lot : `no-empty-function`, levée par le GREEN) ;
- `project-draft.ts` / `post-draft.ts` : champ `tags: readonly string[]`, `toXDraft` rend
  `tags: []`, `toProjectInput(draft, kind)`, `toPostInput(draft)`, `toPreviewProject(draft, base)`,
  `toPreviewPost(draft, base)` rendent `tags: []` ;
- formulaires : modèle `tags` supprimé, sélecteur sans liaison, soumission à la nouvelle signature ;
- éditeurs : `[(tags)]` retiré, aperçu à la nouvelle signature ;
- `editor-draft.ts` non touché (il compile : son membre `tags` survit sans lecteur).

### Tranche L9.1 — les étiquettes passent par le champ `tags` du formulaire

**`admin-tags-selector.spec.ts`** (réécrit ; `setInput('value', [...])`, lecture de
`componentInstance.value()`, `settle` ; 14 tests)

| Test | Scénario | Assertions clés |
| --- | --- | --- |
| puces pressées | disponibles `['Angular', 'PBKDF2']`, `value` `['Angular']` | noms `['Angular', 'PBKDF2']`, `aria-pressed` `['true', 'false']` |
| clic (`it.each` × 3) | `['Angular']` + PBKDF2 ; `['Angular']` + PBKDF2, Angular ; `['Angular', 'PBKDF2']` + Angular, Angular | `value` `['Angular', 'PBKDF2']` / `['PBKDF2']` / `['PBKDF2', 'Angular']` (retirée puis rajoutée : en fin), `aria-pressed` explicite par ligne, tableau passé à `setInput` inchangé (nouvelle liste à chaque clic) |
| hors catalogue | `value` `['Héritée', 'Angular']`, clic PBKDF2 | `value` `['Héritée', 'Angular', 'PBKDF2']`, puces `['Angular', 'PBKDF2']` seules |
| couleurs (`it.each` × 6) | attendus inchangés | `tint` au repos, `solid` après clic, plus de `tint` |
| hôte `[formField]` : rendu | `imports: [AdminTagsSelector, FormField]`, `draft = signal({ tags: ['Angular'] })`, `form(draft)` en initialiseurs de champ | `aria-pressed` `['true', 'false']` |
| hôte `[formField]` : clic | clic PBKDF2 | `draft().tags` `['Angular', 'PBKDF2']`, `aria-pressed` `['true', 'true']` |
| hôte `[formField]` : écriture externe | `draft.set({ tags: ['PBKDF2'] })` | `aria-pressed` `['false', 'true']` |

**`project-draft.spec.ts`** / **`post-draft.spec.ts`** : un argument en moins à chaque appel ; les
étiquettes passent par le brouillon. `previewOf(overrides, base)` sans défaut (le `BASE` ou `null`
est passé à chaque appel ; plus de paramètre `tags` à défaut piégé). `DRAFT` littéral remplacé par
un builder local `aDraft(overrides)` (étiquettes par test). Attendus de `toXDraft` complétés de
`tags` (`[]` sans entité ; les étiquettes de l'entité sinon, « cinq champs » pour l'article).
Tests neufs : « Given a tagged project / a saved article When the draft is built Then its tags are
a copy in the … order » (`tags` égal, `same` `false`). « selection order » devient « Given draft
tags When the payload is built Then they are sent in the draft order, as a copy » (même ordre,
`same` `false`).

**`admin-project-form.spec.ts`** / **`admin-post-form.spec.ts`** : `tags` retiré de `RenderedForm` et
du harnais ; `rendered.value().tags` ; `toProjectInput(toProjectDraft(project), 'script')` et
`toPostInput(toPostDraft(EDITABLE))`. Tests neufs : « Given an edited project/post When the form
renders Then its tags are pressed » (entité construite dans le test ; puces pressées de
`admin-project-tags` = `['Angular', 'NestJS']`, de `admin-post-tags` = `['Angular', 'Chiffrement']`,
ordre du catalogue).

**`editor-draft.spec.ts`** : `NoteDraft = { title; tags: readonly string[] }`, `toNoteDraft` copie
les étiquettes ; `value` attendu `{ title, tags }` (état initial, réalignement) ; « a tag added » =
`value.update` qui ajoute `RxJS`. Les 11 `value.set({ title })` deviennent
`value.update((value) => ({ ...value, title }))`.

**`count-draft-changes.spec.ts`** : `Edited` = `Omit<ProjectDraft, 'tags'> & { readonly tags:
ReadonlySet<string> }`.

Adaptation mécanique : `count-draft-changes.spec.ts` (1 type), `editor-draft.spec.ts` (11 écritures
`value.set` → `value.update`), specs de formulaire et de conversion (signatures) — aucune valeur
attendue modifiée hors des attendus que le contrat change (`value` et `toXDraft` portent désormais
`tags`).

RED confirmé via `pnpm test` le 2026-10-09 17:27 : 35 failed / 3139 total pour cette tranche (8
fichiers en échec sur 189), exit 1. Échecs = assertions uniquement (31 `AssertionError` affichées,
Vitest regroupe les identiques ; aucune erreur TS, `NG0`, de harnais ni dépassement de délai) :

- `admin-tags-selector.spec.ts` (14/14) : `aria-pressed` tout à `'false'`, `value` inchangée après
  clic, couleur `solid` absente ;
- `project-draft.spec.ts` (5) : `toProjectDraft` complet, copie des étiquettes, charge utile
  intacte, ordre du brouillon, aperçu édité (`tags: []` reçu) ;
- `post-draft.spec.ts` (8) : brouillon « cinq champs », copie, charge utile × 2, `it.each` des
  sujets × 2 (la ligne `[]` reste verte), aperçu édité, aperçu neuf ;
- formulaires (2 + 2) : test neuf « pressed » (`[]` reçu), clic de puce (`tags: []`, `sent: [[]]`) ;
- `editor-draft.spec.ts` (1) : « a tag added » (`changes` 0 : l'ancien membre `tags` écrase celui
  de `value`) ;
- `admin-project-editor.spec.ts` (1) : `pickTag` → « Aucune modification » ;
- `admin-post-editor.spec.ts` (2) : création avec `pickSubject` (payload `tags: []`) et « a
  subject » des modifications non enregistrées (l. 881, non listé au plan).

Restent verts, comme prévu : la soumission inchangée des deux formulaires (deux appels de la même
conversion échafaudée), le `tags: []` de création du projet, `toXDraft(null)`. Les 3104 autres
tests passent : la base (3129) moins les 25 tests existants rendus rouges, plus les 10 neufs dont
aucun n'est vert d'emblée.

### Tranche L9.2 — retirer puis rajouter une étiquette ne compte pas comme une modification

Jouée après le GREEN de L9.1 (3139/3139, exit 0 ; `EditorDraft` compare `{ ...draft, cover }`, à
l'ordre près). Pas d'échafaudage.

**`editor-draft.spec.ts`**, `it.each` neuf (entité `aNote({ tags: ['Angular', 'RxJS'] })` construite
par test, `value.update` avec une copie du tableau ; 2 tests)

| Test | Scénario | Assertions clés |
| --- | --- | --- |
| même ensemble, autre ordre | `tags` ← `['RxJS', 'Angular']` | `changes` 0, sommaire `['', '']` |
| triangulation | `tags` ← `['Angular', 'Zod']` | `changes` 1, sommaire `['modifié', '']` (vert d'emblée, assumé) |

**`admin-project-editor.spec.ts`**, describe « modifications non enregistrées », 1 test neuf : « Given
a project tagged Angular and TypeScript When Angular is unpicked then picked again Then nothing is
reported as changed ». `getProjectById` répond `makeProject({ id: 'p-1', kind: 'production', tags:
['Angular', 'TypeScript'] })`, construit à chaque appel (pas de `DASHFLOW`) ; `pickTag` deux fois
sur « Angular » ; barre « Aucune modification », sommaire `['', '', '', '', '']`.

RED confirmé via `pnpm test` le 2026-10-09 17:31 : 2 failed / 3142 total pour cette tranche (2
fichiers en échec sur 189), exit 1. Échecs = assertions (`changes: 1, toc: ['modifié', '']` au lieu
de 0 ; « 1 modification non enregistrée », section 04 « modifié »). Aucune erreur TS, `NG0`, de
harnais ni de délai. Les 3140 autres tests passent : les 3139 de la base, plus la ligne de
triangulation.

## Journal des tranches

- **Tranche L5.1 — l'erreur d'un champ d'article est annoncée et reliée** : GREEN 3059 passed / 3060 total (seul rouge : « sans testId » de `field-error.spec.ts`, défaut du test, cf. ## Verify) · refactor : aucun
- **Tranche L5.2 — sans RED** : GREEN inchangé (filet `admin-post-form.spec.ts`, `admin-content-image-upload.spec.ts`) · refactor : `RequiredMark` ×3 et `REQUIRED_MESSAGE` (2 consommateurs : `admin-post-form.ts`, `admin-image-alt-schema.ts`)
- **Tranche L5.3 — une soumission d'article invalide amène au premier champ fautif** : GREEN 3059 passed / 3060 total · refactor : `focusFirstInvalidField` privé du contact supprimé au profit de `focusFirstInvalid`
- **Tranche L5.4 — l'erreur du texte alternatif d'une capture est annoncée et reliée** : GREEN 3059 passed / 3060 total · refactor : aucun
- **Tranche L5.5 — sans RED** : GREEN 3059 passed / 3060 total · refactor : prédicat « erreur affichée » lu une fois par `@let <champ>InError` dans le contact, l'auth et l'insertion d'image (il était écrit deux à trois fois par champ)
- **Tranche L6.1 — une soumission de projet invalide amène au premier champ fautif** : GREEN (les 4 tests de la tranche passent ; 25 failed / 3083 total, tous des tranches suivantes) · refactor : aucun
- **Tranche L6.2 — les rangées répétées deviennent une section et signalent leurs cellules vides** : GREEN 9 passed / 9 dans `admin-pair-rows.spec.ts` après correction du harnais par la session principale (le seul rouge était un défaut du test : attendu construit sur les objets partagés `TWO_ROWS`, que Signal Forms marque d'un symbole par formulaire rendu ; prouvé par une copie temporaire du spec, 9 passed / 9, copie supprimée) · refactor : les 4 méthodes de rangées et les classes `repeatHeadClass`/`repeatRowClass` du parent supprimées au profit d'`AdminPairRows` (2 consommateurs : « Pourquoi ces outils », « Décisions »)
- **Tranche L6.3 — les champs obligatoires de l'identité sont annoncés et reliés** : GREEN · refactor : section extraite dans `AdminProjectIdentityFields` (`categories`, `kinds` déplacés), `REQUIRED` local du parent remplacé par `REQUIRED_MESSAGE`
- **Tranche L6.4 — la description obligatoire est annoncée et reliée** : GREEN · refactor : section extraite dans `AdminProjectPresentationFields` (couverture comprise) ; les 3 erreurs de présentation passent aussi par `FieldError` (`span` → `p`, mêmes `id`/`data-testid`)
- **Tranche L6.5 — la galerie est rendue par l'éditeur** : GREEN 3083 passed / 3083 total · refactor : `PairColumn` n'est plus exporté (aucun consommateur hors de son fichier)
- **Tranche L4.1 — déplacement, sans RED** : GREEN hors RED de L4.2 (11 failed, les mêmes / 3099 total, dont 5 nouveaux `grouped-number.spec.ts` verts) · refactor : aucun
- **Tranche L4.2 — les compteurs des en-têtes d'admin groupent les milliers** : GREEN 3099 passed / 3099 total · refactor : aucun (les deux `counted` locaux supprimés font partie de la tranche)
- **Tranche L4.3 — adoption, sans RED** : GREEN 3099 passed / 3099 total · refactor : imports `@shared/format/*` rangés à leur place alphabétique dans les 17 fichiers touchés
- **Tranche L7.1 — un toast sans titre prend celui de sa sévérité** : GREEN 3105 passed / 3105 total · refactor : aucun
- **Tranche L7.2 — retrait des littéraux, sans RED** : GREEN 3105 passed / 3105 total · refactor : les 12 appels à `add()` réduits à `{ severity, detail }` tiennent sur une ligne et sont repliés, comme les appels déjà écrits sur une ligne (prettier garde les objets multilignes tels quels)
- **Tranche L8.1 — en mise à jour, un projet est enregistré même si sa couverture échoue** : GREEN, joué d'affilée avec L8.2 (son 3ᵉ test compare des toasts entiers) ; les 3 tests de la tranche passent, 19 rouges restants dans les deux specs d'éditeur, tous de L8.4 et L8.6 · refactor : aucun (la branche `create`/`update` de la couverture disparaît dans la tranche elle-même)
- **Tranche L8.2 — les éditeurs laissent le titre du toast au store** : GREEN, mêmes 19 rouges restants (L8.4, L8.6) · refactor : aucun
- **Tranche L8.3 — le brouillon d'édition s'écrit une fois** : GREEN, `editor-draft.spec.ts` 18 passed / 18, mêmes 19 rouges restants · refactor : `CoverUpload` et `SaveResult` ne sont plus exportés (aucun consommateur hors d'`editor-draft.ts`) ; `EditedProject`, `EditedPost`, `toEditedProject`, `toEditedPost`, les 8 signaux de brouillon et les `uploadCover`/`markSaved` locaux disparaissent des éditeurs
- **Tranche L8.4 — les éditeurs partagent l'en-tête d'admin, fil d'Ariane compris** : GREEN, 1297 passed / 1298 dans `features/admin/application` (seul rouge : l'introuvable de L8.6) · refactor : aucun (parent passé en littéral dans le gabarit, sans constante à un seul site)
- **Tranche L8.5 — sans RED** : GREEN inchangé (même rouge unique de L8.6) ; les requêtes `By.directive(AdminProjectForm)` / `By.directive(FileDropzone)` traversent `NgTemplateOutlet`, le risque du plan ne se matérialise pas · refactor : aucun
- **Tranche L8.6 — un projet introuvable le dit et ramène à la liste** : GREEN 3129 passed / 3129 total · refactor : ordre alphabétique des imports `components/*` rétabli dans `admin-project-editor.ts`
- **Tranche L9.1 — les étiquettes passent par le champ `tags` du formulaire** : GREEN 3139 passed / 3139 total ; `[formField]` accepte `readonly string[]` des deux côtés (`ngc -p tsconfig.app.json`, `strictTemplates`, exit 0), repli `string[]` non nécessaire · refactor : aucun (le membre `tags` d'`EditorDraft`, son `linkedSignal` et les clés `tags` de `baseline`/`edited` disparaissent dans la tranche elle-même)
- **Tranche L9.2 — retirer puis rajouter une étiquette ne compte pas comme une modification** : GREEN 3142 passed / 3142 total ; le spread `{ ...draft, tags: new Set(draft.tags), cover }` est accepté tel quel comme `Omit<TDraft, 'tags'> & …` (`ngc`, exit 0), repli par déstructuration non nécessaire · refactor : aucun (`baseline` et `edited` passent par `toEdited` dans la tranche elle-même)

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

### Lot L6

2026-10-08, branche `refactor/project-form-split-l6` (non commitée).

Gates (codes de sortie lus) :

- `pnpm exec ng cache clean`, purge de `node_modules/.vite`, puis `pnpm test; echo exit=$?` → `Test Files 185 passed (185)`, `Tests 3083 passed (3083)`, **exit=0**.
- `pnpm lint; echo exit=$?` → `All files pass linting.`, **exit=0**.
- `pnpm exec prettier --check <10 fichiers touchés>` → `All matched files use Prettier code style!`, **exit=0**.
- `pnpm run build --configuration production; echo exit=$?` → `Prerendered 20 static routes.`, **exit=0** ; règle `app-select[aria-invalid=true]` présente dans le CSS compilé ; puis `git checkout -- public/sitemap.xml public/rss.xml`.

Runtime :

1. Éditeur de projet (`/admin/projects/*`) : **non joué au navigateur**, l'authentification est requise et aucun identifiant de test n'est disponible. Couvert par `admin-project-form.spec.ts`, `admin-project-editor.spec.ts`, `admin-pair-rows.spec.ts`, verts. Aucune surface publique modifiée (seule la règle `app-select` gagne une variante `aria-[invalid=true]`, inerte sans cet attribut).
2. Nom accessible du `fieldset role="radiogroup"` (risque du plan) : reproduction statique du gabarit de la nature (`fieldset role="radiogroup" aria-invalid="true" aria-describedby="project-kind-error"`, `legend` « Nature obligatoire »), servie en local et lue par l'arbre d'accessibilité de Chromium (`Accessibility.getFullAXTree`, headless shell 1208) : `radiogroup "Nature obligatoire"`, description « Ce champ est obligatoire », `invalid=true`. Témoins : `fieldset` sans rôle → `group "Plain legend"` ; `role="radiogroup"` → nom pris dans la `legend`. **PASS** (Chromium). Firefox et lecteur d'écran non vérifiés : repli du plan non nécessaire à ce stade.
3. Rejoué par le `code-reviewer` (2026-10-08) : `ng serve` (port 4300) derrière un faux backend local en lecture seule sur le port 3000 (`/api/auth/me`, `unread-count` et `blog/posts/admin` simulés, autres GET relayés vers l'API de prod, toute écriture refusée en 403), indice de session `auth:session=1` posé en `localStorage`. Steps :
   - `/admin/projects/<LabelSync Pro>` : 5 sections, les 4 premières dans `form#project-form` et l'hôte `app-admin-project-form`, « 05 · Galerie » hors de tout `<form>` et hors de l'hôte, avec 2 captures ; nature `role="radiogroup"` `aria-invalid="false"` ; `id` des rangées conservés (`tech-1-techno`, `decision-1-text`…).
   - « Ajouter un choix technique » ×2 puis « Enregistrer » de la barre : rien n'est envoyé, le focus va sur `tech-3-techno`, 4 alertes `tech-{3,4}-{techno,why}-error` « Ce champ est obligatoire », `aria-invalid="true"` et `aria-describedby="tech-3-techno-error"`.
   - Retrait de la 3ᵉ rangée : rangs renumérotés, noms « Supprimer le choix technique 1…3 ».
   - Titre vidé puis quitté : `aria-invalid="true"`, `aria-describedby="project-title-error"`.
   - `/admin/projects/new`, catégorie quittée vide : `aria-invalid="true"`, `project-category-error`, bordure rouge d'`app-select` visible ; galerie « Enregistrez le projet pour ajouter des captures. » hors du `<form>`.
   - Captures d'écran : rangées en erreur après soumission ; catégorie invalide (panneau navigateur de la session).
   - Console : aucune `NG0xxx` en erreur. Restent `InvalidStateError: Transition was aborted…` (View Transitions, préexistante, cf. Verify L5), un avertissement de préchargement de police et `NG02960` sur les 2 vignettes de la galerie (composant et grille inchangés, préexistant).
   **PASS**.


### Lot L4

2026-10-08, branche `refactor/copy-formats-l4` (non commitée).

Gates (codes de sortie lus) :

- `pnpm test; echo exit=$?` → `Test Files 187 passed (187)`, `Tests 3099 passed (3099)`, **exit=0** (3083 de base + 11 RED de L4.2 + 5 de `grouped-number.spec.ts`).
- `pnpm lint; echo exit=$?` → `All files pass linting.`, **exit=0**.
- `pnpm exec prettier --check <25 fichiers touchés>` → `All matched files use Prettier code style!`, **exit=0**.
- `pnpm run build --configuration production; echo exit=$?` → `Prerendered 20 static routes.`, **exit=0** ; puis `git checkout -- public/sitemap.xml public/rss.xml`.
- `grep -nP '[\x{202F}\x{00A0}]'` sur les 25 fichiers touchés → aucune ligne (échappements seulement).
- `grep -rn "const counted" src` → vide. `grep -rn "application/pluralize\|ui/format-file-size\|groupedNumber.*overview-view" src` → vide.
- `grep -rnE "> 1 \? 's'" src` → **non vide** : 4 lignes de `features/projects/application/projects.ts` (156, 161, 167, 172), fichier absent de la liste du plan, non touché. Écart entre la preuve de fin de lot et le périmètre du plan, à trancher.
  Soldé par la session principale : `projects.ts` adopte `pluralize` (insécable conservée, sorties identiques, specs `projects.spec.ts` vertes) ; le grep est vide, `pnpm test` 3099/3099 exit 0, lint exit 0.

Runtime :

1. Blog (seule surface publique touchée) : `dist/angular-portfolio-app/browser/blog/index.html` prérendu → `0&nbsp;article`, `1&nbsp;article`, `2&nbsp;articles`, `2&nbsp;articles affichés` : insécable et pluriels inchangés. **PASS**.
2. Admin (en-têtes Réalisations / Articles / Messages, toast « tout marquer comme lu », barre d'enregistrement, âge des messages) : **non joué au navigateur** (authentification requise). Couvert par `admin-page-copy.spec.ts`, `counted.spec.ts`, `admin-save-bar.spec.ts`, `admin-messages-view.spec.ts`, `admin-messages.spec.ts`, verts ; la différence n'apparaît qu'au-delà de 999.
3. Rejoué par le code-reviewer (2026-10-08), parce que le point 1 ne couvrait pas `projects.ts` (ajouté après coup, page publique) et ne portait ni capture ni console. Build prod de la branche servi en statique (`dist/angular-portfolio-app/browser`, `127.0.0.1:4317`), navigateur intégré, capture prise sur chaque page.
   - Comparaison avec `master` (build prod du même commit `61c02d6` dans un worktree temporaire, supprimé ensuite) : `blog/index.html` et `projects/index.html` sont identiques octet pour octet, hormis les noms de chunks hachés et la meta CSP (le build `master` n'a pas lancé `postbuild`). Sorties publiques inchangées.
   - `/blog/` : hydraté ; `2 articles`, `1 article`, `0 article`, `2 articles affichés` ; filtre « Sécurité » → `1 article affiché`, recalculé côté client. **PASS**.
   - `/projects/` : hydraté ; `6 réalisations`, `6 réalisations affichées`, `2 applications`, `4 projets`, séparateur U+00A0 vérifié caractère par caractère ; filtre « Démos » → `2 réalisations affichées`, `2 projets`. **PASS**.
   - Console : aucune erreur Angular (`NG0…`) ni exception. Seules erreurs, propres au serveur statique local : `/api/config` en 404 (route servie par le serveur Node en prod) et `api/analytics/track` refusé par CORS depuis l'origine `127.0.0.1`.

### Lot L7

2026-10-08, branche `refactor/toast-default-summary-l7` (non commitée).

Gates (codes de sortie lus) :

- `pnpm test; echo exit=$?` → `Test Files 188 passed (188)`, `Tests 3105 passed (3105)`, **exit=0** (3099 de base + 6 de `toast-store.spec.ts`).
- `pnpm lint; echo exit=$?` → `All files pass linting.`, **exit=0**.
- `pnpm exec prettier --check <13 fichiers de code touchés>` → `All matched files use Prettier code style!`, **exit=0**. (La spec elle-même échoue `prettier --check`, déjà le cas sur `master` `0d7758b` : non touché.)
- `pnpm run build --configuration production; echo exit=$?` → `Prerendered 20 static routes.`, **exit=0** ; puis `git checkout -- public/sitemap.xml public/rss.xml`.
- `grep -nP '[\x{202F}\x{00A0}]'` sur les fichiers de code touchés → aucune ligne.
- Preuve de fin de lot, `grep -rn "summary: '" src | grep -v '\.spec\.ts'` → 7 lignes : `contact-form.ts:310, 313, 318` (titres propres « Message envoyé », « Envoi impossible », gardés par le plan) et `toast.ts:18, 25, 32, 39` (clé `summary` de `SEVERITY_STYLES` : classes CSS du titre, pas un titre). Hors motif : `notify()` d'`admin-project-editor.ts:370` et d'`admin-post-editor.ts:293` (tableau local, réservé à L8). Les 18 littéraux retirés valaient tous le défaut de leur sévérité (12 « Erreur » sur `error`, 6 « Succès » sur `success`), vérifié appel par appel avant retrait.

Runtime (`ng serve` local, navigateur intégré) :

1. `/` : `errorToastInterceptor` (littéral retiré) émet de vrais toasts, le proxy de dev répondant 502 faute d'API locale → 2 toasts titrés « Erreur », détail « Erreur serveur, veuillez réessayer ». **PASS**.
2. Même page, `ng.getComponent(app-root).toastStore.add({ severity, detail, life: 0 })` pour les 4 sévérités, puis un toast titré « Message envoyé » → titres rendus dans `[data-testid="toast-summary"]` : « Succès », « Information », « Attention », « Erreur », « Message envoyé ». **PASS**.
3. Capture : les 5 toasts empilés sur l'accueil (prise au navigateur intégré pendant la session, non versionnée).
4. Console : aucune erreur Angular (`NG0…`). Erreurs propres à l'environnement local : 4 × `502 (Bad Gateway)` (pas d'API derrière le proxy) et un `InvalidStateError: Transition was aborted` de la View Transitions API au chargement.

### Lot L8

2026-10-08, branche `refactor/editor-shell-l8` (non commitée).

Gates (codes de sortie lus) :

- `pnpm test; echo exit=$?` → `Test Files 189 passed (189)`, `Tests 3129 passed (3129)`, **exit=0**.
- `pnpm lint; echo exit=$?` → `All files pass linting.`, **exit=0**.
- `pnpm exec prettier --check <8 fichiers de code touchés>` → `All matched files use Prettier code style!`, **exit=0**.
- `pnpm run build --configuration production; echo exit=$?` → `Prerendered 20 static routes.`, **exit=0** ; puis `git checkout -- public/sitemap.xml public/rss.xml`.
- `grep -nP '\x{202F}|\x{00A0}'` sur les fichiers de code touchés et les specs du lot → aucune ligne.
- Preuves du plan : `grep -c "app-skeleton\|app-confirm-dialog\|app-load-error"` sur les deux éditeurs → 0 et 0 ; `grep -n "notify\|summary"` → vide ; « Fil d'Ariane » hors spec → `admin-page-header.ts` seul ; `linkedSignal` dans `admin-post-editor.ts` → vide.
- Tailles : `admin-project-editor.ts` 373 → 252 lignes, `admin-post-editor.ts` 296 → 183 ; nouveaux `editor-draft.ts` 129, `admin-editor-frame.ts` 95.

Runtime : `ng serve` (port 4300) derrière un faux backend local sur le port 3000. GET relayés vers l'API de prod ; `/auth/me`, `unread-count` simulés ; `blog/posts/admin` servi par la liste publique ; `PATCH /projects/:id` répondu **localement** (projet de prod lu en GET, fusionné avec le corps) ; `POST /projects/:id/image` → 500 local ; toute autre écriture → 403 local. Aucune requête non-GET n'est partie vers la prod (journal du faux backend). Indice `auth:session=1` en `localStorage`. Navigateur intégré, 1024 px.

1. `/admin/projects/<DashFlow>` : fil d'Ariane `Projets` → `/admin/projects`, courant « DashFlow », pas d'overline, un `h1` (`tabindex="-1"`, `text-balance`), un `header` dans `app-admin-page-header`, formulaire, aperçu et « Voir la fiche » rendus. **PASS**.
2. Même page, titre « DashFlow (local) » et couverture PNG choisie (« 2 modifications non enregistrées »), puis « Enregistrer » : journal `PATCH` (19:45:06.836) puis `POST …/image` (06.897, 500), pas de nouvelle lecture du projet ; toasts « Attention — Projet mis à jour, mais l'envoi de l'image a échoué. Réessayez. » puis « Succès — Projet mis à jour » ; `h1` « DashFlow (local) » ; barre « Aucune modification ». **PASS** (F005).
3. `/admin/projects/00000000-…` (404 de l'API) : « Ce projet n'existe pas ou a été supprimé. », lien `A` « Retour aux projets » → `/admin/projects`, ni `load-error` ni formulaire, aucun toast, `h1` « Modifier un projet ». **PASS**.
4. `/admin/blog/<Chiffrement…>` : fil d'Ariane `Articles` → `/admin/blog`, courant = titre, un `h1` `tabindex="-1"`, formulaire, `#apercu`, un seul `app-confirm-dialog`. `/admin/blog/00000000-…` : « Cet article n'existe pas ou a été supprimé. », retour `/admin/blog`. **PASS**.
5. Captures : en-tête du projet, toasts après l'enregistrement, état introuvable du projet, en-tête de l'article (prises au navigateur intégré pendant la session, non versionnées).
6. Console : aucune `NG0…` ni erreur Angular issue de ces étapes. Entrées propres à l'environnement : `500` (envoi simulé), `404` (projet inconnu, attendu), `403` (`POST /analytics/track` refusé par le faux backend), `InvalidStateError: Transition was aborted` (View Transitions, préexistante), `NG02955` sur la couverture courante (LCP sans `priority`, composant non touché). L'onglet réutilisé gardait des entrées d'une session antérieure (`502`, `NG0950` sur des scripts injectés avant le démarrage du faux backend) : hors de cette vérification.

Point d'attention (changement visible prévu au plan, plus marqué que prévu) : à 1024 px, la colonne d'actions de 22rem réserve 352 px pour le seul « Voir l'aperçu » de l'article, et le titre n'a plus que 245 px (`gridTemplateColumns: 245px 352px`) : un long titre d'article passe sur 6 lignes. Avant, la colonne était `auto`.

**Soldé** (session principale, 2026-10-08) : colonne `auto` quand `parent` est fourni, 22rem pour les pages. Mesure de la revue à 1024 px : article au titre de 68 caractères `443.5px 153.5px`, titre sur 4 lignes ; projet DashFlow (deux liens) `285.9px 311.1px` ; `/admin/projects` inchangé `245px 352px`. Les deux variantes sont dans le CSS compilé. `pnpm test` 3129/3129 exit 0, lint exit 0.


### Lot L9

Lot L9 entier (L9.1 et L9.2), 2026-10-09, branche `refactor/tags-form-value-control-l9` (non commitée).

Gates (codes de sortie lus) :

- `pnpm test; echo exit=$?` : 189 fichiers passent sur 189, 3142 tests sur 3142, `exit=0` ;
- `pnpm lint; echo exit=$?` : « All files pass linting. », `exit=0` ;
- `prettier --check` sur les `.ts` touchés : « All matched files use Prettier code style! », exit 0 ;
- `pnpm run build --configuration production; echo exit=$?` : 20 routes prérendues, CSP posée sur 21 pages, `exit=0`, puis `git checkout -- public/sitemap.xml public/rss.xml` ;
- `pnpm exec ngc -p tsconfig.app.json --noEmit` (`strictTemplates`) : exit 0. `[formField]="form.tags"` sur `readonly string[]` et le spread vers `Omit<TDraft, 'tags'>` passent sans repli ni cast.

Preuves de fin de lot (plan) :

- `grep -rn "selectedTags\|\[(tags)\]" src/app` : vide. Le motif `draft\.tags` du plan sort encore les copies `[...draft.tags]` de `toProjectInput` et `toPostInput` (que le plan prescrit lui-même), la projection `new Set(draft.tags)` de `toEdited` (`editor-draft.ts:126`, L9.2) et trois lectures de spec. Plus aucun `draft.tags()` (signal) ;
- `ReadonlySet<string>` hors spec dans `features/admin/application` : `editor-draft.ts` (clé `tags` d'`EditedDraft`) et `components/admin-project-gallery.ts:92` (`pendingImageIds`, préexistant, hors L9) ;
- `formField]="form.tags"` : une ligne par formulaire (`admin-project-form.ts:101`, `admin-post-form.ts:92`).

Runtime : `ng serve` (port 4300) derrière un faux backend local sur le port 3000. `/auth/me` et `unread-count` sont simulés, `blog/posts/admin` est servi par la liste publique, les autres GET sont relayés vers l'API de prod, et toute requête non-GET reçoit un 403 local. Journal du faux backend : 2 `PATCH /projects/:id`, 4 `POST /auth/logout` et 2 `POST /analytics/track`, tous refusés localement. Aucune requête non-GET n'est partie vers la prod. Indice `auth:session=1` en `localStorage`. Navigateur intégré.

1. `/admin/projects/<DashFlow>` (8 étiquettes) : les puces pressées sont exactement les étiquettes du projet, barre « Aucune modification ».
2. Vitest coché : « 1 modification non enregistrée ». Décoché : « Aucune modification ».
3. Angular décoché : « 1 modification non enregistrée ». Recoché : « Aucune modification » (L9.2).
4. Vitest coché de nouveau : sommaire « 04 · Choix techniques modifié », les autres sections sans marque.
5. « Enregistrer » : corps du `PATCH` reçu par le faux backend : `"tags":["NestJS","PostgreSQL","Docker","TypeScript","TailwindCSS","JWT","API","Angular","Vitest"]`. C'est l'ordre serveur, puis Angular (retirée puis rajoutée, donc passée en fin, comme avec l'ancien `Set`), puis l'ajout. Réponse 403 locale.
6. `/admin/blog/<article Reconversion>` : étiquettes de l'article pressées. Angular décoché : « 1 modification non enregistrée ». Recoché : « Aucune modification ».
7. Capture : barre « 1 modification non enregistrée » de l'éditeur de projet, prise après l'étape 5 (panneau navigateur de la session).
8. Console : aucune `NG0…` en erreur (seulement `NG0751`, un log HMR du serveur de dev). Entrées propres à l'environnement : `403` (écritures refusées par le faux backend) et `InvalidStateError: Transition was aborted` (View Transitions, préexistante).

**PASS**.

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

Lot L6, 2026-10-08, diff de travail `git diff master` + fichiers non suivis (`admin-pair-rows.ts`(+spec),
`admin-project-identity-fields.ts`, `admin-project-presentation-fields.ts`).

**Verdict** : REJECTED
**Gates CI locaux** : tests ✅ (`pnpm test; echo exit=$?` → 185 fichiers / 3083 tests passés, exit=0) / lint ✅ (`pnpm lint` → `All files pass linting.`, exit=0) / build ✅ (`pnpm run build --configuration production` → `Prerendered 20 static routes.`, exit=0, règle `app-select[aria-invalid=true]` présente dans le CSS compilé, puis `git checkout -- public/sitemap.xml public/rss.xml`)
**Checks mécaniques** : checker non vendoré (`.claude/checks/aak-checks.sh` absent) : auto-checks joués à la main sur les 9 fichiers de code du diff (export default, effect, helpers zone, archéologie, tests exclus, sécurité, snapshot, boucles générant des `it`) : 0 hit
**Warnings de gate** : aucun (sorties de test, lint et build relues en entier)
**Rendu compilé** : N/A (pas de composant à sélecteur attribut ajouté ; `app-select` contrôlé dans le CSS compilé)
**Preuve de verify runtime** : ✅ (éditeur rejoué au navigateur derrière un faux backend local, cf. `## Verify` › Lot L6 › 3 : focus du premier champ invalide, alertes de cellule reliées, galerie hors du `<form>`, console sans `NG0xxx`)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ❌ (le journal des tranches a été écrit dans le `## Plan technique`, cf. point 1)

Contrôles demandés : règle CSS conforme (une ligne `@apply aria-[invalid=true]:…` dans le bloc `@utility app-select` existant, copie conforme de `form-input`, aucune classe ad hoc) ; un seul `form()` (`admin-project-form.ts:129`), les enfants reçoivent `FieldTree<ProjectDraft>` ou `FieldTree<PairRow<A, B>[]>` et ne posent que `[formField]` ; `AdminPairRows<A, B>` typé par `PairRowsConfig<A, B>`, deux transtypages locaux prévus par le plan (`admin-pair-rows.ts:106, 119`) ; ajout et retrait par `value.update` sur une nouvelle référence (`:120, :124`) ; ARIA ADR-0016 (prédicat lu une fois par `@let`, `role="radiogroup"` sur le `fieldset` de la nature, indication puis erreur dans `aria-describedby`) ; galerie rendue par l'éditeur hors du `<form>` (`admin-project-editor.ts:178-200`) ; `id` et `data-testid` conservés (`tech-N-techno`, `decision-N-text`, `admin-project-*`) ; aucun code mort (méthodes de rangées, `REQUIRED`, `projectId`/`gallery`/`galleryChange` retirés, `PairColumn` non exporté). Correction du harnais `admin-pair-rows.spec.ts:55` : elle porte sur la construction de l'entrée (copie des rangées), l'attendu `[...TWO_ROWS, { a: '', b: '' }]` (`:157`) n'a pas bougé : légitime.

**Tests notables** :
- ⚠️ `admin-project-form.spec.ts` « holds no gallery, saved or pending » (`it.each` ×2) : vérifie l'absence d'un état historique dans le formulaire. Prescrit par le plan, mais c'est le test positif de l'éditeur (« renderedByForm: false ») qui porte le contrat. Candidat à la suppression, non bloquant.
- ✨ `admin-project-editor.spec.ts` « galerie » : place la section par `compareDocumentPosition` (après le formulaire, avant la barre) et `closest('form')`. Épingle le contrat P2b sans dépendre de la structure interne.
- ✨ `admin-pair-rows.spec.ts` « only the second row shows an error » : attrape une collision d'`id` d'erreur entre rangées.

**Risque résiduel** (advisory) :
- réversibilité : profil muet sur la livraison (déploiement Dokploy continu d'après `CLAUDE.md`) · monitoring : Sentry
- non couvert par les gates : nom accessible du `radiogroup` sous Firefox et lecteur d'écran (Chromium seul vérifié) ; rendu mobile des rangées (classes reprises à l'identique, non rejoué à 375 px).

**Points à corriger** :
1. `specs/017-intake-audit-decoupage.md:543-546` : les entrées de journal L6.2 à L6.5 ont été écrites dans `## Plan technique › Tranches › L6` au lieu de `## Journal des tranches`. Elles ont remplacé la ligne de titre de la tranche L6.2 du plan (« **Tranche L6.2 — les rangées répétées deviennent une section et signalent leurs cellules », dont il reste la fin orpheline « vides** : `AdminPairRows` + … » à la l. 547) et s'intercalent avant le contenu de L6.2, alors que L6.3 à L6.5 réapparaissent plus bas avec leur vrai contenu. Le journal (l. 844-845), lui, s'arrête à L6.2 avec la version « 8 passed / 9 » d'avant la correction du harnais. Correction attendue : rétablir dans le plan la ligne de titre d'origine (`git show master:specs/017-intake-audit-decoupage.md`, l. 543) ; déplacer les quatre entrées dans `## Journal des tranches`, l'entrée L6.2 corrigée (9 passed / 9 après correction du harnais) remplaçant celle de la l. 845. Aucun changement de code requis.

Correction du point 1 (session principale, 2026-10-08) : titre de la tranche L6.2 du plan rétabli à l'identique de `master`, entrées L6.2 à L6.5 déplacées dans `## Journal des tranches` (L6.2 en version 9 passed / 9). Seul point bloquant soldé (aucun changement de code).

Lot L4, 2026-10-08, diff de travail `git diff -M master` + fichiers non suivis (`shared/format/counted.ts`(+spec),
`shared/format/grouped-number.ts`(+spec)).

**Verdict** : APPROVED
**Gates CI locaux** : tests ✅ (`pnpm test` → 187 fichiers / 3099 tests passés, exit=0) / lint ✅ (`pnpm lint` → `All files pass linting.`, exit=0) / build ✅ (`pnpm run build --configuration production` → `Prerendered 20 static routes.`, exit=0, puis `git checkout -- public/sitemap.xml public/rss.xml`, `public/` propre)
**Checks mécaniques** : checker non vendoré (`.claude/checks/aak-checks.sh` absent) : auto-checks joués à la main sur les 22 fichiers de code du diff. U+202F/U+00A0 littéral (`grep -nP '[\x{202F}\x{00A0}]'`) : 0 ; `grep -rnE "> 1 \? 's'" src` : 0 ; `grep -rn "const counted" src` : 0 ; anciens chemins (`application/pluralize`, `ui/format-file-size`, `groupedNumber` depuis `overview-view`) : 0 ; export default, effect, helpers zone, archéologie (seul commentaire ajouté : la ligne ICU de `grouped-number.ts:4`, déplacée telle quelle, WHY intemporel), tests exclus, snapshot, boucles générant des `it` : 0
**Warnings de gate** : aucun (sorties de test, lint et build relues en entier)
**Rendu compilé** : N/A (aucun composant à sélecteur attribut touché)
**Preuve de verify runtime** : ✅ (`## Verify` › Lot L4 › 3, rejoué par le reviewer : `/blog/` et `/projects/` hydratés, libellés et filtres corrects, HTML prérendu identique à celui de `master`, console sans erreur Angular)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅ (écart `projects.ts` hors plan, motivé au journal du `## Verify` › Lot L4 : il fallait l'adopter pour que la preuve de fin de lot soit vide)

Contrôles demandés : L4.1, les quatre fichiers déplacés sont des renommages à 100 % de similarité (`git diff -M`), `groupedNumber` extrait avec `GROUPED`, `NNBSP` et son commentaire, `overview-view.ts` ne garde que `NBSP` (encore utilisé l. 88-89) ; L4.2, une seule définition de `counted` (`shared/format/counted.ts:4`), les deux locales supprimées, `au total` groupé (`admin-page-copy.ts:53`) ; L4.3, les 9 sites du plan adoptés, sorties identiques sous 1 000 (`pluralize` = `count > 1`, donc « 0 message marqué comme lu » est inchangé dans le toast). `shared/format/` : un concept par fichier, 4 exports, chacun consommé hors de son fichier, aucun `index.ts`, aucun `utils.ts`. Sorties publiques : le HTML prérendu de `/blog` et `/projects` (route réelle de la page Réalisations) est identique octet pour octet à un build `master` du même commit, hors chunks hachés et CSP ; insécable U+00A0 vérifiée caractère par caractère sur « 6 réalisations affichées », « 2 applications », « 4 projets ».

**Tests notables** :
- ✨ `grouped-number.spec.ts:15` : retire les chiffres et affirme `[NNBSP, NNBSP]`. Toute espace parasite que laisserait passer l'ICU fait échouer le test, quel que soit le runner.
- ✨ `admin-page-copy.spec.ts:42-46, 62-66, 81` : les cas ≥ 1 000 sont ajoutés aux `it.each` existants, pas en tests parallèles. Ils épinglent le seul changement visible du lot.

**Risque résiduel** (advisory) :
- réversibilité : profil muet sur la livraison (déploiement Dokploy continu d'après `CLAUDE.md`) · monitoring : Sentry
- non couvert par les gates : les surfaces d'admin (en-têtes, toast, barre d'enregistrement) n'ont pas été observées au navigateur (authentification requise). Elles ne sont couvertes que par les specs, et la différence n'apparaît qu'au-delà de 999.

Remarques non bloquantes :
- `projects.ts:13` : l'import `@shared/format/pluralize` arrive après les imports relatifs. Le fichier mêlait déjà l'ordre des imports sur `master`, donc le lot n'aggrave rien, mais l'entrée du journal « imports rangés à leur place alphabétique dans les 17 fichiers touchés » ne le couvre pas.
- `## Verify` › Lot L4 › 1 dit encore « seule surface publique touchée » pour le blog. Le point 3 ajoute la page Réalisations.

Lot L7, 2026-10-08, diff de travail `git diff master` + fichier non suivi (`shared/ui/toast-store.spec.ts`).

**Verdict** : APPROVED
**Gates CI locaux** : tests ✅ (`pnpm test; echo exit=$?` → 188 fichiers / 3105 tests passés, exit=0) / lint ✅ (`pnpm lint` → `All files pass linting.`, exit=0) / build ✅ (`pnpm run build --configuration production` → `Prerendered 20 static routes.`, exit=0, puis `git checkout -- public/sitemap.xml public/rss.xml`, `public/` propre)
**Checks mécaniques** : checker non vendoré (`.claude/checks/aak-checks.sh` absent) : auto-checks joués à la main sur les 12 fichiers de code du diff (export default, effect, helpers zone, archéologie selon le motif du profil, tests exclus, sécurité, snapshot, boucles générant des `it`, commentaire ajouté) : 0 hit
**Warnings de gate** : aucun (sorties de test, lint et build relues en entier)
**Rendu compilé** : N/A (`app-toast` est un sélecteur élément)
**Preuve de verify runtime** : ✅ (`## Verify` › Lot L7 : steps, PASS, capture, console sans `NG0…`, cohérente avec le diff : intercepteur et rendu des 4 titres par défaut + titre propre)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅

Contrôles demandés : `DEFAULT_SUMMARY: Record<ToastSeverity, string>` exhaustif sur les 4 sévérités, non exporté (`toast-store.ts:7-12`), appliqué par `??` (`:31`) ; `ToastEntry.summary` obligatoire (`toast.types.ts:13`), seul constructeur `ToastStore.add()`, typecheck des specs vert (`toast.spec.ts:20` fournit déjà `summary`). Les 18 littéraux retirés, vérifiés un par un contre `git show master:<fichier>` : `error-toast.ts:26` error/Erreur ; `admin-blog.ts:198` success/Succès, `:204` error/Erreur ; `admin-cv.ts:184, 214, 237` error/Erreur, `:204, 231` success/Succès ; `admin-messages.ts:165, 195, 221` success/Succès, `:172, 201, 229` error/Erreur ; `admin-projects.ts:155` success/Succès, `:162` error/Erreur ; `admin-project-gallery.ts:173`, `login.ts:167` error/Erreur. 12 « Erreur » + 6 « Succès », tous égaux au défaut de leur sévérité. Les 23 appels à `add()` de `master` passaient tous un titre : le retrait de `@if (msg.summary)` (`toast.ts:71-77`) ne change aucun rendu réel. Contact (`contact-form.ts:310, 313, 318`) et `notify()` des éditeurs (`admin-post-editor.ts:293-294`, `admin-project-editor.ts:370-371`) hors diff. Réduction des 6 assertions : seule la clé `summary` quitte les attendus, `severity` et `detail` inchangés.

**Tests notables** :
- ⚠️ `admin-cv.spec.ts:346-349, 380-383` et `admin-project-gallery.spec.ts:143-147` : la projection sur `{ severity, detail }` jette la clé `summary`. Un appelant qui se remettrait à passer un titre faux (« Succès » sur une erreur) resterait vert. Le contrat du titre par défaut est bien prouvé par `toast-store.spec.ts`, mais l'absence de titre propre chez l'appelant n'est plus épinglée. Variante sans projection : `toEqual` sur l'argument brut ignore une clé `undefined` mais échoue sur une clé définie. Prescrit par le plan, non bloquant.
- ⚠️ `toast-store.spec.ts:8` : la projection garde `summary?: string` alors que `ToastEntry.summary` est maintenant obligatoire. Utile au RED, plus maintenant. Cosmétique.
- ✨ `toast-store.spec.ts:15-27` : `it.each` sur les 4 sévérités avec `life: 0`. Une sévérité ajoutée sans titre casse la compilation, et un titre faux casse le test nommé.

**Risque résiduel** (advisory) :
- réversibilité : profil muet sur la livraison (déploiement Dokploy continu d'après `CLAUDE.md`) · monitoring : Sentry
- non couvert par les gates : un appel avec `summary: ''` afficherait désormais un titre vide (`??` ne remplace pas la chaîne vide, et le `@if` n'est plus là). Aucun appelant ne le fait. Les toasts d'admin n'ont pas été observés au navigateur (authentification requise), seulement l'intercepteur et l'injection directe dans le store.

Suite de la revue L7 (session principale, 2026-10-08) : avertissement « réduction des 6 assertions » soldé — `admin-cv.spec.ts` et l'aide `toasts()` de `admin-project-gallery.spec.ts` comparent désormais l'argument brut de `add()` (`toEqual` ignore une clé `undefined`, échoue sur un titre défini) ; projection de `toast-store.spec.ts` en `summary: string`. Mutant `summary: 'Succès'` sur l'erreur PDF d'`admin-cv.ts:182` → 1 failed / 3105, exit 1 (fichier restauré) ; suite réelle 3105/3105 exit 0, lint exit 0.

Lot L8, 2026-10-08, diff de travail `git diff master` + fichiers non suivis (`editor-draft.ts`(+spec),
`components/admin-editor-frame.ts`), y compris la retouche de la session principale sur
`admin-page-header.ts` (colonne d'actions `auto` avec `parent`).

**Verdict** : REJECTED
**Gates CI locaux** : tests ✅ (`pnpm test; echo exit=$?` → 189 fichiers / 3129 tests passés, exit=0) / lint ✅ (`pnpm lint` → `All files pass linting.`, exit=0) / build ✅ (`pnpm run build --configuration production` → `Prerendered 20 static routes.`, exit=0, puis `git checkout -- public/sitemap.xml public/rss.xml`, `public/` propre)
**Checks mécaniques** : checker non vendoré (`.claude/checks/aak-checks.sh` absent) : auto-checks joués à la main sur les lignes ajoutées des 14 fichiers de code (export default, effect, helpers zone, archéologie selon le motif du profil, tests exclus, sécurité, snapshot, boucles générant des `it`, mutation en place, U+202F/U+00A0 littéraux) : 0 hit ; 2 commentaires ajoutés, tous deux WHY d'une ligne sans référence (`admin-page-header.ts:6`, `editor-draft.ts:88`) ; `prettier --check` exit=0
**Warnings de gate** : aucun (sorties de test, lint et build relues en entier)
**Rendu compilé** : ✅ (CSS compilé : `grid-template-columns:minmax(0,1fr) 22rem` et `minmax(0,1fr) auto`, toutes deux sous `@media(width>=64rem)` ; sélecteurs élément, pas d'encapsulation à contrôler)
**Preuve de verify runtime** : ✅ (`## Verify` › Lot L8 cohérente avec le diff, et rejouée par le reviewer après la retouche de l'en-tête : `ng serve` derrière un faux backend local strictement en lecture seule, toute requête non-GET refusée en 403 localement, journal = GET uniquement, 1024 px)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ❌ (la retouche de la colonne d'actions n'est pas reportée dans la spec, cf. point 1)

Contrôles demandés :
- Plan tenu, 6 tranches : `EditorDraft` objet par instance, ni `@Injectable` ni `inject()`, aucun `effect()`, construit en initialiseur de champ après `loaded` (`admin-project-editor.ts:182-193`, `admin-post-editor.ts:120-134`) ; écritures externes limitées à `value` et `tags`, le reste en `.asReadonly()` (`editor-draft.ts:33-38`).
- Ordre F005 écrit une fois (`editor-draft.ts:89-107`) : écriture, envoi capturé (`sendCover`, `:109-121`), `markSaved` dans tous les cas où l'écriture a réussi, `saving` remis à `false` dans le `finally`. Les deux éditeurs n'ont plus de branche `create`/`update` pour la couverture et relisent l'entité si la couverture est partie en mise à jour (`admin-project-editor.ts:238`, `admin-post-editor.ts:179`).
- `notify()` et `summary` absents des deux éditeurs (grep vide).
- `AdminPageHeader` : `parent` facultatif, fil d'Ariane à la place de l'overline, courant = `heading()`, `h1` `tabindex="-1"` + `text-balance` ; « Fil d'Ariane » hors spec seulement dans `admin-page-header.ts`. `overline` devenu `input('')`, les 7 pages inchangées.
- `AdminEditorFrame` muet (entrées/sorties seulement), gabarits lus par `contentChild.required(…, { read: TemplateRef })` et rendus par `NgTemplateOutlet` dans `@default` seulement : au runtime, ni formulaire ni galerie à l'état introuvable. `grep -c "app-skeleton\|app-confirm-dialog\|app-load-error"` sur les éditeurs → 0 et 0 ; un seul `app-confirm-dialog` par page.
- 404 → `null` uniquement dans `HttpProjectsGateway.getProjectById` (`http-projects.gateway.ts:72-81`), tout autre statut relancé (`it.each` 404/500 dans la spec du gateway). Autres consommateurs : aucun. `getProjectById` n'est appelé que par l'éditeur ; la page publique `project-detail.ts:98-100` lit `getAllProjects()` et filtre par slug ; le prerender (`app.routes.server.ts:54-56`) découvre les slugs par `fetchPrerenderSlugs('/projects?…')`, sans le gateway. Le stub de test (`of(makeProject())`) reste assignable. Le type `Project | null` force le traitement du `null` à la compilation (typecheck des specs vert).
- Pas de code mort : `EditedProject`/`EditedPost`, `toEdited*`, les signaux de brouillon, les `uploadCover`/`markSaved` locaux et `notify()` sont supprimés. `CoverUpload`/`SaveResult` ne sont pas exportés. Les exports neufs ont des consommateurs hors de leur fichier (`EditedDraft`, `AdminEditorCopy` : les deux éditeurs ; `LoadState` : le cadre ; `AdminPageParent` : sa spec, export prescrit par le plan).
- `data-testid` conservés : `${prefix}-editor-loading/back/missing`, `${prefix}-aside`, `admin-*-preview-link`, `admin-project-public-link`. Seul renommage, prévu par le plan : `admin-breadcrumb-projects/posts` → `admin-breadcrumb-parent`.
- Aucune U+202F ni U+00A0 littérale dans le code : le cadre écrit `&#8239;` (`admin-editor-frame.ts:76`).
- Retouche de l'en-tête : deux constantes de classes complètes (`PAGE_LAYOUT`, `EDITOR_LAYOUT`), donc détectables par le scanner Tailwind ; les deux variantes sont dans le CSS compilé. Rendu à 1024 px : article au titre de 68 caractères → colonnes `443.5px 153.5px`, titre sur 4 lignes (contre `245px 352px` et 6 lignes mesurés par l'implémenteur) ; projet DashFlow → `285.9px 311.1px` (deux liens) ; la page `/admin/projects` garde `245px 352px` (22rem). Projet inconnu : message, lien `A` vers `/admin/projects`, ni `load-error` ni formulaire, aucun toast. Console : aucune `NG0…` en erreur ; restent le 404 attendu, `InvalidStateError: Transition was aborted` (préexistante) et un avertissement de préchargement de police.

**Tests notables** :
- ✨ `editor-draft.spec.ts` « Given the cover upload rejected… » : épingle le contrat F005 au niveau unitaire, sans TestBed (entité marquée enregistrée malgré l'échec de l'envoi).
- ✨ `admin-project-editor.spec.ts` « Given the cover upload fails after the update… » : compare les toasts entiers dans l'ordre (avertissement puis succès), `patches` 1 et `requested` 1. Un retour à l'ancien ordre ou un titre propre réintroduit fait échouer le test.
- ⚠️ Rien ne tient le choix de colonne `auto`/22rem (`admin-page-header.ts:64`). Le profil interdit les sélecteurs de classe en test, donc il n'est vérifiable qu'au rendu. Non bloquant.

**Risque résiduel** (advisory) :
- réversibilité : profil muet sur la livraison (déploiement Dokploy continu d'après `CLAUDE.md`) · monitoring : Sentry
- `saving` repasse à `false` avant la navigation qui suit une création (risque déjà nommé par le plan) : double envoi théoriquement possible pendant la navigation `replaceUrl`. Non observé.
- Couplage implicite : la largeur de colonne dépend de la présence de `parent`. Une future page avec fil d'Ariane et plusieurs actions aurait une colonne `auto`. Acceptable tant que seuls les éditeurs passent `parent`.
- non couvert par les gates : le scénario F005 (`PATCH` puis envoi en 500) n'a pas été rejoué par le reviewer, puisque son faux backend refuse toute écriture. Il est couvert par les specs et par l'étape 2 du `## Verify` › Lot L8.

**Points à corriger** :
1. `specs/017-intake-audit-decoupage.md:1242-1243` (`## Plan technique › Lot L8 › Changements visibles`) annonce encore « à partir de `lg`, colonne d'actions `auto` → `22rem` », avec la colonne vide de l'article à `2xl`. La section « `AdminPageHeader` après L8 » (l. 1037-1055) ne mentionne pas `layoutClass`, et le « Point d'attention » du `## Verify` › Lot L8 (l. 1859) décrit un rendu (`245px 352px`, 6 lignes) que le code ne produit plus. Correction attendue : reporter dans le plan la décision (colonne `auto` quand `parent` est fourni, 22rem pour les pages, via `layoutClass` et deux constantes de classes complètes) et la mesure d'après la retouche (`443.5px 153.5px`, 4 lignes à 1024 px), puis requalifier le point d'attention en « soldé ». Aucun changement de code requis.

Correction du point 1 de la revue L8 (session principale, 2026-10-08) : « Changements visibles », section « `AdminPageHeader` après L8 » et point d'attention du `## Verify` › Lot L8 mis à jour (colonne `auto` dans les éditeurs, mesures à 1024 px). Seul point bloquant soldé, sans changement de code.

Lot L9, 2026-10-09, diff de travail `git diff master` (base `fc1f214`, 16 fichiers de code, aucun fichier non suivi).

**Verdict** : APPROVED
**Gates CI locaux** : tests ✅ (`pnpm exec ng cache clean` + `rm -rf node_modules/.vite`, puis `pnpm test; echo exit=$?` → 189 fichiers / 3142 tests passés, `exit=0` ; contre-vérification `pnpm exec tsc -p tsconfig.spec.json --noEmit` → exit 0) / lint ✅ (`pnpm lint` → `All files pass linting.`, exit=0) / build ✅ (`pnpm run build --configuration production` → `Prerendered 20 static routes.`, exit=0, puis `git checkout -- public/sitemap.xml public/rss.xml`, `public/` propre)
**Checks mécaniques** : checker non vendoré (`.claude/checks/aak-checks.sh` absent) : auto-checks joués à la main sur les lignes ajoutées des 16 fichiers de code (export default, effect, helpers zone, archéologie selon le motif du profil, tests exclus, sécurité, snapshot, `let`, `any`, mutation en place `push`/`splice`/`sort`/`reverse`) : 1 hit, levé (`post-draft.spec.ts:92`, `.sort()` sur le tableau neuf rendu par `Reflect.ownKeys`, ligne préexistante dont seul l'argument a changé) ; U+202F/U+00A0 littéral (`grep -P '[\x{202F}\x{00A0}]'` sur les fichiers du diff) : 0 ; un seul commentaire ajouté, WHY d'une ligne sans référence (`editor-draft.ts:10`)
**Warnings de gate** : aucun (sorties de test, lint et build relues en entier)
**Rendu compilé** : N/A (`app-admin-tags-selector` est un sélecteur élément, aucune classe ni style touché)
**Preuve de verify runtime** : ✅ (`## Verify` › Lot L9 cohérente avec le diff, et rejouée par le reviewer : `ng serve` port 4300 derrière le même faux backend local en lecture seule, toute requête non-GET refusée en 403 localement ; journal = 1 `PATCH` bloqué, aucune écriture vers la prod ; serveurs arrêtés ensuite)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅ (écarts des preuves de fin de lot jugés légitimes, cf. ci-dessous)

Contrôles demandés :
- `AdminTagsSelector implements FormValueControl<readonly string[]>` (`admin-tags-selector.ts:29`), un seul membre du contrat : `value = model<readonly string[]>([])` (`:31`), sans `touch`, `disabled`, `errors` ni `focus` ; `import type` ; `toggleTag` `protected` (`:42`), gabarit seul consommateur.
- `[formField]="form.tags"` : `admin-project-form.ts:101`, `admin-post-form.ts:92`. `model.required<ReadonlySet<string>>` supprimé des deux formulaires ; soumissions `toProjectInput(draft, draft.kind)` (`admin-project-form.ts:158`) et `toPostInput(this.value())` (`admin-post-form.ts:250`).
- Plus aucun canal parallèle : `grep -n tags` sur les deux éditeurs, les deux formulaires et `editor-draft.ts` ne sort que les clés `'tags'` des `FORM_SECTIONS`, `TaggedDraft`, `EditedDraft` et `toEdited`. `[(tags)]` retiré des éditeurs ; aperçus `toPreviewProject(this.draft.value(), this.draft.saved())` / `toPreviewPost(…)`.
- Ordre du payload : `toggleTag` filtre au retrait et ajoute en fin (`[...tags, tag]`), sans filtrage par `availableTags`. Observé au runtime sur « Coaching Life » (serveur `["Angular","TailwindCSS","PostgreSQL","Git"]`) : Angular décoché puis recoché, puis Vitest coché → corps du `PATCH` bloqué `"tags":["TailwindCSS","PostgreSQL","Git","Angular","Vitest"]`, même ordre que l'ancien `Set` (ordre serveur, retirée-rajoutée en fin, puis ajout). Hors catalogue conservée : épinglé par `admin-tags-selector.spec.ts` (`['Héritée', 'Angular']` + PBKDF2).
- Comparaison en ensemble : `toEdited` privée (`editor-draft.ts:122-127`), utilisée par `baseline` et `edited` (`:52-53`) ; `EditedDraft<TDraft extends TaggedDraft> = Omit<TDraft, 'tags'> & { tags: ReadonlySet<string>; cover }`, spread accepté sans cast ni déstructuration (typecheck des specs vert). `count-draft-changes.ts` non touché (branche `Set` existante). Runtime : retirer puis rajouter → « Aucune modification » sur projet et article ; Vitest coché → « 1 modification non enregistrée », sommaire « 04 · Choix techniques modifié » seul.
- Pas de mutation en place : copies `[...(x?.tags ?? [])]` dans `toXDraft`, `[...draft.tags]` dans `toXInput`, `value.update` sur nouvelle référence ; épinglé par l'`it.each` du sélecteur (tableau passé à `setInput` inchangé après clics) et les tests d'identité `same: false` (les builders `makeProject`/`makeBlogPost` passent la référence par `...overrides`, donc ces assertions ont du mordant).
- `data-testid` conservés : `tag-chip`, `admin-project-tags`, `admin-post-tags`.
- Pas de code mort : `EditorEntity` réduit à `id`, `TaggedDraft`/`toEdited` non exportés, membre `tags` et son `linkedSignal` supprimés, paramètres `tags` retirés des 4 conversions. Aucun export neuf.
- Adaptation mécanique déclarée, vérifiée contre le diff : attendus inchangés hors des clés que le contrat ajoute (`tags` dans `toXDraft` et `value`). Les attendus des tests de puce des formulaires et de « draft order » n'ont pas bougé.

Écarts consignés au `## Verify` › Lot L9, jugés :
- `grep -rn "selectedTags\|\[(tags)\]\|draft\.tags" src/app` non vide : légitime, le motif `draft\.tags` du plan était trop large. Il sort les copies prescrites (`project-draft.ts:55`, `post-draft.ts:26`), la projection prescrite `editor-draft.ts:126` (`new Set(draft.tags)`, **omise de l'énumération du `## Verify`**) et trois lectures de spec (`post-draft.spec.ts:60`, `project-draft.spec.ts:124, 210`). Aucun `draft.tags()` (signal) ni `[(tags)]`.
- `ReadonlySet<string>` hors spec : `editor-draft.ts:10` et `admin-project-gallery.ts:92` (`pendingImageIds`, identique sur `master`, hors L9) : légitime, la prédiction du plan ignorait ce préexistant.
- `formField]="form.tags"` : une ligne par formulaire, conforme.

**Tests notables** :
- ✨ `admin-tags-selector.spec.ts` `it.each` des clics : vérifie que le tableau passé à `setInput` est intact après les clics. Un `push` en place fait échouer le test.
- ✨ `admin-tags-selector.spec.ts` « bound by [formField] » : passe par la vraie directive `FormField` dans les deux sens (clic → modèle, `draft.set` → puces), ce qui épingle le contrat `FormValueControl`, pas seulement l'API du composant.
- ⚠️ `admin-project-form.spec.ts:259`, `admin-post-form.spec.ts:234` : `byTestId(…) ?? rendered.host` retombe sur tout l'hôte si le `data-testid` disparaît. L'appartenance des puces à la section n'est donc tenue que par le test de clic (`chipsInTags`). Non bloquant.

**Risque résiduel** (advisory) :
- réversibilité : profil muet sur la livraison (déploiement Dokploy continu d'après `CLAUDE.md`) · monitoring : Sentry
- comparaison en `Set` : des étiquettes serveur dupliquées (`['A', 'A']` contre `['A']`) compteraient comme identiques alors que le payload diffère. Comportement identique à `master`, et `toggleTag` ne crée pas de doublon.
- risque déjà nommé par le plan : une future règle de schéma sur `tags` exigera `focus()` et `touch`, sinon `focusFirstInvalid` resterait muet sur ce champ.
- non couvert par les gates : la création d'article (`POST` avec `tags`) n'a pas été rejouée par le reviewer, seulement la mise à jour d'un projet (`PATCH` bloqué) et le compteur d'un article. Elle est couverte par `admin-post-editor.spec.ts` (`pickSubject` → payload).

Remarque non bloquante : compléter l'énumération du `## Verify` › Lot L9 › Preuves de fin de lot avec `editor-draft.ts:126` (projection `toEdited`, prescrite par le plan).
