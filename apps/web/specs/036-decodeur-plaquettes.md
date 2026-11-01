---
id: 036
title: Décodeur de code plaquette ISO, lié au guide des plaquettes
type: feature
status: draft
created: 2026-10-27
related: [specs/035-guide-plaquettes-simplifie.md, specs/032-atelier.md, docs/adr/0024-rendu-a-la-requete-des-pages-de-contenu.md, specs/assets/036/table-iso-1832.md, specs/assets/036/notes-iso-1832.md]
---

# 036 — Décodeur de code plaquette

## Description

### Objectif

Demande du propriétaire (2026-10-27) : un deuxième outil de l'atelier, qui **explique un code de
plaquette ISO** lettre par lettre (`CNMG 120408` → losange 80°, dépouille 0°, tolérance M, trou et
brise-copeaux deux faces, arête 12, épaisseur 4,76 mm, rayon de bec 0,8 mm). Il va de pair avec le
guide des plaquettes (spec 035) : le guide dit **quelle** plaquette, le décodeur dit **ce que veut
dire** son code.

### Arbitrages (2026-10-27)

1. **Outil lié au guide, avec son propre interrupteur** (décision de Julien, 2026-10-27) : sa propre
   page `/atelier/decodeur`, deuxième carte de l'accueil de l'atelier, ouverte par l'interrupteur
   `decoderEnabled` du document du guide (`GET /api/workshop-guide`, PR API #69), réglé dans l'admin
   (`/admin/guide-plaquettes`) par une deuxième case sous celle du guide. Décodeur activé : sa carte et
   sa page, quel que soit l'interrupteur du guide ; décodeur désactivé : `/atelier/decodeur` répond une
   vraie 404, sa carte disparaît (et la section « Les outils » avec elle s'il ne reste aucune carte), la
   page sort du sitemap ; lecture de l'API en échec : 503, comme le guide. Dans le guide, chaque code de
   plaquette **décodable** devient un lien vers son décodage, seulement si le décodeur est activé.
   *(Remplace « le décodeur suit l'interrupteur du guide », lui-même venu remplacer l'arbitrage initial
   « toujours en ligne, indépendant de l'interrupteur ».)*

### Parcours

1. Un champ « Code de plaquette » : on tape `CNMG 120408`, `cnmg120408`, `CNMG 120408-PM`… La saisie
   tolère casse, espaces et tirets.
2. Le décodage s'affiche position par position : la lettre ou le chiffre, sa signification, et
   pour les positions 1 à 7 la source (Mitsubishi Materials et Kyocera, concordants).
3. La suite éventuelle (après la position 7, par exemple `-PM`) s'affiche telle quelle comme
   **suffixe propre au fabricant** (brise-copeaux, nuance), sans être décodée.
4. Le code reste dans l'URL (`?code=CNMG120408`) : depuis le guide, un clic sur un code ouvre
   directement son décodage, et un décodage se partage.

### Exigences

1. **Données** : uniquement la table des positions 1 à 7 de `specs/assets/036/table-iso-1832.md`,
   valeurs **concordantes** entre Mitsubishi Materials et Kyocera. Ce qui n'est écrit que par une
   source (forme X, dépouille O, épaisseurs S1/T0/T1/05, micro-rayons) n'entre pas, ou s'affiche
   « non reconnu ». Chaque position cite sa source ; l'ISO 1832 (payante, non lue) est nommée comme
   norme, pas comme source.
2. **Erreurs claires et localisées** : une saisie invalide dit **quelle position** ne va pas
   (« 2ᵉ lettre `X` : dépouille inconnue »), sans planter. Les codes en pouces (ANSI, par exemple
   `CNMG 432`) sont reconnus comme tels et refusés avec ce motif, jamais décodés à tort.
3. **Rendu** : page rendue à la requête (son affichage dépend de `?code` et de l'interrupteur, ADR-0024) ;
   elle lit le document du guide (`GET /api/workshop-guide`) avec le même gateway et le même état de
   transfert que le guide, pour son seul interrupteur. La location SSR de nginx, le sitemap et
   `ci/smoke.sh` / `ci/verify-prerender.sh` suivent.
4. **Accessibilité et SEO** : champ étiqueté, résultat dans une liste de définitions (`dl`)
   annoncée quand elle change, erreurs en `role="alert"`, page lisible à 375 px ; titre, description
   et canonical sans query string ; tutoiement.
5. **Lien depuis le guide, interrupteur propre** (décision de Julien du 2026-10-27) : un code du guide
   n'est un lien que s'il se décode (positions 1 à 7 reconnues) **et** que le décodeur est activé ;
   sinon il reste du texte, pour ne jamais mener à une 404. Chaque outil suit son propre interrupteur
   (`enabled` pour le guide, `decoderEnabled` pour le décodeur) : éteint, sa page répond 404, sa carte
   quitte l'accueil et la page sort du sitemap ; allumé, sa page et sa carte sont en ligne. Le gateway
   lit `decoderEnabled` et l'envoie toujours à l'enregistrement.
6. **Domaine pur** : le décodage est une fonction pure (`parse` → résultat typé ou erreur
   localisée), testée sans TestBed, avec une propriété « décoder puis recomposer redonne le code
   normalisé ».

### Découpage en PR (proposé)

| # | Dépôt | Périmètre | Dépend de |
|---|---|---|---|
| 1 | front | cette spec et la table sourcée | — |
| 2 | front | domaine : table ISO 1832 sourcée, décodage pur et ses tests | 1 |
| 3 | front | page `/atelier/decodeur`, carte sur l'accueil, lien depuis le guide | 2 |

Pas d'API : tout est dans le code. Chaque PR part de `master` à jour (jamais de PR empilée).

### Hors périmètre

- Plaquettes de fraisage, de gorge, de filetage (codifications propres aux fabricants).
- Décodage des suffixes fabricant (brise-copeaux, nuances).
- Schéma dessiné de la forme : à rouvrir plus tard si l'envie est là.

## Implémentation

### Données retenues (positions 1 à 7)

Seules les valeurs écrites à l'identique par Mitsubishi Materials et Kyocera p. B1, chaque position
citant ses deux pages (`features/workshop/domain/iso-1832.static-data.ts`).

**Écartées faute de seconde source ou de lecture sûre** : forme X ; dépouille O ; épaisseurs S1, T0,
T1, 05 ; micro-rayons V3/V5 (MMC) et 003/005 (Kyocera) ; ligne de taille 7,94 mm et colonne R
(diamètres des plaquettes rondes, mal extraits du PDF Kyocera) : une plaquette ronde n'est donc pas
décodable (`RCMT 1204M0` s'arrête en 5ᵉ position) et le code de bec M0, qui ne vaut que pour elle, n'est
pas repris ; angle de 80° du trigone W (écrit par Easthope et Sumitomo seulement) ; fraisures de T, U,
H et J (colonne vide chez MMC, écrites par Kyocera seul : « trou de fixation » sans détail) ; mention
« plaquette négative / positive » de la dépouille (cours MMC seul).

**Jugement à valider** : la forme W est reprise comme « Trigone » (MMC). L'extraction texte de Kyocera
porte « Hexagon », mais H est déjà l'hexagone chez les deux, et la colonne W de la table des tailles
de Kyocera (04 pour un cercle inscrit de 6,35 mm) est celle d'un trigone. Sans W, `WNMG 080408`
ne se décode pas.

**Taille** : pour C, D, S, T, V et W, seuls les codes de la table (cercles inscrits 6,35 à 25,40 mm) ;
pour les autres formes (sauf R), la règle commune « arête en mm, tronquée » (deux chiffres, hors 00).

**ANSI** : 3 ou 4 lettres suivies d'une taille d'un seul chiffre en 1/8″ (3 chiffres, ou un point
comme `32.51`) : refusé avec ce motif, à la position où commence la taille.

### Écarts

- PR 2 et 3 du découpage **regroupées en une seule PR** (demande de Julien, 2026-10-27).
- Arbitrage 1 et exigence 5 changés une seconde fois (décision de Julien du 2026-10-27) : le décodeur
  a son propre interrupteur `decoderEnabled`, réglé dans l'admin (API #69).
- Arbitrage 1 changé en cours de PR (le décodeur suit l'interrupteur du guide) : la page lit le
  document du guide, comme `/atelier/plaquettes`.
- La garde de confidentialité (`findConfidentialReferences`) signale toute suite de 5 chiffres ou
  plus : un code ISO comme `CNMG 120408` y passe pour une référence. Le texte du décodeur n'est donc
  pas ajouté à `workshop-confidentiality.spec.ts`, et la ligne ajoutée à la doublure utilise
  `CCGT 09T304-PM`. Conséquence hors de cette PR : l'éditeur du guide avertit à tort quand Julien
  saisit un code ISO à six chiffres.
- Lien du guide : le texte réservé aux lecteurs d'écran (« , décoder ce code ») est placé **après**
  le code visible, pour que le nom du lien commence par ce qu'on voit (et parce que placé avant, il
  déplaçait la cible du clic de Playwright hors du lien).

## Journal des tranches

- **Tranche 1 — domaine ISO 1832** : RED `pnpm test` code de sortie 1, 17 erreurs de compilation
  (`./decode-insert-code` et `./iso-1832.static-data` absents) ; GREEN au premier cycle,
  `pnpm ng test --include='src/app/features/workshop/domain/**/*.spec.ts'` : 6 fichiers passed (code de
  sortie 0) · refactor : aucun
- **Tranche 2 — page `/atelier/decodeur`** (route, SSR, nginx, sitemap, smoke, prérendu, axe) :
  RED `pnpm test` code de sortie 1, 8 erreurs de compilation (page, copie, message d'erreur absents) ;
  GREEN après 2 cycles (espaces manquants entre les `span` du `dt`, lus « 1FormeC » ; garde de
  confidentialité, cf. Écarts) ; `features/workshop` : 13 fichiers passed (code de sortie 0) · refactor : commentaire de la table sans renvoi de fichier de spec
- **Tranche 3 — carte et lien depuis le guide**, avec l'interrupteur commun : RED `pnpm test` code de
  sortie 1, 3 tests en échec (carte du décodeur, deux cartes guide activé, lien depuis le guide) ;
  GREEN 4834 passed / 4834 total (code de sortie 0) · refactor : filtre des cartes réduit à
  « interrupteur allumé → toutes les cartes »
- Les PR 2 et 3 du découpage sont livrées ensemble, en une seule PR (demande de Julien).
- **Correctif hors tranche (session principale)** : l'éditeur admin du guide (spec 035) signalait tout code ISO à six chiffres (`CNMG 120408`) comme référence de pièce ; le champ plaquette n'est plus analysé quand il se décode. RED sur `CNMG 120408`, puis GREEN 4837/4837, lint et format en code 0.
- **Tranche 4 — interrupteur propre au décodeur** (décision de Julien du 2026-10-27, API #69) : RED
  `pnpm test` code de sortie 1, 20 tests en échec sur assertions (types posés d'abord, valeurs fausses :
  adapter, gateway, 404 du décodeur selon `decoderEnabled`, cartes indépendantes, sitemap et flux, liens
  du guide, deuxième case et aide dans l'admin, payload) ; GREEN au premier cycle, 4862 passed / 4862
  total (code de sortie 0) · refactor : aucun

## Verify

Image `ng-portfolio-app:ci` (`docker buildx bake ci`) devant la doublure (`ci/a11y-stack.sh up
ng-portfolio-app:ci`), parcours joués par Playwright (Chromium headless), API de production réécrite
vers la doublure comme l'audit axe. Verdict : **PASS**.

1. `/atelier/decodeur`, focus sur le champ, saisie au clavier « CNMG 120408 » puis Entrée : l'URL
   devient `?code=CNMG120408` (remplacée), titre « Décodage de CNMG 120408 », `dl` de 7 positions
   (Forme C, Dépouille N, Tolérance M, Fixation et brise-copeaux G, Taille 12, Épaisseur 04, Rayon de
   bec 08), zone `aria-live="polite"` (capture `01-cnmg-clavier.png`).
2. URL partagée `?code=CNMG120408` en rendu serveur, JavaScript coupé, 375 px : 200, `X-Cache-Status`
   présent, 7 positions dans le HTML, canonical `https://nedellec-julien.fr/atelier/decodeur` sans
   query, titre « Décodeur de code plaquette ISO | Julien Nédellec », `scrollWidth` 375 pour 375
   (capture `02-url-partagee-ssr-sans-js-375.png`). Sans JavaScript, le formulaire soumis en GET
   (`dnmg 150608-pm`) affiche aussi le décodage et le suffixe « PM » propre au fabricant.
3. « COMG 120408 » : alerte `role="alert"` « 2ᵉ position, « O » : dépouille inconnue. », champ
   `aria-invalid="true"` (capture `03-erreur-position.png`). « CNMG 432 » : « « 432 » est une taille
   en pouces (code ANSI) : ce décodeur ne lit que le code ISO métrique. », aucun décodage (capture
   `04-ansi.png`).
4. `/atelier/plaquettes?matiere=Acier%20t%C3%A9moin` : `CCGT 09T304-PM` est un lien
   (`/atelier/decodeur?code=CCGT09T304PM`, nom « CCGT 09T304-PM, décoder ce code »),
   `PLAQUETTE-TEMOIN-1` et `-2` restent du texte (capture `05-guide-liens.png`) ; le clic mène au
   décodage « Décodage de CCGT 09T304-PM » (capture `06-decodage-depuis-guide.png`).
5. `/atelier`, guide activé : deux cartes, `/atelier/plaquettes` puis `/atelier/decodeur`.
6. Doublure passée à `enabled: false` (PUT en mémoire, rien de commité) : `/atelier/decodeur`, avec
   `/`, avec `?code=` → **404** avec la page introuvable ; `/atelier/plaquettes` → 404 ; `/atelier` en
   200 sans carte ni section « Les outils » ; `sitemap.xml` sans le guide ni le décodeur, avec
   `/atelier` (captures `07-atelier-guide-eteint.png`, `08-decodeur-guide-eteint-404.png`). Doublure
   remise à `enabled: true` ensuite.
7. Console : seules erreurs, `GET /api/config` en 404 sur chaque page (route absente de la doublure,
   antérieur) et les 404 attendues du guide éteint.
8. `pnpm a11y -g "atelier|decodeur"` : 12 passed (clair et sombre ; `/atelier`, guide, guide avec
   matière, décodeur vide, décodé avec suffixe, en erreur ANSI).

### Tranche 4 — interrupteur propre au décodeur

Image `ng-portfolio-app:ci` (`docker buildx bake ci`) devant la doublure (`ci/a11y-stack.sh up
ng-portfolio-app:ci`), interrupteurs basculés par le `PUT` en mémoire de la doublure (rien de commité),
parcours joués par Playwright (Chromium headless), API de production réécrite vers la doublure.
Verdict : **PASS**.

1. Guide activé, décodeur coupé : `/atelier` en 200 avec la seule carte `/atelier/plaquettes` ;
   `/atelier/decodeur?code=CNMG120408` → **404** avec la page introuvable ;
   `/atelier/plaquettes?matiere=Acier%20t%C3%A9moin` en 200, aucun lien dans le tableau,
   `CCGT 09T304-PM` en texte (captures `A-atelier.png`, `A-decodeur.png`, `A-guide.png`).
2. Guide coupé, décodeur activé : `/atelier` en 200 avec la seule carte `/atelier/decodeur` ; le
   décodeur en 200 avec son décodage ; `/atelier/plaquettes` → **404** (captures `B-*.png`).
3. Admin, décodeur coupé au départ : la case « Décodeur de plaquette visible sur le site » est décochée,
   son aide se lit ; cochée puis « Enregistrer » : un seul `PUT /api/workshop-guide` de corps
   `{ enabled: true, decoderEnabled: true, version: 4, entries: 4 lignes }`, toast « Guide des plaquettes
   enregistré », barre « Aucune modification », doublure à `decoderEnabled: true` (version 5) (captures
   `C-admin-coche.png`, `C-admin-enregistre.png`). Ensuite `/atelier` montre les deux cartes, le décodeur
   répond 200 et `CCGT 09T304-PM` redevient un lien (`/atelier/decodeur?code=CCGT09T304PM`).
4. `sitemap.xml`, lu 2,5 s après chaque bascule (cache nginx d'une seconde) : guide seul →
   `/atelier /atelier/plaquettes` ; décodeur seul → `/atelier /atelier/decodeur` ; aucun → `/atelier` ;
   les deux → les trois.
5. Doublure : un `PUT` sans `decoderEnabled` garde la valeur stockée (`true` conservé).
6. Console : seules erreurs, `GET /api/config` en 404 (route absente de la doublure, antérieur) et les
   404 attendues des pages éteintes.
7. `pnpm a11y -g "atelier|decodeur|guide-plaquettes"` : 14 passed (dont `/admin/guide-plaquettes`
   avec les deux cases).

## Review code

**Verdict** : REJECTED
**Gates CI locaux** : install `pnpm install --frozen-lockfile` 0 / build `pnpm run build --configuration production` 0 (cache `ng cache clean` purgé avant) / tests `pnpm test` 0 (4837/4837, 245 fichiers) / lint `pnpm lint` 0 / format `pnpm run format:check` 0 / `docker buildx bake ci` 0
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main (archéologie, sécurité, `export default`, `effect()`) : 0 hit
**Warnings de gate** : aucun
**Rendu compilé** : N/A (aucun composant `shared/ui` touché ; page vérifiée à l'exécution)
**Preuve de verify runtime** : ✅ (section Verify complète ; captures non commitées, rejouée par le reviewer sur `ng-portfolio-app:ci` + doublure : décodage SSR 200, ANSI et position 2 en `role="alert"`, `WNMG 080408` décodé, `/atelier/decodeur/x` 404, lien du guide `?code=CCGT09T304PM` avec nom « CCGT 09T304-PM, décoder ce code », guide éteint → 404 décodeur et guide, `/atelier` 200 sans carte, sitemap sans les deux pages ; API arrêtée → 503 `X-Cache-Status: MISS`)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ❌
**Sécurité** : ❌
**Alignement spec** : ✅

**Tests notables** :
- ✨ `decode-insert-code.spec.ts:197` — propriété « décoder puis recomposer » sur toutes les entrées de la table, dans toutes les graphies acceptées.
- ⚠️ `admin-insert-guide.spec.ts:540` — aucun cas « code décodable suivi d'une référence » dans le champ plaquette (cf. point 1).

**Points à corriger** :
1. `src/app/features/admin/application/components/admin-insert-guide-row.ts:162` — quand le code se décode, tout le champ plaquette sort de `findConfidentialReferences`, **suffixe compris** : `CNMG 120408 12345` ou `CNMG 120408 OF n° 4521` se normalisent en code décodable de suffixe `12345` / `OFN°4521`, et la référence n'est plus signalée (elle l'était avant la PR). Analyser le suffixe (`decoding.ok ? decoding.suffix : insert`) et ajouter le cas au `it.each` de `admin-insert-guide.spec.ts:541`.

**Suite (2026-10-27, session principale)** : point bloquant corrigé. Le champ plaquette n'est plus ignoré en entier quand il se décode : `textAfterInsertCode` rend ce qui suit le code, tel que saisi, et c'est ce reste qui passe par `findConfidentialReferences` (`CNMG 120408 OF n° 4521` et `CNMG 120408 12345` redeviennent signalés). RED sur ces deux cas, puis GREEN 4844/4844, lint et format en code 0 ; test unitaire de `textAfterInsertCode` ajouté.
