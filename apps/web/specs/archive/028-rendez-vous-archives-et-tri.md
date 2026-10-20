---
id: 028
title: Rendez-vous annulés archivés et tri par date dans l'admin
type: feature
status: obsolete
created: 2026-10-16
related: [specs/archive/024-prise-de-rendez-vous.md, specs/archive/026-abonnement-agenda.md]
---

# 028 — Rendez-vous archivés et tri par date

## Description

### Objectif

Dans `/admin/rendez-vous`, les rendez-vous annulés apparaissent mélangés aux confirmés dans « À venir » et
« Passés » (demande du propriétaire du 2026-10-15). Le surtitre « N rendez-vous à venir » compte aussi les
annulés, alors que la navigation dit « 0 à venir » (écart relevé le 2026-10-15). Le propriétaire veut
ranger les annulés à part et trier la liste par date.

### Arbitrages (2026-10-16, par délégation « tranche pour moi »)

1. Trois filtres : **À venir** et **Passés** ne montrent que les rendez-vous **confirmés** ; **Archivés**
   montre tous les rendez-vous **annulés**, passés ou futurs.
2. Tri : un second groupe de filtres « Ordre » propose **Date croissante** et **Date décroissante**. Ordre
   par défaut selon le filtre : croissant pour « À venir », décroissant pour « Passés » et « Archivés ».
   Changer de filtre remet l'ordre par défaut. Le tri se fait côté client sur `startsAt` (listes courtes,
   purge à 6 mois) ; l'API garde ses ordres par défaut.
3. Pas de suppression ni de restauration d'un rendez-vous archivé : la purge nocturne à 6 mois reste la
   seule suppression (RGPD, spec 024).
4. Annulation par le propriétaire depuis « À venir » : après le succès, la liste est relue
   (`bookingsRes.reload()`) au lieu d'être modifiée sur place ; la ligne quitte « À venir » pour
   « Archivés » et le surtitre suit. Ajouté le 2026-10-16 en phase GREEN.

### Exigences

1. API : `GET /api/booking/bookings?scope=upcoming|past|archived` (JWT).
   - `upcoming` : `status = 'confirmed'` et fin après maintenant, tri croissant sur `starts_at`.
   - `past` : `status = 'confirmed'` et fin avant ou égale à maintenant, tri décroissant.
   - `archived` : `status = 'cancelled'`, sans condition de date, tri décroissant.
   - Tout autre `scope` reste refusé en 400 (DTO `whitelist` + `forbidNonWhitelisted`).
2. Front : `BookingScope = 'upcoming' | 'past' | 'archived'`, filtre « Archivés » ; surtitre
   « N rendez-vous archivés » (« Aucun rendez-vous archivé » / « 1 rendez-vous archivé ») ; état vide
   « Aucun rendez-vous annulé pour le moment. » avec le tampon « Archives vides ».
3. Le bouton d'annulation n'apparaît jamais dans « Archivés » (déjà vrai : `cancellable` exige
   `upcoming` et `confirmed`) ; le motif d'annulation et « Annulé par vous / par le visiteur » restent
   affichés.
4. Ordre : `app-filter-group` « Ordre des rendez-vous » à deux options, `aria-pressed`, réinitialisé au
   changement de filtre (`linkedSignal` sur le scope), tri par une fonction pure testée.
5. Zéro violation AXE sur les trois filtres (scénarios `e2e/a11y`, stub `ci/api-stub`).

### Ordre de livraison

API d'abord (item 10 du CLAUDE.md) : la nouvelle API reste compatible avec le front actuel (il n'envoie
que `upcoming` et `past`, qui perdent seulement leurs annulés). Le front se merge après le déploiement de
l'API vérifié en prod (`scope=archived` répond 200, 401 sans jeton).

## Plan technique

- **API** (`nest-portfolio-app`) : `BookingScope` dans `booking.service.ts`, `BOOKING_SCOPES` dans
  `dto/list-bookings-query.dto.ts`, `listBookings` (filtre de statut et ordre par scope), tests du service
  (intégration Postgres si `BOOKING_IT_DATABASE_URL`) et du contrôleur (`it.each` sur les trois scopes,
  400 pour `all`).
- **Front** : `booking-admin.model.ts` (`BookingScope`), `admin-bookings-view.ts`
  (`ADMIN_BOOKINGS_FILTERS`, `bookingsOverline`, nouveaux `BookingSortOrder`, `ADMIN_BOOKINGS_ORDERS`,
  `defaultBookingOrder(scope)`, `sortBookingRows(rows, order)`), `admin-bookings.ts` (second filtre,
  `linkedSignal`, état vide archivé), stub `ci/api-stub` (`scope=archived`), `e2e/a11y/scenarios.ts`.

## Plan de test

Plan sans sous-section `### Tranches` : tranche unique côté front.

### Tranche 1 — Archivés et ordre des rendez-vous

**`admin-bookings-view.spec.ts`** (fonctions pures, sans TestBed)

- `ADMIN_BOOKINGS_FILTERS` (test existant recalibré) : `toEqual` sur les trois options À venir / Passés /
  Archivés (`archived`).
- `ADMIN_BOOKINGS_ORDERS` : `toEqual` `[{ asc, 'Date croissante' }, { desc, 'Date décroissante' }]`.
- `defaultBookingOrder` (`it.each`) : upcoming → `asc`, past → `desc`, archived → `desc`.
- `sortBookingRows` : tri sur l'instant `startsAt` à cheval sur l'année (`it.each` asc / desc) ; deux
  lignes au même instant gardent leur ordre d'arrivée dans les deux sens (`it.each`) ; le tableau
  donné n'est pas modifié ; liste vide → `[]`.
- `bookingsOverline` (table étendue) : archived 0 → « Aucun rendez-vous archivé », 1 → « 1 rendez-vous
  archivé », 3 → « 3 rendez-vous archivés », 1200 → « 1 200 rendez-vous archivés ».

**`http-booking.gateway.spec.ts`** : `it.each` des scopes étendu à `archived` (GET `?scope=archived`).

**`admin-bookings.spec.ts`** (page, DOM rendu)

- Filtres (test existant recalibré) : le premier groupe « Filtrer les rendez-vous » propose À venir
  (pressé), Passés, Archivés ; seule la liste `upcoming` est demandée.
- « Archivés » pressé (reprend l'ancien test de la ligne annulée par le visiteur) : requêtes
  `upcoming` puis `archived`, lignes Inès (Annulé par le visiteur, « Projet reporté. ») puis Maël
  (Annulé par vous, sans motif), aucun bouton d'annulation, surtitre « 2 rendez-vous archivés ».
- Archivés vide : tampon « Archives vides », texte « Aucun rendez-vous annulé pour le moment. »,
  surtitre « Aucun rendez-vous archivé ».
- Ordre : second groupe « Ordre des rendez-vous » après les filtres, « Date croissante » pressé ;
  liste à venir reçue dans le désordre affichée par date croissante ; « Date décroissante » inverse la
  liste sans nouvelle requête ; « Passés » et « Archivés » (`it.each`) arrivent en « Date
  décroissante » ; un ordre choisi à la main revient au défaut du filtre suivant (`it.each` sur deux
  parcours).
- Contrat recalibré (seed) : l'API ne renvoie plus d'annulé dans `upcoming`, la fixture `LISTS`
  passe à `upcoming: [Camille, Léo]`, `past: [Noé]`, `archived: [Maël, Inès]`. Les attentes qui
  comptaient Inès dans « À venir » passent de 3 à 2 lignes (liste, surtitre « 2 rendez-vous à
  venir », retour sur À venir, annulation réussie, relecture de l'abonnement). Ce sont des valeurs
  attendues modifiées par le changement de contrat de l'API, pas une adaptation mécanique.

**Doublure et audit AXE** (non exécutés ici : il faut l'image Docker du GREEN)

- `ci/api-stub/server.mjs` : `scope=archived` accepté ; Sophie (annulée, future) quitte `upcoming`
  pour `archived`, avec Nadia (annulée par le visiteur, passée) ; `upcoming` ne sert que des confirmés.
- `e2e/a11y/scenarios.ts` : `ADMIN_BOOKING_FILTERS` (Passés : 1 ligne, Archivés : 2 lignes).
- `e2e/a11y/booking-states.spec.ts` : un audit par filtre (clic, `aria-pressed`, nombre de lignes,
  zéro violation sur `admin-bookings-list`) ; le dialogue d'annulation attend désormais 2 lignes à
  venir au lieu de 3. `pnpm a11y:typecheck` vert.

Sweep : `BookingScope`, `scope=`, `getBookings(`, `ADMIN_BOOKINGS_FILTERS`, `bookingsOverline` sur `src/`,
`e2e/` et `ci/`. `availability-calendar` lit `upcoming` et filtre déjà les confirmés : pas d'impact.

Preuve RED, en deux temps :

1. `pnpm test` (après `ng cache clean`) : exit 1, la compilation échoue sur les seuls symboles du
   GREEN (scaffold dû au GREEN) : `ADMIN_BOOKINGS_ORDERS`, `defaultBookingOrder`, `sortBookingRows`
   absents de `admin-bookings-view.ts` (TS2305/TS2724), et `'archived'` refusé par `BookingScope`
   (TS2345, `admin-bookings-view.spec.ts` et `http-booking.gateway.spec.ts`). Aucune autre erreur de
   type ni de format.
2. `pnpm exec ng test --exclude` de ces deux specs : 10 échecs, tous des `AssertionError` de
   `admin-bookings.spec.ts` (troisième filtre absent, second groupe absent, liste non triée, état vide
   archivé absent) ; les 252 autres fichiers passent, sans rejet non géré.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le 2026-10-16 19:09, 10 failed / 5049 total).

## Implémentation

- Arbitrage 4 : le test de page « annulation réussie » figeait l'ancien comportement (ligne conservée
  « Annulé par vous » avec son motif). Il est adapté : la doublure `upcoming` renvoie `[Camille, Léo]`
  puis `[Léo]`, et l'attente devient deux lectures `upcoming`, la seule ligne Léo, le surtitre
  « 1 rendez-vous à venir », le compteur invalidé, le toast et le focus sur le titre. Valeurs attendues
  modifiées par l'arbitrage, pas une adaptation mécanique.
- Le reste des tests RED est passé sans retouche.

## Journal des tranches

- **Tranche 1 — Archivés et ordre des rendez-vous** : GREEN 5174 passed / 5174 total · refactor :
  aucun (diff relu à la main : `EMPTY_STAMPS` en table plutôt qu'un ternaire à trois branches, déjà au
  premier jet)

## Verify

Surface touchée atteignable aujourd'hui : `/admin/rendez-vous` (filtres, liste, annulation).

1. `pnpm test` : 255 fichiers, 5174 tests passés, `$?` = 0, aucun rejet non géré.
2. `pnpm lint` : « All files pass linting », `$?` = 0.
3. `pnpm run format:check` : `$?` = 0.
4. `pnpm run build --configuration production` : `$?` = 0, 9 routes prérendues, CSP durcie sur 10 pages.
5. `docker build -t ng-portfolio-app:a11y .` puis `ci/a11y-stack.sh up && pnpm a11y` : 95 passés, 0
   échec (thèmes light et dark), dont « « Passés » bookings list » et « « Archivés » bookings list »
   (clic sur le filtre, `aria-pressed`, nombre de lignes, zéro violation WCAG A/AA sur
   `admin-bookings-list`), le dialogue d'annulation à 2 lignes à venir, et `/admin/rendez-vous with
   data`. Playwright pilote l'image servie par nginx avec le stub `ci/api-stub` : rendu réel, sans
   erreur bloquante.

Verdict : **PASS**. Capture d'écran non jointe : la preuve runtime est l'audit Playwright sur l'image
Docker (rapport local `pnpm exec playwright show-report`).

### Re-verify (code-reviewer, 2026-10-16)

Preuve GREEN incomplète (pas de capture) : rejouée sur une image reconstruite depuis l'arbre courant
(`docker build -t ng-portfolio-app:review-028 .`, `ci/a11y-stack.sh up ng-portfolio-app:review-028`).

1. `pnpm a11y` : 95 passés, `$?` = 0 (dont « Passés » et « Archivés », clair et sombre).
2. Chromium 375×900, session admin, API rerouted sur la doublure, `/admin/rendez-vous` :
   - À venir : Claire Martin, Karim Benali ; surtitre « 2 rendez-vous à venir » ; « À venir » et
     « Date croissante » pressés.
   - « Date décroissante » : Karim Benali, Claire Martin, sans changement de filtre.
   - « Archivés » : Sophie Durand (future, annulée par vous, motif) puis Nadia Morel (passée, annulée par
     le visiteur) ; surtitre « 2 rendez-vous archivés » ; « Date décroissante » pressé (ordre manuel
     réinitialisé) ; 0 bouton d'annulation.
   - « Passés » : Hugo Lefèvre ; « 1 rendez-vous passé » ; « Date décroissante ».
3. Captures : `verify-upcoming.png`, `verify-archived.png` (scratchpad de la session de revue).
4. Console : une seule erreur, `404 /api/config` (la doublure ne sert pas `/config`, déjà relevé en
   spec 007, hors diff) ; aucune erreur JS ni `pageerror`.

Verdict : **PASS**.

## Review code

**Verdict** : REJECTED
**Gates CI locaux** : install ✅ (`pnpm install --frozen-lockfile`, exit 0) / tests ✅ (`pnpm test` après `ng cache clean`, exit 0, 255 fichiers, 5174 tests, aucun rejet non géré) / lint ✅ (`pnpm lint`, exit 0) / format ✅ (`pnpm run format:check`, exit 0) / build ✅ (`pnpm run build --configuration production`, exit 0, CSP sur 10 pages)
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main sur les lignes ajoutées (archéologie : 2 commentaires, WHY d'une ligne sans réf, levés ; `export default`, `effect(`, helpers zone, `innerHTML`, `console.`, `changeDetection`, snapshot, `.only`/`.skip` : 0)
**Warnings de gate** : aucun
**Rendu compilé** : N/A (pas de sélecteur attribut touché, aucun fichier `shared/ui/**`)
**Preuve de verify runtime** : ✅ (preuve GREEN sans capture, rejouée par la revue : cf. `### Re-verify`)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ❌ (point 1)
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅

Le test « annulation réussie » modifié est légitime : l'arbitrage 4 change le comportement (relecture au
lieu de la mise à jour sur place), la valeur attendue devait donc bouger, et `## Implémentation` le
déclare comme tel. Il épingle bien la double lecture (`[['upcoming'], ['upcoming']]` avec une doublure
`defer` qui répond différemment à la seconde lecture), la ligne disparue (`['Léo Petit']`), le surtitre
(« 1 rendez-vous à venir »), le compteur (1 invalidation), le toast et le focus sur le titre.

`sortBookingRows` est pure (copie avant `sort`, test d'immutabilité de l'entrée) et stable (`sort`
stable depuis ES2019 ; jumeaux testés dans les deux sens, `-1 * 0` vaut bien égalité). `linkedSignal`
sur le scope : conforme, l'ordre survit à la relecture après annulation puisque le scope ne change pas.
Aucun `changeDetection` explicite. Second `app-filter-group` : `role="group"` + `aria-label` distinct,
`aria-pressed` ; AXE vert. Doublure cohérente avec le contrat (`archived` accepté, Sophie déplacée,
`upcoming` sans annulé, 400 hors liste).

**Tests notables** :
- ⚠️ `admin-bookings.spec.ts:810-843` — les cas d'échec d'annulation n'épinglent pas l'absence de relecture : un `reload()` placé avant le test `result.success` resterait vert (la ligne Camille reste « Confirmé » dans la même fixture). Ajouter `requested: [['upcoming']]` à l'attente.
- ✨ `admin-bookings.spec.ts:758` — doublure `defer` à deux réponses : prouve la relecture réelle, pas une mutation locale.
- ✨ `admin-bookings-view.spec.ts` (`sortBookingRows`) — tri à cheval sur l'année et jumeaux dans les deux sens : assertions qui tueraient un comparateur sur la chaîne ou un tri instable.

**Duplication / dérivation** (advisory) :
- ⚠️ `admin-bookings-view.ts:38` — `'asc' | 'desc'` alors que la même feature a déjà `PostsSortDirection = 'descending' | 'ascending'` (`admin-posts-view.ts:9`) : deux vocabulaires de sens de tri dans `features/admin/application`. Un seul site, non bloquant ; à unifier si un troisième tri arrive.

**Remarques informatives** (non bloquantes) :
- `ci/api-stub/server.mjs:256` et `:422` : les `.filter((row) => row.status === 'confirmed')` sur `adminBookings('upcoming')` ne filtrent plus rien depuis que la doublure ne sert que des confirmés. Inoffensif, mais c'est l'ancien contrat.
- `admin-bookings.ts:43` : `EMPTY_STAMPS` en `Record` mutable (même forme que `CANCEL_FAILURES`, existant) ; `Readonly<Record<…>>` serait plus fidèle au « readonly partout » du CLAUDE.md.

**Points à corriger** :
1. `src/app/features/admin/application/admin-bookings-view.ts:38` — `export type BookingSortOrder` n'a aucun consommateur hors du fichier (la page l'obtient par inférence de `linkedSignal`, le spec passe par `'asc' as const`). Retirer `export`, comme `type AdminProjectsView` / `type AdminMessagesView` dans les fichiers voisins.

## Journal

- 2026-10-16 : spec rédigée, arbitrages tranchés par délégation.

## Corrections après revue (2026-10-16)

- `BookingSortOrder` n'est plus exporté (aucun import hors du fichier).
- Advisories appliqués : `EMPTY_STAMPS` en `Readonly<Record<…>>` ; les cas d'échec d'annulation vérifient
  qu'aucune relecture n'a lieu (`requested: [['upcoming']]`) ; filtres `status === 'confirmed'` devenus
  inutiles retirés du stub.
- Gates relancés : `pnpm test` 0 (5174), `pnpm lint` 0, `format:check` 0, `a11y:typecheck` 0, build de
  production 0.
