---
id: 029
title: Repositionnement en portfolio personnel, retrait de l'activité freelance
type: refactor
status: draft
created: 2026-10-20
related: [specs/009-plateforme-acquisition.md, specs/024-prise-de-rendez-vous.md, PRODUCT.md]
---

# 029 — Repositionnement en portfolio personnel

## Description

### Objectif

Julien arrête son statut d'entrepreneur individuel et ferme son compte Malt (décision du propriétaire du
2026-10-20). Aucun client n'a été servi : aucun contrat, aucune maintenance ni aucun rendez-vous à
honorer. Le site cesse d'être une plateforme d'acquisition client (spec 009) et redevient un portfolio
personnel orienté « passion du code », avec le SEO comme priorité. `PRODUCT.md` porte le nouveau
positionnement : public principal développeur (par le blog), public secondaire recruteur ou tech lead.

### Arbitrages (2026-10-20)

1. **Publics** : développeurs via le blog d'abord, recruteurs et tech leads ensuite.
2. **Formulaire de contact** : conservé, sans qualification commerciale (plus de « type de projet »
   dérivé du catalogue d'offres).
3. **Réalisations** : toutes conservées.
4. **Disponibilité** : Julien n'est pas ouvert aux opportunités. Aucun signal de recherche d'emploi
   (bloc « Vous recrutez ? », mention CDI, lien `project_hiring` de la fiche projet). Le CV reste
   téléchargeable depuis le parcours.
5. **Accroche de la home** : « Tourneur CN le jour, développeur web le reste du temps. », accent
   (`HeroData.headlineAccent`) sur « développeur web ».
6. **Avis** : aucun avis n'a jamais été publié (`HOME_REVIEWS` vide). La section et son JSON-LD `Review`
   disparaissent.
7. **Ordre de retrait** : front avant API. Une route d'API retirée avant son appelant casserait les
   pages rendues à la requête (miroir de la règle « API puis front » des ajouts, `.claude/CLAUDE.md`).
8. **Méthode** : soustraction d'abord, une PR par périmètre, chacune verte sur les gates du Dockerfile.
   Aucune refonte d'architecture (monorepo, mode de rendu) dans ces PR : elle se décide une fois le
   périmètre réduit.

### Exigences

1. **URL retirées** : `/offres`, `/offres/*`, `/offre-site-industrie` et `/rendez-vous` (hors
   `/rendez-vous/annulation`, retiré avec l'API) répondent **410 Gone** par nginx, sortent du
   `sitemap.xml` et du prérendu. Un 410 désindexe plus vite qu'un 404 et dit la vérité : la ressource
   n'existe plus et ne reviendra pas.
2. **Aucun lien mort** : header, footer, home, fiche projet, page Parcours ne pointent plus vers une URL
   retirée.
3. **Données structurées** : plus aucun `OfferCatalog`, `Offer`, `Service`, `ProfessionalService`,
   `PriceSpecification`, `Review`, ni zone `AdministrativeArea` de chalandise. `Person` reste.
4. **Identité** : plus de SIRET (`SITE_IDENTITY.business`), plus de lien Malt, mentions légales et
   politique de confidentialité réécrites pour un éditeur particulier non professionnel (contenu à
   valider par le propriétaire, obligations LCEN art. 6 à vérifier sur Légifrance au moment de la PR).
5. **Contenu en base** : le parcours (`/about`) est un document administrable (ADR-0023). Le paragraphe
   « Je prends des missions freelance… » se corrige dans l'admin ou par une migration de l'API, pas
   dans le code du front.
6. **Analytics** : la vue « conversions » (tunnel vers la demande de devis) disparaît. Les événements
   qui nomment une offre (`offer_*`) ne sont plus émis.
7. **Documentation** : ADR 0005, 0026, 0027, 0028 passent au statut « Obsolète » avec un renvoi vers
   cette spec (une ADR n'est pas supprimée). `DESIGN.md` perd les composants retirés.

### Découpage en PR

| # | Dépôt | Périmètre | Dépend de |
|---|---|---|---|
| 1 | front | `PRODUCT.md` et cette spec | — |
| 2 | front | retrait des offres et nouvel accueil, 410 nginx, sitemap, JSON-LD | 1 |
| 3 | front | retrait des rendez-vous (pages publiques et admin, flux ICS) | 2 |
| 4 | API | retrait du module `booking`, migration de suppression des tables, `BOOKING_FEED_SECRET` | 3 déployée |
| 5 | front + API | identité (SIRET, Malt), mentions légales, confidentialité, contact sans qualification, parcours | 3 |
| 6 | front + API | analytics : retrait des conversions et des événements d'offre | 2 |
| 7 | front | ADR obsolètes, `DESIGN.md`, archivage des specs 007, 009, 010, 024 à 028 | 2 à 6 |

### Hors périmètre

- Choix d'architecture (monorepo Nx, rendu statique, maintien de l'admin) : décidés après la PR 7.
- Phase SEO active (`ProfilePage`, maillage interne, transformation des ADR en articles) : spec dédiée.
- CI de l'API (absente aujourd'hui) : spec dédiée côté API, prioritaire avant la PR 4.

## Plan technique — PR 2 (offres et nouvel accueil)

### Retiré
- `features/offer/` entier, ses routes (`/offres`, `/offres/*`, redirections `application-metier` et
  `offre-site-industrie`), son prérendu et ses entrées du `sitemap.xml`.
- Home : sections Offres, Méthode, Pourquoi moi, FAQ, Avis (et leur JSON-LD `Review`), lien de
  réservation et mention de disponibilité du hero. `SITE_IDENTITY.availability` et
  `SITE_IDENTITY.googleReviewUrl` (invitation à un avis Google dans le pied de page) disparaissent.
- Fiche projet : bloc de fin « Un besoin similaire ? » et sa correspondance nature → offre.
- `public/demos/` : visuels des démos, servis uniquement par les pages d'offre.
- Code devenu mort : `shared/ui/faq-list`, `shared/ui/key-point-list`, l'entrée de menu de type
  « section » (seule « Méthode » l'utilisait) et l'ancre de formulaire local du `SectionScroller`
  (`REQUEST_ANCHOR_DATA_KEY`, seules les pages d'offre la déclaraient).

### Ajouté ou modifié
- **Hero** : accroche de l'arbitrage 5, cartouche « Fiche technique » (métier, code, stack,
  hébergement, règle), appels « Lire le blog » (primaire) et « Voir les réalisations ».
- **Derniers articles** (`HomeLatestPosts`) : les trois derniers articles publiés
  (`latestPosts`, domaine blog), avant les réalisations ; section absente sans article. Le bundle de la
  home les compose avec `combineLatest` et non `forkJoin` : `allProjects$` ne se termine jamais
  (`ReplaySubject` partagé, réémis après invalidation), un `forkJoin` n'émettrait pas.
- **Menu** : Blog, Réalisations, Parcours (le blog d'abord, `PRODUCT.md`). Appel « Me contacter ».
- **SEO de la home** : graphe `Person` (`jobTitle`, `sameAs` LinkedIn et GitHub) + `WebSite`.
- **nginx** : `location ~ ^/(offres|offre-site-industrie)(/|$)` → `return 410`, corps = shell client
  (`error_page 410 /index.csr.html`), en-têtes de sécurité du `server` conservés.
- **CI** : les contrôles du HTML prérendu (gestionnaire inline, preload de police) lisent
  `/mentions-legales` au lieu de `/offres` ; le smoke Docker vérifie le 410.
- **Analytics** : un emplacement `offer_<slug>` encore présent dans l'historique s'affiche « Page
  d'offre retirée (<slug>) » au lieu d'« Emplacement inconnu ».

### Laissé aux PR suivantes
Formulaire de contact (délai souhaité, invitation à réserver), SIRET et lien Malt (PR 5), rendez-vous
(PR 3), `DESIGN.md` et ADR (PR 7).
