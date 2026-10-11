---
id: 021
title: Parcours administrable (contenu de /about édité depuis l'admin, visible à la requête — spec 022)
type: feature
status: draft
created: 2026-10-10
related: [docs/adr/0023-parcours-document-unique-administrable.md, docs/adr/0024-rendu-a-la-requete-des-pages-de-contenu.md, specs/022-contenu-instantane.md, docs/adr/0004-contenu-statique-de-feature-sans-gateway.md, docs/adr/0013-edition-admin-en-pages-dediees-et-apercu-public.md, specs/017-intake-audit-decoupage.md, specs/019-textes-et-parcours.md]
---

# 021 — Parcours administrable

## Description

> **Amendement du 2026-10-10 (spec 022, ADR-0024)** : plus aucun rebuild sur écriture. `/about` est
> rendue **à la requête** ; une écriture du parcours (textes ou portrait) est visible au rechargement
> suivant. `SiteRebuild` (A1) et le rebuild des projets (A4) sont **retirés** de la PR API ; le profil
> ne déclenche rien ; le blog garde son webhook, identique à `master`, jusqu'à la bascule de la spec
> 022, puis une PR API le retire. Aucune garde de build sur `/about`. Les constats 9 et 10 ci-dessous
> restent l'état de `master` au moment de l'inventaire ; les passages du Plan barrés par cet amendement
> sont réécrits en place ; le journal des tranches API reste l'historique.

### Objectif

Demande du propriétaire (2026-10-10) : « pouvoir gérer ce qu'il y a dans la page Parcours depuis le
dashboard, de manière pro et en cohérence avec le reste ». Deux dépôts : l'API NestJS
(`nest-portfolio-app`, PR livrée et **déployée en premier**) et ce front.

### Constat (inventaire du 2026-10-10, sur `master` `e2e74f3` et API `0486320`)

Front, page publique `/about` :

1. **Source du contenu** : `features/profile/infra/data/profile.static-data.ts` (constantes
   `STATIC_BIOGRAPHY` l.17-29, `STATIC_DIPLOMAS` l.31-64, `STATIC_TECHNOLOGIES` l.66-103,
   `STATIC_ABOUT_HIGHLIGHTS` l.105-124, `STATIC_WHAT_I_DO` l.126-139, `STATIC_MOTIVATION` l.141-148,
   `STATIC_SOCIAL_BUTTONS` l.150-181, `STATIC_PROFILE_BASE` l.11-15, `STATIC_AVATAR_URL` l.9),
   servie par `InMemoryProfileGateway` (`infra/gateways/in-memory-profile.gateway.ts`, 8 méthodes),
   câblé en production (`app.config.ts:148`). Port : `domain/gateways/profile.gateway.ts:9-18`.
2. **Page** : `pages/about/about.ts:90-106` lit les 8 méthodes par un `forkJoin` dans un
   `rxResource`, passe les données aux sections dumb (L13 de la spec 017) : `AboutHero`,
   `AboutJourney`, `AboutHighlights`, `AboutWhatIDo` (+ `AboutStack`), `AboutDiploma`,
   `AboutHiring`, `AboutMotivation`. Cinq sections sous `@defer (hydrate on viewport)`.
3. **Textes en dur dans les composants** : rôle et stack du premier écran (`about-hero.ts:9-10`),
   résumé « Deux titres professionnels de niveau 5 (Bac+2). » (`about-diploma.ts:5`, **fait sur la
   liste** : faux dès qu'un diplôme est ajouté), résumé « Du composant au serveur qui le sert. »
   (`about-what-i-do.ts:7`), titres « Ce qui me caractérise » (`about-highlights.ts:9`), « Ce que je
   fais », « Formations », bloc recrutement (`about-hiring.ts:21-23`), CTA de motivation.
4. **Ce qui vient d'ailleurs** : l'accroche `Biography.lead` **est** `SITE_IDENTITY.journey`
   (`profile.static-data.ts:22`), phrase reprise par l'accueil (`home.static-data.ts:10`), l'offre
   atelier (`offer-pages.static-data.ts:176`) et la meta de `/about` (`app.routes.ts:88`) ; ville
   (`SITE_IDENTITY.location`), réseaux et e-mail (`SITE_IDENTITY.socials`, `email`) ; disponibilité
   recrutement (`SITE_IDENTITY.hiringAvailability`, `about-hiring.ts:67`) ; lien CV par `CvDownload`
   (`features/cv/application/cv-download.ts`, API `/cv`). Portrait : fichier statique
   `public/avatar.avif` (9,5 ko), image LCP `priority` (`about-hero.ts:90-97`). Icônes de stack :
   `public/icons/<icon>.svg` (6 fichiers : angular, nestjs, typescript, tailwindcss, postgresql,
   docker).
5. **Verrous de test** : `editorial-identity.spec.ts:25-32` (la phrase d'identité apparaît une seule
   fois dans l'accroche de l'accueil, celle de `/about` — via `STATIC_BIOGRAPHY.lead` l.27 —, l'offre
   atelier et la meta) et l.34-42 (formulations interdites dans toutes les `EDITORIAL_SOURCES`) ;
   `editorial-typography.spec.ts:45-52` (espaces insécables) ; les deux parcourent
   `testing/editorial-sources.ts:120-127`, qui liste les 8 constantes du profil ;
   `profile.static-data.spec.ts` verrouille 5 formulations validées par le propriétaire.

Front, admin :

6. **Structure** : `features/admin/` (pages routées sous `AdminLayout`, `admin.routes.ts`), groupes
   de navigation `admin-nav-groups.ts:142-163` (Contenu : Projets, Articles, CV). Redirections
   historiques `about → ''` et `about/cv → cv` (`admin.routes.ts:96-97`).
7. **Briques d'édition** (spec 015, ADR-0013) : `AdminPageHeader`, `AdminEditorFrame` (états
   chargement / erreur / absent / prêt, dialogue de sortie ; `testIdPrefix` fermé à
   `'admin-project' | 'admin-post'`, l.139), `AdminFormSection` (fieldset numéroté), `AdminFormToc`
   (sommaire avec état « modifié »), `AdminSaveBar` (compte des modifications, soumission par
   `form="…"`), `EditorDraft` (brouillon, ligne de base, garde ; **couplé aux tags et à la
   couverture** : `TDraft extends { tags }`, `TEntity extends { id }`, `editor-draft.ts:269-275`),
   `unsavedChangesGuard` + `LeaveConfirmation`, `countChangedFields`, `toFormTocEntries`,
   `AdminPairRows` (lignes à deux champs, ajout et retrait, **sans réordonnancement**),
   réordonnancement de galerie par boutons monter/descendre avec focus suivi
   (`admin-gallery-image-item.ts`, `moveGalleryImage` dans `features/projects/domain/`), toasts
   (`ToastStore`), `withValidationDetail`.

API (`nest-portfolio-app`, lecture seule) :

8. **Stockage** : Drizzle, une table par agrégat, listes en `jsonb` (`schema/projects.ts:40-47`) ;
   DTO `class-validator` imbriqués (`create-project.dto.ts`, `ValidateNested` + `Type`, bornes
   `ArrayMaxSize`, `MaxLength`) ; `ValidationPipe` global `whitelist` + `forbidNonWhitelisted` +
   `transform` (`main.ts:35-40`) ; garde `JwtAuthGuard` sur les écritures, `PublicReadThrottle`
   (120/min) sur les lectures publiques ; migrations générées + migration de données personnalisée
   (`drizzle/0016_project_kind_backfill.sql`) ; migrations jouées au démarrage du conteneur
   (`Dockerfile`, `CMD pnpm db:migrate && node dist/main.js`). Dernière migration : `0019`.
9. **Rebuild du site** : `BlogService.triggerDeploy` (`blog.service.ts:243-258`) appelle
   `DOKPLOY_DEPLOY_WEBHOOK_URL` (fire-and-forget, `POST`, timeout 5 s) quand le rendu public d'un
   article change. **C'est le seul appel** : aucune mutation de projet ne déclenche de rebuild, alors
   que l'éditeur de projet affiche « Les changements partent en ligne au prochain déploiement,
   quelques minutes après l'enregistrement » (`admin-project-editor.ts:88-91`).
10. **Build front** : le prérendu lit l'API de **production** (`app.routes.server.ts:7`,
    `app.config.ts` `API_BASE_URL` serveur) ; `fetchPrerenderSlugs` et `fetchPublicJson` font échouer
    le build sur toute erreur (hors 429 réessayé). Un échec HTTP **dans un composant** prérendu ne
    fait pas échouer le build : la page serait publiée avec son squelette. Le transfer cache ne
    sérialise que `PUBLIC_READ_PATHS` (`app.config.ts:95-98`).

### Ce qui est attendu

1. Une entrée **« Parcours »** dans le groupe Contenu de l'admin, une page d'édition du contenu de
   `/about`, dans la grammaire des éditeurs existants : en-tête, sections numérotées, sommaire,
   barre d'enregistrement, garde de sortie, toasts, états de chargement et d'erreur.
2. Listes **ordonnables** (paragraphes, traits, « ce que je fais », stack, formations) : ajouter,
   retirer, monter, descendre, au clavier comme à la souris, avec annonce et focus suivi.
3. L'enregistrement **publie** : la page `/about` rendue à la requête (spec 022) affiche le nouveau
   contenu au rechargement suivant, sans rebuild ni webhook.
4. `/about` **inchangée** pour le visiteur à la bascule : même texte au caractère près, même SEO,
   même rendu serveur, même hydratation, même accessibilité.
5. **Aucune perte de contenu** : le contenu initial en base est le contenu statique actuel, exact.
6. **Portrait éditable** : remplacer le portrait depuis l'admin ou revenir au portrait par défaut
   (`public/avatar.avif`), sans image orpheline ni régression de LCP.
7. **Garde-fou éditorial non bloquant** : un avertissement dans l'admin quand un texte éditable
   contient « 20 ans », « vingt ans » ou « métallurgie » ; l'enregistrement reste possible.

### Contraintes

- Ordre de livraison API puis front, vérifié en production (`.claude/CLAUDE.md`, item 10).
- Preuves en **local** ; en production, lectures (`GET`) uniquement. La seule écriture en base de
  production est la migration jouée par le déploiement de l'API.
- Gates du Dockerfile et de la CI (item 8) ; conflits résolus en local (item 9).

### Décisions (validées par le propriétaire le 2026-10-10)

| # | Question | Décision |
|---|---|---|
| D1-D2 | Périmètre éditable | **Tout le contenu propre à `/about`, résumés de section compris** : biographie (titre, résumé, suite de l'accroche, paragraphes), traits, résumé et liste « ce que je fais », stack, résumé et liste des formations, motivation, portrait (D6). **Restent dans le code** : phrase d'identité `journey`, nom, ville, réseaux, e-mail, bloc recrutement, titres de section, rôle et stack du premier écran (et les CTA). |
| D3 | Modèle API | Document unique `jsonb` versionné (une ligne, `PUT` du document entier, 409 si la version a changé), ADR-0023. Le portrait est une colonne à part, hors version. |
| D4 | Forme de l'admin | Une page unique (`/admin/profile`) : 5 sections de texte dans un formulaire, un enregistrement ; section Portrait hors du formulaire (envoi immédiat, précédent de la galerie de projet). |
| D5 | Listes | Composant générique `AdminOrderedList` (monter, descendre, retirer, ajouter, focus suivi, annonce) ; compétences d'une formation saisies une par ligne ; icône de techno choisie dans la liste fermée des 6 SVG présents. `AdminPairRows` (projets) inchangé. |
| D6 | Portrait | **Éditable depuis l'admin**, par le pipeline d'images de l'API (AVIF, clé hachée, servi en `/api/storage/` même origine). Recadré **640×800** (4:5). Repli sur `public/avatar.avif` tant qu'aucun portrait n'est défini, ou après retour au portrait par défaut. Texte alternatif **fixe** (« Portrait de Julien Nédellec », identité verrouillée). Reste l'image LCP de `/about` (`priority`). |
| D7 | Aperçu | Bascule « Aperçu » pleine largeur rendue par les vrais composants publics, `inert`, sans le premier écran (un seul `h1`). **Dernière tranche, détachable.** |
| D8 | Publication | **Amendée le 2026-10-10** : aucun rebuild. `/about` rendue à la requête (spec 022, ADR-0024) ; `SiteRebuild` (A1) et A4 retirés de la PR API ; le profil ne déclenche rien ; webhook blog inchangé jusqu'à la bascule 022, retiré ensuite par une PR API. |
| D9 | API injoignable | **Amendée le 2026-10-10** : le build ne lit plus l'API, aucune garde de build. À la requête, une lecture en échec rend la page en **503** ; nginx sert alors la dernière copie bonne (spec 022, T4). Pas de repli statique du contenu. |
| D10 | Typographie et formulations | Espaces normalisées avant `: ; ? ! % €` et dans `« »` à l'enregistrement. **Avertissement non bloquant** dans l'admin si un texte éditable contient « 20 ans », « vingt ans » ou « métallurgie » ; liste en **une seule source** (`shared/identity/forbidden-wordings.ts`), réutilisée par `editorial-identity.spec.ts`. |
| D11 | Bornes (calibration) | Valeurs ci-dessous ; listes non vides. |
| D12 | Historique | Aucun : restauration par la sauvegarde de base ou le seed initial. |

**Bornes (D11)** — mesurées sur le contenu actuel (`tsx`, 2026-10-10), entre parenthèses :
titre de biographie 80 (12), résumés 200 (112), suite de l'accroche 160 (63), paragraphe 1 200 (309),
paragraphes 1-8 (3) ; trait : titre 60 (22), description 400 (137), 1-6 (3) ; « ce que je fais » :
titre 60 (22), description 600 (243), 1-6 (2) ; techno : nom 40 (12), catégorie 40 (15), 1-18 (6) ;
formation : intitulé 120 (34), organisme 80 (6), niveau 80 (30), description 600 (187),
compétences 1-12 de 80 (6 de 31), 1-8 (2) ; motivation : titre 60 (16), énoncé 240 (95),
description 600 (165).

### Hors périmètre

- Réseaux et identité (D1), bloc recrutement, titres de section, texte alternatif du portrait.
- Ajout d'une icône de technologie : nouveau SVG dans `public/icons/` + entrée de la liste fermée,
  par une PR front.
- Historique des versions (D12) ; carte « Parcours » dans la vue d'ensemble admin.
- Refonte de `EditorDraft` sur la nouvelle brique `DocumentDraft` (suivi possible, cf. Plan).
- `AdminPairRows` réécrit sur `AdminOrderedList` (suivi possible).

## Plan technique

> Plan aligné sur les décisions D1-D12 du 2026-10-10 (portrait éditable, avertissement de
> formulation non bloquant), D8 et D9 amendées le même jour : aucun rebuild, `/about` rendue à la
> requête (spec 022), A1 et A4 retirés.

### Constats vérifiés (2026-10-10)

- `tsx --tsconfig tsconfig.json` importe `profile.static-data.ts` (alias `@shared/*` résolus) :
  la génération mécanique du seed depuis le front est possible.
- `class-validator` fournit `ArrayUnique(selector)`, `ArrayMinSize`, `ArrayMaxSize`, `IsUUID`,
  `Matches` : aucune dépendance à ajouter côté API.
- Les sections `About*` sont dumb depuis L13 : elles servent telles quelles à l'aperçu admin.
- `moveGalleryImage(ids: readonly string[], …)` est la seule fonction de déplacement du repo ;
  `crypto.randomUUID` n'est utilisé nulle part côté front.
- Aucun normaliseur typographique n'existe ; le contrôle vit dans `editorial-typography.spec.ts:8-38`.
- **Pipeline d'images** (API) : `ImageOptimizer.optimize` (`storage/image-optimizer.service.ts`)
  rend un AVIF ≤ 1 600 px de large (qualité 60) ; `toShareCard` recadre en 1 200×630
  (`fit: 'cover', position: 'attention'`). Couverture de projet (`projects.service.ts`
  `uploadImage`) : clé `projects/<id>-<sha8>.avif` (`contentHash`), ordre envoi → écriture en base →
  suppression de l'ancienne clé (`deleteS3IfExists`), URL publique par `storage.getPublicUrl`.
  Le proxy `GET /storage/…` sert `Cache-Control: public, max-age=31536000, immutable`
  (`storage.controller.ts:19`), seule variante connue `share`. Côté site, nginx relaie
  `/api/storage/` avec cache disque (#202) et le front émet les URL en relatif par
  `STORAGE_BASE_PATH` (#203, ADR-0018) ; la CSP `img-src 'self'` suffit.
- Le portrait public est rendu en `fill` dans un cadre `aspect-[4/5]`, `sizes="20rem"`,
  `object-cover`, `priority` (`about-hero.ts:86-97`) : aucune dimension intrinsèque n'est requise
  pour éviter le CLS. Aucun `IMAGE_LOADER` : pas de `srcset`, le fichier servi est le fichier stocké.
- La vérification des `preload` de la CI (`ci.yml:82-86`) ne porte que sur `index.html` (accueil) :
  le `preload` du portrait de `/about` vers `/api/storage/…` n'y est pas soumis (et ne doit pas
  l'être : ce n'est pas un fichier de `dist`).

### Architecture

```mermaid
flowchart LR
  subgraph Admin[Admin front, CSR]
    AP[AdminProfile page] -->|DocumentDraft| AF[AdminProfileForm]
    AP -->|saveProfile content+version| GW
    AP -->|uploadPortrait / removePortrait| GW
  end
  subgraph Public[/about rendue à la requête, spec 022/]
    AB[About page] -->|getProfile| GW
  end
  GW[ProfileGateway port\nHttpProfileGateway] -->|GET /api/profile| API
  GW -->|PUT /api/profile JWT| API
  GW -->|POST, DELETE /api/profile/portrait JWT| API
  API -->|AVIF 640x800, clé hachée| S3[(S3 profile/portrait-sha8.avif)]
  API[ProfileController\nProfileService] --> DB[(profile_content\njsonb + version)]
```

Aucun rebuild : la requête suivante sur `/about` relit `GET /api/profile` (spec 022).

**API — flux**

- `GET /api/profile` : `ProfileService.findCurrent()` lit la ligne `'main'` ; absente ⇒ 404.
- `PUT /api/profile` : DTO validé ; si `content` est profondément égal au contenu stocké, renvoie le
  document courant **sans écrire** ; sinon `UPDATE … SET content, version = version + 1,
  updated_at = now() WHERE id = 'main' AND version = :version RETURNING *` ; aucune ligne ⇒ 409
  (`ConflictException`, message « version périmée ») ; succès ⇒ document renvoyé, rien d'autre.
- ~~`SiteRebuild`~~ (A1) : **retiré** le 2026-10-10 ; `BlogService` reste identique à `master`
  (`triggerDeploy` privé) jusqu'à la PR API qui le supprime après la bascule de la spec 022.
- `POST /api/profile/portrait` (JWT, multipart `file`, 5 Mo, `image/(webp|jpeg|png|avif)`, 422
  sinon) : `ImageOptimizer.toPortrait(buffer)` (nouvelle méthode, sur le modèle de `toShareCard` :
  `rotate`, `resize({ width: 640, height: 800, fit: 'cover', position: 'attention' })`, AVIF
  qualité 60) ⇒ clé `profile/portrait-<sha8>.avif` (même clé que le portrait courant ⇒ réponse
  sans envoi ni écriture) ⇒ envoi S3 ⇒ `UPDATE … SET portrait_key = <nouvelle>,
  previous_portrait_key = <courante>` conditionné aux deux clés lues (sinon 409) ; **si l'écriture
  en base échoue, la nouvelle clé est supprimée** (sauf si elle est la clé précédente, encore
  citée) avant de relancer l'erreur ; ensuite suppression de l'**avant-dernière** clé (l'ancienne
  `previous_portrait_key`, si elle n'est ni la nouvelle courante ni la nouvelle précédente). La
  version du document n'est pas touchée (un brouillon de texte ouvert reste valide).
- **Clé précédente gardée (décision de la session du 2026-10-10, modifie A5)** : motivée à l'origine
  par la fenêtre de rebuild ; avec le rendu à la requête (spec 022), elle protège encore les pages
  `/about` déjà ouvertes dans un navigateur et la copie périmée que nginx sert si l'API tombe :
  supprimer la clé dès l'envoi leur donnerait un 404 sur l'image LCP. Chaque changement fait donc
  glisser les clés (courante → précédente) et ne supprime que l'avant-dernière : **au plus un fichier
  « en trop », jamais une image cassée**. Colonne `previous_portrait_key` (nulle, jamais exposée par
  l'API). Comportement API inchangé (déjà implémenté).
- `DELETE /api/profile/portrait` (JWT, 204) : `portrait_key = NULL, previous_portrait_key =
  <courante>` (même condition), puis suppression de l'avant-dernière clé ; la clé retirée est gardée
  jusqu'au changement suivant ; sans portrait, 204 sans écriture.
- Échec de suppression S3 **après** une écriture réussie : journalisé avec la clé (même politique
  que `ProjectsService.remove`), jamais une erreur 500 ; c'est le seul orphelin possible, tracé.

**Front — flux public (F1)**

- `About` appelle `getProfile()` (une requête au lieu de 8 observables), passe les sections du
  document aux composants. Identité (nom, ville, portrait, réseaux) : constante de la page
  `pages/about/about-identity.ts`, construite depuis `SITE_IDENTITY` (ADR-0004 : le domaine
  n'importe pas `@shared`, la page transmet par `input()`). L'accroche reçoit `SITE_IDENTITY.journey`
  par un `input` dédié.
- `/api/profile` entre dans `PUBLIC_READ_PATHS` : le document est sérialisé au rendu serveur (à la
  requête, spec 022 ; origine interne mappée par `HTTP_TRANSFER_CACHE_ORIGIN_MAP`), aucune requête à
  l'hydratation (même mécanisme que `/projects`).
- Résumés de section : `AboutWhatIDo` et `AboutDiploma` reçoivent `summary` en `input` ; constantes
  `WORK_SUMMARY` et `DIPLOMA_SUMMARY` supprimées.
- Portrait : l'adapter rend `portraitUrl: string | null` (`STORAGE_BASE_PATH` + URL publique de
  l'API, précédent `toProject`) ; la page passe `avatarUrl = portraitUrl ?? '/avatar.avif'`
  (constante `DEFAULT_PORTRAIT_URL` de `about-identity.ts`). `AboutHero` est inchangé (`fill`,
  `priority`, alt fixe). Avec un portrait défini, le HTML rendu porte
  `<link rel="preload" href="/api/storage/portfolio-storage/profile/portrait-<sha8>.avif">` : même
  origine, servi par le cache nginx ; premier visiteur après un remplacement = un aller-retour
  nginx → API, puis cache disque d'un an (clé hachée, aucun risque de portrait périmé).
- ~~Garde de build~~ (**retirée** le 2026-10-10, D9 amendée) : `/about` n'est plus prérendue. La
  smoke CI de la spec 022 (image + doublure d'API `ci/api-stub/`) exige `data-testid="about-lead"` et
  `data-testid="journey-paragraph"` dans la réponse de `/about` ; une lecture `/api/profile` en échec
  rend la page en 503 (spec 022, T4), jamais une page vide en 200.

**Front — admin (F2-F8)**

- Route `profile` (`/admin/profile`), `canDeactivate: [unsavedChangesGuard]`, titre « Parcours |
  Admin » ; redirection historique `about` → `profile` (au lieu de `''`).
- Page `AdminProfile` (smart, `pages/admin-profile/`) : `rxResource` sur `getProfile()`,
  `DocumentDraft` (brouillon, ligne de base, compte, sommaire, garde, envoi), `AdminEditorFrame`
  (formulaire + sommaire), `AdminSaveBar`, toasts. La page possède le brouillon ; `AdminProfileForm`
  l'édite en `model()` et émet le contenu à la soumission (ADR-0013 §2).
- **Frontière presenter / vue** : toute dérivation est en fonctions pures testées sans TestBed —
  `toProfileDraft` / `toProfileContent` (`profile-draft.ts`), `toFrenchTypography`, `moveItem` ;
  `DocumentDraft` porte l'état du brouillon (classe instance-scopée à la page, ni store ni facade :
  aucun I/O, aucun état partagé). Les composants ne gardent que la glue DOM (focus, annonces).
- **Décomposition** (fichiers à créer, pas « à découper plus tard ») : `AdminProfileForm` (racine du
  formulaire, schéma) → cinq composants de champs par section (`admin-profile-biography-fields`,
  `-traits-fields`, `-work-fields`, `-diplomas-fields`, `-motivation-fields`) → `AdminOrderedList`
  (cadre générique de liste, la ligne est un `ng-template` fourni par la section, précédent
  `AdminEditorFrame` + `contentChild`).
- **`DocumentDraft` plutôt qu'`EditorDraft` (divergence assumée)** : `EditorDraft` est couplé à la
  création d'entité, aux tags (ensemble) et à la couverture (fichier en attente) ; le parcours est un
  singleton sans création ni fichier. `DocumentDraft` réutilise `countChangedFields`,
  `toFormTocEntries` et `LeaveConfirmation` tels quels ; seule la mise en place de quatre signaux est
  dupliquée. Après un envoi réussi, brouillon **et** ligne de base repartent du document renvoyé
  (normalisé par la typographie), donc le compte retombe à zéro.
- Section 01 « Parcours » : la phrase d'identité est **affichée en lecture** (texte, pas un champ
  désactivé) avec la mention « Commune à l'accueil et aux offres : se modifie dans le code. », puis
  le champ « Suite de l'accroche ».
- Conflit 409 : toast d'erreur « Le parcours a été modifié depuis une autre fenêtre. Rechargez la page
  pour repartir de la dernière version (vos modifications non enregistrées seront perdues). » ; le
  brouillon est conservé. 400/422 : `withValidationDetail("Le parcours n'a pas pu être enregistré.",
  err)`. Succès : toast « Parcours enregistré » ; l'introduction de la page dit « Les changements
  sont visibles sur le site au plus une seconde après l'enregistrement, au rechargement de la page. »
  (formule des éditeurs projets et articles, rendu à la requête de la spec 022).
- **Section « 06 · Portrait »** (F7), hors du `<form>` (formulaires imbriqués interdits, précédent
  « 05 · Galerie »), listée au sommaire (« 06 · Portrait », jamais marquée « modifié ») : vignette
  courante (`NgOptimizedImage` `fill`, cadre 4:5, **sans** `priority`, alt fixe), `/avatar.avif` et
  mention « Portrait par défaut » quand il n'y en a pas, `FileDropzone` (`accept="image/avif,
  image/webp,image/png,image/jpeg"`, aide « AVIF, WebP, PNG ou JPEG, 5 Mo au plus », comme la
  galerie) qui envoie **immédiatement** (pas de fichier en attente dans le brouillon) ; type hors de
  ces quatre refusé côté front (toast « Seules les images AVIF, WebP, PNG ou JPEG sont
  acceptées. »), taille contrôlée par l'API (422) ; statut « Envoi du portrait… » pendant l'envoi ;
  « Revenir au portrait par défaut » (`appButton variant="text-danger"`) derrière `ConfirmDialog`.
  Le portrait vit dans un `linkedSignal` de la page sur le document chargé (précédent `gallery`),
  hors `DocumentDraft` : il ne compte pas dans les modifications non enregistrées. Description de
  la section : « Envoyé dès le dépôt, sans passer par l'enregistrement. Visible sur le site au plus
  une seconde après l'envoi, au rechargement de la page. » (formule des éditeurs, spec 022).
  Toasts : « Portrait remplacé », « Portrait par défaut rétabli » ; échecs « Le portrait n'a pas pu
  être remplacé. » / « Le portrait par défaut n'a pas pu être rétabli. », détail 422 par
  `withValidationDetail`, 503 (verrou du parcours) ⇒ « … Réessayez dans quelques secondes. ».
- **Avertissement de formulation** (F6) : `FORBIDDEN_WORDINGS` (`shared/identity/
  forbidden-wordings.ts`, TS pur : `readonly { label: string; pattern: RegExp }[]`, les trois
  formulations) ; presenter pur `profileWordingWarnings(draft): readonly WordingWarning[]`
  (`{ fieldId, fieldLabel, wording }`, un par champ et formulation trouvés, lignes de liste
  comprises) ; composant dumb `AdminWordingNotice` au-dessus de la barre d'enregistrement : titre
  « À relire avant de publier », liste « « métallurgie » dans Paragraphe 2 » avec lien
  `routerLink="." [fragment]` vers le champ ; rendu seulement s'il y a des avertissements ; **pas**
  de région live (pas d'annonce à chaque frappe) ; aucune influence sur la validité ni sur la
  soumission. `editorial-identity.spec.ts` compose `[...FORBIDDEN_WORDINGS, ...]` avec ses
  formulations d'identité propres (« aujourd'hui développeur », etc.) au lieu de dupliquer les trois.
- Aperçu (F8) : bouton « Aperçu » `appButton variant="outlined"` `aria-pressed` dans l'aside de
  l'en-tête ; actif ⇒ le formulaire reste dans le DOM avec `hidden` (modèle et erreurs conservés),
  la barre d'enregistrement est retirée (mention « Revenez à l'édition pour enregistrer. ») et
  `AdminProfilePreview` rend `AboutJourney`, `AboutHighlights`, `AboutWhatIDo`, `AboutDiploma`,
  `AboutMotivation` dans un conteneur `inert`, à partir de `toProfileContent(brouillon)`.

**Landmarks** : `App` garde le seul `main` ; l'admin n'émet ni `header` banner ni `footer`. Les
sections publiques de l'aperçu portent des `section aria-labelledby` (régions) : sous `inert`, elles
sortent de l'arbre accessible. Ids de section du formulaire préfixés `profile-` (aucune collision
avec `journey-heading`, `traits-heading`, `work-heading`, `diploma-heading`, `motivation-heading`).

### Contrat d'API

`GET /api/profile` (public, `PublicReadThrottle`) ⇒ `200` :

```json
{
  "version": 1,
  "updatedAt": "2026-10-11T08:00:00.000Z",
  "biography": { "title": "…", "summary": "…", "leadEmphasis": "…", "paragraphs": ["…"] },
  "highlights": [{ "id": "uuid", "title": "…", "description": "…" }],
  "workSummary": "…",
  "whatIDo": [{ "id": "uuid", "title": "…", "description": "…" }],
  "technologies": [{ "id": "uuid", "name": "…", "category": "…", "icon": "angular" }],
  "diplomasSummary": "…",
  "diplomas": [{ "id": "uuid", "title": "…", "provider": "…", "level": "…", "shortDescription": "…", "skills": ["…"] }],
  "motivation": { "title": "…", "statement": "…", "description": "…" },
  "portrait": "/storage/portfolio-storage/profile/portrait-1a2b3c4d.avif"
}
```

`portrait` : `null` tant qu'aucun portrait n'est défini (état initial après seed). `404` si aucune
ligne (impossible après la migration de seed).

`POST /api/profile/portrait` (`JwtAuthGuard`, multipart) ⇒ `200` document complet ; `422` fichier
absent, trop lourd, type refusé ou illisible ; `409` portrait changé pendant l'envoi (autre onglet) ;
`401`. `DELETE /api/profile/portrait` (`JwtAuthGuard`) ⇒ `204` ; `409` idem.

`PUT /api/profile` (`JwtAuthGuard`, limite globale) : corps = les 8 clés de contenu + `version`
(entier ≥ 1) ; pas d'`updatedAt`. Réponses : `200` document (version incrémentée si le contenu a
changé, inchangée sinon) ; `400` validation (clé inconnue, borne, liste vide, `id` non UUID ou
dupliqué dans sa liste, `icon` hors `^[a-z0-9-]{1,40}$`) ; `401` ; `409` version périmée.

Validation (DTO) : chaînes `IsString` + `IsNotEmpty` + `MaxLength` (bornes D11) ; listes `IsArray` +
`ArrayMinSize(1)` + `ArrayMaxSize` + `ValidateNested({ each: true })` + `Type` + `ArrayUnique(id)` ;
`skills` et `paragraphs` `IsString({ each: true })` + `MaxLength(…, { each: true })` ; bornes en
constantes nommées (`PROFILE_LIMITS`, `src/profile/profile-limits.ts`), recopiées côté front
(`features/profile/domain/models/profile-limits.ts`) pour les messages de formulaire.

### Fichiers à créer / modifier

**API (`nest-portfolio-app`)**

| Fichier | Rôle |
|---|---|
| ~~`src/site-rebuild/**`~~, ~~`src/blog/**`~~ | **retirés de la PR** (A1, 2026-10-10) : blog identique à `master` |
| `src/database/schema/profile-content.ts`, `schema/index.ts` | table `profile_content` (`id text PK default 'main' CHECK`, `content jsonb $type<ProfileContent>`, `version integer default 1`, `portrait_key text` et `previous_portrait_key text` nullables, `updated_at`) |
| `drizzle/0020_profile_content.sql` + `meta/` | création de la table (`drizzle-kit generate --name=profile_content`) |
| `drizzle/0021_profile_seed.sql` + `meta/` | `drizzle-kit generate --custom --name=profile_seed` : `INSERT … VALUES ('main', $seed$<JSON>$seed$::jsonb, 1) ON CONFLICT ("id") DO NOTHING` |
| `src/profile/profile-content.ts` | types `ProfileContent` et sous-types (source du `$type`) |
| `src/profile/profile-limits.ts` | `PROFILE_LIMITS` (bornes D11) |
| `src/profile/profile.seed.ts` (+ `profile-seed.spec.ts`) | `PROFILE_SEED`, généré depuis le front (cf. Tranche A2) |
| `src/profile/dto/*.dto.ts` (+ `update-profile.dto.spec.ts`) | `UpdateProfileDto` et DTO imbriqués (`profile-items.dto.ts` : biographie, trait, activité, techno, formation, motivation) ; décorateurs `ProfileText` (non blanc, borne, sans balisage HTML) et `ProfileItemList` / `ProfileSection` |
| `src/profile/profile-document.ts` | `findProfileRow`, `toProfileDocument` (ligne ⇒ réponse), `toProfileContent` (DTO ⇒ `jsonb` simple) |
| `src/profile/profile-test-builders.ts` | `aProfileContent()` : contenu neutre valide pour les specs |
| `src/profile/profile.service.ts` (+ `.spec.ts`) | `findCurrent()`, `replace(dto)` (égalité, version) |
| `src/profile/profile.controller.ts` (+ `.spec.ts`) | `GET` public, `PUT`, `POST portrait`, `DELETE portrait` gardés |
| `src/profile/profile-portrait.service.ts` (+ `.spec.ts`) | envoi, remplacement, retrait du portrait (compensation, nettoyage) |
| `src/storage/image-optimizer.service.ts` (+ spec) | `toPortrait(buffer)` 640×800 AVIF ; constante `PORTRAIT` |
| `src/profile/profile.module.ts`, `src/app.module.ts` | câblage |
| ~~`src/projects/**`~~ | **retirés de la PR** (A4, 2026-10-10) : projets identiques à `master` |
| `README.md` | section Profile (dont lifecycle S3 du portrait) ; aucune mention de rebuild pour le profil |

**Front (ce dépôt)**

| Fichier | Rôle | Tranche |
|---|---|---|
| `features/profile/domain/models/profile-content.model.ts` | `ProfileContent`, `ProfileDocument` (dont `portraitUrl`) | F1 |
| `features/profile/domain/models/biography.model.ts`, `what-i-do.model.ts` | `id` et `lead` retirés de `Biography`, `id` retiré de `Motivation` | F1 |
| `features/profile/domain/models/profile-limits.ts` | bornes recopiées de l'API | F2 |
| `features/profile/domain/models/technology-icon.ts` | `TECHNOLOGY_ICONS` (liste fermée `as const`), `TechnologyIcon` | F4 |
| `features/profile/domain/gateways/profile.gateway.ts` | `getProfile(): Observable<ProfileDocument>` (F1), `saveProfile(content, version)` (F2), `uploadPortrait(file)`, `removePortrait()` (F7) | F1, F2, F7 |
| `features/profile/infra/gateways/http-profile.gateway.ts` (+ spec) | `GET`/`PUT` `${API_BASE_URL}/profile`, `POST`/`DELETE` `/profile/portrait`, écritures en `silentErrors()` | F1, F2, F7 |
| `features/profile/infra/profile.adapter.ts` (+ spec), `profile.types.ts` | DTO API → `ProfileDocument` (fonction pure) | F1 |
| `features/profile/infra/gateways/in-memory-profile.gateway.ts`, `infra/data/profile.static-data.ts` (+ spec), `testing/fake-profile-gateway.ts` | **supprimés** | F1 |
| `features/profile/testing/profile-builders.ts`, `testing/stub-profile-gateway.ts` | builder `aProfileContent()`/`aProfileDocument()` (contenu neutre, jamais la copie réelle) ; stub avec espions | F1 |
| `features/profile/pages/about/about.ts` (+ spec), `pages/about/about-identity.ts` | lecture unique, identité de page, `DEFAULT_PORTRAIT_URL` et repli | F1 |
| `features/profile/application/about-hero.ts`, `about-what-i-do.ts`, `about-diploma.ts` (+ specs) | `lead` et `summary` en `input` | F1 |
| `app.config.ts` | `HttpProfileGateway`, `'/profile'` dans `PUBLIC_READ_PATHS` | F1 |
| `editorial-identity.spec.ts`, `testing/editorial-sources.ts` | entrée « about lead » retirée (couverte par `about.spec`) ; constantes du profil remplacées par `ABOUT_IDENTITY` | F1 |
| `.github/workflows/ci.yml`, `ci/api-stub/fixtures/profile.json` | smoke de `/about` à la requête (fixture `/api/profile`) ; **aucune garde de build** (D9 amendée) | F1 |
| `features/admin/admin.routes.ts` (+ spec) | route `profile`, redirection `about` → `profile` | F2 |
| `features/admin/application/admin-nav-groups.ts` (+ spec) | clé `profile`, « Parcours », icône `user`, entre Articles et CV | F2 |
| `features/admin/application/document-draft.ts` (+ spec) | brouillon d'un document singleton | F2 |
| `features/admin/application/profile-draft.ts` (+ spec) | `ProfileDraft`, `toProfileDraft`, `toProfileContent` | F2-F5 |
| `features/admin/pages/admin-profile/admin-profile.ts` (+ spec) | page smart | F2, F6-F8 |
| `features/admin/application/components/admin-profile-form.ts` (+ spec) | racine Signal Forms, schéma, `model()` + `submitted` | F2-F4 |
| `features/admin/application/components/admin-profile-{biography,traits,work,diplomas,motivation}-fields.ts` | champs par section | F2-F4 |
| `features/admin/application/components/admin-editor-frame.ts` | `testIdPrefix` += `'admin-profile'` | F2 |
| `features/admin/application/components/admin-ordered-list.ts` (+ spec) | cadre de liste ordonnable | F3 |
| `shared/collections/move-item.ts` (+ spec) | `moveItem<T>(items, index, delta)` générique | F3 |
| `features/projects/domain/move-gallery-image.ts` (+ spec), `admin-project-gallery.ts` | **supprimé**, la galerie passe par `moveItem` (une seule fonction de déplacement) | F3 |
| `shared/format/french-typography.ts` (+ spec), `testing/french-typography-violations.ts`, `editorial-typography.spec.ts` | normaliseur ; contrôle extrait du spec pour être partagé | F5 |
| `shared/identity/forbidden-wordings.ts` (+ spec) | `FORBIDDEN_WORDINGS`, source unique | F6 |
| `editorial-identity.spec.ts` | compose `FORBIDDEN_WORDINGS` | F6 |
| `features/admin/application/profile-wording-warnings.ts` (+ spec) | presenter des avertissements | F6 |
| `features/admin/application/components/admin-wording-notice.ts` (+ spec) | bloc d'avertissement non bloquant | F6 |
| `features/admin/application/components/admin-profile-portrait.ts` (+ spec) | section Portrait (vignette, dépôt, retour au défaut) | F7 |
| `features/admin/application/components/admin-profile-preview.ts` (+ spec) | aperçu `inert` | F8 |
| `DESIGN.md` | navigation admin, « Éditeur de parcours », « Liste ordonnable », portrait, avertissement | F2, F3, F6-F8 |

### Modèles de données (front)

```ts
// features/profile/domain/models/profile-content.model.ts
export type ProfileContent = {
  readonly biography: Biography;          // title, summary, leadEmphasis, paragraphs
  readonly highlights: readonly Highlight[];
  readonly workSummary: string;
  readonly whatIDo: readonly WhatIDo[];
  readonly technologies: readonly Technology[];
  readonly diplomasSummary: string;
  readonly diplomas: readonly Diploma[];
  readonly motivation: Motivation;        // title, statement, description
};
export type ProfileDocument = {
  readonly version: number;
  readonly updatedAt: string;
  readonly content: ProfileContent;
  readonly portraitUrl: string | null;   // null ⇒ portrait par défaut
};
```

- `ProfileInfo` et `SocialButton` restent (premier écran), alimentés par `about-identity.ts`.
- `Technology.icon` reste `string` dans le domaine (l'API valide un format, pas la liste) ; la liste
  fermée contraint **la saisie** : la ligne du brouillon est typée `icon: TechnologyIcon | ''`, et
  `toProfileContent` n'accepte qu'un brouillon validé (schéma `required`).
- `ProfileDraft` (admin, mutable comme `ProjectDraft`, modèle Signal Forms) : 13 champs à plat pour
  un compte de modifications fin — `biographyTitle`, `biographySummary`, `leadEmphasis`,
  `paragraphs: { text: string }[]`, `highlights`, `workSummary`, `whatIDo`, `technologies`,
  `diplomasSummary`, `diplomas` (ligne avec `skills: string`, une compétence par ligne),
  `motivationTitle`, `motivationStatement`, `motivationDescription`. `toProfileContent` copie les
  lignes **champ par champ** (symbole interne Signal Forms), coupe les espaces de bord, découpe
  `skills` par ligne (lignes vides écartées), applique `toFrenchTypography` (F5).
- `id` d'une ligne ajoutée : `crypto.randomUUID()` (source d'aléa = frontière d'I/O, espionnée en
  test) ; jamais l'index.
- Immutabilité : modèles de domaine `readonly` ; signaux de `DocumentDraft` exposés en lecture
  (`asReadonly()`) sauf `value` (modèle `model()` du formulaire, précédent `EditorDraft.value`).

### Réactivité

- Public : `rxResource({ stream: () => gateway.getProfile() })`, `content = computed(() =>
  hasValue() ? value().content : undefined)` (garde de `value()` en erreur, précédent `about.ts:103`).
- Admin : `rxResource` + `loadState(resource, () => false)` ; `DocumentDraft` en `linkedSignal`
  (brouillon et ligne de base sur le document chargé) et `computed` (compte, sommaire) ; aperçu
  `computed(() => toProfileContent(draft.value()))`. Aucun `effect`.
- Focus après déplacement, ajout, retrait : `afterNextRender` avec `Injector` (précédent
  `admin-project-gallery.ts:125`), phase `write`.

### État partagé & coordination

- Aucun store. `DocumentDraft` : état local de page. `AdminProfile` : page smart qui consomme le port.
- **Gateway** : `ProfileGateway` reste un port abstrait (implémentation HTTP + stub de test ;
  `application` et `pages` ne dépendent pas d'`infra`, câblage dans `app.config.ts`). Aucun
  `HttpClient` hors `HttpProfileGateway`. Pas de use case : lecture et écriture sans logique métier
  côté front (passthrough proscrit).
- API : `ProfileService` possède la table ; aucun service de publication (A1 retiré).

### Cross-platform / bibliothèques

Aucune cible native. Aucune dépendance ajoutée (API : `class-validator`, `drizzle-orm` déjà là ;
front : Signal Forms, Tailwind).

### Livraison (ordre)

1. **PR API** (A2, A3, A5 ; A1 et A4 retirés) : merge → déploiement (migrations jouées au démarrage)
   → `GET https://api.nedellec-julien.fr/api/profile` égal au contenu statique, `portrait: null`
   (preuve API 3).
2. **PR front 022** (rendu à la requête) mergée et vérifiée en prod (cf. spec 022, Livraison) :
   prérequis de F1, sans quoi une édition du parcours n'aurait aucun chemin de publication.
3. **PR front 1 — `/about` lit l'API** (F1) : branche depuis `master` **après** (1) déployée et (2)
   en prod. Preuve : texte visible de `/about` servie par le conteneur local (doublure d'API sur le
   seed) identique à celui de `master`.
4. **PR front 2 — admin** (F2-F8) : branche depuis `master` après merge de (3) (fichiers communs :
   `profile.gateway.ts`, `http-profile.gateway.ts`, `profile-builders.ts`). F8 détachable (D7) :
   si elle sort, PR front 3 depuis `master` après (4).

### Tranches

API (`pnpm test`, Jest) :

- ~~**Tranche A1 — le webhook de rebuild devient un service partagé**~~ : **retirée** le 2026-10-10
  (spec 022) ; code et tests retirés de la branche, blog identique à `master`.
- **Tranche A2 — le parcours se lit, contenu initial exact** : schéma (dont `portrait_key` nulle),
  migrations 0020-0021, seed, `GET` (`portrait: null`). `PROFILE_SEED` est **généré** par une commande lancée dans le front, sortie collée telle
  quelle :
  `pnpm exec tsx --tsconfig tsconfig.json -e "<import des STATIC_*, mapping vers ProfileContent sans
  lead ni id de section, workSummary et diplomasSummary repris de about-what-i-do.ts:7 et
  about-diploma.ts:5, console.log(JSON.stringify(seed, null, 2))>"` ; le JSON de la migration
  0021 est la même sortie. Tests : `profile-seed.spec` (le seed passe `validate(plainToInstance(
  UpdateProfileDto, { ...PROFILE_SEED, version: 1 }))` sans erreur ; les formulations validées
  sont exactes — résumé, suite de l'accroche, premier paragraphe, description « Vision
  d'ensemble », avec `\u00a0` — ; le JSON extrait de `drizzle/0021_profile_seed.sql` entre
  `$seed$` est `toEqual(PROFILE_SEED)`) ; `profile.service.spec` (ligne ⇒ réponse à plat avec
  `version`/`updatedAt` ; aucune ligne ⇒ `NotFoundException`) ; `profile.controller.spec` (`GET`
  sans garde, métadonnée de throttle publique).
- **Tranche A3 — l'admin remplace le parcours** : DTO, `PUT`, version, égalité (aucun rebuild :
  amendement du 2026-10-10 ; les assertions sur `trigger` sont retirées).
  Tests : `update-profile.dto.spec` (`it.each` invalides : clé inconnue, liste vide, 9 paragraphes,
  `id` dupliqué, `id` non UUID, `icon` `Angular`, chaîne vide, borne +1 ; valide : seed) ;
  `profile.service.spec` (contenu identique ⇒ pas d'`update` ; contenu changé ⇒ `update`
  conditionné à la version ; `returning` vide ⇒ `ConflictException`) ;
  la validité du seed au regard du DTO (prévue en A2) est vérifiée ici, le DTO n'existant qu'en A3 ;
  `profile.controller.spec` (`PUT` porte `JwtAuthGuard`).
- ~~**Tranche A4 — les projets publient aussi**~~ : **retirée** le 2026-10-10 (spec 022 : les projets
  sont visibles à la requête) ; code et tests retirés de la branche, projets identiques à `master`.
- **Tranche A5 — le portrait se remplace et se retire sans orphelin** : colonne `portrait_key`
  (migration 0020 la porte dès A2, nulle ; A5 ajoute le comportement), `toPortrait`,
  `ProfilePortraitService`, deux routes, `portrait` dans la réponse. Tests :
  `image-optimizer.service.spec` (sortie AVIF 640×800 depuis un PNG 1 000×600 et un JPEG portrait ;
  entrée illisible ⇒ 422) ; `profile-portrait.service.spec` (envoi ⇒ `storage.upload` sur
  `profile/portrait-<sha8>.avif` puis `update` (courante → précédente) puis suppression de
  l'**avant-dernière** clé, dans cet ordre ; sans clé précédente ⇒ aucune
  suppression ; même fichier que le courant ⇒ ni envoi, ni écriture ; fichier du
  portrait précédent ⇒ redevient courant, aucune suppression ; écriture conditionnée aux deux clés
  lues, `returning` vide ⇒ 409 et compensation ; `update` en échec ⇒ la nouvelle clé est supprimée
  (sauf si elle est la précédente), l'erreur remonte ; suppression de
  l'avant-dernière en échec ⇒ réponse 200, erreur journalisée avec la clé ; retrait ⇒ `update` à
  `null` (courante → précédente), suppression de l'avant-dernière ; retrait sans
  portrait ⇒ rien) ; `profile.service.spec` (réponse :
  `portrait` = `getPublicUrl(clé)` ou `null`) ; `profile.controller.spec` (garde JWT et
  `ParseFilePipe` 422 sur les deux routes d'écriture).

Front (`pnpm test`, Vitest) :

- **Tranche F1 — `/about` lit le document de l'API** : port réduit à `getProfile`, HTTP + adapter
  (`portrait` ⇒ `STORAGE_BASE_PATH` + URL, `null` conservé),
  page, identité de page, résumés en `input`, câblage, transfer cache, suppression du statique,
  sources éditoriales (aucune garde de build, D9 amendée). Tests : `http-profile.gateway.spec` (`GET
  https://api.test/api/profile`, mapping) ; `profile.adapter.spec` ; `about.spec` (stub +
  builder : titre de biographie, paragraphes, traits, techno, formations, motivation rendus ;
  `about-lead` contient `SITE_IDENTITY.journey` **une fois**, suivie de la suite de l'accroche ;
  résumés rendus depuis le document ; nom, ville et réseaux depuis l'identité de page ; `it.each` du
  portrait : `portraitUrl` défini ⇒ `src` du portrait = cette URL, `null` ⇒ `/avatar.avif`) ;
  `about-what-i-do.spec` / `about-diploma.spec` (résumé = `input`) ; specs éditoriaux verts.
- **Tranche F2 — l'admin édite et publie les textes du parcours** : route, navigation, page,
  `DocumentDraft`, `profile-draft`, formulaire (champs simples des sections 01, 03, 04, 05 ; les
  listes transitent inchangées), `saveProfile`. Tests : `document-draft.spec` (compte et sommaire,
  garde, envoi réussi ⇒ brouillon et ligne de base = document renvoyé, échec ⇒ brouillon conservé,
  `saving`) ; `profile-draft.spec` (aller-retour `toProfileContent(toProfileDraft(c))` égal à `c`
  sur builder ; espaces de bord coupés) ; `admin-profile-form.spec` (champ requis vidé ⇒ erreur
  sous le champ au `submit`, aucun `submitted` ; borne dépassée ⇒ message ; valide ⇒ `submitted`
  avec le contenu) ; `admin-profile.spec` (chargement, erreur + réessai, enregistrement ⇒
  `saveProfile(contenu, version)` + toast succès + compte à zéro ; 409 ⇒ toast conflit, brouillon
  intact ; 400 ⇒ détail ; phrase d'identité affichée en lecture, aucun champ pour elle) ;
  `admin-nav-groups.spec`, `admin.routes.spec` (`/admin/about` ⇒ `/admin/profile`, garde posée).
- **Tranche F3 — paragraphes, traits et activités se réordonnent** : `moveItem`, galerie rebranchée,
  `AdminOrderedList`, sections 01 (paragraphes), 02, 03 (activités). Tests : `move-item.spec`
  (`it.each` : monter, descendre, bords inchangés, index hors bornes, référence neuve) ;
  `admin-ordered-list.spec` (ajouter ⇒ ligne vide en fin, focus sur son premier champ, annonce ;
  monter le 2ᵉ ⇒ ordre changé, focus sur « Monter » de la ligne déplacée ou « Descendre » au bord,
  annonce « … déplacé en position 1 » ; retirer ⇒ focus sur la ligne suivante, sinon le bouton
  d'ajout ; pas de « Monter » sur la première ligne ni de « Descendre » sur la dernière ; maximum
  atteint ⇒ ajout `aria-disabled`, clic sans effet) ; `admin-profile-form.spec` (liste vidée ⇒
  erreur de liste au `submit`) ; `admin-project-gallery.spec` inchangé et vert.
- **Tranche F4 — stack et formations** : liste fermée d'icônes (`select`), formations avec
  compétences une par ligne. Tests : `profile-draft.spec` (`skills` « a\n\n b \n » ⇒ `['a', 'b']`) ;
  `admin-profile-form.spec` (icône non choisie ⇒ erreur ; options = `TECHNOLOGY_ICONS`).
- **Tranche F5 — la typographie française est rétablie à l'enregistrement** : `toFrenchTypography`,
  appliqué par `toProfileContent` à toute prose. Tests : `french-typography.spec` (`it.each` : chaque
  règle ; idempotence ; `12:30`, `https://x.fr/a?b=1`, `Prix: 890` inchangés ; sortie sans violation
  selon `testing/french-typography-violations.ts`) ; `editorial-typography.spec` vert sur le contrôle
  extrait.
- **Tranche F6 — avertissement de formulation, non bloquant** (D10) : `FORBIDDEN_WORDINGS`,
  presenter, `AdminWordingNotice`, test d'identité recomposé. Tests : `forbidden-wordings.spec`
  (`it.each` : « 20 ans », « 20\u00a0ans », « vingt ans », « Vingt\u202fans », « métallurgie »,
  « Métallurgie » détectés ; « 2020 », « 20 années », « métal » non) ;
  `profile-wording-warnings.spec` (biographie, paragraphe 2, description d'un trait, compétence
  d'une formation ⇒ un avertissement chacun, libellé de champ et ancre ; brouillon propre ⇒ `[]`) ;
  `admin-profile.spec` (paragraphe contenant « métallurgie » ⇒ bloc visible avec lien vers le champ ;
  « Enregistrer » ⇒ `saveProfile` **appelé** ; texte corrigé ⇒ bloc retiré) ;
  `editorial-identity.spec` vert, ses trois motifs lus dans `FORBIDDEN_WORDINGS`.
- **Tranche F7 — le portrait se remplace depuis l'admin** (D6) : port `uploadPortrait` /
  `removePortrait`, `AdminProfilePortrait`, page. Tests : `http-profile.gateway.spec` (`POST
  …/profile/portrait` en `FormData` champ `file` ; `DELETE`) ; `admin-profile-portrait.spec`
  (portrait défini ⇒ vignette + bouton de retour ; `null` ⇒ « Portrait par défaut », pas de bouton
  de retour ; fichier déposé ⇒ output ; confirmation ⇒ output de retrait) ; `admin-profile.spec`
  (dépôt ⇒ `uploadPortrait(file)`, vignette = nouvelle URL, toast succès, compte des modifications
  **inchangé** ; 422 ⇒ toast avec détail, vignette inchangée ; retour confirmé ⇒ `removePortrait`,
  « Portrait par défaut »).
- **Tranche F8 — aperçu de la page** (D7, détachable) : bascule, `AdminProfilePreview`. Tests :
  `admin-profile-preview.spec` (sections rendues depuis le contenu, conteneur `inert`, aucun `h1`) ;
  `admin-profile.spec` (« Aperçu » `aria-pressed="true"` ⇒ formulaire `hidden`, barre retirée, saisie
  conservée au retour).

### Consignes pour `qa`

- RED par assertion : créer d'abord les signatures (port `getProfile`/`saveProfile`, stub,
  builder, `moveItem` rendant `[...items]`, `toFrenchTypography` identité, `DocumentDraft` aux
  signaux constants) pour que le rouge tombe sur une valeur, pas sur un module introuvable.
- `ProfileGateway` fourni par le stub dans **tous** les tests de composants qui montent `About` ou
  `AdminProfile` (stub complet dès F1 : `uploadPortrait`/`removePortrait` en signature dès qu'ils
  entrent au port, pour que le RED de F7 tombe sur « espion non appelé ») ; `crypto.randomUUID` espionné (`vi.spyOn(crypto, 'randomUUID')`) dans les tests
  d'ajout de ligne.
- HTTP : `API_BASE_URL` absolu (`https://api.test/api`), `HttpTestingController.verify()` en
  `afterEach`. Zoneless : jamais `fakeAsync` ; `await fixture.whenStable()`.
- Attendus typographiques écrits en `\u00a0` / `\u202f`. Sélecteurs `data-testid` uniquement.
  Lire `$?` après `pnpm test`.
- API : `createMockDb()` n'exécute pas le SQL ; la clause de version se vérifie par les arguments de
  `where` et par le résultat `returning` simulé ; la sémantique réelle se prouve en local (Preuves
  API 2).

### Preuves attendues

**API**

1. Gates : `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm db:generate` sans différence résiduelle.
2. Local (`pnpm db:reset`) : `GET /api/profile` ⇒ version 1, contenu = seed ; `PUT` (cookie admin
   local) avec un paragraphe changé ⇒ version 2 ; même corps rejoué avec `version: 1` ⇒ 409 ; corps
   identique avec `version: 2` ⇒ 200, version 2, aucune écriture ; `DOKPLOY_DEPLOY_WEBHOOK_URL`
   pointé sur un serveur d'écho local ⇒ **aucun** `POST` reçu par une écriture du profil (A1/A4
   retirés).
   A5 (MinIO local) : envoi d'un JPEG de 3 Mo ⇒ objet `profile/portrait-<sha8>.avif` 640×800
   (`identify` ou `sharp().metadata()`), `GET /api/storage/…` ⇒ 200 `image/avif` immuable ; second
   envoi ⇒ nouvelle clé, l'ancienne **gardée** comme précédente ; troisième changement ⇒
   l'avant-dernière absente du bucket ; `DELETE` ⇒ `portrait: null`, seule la clé retirée reste ;
   aucun `POST` de webhook.
3. Production après déploiement, **`GET` uniquement** : `GET /api/profile` ⇒ 200, version 1,
   `portrait: null` ;
   comparaison mécanique avec le contenu statique du front (`tsx` + `node:assert/strict`
   `deepStrictEqual`, sortie consignée).

**Front**

1. Gates : `pnpm install --frozen-lockfile`, `pnpm test` (code 0), `pnpm lint`,
   `pnpm run build --configuration production`.
2. F1 : texte visible de `/about` servie par le conteneur local (`docker build` + `docker run`,
   API locale sur le seed ; balises retirées, espaces normalisées) **identique** à celui de
   `about/index.html` du build de `master` ; le HTML contient l'état de transfert de `/api/profile` ;
   aucun `GET /api/profile` dans l'onglet Réseau au chargement ; API arrêtée ⇒ `/about` en 503 (ou
   copie périmée nginx, `X-Cache-Status: STALE`), jamais une page vide en 200 (spec 022, T4).
   Instantané : `PUT` local d'un paragraphe puis rechargement de `/about` ⇒ nouveau texte, sans build.
3. F2-F8, local (API locale + MinIO + `pnpm start`, proxy de dev) : remplacer le portrait ⇒
   vignette, `/about` en dev l'affiche (URL `/api/storage/…`) ; revenir au défaut ⇒ `/avatar.avif` ;
   saisir « métallurgie » ⇒ avertissement, enregistrement possible ; modifier un paragraphe, réordonner deux
   traits, ajouter une techno, retirer une compétence, enregistrer ⇒ toast, compte à zéro, `GET
   /api/profile` reflète l'ordre ; `/about` en dev affiche le nouveau contenu ; deux onglets ⇒ le
   second enregistrement reçoit le toast de conflit ; quitter avec une modification ⇒ dialogue ;
   parcours complet au clavier (tabulation, monter, descendre, retirer, ajouter), focus visible à
   chaque étape ; AXE sans violation sur `/admin/profile` (édition, avertissement, aperçu) et sur
   `/about`. Lighthouse mobile local sur `/about` (conteneur, API locale avec un portrait défini) :
   LCP du portrait comparé à celui de `/avatar.avif` sur `master`, chiffres consignés.
4. Production après merge de chaque PR front, **`GET` uniquement** : `/about` servie identique ;
   la première publication réelle par le propriétaire est observée (contenu visible au rechargement,
   aucun déploiement Dokploy déclenché), jamais provoquée par nous.

### Risques & inconnues

- **Perte de contenu** : couverte par la génération mécanique du seed, le test d'égalité
  migration/seed, la comparaison `GET` prod/statique et la comparaison de texte servi
  `master`/branche. Le seed ne contient pas `lead` (verrouillé) ni les ids de section (supprimés).
- **Valeurs de calibration (D11)** : les bornes parient que le contenu restera de l'ordre de
  grandeur actuel (≤ ×4) et que les grilles publiques (traits en 3 colonnes `lg`, stack en 6 `xl`)
  tolèrent un nombre d'éléments non multiple ; une liste à 1 trait ou 7 technos se rend, sans
  équilibre visuel garanti. Listes non vides : suppose qu'aucune section ne doit pouvoir disparaître
  (sinon titre de section sans contenu).
- ~~**Rebuild en rafale**~~ : sans objet depuis l'amendement du 2026-10-10 (aucun rebuild).
- **Dérive éditoriale** : `motivation.description` répète la disponibilité CDI de
  `SITE_IDENTITY.hiringAvailability` (verrouillée) ; les formulations interdites ne sont plus
  contrôlées que par l'avertissement non bloquant (D10), limité aux trois formulations listées.
- **Portrait 640×800, valeur de calibration** : calcul — cadre de 20 rem = 320 px CSS ⇒ 640 px à
  DPR 2, 960 px à DPR 3. 640 parie que la DPR 2 suffit (léger flou possible à DPR 3) et garde le
  poids proche de l'actuel (`avatar.avif` : 9,5 ko ; un AVIF 640×800 qualité 60 d'une photo est
  attendu à quelques dizaines de ko, **non mesuré** : à mesurer en preuve A5). Recadrage
  `attention` côté serveur : un visage décentré peut être coupé différemment du cadrage voulu ;
  l'admin voit le résultat dans la vignette, sans réglage du cadrage (hors périmètre).
- **Clé de portrait encore citée** (résolue le 2026-10-10, réduite par la spec 022) : avec le rendu
  à la requête, seule une page `/about` déjà ouverte ou une copie périmée servie par nginx en panne
  d'API cite l'ancienne clé ; elle est **gardée** comme clé précédente et seule l'avant-dernière est
  supprimée au changement suivant (un fichier « en trop » au plus). Cas limite restant : deux
  changements rapprochés pendant une panne d'API suppriment la clé que la copie périmée cite ; le
  cache disque des images la sert s'il l'a déjà relayée. Ce cache n'est pas un volume : après un
  déploiement, premier visiteur = un aller-retour nginx → API pour l'image LCP, puis cache d'un an.
- **Aperçu approximatif** : les sections publiques basculent sur des requêtes de viewport ; dans la
  colonne admin (viewport − 15,75 rem de barre latérale) la bascule `lg` survient sur une largeur
  utile plus étroite que sur le site. Assumé (D7), pas de conversion en requêtes de conteneur.

## Plan de test

### Tranche F1 — `/about` lit le document de l'API

Signatures neutres posées pour que le rouge tombe sur une valeur : `ProfileContent` /
`ProfileDocument` (`profile-content.model.ts`, biographie et motivation en `Omit` de `id`/`lead`
tant que les modèles ne sont pas réduits), `abstract getProfile()` au port (anciennes méthodes
gardées, `InMemoryProfileGateway.getProfile` = `EMPTY`), `ProfileDto` (`profile.types.ts`),
`toProfileDocument` rendant un document vide, `HttpProfileGateway.getProfile` = `EMPTY` (classe non
encore `extends ProfileGateway`), `ABOUT_IDENTITY` vide (`about-identity.ts`), `AboutHero.lead`,
`AboutWhatIDo.summary`, `AboutDiploma.summary` en `input('')` non branchés (le gabarit lit encore
les constantes, renommées `staticSummary`). Supprimés, comme le prescrit le plan :
`profile.static-data.spec.ts` (formulations verrouillées côté API par `profile-seed.spec`, A2) et
`testing/fake-profile-gateway.ts`. Restent à supprimer en GREEN : `profile.static-data.ts`,
`in-memory-profile.gateway.ts`, les 8 anciennes méthodes du port, `WORK_SUMMARY`,
`DIPLOMA_SUMMARY`, `lead`/`id` de `Biography` et `id` de `Motivation`.

Doublures : `testing/profile-builders.ts` (`aProfileContent`, `aProfileDocument`, `aProfileInfo`,
`aSocialButton`, `aHighlight`, `aWhatIDo`, `aTechnology`, `aDiploma` ; contenu « témoin », jamais la
copie réelle), `testing/stub-profile-gateway.ts` (`stubProfileGateway(overrides)`).

| Test | Scénario | Assertions clés |
|---|---|---|
| `profile.adapter.spec` — document | DTO = contenu builder + `version` 4, `updatedAt`, `portrait: null` | `toEqual` du document : version, date, 8 sections, `portraitUrl: null`, pas de clé `portrait` dans `content` |
| `profile.adapter.spec` — `it.each` portrait | `null` ; `/storage/…/portrait-1a2b3c4d.avif` | `null` conservé ; `'/api' + chemin` (`STORAGE_BASE_PATH`) |
| `http-profile.gateway.spec` — lecture | `getProfile()` | un `GET https://api.test/api/profile`, émission = document adapté, portrait en `/api/storage/…` |
| `http-profile.gateway.spec` — échec | réponse 503 | aucune émission, l'erreur (503) atteint l'abonné : pas de repli |
| `about.spec` — host, h1 | parcours livré | h1 `Julien Nédellec`, aucun `main`, classes d'host |
| `about.spec` — recrutement | sections différées non rendues | ancre `#recrutement`, un seul h1 |
| `about.spec` — lecture unique | sections rendues | `getProfile` appelé une fois |
| `about.spec` — contenu | document à 3 paragraphes, 2 traits, 3 technos, 1 formation | résumé du parcours, textes des paragraphes, comptes, énoncé de motivation |
| `about.spec` — résumés | document | résumés « activités » et « formations » lus dans le document |
| `about.spec` — accroche | document | `about-lead` = `SITE_IDENTITY.journey` + suite du document, la phrase une seule fois |
| `about.spec` — premier écran | document | les trois `span` de la ligne d'en-tête, un par un : `développeur full-stack`, `Angular · NestJS · TypeScript`, `SITE_IDENTITY.location` (Angular retire les blancs entre eux, l'espacement vient de `gap-x-3.5`) |
| `about.spec` — réseaux | identité de page | GitHub, LinkedIn, Malt, Mail, Discord avec les `href` de `SITE_IDENTITY` (déplacé depuis `about-hero.spec`) |
| `about.spec` — `it.each` portrait | `portraitUrl` défini ; `null` | `src` = URL ; `/avatar.avif` ; alt `Portrait de Julien Nédellec` |
| `about.spec` — échec | `getProfile` en 503 | lecture tentée, aucun h1, accroche, paragraphe, trait ni motivation |
| `about.spec` — CTA, CV, prérendu | inchangés (stub au lieu du fake) | navigation, scroll contact, liens CV, CV lu au prérendu |
| `about-hero.spec` — accroche | `lead` en `input` | texte = `lead` + emphase, emphase dans le `span` |
| `about-hero.spec` — autres | builders | h1, liens web seuls en nouvel onglet, portrait sans animation, alt, squelette, lien CV |
| `about-what-i-do.spec` / `about-diploma.spec` — résumé | `summary` en `input` | en-tête de section = la valeur reçue |
| `about-diploma.spec` / `about-motivation.spec` | builders au lieu du statique | lignes, compétences, énoncé, CTA |
| `app.config.spec` — câblage | port résolu depuis `appConfig` | instance de `HttpProfileGateway` |
| `editorial-identity.spec` / `editorial-typography.spec` | `EDITORIAL_SOURCES` | entrée « about lead » retirée ; constantes du profil remplacées par `ABOUT_IDENTITY` ; verts |

Retraits assumés : le test « le titre ne contient pas le niveau » d'`about-diploma.spec` portait sur
le contenu statique (désormais en base) ; les invariants de `profile.static-data.spec` vivent dans
`profile-seed.spec` (API). Adaptation mécanique : `about-motivation.spec` — 3 sites repointés du
statique vers le builder, aucune valeur attendue modifiée (l'attendu est l'énoncé de l'entrée).

RED confirmé via la commande test du profil (`pnpm test`, après `ng cache clean`) le 2026-10-11
10:57, 25 failed / 3689 total, `exit=1`. Les 25 échecs sont dans les 7 fichiers F1 et sont tous des
assertions (dont 2 `HttpTestingController.expectOne` « found none ») ; aucune erreur de type, de
harnais ni de rejet non géré ; les 3 664 autres tests, éditoriaux compris, sont verts. Les tests CV
et CTA d'`about.spec` tombent pour la même raison (le stub ne sert que `getProfile`, la page
lit encore les 8 anciennes méthodes : premier écran en squelette).

Correction du contrat après GREEN (2026-10-11) : le test « premier écran » comparait le `textContent`
du `<p>` entier, qui colle les trois `span` faute de blancs entre eux (`preserveWhitespaces: false`,
espacement visuel par `gap-x-3.5`, balisage de production inchangé). Il compare maintenant chaque
`span`, avec les trois mêmes valeurs exactes. `pnpm test` le 2026-10-11 11:19 : 3696 passed / 3696,
`exit=0`.

Preuve runtime attendue (GREEN / Verify) : `ci/api-stub/fixtures/profile.json` = réponse de
`GET /api/profile` en production du 2026-10-11 (seed, `portrait: null`, insécables échappées),
servie par la route `/api/profile` ajoutée à `ci/api-stub/server.mjs` ; la smoke CI exige sur
`/about` `data-testid="about-lead"`, `data-testid="journey-paragraph"` et `"leadEmphasis"` (document
dans l'état de transfert : `'/profile'` dans `PUBLIC_READ_PATHS`). En local : conteneur + doublure ⇒
texte visible de `/about` identique à `master` ; modifier un paragraphe de la fixture puis recharger
`/about` ⇒ nouveau texte, sans build ; doublure arrêtée ⇒ 503 à froid (ou `STALE`), jamais une page
vide en 200.

### Tranche F2 — l'admin édite et publie les textes du parcours

Signatures neutres posées pour que le rouge tombe sur une valeur : `abstract saveProfile(content,
version)` au port (`HttpProfileGateway.saveProfile` = `EMPTY`, stub = `aProfileDocument()`) ;
`PROFILE_LIMITS` front (`profile/domain/models/profile-limits.ts`) à zéro ; `DocumentDraft`
(`admin/application/document-draft.ts`) aux signaux constants (`saved` nul, `changes` 0, `toc` vide,
`canLeave` vrai, `save` en échec) ; `ProfileDraft` (13 champs du plan, `icon: string` jusqu'à F4) avec
`toProfileDraft` / `toProfileContent` rendant un brouillon et un contenu vides ; `AdminProfileForm`
(`value` en `model.required`, `submitted`) et `AdminProfile` (`canLeave` vrai) à gabarit vide.

Contrat fixé par les tests (choix `qa`, à valider en GREEN) : sections `profile-biography`,
`profile-traits`, `profile-work`, `profile-diplomas`, `profile-motivation`, libellés du sommaire
« 01 · Parcours », « 02 · Traits », « 03 · Ce que je fais », « 04 · Formations », « 05 · Motivation » ;
formulaire `profile-form` ; champs `admin-profile-<clé>` (id `profile-<clé>`, erreur
`admin-profile-<clé>-error` / `profile-<clé>-error`) pour `biography-title`, `biography-summary`,
`lead-emphasis`, `work-summary`, `diplomas-summary`, `motivation-title`, `motivation-statement`,
`motivation-description` ; phrase d'identité `admin-profile-journey` + `admin-profile-journey-note`.
Toast de succès « Parcours enregistré » et introduction « Les changements sont visibles sur le site au
plus une seconde après l'enregistrement, au rechargement de la page. » (formule des éditeurs projets et
articles ; remplace « Il sera en ligne dans quelques minutes », caduc depuis la spec 022). « Annuler »
mène à `/admin`.

| Test | Scénario | Assertions clés |
|---|---|---|
| `profile-limits.spec` — golden | copie front des bornes | `toEqual` des valeurs de `PROFILE_LIMITS` de l'API |
| `http-profile.gateway.spec` — écriture | `saveProfile(contenu, 4)` | un `PUT https://api.test/api/profile`, corps = contenu + `version: 4`, `SKIP_ERROR_TOAST` vrai, émission = document adapté |
| `http-profile.gateway.spec` — `it.each` refus | 400, 401, 409 | l'erreur atteint l'abonné avec son statut |
| `document-draft.spec` — chargé | document chargé ; document arrivé après coup | brouillon = `toDraft(document)`, `saved`, compte 0, sommaire à blanc, `saving` faux |
| `document-draft.spec` — `it.each` compte | titre, ligne ajoutée, les deux, titre rétabli | compte 1, 1, 2, 0 et sections marquées |
| `document-draft.spec` — garde | sans modification puis avec, réponse oui/non | `true` immédiat, puis promesse résolue par la réponse ; `beforeunload` empêché seulement après édition |
| `document-draft.spec` — envoi réussi | brouillon `'  Après '`, document renvoyé `'Après'` version 4 | résultat `success`, `saved` = renvoyé, brouillon et ligne de base repartent de lui (compte 0, garde libre) ; réédition comptée contre lui |
| `document-draft.spec` — envoi refusé | écriture rejetée | `{ success: false, error }`, brouillon, compte et `saved` conservés |
| `document-draft.spec` — `it.each` `saving` | écriture résolue / rejetée | vrai pendant, faux après |
| `profile-draft.spec` — vers le brouillon | contenu témoin | `toEqual` des 13 champs (paragraphes en lignes `{ text }`, compétences une par ligne) ; lignes copiées (éditer le brouillon ne touche pas le document) |
| `profile-draft.spec` — `it.each` aller-retour | témoin ; deux éléments par liste | `toProfileContent(toProfileDraft(c))` égal à `c` |
| `profile-draft.spec` — `it.each` bords | titre, suite de l'accroche, résumés, énoncé, paragraphe, description de trait | espaces de bord coupés |
| `profile-draft.spec` — copie champ par champ | lignes marquées d'un symbole | aucune clé symbole dans les lignes du contenu (un `{ ...row }` échoue) |
| `admin-profile-form.spec` — forme | rendu | `form#profile-form` `novalidate` ; `it.each` des 8 champs : section, libellé « … obligatoire », `aria-required`, valeur du brouillon, saisie reportée au brouillon de la page |
| `admin-profile-form.spec` — envoi | intact ; titre et énoncé modifiés | `submitted` = contenu témoin ; contenu portant les deux modifications |
| `admin-profile-form.spec` — `it.each` requis | chaque champ vidé ; titre en blancs seuls | rien d'émis, `aria-invalid`, `aria-describedby` = erreur `role="alert"` « Ce champ est obligatoire » |
| `admin-profile-form.spec` — `it.each` bornes | borne + 1 sur chaque champ ; borne exacte sur deux | rien d'émis et message « … ne doit pas dépasser N\u00a0caractères » ; émis sans erreur |
| `admin-profile-form.spec` — focus | résumé d'activités et titre de motivation vidés | focus sur le premier invalide (`admin-profile-work-summary`) |
| `admin-profile.spec` — ouverture | document version 7 | une lecture, h1 « Parcours » unique, champ rempli, « Aucune modification », introduction |
| `admin-profile.spec` — identité | section 01 | phrase d'identité en texte, mention `\u00a0:`, aucun champ ne la contient |
| `admin-profile.spec` — chargement, erreur, réessai | `NEVER` ; erreur puis succès | `role="status"` sans formulaire ; `load-error` sans formulaire ; 2 lectures, formulaire rempli |
| `admin-profile.spec` — enregistrer | titre modifié | `saveProfile(contenu, 7)`, toast succès, compte à zéro ; champ = texte renvoyé (normalisé) ; second envoi en version 8 |
| `admin-profile.spec` — 409 | refus de version | toast de conflit du plan, brouillon et compte intacts, bouton réactivé |
| `admin-profile.spec` — `it.each` refus | 400 (doublon dédupliqué), 422, 401, 500 | « Le parcours n'a pas pu être enregistré. » + `Détail\u00a0: …` pour 400/422 seulement, brouillon conservé |
| `admin-profile.spec` — invalide, en cours | titre vidé ; `NEVER` | aucun envoi ni toast, erreur sous le champ ; bouton désactivé |
| `admin-profile.spec` — sommaire | rendu ; `it.each` de 5 champs | 5 liens `/admin/profile#profile-…` ; section marquée, compte 1 ; deux champs ⇒ 2 |
| `admin-profile.spec` — quitter | sans modification ; avec ; oui/non ; après envoi ; `beforeunload` | `/admin` sans dialogue ; dialogue « … du parcours seront perdues. », page gardée ; adresse selon la réponse ; aucun dialogue après envoi ; avertissement seulement après édition |
| `admin.routes.spec` | `/admin/profile`, `/admin/about` | route `profile`, titre « Parcours \| Admin », `AdminProfile`, `canDeactivate: [unsavedChangesGuard]` |
| `admin-nav-groups.spec`, `admin-nav.spec` | navigation | « Parcours » (`/admin/profile`, icône `user`) entre Articles et CV, sans compte, page courante, libellé mobile |

Ré-alignement de contrat (sweep de la navigation et des routes, `grep` de `'cv'`, `NAV_KEYS`,
`'about'`, `admin/about` sur tous les specs) : `admin-nav-groups.spec` (groupes, comptes, clés),
`admin-nav.spec` (liens du groupe Contenu, `NAV_KEYS`, page courante) et `admin.routes.spec` (titres)
encodaient l'ancienne navigation : recalibrés dans ce RED. Aucun autre spec ne cite `admin/about`.

RED confirmé via la commande test du profil (`pnpm test`, après `ng cache clean` et purge de
`node_modules/.vite`) le 2026-10-11 12:04, 123 failed / 3816 total, `exit=1`. Les 123 échecs sont dans
les 10 fichiers F2 et sont tous des assertions (93 `AssertionError` regroupées, dont 4
`HttpTestingController.expectOne` « found none ») ; aucune erreur de type, de harnais ni de rejet
non géré ; les 3 693 autres tests sont verts (3 701 avant F2, moins les 8 tests existants recalibrés).

Preuve runtime attendue (GREEN / Verify) : en local, API locale (`pnpm db:reset`) + `pnpm start`
(proxy de dev), session admin : `/admin/profile` rempli depuis `GET /api/profile` ; modifier la suite
de l'accroche puis « Enregistrer » ⇒ un `PUT /api/profile` (version lue), toast « Parcours
enregistré », compte à zéro ; recharger `/about` ⇒ nouveau texte, sans build ; second onglet resté
sur l'ancienne version ⇒ toast de conflit, saisie conservée ; titre vidé ⇒ erreur, aucun `PUT` ;
quitter avec une modification ⇒ dialogue ; `/admin/about` ⇒ `/admin/profile`. Si la doublure
`ci/api-stub` sert à la preuve, il lui faut un `PUT /api/profile` qui écrit la fixture en mémoire
(version + 1, 409 sur version périmée) **et** de quoi ouvrir une session admin : elle n'a aujourd'hui
ni l'un ni l'autre.

### Tranche F3 — paragraphes, traits et activités se réordonnent

Signatures neutres : `moveItem<T>(items, index, delta)` (`shared/collections/move-item.ts`) rendant
`[...items]` comme le prescrit le plan ; `AdminOrderedList<T>` (`admin/application/components/
admin-ordered-list.ts`, entrées `rows: FieldTree<T[]>` et `config: OrderedListConfig<T>` =
`testIdPrefix`, `item`, `moved`, `added`, `removed`, `add`, `max`, `create`) à gabarit vide. La ligne
est un `ng-template` projeté, contexte `{ $implicit: champ de la ligne, rank }`.

Contrat fixé par les tests (choix `qa`) :
- Liste : `ol > li` (`<préfixe>-row`). Boutons `<préfixe>-up`, `-down`, `-remove`, nommés « Monter /
  Descendre / Supprimer {item} {rang} » (verbes de la galerie projets). Bouton d'ajout `<préfixe>-add`
  au texte visible, `aria-disabled="true"` au maximum (reste focusable, clic sans effet). Région
  `<préfixe>-announcer` `role="status"`, vide au rendu : « {moved} en position N », « {added} en
  position N », « {removed} ».
- Focus : après un déplacement, le bouton du même sens sur la ligne déplacée, sinon le bouton opposé
  (bord) ; après un ajout, le premier champ de la nouvelle ligne ; après une suppression, le bouton
  « Supprimer » de la ligne qui prend la place, sinon le bouton d'ajout.
- Parcours : préfixes `admin-profile-paragraph` (section 01), `-highlight` (02), `-activity` (03).
  Champs `-paragraph-text`, `-highlight-title` / `-description`, `-activity-title` / `-description`,
  libellés « Paragraphe N », « Titre du trait N », « Description de l'activité N ». Bornes
  1200/60/400/60/600 avec message « … ne doit pas dépasser N\u00a0caractères ». Texte blanc = requis.
  Liste vidée : erreur de liste `admin-profile-<préfixe>-error` `role="alert"` (« Ajoutez au moins un
  paragraphe. », « … un trait. », « … une activité. »). Maximum 8/6/6. Id d'une ligne ajoutée tiré de
  `crypto.randomUUID` (espionné).

| Test | Scénario | Assertions clés |
|---|---|---|
| `move-item.spec` — `it.each` échanges | a, b, c ; 4 déplacements | ordre attendu |
| `move-item.spec` — bords, vide, seul, gel, références | hors bornes ; `[]` ; `['a']` ; liste gelée ; objets | inchangé ; nouvelle liste, entrée intacte ; mêmes objets échangés |
| `admin-ordered-list.spec` — rendu | 3 lignes | `OL>LI`, gabarit par ligne avec son rang ; pas de « Monter » en tête ni de « Descendre » en fin ; noms des actions ; boutons `type="button"` ; ajout nommé et disponible ; région `status` vide |
| `admin-ordered-list.spec` — `it.each` déplacer | 2ᵉ et 3ᵉ montés, 1ʳᵉ et 2ᵉ descendues | modèle et champs dans le nouvel ordre, focus (`Descendre la ligne 1`, `Monter la ligne 2`, `Descendre la ligne 2`, `Monter la ligne 3`), annonce « Ligne déplacée en position N » |
| `admin-ordered-list.spec` — ajouter | 2 lignes ; maximum ; maximum − 1 | ligne `create()` en fin, focus sur son champ, annonce ; `aria-disabled`, rien d'ajouté ; ajout puis indisponible |
| `admin-ordered-list.spec` — `it.each` supprimer | 2ᵉ de 3, dernière, seule | modèle, focus sur « Supprimer la ligne 2 » ou l'ajout, annonce « Ligne supprimée » |
| `admin-profile-form.spec` — `it.each` listes | paragraphes, traits, activités | lignes dans leur section, actions de la 1ʳᵉ ligne, libellé d'ajout |
| `admin-profile-form.spec` — valeurs | contenu témoin | valeurs et libellés numérotés des champs de ligne |
| `admin-profile-form.spec` — réordonner, ajouter | 2ᵉ paragraphe monté ; trait ajouté et rempli ; activité ajoutée vide | contenu émis dans le nouvel ordre ; trait en fin avec l'id tiré ; rien d'émis, deux erreurs requises |
| `admin-profile-form.spec` — `it.each` vidée, bornes, blancs, maximum | chaque liste vidée ; borne + 1 ; blancs seuls ; liste pleine | erreur de liste ; message de borne ; requis ; ajout `aria-disabled` |
| `admin-profile.spec` — réordonner | 2 traits, le 2ᵉ monté ; puis enregistré | 1 modification, section 02 marquée ; `saveProfile` reçoit les ids inversés en version 7, compte à zéro |

`admin-project-gallery.spec` n'est pas touché et reste vert. `move-gallery-image.spec.ts` est
conservé jusqu'au GREEN : il part avec `move-gallery-image.ts` quand la galerie passe à `moveItem`
(ses cas sont repris par `move-item.spec`). La suppression n'a pas pu être faite en RED (permission
refusée).

RED confirmé via la commande test du profil (`pnpm test`, après `ng cache clean` et purge de
`node_modules/.vite`) le 2026-10-11 12:30, 41 failed / 3866 total, `exit=1`. Les 41 échecs sont tous
des assertions, dans 4 fichiers : `admin-ordered-list.spec` 13/13, nouveaux tests
d'`admin-profile-form.spec` 21/21, `admin-profile.spec` 2/2, `move-item.spec` 5/14. Les 9 autres
tests de `move-item.spec` (bords, vide, seul, gel) sont verts par construction de la signature
`[...items]` prescrite, et restent la triangulation des échanges. Aucune erreur de type, de harnais ni
de rejet non géré ; les 3816 tests de F1, F2 et de l'existant restent verts.

Preuve runtime attendue (GREEN / Verify) : API locale (ou doublure avec `STUB_ADMIN_SESSION=1`) et
`pnpm start` : sur `/admin/profile`, au clavier seul, monter puis descendre un trait (focus reste sur
la ligne déplacée, annonce lue par le lecteur d'écran), ajouter un paragraphe (focus dans le champ
neuf), supprimer une activité (focus sur la suivante), enregistrer ⇒ `PUT` dans le nouvel ordre,
`/about` rechargée affiche cet ordre ; liste pleine ⇒ ajout indisponible annoncé ; AXE sans violation.

### Tranche F4 — stack et formations

Signature neutre : `TECHNOLOGY_ICONS` vide et `TechnologyIcon = string`
(`profile/domain/models/technology-icon.ts`).

Contrat fixé par les tests (choix `qa`) :
- Liste fermée : les 6 SVG servis sous `/icons/<nom>.svg` (`angular`, `docker`, `nestjs`,
  `postgresql`, `tailwindcss`, `typescript`, ordre alphabétique), chacun conforme au motif de l'API
  `^[a-z0-9-]{1,40}$`. Les icônes de techno sont des fichiers isolés de `public/icons/`, pas des
  symboles de `sprite.svg`.
- Ligne de techno : `admin-profile-technology-name` / `-category` / `-icon` (`<select>`, option vide
  désactivée puis la liste). Une icône stockée hors liste devient `''` dans le brouillon, donc requise.
- Formation : `-diploma-title` / `-provider` / `-level` / `-description` / `-skills` (une compétence
  par ligne). Libellés « Nom de la technologie N » … « Compétences de la formation N ».
- Bornes : 40/40, 120/80/80/600, compétence 80 (« Chaque compétence ne doit pas dépasser
  80\u00a0caractères »), 12 compétences (« 12 compétences au plus »), blancs seuls = requis.
- Listes vidées : « Ajoutez au moins une technologie. », « … une formation. ». Maximum 18/8.

| Test | Scénario | Assertions clés |
|---|---|---|
| `technology-icon.spec` | liste fermée | `toEqual` des 6 noms ; 6 vérifiés, aucun refusé par le motif de l'API |
| `profile-draft.spec` — `it.each` icône | `nestjs` ; `vue` | `nestjs` gardé ; `''` |
| `profile-draft.spec` — `it.each` compétences | `"a\n\n b \n"` ; `"\n\tRigueur\r\nMéthode  "` | `['a', 'b']` ; `['Rigueur', 'Méthode']` |
| `admin-profile-form.spec` — `it.each` listes | stack, formations | ligne dans `profile-work` / `profile-diplomas`, « Supprimer … 1 », libellé d'ajout |
| `admin-profile-form.spec` — valeurs, `select` | contenu témoin | valeurs et libellés des 8 champs, compétences sur deux lignes ; `SELECT`, options `['', ...TECHNOLOGY_ICONS]`, invite désactivée |
| `admin-profile-form.spec` — techno ajoutée | sans icône ; avec `docker` ; icône stockée `vue` | rien d'émis, icône requise ; techno en fin avec l'id tiré ; bloqué puis émis après choix de `typescript` |
| `admin-profile-form.spec` — compétences | lignes vides et espaces ; blancs seuls, 81 caractères, 13 lignes ; 12 × 80 | `['Rigueur', 'Méthode']` ; rien d'émis et message ; toutes envoyées |
| `admin-profile-form.spec` — `it.each` bornes, requis, vidée, maximum | 6 champs + 1 ; 6 champs blancs ; liste vidée ; liste pleine | message de borne ; requis ; erreur de liste ; ajout `aria-disabled` |

RED confirmé via la commande test du profil (`pnpm test`, après `ng cache clean` et purge de
`node_modules/.vite`) le 2026-10-11 12:31, 74 failed / 3900 total, `exit=1` (cumul F3 + F4). La part
de F4 est de 33 échecs sur ses 34 tests, tous des assertions : `admin-profile-form.spec` 28/28,
`technology-icon.spec` 2/2, `profile-draft.spec` 3/4 (le cas `nestjs` gardé est vert par
construction, c'est l'autre moitié de la paire avec `vue`). Les 41 échecs de F3 sont inchangés ;
aucune erreur de type, de harnais ni de rejet non géré ; F1, F2 et l'existant restent verts.

Preuve runtime attendue (GREEN / Verify) : sur `/admin/profile`, ajouter une techno, choisir son
icône dans la liste, retirer une compétence d'une formation (ligne supprimée du champ, lignes vides
ignorées), enregistrer ⇒ `PUT` avec la nouvelle techno (id UUID) et les compétences nettoyées ;
`/about` rechargée affiche l'icône `/icons/<nom>.svg` sans 404 ; techno sans icône ⇒ erreur,
aucun `PUT`.

### Tranche F5 — la typographie française est rétablie à l'enregistrement

Signature neutre : `toFrenchTypography(text)` identité (`shared/format/french-typography.ts`).
Contrôle éditorial extrait du spec pour être partagé : `src/app/testing/french-typography-violations.ts`
(`frenchTypographyViolations(text, path)`, règles et messages inchangés). `editorial-typography.spec`
l'importe ; refactor de test iso-invariant, aucune valeur attendue modifiée, reste vert.

Contrat fixé par les tests (choix `qa`, d'après D10 et le contrôle éditorial) :
- Une espace **déjà présente** (ordinaire, insécable, fine, tabulation, ou plusieurs) devient
  U+00A0 avant `:`, `%`, `€`, après `«` et avant `»`, et U+202F avant `;`, `?`, `!`.
- Aucune espace n'est ajoutée : `Prix: 890`, `12:30` et `https://x.fr/a?b=1` restent tels quels.
  La fonction est idempotente.
- `toProfileContent` l'applique à chaque texte du contenu, compétences comprises, après la coupe
  des bords. Les ids et l'icône ne sont pas touchés. Le brouillon et le champ gardent la saisie :
  la normalisation n'a lieu qu'à l'émission.

| Test | Scénario | Assertions clés |
|---|---|---|
| `french-typography.spec` — `it.each` règles | 12 cas (chaque signe, mauvaise espace, espaces multiples, tabulation, phrase complète) | sortie exacte en `\u00a0` / `\u202f` |
| `french-typography.spec` — `it.each` intacts | heure, lien, deux-points collé, phrase sans ponctuation haute, vide | inchangé |
| `french-typography.spec` — `it.each` idempotence | 3 textes fautifs | première passe sans violation au sens du contrôle éditorial, seconde passe identique |
| `french-typography.spec` — contrôle | texte à 8 violations | 8 avant, `[]` après |
| `profile-draft.spec` — tout le contenu | les 13 champs et chaque ligne saisis `Texte : « fin » ; vraiment ?` | `toEqual` du contenu normalisé, ids et `angular` intacts |
| `profile-draft.spec` — coupe puis typographie | `'  Prix : 890  '` | `'Prix\u00a0: 890'` |
| `admin-profile-form.spec` — pas pendant la saisie | titre `Prix : 890` saisi puis envoyé | brouillon et champ inchangés, contenu émis normalisé |

RED confirmé via la commande test du profil (`pnpm test`, après `ng cache clean` et purge de
`node_modules/.vite`) le 2026-10-11 13:04, 19 failed / 3911 total, `exit=1`. Les 19 échecs sont
tous des assertions : `french-typography.spec` 16/21, `profile-draft.spec` 2/2 nouveaux,
`admin-profile-form.spec` 1/1 nouveau. Les 5 cas « intact » sont verts par construction de la
signature identité, ce sont la contrepartie des règles. Aucune erreur de type ni de harnais ;
F1-F4, `editorial-typography.spec` et l'existant restent verts.

Preuve runtime attendue (GREEN / Verify) : sur `/admin/profile`, saisir `Mon parcours : « sur
mesure » !` dans un paragraphe ; le champ garde la saisie ; « Enregistrer » ⇒ le corps du `PUT`
porte `\u00a0:`, `«\u00a0`, `\u00a0»`, `\u202f!` ; recharger `/admin/profile` ⇒ le champ
affiche le texte normalisé, compte à zéro ; `/about` rechargée ⇒ aucune violation au contrôle
éditorial sur le texte rendu.

### Tranche F6 — avertissement de formulation, non bloquant

Signatures neutres : `FORBIDDEN_WORDINGS` vide (`shared/identity/forbidden-wordings.ts`, type
`{ label, pattern }`), `profileWordingWarnings(draft)` rendant `[]` (type `WordingWarning =
{ fieldId, fieldLabel, wording }`), `AdminWordingNotice` (entrée `warnings`) à gabarit vide.

Contrat fixé par les tests (choix `qa`) :
- Libellés dans l'ordre : `20 ans`, `vingt ans`, `métallurgie`. Insensibles à la casse et au
  type d'espace (ordinaire, U+00A0, U+202F). Les accents sont ignorés pour « métallurgie »
  (ajout de l'orchestrateur, 2026-10-11 : `metallurgie`, `Métallurgie`, `METALLURGIE` détectés ;
  cas écrits dans `forbidden-wordings.spec` en GREEN, RED prouvé par assertion avant le motif
  `m[eé]tallurgie` : 2 failed / 14, « expected [] to deeply equal [ 'métallurgie' ] »).
- `fieldId` = id du champ dans la page (`profile-biography-summary`, `profile-paragraph-text-2`,
  `profile-diploma-skills-1`…). `fieldLabel` lève l'ambiguïté des champs simples (« Résumé du
  parcours », « Titre du parcours », « Description de la motivation »…) ; les lignes reprennent leur
  libellé numéroté. Ordre : champs du brouillon, puis ordre de la liste.
- Bloc `admin-wording-notice` placé avant la barre d'enregistrement : titre « À relire avant de
  publier », items « «\u00a0{wording}\u00a0» dans {fieldLabel} », chaque item étant un lien vers
  le fragment du champ. Il n'est rendu que s'il y a des avertissements.
- **Pas de région live**, comme le prescrit le Plan (pas d'annonce à chaque frappe). C'est une
  divergence assumée avec « annoncé » de la demande : le bloc est lu au parcours, et le lien mène
  au champ. Il n'a aucun effet sur la validité ni sur l'envoi.

| Test | Scénario | Assertions clés |
|---|---|---|
| `forbidden-wordings.spec` | liste ; 7 textes détectés (dont `\u00a0`, `\u202f`, majuscules, deux formulations) ; « 2020 », « 20 années », « métal » | 3 libellés dans l'ordre ; formulations trouvées ; 3 formulations vérifiées, aucune trouvée |
| `editorial-identity.spec` | `FORBIDDEN_IDENTITIES` = `FORBIDDEN_WORDINGS` + 4 formulations d'identité | vert ; les motifs « métallurgie » et durée de carrière ne sont plus dupliqués |
| `profile-wording-warnings.spec` | témoin propre puis titre fautif ; résumé, paragraphe 2, description de trait, compétence, titre d'activité ; deux formulations dans un champ et une dans un autre | `[]` puis 1 ; un avertissement exact chacun ; ordre champ puis liste |
| `admin-wording-notice.spec` | 2 avertissements ; région live ; vide, un, vide | titre, items, ancres ; aucun `aria-live` / `role` live ; rendu seulement s'il y a des avertissements |
| `admin-profile.spec` | « métallurgie » dans le paragraphe 2 puis corrigé ; lien ; « Enregistrer » | bloc affiché puis retiré ; item, `href` `/admin/profile#profile-paragraph-text-2`, cible = le champ, bloc avant la barre ; `saveProfile` appelé avec le texte, toast de succès |

Transitoire du RED : avec la liste vide, `editorial-identity.spec` perd provisoirement ses deux
lignes « métallurgie » et durée de carrière (2 × 26 sources, d'où 3883 tests au lieu de 3911). Elles
reviennent à trois lignes dès que la liste est remplie en GREEN.

RED confirmé via la commande test du profil (`pnpm test`, après `ng cache clean` et purge de
`node_modules/.vite`) le 2026-10-11 13:06, 42 failed / 3883 total, `exit=1` (cumul F5 + F6). La part
de F6 est de 23 échecs sur ses 24 tests, tous des assertions : `forbidden-wordings.spec` 11/11,
`profile-wording-warnings.spec` 7/7, `admin-wording-notice.spec` 3/3, `admin-profile.spec` 2/3. Le
test « enregistrement malgré l'avertissement » est vert par construction : c'est l'invariant non
bloquant, à garder vert. Aucune erreur de type ni de harnais ; F1-F4 restent verts.

Preuve runtime attendue (GREEN / Verify) : sur `/admin/profile`, saisir « métallurgie » dans un
paragraphe puis « Vingt ans » dans un titre ⇒ bloc « À relire avant de publier » avec deux items ;
le lien mène au champ (focus ou défilement) ; « Enregistrer » ⇒ `PUT` envoyé, toast de succès ;
corriger les deux ⇒ bloc retiré ; lecteur d'écran : aucune annonce à la frappe ; AXE sans violation
avec le bloc affiché.

### Tranche F7 — le portrait se remplace depuis l'admin

Signatures neutres :
- Le port reçoit `uploadPortrait(file): Observable<ProfileDocument>` et
  `removePortrait(): Observable<void>`. `HttpProfileGateway` y répond `EMPTY` ; le stub renvoie
  `aProfileDocument()` et `undefined`.
- `AdminProfilePortrait` : entrées `portraitUrl: string | null` et `busy`, sorties
  `portraitSelected: File`, `portraitRejected` et `removeConfirmed`, gabarit vide.

Contrat fixé par les tests (choix `qa`, aligné sur la galerie, la couverture et le CV). Le Plan
technique est corrigé : les « En ligne dans quelques minutes » sont caducs depuis la spec 022.
- **Vignette** : `admin-profile-portrait-current`, image `src` = URL du document, sinon
  `/avatar.avif`. Alt fixe « Portrait de Julien Nédellec ». Sans portrait, mention
  `admin-profile-portrait-default` « Portrait par défaut ».
- **Dépôt** : zone `admin-profile-portrait-dropzone`, `accept="image/avif,image/webp,image/png,
  image/jpeg"`, aide « AVIF, WebP, PNG ou JPEG, 5 Mo au plus » (comme la galerie).
  - Un fichier accepté est envoyé dès le dépôt.
  - Un autre type est refusé côté front ; la taille est contrôlée par l'API (422).
  - Pendant l'envoi, `admin-profile-portrait-busy` `role="status"` « Envoi du portrait… », et le
    retour au défaut est désactivé.
- **Retour au défaut** : bouton `admin-profile-portrait-remove` « Revenir au portrait par défaut »,
  présent seulement avec un portrait. Il ouvre un `ConfirmDialog` interne à la section : titre
  « Revenir au portrait par défaut\u202f? », confirmation au même libellé.
- **Section page** : `fieldset#profile-portrait` « 06 · Portrait », placée après le formulaire,
  hors de lui, avant la barre d'enregistrement. Elle entre au sommaire et n'est jamais marquée.
  Description : « Envoyé dès le dépôt, sans passer par l'enregistrement. Visible sur le site au plus
  une seconde après l'envoi, au rechargement de la page. »
- **Toasts** : « Portrait remplacé », « Portrait par défaut rétabli », « Seules les images AVIF,
  WebP, PNG ou JPEG sont acceptées. ». Échecs : « Le portrait n'a pas pu être remplacé. » (plus
  `Détail\u00a0: …` sur 422) et « Le portrait par défaut n'a pas pu être rétabli. ». Un 503
  (verrou) ajoute « Réessayez dans quelques secondes. ». Le brouillon de texte et la version ne
  bougent pas.

| Test | Scénario | Assertions clés |
|---|---|---|
| `http-profile.gateway.spec` — envoi | `uploadPortrait(png)` | un `POST …/profile/portrait`, `FormData` champ `file` = le fichier, silencieux, document adapté (portrait en `/api/storage/…`) |
| `http-profile.gateway.spec` — retrait | `removePortrait()` sur 204 | un `DELETE` silencieux, `next` puis `complete` |
| `http-profile.gateway.spec` — `it.each` refus | envoi 422, 503 ; retrait 503 | l'erreur atteint l'abonné avec son statut |
| `admin-profile-portrait.spec` — vignette | `null` ; URL ; `null` puis URL | `/avatar.avif` + mention, pas de retour ; URL + bouton ; la vignette suit |
| `admin-profile-portrait.spec` — dépôt | zone ; `it.each` 4 types acceptés ; GIF, PDF ; `busy` | `accept` et aide ; fichier émis ; refus émis, rien de sélectionné ; statut, retour désactivé |
| `admin-profile-portrait.spec` — retour | bouton ; oui / non | dialogue ouvert, rien d'émis ; retrait émis 1 / 0 fois, dialogue fermé |
| `admin-profile.spec` — section | rendu | titre, description, hors formulaire, après lui, avant la barre |
| `admin-profile.spec` — `it.each` vignette | sans / avec portrait | `src`, mention, bouton de retour |
| `admin-profile.spec` — dépôt | titre modifié puis dépôt ; dépôt puis enregistrement ; `NEVER` ; GIF | `uploadPortrait(png)`, aucun `saveProfile`, vignette = URL renvoyée, toast, saisie et compte (1, section 01) intacts ; `saveProfile` en version 7, compte à zéro ; statut d'envoi ; rien d'envoyé, toast de type |
| `admin-profile.spec` — `it.each` échec d'envoi | 422 avec motif, 503, 500 | toast exact, vignette inchangée |
| `admin-profile.spec` — retour | confirmé ; refusé ; `it.each` 503, 500 | `removePortrait` une fois, `/avatar.avif`, mention, toast, compte nul ; rien de retiré ; toast exact, portrait gardé |

Ré-alignement de contrat : le sommaire compte désormais 6 sections. Dans `admin-profile.spec`, le
test du sommaire et les 6 tableaux d'états hérités de F2/F3 sont recalibrés avec une 6ᵉ entrée
vide. Aucun autre spec ne lit ce sommaire.

RED confirmé via la commande test du profil (`pnpm test`, après `ng cache clean` et purge de
`node_modules/.vite`) le 2026-10-11 13:27, 40 failed / 3997 total, `exit=1`. Les 40 échecs sont tous
des assertions :
- `admin-profile-portrait.spec` 14/14 ;
- `http-profile.gateway.spec` 5/5 nouveaux (dont 4 `expectOne` « found none ») ;
- `admin-profile.spec` 14/14 nouveaux, plus les 7 tests recalibrés du sommaire.

Aucune erreur de type, de harnais ni de rejet non géré. Les 3957 autres tests (F1-F6 et
l'existant) restent verts. `pnpm lint` passe, exit 0.

Preuve runtime attendue (GREEN / Verify) : API locale + MinIO (ou doublure étendue d'un `POST` et
d'un `DELETE /api/profile/portrait`) et `pnpm start`. Sur `/admin/profile`, section « 06 ·
Portrait » :
- Déposer un JPEG ⇒ un `POST` multipart, vignette = `/api/storage/…/portrait-<sha8>.avif`, toast
  « Portrait remplacé », compte inchangé. `/about` rechargée affiche ce portrait (préchargé, même
  origine).
- Déposer un GIF ⇒ toast de type, aucun `POST`.
- Déposer un fichier de 6 Mo ⇒ 422 avec détail.
- « Revenir au portrait par défaut » ⇒ dialogue ; confirmer ⇒ `DELETE` 204, vignette
  `/avatar.avif`, `/about` rechargée sur `/avatar.avif`.
- Contrôles d'ensemble : clavier seul (dépôt par le bouton de la zone, dialogue, focus rendu),
  AXE sans violation.

## Journal des tranches

- **Tranche F1 — `/about` lit le document de l'API** : GREEN 3695 passed / 3696 total (1 rouge
  hors implémentation, cf. Verify F1 « Écart ») · refactor : aucun (passe manuelle sur le diff :
  ni nom cryptique, ni wrapper, ni dérivation à extraire ; `simplify` non invocable en sous-agent).
  Fichiers : port réduit à `getProfile` ; `HttpProfileGateway extends ProfileGateway` (sans
  `retry` : un échec atteint la page, qui répond 503 au rendu serveur) ; `toProfileDocument`
  (copie des 8 sections, `portrait` ⇒ `STORAGE_BASE_PATH` + chemin, `null` conservé) ;
  `ABOUT_IDENTITY` + `DEFAULT_PORTRAIT_URL` ; `About` en une lecture (`rxResource` sur
  `getProfile`, identité de page, `SITE_IDENTITY.journey` en `lead`, résumés en `input`) ;
  `Biography` sans `id`/`lead`, `Motivation` sans `id` ; `WORK_SUMMARY`/`DIPLOMA_SUMMARY`
  supprimés ; `app.config.ts` (`HttpProfileGateway`, `'/profile'` dans `PUBLIC_READ_PATHS`) ;
  `profile.static-data.ts` et `in-memory-profile.gateway.ts` supprimés ;
  `ci/api-stub/fixtures/profile.json` ajoutée à `EDITORIAL_SOURCES` (import JSON, aucun test
  ajouté : les `it.each(EDITORIAL_SOURCES)` existants la couvrent).
- **Tranche F1 — suites de la revue (R1, M1-M4)** : RED 9 failed / 3701 · GREEN 3701 passed /
  3701 total · refactor : aucun (M3 est lui-même la reprise de l'adapter, demandée par la revue).
- **Tranche F2 — l'admin édite et publie les textes du parcours** : GREEN 3816 passed / 3816 total
  (les 123 RED au vert, aucun spec modifié) · refactor : aucun (passe manuelle sur le diff,
  `simplify` non invocable en sous-agent : les huit champs texte passent dès le premier jet par
  `AdminProfileTextField`, les sections par les composants de champs du plan ; ni nom cryptique, ni
  wrapper, ni dérivation dans un composant). Fichiers : `PROFILE_LIMITS` (copie de l'API) ;
  `HttpProfileGateway.saveProfile` (`PUT ${API_BASE_URL}/profile`, contenu + `version`,
  `silentErrors()`, réponse adaptée par `toProfileDocument`) ; `DocumentDraft` (brouillon et ligne de
  base en `linkedSignal`, compte et sommaire en `computed`, envoi réussi ⇒ les deux repartent du
  document renvoyé) ; `toProfileDraft` / `toProfileContent` (copie champ par champ, bords coupés,
  compétences une par ligne) ; `AdminProfileForm` (schéma `apply(…, profileText(borne, sujet))` :
  blancs seuls = vide, borne comptée sur le texte coupé) et ses composants
  `admin-profile-{text,biography,work,diplomas,motivation}-fields` (traits en F3) ; page
  `AdminProfile` ; route `profile` gardée, `about` ⇒ `profile` ; « Parcours » dans la navigation ;
  `AdminEditorCopy.testIdPrefix` += `'admin-profile'` ; `DESIGN.md` (navigation, « Éditeur de
  parcours ») ; doublure `ci/api-stub/server.mjs` (`PUT /api/profile` en mémoire, `/auth/me` sous
  `STUB_ADMIN_SESSION=1`).
- **Tranches F3 et F4 — listes ordonnables, stack et formations** : GREEN 3885 passed / 3887 total,
  2 rouges **hors implémentation** (harnais `chooseInRow` d'`admin-profile-form.spec`, cf. Verify
  F3/F4 « STOP ») · refactor : aucun (passe manuelle, `simplify` non invocable en sous-agent ;
  formatage Prettier appliqué). Fichiers : `moveItem` (`shared/collections/`) ; galerie projets
  rebranchée, `move-gallery-image.ts` et son spec supprimés (`git rm`) ; `AdminOrderedList`
  (`ol`, actions, ajout `aria-disabled`, région `status`, focus en `afterNextRender` phase `write`,
  erreur de liste) ; `AdminProfileTextField` += `rank` et `hint` ; composants de champs
  `-traits-` (nouveau), `-biography-`, `-work-`, `-diplomas-` étendus ; schéma : `applyEach` des
  cinq listes, `atLeastOne`, icône `required`, `skillList` ; `TECHNOLOGY_ICONS` (6 fichiers),
  `isTechnologyIcon` ; `toProfileDraft` (icône hors liste ⇒ `''`), `toSkills` (lignes vides
  écartées) ; `DESIGN.md` (« Listes ordonnables »).
- **Tranches F5 et F6 — typographie à l'émission, formulations à relire** : GREEN 3964 passed /
  3964 total (dont 3 cas d'accents ajoutés, RED prouvé) · refactor : aucun (passe manuelle,
  `simplify` non invocable en sous-agent ; Prettier appliqué). Fichiers : `toFrenchTypography`
  (espaces horizontales existantes seulement, trois règles, idempotente) ; `toProfileContent`
  applique `prose` = coupe puis typographie à chaque texte, compétences comprises ;
  `FORBIDDEN_WORDINGS` (`20 ans` sans chiffre devant, `vingt ans`, `m[eé]tallurgie`, insensibles à
  la casse et au type d'espace) ; presenter `profileWordingWarnings` (champs dans l'ordre du
  brouillon, puis des listes) ; `AdminWordingNotice` (`section` titrée, liens `routerLink="."
  [fragment]` qui donnent aussi le focus au champ, aucune région live) placé avant la barre.
  `editorial-identity.spec` : trois lignes de formulation × 26 sources (186 tests).
- **Tranche F7 — le portrait se remplace depuis l'admin** : GREEN 3997 passed / 3997 total ·
  refactor : retour au défaut rendu à la demande (un seul dialogue de confirmation dans la page) et
  bouton de retour déplacé sous la zone de dépôt (libellé replié sur trois lignes dans la colonne de
  la vignette) ; Prettier appliqué ; `simplify` non invocable en sous-agent. Fichiers :
  `HttpProfileGateway.uploadPortrait` (`POST …/profile/portrait`, `FormData` champ `file`,
  `silentErrors()`, `toProfileDocument`) et `removePortrait` (`DELETE`, `void`) ;
  `AdminProfilePortrait` (vignette `NgOptimizedImage` `fill` 4:5 sans `priority`, mention par
  défaut, `FileDropzone` remise à zéro après chaque dépôt, refus de type, statut `role="status"`,
  `ConfirmDialog` à la demande, focus relayé vers la zone de dépôt après un retrait réussi) ; page :
  `fieldset#profile-portrait` après le formulaire, `portraitUrl` en `linkedSignal` hors brouillon,
  toasts du plan, 503 ⇒ « Réessayez dans quelques secondes. » ; sommaire à 6 entrées ; doublure :
  `POST`/`DELETE /api/profile/portrait`, fichier reçu servi sous une clé neuve ; `DESIGN.md`.

## Verify (F1)

Gates (2026-10-11, codes de sortie lus) :

| Commande | Résultat |
|---|---|
| `pnpm install --frozen-lockfile` | « Done », exit 0 |
| `pnpm test; echo exit=$?` | 217 fichiers, **3695 passed / 3696**, exit=1 (le seul rouge : cf. Écart) |
| `pnpm lint` | « All files pass linting. » |
| `pnpm run format:check` | conforme |
| `pnpm run build --configuration production` | exit 0, 8 routes prérendues, CSP durcie sur 9 pages |
| `docker build -t ng-portfolio-app:local .` | exit 0 |
| Smoke CI rejouée (script extrait de `ci.yml`, port 3300, image locale) | exit 0 (dont `/about` : `about-lead`, `journey-paragraph`, `"leadEmphasis"` dans l'état de transfert) |

Garde-fous éditoriaux sur la fixture : fixture modifiée temporairement (« vingt ans de
métallurgie : » dans un trait) ⇒ `editorial-identity.spec` et `editorial-typography.spec` rouges
sur `ci/api-stub/fixtures/profile.json` (3 échecs : métallurgie, durée de carrière, espace avant
« : ») ; fixture restaurée (`cmp` identique).

Preuve runtime — **PASS** (doublure `node:22-alpine` + conteneur `ng-portfolio-app:local`,
réseau `portfolio-ci`, `-p 3300:3000`, `API_UPSTREAM=http://api-stub:3000`, copie de
`ci/api-stub` dans le scratchpad) :

1. **Fixture = production** : `GET https://api.nedellec-julien.fr/api/profile` (lecture seule)
   comparé à `ci/api-stub/fixtures/profile.json` ⇒ égalité JSON `True`.
2. **Aucune différence visible** : texte visible de `GET https://nedellec-julien.fr/about`
   (prod, `X-Cache-Status: EXPIRED`) et de `GET http://127.0.0.1:3300/about` (balises,
   `script`/`style` retirés, espaces normalisées) ⇒ seul écart : les deux liens « Télécharger mon
   CV (PDF) », absents en local parce que `fixtures/cv.json` vaut `null`. Avec la réponse prod de
   `GET /api/cv` dans la copie de la doublure ⇒ **identique**. Portrait : même
   `<link rel="preload" href="/avatar.avif" fetchpriority="high">` et même `<img … priority
   alt="Portrait de Julien Nédellec" src="/avatar.avif">` des deux côtés.
3. **Instantané** : premier paragraphe modifié dans la copie de la fixture, sans redémarrage,
   `/about` rechargée après 1,5 s ⇒ nouveau texte présent (HTML + état de transfert,
   `X-Cache-Status: EXPIRED`) ; fixture restaurée ⇒ texte d'origine au rechargement suivant.
4. **Navigateur** (`http://127.0.0.1:3300/about`) : requêtes `/api/` au chargement =
   `GET /api/config` (404, la doublure n'a pas cette route : sans lien avec F1) et
   `POST /api/analytics/track` ; **aucun `GET /api/profile`**. Console : aucune violation CSP
   (seule erreur : la 404 de `/api/config`).
5. **Hydratation** : marqueur posé sur `window`, clic réel sur « Voir les projets » (section
   motivation, `@defer (hydrate on viewport)`) ⇒ `/projects`, h1 « Réalisations », marqueur
   conservé, une seule navigation document (`/about`) : navigation client, page hydratée.
6. **Panne d'API** : doublure arrêtée ⇒ `/about` 200 `X-Cache-Status: STALE` avec le parcours ;
   conteneur relancé (cache vide), doublure absente ⇒ `/about` **503** (`MISS`), jamais une page
   vide en 200.

Capture : premier écran de `/about` servi par le conteneur local (nom, accroche
`SITE_IDENTITY.journey` + suite du document, réseaux, lien CV, portrait par défaut) —
`~/.claude/projects/-home-j-ned-Projects-Portfolio-ng-portfolio-app/d6e00462-295b-4b2c-ad3e-98224ecb112d/tool-results/mcp-Claude_Browser-blob-1791710029332-40j12i.jpg`.

Nettoyage : conteneurs `api-stub`/`portfolio` arrêtés, réseau `portfolio-ci` supprimé, image
`ng-portfolio-app:local` supprimée. Aucune requête non-GET vers la production.

**Écart initial (résolu)** : le test « rôle, stack et ville » lisait le `textContent` du `<p>` (blancs
entre `span` retirés par Angular) ; recalibré par `qa` (un texte par `span`), puis sélecteur passé
en `data-testid="about-hero-fact"` (M4 ci-dessous).

### Suites de la revue (F1) — R1, M1-M4

TDD : RED prouvé (`ng cache clean` puis `pnpm test`, exit=1, **9 en échec / 3701**, tous des
assertions : `expected 200 to be 503` ×2 pour `/about` en 404/503, `injectMarkUnavailable` 200 ≠
503, et 6 lectures `undefined`/`[]` des nouveaux `data-testid` ; aucune erreur de type ni de
harnais), signature `injectMarkUnavailable` posée d'abord en no-op. GREEN : 3701 / 3701, exit=0.

- **R1** : `injectMarkUnavailable()` (`core/ssr/response-status.ts`, jumeau de
  `injectMarkNotFound`) ; `About` le déclenche sur toute erreur de `getProfile()` (`tap({ error })`
  dans le flux du `rxResource`) ⇒ au rendu serveur, `/about` répond 503 quel que soit le statut
  amont, 404 compris ; dans le navigateur, sans effet. L'intercepteur est inchangé : les 404 de slug
  projet/article restent des 404. Tests : `response-status.spec` (503 au serveur, no-op au
  navigateur) ; `about.spec` (`it.each` 404/503 ⇒ `RESPONSE_INIT.status` 503 ; lecture réussie ⇒
  200).
- **M1** : `stubProfileGateway` instancie une sous-classe de `ProfileGateway` (plus de cast) : une
  méthode abstraite ajoutée au port sans implémentation dans le stub ne compile plus.
- **M2** : `.claude/project-profile.md` (statut des in-memory) : seul `InMemoryHomeGateway` reste
  câblé ; Profile lit l'API.
- **M3** : `ProfileDto` décrit la forme API sans dépendre du domaine ; `toProfileDocument` recopie
  chaque section champ par champ (listes recopiées).
- **M4** : `data-testid` `split-section-summary` (`SplitSection`, `shared/ui`, attribut statique,
  autres usages inchangés), `about-hero-fact`, `about-diploma-provider`, `about-diploma-level` ;
  `about.spec`, `about-diploma.spec`, `about-what-i-do.spec` repointés, valeurs attendues
  inchangées.

Gates (2026-10-11) : `pnpm install --frozen-lockfile` exit 0 ; `pnpm test; echo exit=$?` 217
fichiers, **3701 passed / 3701**, exit=0 ; `pnpm lint` « All files pass linting. » ;
`pnpm run format:check` conforme ; `pnpm run build --configuration production` exit 0 ;
`docker build` exit 0 ; smoke CI rejouée exit 0.

Preuve runtime R1 — **PASS** (copie de la doublure dont `/api/profile` répond 404 tant qu'un
fichier `profile-404` existe, bascule sans redémarrage) :

1. Conteneur à froid, profil en 404 ⇒ `/about` **503** `X-Cache-Status: MISS`, second appel
   (1,2 s plus tard) encore **503 MISS** : rien n'est mis en cache.
2. `/projects/inexistant` et `/blog/inexistant` ⇒ **404** (inchangé).
3. Profil rétabli ⇒ `/about` 200 `MISS` ; profil de nouveau en 404 ⇒ `/about` **200 `STALE`**, la
   copie porte les 3 paragraphes du parcours.
4. Texte visible de `/about` (doublure avec le `cv.json` de prod) toujours **identique** à
   `GET https://nedellec-julien.fr/about` après l'ajout des `data-testid`.

Nettoyage : conteneurs et réseau supprimés, image `ng-portfolio-app:local` supprimée. Aucune
requête non-GET vers la production.

## Verify (F2)

Gates (2026-10-11, codes de sortie lus) : `pnpm install --frozen-lockfile` ⇒ 0 ;
`pnpm test` (après `ng cache clean` et purge de `node_modules/.vite`) ⇒ 222 fichiers, 3816 passed /
3816, `exit=0` ; `pnpm lint` ⇒ 0, « All files pass linting » ; `pnpm run build --configuration
production` ⇒ 0 (CSP durcie sur 9 pages) ; `docker build` ⇒ 0. Smoke CI (bloc « Smoke test the
image » de `ci.yml` rejoué tel quel sur l'image locale, doublure comprise) ⇒ `smoke=0`. Aucune
U+00A0/U+202F littérale dans les fichiers touchés.

Preuve runtime, **PASS** — `pnpm start` (proxy de dev vers la doublure `STUB_ADMIN_SESSION=1 node
ci/api-stub/server.mjs`, port 3000), session ouverte par l'indice `auth:session` posé dans le
navigateur (aucun mot de passe), interaction réelle (clics, frappe clavier, Entrée) dans le
navigateur intégré :

1. `/admin/about` ⇒ `/admin/profile`, titre d'onglet « Parcours | Admin » ; formulaire rempli depuis
   `GET /api/profile`, « Aucune modification », phrase d'identité en texte avec sa mention, un seul
   `h1`, un seul `main`.
2. Second onglet ouvert sur `/admin/profile` (version 1).
3. Premier onglet : « Suite de l'accroche » + « Preuve locale F2. » ⇒ « 1 modification non
   enregistrée », section 01 marquée ; « Enregistrer » ⇒ un `PUT /api/profile` 200 (version 1 ⇒ 2),
   toast « Succès · Parcours enregistré », « Aucune modification ».
4. `/about` rechargée ⇒ `about-lead` finit par « Preuve locale F2. », sans build.
5. Second onglet (resté en version 1) : titre modifié, Entrée ⇒ `PUT` 409, toast « Le parcours a été
   modifié depuis une autre fenêtre. Rechargez la page… », saisie conservée, « 1 modification non
   enregistrée », bouton actif.
6. Titre vidé, Entrée ⇒ aucun `PUT` (journal réseau : un seul `PUT` par onglet), `aria-invalid="true"`,
   `aria-describedby="profile-biography-title-error"`, erreur `role="alert"` « Ce champ est
   obligatoire », focus sur le champ ; libellé « Titre obligatoire », `aria-required="true"`.
7. « Annuler » avec une modification ⇒ `dialog` « Quitter sans enregistrer ? Les modifications non
   enregistrées du parcours seront perdues. », focus sur « Continuer l'édition », adresse inchangée ;
   Entrée ⇒ dialogue fermé, saisie et compte conservés.

Rendu à la requête sur l'image (`docker run` + doublure sur un réseau dédié, `API_UPSTREAM`) : `PUT`
envoyé à la doublure ⇒ 200 version 2, même corps rejoué ⇒ 409 « version périmée » ; `curl /about`
servi par l'image ⇒ contient « Preuve conteneur F2. ». L'admin du conteneur n'a pas servi à la
preuve : son navigateur vise l'API publique (`PUBLIC_API_BASE_URL`), aucune écriture n'y est partie
(journal réseau : aucune requête vers `nedellec-julien.fr`).

Captures (scratchpad de session, `verify-f2/`) : `01-admin-profile-open.jpg`,
`02-edited-1-change.jpg`, `03-saved-toast.jpg`, `04-conflict-409.jpg`, `05-required-error.jpg`,
`06-leave-dialog.jpg`.

Console : aucune erreur de l'éditeur. Restent des bruits hors périmètre : 404 de la doublure sur
`/api/config`, `/api/blog/posts/admin`, `/api/contact/messages/unread-count` (comptes de la
navigation, non simulés), 409 attendu de l'étape 5, et `InvalidStateError: Transition was aborted`
(émise lors des navigations et redirections de chargement, non attribuée à l'éditeur ; non
investiguée, à confirmer sur `master`).

Nettoyage : conteneurs `api-stub-f2`/`portfolio-f2` arrêtés, réseau `portfolio-f2` supprimé, image
`ng-portfolio-app:f2` supprimée, cache de build Docker purgé ; serveur de dev et doublure arrêtés.

## Verify (F3/F4)

Gates (2026-10-11, codes de sortie lus) : `pnpm install --frozen-lockfile` ⇒ 0 ; `pnpm test`
(après `ng cache clean` et purge de `.vite`) ⇒ 3885 passed / 3887, **`exit=1`** (les 2 rouges
ci-dessous) ; `pnpm lint` ⇒ 0 ; `pnpm run build --configuration production` ⇒ 0 ; `docker build`
⇒ 0 ; smoke CI rejouée sur l'image locale ⇒ `smoke=0`. `admin-project-gallery.spec` vert, sans
modification ; `move-item.spec` vert. Aucune U+00A0/U+202F littérale dans les fichiers touchés.

**STOP — deux tests au harnais douteux** (`admin-profile-form.spec`, « docker icon » et « icon left
the closed list ») : `chooseInRow` pose `select.value` puis n'émet que `change` ; Signal Forms ne lit
une valeur de contrôle natif que sur `input` (`@angular/forms` `signals.mjs`, `listenToDom('input')`),
qu'un navigateur émet avant `change` sur un `select`. Sonde jetable (supprimée) : même `select`
`[formField]`, `change` seul ⇒ modèle inchangé, `input` ⇒ modèle à jour. En navigateur réel, le
choix d'icône fonctionne (étape 5 ci-dessous). Correction proposée au `qa` : émettre `input` puis
`change` dans `chooseInRow`, comme `typeIn`. Le code applicatif n'a pas été plié au harnais.

Preuve runtime, **PASS** — `pnpm start` + doublure (`STUB_ADMIN_SESSION=1`), indice de session posé
dans le navigateur, interaction réelle :

1. Souris : « Monter le trait 2 » ⇒ ordre Autonomie, Exigence, Vision ; focus sur « Descendre le
   trait 1 » ; annonce « Trait déplacé en position 1 » ; « 1 modification non enregistrée ».
2. Clavier seul : Entrée sur « Descendre le trait 1 » ⇒ focus « Descendre le trait 2 », annonce
   « … en position 2 » ; Maj+Tab, Entrée sur « Monter le trait 2 » ⇒ focus « Descendre le trait 1 »,
   `:focus-visible` vrai (anneau visible sur la capture).
3. « Supprimer l'activité 1 » ⇒ focus sur « Supprimer l'activité 1 » (ligne suivante remontée),
   annonce « Activité supprimée ».
4. « Ajouter un paragraphe » ⇒ focus dans `profile-paragraph-text-4`, annonce « Paragraphe ajouté en
   position 4 », texte saisi.
5. « Ajouter une technologie » ⇒ focus dans le nom, annonce « … en position 7 » ; nom, catégorie,
   icône `typescript` choisie dans le `select` ; première compétence de la formation 1 retirée.
6. « Enregistrer » ⇒ un `PUT` 200 (version 2) ; document de la doublure : traits dans le nouvel
   ordre, une activité, techno « Vitest » (id UUID, icône `typescript`) en fin, paragraphe ajouté,
   compétences sans la ligne retirée.
7. Traits portés à 6 ⇒ « Ajouter un trait » `aria-disabled="true"`, non `disabled`, clic sans effet ;
   Entrée avec les traits vides ⇒ erreurs `role="alert"` sous chaque champ, focus sur le premier
   invalide, **aucun `PUT`** (journal de la doublure : un seul `PUT` sur toute la session).
8. `/about` servie par l'**image** (`docker run`, `API_UPSTREAM` vers la doublure de l'hôte) : ordre
   des traits, activité restante, « Vitest », paragraphe ajouté présents dans le HTML rendu ; les six
   `/icons/<nom>.svg` en 200 `image/svg+xml`. Le rendu serveur de `ng serve` ne lit pas la doublure
   (il rend la version 1) : il ne sert pas de preuve pour `/about`.

Galerie projets : la doublure ne couvre pas ses écritures (`reorderGallery`) ; preuve **par les tests
seuls** (`admin-project-gallery.spec` inchangé et vert, `moveItem` reprend la sémantique de
`moveGalleryImage` : bords, hors bornes, nouvelle liste).

`InvalidStateError: Transition was aborted` : **déjà présente sur `master`** (`origin/master`
`3bf36af` servi depuis un worktree temporaire contre la même doublure : erreur au chargement de
`/admin/projects`). Non introduite par la branche, non corrigée ici.

Accessibilité : noms d'action, annonces, focus et `aria-disabled` vérifiés ci-dessus ; AXE non rejoué.

Captures (scratchpad, `verify-f34/`) : `01-trait-moved-mouse.jpg`, `02-trait-moved-keyboard-focus.jpg`,
`03-technology-added.jpg`, `04-saved.jpg`, `05-max-and-required.jpg`.

Console : aucune erreur de l'éditeur ; bruits connus (404 de la doublure sur les comptes de la
navigation et `/api/config`, transition de vue ci-dessus).

Nettoyage : conteneur `portfolio-f34` et image `ng-portfolio-app:f34` supprimés, conteneurs et réseau
de la smoke arrêtés/supprimés, worktree temporaire retiré ; aucun `docker builder prune`.

## Verify (F5/F6)

Gates (2026-10-11, codes de sortie lus) : `pnpm install --frozen-lockfile` ⇒ 0 ; `pnpm test`
(après `ng cache clean` et purge de `.vite`) ⇒ 228 fichiers, 3964 passed / 3964, `exit=0` ;
`pnpm run build --configuration production` ⇒ 0 ; `docker build` ⇒ 0 ; smoke CI rejouée sur
l'image locale ⇒ `smoke=0`. **`pnpm lint` ⇒ 1** : une seule erreur, dans un fichier de test du `qa`
(`admin-wording-notice.spec.ts:20`, `renderNotice` sans type de retour,
`explicit-function-return-type`) ; adaptation à faire par le `qa`, le code applicatif est propre.
Aucune U+00A0/U+202F littérale dans les fichiers touchés.

Accents : trois cas ajoutés à `forbidden-wordings.spec` (`metallurgie`, `Métallurgie`,
`METALLURGIE`) ; RED avec le motif `/métallurgie/iu` : 2 failed / 14, `AssertionError: expected []
to deeply equal [ 'métallurgie' ]` ; GREEN avec `/m[eé]tallurgie/iu` : 14 / 14.

Preuve runtime, **PASS** — `pnpm start` + doublure (`STUB_ADMIN_SESSION=1`), indice de session posé
dans le navigateur, interaction réelle :

1. « Issu de la metallurgie. » (sans accent) tapé au clavier à la fin du paragraphe 2 ⇒ bloc « À
   relire avant de publier », item « «&nbsp;métallurgie&nbsp;» dans Paragraphe 2 », `href`
   `/admin/profile#profile-paragraph-text-2`, placé avant la barre, aucun `aria-live` ni rôle live.
2. Clic sur le lien ⇒ adresse `#profile-paragraph-text-2`, focus sur `profile-paragraph-text-2`.
3. Titre saisi au clavier `Bonjour : « test » !` (espaces U+0020 seulement, vérifiées dans le
   champ) : le champ garde la saisie jusqu'à l'envoi.
4. « Enregistrer » malgré le bloc ⇒ un `PUT` 200 (version 2), toast « Parcours enregistré » ;
   titre stocké par la doublure : espaces U+00A0 avant `:`, U+0020 après (aucune espace ajoutée),
   U+00A0 après `«` et avant `»`, U+202F avant `!` ; le paragraphe 2 garde « metallurgie ».
5. Phrase retirée du paragraphe ⇒ bloc retiré.

Captures (scratchpad, `verify-f56/`) : `01-wording-notice.jpg`, `02-link-focuses-field.jpg`,
`03-title-typed-as-is.jpg`, `04-saved-despite-notice.jpg`.

Console : aucune erreur de l'éditeur ; bruits connus (404 de la doublure sur les comptes de la
navigation et `/api/config`, `InvalidStateError` de transition de vue présente sur `master`). AXE
non rejoué.

Nettoyage : image `ng-portfolio-app:f56`, conteneurs et réseau de la smoke supprimés ; serveur de
dev et doublure arrêtés.

## Verify (F7)

Gates (2026-10-11, codes de sortie lus) : `pnpm install --frozen-lockfile` ⇒ 0 ; `pnpm test`
(après `ng cache clean` et purge de `.vite`) ⇒ 229 fichiers, 3997 passed / 3997, `exit=0` ;
`pnpm lint` ⇒ 0 ; `pnpm run build --configuration production` ⇒ 0 ; `docker build` ⇒ 0 ; smoke CI
rejouée sur l'image locale ⇒ `smoke=0`. Aucune U+00A0/U+202F littérale dans les fichiers touchés.

Doublure : `POST /api/profile/portrait` lit la partie `file` du multipart (422 sans fichier), garde
l'octet exact et le sert sous `/api/storage/portfolio-storage/profile/portrait-stub<n>.avif` avec
son type ; `DELETE` ⇒ `portrait: null`, 204. Contrôle `curl` : `avatar.avif` envoyé puis relu à
l'identique (`cmp`), 9 575 octets, `image/avif`.

Preuve runtime, **PASS** — `pnpm start` + doublure (`STUB_ADMIN_SESSION=1`), indice de session posé
dans le navigateur. Les fichiers sont posés dans l'`input type="file"` de la zone par
`DataTransfer` puis `change` (le navigateur intégré n'a pas d'outil de sélection de fichier) ;
le reste au clic et au clavier.

1. Titre modifié au clavier ⇒ « 1 modification non enregistrée » ; section « 06 · Portrait » :
   vignette `/avatar.avif`, « Portrait par défaut ».
2. Dépôt d'une vraie image WebP (`public/demos/…-800.webp`, 27 046 octets) ⇒ toast « Portrait
   remplacé », vignette `/api/storage/…/portrait-stub1.avif` chargée (800 px de large), bouton
   « Revenir au portrait par défaut ». Second dépôt (`avatar.avif`) observé par `MutationObserver` :
   statut « Envoi du portrait… » puis vide.
3. Dépôt d'un PDF ⇒ toast « Seules les images AVIF, WebP, PNG ou JPEG sont acceptées. », aucun
   `POST`, vignette inchangée.
4. « Revenir au portrait par défaut » ⇒ dialogue (focus sur « Annuler ») ; confirmation ⇒ `DELETE`
   204, vignette `/avatar.avif`, mention, toast « Portrait par défaut rétabli », focus sur le bouton
   de la zone de dépôt.
5. Tout du long : titre saisi conservé, « 1 modification non enregistrée », section 01 seule
   marquée ; journal de la doublure : 4 `POST`, 2 `DELETE`, **0 `PUT`**.

`/about` rendue par l'**image** (doublure et image sur un réseau Docker dédié, `API_UPSTREAM`) :
portrait envoyé à la doublure ⇒ `<link rel="preload" fetchpriority="high"
href="/api/storage/portfolio-storage/profile/portrait-stub1.avif">` et `<img priority … src=
"/api/storage/…">` ; l'image passe par le relais nginx `/api/storage/` (200 `image/webp`, 27 046
octets, `X-Cache-Status: MISS`). Après `DELETE` ⇒ `src="/avatar.avif"`. (Sur le pont Docker par
défaut, le résolveur `127.0.0.11` du relais n'existe pas : 502, d'où le réseau dédié, comme en CI.)

Captures (scratchpad, `verify-f7/`) : `01-default-portrait.jpg`, `02-portrait-replaced.jpg`,
`03-confirm-dialog.jpg`, `04-default-restored.jpg`.

Console : aucune erreur de l'éditeur ; bruits connus (404 de la doublure sur les comptes de la
navigation et `/api/config`, transition de vue présente sur `master`). AXE non rejoué ; 422 de taille
(6 Mo) non rejoué : la doublure ne borne pas la taille (couvert par `admin-profile.spec`).

Nettoyage : image `ng-portfolio-app:f7`, conteneurs `portfolio-f7`/`api-stub-f7` et réseau
`portfolio-f7`, conteneurs et réseau de la smoke supprimés ; serveur de dev et doublure arrêtés.

## Review code (F2-F7)

> Seconde passe (2026-10-11), après `## Verify (suites de la revue F2-F7)`. La première passe était
> REJECTED sur B1 (listes recréées et focus perdu après enregistrement), avec M2-M6.

**Verdict** : APPROVED
**Gates CI locaux** : tests ✅ (`ng cache clean` + purge `.vite`, puis `pnpm test; echo exit=$?` ⇒ 229 fichiers, 4019/4019, exit=0) / lint ✅ (`pnpm lint` exit=0) / build ✅ (`pnpm run build --configuration production` exit=0) ; `pnpm install --frozen-lockfile` exit=0 ; `pnpm run format:check` exit=0 ; `docker build` exit=0
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main. Archéologie (motif du profil) : 0 hit ; U+00A0/U+202F littérales : 0 ; `innerHTML`/`fakeAsync`/snapshot/`.only` : 0 ; image sans `ci/api-stub` ni `STUB_ADMIN` (première passe, Dockerfile inchangé)
**Warnings de gate** : aucun (test, lint, build) ; runtime : aucun NG0956
**Rendu compilé** : N/A
**Preuve de verify runtime** : ✅ — rejouée (doublure `STUB_ADMIN_SESSION=1` + `pnpm start`, indice de session, aucun mot de passe, aucune écriture prod). Avant l'enregistrement : trait 3 monté, paragraphe, technologie et formation ajoutés. Entrée successivement depuis le titre du trait déplacé, le titre d'activité 1, le nom de la technologie ajoutée, l'intitulé de la formation ajoutée ; puis paragraphe ajouté remonté et enregistré au bouton. À chaque `PUT` 200 : les 49 à 58 contrôles du formulaire sont les mêmes nœuds, toujours connectés ; focus conservé sur le champ ; 0 NG0956 (`console.warn` intercepté et journal de la console). Charge utile : paragraphes en chaînes, ordre conservé, aucune clé `paragraph-…`. M2 : doublure arrêtée, retrait confirmé ⇒ échec, focus sur « Revenir au portrait par défaut ». M3 : annonces vidées après enregistrement. M5 : 0 `h2` dans le formulaire, 5 `ol` nommées. M6 : `Portrait.AVIF` sans type MIME ⇒ envoyé. « Réessayer » (profil en 500 puis rétabli) ⇒ focus sur le `h1` « Parcours ». AXE non exécutable (`axe-core` absent)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅

**Adaptation mécanique déclarée (5 littéraux de `ProfileDraft`)** : vérifiée. Seul `key` a été ajouté aux lignes de paragraphe (`profile-draft.spec.ts:24-25, 64, 121, 208`, `profile-wording-warnings.spec.ts:35-36`). Aucune autre valeur attendue n'a bougé. L'attendu `toEqual` de `toProfileDraft` est renforcé : il épingle désormais la clé.

**Tests notables** :
- ✨ `admin-profile.spec.ts` (`it.each` B1) : même nœud, focus et 0 NG0956 après envoi par Entrée. La régression est épinglée par le symptôme observable.
- ⚠️ `admin-profile.spec.ts` (B1) : les cas « après réordonnancement » et « après ajout de ligne » ne sont couverts qu'à l'exécution. Suivi possible : deux lignes de plus dans l'`it.each`.

**Points résiduels (mineurs, non bloquants)** :
1. `admin-ordered-list.ts:29`, `trackKey` optionnel : les 5 configurations le fournissent, donc la branche « sans clé » n'a aucun consommateur. Suivi possible : le rendre obligatoire.
2. `profile-draft.ts:40`, compteur `createdParagraphs` mutable au niveau du module (clés uniques, jamais envoyées) : acceptable, signalé au titre de l'immutabilité.
3. Commentaires sur deux lignes (`admin-ordered-list.ts:144-145`, `admin-profile-portrait.ts:104-105`, `profile-draft.ts:47-48`) : la politique demande une ligne.
4. Fichier sans type MIME : le navigateur l'envoie en `application/octet-stream` ; c'est l'API (`FileTypeValidator`) qui tranche. La décision est assumée dans le Verify.

**Risque résiduel** : réversibilité non renseignée au profil, monitoring Sentry ; aucun état persistant côté front. Non couvert : AXE sur `/admin/profile`, 422 de taille réel (la doublure ne borne pas la taille).

## Verify (suites de la revue F2-F7)

Corrections B1, M2-M6 en TDD. RED (`pnpm test; echo exit=$?`, 2026-10-11) : **17 failed / 4019,
`exit=1`**, toutes des assertions (B1 : `{ sameNode: false, focused: false, rebuilt: 5 }`, soit les
NG0956 ×5 de la revue reproduites ; « Réessayer » : `afterRetry: false` ; M3 : annonce restée ; M5 :
`{ name: '', headings: 3 }` ×5 ; M2 : `focused: false` ; M6 : 6 extensions refusées). Verts par
construction et gardés : focus sur la zone après un retrait réussi, refus de `.gif`/`.pdf`/sans
extension, charge utile sans clé de ligne. GREEN : **4019 / 4019, `exit=0`**.

- **B1** : `OrderedListConfig.trackKey` (`id` des traits, activités, technos, formations ; `key`
  de ligne pour les paragraphes, `paragraph-<n>` à la lecture, `paragraph-new-<n>` à l'ajout, jamais
  envoyé : `toProfileContent` ne copie que le texte). `toProfileDraft(content, previous)` reprend la
  clé de chaque position ; `DocumentDraft` passe le brouillon courant à `toDraft` après un envoi
  et dans ses `linkedSignal`. Après « Réessayer », focus sur le titre de la page.
  Adaptation mécanique de 5 littéraux de ligne de paragraphe (`key` ajouté) dans
  `profile-draft.spec.ts` et `profile-wording-warnings.spec.ts`, rendue nécessaire par le
  changement de type ; aucune valeur attendue d'un autre champ modifiée.
- **M2** : en cas d'échec du retrait, le focus revient au bouton « Revenir au portrait par défaut ».
- **M3** : la région `status` d'une liste se vide dès que la liste est écrite par autre chose
  qu'une de ses actions (saisie, document enregistré).
- **M4** : `ForbiddenWording` n'est plus exporté.
- **M5** : plus de `h2` dans le formulaire ; chaque `ol` est nommé (`aria-labelledby` vers un
  libellé `field-label` « Paragraphes », « Activités », « Stack technique » ; `aria-label`
  « Traits », « Formations », dont la `legend` porte déjà le titre visible).
- **M6** : un fichier sans type MIME passe sur l'extension (`.avif`, `.webp`, `.png`, `.jpg`,
  `.jpeg`, insensible à la casse) ; l'API reste juge.

Gates : `pnpm install --frozen-lockfile` ⇒ 0 ; `pnpm test` ⇒ 229 fichiers, 4019 / 4019, `exit=0` ;
`pnpm lint` ⇒ 0 ; `pnpm run format:check` ⇒ 0 ; `pnpm run build --configuration production` ⇒ 0 ;
`docker build` ⇒ 0 ; smoke CI rejouée ⇒ `smoke=0`. Aucune U+00A0/U+202F littérale ajoutée.

Preuve runtime, **PASS** (doublure `STUB_ADMIN_SESSION=1` + `pnpm start`, indice de session) :
- **B1** : « Nom de la technologie 1 » édité au clavier puis Entrée ⇒ `PUT` 200, toast « Parcours
  enregistré », « Aucune modification » ; le champ focalisé est le même nœud, toujours connecté et
  focalisé ; console : **aucune NG0956**.
- **M2** : portrait envoyé, puis doublure arrêtée ; « Revenir au portrait par défaut », Tab, Entrée
  sur la confirmation ⇒ toast « Le portrait par défaut n'a pas pu être rétabli. », vignette
  inchangée, focus sur `admin-profile-portrait-remove` (anneau visible sur la capture).

Captures (scratchpad, `verify-review/`) : `01-b1-focus-kept-after-save.jpg`,
`02-m2-focus-back-after-failure.jpg`.

Nettoyage : image `ng-portfolio-app:review-fix`, conteneurs et réseau de la smoke supprimés ;
serveur de dev et doublure arrêtés.

### Mineurs de la re-revue (APPROVED)

- `OrderedListConfig.trackKey` obligatoire, branche sans clé supprimée (`AdminOrderedList<T extends
  object>`) ; `admin-ordered-list.spec` reçoit `trackKey: (line) => line.text` (adaptation
  mécanique, textes uniques dans ses cas).
- Clé d'un nouveau paragraphe : `paragraph-<crypto.randomUUID()>`, plus de compteur de module ;
  toujours absente de la charge utile.
- Commentaires ramenés à une ligne (`admin-ordered-list.ts`, `admin-profile-portrait.ts`,
  `profile-draft.ts`).
- `admin-profile.spec` : l'`it.each` B1 couvre aussi « paragraphe remonté » et « paragraphe ajouté »
  (même nœud, focus conservé, aucune NG0956). Verts d'emblée, sans RED : ils confirment la
  correction B1 déjà en place.

Gates : `pnpm install --frozen-lockfile` ⇒ 0 ; `pnpm test` ⇒ 229 fichiers, 4021 / 4021, `exit=0` ;
`pnpm lint` ⇒ 0 ; `pnpm run format:check` ⇒ 0 ; `pnpm run build --configuration production` ⇒ 0.

## Journal des tranches (API)

> Historique tel qu'exécuté. **A1 et A4 ont ensuite été retirés** de la branche (amendement du
> 2026-10-10, spec 022) : les lignes A1/A4 et les mentions de rebuild ci-dessous (journal, Verify)
> décrivent un état qui ne sera pas livré ; les preuves à rejouer sont celles du Plan amendé.

Dépôt `nest-portfolio-app`, branche `feat/profile-content` (depuis `master` `19ba6dc`), non
commitée. Ligne de base : `pnpm test` 39 suites, 668 tests, code 0. RED montré par assertion
(`expect(...)` en échec, aucun module introuvable : signatures posées d'abord) ; deux erreurs de
harnais corrigées avant de compter le RED (`reflect-metadata` non chargé dans le spec du DTO ;
helper `patch()` du spec portrait qui lisait `[0][0]` d'un tableau vide).

| Tranche | RED (`pnpm test -- <fichiers>; echo exit=$?`) | GREEN | Refactor sous vert |
|---|---|---|---|
| A1 `SiteRebuild` | `site-rebuild.service.spec` + `blog.service.spec` : 8 en échec / 29 (`toHaveBeenCalledTimes` 1 reçu 0, `toHaveBeenCalledWith` du log), exit=1 | `SiteRebuild.trigger()` (reprise à l'identique de `triggerDeploy`), `SiteRebuildModule` ; `BlogService` l'injecte, méthode privée et `AppConfigService` retirés | provider `AppConfigService` retiré du spec blog ; cas « écriture en échec ⇒ pas de rebuild » et création publiée/brouillon ajoutés |
| A2 lecture + seed | `profile-seed.spec`, `profile.service.spec`, `profile.controller.spec` : 14 en échec / 15 (`toBeDefined`, `toMatch`, `toBe` sur les formulations, `rejects.toThrow`, throttle `undefined`), exit=1 | schéma `profile_content`, migrations `0020_profile_content` (générée) et `0021_profile_seed` (personnalisée), `PROFILE_SEED`, `ProfileService.findCurrent`, `GET /profile` | builder `aProfileContent()` sorti du spec (`profile-test-builders.ts`) |
| A3 `PUT` versionné | `update-profile.dto.spec` 160 en échec / 160 (124 `toContain`, 36 `toEqual`), `profile.service.spec` + `profile.controller.spec` 9 en échec / 15, exit=1 | DTO imbriqués + décorateurs `ProfileText` / `ProfileItemList` / `ProfileSection`, `PROFILE_LIMITS`, `replace` (égalité `isDeepStrictEqual`, `UPDATE … WHERE version`, 409, rebuild), `PUT /profile` | `toProfileContent` regroupé dans `profile-document.ts` ; types du spec DTO durcis (lint `no-unsafe-member-access`) |
| A4 projets publient | `projects.service.spec` + `project-images.service.spec` : 9 en échec / 228 (`toHaveBeenCalledTimes` 1 reçu 0), exit=1 | `trigger()` juste après chaque écriture réussie : création, mise à jour (avant le nettoyage S3), suppression, couverture, ajout / `alt` / retrait / ordre de capture | — |
| A5 portrait | `profile-portrait.service.spec`, `image-optimizer.service.spec`, `profile.service.spec`, `profile.controller.spec` : 32 en échec / 231, exit=1 | `ImageOptimizer.toPortrait` (640×800, `attention`), `ProfilePortraitService` (clés glissantes, écriture conditionnée, compensation, journalisation), `POST`/`DELETE /profile/portrait`, `portrait` dans la réponse | — |

Décisions prises en cours d'implémentation :

- **A5 modifiée (session principale)** : clé précédente gardée, avant-dernière supprimée (cf. Plan
  technique, ADR-0023 §7). Conséquences : colonne `previous_portrait_key` portée dès la migration
  0020 (une seule migration de schéma) ; écriture du portrait conditionnée aux **deux** clés lues
  (409 sinon) pour que la clé supprimée soit toujours la bonne ; même fichier que le portrait
  courant ⇒ ni envoi, ni écriture, ni rebuild.
- **Aucun HTML** (consigne) : refusé à la frontière par `ProfileText` (`<` suivi d'une lettre, `/`,
  `!` ou `?` ; « a < b » reste du texte) ; texte blanc refusé (`isNotBlank`, `IsNotEmpty` laissait
  passer « ␣␣␣ »).
- **Égalité** : comparaison structurelle (`jsonb` ne garde pas l'ordre des clés), sur un contenu
  recopié champ par champ (`toProfileContent`) : ni `version` ni instance de DTO dans le `jsonb`.
  Un document identique renvoie le document courant quelle que soit la version envoyée.
- **Seed** : JSON de la migration avec espaces insécables **littérales** (octets `c2 a0`, 6
  occurrences, vérifié par test et en base) ; `profile.seed.ts` écrit `\u00a0` (lisible, même
  valeur, égalité prouvée par `profile-seed.spec`). Aucune espace fine insécable (`\u202f`) dans le contenu
  actuel. La validité du seed au regard du DTO est testée en A3 (le DTO n'existe qu'en A3).
- **Réponse `POST /profile/portrait`** : 200 (`@HttpCode`), conforme au contrat (Nest répond 201 par
  défaut sur un `POST`).

Génération du seed (lancée depuis la racine du front, sortie collée telle quelle dans
`drizzle/0021_profile_seed.sql` ; `profile.seed.ts` = même JSON, espaces insécables échappées) :

```bash
pnpm exec tsx --tsconfig tsconfig.json generate-profile-seed.ts > profile-seed.json
```

```ts
// Génère le contenu initial du parcours (spec 021, A2) depuis les données statiques du front.
// Lancé depuis la racine du front : pnpm exec tsx --tsconfig tsconfig.json <ce fichier>
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  STATIC_BIOGRAPHY,
  STATIC_ABOUT_HIGHLIGHTS,
  STATIC_WHAT_I_DO,
  STATIC_TECHNOLOGIES,
  STATIC_DIPLOMAS,
  STATIC_MOTIVATION,
} from '/home/j-ned/Projects/Portfolio/ng-portfolio-app/src/app/features/profile/infra/data/profile.static-data';

const APP = resolve(process.cwd(), 'src/app/features/profile/application');

/** Lit la constante de résumé d'un composant (non exportée) : `const NAME = '…';`. */
function summaryConstant(file: string, name: string): string {
  const source = readFileSync(resolve(APP, file), 'utf8');
  const match = new RegExp(`const ${name} = '((?:[^'\\\\]|\\\\.)*)';`).exec(source);
  if (!match) throw new Error(`${name} introuvable dans ${file}`);
  return JSON.parse(`"${match[1].replace(/"/g, '\\"')}"`) as string;
}

const seed = {
  biography: {
    title: STATIC_BIOGRAPHY.title,
    summary: STATIC_BIOGRAPHY.summary,
    leadEmphasis: STATIC_BIOGRAPHY.leadEmphasis,
    paragraphs: [...STATIC_BIOGRAPHY.paragraphs],
  },
  highlights: STATIC_ABOUT_HIGHLIGHTS.map(({ id, title, description }) => ({ id, title, description })),
  workSummary: summaryConstant('about-what-i-do.ts', 'WORK_SUMMARY'),
  whatIDo: STATIC_WHAT_I_DO.map(({ id, title, description }) => ({ id, title, description })),
  technologies: STATIC_TECHNOLOGIES.map(({ id, name, category, icon }) => ({ id, name, category, icon })),
  diplomasSummary: summaryConstant('about-diploma.ts', 'DIPLOMA_SUMMARY'),
  diplomas: STATIC_DIPLOMAS.map(({ id, title, provider, level, shortDescription, skills }) => ({
    id,
    title,
    provider,
    level,
    shortDescription,
    skills: [...skills],
  })),
  motivation: {
    title: STATIC_MOTIVATION.title,
    statement: STATIC_MOTIVATION.statement,
    description: STATIC_MOTIVATION.description,
  },
};

console.log(JSON.stringify(seed, null, 2));
```

### 2026-10-10 — Revue indépendante : retrait des rebuilds, portrait sérialisé et borné

- **Rebuilds retirés** (décision utilisateur, spec 022) : `src/site-rebuild/` supprimé ; `src/blog` et `src/projects` identiques à master (`git diff master` vide). Le webhook Dokploy du blog reste en place jusqu'à la bascule du front. Le profil est lu à la requête et ne déclenche rien.
- **B1 fermé** (revue : la compensation après 409 pouvait supprimer la clé, adressée par contenu, que la ligne gagnante cite) : toute opération portrait tient le verrou de la ligne (`SELECT … FOR UPDATE`) ; raccourci « même fichier », envoi S3 et `UPDATE` sous ce verrou ; après le COMMIT, l'avant-dernière clé est supprimée dans une seconde transaction verrouillée, seulement si la ligne ne la cite plus. Plus de 409 sur le portrait. Un échec S3 du nettoyage est journalisé (`S3 orphan`), jamais de 500.
- **I1 fermé** (verrou non borné) : `SET LOCAL lock_timeout = '5s'` en tête de chaque transaction sur la ligne (portrait et PUT texte), dépassement = 503 « réessayez dans quelques secondes » ; client S3 borné (`S3_TIMEOUTS` : connexion 5 s, requête 30 s avec `throwOnRequestTimeout`, 30 s pour couvrir le CV de 10 Mo). La lecture publique n'attend jamais le verrou.
- **Mineurs** : raccourci « document identique » du PUT seulement à version égale (sinon 409) ; condition morte retirée ; U+00A0 littéraux de `profile-seed.spec.ts` échappés ; README recousu.
- **Preuves** : tests unitaires de sérialisation (journal ordonné des effets, cas concurrents, 503) ; test S3 contre un serveur muet ; intégration sur Postgres 17 jetable (`PROFILE_IT_DATABASE_URL`) 3/3, qui échoue sans `FOR UPDATE`, sans relecture sous verrou, ou avec l'envoi hors verrou (3/3). Relecture indépendante : APPROVED.
- **Gates** (relancés par l'orchestrateur, exit 0) : `pnpm test` (901 passent, 5 ignorés), `pnpm lint`, `pnpm build` ; par l'agent : `pnpm install --frozen-lockfile`, `pnpm db:generate` (« No schema changes »), `TZ=Pacific/Kiritimati`.

## Verify (API)

Gates (2026-10-10, codes de sortie lus) :

| Commande | Résultat |
|---|---|
| `pnpm install --frozen-lockfile` | « Already up to date », exit 0 (aucune dépendance ajoutée) |
| `pnpm test; echo exit=$?` | 45 suites, **911 tests** (668 → 911), exit=0 |
| `TZ=Pacific/Kiritimati pnpm test -- src/profile` | 216 tests, exit=0 |
| `pnpm lint` (avec `--fix`) | exit 0 ; relancé : diff et empreinte des fichiers neufs inchangés |
| `pnpm build` | exit 0 |
| `pnpm db:generate` | « No schema changes, nothing to migrate » |
| `tsc --noEmit` | aucune erreur dans les fichiers touchés (erreurs préexistantes dans 4 specs hors périmètre) |

Preuve locale (Postgres `postgres:17-alpine` sur `127.0.0.1:55499`, S3 Garage `dxflrs/garage:v2.1.0`
sur `127.0.0.1:9010` — l'image MinIO de `compose.yaml` n'est plus téléchargeable —, API `node
dist/main.js` sur `127.0.0.1:3100`, webhook pointé sur un serveur d'écho local `127.0.0.1:8099` ;
conteneurs et volume supprimés ensuite ; aucune connexion à la production, aucun webhook Dokploy) :

1. **Migration sur base existante** : migrations de `master` (0000-0019) jouées, admin et un projet
   insérés, puis `pnpm db:migrate` de la branche ⇒ 22 migrations, ligne `main` version 1,
   `portrait_key` nulle, projet conservé ; rejouée ⇒ sans effet ; `INSERT` d'une seconde ligne ⇒
   refus par `profile_content_single_row` ; espaces insécables stockées en `c2 a0`.
2. **`GET /api/profile`** ⇒ 200, `X-RateLimit-Limit: 120` ; contenu comparé à une sortie fraîche du
   générateur (front) par `assert.deepStrictEqual` ⇒ « deepStrictEqual OK — version=1
   portrait=null ».
3. **`PUT`** (cookie admin local) : paragraphe 2 modifié, `version: 1` ⇒ 200, version 2, 1 `POST`
   reçu par l'écho ; même corps rejoué ⇒ 200 version 2 sans écriture (document identique) ; autre
   modification avec `version: 1` ⇒ **409** « Version périmée… », base inchangée, aucun `POST` ;
   corps identique `version: 2` ⇒ 200, `updated_at` inchangé, aucun `POST` ; clé inconnue,
   `<img …>` dans un résumé, liste vide ⇒ 400 avec le motif ; sans cookie ⇒ 401.
4. **A4** : création, mise à jour, suppression d'un projet ⇒ un `POST` chacune ; `PATCH` invalide
   (400) ⇒ aucun.
5. **A5** (JPEG de 3,7 Mo) : envoi A ⇒ `profile/portrait-4ec2674d.avif`, `GET /api/storage/…` ⇒ 200
   `image/avif`, `Cache-Control: public, max-age=31536000, immutable`, AVIF 640×800 ; envoi B ⇒
   B courant, **A gardé** (bucket : A, B) ; renvoi de B ⇒ rien (ni écriture ni `POST`) ; renvoi de A
   (le précédent) ⇒ A courant, B précédent, rien supprimé ; `DELETE` ⇒ `portrait: null`, A gardé
   comme précédent, B supprimé (bucket : A) ; second `DELETE` ⇒ 204 sans effet ; envoi de B ⇒ B
   courant, A supprimé (bucket : B) ; PDF ⇒ 422 ; sans cookie ⇒ 401. Un `POST` d'écho par écriture
   effective (9 au total sur la session), version du document restée à 2.
6. **Poids** : les JPEG de test (bruit gaussien, incompressible) donnent ~100 ko ; `public/avatar.avif`
   du front (photo réelle 400×400, 9,6 ko) passé par le même recadrage donne **13,3 ko** en 640×800.
   À remesurer avec la vraie photo source (risque D6).

Points de déploiement :

- Ordre : PR API mergée puis **conteneur API déployé** (migrations 0020-0021 jouées au démarrage par
  `pnpm db:migrate`) avant toute PR front qui lit `/api/profile` (item 10).
- Après déploiement, en **lecture seule** : `GET https://api.nedellec-julien.fr/api/profile` ⇒ 200,
  version 1, `portrait: null`, comparé au contenu statique du front (sortie du générateur ci-dessus,
  `assert.deepStrictEqual` sur la réponse privée de `version`, `updatedAt`, `portrait`) (preuve API 3).
- ~~**Effet immédiat d'A4**~~ : sans objet, A4 retiré (amendement du 2026-10-10).
- Aucune nouvelle variable d'environnement ; aucune nouvelle dépendance.

Risques :

- Deux changements de portrait rapprochés pendant une panne d'API peuvent supprimer la clé que cite
  la copie périmée (cf. Risques, amendé) ; écriture concurrente de deux onglets ⇒ 409 (texte comme portrait), à traduire côté front.
- ~~Rafales de rebuild~~ : sans objet (A1/A4 retirés).
- Le recadrage `attention` sur une photo réelle n'est pas mesuré ; le poids final dépend de la photo.
