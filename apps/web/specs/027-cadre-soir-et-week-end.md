---
id: 027
title: Cadre soir et week-end — textes, offres et retrait du bloc recrutement
type: feature
status: draft
created: 2026-10-16
related: [specs/024-prise-de-rendez-vous.md, specs/025-calendrier-des-disponibilites.md]
---

# 027 — Cadre soir et week-end

## Description

### Objectif

Le propriétaire reste tourneur CNC en CDI (2026-10-16). Il ne cherche plus de CDI en développement et ne
prend que des **missions freelance ponctuelles, le soir et le week-end, à charge limitée**. Le site promet
aujourd'hui un rythme de freelance à plein temps (« en ligne en 7 jours », « réponse sous 48 h ouvrées »,
« démarrage sous 2 semaines », régie sur site) et affiche une recherche de CDI (« Vous recrutez ? Ouvert à
un CDI en Île-de-France »). Ces promesses deviennent fausses : il faut les retirer ou les réécrire.

### Arbitrages du propriétaire (2026-10-16)

1. Appels de cadrage : du lundi au vendredi de 19 h à 21 h, le samedi de 9 h à 12 h. **Fait** dans
   `/admin/disponibilites` le 16/10 (donnée, aucun code), vérifié sur `/api/booking/slots`.
2. Missions ponctuelles uniquement. Délai de livraison : **selon la demande**, fixé au devis.
3. Délai de réponse : **sous 48 h, le soir**.
4. Maintenance mensuelle : **conservée** (sites et refonte).
5. Offre « Application métier » : **transformée en « Évolution d'application existante »**, nouvelle
   adresse `/offres/evolution-application` avec redirection depuis l'ancienne.
6. Offre « Renfort Angular / NestJS » : **recentrée** sur des tâches ponctuelles, à distance, le soir et
   le week-end (plus de sur site, de rituels ni de « démarrage sous 2 semaines »).
7. Le propriétaire délègue les derniers choix (« tranche pour moi », 2026-10-16) :
   - prix plancher de l'évolution d'application : **à partir de 390 €** (sous l'audit à 450 €, une
     petite évolution d'environ une journée) ;
   - le chapeau de l'accueil garde les règles d'identité existantes (`editorial-identity.spec.ts` :
     `journey` une seule fois, prix du site vitrine présent, ni « 20 ans » ni « métallurgie » ni « Je suis
     tourneur CN ») ; le texte d'introduction des profils LinkedIn et Malt y est adapté ;
   - les textes de la page Parcours servis par l'API entrent dans le périmètre (ils annoncent « ouvert au
     CDI ») : données modifiées dans l'admin après le merge, fixture `ci/api-stub/fixtures/profile.json`
     alignée dans la PR.

### Exigences

1. Plus aucune mention, sur le site public et dans son SEO, de : « 7 jours » / « sept jours » /
   « jour 1 … jour 7 », « 48 h ouvrées », « démarrage sous 2 semaines », temps plein, sur site, CDI,
   « Vous recrutez ? ».
2. Le cadre (missions ponctuelles, soir et week-end) apparaît sur l'accueil, dans le pied de page, sur les
   pages d'offre où un délai ou un rythme était promis, et dans la FAQ.
3. `/offres/application-metier` redirige vers `/offres/evolution-application` ; le sitemap ne liste plus
   l'ancienne adresse ; les projets « production » renvoient vers la nouvelle offre.
4. Le bloc recrutement disparaît : bandeau de l'accueil, lien du pied de page, invite de la page projet,
   section `#recrutement` de la page Parcours. Le CV reste téléchargeable depuis l'en-tête de Parcours.
5. Style des textes (consigne du propriétaire) : phrases courtes, faits vérifiables, aucun emoji, aucun
   tiret cadratin dans les textes visibles ; mots exclus : passionné, dynamique, motivé, « n'hésitez pas »,
   « je suis ravi », véritable, « au service de », « solutions sur mesure », « forte de », « riche de ».
6. Aucun changement d'API. Zéro violation AXE, gates habituels.

### Hors périmètre

- Plafond hebdomadaire de rendez-vous (évolution d'API), écarté pour l'instant.
- Profils LinkedIn et Malt : textes rédigés le 16/10, saisie dans Chrome sur demande, enregistrement après
  accord explicite.

## Textes

Chaque ligne donne le fichier, le texte actuel et le texte proposé. `[À VALIDER]` marque un choix que le
propriétaire doit trancher.

### Identité (`shared/identity/site-identity.static-data.ts`)

| Clé                  | Actuel                                                                                                                                   | Proposé                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `availability`       | Disponible pour de nouveaux projets, démarrage sous 2 semaines                                                                           | Missions ponctuelles, le soir et le week-end                                                                                                        |
| `hiringAvailability` | Ouvert à un CDI en Île-de-France…                                                                                                        | **supprimée**                                                                                                                                       |
| `journey`            | Chaudronnier puis tourneur CN de haute précision dans l'aéronautique, je suis aussi développeur web full-stack, issu d'une reconversion. | Chaudronnier puis tourneur CN de haute précision dans l'aéronautique, mon métier aujourd'hui, je suis aussi développeur web full-stack depuis 2025. |

### Accueil

**Accroche** (`home/infra/data/home.static-data.ts`)

- Titre : « Votre site ou votre application web, à prix annoncé, en ligne vite. »
  → « Votre site ou votre application web, à prix annoncé, sur un délai tenu. » (accent inchangé :
  « à prix annoncé »)
- Chapeau : « Pour les TPE, les artisans et les ateliers des Yvelines et d'Île-de-France : site vitrine à
  890 € prix final, en ligne en 7 jours, réponse sous 48 h ouvrées. ${journey} »
  → « ${journey} Je prends des missions freelance ponctuelles, le soir et le week-end, avec une charge
  limitée. Pour les TPE, les artisans et les ateliers : site vitrine à 890 € prix final, périmètre, délai
  et prix fixés au devis avant de commencer. »

**Encart « Cadre de travail »** (`home/domain/home-hero.static-data.ts`)

| Libellé      | Actuel                                            | Proposé                                                     |
| ------------ | ------------------------------------------------- | ----------------------------------------------------------- |
| Prix         | Fixe, annoncé avant de commencer                  | inchangé                                                    |
| Site vitrine | En ligne en 7 jours                               | **Délai** : Fixé au devis, selon la demande                 |
| Réponse      | Sous 48 h ouvrées                                 | Sous 48 h, le soir                                          |
| —            | —                                                 | **Disponibilité** : Le soir et le week-end (nouvelle ligne) |
| Propriété    | Le site, le code et le nom de domaine sont à vous | inchangé                                                    |
| Zone         | Yvelines et Île-de-France, rendez-vous possible   | Yvelines et Île-de-France, rendez-vous possible le samedi   |

**Bandeau recrutement** (`home-recruiter-band`) : **supprimé** du hero, avec sa copie, ses sorties et le
suivi `home_recruiter_*`. LinkedIn, GitHub et le CV restent accessibles par le pied de page et Parcours.

**Méthode** (`home/domain/home-pitch.static-data.ts`)

- Étape « Cadrer », `when` : « jour 1 · 30 min » → « 30 min, le soir ou le samedi »
- Engagement : « Un seul interlocuteur, joignable directement » → « Un seul interlocuteur, joignable le
  soir et le samedi »

**FAQ** (même fichier)

| Question                                                                                                    | Réponse proposée                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Combien de temps pour un site vitrine ?                                                                     | Le délai figure dans le devis. Il dépend des contenus à produire et du nombre de missions en cours : je n'en prends pas plus que je ne peux en tenir. |
| _(nouvelle)_ Pourquoi le soir et le week-end ?                                                              | Je suis tourneur CNC en journée. Je développe le soir et le week-end, et je limite le nombre de missions en cours pour tenir chaque délai annoncé.    |
| Comment est fixé le prix d'une application ? → **Comment est fixé le prix d'une évolution d'application ?** | inchangée (cadrage gratuit de 30 min, devis ferme, avenant)                                                                                           |
| Vous travaillez hors des Yvelines ?                                                                         | Oui, à distance partout en France. En Île-de-France, un rendez-vous sur place est possible le samedi.                                                 |

**SEO de l'accueil** (`app.routes.ts`, description) :
« Sites et applications web livrés en production par un seul interlocuteur : site vitrine en 7 jours,
application sur mesure, maintenance. Yvelines et à distance. »
→ « Sites web et évolutions d'applications Angular et NestJS, à prix annoncé, par un tourneur CNC devenu
aussi développeur. Missions ponctuelles le soir et le week-end, Yvelines et à distance. »

### Pied de page (`layout/components/footer/footer.static-data.ts`)

- `tagline` : « Sites et applications web pour TPE, PME et ateliers. Yvelines et à distance. »
  → « Sites et applications web pour TPE, PME et ateliers. Missions le soir et le week-end, Yvelines et à
  distance. »
- `hiringLink` « Vous recrutez ? » : **supprimé**.

### Projets (`projects/application/project-follow-up-copy.ts`, `projects/domain/related-offer.ts`)

- `text` : « Décrivez-le, je vous réponds sous 48 h ouvrées. » → « Décrivez-le, je vous réponds sous 48 h,
  le soir. »
- `hiringPrompt` / `hiringLink` : **supprimés**.
- Projets `production` → offre `evolution-application`.

### Parcours (`profile/application/about-hiring.ts`)

Section `#recrutement` **supprimée** (composant, entrée de la page, spec). Le CV et LinkedIn restent dans
l'en-tête de la page.

### Parcours, données de l'API (admin `/admin/parcours`, fixture `profile.json`)

| Champ                     | Actuel                                                                                                                                                                                     | Proposé                                                                                                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `biography.paragraphs[0]` | Je ne suis pas venu au développement web par hasard. De la chaudronnerie au tournage CN … J'ai compris que je pouvais avoir plus d'impact en créant ces outils plutôt qu'en les utilisant. | De la chaudronnerie au tournage CN de haute précision dans l'aéronautique, mon métier aujourd'hui, j'ai appris à lire un plan, à respecter une tolérance et à contrôler avant de livrer. Je garde ce métier.             |
| `biography.paragraphs[1]` | Formé dans un environnement où l'erreur coûte cher, … je comprends pourquoi ça fonctionne.                                                                                                 | En parallèle, je me suis formé au développement web. J'ai obtenu le titre de Développeur Web et Web Mobile en 2025. Je développe avec Angular, NestJS, TypeScript et PostgreSQL, et j'héberge moi-même mes applications. |
| `biography.paragraphs[2]` | Cette expérience m'a donné une vision systémique rare : … de vrais problèmes métier.                                                                                                       | Je prends des missions freelance ponctuelles, le soir et le week-end, avec une charge limitée. J'y applique la règle de l'atelier : une pièce hors tolérance ne part pas, un code non testé non plus.                    |
| `whatIDo[1].description`  | …Ce contrôle opérationnel total garantit la fiabilité et fait de moi un développeur plus complet.                                                                                          | Je gère mon infrastructure : auto-hébergement (VPS) et déploiement continu (CI/CD) via Dokploy. Je déploie et je surveille moi-même ce que je livre.                                                                     |
| `motivation.statement`    | La tech au service d'un impact positif : GreenTech, industrie durable, projets qui ont du sens.                                                                                            | Des outils utiles aux petites entreprises et aux ateliers, livrés propres et maintenus.                                                                                                                                  |
| `motivation.description`  | Disponible en freelance sur Malt … et ouvert au CDI en Île-de-France …                                                                                                                     | Missions freelance ponctuelles sur Angular et NestJS, le soir et le week-end, en direct ou via Malt.                                                                                                                     |

### Prise de rendez-vous (`booking/domain/booking-copy.static-data.ts`)

- `emptyDetail` : « …je vous réponds sous 48 h ouvrées. » → « …je vous réponds sous 48 h, le soir. »

### Catalogue des offres (`offer/domain/offer-catalog.static-data.ts`, `offer/offer-seo.ts`)

- Lead : « …Chaque offre précise ce qui est livré, en combien de temps et à quel prix. »
  → « …Chaque offre précise ce qui est livré, comment ça se passe et à quel prix. Le délai est fixé au
  devis. »
- Famille « Applications » : « Pour remplacer un tableur, outiller une équipe ou reprendre un existant. »
  → « Pour faire évoluer, reprendre ou renforcer une application existante. »
- SEO du catalogue : « Sites en 7 jours dès 690 €, application métier dès 4 500 €, refonte, maintenance et
  renfort Angular. Prix annoncé avant de commencer. »
  → « Sites vitrines dès 690 €, évolution d'application, refonte, maintenance et renfort Angular. Prix
  annoncé avant de commencer, missions le soir et le week-end. »

### Site vitrine (`site-vitrine`)

- Résumé `promise` : « Votre site, en ligne en 7 jours. » → « Votre site, à prix fixe et délai annoncé. »
- SEO : titre « Création de site vitrine en 7 jours » → « Création de site vitrine à prix fixe » ;
  description « …en ligne en 7 jours. » → « …délai fixé au devis. » ; `serviceDescription` sans « en ligne
  en 7 jours ».
- Page, titre : « Votre site vitrine, en ligne en 7 jours. » → « Votre site vitrine, à prix fixe et délai
  annoncé. »
- Étapes, titre « Le déroulé en 7 jours » → « Le déroulé » ; `when` : jour 1 → « au départ », jours 2 à 5
  → « selon le devis », jour 6 → « après la prévisualisation », jour 7 → « après validation ».
- Étape « Échanger » : « 20 minutes au téléphone. … » → « 20 minutes au téléphone, le soir ou le samedi.
  Vous m'envoyez textes, logo et photos. »
- Demande : « Je vous réponds sous 48 heures ouvrées. » → « Je vous réponds sous 48 heures, le soir. »

### Site atelier (`site-atelier`)

Mêmes remplacements que le site vitrine (résumé, SEO, titre, étapes), plus :

- Étape « Échanger » : « 20 minutes au téléphone ou à l'atelier, … » → « 20 minutes au téléphone le
  soir, ou à l'atelier le samedi, vous me donnez photos et liste des machines. »
- Demande : « Je vous rappelle sous 48 heures ouvrées. » → « Je vous rappelle sous 48 heures, le soir. »

### Refonte et maintenance (`refonte-maintenance`)

- Étape « Auditer », `when` : « semaine 1 » → « selon le devis » ; détail : « …une restitution d'une
  heure. » → « …une restitution d'une heure en visio, le soir ou le samedi. »
- SEO : « …en Île-de-France et à distance. » → « …à distance, le soir et le week-end. »

### Évolution d'application existante (`evolution-application`, remplace `application-metier`)

**Résumé et SEO**

- Nom : « Évolution d'application existante » ; nom court : « Évolution d'application » ; famille
  `applications` ; mise en avant sur l'accueil : oui.
- Public : « PME et équipes qui ont déjà une application web »
- Promesse : « Une fonctionnalité, un écran ou une correction ajoutés à votre application, à prix ferme. »
- Prix affiché : « À partir de 390 € » (`OFFER_PRICES['evolution-application'] = { projectFromEur: 390 }`)
- SEO : titre « Évolution d'application Angular et NestJS | Julien Nédellec » ; description « Ajout de
  fonctionnalité, correction ou module sur une application Angular ou NestJS existante. Devis ferme après
  un cadrage gratuit de 30 minutes. Missions le soir et le week-end. » ; type de service « Développement de
  fonctionnalités d'application web » ; fil d'Ariane « Évolution d'application ».

**Page**

- Titre : « Ajouter ce qui manque à votre application, sans tout refaire. »
- Sous-titre : « Une fonctionnalité, un écran, un export, une correction. Je cadre la demande avec vous et
  je livre en production, par étapes courtes. »
- Bouton : « Décrire mon besoin »
- « Quand faire appel à moi » :
  - **Une fonctionnalité attend** : votre équipe n'a pas le temps de la développer.
  - **Une ressaisie vous coûte** : un export, un import ou un écran supprimerait la double saisie.
  - **La demande est précise** : elle se chiffre ferme et se livre sans dérive.
- « Ce qui est livré » : Cadrage écrit (comportement attendu, critères de validation) · Code intégré à
  votre dépôt, revu et testé · Tests automatisés sur la règle ajoutée · Mise en production ou livraison à
  votre équipe · Note de livraison.
- « Comment ça se passe » :
  - **Cadrer** (appel de 30 min) : Vous décrivez le besoin. Je lis le code concerné, puis vous recevez un
    devis ferme : périmètre, délai, prix.
  - **Développer** (selon le devis) : Le soir et le week-end, sur une branche dédiée, avec un lien de
    test quand c'est possible.
  - **Livrer** (après validation) : Mise en production, ou demande de fusion à votre équipe.
- Tarif : une ligne « Évolution », montant `from` 390 €, libellé « À partir de 390 € », « Devis ferme après le cadrage. Ce qui n'y figure pas
  fait l'objet d'un avenant que vous validez avant. » La maintenance reste portée par l'offre « Refonte et
  maintenance ».
- FAQ :
  - Sur quelles technologies intervenez-vous ? Angular, NestJS, TypeScript et PostgreSQL. Pour une autre
    technologie, je vous le dis avant de commencer.
  - Et si la demande grossit en cours de route ? Ce qui n'est pas dans le devis fait l'objet d'un avenant
    que vous validez avant.
  - Le cadrage est payant ? Non, le premier échange de 30 minutes est gratuit.
  - Et si le code existant est en mauvais état ? Je vous le dis au cadrage et je vous propose d'abord un
    audit (offre « Refonte et maintenance »).
- Demande : sujet « Évolution de mon application » ; intro « Décrivez ce que vous voulez ajouter ou
  corriger, et la technologie de l'application si vous la connaissez. »

### Renfort Angular / NestJS (`renfort-freelance`, adresse inchangée)

- Nom : « Renfort ponctuel Angular / NestJS » ; nom court inchangé ; public inchangé.
- Promesse : « Une tâche Angular ou NestJS confiée et livrée, le soir et le week-end. »
- SEO : titre « Développeur Angular / NestJS freelance, missions ponctuelles | Julien Nédellec » ;
  description « Développeur full-stack Angular et NestJS en freelance, à distance, pour des tâches
  ponctuelles livrées le soir et le week-end. TJM sur demande, contrat direct ou via Malt. »
- Page, titre : « Une tâche Angular ou NestJS, confiée et livrée. »
- Sous-titre : « À distance, le soir et le week-end. Je prends une tâche bien délimitée, je travaille dans
  votre dépôt et je livre une demande de fusion revue et testée. »
- Raison « Autonome » : « …avant de poser des questions, et je travaille sans réunion quotidienne. »
- Conditions : « Temps partiel, contrat direct ou via Malt. Démarrage sous 2 semaines. » → « Missions
  ponctuelles, à distance, le soir et le week-end. Contrat direct ou via Malt. »
- FAQ :
  - Quelles tâches ? Une fonctionnalité, des tests, une montée de version, une revue de code. Ce qui se
    décrit dans un ticket et se livre en demande de fusion.
  - Quel rythme ? Le soir en semaine et le week-end, avec un volume d'heures fixé ensemble au départ. Pas
    de temps plein ni de présence quotidienne. _(remplace « Temps plein ou temps partiel ? »)_
  - À distance ou sur site ? À distance uniquement. Les échanges se font par écrit, ou en visio le soir.
  - Comment contractualiser ? inchangée.
- Demande, intro : « Indiquez la stack, la durée, le rythme et le mode (distance ou sur site). »
  → « Indiquez la stack, la tâche, le volume estimé et l'échéance. »

## Plan technique

Changement de contenu sans nouvelle abstraction : pas d'ADR. Tranches :

- **T1** : identité, accueil, pied de page, projets, prise de rendez-vous, textes des offres existantes,
  fixture `profile.json`, garde-fou éditorial.
- **T2** : offre `evolution-application` (slug, prix, catalogue, page, SEO, `related-offer`,
  redirection) et renfort recentré.
- **T3** : suppression du bloc recrutement (accueil, pied de page, projets, Parcours), scénarios AXE.

Points identifiés :

- `OfferSlug` : `application-metier` → `evolution-application` (modèle, prix, catalogue, pages, SEO,
  `related-offer`, specs). Redirection dans `app.routes.ts` sur le modèle de `offre-site-industrie`.
- Les statistiques d'audience de l'ancienne offre restent en base sous l'ancien slug : vérifier le rendu
  de `audience-conversions-view` pour un slug inconnu.
- Suppressions : `home-recruiter-band` (+ copie, sorties du hero, suivi dans `home.ts`), `about-hiring`,
  `hiringLink` du pied de page, invite de `project-follow-up`, `hiringAvailability`. Mettre à jour
  `testing/editorial-sources.ts`, les specs concernées et les scénarios AXE.
- Garde-fou : étendre `FORBIDDEN_IDENTITIES` (`editorial-identity.spec.ts`, parcours de
  `EDITORIAL_SOURCES`) avec « 7 jours », « sept jours », « ouvrées », « CDI », « recrutez »,
  « démarrage sous », « sur site en », « temps partiel », et ajouter `BOOKING_PAGE_COPY` aux sources.

## Plan de test

Plan sans sous-section `### Tranches` formelle : les trois tranches T1 à T3 du plan sont jouées en une
seule passe RED, à la demande de la session principale. Une seule preuve globale (une exécution de
`pnpm test`, sortie 1), répartie ci-dessous par tranche. Typecheck et format verts : les specs ne
référencent `evolution-application` que par des chaînes et des recherches typées `string`, pour compiler
avant comme après le renommage de `OfferSlug`.

Sweeps faits (fichiers balayés) : grep des anciens textes et motifs (« 7 jours », « sept jours »,
« jour N », « ouvrées », « CDI », « recrutez », « démarrage sous », « sur site en », « temps partiel »,
`application-metier`, `hiring*`, `home-recruiter*`, `about-hiring`, `#recrutement`) sur `src/**/*.spec.ts`,
`src/app/testing`, `e2e`, `ci/api-stub`. Fichiers adaptés : `editorial-identity`, `editorial-sources`,
`site-identity.static-data`, `home.static-data`, `home-hero.static-data`, `home-pitch.static-data`,
`home-hero-section`, `home`, `home-offers`, `footer`, `project-follow-up`, `project-detail`,
`related-offer`, `booking-copy.static-data`, `offer-prices`, `offer-catalog`, `offer-pages`, `offer-seo`,
`offer-page`, `offer-catalogue`, `group-offers-by-family`, `audience-conversions-view`, `app.routes`,
`app.routes.home`, `app.routes.about`, `about`, `ssr-public-links`. Supprimés avec leur composant :
`home-recruiter-band.spec.ts`, `about-hiring.spec.ts`. `e2e/a11y` : aucune référence au bloc recrutement ni
à l'ancienne offre, rien à adapter.

Ambiguïtés de la spec (textes non épinglés mot à mot, à trancher par le propriétaire) :

1. FAQ « Pourquoi le soir et le week-end ? » : la réponse proposée commence par « Je suis tourneur CNC »,
   que le garde-fou existant `« Je suis tourneur CN »` refuse. Les tests exigent « tourneur CNC »,
   « le soir et le week-end » et « délai annoncé », pas la tournure.
2. Méta descriptions de 160 caractères au plus (règle existante) : accueil proposé 188, évolution 179,
   renfort 171. Les tests gardent la limite et vérifient les éléments clés, pas le texte exact.
3. Le nouveau `journey` (147 caractères) porte la méta de Parcours (`${journey} Parcours, stack et CV.`) à
   170 : le suffixe doit raccourcir (par exemple « Stack et CV. », 160 tout juste). Le test exige le
   journey puis un suffixe finissant par « CV. ».
4. Position de la nouvelle question de FAQ : épinglée en deuxième (ordre du tableau de la spec).
5. Site atelier, « mêmes remplacements » : titre épinglé « Le site de votre atelier, à prix fixe et délai
   annoncé. », description SEO vérifiée par « délai fixé au devis ». La `serviceDescription` du renfort
   (« sur site en Île-de-France ») et celle de l'atelier (« en ligne en 7 jours ») n'ont pas de texte
   proposé : seul le garde-fou les contraint.

### Tranche 1 — Textes, fixture et garde-fou éditorial

- `editorial-identity` — garde-fou étendu (9 motifs, mot entier pour « CDI », valeurs techniques type URL
  ignorées) sur `EDITORIAL_SOURCES` + `src/index.html` (méta statiques « 7 jours ») ; contrôles du motif
  CDI (`Cdi5Tz…`, « tourneur CNC » non signalés) ; le cadre « le soir et le week-end » présent dans
  disponibilité, chapeau, méta de l'accueil, encart, FAQ, pied de page, méta du catalogue, sous-titre du
  renfort, méta de l'évolution, motivation de la fixture `profile.json`.
- `editorial-sources` — `BOOKING_PAGE_COPY` ajouté, `HOME_RECRUITER_BAND_COPY` retiré.
- `site-identity.static-data` — `availability` et `journey` exacts.
- `home.static-data` — titre et chapeau exacts (journey une fois, prix du site vitrine).
- `home-hero.static-data` — encart : lignes Délai, Réponse, Disponibilité, Zone.
- `home-pitch.static-data` — étape Cadrer, engagement, sept questions dans l'ordre, réponses exactes,
  réponse « Pourquoi le soir et le week-end ? » par invariants (voir ambiguïté 1).
- `footer` (copie), `project-follow-up` (texte), `booking-copy` (`emptyDetail`), `offer-catalog`
  (promesses, SEO site vitrine, atelier et refonte, chapeau du catalogue, famille Applications),
  `offer-pages` (site vitrine, atelier, refonte : titres, étapes, demandes), `app.routes.home`
  (méta par invariants, voir ambiguïté 2), `app.routes.about` (méta : journey puis suffixe, voir
  ambiguïté 3).

RED confirmé via la commande test du profil le 2026-10-16 17:38, 58 failed / 5123 total pour cette
tranche (sur 114 failed / 5123 total pour la passe). Nature : 100 % `AssertionError` (valeurs attendues
non trouvées, chemins fautifs listés par le garde-fou) ; aucune erreur de harnais.

### Tranche 2 — Offre « Évolution d'application » et renfort recentré

- `offer-prices` — golden : `evolution-application: { projectFromEur: 390 }`.
- `offer-catalog` — ordre, nom court, nom et `priceTeaser` « À partir de 390 € », promesse, public, SEO
  (titre, type de service, fil d'Ariane ; description par invariant, voir ambiguïté 2) ; renfort : nom,
  promesse, titre SEO.
- `offer-pages` — évolution : en-tête, raisons, étapes, ligne de tarif unique, questions, demande,
  compteurs ; renfort : sous-titre, raison Autonome, conditions, quatre questions, réponses Rythme et
  Distance, demande.
- `offer-seo` — offres schema.org de l'évolution (`minPrice` 390, sans maintenance), méta du catalogue.
- `app.routes` — `/offres/application-metier` redirige vers `/offres/evolution-application` (route et
  navigation réelle).
- `related-offer`, `project-detail`, `project-follow-up` — projets `production` vers la nouvelle offre.
- `audience-conversions-view` — `offer_evolution-application` nommé, `offer_application-metier` en
  emplacement inconnu.
- `home-offers`, `offer-catalogue`, `group-offers-by-family`, `offer-page` — adaptation iso-invariant au
  nouveau slug (listes nommées par slug, compteur de démos par défaut à 0).

RED confirmé via la commande test du profil le 2026-10-16 17:38, 47 failed / 5123 total pour cette
tranche. Nature : `AssertionError` uniquement (offre absente : `undefined` attendu face aux valeurs).

### Tranche 3 — Suppression du bloc recrutement

- `home-hero-section` — le premier écran ne propose que les deux appels et le lien de réservation.
- `about` — au premier rendu, seul le haut de page est rendu (plus de section `#recrutement`) ; le seul
  lien CV vit dans le haut de page ; sans CV, LinkedIn reste dans les réseaux du haut de page.
- `footer` — la colonne Ressources ne liste que Réalisations, Blog, Parcours.
- `project-follow-up` — le seul lien du bloc mène à l'offre liée.
- `site-identity.static-data` — clés exposées sans `hiringAvailability` ; garde-fou « recrutez » et « CDI ».
- `home` — describe du bandeau retiré ; `ssr-public-links` repointé sur `AboutHero` (adaptation
  mécanique, vert avant et après).

RED confirmé via la commande test du profil le 2026-10-16 17:38, 9 failed / 5123 total pour cette
tranche. Nature : `AssertionError` uniquement (éléments `app-about-hiring`, `home-recruiter-*`,
`/about#recrutement` présents dans le DOM rendu).

Adaptation mécanique : `ssr-public-links.spec.ts` (hôte `AboutHero` au lieu du bandeau, href attendu
inchangé) et `offer-page.spec.ts` (compteur de démos indexé par chaîne, 0 par défaut) — 2 sites
repointés, aucune valeur attendue modifiée. Exemples repointés hors de `application-metier`, valeur
attendue dérivée de l'entrée : `offer-page.spec.ts` (mesure du clic, `renfort-freelance`) et
`offer-seo.spec.ts` (`makeOfferSummary`, `refonte-maintenance`).

## Journal

- 2026-10-16 : arbitrages recueillis, créneaux saisis dans l'admin, textes proposés (ce document) ;
  derniers choix tranchés par délégation (prix 390 €, chapeau conforme aux règles d'identité, Parcours
  dans le périmètre).

## Arbitrages après RED (2026-10-16, par délégation)

1. FAQ « Pourquoi le soir et le week-end ? » : « En journée, je travaille à l'atelier comme tourneur CNC.
   Je développe le soir et le week-end, et je limite le nombre de missions en cours pour tenir chaque délai
   annoncé. » (respecte le garde-fou « Je suis tourneur CN »).
2. Méta descriptions ramenées sous 160 caractères :
   - accueil : « Sites web et évolutions d'applications Angular et NestJS, à prix annoncé. Missions ponctuelles le
     soir et le week-end, Yvelines et à distance. »
   - évolution : « Ajout de fonctionnalité ou correction sur une application Angular ou NestJS existante. Devis
     ferme après un cadrage gratuit. Le soir et le week-end. »
   - renfort : « Développeur Angular et NestJS freelance, à distance, pour des tâches ponctuelles livrées le
     soir et le week-end. TJM sur demande, en direct ou via Malt. »
3. Méta de Parcours : suffixe « Stack et CV. ».
4. Nouvelle question de FAQ en deuxième position ; titre atelier « Le site de votre atelier, à prix fixe et
   délai annoncé. ».
5. `serviceDescription` : atelier « Site vitrine pour ateliers d'usinage et de décolletage, avec
   maintenance mensuelle. » ; renfort « Renfort développeur full-stack Angular et NestJS, à distance, pour
   des tâches ponctuelles. »

## Implémentation

- Textes repris mot pour mot de `## Textes` et de `## Arbitrages après RED` (méta accueil, évolution et
  renfort, suffixe « Stack et CV. », FAQ « Pourquoi le soir et le week-end ? » en deuxième position,
  `serviceDescription` atelier et renfort). L'offre évolution n'a pas de `serviceDescription` (aucun texte
  proposé, champ optionnel : le `Service` schema.org sort sans description).
- Redirection : route `offres/application-metier` dans `app.routes.ts`, placée avant la route lazy
  `offres`. En production nginx répond 404 à toute URL non prérendue : une location
  `^/offres/application-metier/?$` (301 relatif, query conservée) est ajoutée au `Dockerfile` sur le
  modèle de `offre-site-industrie`, avec la vérification correspondante dans `.github/workflows/ci.yml`.
  Sitemap (`src/server/feeds/sitemap.ts`) et `app.routes.server.ts` dérivent de `OFFERS` : rien à changer.
- Suppressions : `home-recruiter-band` (composant, copie, sorties `hiringOpened`/`cvDownloaded`/
  `linkedinOpened`/`githubOpened` et `cvUrl` du hero, suivi `home_recruiter_*`, et `CvDownload` de `Home`
  qui ne servait qu'au bandeau), `about-hiring`, `hiringLink` du pied de page, invite et sortie
  `hiringOpened` de `project-follow-up` (+ suivi `project_hiring` de `project-detail`),
  `SITE_IDENTITY.hiringAvailability`.
- Tests corrigés (contradiction manifeste avec la spec, signalée) :
  - `offer-catalogue.spec.ts` : le chapeau attendu était l'ancien texte, contredit par
    `offer-catalog.static-data.spec.ts` et par `## Textes` ; aligné sur le nouveau chapeau.
  - `offer-catalog.static-data.spec.ts` : la méta de l'évolution arbitrée finit par « Le soir et le
    week-end. » (majuscule) ; drapeau `i` ajouté à la regex. La méta du renfort arbitrée commence par
    « Développeur Angular et NestJS freelance, à distance, » ; le préfixe de la regex suit l'arbitrage.

## Journal des tranches

- **Tranche 1 — textes, fixture et garde-fou éditorial** : GREEN (passe unique T1 à T3) 5123 passed / 5123 total · refactor : aucun
- **Tranche 2 — offre « Évolution d'application » et renfort recentré** : GREEN 5123 passed / 5123 total · refactor : aucun
- **Tranche 3 — suppression du bloc recrutement** : GREEN 5123 passed / 5123 total · refactor : `CvDownload` retiré de `Home` (plus aucun consommateur après le bandeau)

## Verify

Gates (2026-10-16) :

- `pnpm test` : `Test Files 255 passed (255)`, `Tests 5123 passed (5123)`, code de sortie lu `exit=0`.
- `pnpm lint` : « All files pass linting. », sortie 0.
- `pnpm run build --configuration production` : sortie 0, « Prerendered 9 static routes », CSP durcie
  sur 10 pages ; `dist/.../browser/offres/` contient `evolution-application` et plus `application-metier` ;
  aucune page HTML générée ne contient « 7 jours », « ouvrées », « recrutez » ni « application-metier ».
- `grep -rn` sur `src/` et `ci/` : « ouvrées » et « recrut » n'apparaissent plus que dans des specs
  (motifs du garde-fou, `describe('public recruteur')` de `header.spec.ts`) ; « application-metier »
  seulement dans la redirection `app.routes.ts:160` et des specs ; « 7 jours » subsiste dans le filtre de
  période de l'admin d'audience (`admin-audience.ts:32`, libellé d'une période de 7 jours, hors site
  public) et dans des specs.

Runtime (`pnpm start`, navigateur intégré) : **PASS**

1. `/offres/application-metier` : l'URL devient `/offres/evolution-application`, h1 « Ajouter ce qui
   manque à votre application, sans tout refaire. », prix « À partir de 390 € » (capture
   `scratchpad/verify/evolution-application.jpg`).
2. `/` : h1 « …, à prix annoncé, sur un délai tenu. », disponibilité « Missions ponctuelles, le soir et le
   week-end », encart Délai / Réponse / Disponibilité / Zone conformes, aucun `home-recruiter-*`, pied de
   page sans lien recrutement et avec le nouveau slogan (capture `scratchpad/verify/home-hero.jpg`).
3. `/about` : ni `app-about-hiring` ni `#recrutement`.
4. Console : aucune erreur Angular (`NG0…`) ; seules erreurs, des 502 sur `/api/*` (aucune API locale
   derrière le proxy de dev), sans lien avec le diff.

## Review code

**Verdict** : REJECTED
**Gates CI locaux** : install `pnpm install --frozen-lockfile` exit 0 / tests `pnpm test` exit 0 (255 fichiers, 5123 passed) / lint `pnpm lint` exit 0 / build `pnpm run build --configuration production` exit 0 (9 routes prérendues, CSP sur 10 pages) / `pnpm run format:check` exit 0
**Checks mécaniques** : checker non vendoré : auto-checks joués à la main (export default, effect nu, helpers zone, archéologie, tests exclus, sécurité, snapshot sur les lignes ajoutées : 0 hit ; `/// <reference types="node" />` est une directive TS, pas un commentaire)
**Warnings de gate** : aucun (test, lint, build, format : sorties lues en entier)
**Rendu compilé** : N/A (aucun composant `shared/ui/**` touché ; pages de feature vérifiées au runtime)
**Preuve de verify runtime** : ✅ (`## Verify` complète, et rejouée sur l'image Docker : `/offres/application-metier?utm_source=x` → 301 `Location: /offres/evolution-application?utm_source=x`, `/` et `/about` sans bloc recrutement, sitemap à jour ; AXE `pnpm a11y` 91 passed, exit 0)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ❌
**Sécurité** : ✅
**Alignement spec** : ❌

**Tests notables** :

- ✨ `src/app/editorial-identity.spec.ts` : garde-fou étendu à `src/index.html`, motif CDI triangulé (vrais positifs et faux positifs `Cdi5Tz…`, « tourneur CNC »).
- ✨ `src/app/app.routes.spec.ts` : redirection testée par navigation réelle jusqu'à l'offre résolue, pas seulement par la table de routes.
- Corrections du GREEN légitimes : `offer-catalogue.spec.ts` (chapeau resté sur l'ancien texte, oubli du sweep RED ; nouvelle valeur = `## Textes` mot pour mot), `offer-catalog.static-data.spec.ts` (drapeau `i` et préfixe du renfort alignés sur `## Arbitrages après RED`).

**Risque résiduel** :

- réversibilité, monitoring : profil absent, livraison et monitoring non renseignés.
- non couvert par les gates : `/offres/evolution-application` et `/offres/renfort-freelance` ne sont pas dans `e2e/a11y/scenarios.ts` (trou antérieur, la page `application-metier` n'y était pas non plus).

**Points à corriger** :

1. `src/app/features/home/pages/home/home.spec.ts:22-23,119,169` et `:66,74,81,87` : échafaudage de test mort après le retrait du bandeau. `Home` n'injecte plus `CvDownload` et aucun enfant ne consomme `CvGateway` ; retirer les imports `CvGateway`/`stubCvGateway`, les deux providers `{ provide: CvGateway, … }` et le mock `trackCvDownload` d'`AnalyticsStub` (plus aucune assertion ne le lit).
2. `src/app/features/offer/domain/offer-catalog.static-data.ts:114` : `serviceType: 'Développement logiciel en régie'` publie encore « en régie » dans le JSON-LD de `/offres/renfort-freelance` (constaté dans `dist/…/offres/renfort-freelance/index.html`), alors que la spec retire « régie » du titre SEO, de la description et de la `serviceDescription` (Description : « régie sur site » parmi les promesses à retirer ; arbitrage 6). Remplacer par un type de service cohérent avec des tâches ponctuelles (texte à faire valider), et ajouter « régie » à `FORBIDDEN_IDENTITIES` (`OFFERS` est déjà dans `EDITORIAL_SOURCES`).

## Corrections après revue (2026-10-16)

- `home.spec.ts` : imports, providers `CvGateway` et mock `trackCvDownload` morts retirés.
- Renfort : `serviceType` « Développement Angular et NestJS à distance », ligne de tarif « Mission » (au
  lieu de « Régie ») ; motif « régie » ajouté au garde-fou.
- Négations « Pas de temps plein » et « À distance ou sur site ? » conservées : elles disent le cadre, le
  garde-fou ne vise que « sur site en » et « temps partiel ».
