---
id: 019
title: Textes et parcours (identité unique, entrée recruteur, culs-de-sac, preuve sociale prête)
type: content
status: draft
created: 2026-10-10
related: [docs/adr/0019-suite-editoriale-d-une-fiche-projet-cote-front.md, docs/adr/0020-theme-de-blog-vide-masque.md, docs/adr/0010-champs-editoriaux-et-presentation-par-nature.md, docs/adr/0011-themes-du-blog-derives-du-catalogue-de-tags.md, specs/009-copy-offres.md, specs/017-intake-audit-decoupage.md]
---

# 019 — Textes et parcours

## Description

### Contexte (audit du 2026-10-10)

Le site est clair pour un client TPE/PME, mais :

1. **Aucune preuve sociale** : ni avis, ni moyen d'en recueillir.
2. **Le recruteur n'a pas d'entrée visible** : « Vous recrutez ? » n'existe qu'en pied de page ; le
   bouton CV de `/about` est injecté après hydratation, en bas de page
   (`features/profile/pages/about/about.ts:108-127`), donc absent du HTML prérendu.
3. **Identité incohérente** d'une page à l'autre : « aujourd'hui développeur full-stack »
   (`features/home/infra/data/home.static-data.ts:7`) ; « aujourd'hui tourneur CN »
   (`features/profile/infra/data/profile.static-data.ts:22`, meta `app.routes.ts:83`) ; « Je suis
   tourneur CN » (`features/offer/domain/offer-pages.static-data.ts:176`) ; « tourneur CN, puis
   développeur full-stack » (`features/home/domain/home-pitch.static-data.ts:46`) ; « métallurgie »
   (`profile.static-data.ts:21,25`, `home-pitch.static-data.ts:53`).
4. **Culs-de-sac** : fiche projet sans appel de fin ; « Décrire mon projet » (en-tête, et pied de
   page) renvoie à l'accueil depuis une page d'offre qui a pourtant son formulaire
   (`layout/components/header/header.ts:174-176`, `core/navigation/section-scroller.ts:32`) ; filtre
   blog « Ingénierie 0 article ».
5. **Titres génériques** : `/projects`, `/about`, `/blog`.

### Faits validés par le propriétaire (ne rien publier au-delà)

- **Identité** : parcours industriel dans l'aéronautique, chaudronnier puis aujourd'hui tourneur CN
  de haute précision ; en parallèle, développeur web full-stack issu d'une reconversion, Angular
  principalement (stack du site : Angular / NestJS), aussi PHP, Java, méthode agile. Formulée **de
  façon identique partout**. **Rien sur l'employeur, rien sur un départ ou une démission.** Le
  freelance est à temps partiel.
- **Arbitrages du 2026-10-10** : **aucune durée** de parcours publiée (ni « vingt ans » ni
  « 20 ans ») ; « Ouvert à un CDI en Île-de-France » est **conservé tel quel**
  (`SITE_IDENTITY.hiringAvailability`, `STATIC_MOTIVATION`), sans employeur ni départ ; prix d'appel
  de l'accueil = **prix du site vitrine**, lu depuis les données d'offres ; temps partiel : pas de
  nouvelle mention (reste sur l'offre renfort) ; pas d'URL publique de fiche Google ⇒ pas de
  `sameAs` Google.
- **Engagements affichables** : réponse sous 24 h ouvrées ; le client est propriétaire du site, du
  code et du nom de domaine ; zone Yvelines / Île-de-France, rendez-vous possibles.
- **DashFlow et CandiDash** : usage personnel (le propriétaire et sa famille), aucune donnée chiffrée
  d'utilisateurs.
- **Fiche Google Business** : lien de **rédaction** d'avis `https://g.page/r/Cdi5TzDRplmKECE/review`
  (ce n'est pas l'URL publique de la fiche).

### Ce qui est attendu

1. **Accueil** : accroche réécrite (zone, cible TPE / artisans / ateliers, prix annoncé, réponse
   sous 24 h, site vitrine en 7 jours) ; cartouche « Cadre de travail · réf. JN-2026 » gardé dans
   son style, contenu lisible par un artisan ; **bandeau recruteur discret** (« Vous recrutez ?
   CV (PDF) · LinkedIn · GitHub », sans point médian après l'entrée recruteur) : dans le premier écran en desktop ; en mobile (375×667), où le
   titre et l'accroche occupent le premier écran, il suit immédiatement les boutons d'appel
   (deuxième écran), l'entrée recruteur du premier écran mobile étant le menu (« Parcours »).
   Arbitrage de la session du 2026-10-10. Jamais de séparateur seul en début ou en fin de ligne.
2. **`/about`** : identité harmonisée, lien CV présent **dans le HTML prérendu**, en haut de page,
   meta alignée.
3. **Offre atelier** : phrase d'identité harmonisée.
4. **Fiches projet** : une phrase « problème → résultat » avant la technique, la mention d'usage
   personnel, et un **bloc de fin** « Un besoin similaire ? » (offre liée) + « Vous recrutez ? »
   (parcours et CV).
5. **« Décrire mon projet »** (en-tête et pied de page) : sur une page d'offre, amène au formulaire
   local (`#demande`) au lieu de l'accueil.
6. **Blog** : les thèmes à 0 article ne sont plus affichés (filtres et cartouche).
7. **Titres et meta d'intention** : `/projects`, `/about` et `/blog` (titre validé, TXT-16).
8. **Avis clients prêts** : composant + données vides → **rien de rendu** tant qu'aucun avis réel ;
   JSON-LD `Review` seulement avec des avis réels ; **aucun faux avis**, même en exemple dans les
   données de production (les tests passent par des builders). Appel discret à laisser un avis sur
   Google, sans laisser croire que des avis existent déjà.

### Règles Google pour les avis (à respecter, non négociables)

- **Pas de sollicitation sélective** (« review gating ») : le lien est proposé à tout client, sans
  filtrer d'abord les clients satisfaits ni orienter les mécontents ailleurs.
- **Pas de contrepartie ni d'incitation** (remise, cadeau, échange d'avis).
- **Pas de faux avis**, pas d'avis rédigé pour un client, pas d'avis du propriétaire sur lui-même.
- Le lien `g.page/r/…/review` est un lien de rédaction : il **n'entre pas** dans le `sameAs` du
  JSON-LD. L'URL publique de la fiche, si le propriétaire la fournit, pourra y entrer (hors
  périmètre tant qu'elle n'est pas donnée).
- Publier le nom d'un auteur d'avis sur le site suppose son accord (RGPD) : un avis Google recopié
  sur le site exige l'accord de son auteur.

### Hors périmètre

- Évolution de l'API (aucune n'est nécessaire, cf. ADR-0019).
- Widget, script ou iframe Google (avis embarqués) : refusés (CSP, performance).
- Nouvelle mention du temps partiel (arbitrage : elle reste sur l'offre renfort uniquement).
- **Article de blog « De 20 ans de métallurgie à développeur Full-Stack »** (slug
  `de-20-ans-de-metallurgie-a-developpeur-full-stack`, 8 mentions de la durée dans le contenu servi
  par l'API, vérifié le 2026-10-10) : contenu API, hors de cette PR front. Action du propriétaire
  dans l'admin ; changer le slug casse l'URL indexée (prévoir une redirection, ou ne retoucher que
  titre et corps). Les fixtures de test qui reprennent ce titre ne sont pas publiées et restent.
- Meta de l'accueil (`app.routes.ts:22`), inchangée.

## Plan technique

> Profil lu. Validation runtime aux frontières non vérifiée (aucune lib côté front, inchangé).
> ADR créés : **ADR-0019** (suite éditoriale d'une fiche projet côté front), **ADR-0020** (thème de
> blog vide masqué, remplace ADR-0011 §4).

### Constats vérifiés (2026-10-10)

- **CV** : `GET /api/cv` renvoie les **métadonnées** (`CvInfo | null`), pas l'URL. L'URL de
  téléchargement est **stable et publique** : `${API_BASE_URL}/cv/download`
  (`features/cv/infra/gateways/http-cv.gateway.ts:41-43` ; API `src/cv/cv.controller.ts:84-100`,
  `Content-Disposition: attachment`, 404 sans CV). `/cv` figure déjà dans `PUBLIC_READ_PATHS` du
  transfer cache (`app.config.ts:135`, `includeRequestsWithCredentials: true`) : une lecture faite
  au prérendu est sérialisée et rejouée sans requête à l'hydratation. Seule raison du rendu
  post-hydratation actuel : `afterNextRender(() => this.loadCvUrl())` (`about.ts:108-110`).
- **Mesure** : `cv_download` émis au clic du lien CV de `/about` (`about.ts:116-118`) ;
  `cta_click` via `AnalyticsGateway.trackCtaClick(ctaId, label)` (ids existants `home_hero_contact`,
  `home_hero_offers`, `header_contact`). Ajouter un id ne demande rien côté API (label libre).
- **Offre** : le formulaire local est `<div id="demande">` (`offer-page.ts:58`) ; le CTA du hero de
  l'offre y mène par `routerLink="." fragment="demande"` (`offer-hero.ts:25`) ; `anchorScrolling`
  activé (`app.config.ts:149`). `SectionScroller.scrollTo` renvoie à `/` hors accueil (`:32`). Le
  pied de page a le même défaut (`footer.ts:152-154`).
- **Projets** : six projets en production (slugs `dashflow`, `candidash`, `le-vieux-comptoir`,
  `coaching-life`, `labelsync-pro`, `gitpush-auto`) ; l'en-tête de fiche enchaîne `h1` puis la
  description technique (`project-detail-header.ts:34-43`) ; la fiche finit sur
  `ProjectDetailNav` (`project-detail.ts:66`). Les deux démos sont déjà les exemples de l'offre site
  vitrine (`offer-pages.static-data.ts:52-74`).
- **Blog** : thèmes à 0 gardés inactifs par ADR-0011 §4 (`blog-list-view.ts:88-99`,
  `shared/ui/filter-group.ts:7,25,46`) ; le cartouche liste les cinq thèmes (`blog-list.ts:63-69`).
- **Typographie** : `src/app/editorial-typography.spec.ts` parcourt `EDITORIAL_SOURCES` ; toute
  nouvelle source de texte y est ajoutée. Les textes de cette spec écrivent les espaces insécables
  en échappements `\u00a0` (avant `:`, `€`, entre `24` et `h`) et `\u202f` (avant `? ! ;`), jamais
  en caractère littéral.
- **CSP** : définie dans `Dockerfile` + `<meta>` par page (`scripts/apply-csp-hashes.mjs`). Un lien
  sortant n'est soumis à aucune directive ; la spec n'ajoute **aucun** script, iframe ni image
  Google (vérification `qa` en T10 : `grep -r "google" src/index.html` inchangé).

### Architecture

Couches touchées : `shared/identity` (constantes), données statiques de `home` / `profile` /
`offer` / `projects` (domaine ou infra selon le précédent), composants `application`, pages
`About` / `Home` / `ProjectDetail` / `BlogList`, shell (`Header`, `Footer`), `core/navigation`,
`app.routes.ts`. Aucun store, aucun gateway nouveau, aucune évolution d'API.

```
SITE_IDENTITY.journey ─┬─ STATIC_HERO.lead (accueil)
                       ├─ STATIC_BIOGRAPHY.lead (/about) ─ meta /about
                       └─ OFFER_PAGES['site-atelier'].hero.subtitle

CvGateway.getCurrent() ── CvDownload (facade, providers de Home et About) ── url: Signal<string|null>
      (prérendu + transfer cache)          ├─ AboutHero (lien haut de page) ┐ (cvDownloaded) → CvDownload.track()
                                           ├─ AboutHiring (#recrutement)     │      → trackCvDownload()
                                           └─ HomeRecruiterBand (via HomeHeroSection) ┘

route data { requestAnchor: 'demande' } (offres) ── SectionScroller.scrollToRequestForm()
                                                     ├─ Header « Décrire mon projet »
                                                     └─ Footer « Décrire mon projet »
```

Décisions :

1. **Identité = une constante, `SITE_IDENTITY.journey`** (`shared/identity/site-identity.static-data.ts`),
   composée dans chaque texte qui présente le parcours. « Identique partout » devient vérifiable :
   un spec d'invariant (`editorial-identity.spec.ts`) exige la constante dans les quatre textes
   porteurs et interdit les formulations divergentes dans toutes les sources éditoriales.
2. **CV prérendu, lien direct + lien de parcours (les deux).** Facade `CvDownload`
   (`features/cv/application/cv-download.ts`, `@Injectable()` **non root**, fournie par `Home` et
   `About`) : `rxResource` sur `CvGateway.getCurrent()`, `url = computed(() => hasValue() &&
   value() ? gateway.getDownloadUrl() : null)`, et `track()` qui appelle
   `AnalyticsGateway.trackCvDownload()`. La lecture a lieu au prérendu, le transfer cache la rejoue :
   le lien est dans le HTML, sans requête ni décalage à l'hydratation. CV absent ou API en erreur au
   build → `url()` nul → lien CV non rendu (jamais de lien 404). `About` perd `CvGateway`,
   `afterNextRender`, `loadCvUrl` et le signal `cvUrl` local. Le bandeau d'accueil porte **aussi**
   « Vous recrutez ? » en lien vers `/about#recrutement`, qui reste une entrée même sans CV.
   Mesure : **chaque** lien CV émet `cv_download` (et rien d'autre) ; le compteur admin
   « Téléchargé » reste juste.
3. **Bouton « Décrire mon projet » contextuel par donnée de route**, pas par sonde DOM ni état
   partagé : les routes d'offre déclarent `data: { requestAnchor: OFFER_REQUEST_FRAGMENT }`.
   `SectionScroller.scrollToRequestForm()` lit la donnée sur la route active la plus profonde
   (`router.routerState.snapshot.root` → dernier `firstChild`) : présente → défilement et focus sur
   place (`_scrollWhenStable`, mêmes centrage et focus que l'accueil) ; absente →
   `scrollTo('contact')` (comportement actuel). L'en-tête **et** le pied de page l'appellent. La clé
   `REQUEST_ANCHOR_DATA_KEY = 'requestAnchor'` est exportée de `section-scroller.ts` ;
   `OFFER_REQUEST_FRAGMENT = 'demande'` rejoint `features/offer/domain/offer-path.ts` et remplace les
   trois littéraux (`offer-page.ts:58`, `offer-hero.ts:25`, données de route). L'URL ne prend pas de
   fragment (même règle que `#contact` sur l'accueil). Id de mesure inchangé (`header_contact`) :
   même intention, continuité des statistiques.
4. **Fiche projet** (ADR-0019) : phrase et usage en données statiques de domaine indexées par slug ;
   offre liée dérivée de `kind` par table exhaustive. Le contrat « usage » est fermé au compilateur
   (`ProjectUsage = 'personal'`, libellé dans `PROJECT_USAGE_LABELS: Record<ProjectUsage, string>`),
   l'exhaustivité nature → offre aussi (`as const satisfies Record<ProjectKind, OfferSlug | null>`).
5. **Blog** (ADR-0020) : filtres et cartouche ne montrent que les thèmes à compte `> 0` ;
   `FilterGroup` perd `disabled`.
6. **Avis** : `HOME_REVIEWS: readonly Review[] = []` ; `Home` ne rend la section que si la liste
   n'est pas vide (`@if` **autour** du `@defer`, sinon le placeholder réserverait de la place pour
   rien). JSON-LD : `reviewsJsonLd(reviews)` renvoie `{}` pour une liste vide, `{ review: [...] }`
   sinon, répandu dans le nœud `ProfessionalService` de la route d'accueil. Pas
   d'`aggregateRating` (aucune note collectée).
7. **Appel à avis Google = pied de page uniquement tant qu'il n'y a aucun avis** (colonne
   « Contact », après les réseaux) : présent sur toutes les pages, là où un ancien client cherche un
   moyen de contact, discret, et sans titre « Avis clients » qui laisserait croire à des avis
   existants. Pas d'appel sur l'accueil près du formulaire : un prospect y lirait une demande
   d'avis avant d'avoir travaillé ensemble. Quand des avis existent, la section « Avis clients » de
   l'accueil se termine par le même lien. Source unique : `SITE_IDENTITY.googleReviewUrl`. Mesure :
   `cta_click` id `review_google` (le pied de page injecte `AnalyticsGateway`, il ne le fait pas
   encore).

**Landmarks et titres** (invariant d'ownership) : aucun composant de cette spec n'émet de
`header`/`footer`/`main` de page. L'appel à avis vit **dans** le `contentinfo` existant du shell.
Le bandeau recruteur n'est pas un landmark (`<p>` + liens, pas de `aside`/`section` nommée). Le bloc
de fin de fiche et la section d'avis sont des `<section aria-labelledby>` à `h2`. Un seul `h1` par
page, inchangé.

### Fichiers à créer / modifier

| Tranche | Fichier | Rôle |
|---|---|---|
| T1 | `src/app/shared/identity/site-identity.static-data.ts` (M) | `journey` (identité unique) |
| T1 | `src/app/features/home/infra/data/home.static-data.ts` (M) + spec | `lead` (TXT-02), prix lu par `formatEur(OFFER_PRICES['site-vitrine'].creationEur)` (même source que `SHOWCASE_CREATION` du catalogue) |
| T1 | `src/app/features/profile/infra/data/profile.static-data.ts` (M) | `STATIC_BIOGRAPHY.summary`, `lead`, `leadEmphasis`, `paragraphs[0]` (TXT-05 à 08), `STATIC_ABOUT_HIGHLIGHTS` « Vision d'ensemble » (TXT-23) |
| T1 | `src/app/features/offer/domain/offer-pages.static-data.ts` (M) + spec | sous-titre `site-atelier` (TXT-09) |
| T1 | `src/app/features/home/domain/home-pitch.static-data.ts` (M) + spec | attribution, point `field` (TXT-10, TXT-11) |
| T1 | `src/app/app.routes.ts` (M), `app.routes.about.spec.ts` (M) | meta description `/about` (TXT-13) |
| T1 | `src/app/testing/editorial-sources.ts` (C) | `EDITORIAL_SOURCES` + parcours des chaînes, extraits de `editorial-typography.spec.ts` (code de test partagé) |
| T1 | `src/app/editorial-typography.spec.ts` (M) | consomme `editorial-sources.ts` ; nouvelles sources ajoutées au fil des tranches |
| T1 | `src/app/editorial-identity.spec.ts` (C) | invariant d'identité |
| T2 | `src/app/features/home/infra/data/home.static-data.ts` (M) + spec | `headline`, `headlineAccent` (TXT-01) |
| T2 | `src/app/features/home/domain/home-hero.static-data.ts` (M) + spec | lignes du cartouche (TXT-03) |
| T3 | `src/app/features/cv/application/cv-download.ts` (C) + `cv-download.spec.ts` (C) | facade `CvDownload` |
| T3 | `src/app/features/profile/pages/about/about.ts` (M) + spec | `providers: [CvDownload]`, retrait de `CvGateway`/`afterNextRender`/`loadCvUrl` |
| T3 | `src/app/features/profile/application/about-hero.ts` (M) + spec | `input cvUrl`, `output cvDownloaded`, lien CV haut de page (TXT-14) |
| T3 | `src/app/features/profile/application/about-hiring.ts` (M) + spec | libellé aligné (TXT-14) |
| T4 | `src/app/features/home/domain/home-recruiter-band.static-data.ts` (C) | copie du bandeau (TXT-04) |
| T4 | `src/app/features/home/application/home-recruiter-band.ts` (C) + spec | bandeau (dumb : `cvUrl` en entrée, 4 sorties de clic) |
| T4 | `src/app/features/home/application/home-hero-section.ts` (M) + spec | rend le bandeau en bas du premier écran, relaie entrées/sorties |
| T4 | `src/app/features/home/pages/home/home.ts` (M) + spec | `providers: [CvDownload]`, mesure des clics |
| T5 | `src/app/app.routes.ts` (M), `app.routes.projects.spec.ts`, `app.routes.about.spec.ts` (M), `app.routes.blog.spec.ts` (C) | titres et meta (TXT-12, TXT-15, TXT-16) |
| T6 | `src/app/core/navigation/section-scroller.ts` (M) + spec | `REQUEST_ANCHOR_DATA_KEY`, `scrollToRequestForm()` |
| T6 | `src/app/features/offer/domain/offer-path.ts` (M) | `OFFER_REQUEST_FRAGMENT` |
| T6 | `src/app/features/offer/offer.routes.ts` (M) + spec | `data.requestAnchor` sur chaque page d'offre (pas le catalogue) |
| T6 | `src/app/features/offer/pages/offer-page/offer-page.ts`, `application/components/offer-hero.ts` (M) | constante au lieu du littéral |
| T6 | `src/app/layout/components/header/header.ts`, `layout/components/footer/footer.ts` (M) + specs | appellent `scrollToRequestForm()` |
| T7 | `src/app/features/blog/application/blog-list-view.ts` (M) + spec | thèmes et filtres à compte `> 0` |
| T7 | `src/app/shared/ui/filter-group.ts` (M) + spec | retrait de `disabled` / `aria-disabled` |
| T7 | `src/app/features/blog/pages/blog-list/blog-list.ts` (M) + spec | cartouche rendu seulement s'il a des lignes |
| T7 | `DESIGN.md` (M) | « Liste du blog », « Groupe de filtres » |
| T8 | `src/app/features/projects/domain/models/project-outcome.model.ts` (C) | `ProjectUsage`, `ProjectOutcome` |
| T8 | `src/app/features/projects/domain/project-outcomes.static-data.ts` (C) | entrées `dashflow`, `candidash` (TXT-17 à 19) |
| T8 | `src/app/features/projects/domain/project-outcome.ts` (C) + spec | `projectOutcome(slug): ProjectOutcome | null` |
| T8 | `src/app/features/projects/application/components/project-detail-header.ts` (M) | `input outcome`, rendu avant la description |
| T8 | `src/app/features/projects/pages/project-detail/project-detail.ts` (M) + spec | `computed` outcome |
| T9 | `src/app/features/projects/domain/related-offer.ts` (C) + spec | `OFFER_BY_PROJECT_KIND`, `relatedOfferSlug(kind)` |
| T9 | `src/app/features/projects/application/project-follow-up-copy.ts` (C) | copie du bloc de fin (TXT-20) |
| T9 | `src/app/features/projects/application/components/project-follow-up.ts` (C) + spec | bloc de fin (dumb) |
| T9 | `src/app/features/projects/pages/project-detail/project-detail.ts` (M) + spec | rendu avant la navigation, mesure |
| T10 | `src/app/shared/identity/site-identity.static-data.ts` (M) | `googleReviewUrl` |
| T10 | `src/app/layout/components/footer/footer.static-data.ts`, `footer.ts` (M) + spec | appel à avis (TXT-21), `AnalyticsGateway` |
| T11 | `src/app/features/home/domain/models/review.model.ts` (C) | `Review` |
| T11 | `src/app/features/home/domain/home-reviews.static-data.ts` (C) | `HOME_REVIEWS = []`, copie (TXT-22) |
| T11 | `src/app/features/home/domain/reviews-json-ld.ts` (C) + spec | `reviewsJsonLd(reviews)` |
| T11 | `src/app/features/home/testing/review-builders.ts` (C) | `makeReview()` (tests uniquement) |
| T11 | `src/app/features/home/application/home-reviews.ts` (C) + spec | section « Avis clients » |
| T11 | `src/app/features/home/pages/home/home.ts` (M) + spec, `src/app/app.routes.ts` (M) + `app.routes.home.spec.ts` (M) | rendu conditionnel, JSON-LD |

`DESIGN.md` reçoit aussi une entrée par composant nouveau (bandeau recruteur, bloc de fin de
fiche, avis clients) dans la tranche qui le crée.

### Modèles de données

Immuables (`readonly`), `type`, unions plutôt qu'enums (profil).

```ts
// project-outcome.model.ts
export type ProjectUsage = 'personal';
export type ProjectOutcome = { readonly summary: string; readonly usage: ProjectUsage | null };

// project-outcomes.static-data.ts
export const PROJECT_OUTCOMES: Readonly<Record<string, ProjectOutcome>> = { dashflow: …, candidash: … };
export const PROJECT_USAGE_LABELS: Readonly<Record<ProjectUsage, string>> = { personal: … };

// related-offer.ts
export const OFFER_BY_PROJECT_KIND = {
  production: 'application-metier', demo: 'site-vitrine', script: null,
} as const satisfies Record<ProjectKind, OfferSlug | null>;

// review.model.ts
export type Review = {
  readonly id: string;
  readonly quote: string;
  readonly authorName: string;
  readonly authorContext: string;       // métier · entreprise · ville
  readonly datePublished: `${number}-${number}-${number}`; // ISO, jamais une date inventée
};
```

`reviewsJsonLd` produit, pour chaque avis : `{ '@type': 'Review', author: { '@type': 'Person',
name }, reviewBody: quote, datePublished }`. `CvDownload.url` : `Signal<string | null>` en lecture
seule.

### Réactivité

- `CvDownload` : `rxResource` (lecture HTTP, profil) + `computed`. Pas d'`effect`.
- `ProjectDetail` : `outcome = computed(() => projectOutcome(project()?.slug))`,
  `relatedOffer = computed(...)` résolu en `{ label, path }` depuis `OFFERS` / `offerPath`
  (catalogue `/offres` si `null`).
- `BlogList` : la dérivation reste dans la fonction pure `toBlogListView` (presenter existant).
- `SectionScroller.scrollToRequestForm()` : lecture impérative du snapshot au clic, sans signal.

### État partagé & coordination

- **Facade** `CvDownload` : instance-scopée (providers de page), front un gateway et la mesure,
  n'est pas un store (pas d'état possédé partagé entre composants non liés ; chaque page a sa propre
  instance), pas de suffixe `Store`. Précédent de nommage : `admin-cv.ts`, `contact-form.ts`.
- Aucun store. Le contexte « page avec formulaire local » est une **donnée de route**, pas un état
  partagé : pas de registre à nettoyer, pas de cycle de vie.
- Aucun gateway nouveau (`CvGateway` existant réutilisé).

### Cross-platform

Aucun (profil : pas de cible native).

### Choix de bibliothèques

Aucune dépendance ajoutée.

### Textes proposés

Notation : `\u00a0` = espace insécable, `\u202f` = espace fine insécable (à écrire ainsi dans le
code). `{journey}` = `SITE_IDENTITY.journey`, `{prix}` = `formatEur(OFFER_PRICES['site-vitrine'].creationEur)` (890 € au 2026-10-10).
**Statut** : TXT-00, 03 à 10, 12 à 22 validés le 2026-10-10 tels que proposés ; TXT-01, 02, 11 réécrits
selon les arbitrages ; TXT-23 = suppression pure d'une phrase (aucun texte nouveau).

| Id | Emplacement | Texte |
|---|---|---|
| TXT-00 | `SITE_IDENTITY.journey` | `Chaudronnier puis tourneur CN de haute précision dans l'aéronautique, je suis aussi développeur web full-stack, issu d'une reconversion.` |
| TXT-01 | accueil, `headline` / `headlineAccent` | `Votre site ou votre application web, à prix annoncé, en ligne vite.` / accent `à prix annoncé` (segment central, comme l'ancien « livrés en production ») |
| TXT-02 | accueil, `lead` | `Pour les TPE, les artisans et les ateliers des Yvelines et d'Île-de-France\u00a0: site vitrine à {prix} prix final, en ligne en 7 jours, réponse sous 24\u00a0h ouvrées. {journey}` |
| TXT-03 | cartouche `HOME_WORK_FRAME.rows` (titre, référence, cote inchangés) | `Prix` · `Fixe, annoncé avant de commencer` ; `Site vitrine` · `En ligne en 7 jours` ; `Réponse` · `Sous 24\u00a0h ouvrées` ; `Propriété` · `Le site, le code et le nom de domaine sont à vous` ; `Zone` · `Yvelines et Île-de-France, rendez-vous possible`. Retirées : « Interlocuteur », « Application · Devis ferme après cadrage », « Tolérance prix · ± 0 € hors avenant signé » |
| TXT-04 | bandeau recruteur | `Vous recrutez\u202f?` (lien vers `/about#recrutement`, sans point médian à sa suite) `CV (PDF)` · `LinkedIn` · `GitHub` |
| TXT-05 | `/about`, `STATIC_BIOGRAPHY.summary` | `De la chaudronnerie au tournage CN dans l'aéronautique, et au développement web en parallèle\u00a0: la même exigence.` |
| TXT-06 | `/about`, `STATIC_BIOGRAPHY.lead` | `{journey}` |
| TXT-07 | `/about`, `leadEmphasis` | `Angular et NestJS d'abord, PHP et Java aussi, en méthode agile.` (remplace « Je livre du logiciel avec la même exigence. ») |
| TXT-08 | `/about`, `paragraphs[0]` | `Je ne suis pas venu au développement web par hasard. De la chaudronnerie au tournage CN de haute précision dans l'aéronautique, mon métier aujourd'hui, j'ai vu les outils numériques transformer un secteur entier. J'ai compris que je pouvais avoir plus d'impact en créant ces outils plutôt qu'en les utilisant.` |
| TXT-09 | offre atelier, sous-titre | `{journey} Je crée des sites qui montrent à un acheteur ce que vous savez usiner, en trente secondes.` |
| TXT-10 | accueil, citation, attribution | `Julien Nédellec · tourneur CN et développeur full-stack` |
| TXT-11 | accueil, point « Je connais le terrain » | `En chaudronnerie et en usinage aéronautique. Je comprends un atelier, une PME, des délais qui ne glissent pas.` |
| TXT-12 | `/about`, titre (onglet + SEO) | `Développeur full-stack Angular / NestJS, parcours et CV \| Julien Nédellec` (73 caractères : le nom sera tronqué dans les résultats, ~60) |
| TXT-13 | `/about`, meta description | `{journey} Parcours, stack et CV.` (159 caractères) |
| TXT-14 | `/about`, liens CV (haut de page et `#recrutement`) | `Télécharger mon CV (PDF)` |
| TXT-15 | `/projects`, titre / meta | `Réalisations Angular et NestJS en production \| Julien Nédellec` / `Applications Angular et NestJS en production, sites de démonstration et scripts\u00a0: le besoin réglé et les choix techniques de chaque projet.` |
| TXT-16 | `/blog`, titre (non demandé, proposé) | `Blog Angular, NestJS et auto-hébergement \| Julien Nédellec` (meta inchangée) |
| TXT-17 | fiche DashFlow, phrase | `Suivre le budget du foyer et la santé de chacun sans confier ces données en clair à un serveur\u00a0: une seule application, chiffrée dans le navigateur avant tout envoi.` |
| TXT-18 | fiche CandiDash, phrase | `Suivre des candidatures sans tableur ni CRM surdimensionné\u00a0: un tableau de bord, des relances automatiques par email et les documents rangés avec chaque offre.` |
| TXT-19 | mention d'usage (`personal`) | `Usage personnel, pour ma famille et moi.` |
| TXT-20 | bloc de fin de fiche | titre `Un besoin similaire\u202f?` ; texte `Décrivez-le, je vous réponds sous 24\u00a0h ouvrées.` ; lien `Voir l'offre «\u00a0{offer.name}\u00a0»` (catalogue : `Voir les offres et les prix`) ; ligne recruteur `Vous recrutez\u202f?` + lien `Parcours et CV`. Offre liée : production → Application métier sur mesure, démo → Site vitrine, script ou sans nature → catalogue |
| TXT-21 | pied de page, colonne Contact | `Vous avez travaillé avec moi\u202f?` + lien `Laisser un avis sur Google`, suivi d'un `sr-only` `(nouvel onglet)` |
| TXT-23 | `/about`, point « Vision d'ensemble » | `Je ne code pas dans le vide. Je comprends le métier, l'architecture, les contraintes.` (retrait de « Vingt ans à optimiser des systèmes complexes, ça laisse des traces. ») |
| TXT-22 | section d'avis (rendue seulement avec des avis) | titre `Avis clients` ; lien final identique à TXT-21 |

### Tranches

RED par assertion d'abord : les textes validés se testent par égalité exacte sur la donnée
(précédent `home-hero.static-data.spec.ts`, `home.static-data.spec.ts`), le rendu par
`data-testid`. Chaque nouvelle source de texte est ajoutée à `EDITORIAL_SOURCES` dans sa tranche
(le spec de typographie doit rester vert).

- **Tranche 1 — une seule identité.** `SITE_IDENTITY.journey`, TXT-02,
  05 à 11, 13, 23. RED : égalités exactes sur chaque donnée ; `editorial-identity.spec.ts` (a) exige que
  `STATIC_HERO.lead`, `STATIC_BIOGRAPHY.lead`, `OFFER_PAGES['site-atelier'].hero.subtitle` et la
  meta de `/about` contiennent `SITE_IDENTITY.journey`, (b) interdit dans toutes les
  `EDITORIAL_SOURCES` les motifs `aujourd'hui développeur`, `aujourd'hui tourneur CN en`,
  `Je suis tourneur CN`, `puis développeur`, `métallurgie`, et toute durée de parcours
  `/(vingt|20)[\s\u00a0\u202f]ans/iu` (échouent aujourd'hui : `home.static-data.ts:7`,
  `profile.static-data.ts:22,122`, `home-pitch.static-data.ts:53`, meta `app.routes.ts:83`) ;
  (c) le prix de `STATIC_HERO.lead` est `formatEur(OFFER_PRICES['site-vitrine'].creationEur)`
  (assertion par la source, pas par « 890 » en dur). Extraction préalable de `editorial-sources.ts` (refactor de test, typographie
  verte avant et après).
- **Tranche 2 — accroche et cartouche d'accueil.** TXT-01, TXT-03. RED : égalités exactes ;
  `home-hero-section.spec` vérifie cinq lignes dans `hero-work-frame`.
- **Tranche 3 — CV prérendu sur `/about`.** `CvDownload`, lien haut de page (`about-hero-cv`) et
  `#recrutement` (`about-hiring-cv`). RED : `cv-download.spec` (`HttpTestingController`) : CV
  présent → `url()` = `<base>/cv/download` ; `null` ou erreur → `url()` nul ; `track()` appelle
  `trackCvDownload` une fois. `about.spec` : avec la réponse HTTP servie **avant** tout rendu de
  navigateur (ni `afterNextRender` ni attente d'un rendu supplémentaire), `about-hero-cv` porte le
  `href` ; un clic sur chacun des deux liens émet un seul `cv_download`. Sans CV : aucun des deux
  liens.
- **Tranche 4 — bandeau recruteur de l'accueil.** RED : `home-recruiter-band.spec` : lien
  `home-recruiter-about` vers `/about` fragment `recrutement`, `home-recruiter-cv` rendu seulement
  si `cvUrl` non nul, `home-recruiter-linkedin`/`-github` vers `SITE_IDENTITY.socials` avec
  `target="_blank"` et `rel="noopener noreferrer"`. `home.spec` : clic CV → `trackCvDownload` (pas de
  `cta_click`) ; clics parcours / LinkedIn / GitHub → `trackCtaClick` avec `home_recruiter_about`,
  `home_recruiter_linkedin`, `home_recruiter_github` ; le bandeau est dans `app-home-hero-section`.
- **Tranche 5 — titres et meta d'intention.** TXT-12, 15, 16. RED : égalités `title` et
  `seo.title`/`seo.description` par route (précédent `app.routes.about.spec.ts`).
- **Tranche 6 — « Décrire mon projet » sur une page d'offre.** RED : `section-scroller.spec` : sur
  une route de test portant `data.requestAnchor = 'demande'`, `scrollToRequestForm()` ne navigue pas
  et focalise `#demande` ; sans la donnée, navigue vers `/` puis vise `#contact` (comportement
  actuel). `offer.routes.spec` : chaque route d'offre porte `requestAnchor`, le catalogue non.
  `header.spec` / `footer.spec` : le clic appelle `scrollToRequestForm` (et `header_contact` reste
  mesuré).
- **Tranche 7 — thèmes de blog vides masqués.** RED : `blog-list-view.spec` : avec les deux articles
  de production, `filters` = « Tous » + les seuls thèmes non vides, `themes` sans ligne à
  « 0 article » ; aucune liste vide → pas de cartouche (`blog-list.spec`, `blog-themes` absent).
  `filter-group.spec` : cas `disabled` supprimés (refactor sous vert après le GREEN).
- **Tranche 8 — phrase « problème → résultat » de la fiche.** RED : `project-outcome.spec` (sans
  TestBed) : `dashflow`/`candidash` → entrée exacte, slug inconnu → `null` ; `project-detail.spec` :
  pour DashFlow, `project-outcome` et `project-usage` précèdent la description dans l'ordre du DOM ;
  pour un slug sans entrée, aucun des deux.
- **Tranche 9 — bloc de fin de fiche.** RED : `related-offer.spec` (`it.each` sur les trois natures
  et `null`) ; `project-follow-up.spec` : `h2` « Un besoin similaire ? », lien
  `project-follow-up-offer` vers `/offres/application-metier` pour un projet `production`, vers
  `/offres` pour un `script`, lien `project-follow-up-hiring` vers `/about#recrutement` ;
  `project-detail.spec` : bloc rendu avant `app-project-detail-nav`, clics → `trackCtaClick`
  `project_similar_need` / `project_hiring`.
- **Tranche 10 — appel à avis Google en pied de page.** RED : `footer.spec` : lien
  `footer-review-link` vers `SITE_IDENTITY.googleReviewUrl`, `target="_blank"`, `rel` contenant
  `noopener`, nom accessible « Laisser un avis sur Google (nouvel onglet) », clic →
  `trackCtaClick('review_google', …)` ; `app.routes.home.spec` : `googleReviewUrl` absent de tout
  `sameAs`.
- **Tranche 11 — avis clients prêts, rien de rendu.** RED : `reviews-json-ld.spec` : `[]` → `{}`,
  deux avis (builders) → `review` de deux `Review` ; `home-reviews.spec` (builders) : `h2`
  « Avis clients », une citation par avis avec auteur et contexte, lien Google final ; `home.spec` :
  avec `HOME_REVIEWS` vide, ni `home-reviews` ni placeholder dans le DOM ;
  `app.routes.home.spec` : le nœud `ProfessionalService` n'a pas de clé `review`. Aucun avis dans
  les données de production : `HOME_REVIEWS` reste `[]` (test d'égalité).

### Risques & inconnues

- **Prérendu et CV** : le lien CV reflète l'état **au build**. Un CV supprimé dans l'admin laisse un
  lien 404 jusqu'au prochain déploiement (remplacer le CV garde la même URL) ; à mentionner sur
  `/admin/cv`, ou redéployer après suppression. L'accueil fait désormais une lecture `/api/cv` au
  prérendu : API indisponible au build → bandeau sans lien CV, pas d'échec de build.
- **SEO** : TXT-12 dépasse la largeur affichée par Google ; TXT-02/TXT-03 changent le contenu
  au-dessus de la ligne de flottaison de l'accueil (pas d'effet attendu sur le LCP : texte, aucune
  image). JSON-LD `Review` sur sa propre `ProfessionalService` = avis « auto-hébergés », inéligibles
  aux étoiles chez Google : balisage valide, mais aucun extrait enrichi à attendre.
- **Hydratation / mesure** : un clic sur un lien CV prérendu avant l'hydratation télécharge bien (lien
  natif) ; `withEventReplay()` rejoue le clic, donc `cv_download` est compté si la page reste
  ouverte (cas du téléchargement en pièce jointe). Le relais `HomeHeroSection` → `Home` des
  sorties du bandeau est hors `@defer`, hydraté au chargement.

### Arbitrages reportés (2026-10-10)

- **R1** : aucune durée de parcours publiée ⇒ TXT-11, TXT-23, et l'invariant (b) de T1.
- **R2** : « Ouvert à un CDI » conservé tel quel (non modifié par cette spec).
- **R3** : prix d'appel = site vitrine, lu depuis `OFFER_PRICES` ; plus de constante de prix minimal.
- **R4** : pas de nouvelle mention du temps partiel.
- **R5** : pas de `sameAs` Google (aucune URL publique de fiche fournie) ; T10 vérifie l'absence.

## Plan de test

> Profil lu (Vitest 4 + happy-dom, zoneless, `data-testid` seul, builders). RED joué pour les onze
> tranches en une invocation (demande de la session). Preuve commune : `pnpm exec ng cache clean`,
> `rm -rf node_modules/.vite`, puis `pnpm test; echo exit=$?` le 2026-10-10 14:07 →
> **119 failed / 3483 total** (29 fichiers rouges / 200), `exit=1`, typecheck et
> `pnpm run format:check` verts. Les 119 échecs sont **tous des `AssertionError`** (aucun `NG0201`,
> `TypeError`, rejet non géré) ; les 3364 autres tests, dont `editorial-typography.spec.ts`, sont verts.
> Textes attendus = table TXT, espaces insécables écrits `\u00a0` / `\u202f` (contrôle grep : aucun
> caractère littéral dans les lignes ajoutées) ; prix lu par `formatEur(OFFER_PRICES['site-vitrine'].creationEur)`.
>
> **Squelettes de signature dus au GREEN** (créés pour que l'import ou la clé compile, valeur neutre,
> aucun test ne passe grâce à eux sauf les gardes signalées) : `SITE_IDENTITY.journey = ''`,
> `SITE_IDENTITY.googleReviewUrl = ''` ; `REQUEST_ANCHOR_DATA_KEY` + `scrollToRequestForm(): void {}`
> (`section-scroller.ts`) ; `OFFER_REQUEST_FRAGMENT` (`offer-path.ts`) ; `CvDownload`
> (`url` toujours nul, `track()` vide) ; `HomeRecruiterBand` et `ProjectFollowUp` et `HomeReviews`
> (entrées/sorties, template vide) ; `HOME_RECRUITER_BAND_COPY`, `HOME_REVIEWS_COPY`,
> `PROJECT_FOLLOW_UP_COPY` (chaînes vides) ; `PROJECT_OUTCOMES = {}`, `PROJECT_USAGE_LABELS`
> (`personal: ''`) ; `projectOutcome`, `relatedOfferSlug` (renvoient `null`),
> `OFFER_BY_PROJECT_KIND` (tout à `null`) ; `reviewsJsonLd` (renvoie `{}`) ; modèles `Review`,
> `ProjectOutcome`. Les deux méthodes vides lèvent `no-empty-function` au lint jusqu'au GREEN.
>
> **Code de test partagé créé** : `src/app/testing/editorial-sources.ts` (sources + parcours des
> chaînes, consommé par la typographie et l'identité), `features/cv/testing/stub-cv-gateway.ts`,
> `features/home/testing/review-builders.ts` (`makeReview`, tests uniquement).

**Écarts au plan relevés en RED** (à arbitrer par la session ou `architect`) :

- **E1** — T7 / ADR-0020 §3 : `FilterGroup` ne peut pas perdre `disabled`. Trois consommateurs admin
  le posent (`admin-posts-view.ts:68`, `admin-projects-view.ts:69,75`, testés dans
  `admin-projects-view.spec.ts`, `admin-blog.spec.ts`, `admin-messages.spec.ts`). Seul le blog cesse
  de le produire ; `filter-group.spec` reste tel quel.
- **E2** — T3 : l'ancien `about.spec` exigeait un `console.warn` sur échec de lecture du CV ; le plan
  ne le reprend pas pour `CvDownload` (erreur → `url()` nul). Assertion retirée, comportement
  « aucun lien » conservé.
- **E3** — T8 : la description technique de l'en-tête de fiche n'a pas de `data-testid` ; l'ordre
  DOM exige `data-testid="project-detail-description"` (à poser au GREEN).
- **E4** — T9 : le plan dit `relatedOffer` « résolu en `{ label, path }` » par `ProjectDetail` et
  teste « un projet production » dans `project-follow-up.spec`. Contrat retenu : `ProjectFollowUp`
  reçoit `offer: { label, path }` où `label` est **le texte complet du lien** ; la résolution par
  nature est testée dans `project-detail.spec`. Libellés mesurés = texte du lien.
- **E5** — noms imposés par les tests, absents du plan : sorties `hiringOpened`, `cvDownloaded`,
  `linkedinOpened`, `githubOpened` (bandeau), `offerOpened`, `hiringOpened` (bloc de fin) ;
  `FOOTER_COPY.review.{prompt,link,newTab}` ; testids `footer-review-prompt`,
  `project-follow-up`, `project-follow-up-text`, `project-follow-up-hiring-line`, `home-reviews`,
  `home-review(-quote|-author|-context)`, `home-reviews-google`.
- **E6** — T4 : les relais `HomeHeroSection` et `AboutHero` sont prouvés par les pages (`home.spec`,
  `about.spec`), sans spec isolé de relais (présentationnel couvert par le parent).

### Tranche 1 — une seule identité

- `site-identity.static-data.spec` — `journey` = TXT-00 mot pour mot.
- `editorial-identity.spec` (C) — (a) `it.each` sur le lead d'accueil, le lead `/about`, le sous-titre
  `site-atelier`, la meta `/about` : `journey` y figure **exactement une fois** (comptage par
  `split`, un `journey` vide ne peut pas passer) ; (b) `describe.each` des six motifs interdits ×
  `it.each(EDITORIAL_SOURCES)` : liste des chemins fautifs `toEqual([])` ; (c) le prix
  `formatEur(OFFER_PRICES['site-vitrine'].creationEur)` figure une fois dans `STATIC_HERO.lead`.
- `home.static-data.spec` — `lead` = TXT-02 composé (`showcasePrice`, `SITE_IDENTITY.journey`).
- `profile.static-data.spec` (C) — `summary` TXT-05, `lead` = `journey`, `leadEmphasis` TXT-07,
  `paragraphs[0]` TXT-08, « Vision d'ensemble » TXT-23.
- `offer-pages.static-data.spec` — sous-titre `site-atelier` = `` `${journey} Je crée…` `` (TXT-09).
- `home-pitch.static-data.spec` — attribution TXT-10, point `field` TXT-11.
- `app.routes.about.spec` — meta = `` `${journey} Parcours, stack et CV.` `` (TXT-13), longueur ≤ 160.
- `editorial-typography.spec` — consomme `editorial-sources.ts` (refactor de test, vert avant/après).

RED : **29 failed / 3483 total** (site-identity 1, editorial-identity 17, home.static-data 1,
profile 5, offer-pages 1, home-pitch 2, about route 2), assertions d'égalité et de comptage.

### Tranche 2 — accroche et cartouche d'accueil

- `home.static-data.spec` — `headline` TXT-01, `headlineAccent` = `à prix annoncé`.
- `home-hero.spec` — l'unique `em` du `h1` vaut `à prix annoncé` (ancien accent balayé).
- `home-hero.static-data.spec` — `HOME_WORK_FRAME` golden avec les cinq lignes TXT-03.
- `home-hero-section.spec` : **pas de RED** — il compare déjà les lignes rendues à
  `HOME_WORK_FRAME.rows`, qui en compte cinq avant comme après ; rien à ajouter.

RED : **4 failed / 3483 total**, assertions d'égalité.

### Tranche 3 — CV prérendu sur `/about`

- `cv-download.spec` (C, `HttpTestingController`) — CV publié : une requête `/api/cv`, `url()` =
  `/api/cv/download` ; `null` puis erreur 500 (`it.each`) : une requête, `url()` nul ; `track()` →
  `trackCvDownload` une fois, aucun `trackCtaClick`.
- `about.spec` — CV publié : `about-hero-cv` et `about-hiring-cv` ont le `href` de téléchargement et
  le libellé TXT-14 ; `about-hero-cv` est dans `app-about-hero`, avant `about-hiring` ; clic sur
  chacun (`it.each`) → un seul `cv_download`. **Prérendu** : avec `globalThis.ngServerMode = true`
  (les `afterNextRender` ne s'exécutent pas, comme au build), la requête `/api/cv` est émise au
  premier rendu et `about-hero-cv` porte le `href` après la réponse. Sans CV et CV en erreur
  (`it.each`) : aucun des deux liens, LinkedIn présent (garde, vert).
- `about-hiring.spec` — libellé `Télécharger mon CV (PDF)`.

RED : **9 failed / 3483 total** (cv-download 4, about 4, about-hiring 1), assertions
(`toHaveLength(1)` sur les requêtes, égalités, compteur de mesure).

### Tranche 4 — bandeau recruteur de l'accueil

- `home-recruiter-band.spec` (C) — libellés TXT-04 dans l'ordre ; `home-recruiter-about` →
  `/about#recrutement` et navigation effective ; `home-recruiter-cv` = `cvUrl`, absent si `null` ;
  LinkedIn/GitHub : `href` de `SITE_IDENTITY.socials`, `target="_blank"`,
  `rel="noopener noreferrer"` ; chaque clic émet sa sortie une fois (`hiringOpened`,
  `cvDownloaded`, `linkedinOpened`, `githubOpened`) ; ni `section`, `aside`, `nav`, landmark.
- `home.spec` — `CvGateway` fourni (`stubCvGateway`) ; bandeau dans `app-home-hero-section` ; lien CV
  prérendu ; sans CV : entrée recruteur sans lien CV ; clic CV → `trackCvDownload` seul ; clics
  parcours / LinkedIn / GitHub → `trackCtaClick('home_recruiter_about', 'Vous recrutez\u202f?')`,
  `('home_recruiter_linkedin', 'LinkedIn')`, `('home_recruiter_github', 'GitHub')`.

RED : **17 failed / 3483 total** (bandeau 11, home 6), assertions.

### Tranche 5 — titres et meta d'intention

- `app.routes.about.spec` — titre TXT-12 (onglet + `seo.title`), fil d'Ariane « Parcours » inchangé.
- `app.routes.projects.spec` — titre et meta TXT-15.
- `app.routes.blog.spec` (C) — titre TXT-16, meta inchangée (garde).

RED : **4 failed / 3483 total**, égalités.

### Tranche 6 — « Décrire mon projet » sur une page d'offre

- `section-scroller.spec` — routeur factice avec `routerState.snapshot` ; route la plus profonde
  portant `requestAnchor = OFFER_REQUEST_FRAGMENT` : pas de navigation, `getElementById('demande')`,
  défilement centré (`top: 760`), focus `preventScroll` ; sans la donnée sur `/projects` : navigation
  vers `/` puis `#contact` ; sur l'accueil : `#contact` sans navigation.
- `offer.routes.spec` — chaque page d'offre lie `content`, `requestAnchor` (= `'demande'`), `seo`,
  `summary` et rien d'autre ; le catalogue reste `['seo']` (garde).
- `header.spec`, `footer.spec` — le clic appelle `scrollToRequestForm` une fois et plus `scrollTo`
  (tests existants adaptés) ; `header_contact` reste mesuré (test existant, vert).

RED : **11 failed / 3483 total** (scroller 4, routes 5, header 1, footer 1), assertions.

### Tranche 7 — thèmes de blog vides masqués

- `blog-list-view.spec` — `themes` ne garde que les comptes `> 0` dans l'ordre du catalogue (cas
  production, aucun article → `[]`, parcours seul, ordre inversé) ; `filters` = « Tous » + thèmes
  couverts, aucun inactif ; sans article : « Tous » à 0 seul.
- `blog-list.spec` — cartouche et filtres sans « Ingénierie » ; compteurs `['2','2','1','1','1']` ;
  sans article : en-tête rendu, `blog-themes` absent. Test « Ingénierie vide pressée » **retiré**
  (cas qui n'existe plus).
- `filter-group.spec` : **inchangé, pas de RED** — voir écart E1.

RED : **13 failed / 3483 total** (view 6, page 7), égalités.

### Tranche 8 — phrase « problème → résultat » de la fiche

- `project-outcome.spec` (C, sans TestBed) — `dashflow`, `candidash` → entrée exacte (TXT-17/18,
  `usage: 'personal'`) ; slugs sans entrée et `undefined` → `null` (garde) ;
  `PROJECT_USAGE_LABELS` = TXT-19.
- `project-detail.spec` — DashFlow : `project-outcome` et `project-usage` (textes exacts)
  précèdent `project-detail-description` ; slug sans entrée : ni l'un ni l'autre, la description
  reste.

RED : **5 failed / 3483 total**, égalités et ordre DOM.

### Tranche 9 — bloc de fin de fiche

- `related-offer.spec` (C) — `it.each` production / démo / script / `null`.
- `project-follow-up.spec` (C) — `section` nommée par son `h2` `Un besoin similaire\u202f?` ; texte
  TXT-20 ; `project-follow-up-offer` = `offer.label` / `offer.path` ; ligne
  `project-follow-up-hiring-line` = `Vous recrutez\u202f? Parcours et CV`, lien vers
  `/about#recrutement` ; clics → navigation effective et sortie (`offerOpened`, `hiringOpened`).
- `project-detail.spec` — lien d'offre par nature (`Voir l'offre «\u00a0{name}\u00a0»` lu dans
  `OFFERS`, ou `Voir les offres et les prix` vers `/offres`) ; bloc avant `app-project-detail-nav` ;
  clics → `trackCtaClick('project_similar_need', <libellé du lien>)` /
  `('project_hiring', 'Parcours et CV')`.

RED : **16 failed / 3483 total** (related-offer 2, bloc 7, fiche 7), assertions.

### Tranche 10 — appel à avis Google en pied de page

- `site-identity.static-data.spec` — `googleReviewUrl` = lien de rédaction validé.
- `footer.spec` — `FOOTER_COPY.review` (`prompt`, `link`, `newTab`) dans le golden ;
  `footer-review-prompt` après le dernier réseau, dans la `nav` « Contact » ;
  `footer-review-link` : `href` = `googleReviewUrl`, `_blank`, `rel` ⊃ `noopener`, nom
  `Laisser un avis sur Google (nouvel onglet)`, clic → `trackCtaClick('review_google',
  'Laisser un avis sur Google')`.
- `app.routes.home.spec` — aucune chaîne `g.page` dans le JSON-LD (garde R5, vert).
- `src/index.html` : `grep google` vide, fichier inchangé.

RED : **6 failed / 3483 total** (identité 1, pied de page 5), assertions.

### Tranche 11 — avis clients prêts, rien de rendu

- `reviews-json-ld.spec` (C, builders) — `[]` → `{}` (garde) ; deux avis → `review` de deux
  `Review` (`author.name`, `reviewBody`, `datePublished`).
- `home-reviews.spec` (C, builders) — `section` nommée par `h2` « Avis clients » ; `home-review` ×2
  avec `-quote`, `-author`, `-context` ; `home-reviews-google` final, `_blank`, `noopener`, nom
  annonçant le nouvel onglet.
- `home-reviews.static-data.spec` (C) — `HOME_REVIEWS` `toEqual([])` (garde) ; copie TXT-22.
- `home.spec` — avec `HOME_REVIEWS` vide, ni `home-reviews` ni `home-reviews-placeholder` (garde) ;
  le compte de blocs différés reste 5 (test existant).
- `app.routes.home.spec` — `ProfessionalService` sans clé `review` (garde).

RED : **5 failed / 3483 total**, égalités.

## Implémentation

> GREEN T1 → T11 joué en une invocation (demande de la session), tests de `qa` inchangés.

- **Écart au plan, `CvDownload`** : `toSignal(getCurrent().pipe(map, catchError))` au lieu de
  `rxResource`. Un `resource()` ajoute une tâche à `PendingTasks` tant que la lecture n'a pas
  répondu (`@angular/core` `_resource-chunk.mjs:404`), alors que `provideHttpClientTesting()` pose
  `REQUESTS_CONTRIBUTE_TO_STABILITY = false` : le `render()` de `about.spec` (`await
  fixture.whenStable()` **avant** de répondre à `/api/cv`) ne rendait jamais la main (20 tests en
  timeout de 5 s, mesuré). Au prérendu, `HttpClient` retient déjà la stabilité pendant la requête :
  la lecture reste sérialisée par le transfer cache (vérifié : 0 requête `/api/cv` à l'hydratation
  de `/` et de `/about`). Contrat inchangé : `url: Signal<string | null>` en lecture seule, nul sans
  CV ou en erreur, `track()` → `trackCvDownload()`.
- **E1 appliqué** : `FilterGroup` garde `disabled` ; ADR-0020 §3 corrigé ; DESIGN « Groupe de
  filtres » (option inactive = filtres de l'admin) et « Liste du blog » (thèmes couverts seuls,
  cartouche absent sans ligne) mis à jour. Le § Décisions 5 du plan (« `FilterGroup` perd
  `disabled` ») est caduc.
- **Copie de l'appel à avis** : `REVIEW_INVITATION_COPY` (`shared/identity/review-invitation.static-data.ts`),
  source unique consommée par `FOOTER_COPY.review` et `HomeReviews` (la section d'avis finit par le
  même lien que le pied de page, sans faire dépendre une feature du layout).
- **Offre liée** : `OFFER_BY_PROJECT_KIND` reste privé à `related-offer.ts` (aucun consommateur
  hors du fichier) ; libellé du lien par `relatedOfferLinkLabel(name)` dans
  `project-follow-up-copy.ts` (un seul appelant, `ProjectDetail` : gardé dans le fichier de copie
  pour ne pas écrire de texte éditorial dans la page).
- **Bandeau recruteur** : placé dans la colonne du hero, sous la ligne de disponibilité (et non sous
  le cartouche) après capture à 375 px, où il tombait hors du premier écran.
- `AboutHero.cvUrl` et `HomeHeroSection.cvUrl` sont optionnels (`null` par défaut) : leurs specs
  isolés existants ne les posent pas.
- `FOOTER_COPY.hiringLink` réécrit avec l'échappement `\u202f` (caractère littéral auparavant).
- DESIGN.md : accent du `h1` (« à prix annoncé »), entrées « Bandeau recruteur », « Bloc de fin de
  fiche », « Avis clients ».
- **Correctifs de la revue (REJECTED du 2026-10-10)** :
  - Bandeau recruteur : « Vous recrutez ? » puis un groupe insécable « CV (PDF) · LinkedIn ·
    GitHub » rendu par un `@for` sur `{ id, label, href }` (classes des trois liens externes
    factorisées) ; chaque `·` est dans le même élément que le lien qu'il introduit, aucun
    séparateur avant le premier lien du groupe. Mono passé à `text-xs` : une seule ligne dès
    375 px ; à 320 px, le groupe passe entier sous « Vous recrutez ? ». Critère « premier écran »
    amendé dans la Description (arbitrage de la session : desktop oui, mobile = juste après les
    boutons) et dans DESIGN.md.
  - Nouvel onglet : CV, LinkedIn et GitHub du bandeau, CV du hero de `/about`, CV et LinkedIn de
    `#recrutement` portent un nom accessible « <libellé> (nouvel onglet) » via
    `newTabLabel()` (`shared/identity/new-tab-notice.ts`, `NEW_TAB_NOTICE` aussi source de
    `REVIEW_INVITATION_COPY.newTab`). **En `aria-label`, pas en `sr-only`** : un `sr-only` dans le
    lien changerait son `textContent`, que les tests de `qa` comparent à l'égalité (`'CV (PDF)'`,
    `'LinkedIn'`, `'GitHub'`, `'Télécharger mon CV (PDF)'` dans `home-recruiter-band.spec`,
    `about.spec`, `about-hiring.spec`) ; l'`aria-label` garde le libellé visible en tête (précédent :
    `admin-project-row.ts`, `admin-post-row.ts`).
  - Tests ajoutés (contrats nouveaux, aucun test existant modifié) : `home-recruiter-band.spec`
    (séparateur jamais orphelin, avec et sans CV ; nom « (nouvel onglet) » sur les trois liens
    externes, rien sur l'entrée recruteur), `about-hero.spec` (lien CV), `about-hiring.spec`
    (LinkedIn et CV). Preuve RED contre l'ancien gabarit du bandeau : 4 échecs / 15 sur ce fichier.
  - Commentaire de `cv-download.ts` réécrit (WHY exact : la différence ne se voit que sous
    `provideHttpClientTesting`). NBSP littéraux du Plan de test remplacés par la notation échappée,
    continuations réindentées.

## Journal des tranches

- **Tranche 1 — une seule identité** : GREEN 3393 passed / 3483 total (29 tests de T1 verts, le reste = tranches suivantes) · refactor : aucun
- **Tranche 2 — accroche et cartouche d'accueil** : GREEN mesuré avec T3 · refactor : aucun
- **Tranche 3 — CV prérendu sur `/about`** : GREEN 3406 passed / 3483 total (T1–T3) · refactor : commentaire du choix `toSignal` ramené à une ligne
- **Tranche 4 — bandeau recruteur de l'accueil** : GREEN 3423 passed / 3483 total · refactor : aucun (bandeau déplacé dans la colonne du hero après verify, tests inchangés)
- **Tranche 5 — titres et meta d'intention** : GREEN mesuré avec T6 · refactor : titres dupliqués (onglet + `seo.title`) portés par des constantes `ABOUT_TITLE`, `PROJECTS_TITLE`, `BLOG_TITLE` comme `HOME_TITLE`
- **Tranche 6 — « Décrire mon projet » sur une page d'offre** : GREEN 3438 passed / 3483 total (T5–T6) · refactor : aucun
- **Tranche 7 — thèmes de blog vides masqués** : GREEN 3451 passed / 3483 total · refactor : aucun
- **Tranche 8 — phrase « problème → résultat »** : GREEN mesuré avec T9 · refactor : aucun
- **Tranche 9 — bloc de fin de fiche** : GREEN 3472 passed / 3483 total (T8–T9) · refactor : aucun
- **Tranche 10 — appel à avis Google en pied de page** : GREEN mesuré avec T11 · refactor : aucun
- **Tranche 11 — avis clients prêts, rien de rendu** : GREEN 3483 passed / 3483 total · refactor : copie de l'appel à avis extraite en `REVIEW_INVITATION_COPY` (2 consommateurs : `footer.static-data.ts`, `home-reviews.ts`)
- **Correctifs de revue (T4, T3)** : GREEN 3490 passed / 3490 total · refactor : liens externes du bandeau rendus par un `@for` (classes factorisées), annonce du nouvel onglet portée par `newTabLabel` (6 sites : bandeau ×3, hero, recrutement ×2)

## Verify

**Verdict : PASS** (2026-10-10, build de production servi en statique, Chromium headless 1208 via
playwright-core).

Gates (après correctifs de revue) : `pnpm test; echo exit=$?` → 200 fichiers, **3490 passed / 3490**, `exit=0` ; `pnpm lint` →
« All files pass linting » ; `pnpm run format:check` → vert ; `pnpm install --frozen-lockfile` → OK ;
`pnpm run build --configuration production` → exit 0, 20 routes prérendues, CSP sur 21 pages.

**HTML prérendu (`dist/angular-portfolio-app/browser`)** :

- `/` : un seul `h1` « Votre site ou votre application web, à prix annoncé, en ligne vite. » ;
  accroche TXT-02 avec « 890 € » ; cartouche aux cinq lignes TXT-03 ; bandeau « Vous recrutez ? »
  (`/about#recrutement`) · « CV (PDF) » (`https://api.nedellec-julien.fr/api/cv/download`) ·
  LinkedIn · GitHub, dans `app-home-hero-section` ; ni `home-reviews` ni placeholder ; JSON-LD sans
  clé `review` ni `g.page`.
- `/about` : titre TXT-12, meta TXT-13, lead = `journey` + TXT-07 ; `about-hero-cv` et
  `about-hiring-cv` (« Télécharger mon CV (PDF) ») présents, le premier avant `#recrutement`.
- `/offres/site-atelier` : sous-titre = `journey` + « Je crée des sites… ».
- `/projects/dashflow`, `/projects/candidash` : phrase TXT-17 / TXT-18 et « Usage personnel, pour
  ma famille et moi. » avant la description ; bloc « Un besoin similaire ? » avant la navigation,
  lien « Voir l'offre « Application métier sur mesure » » → `/offres/application-metier`, « Parcours
  et CV » → `/about#recrutement`. Démo → offre site vitrine, script → `/offres`.
- `/blog` : titre TXT-16 ; cartouche Stack 2 · Sécurité 1 · Parcours 1 · Projets 1 ; filtres
  « Tous 2, Stack 2, Sécurité 1, Parcours 1, Projets 1 » ; aucun « 0 article », aucun
  `aria-disabled`.
- Pied de page (toutes pages) : « Vous avez travaillé avec moi ? » + lien Google
  `target="_blank" rel="noopener noreferrer"`, nom « Laisser un avis sur Google (nouvel onglet) ».
- « vingt ans » / « 20 ans » : aucune occurrence hors articles. Seule `/blog` en contient, toutes
  issues de l'article API « De 20 ans de métallurgie… » (titre, extrait, état de transfert), hors
  périmètre.

**Navigateur** (toute requête non-GET interceptée et répondue 204 localement, aucune n'atteint la
prod ; seule observée : `POST api.nedellec-julien.fr/api/analytics/track`, interceptée ; GET de l'API
laissés passer, `/cv/download` simulé) :

1. `/offres/site-vitrine`, clic « Décrire mon projet » (en-tête) → URL inchangée
   `/offres/site-vitrine`, focus sur `#demande` calé à 80 px sous le haut ; `cta_click`
   `header_contact` émis. Même résultat au pied de page sur `/offres/site-atelier`. Sur
   `/projects`, le même bouton mène à `/` et focalise `#contact` (comportement inchangé).
2. Liens CV : `/` `home-recruiter-cv`, `/about` `about-hero-cv` et `about-hiring-cv` ouvrent
   `/api/cv/download` dans un nouvel onglet et émettent chacun un seul `{"type":"cv_download"}`.
3. `home-recruiter-about` → `/about#recrutement`, `cta_click` `home_recruiter_about`.
4. Un seul `h1` sur `/`, `/about`, `/offres/site-atelier`, `/offres/site-vitrine`, `/projects`,
   `/projects/dashflow`, `/projects/candidash`, `/blog`.
5. Hydratation : 0 requête `/api/cv` au chargement complet de `/` et de `/about` (transfer cache).
6. Console : aucune erreur, aucun avertissement, aucun `NG0` (CORS de l'API réécrit pour
   l'origine `localhost` en test).

**Bandeau recruteur après correctifs** (build de prod rebâti, même protocole, non-GET interceptés :
seul `POST /api/analytics/track`, répondu 204 localement ; console vide) :

| Viewport | Lignes du bandeau | Séparateur orphelin | `scrollWidth` du `p` / largeur | `scrollWidth` document | Bandeau (y) | Dans le 1er écran |
|---|---|---|---|---|---|---|
| 320×568 | « Vous recrutez ? » / « CV (PDF) · LinkedIn · GitHub » | non | 288 / 288 | 320 | 852–940 | non (accepté) |
| 375×667 | une ligne | non | 343 / 343 | 375 | 748–792 | non (accepté, arbitrage) |
| 375×812 | une ligne | non | 343 / 343 | 375 | 748–792 | oui |
| 414×896 | une ligne | non | 382 / 382 | 414 | 719–763 | oui |
| 1440×900 | une ligne | non | 682 / 682 | 1440 | 761–805 | oui |

Noms accessibles mesurés : bandeau « Vous recrutez ? », « CV (PDF) (nouvel onglet) », « LinkedIn
(nouvel onglet) », « GitHub (nouvel onglet) » ; `/about` : `about-hero-cv` et `about-hiring-cv`
« Télécharger mon CV (PDF) (nouvel onglet) », `about-hiring-linkedin` « Profil LinkedIn (nouvel
onglet) ». Captures : `/tmp/claude-1000/-home-j-ned-Projects-Portfolio-ng-portfolio-app/d6e00462-295b-4b2c-ad3e-98224ecb112d/scratchpad/verify/after-home-375.png` (375×812, remplace la précédente),
`/tmp/claude-1000/-home-j-ned-Projects-Portfolio-ng-portfolio-app/d6e00462-295b-4b2c-ad3e-98224ecb112d/scratchpad/verify/after-home-375x667.png`, `/tmp/claude-1000/-home-j-ned-Projects-Portfolio-ng-portfolio-app/d6e00462-295b-4b2c-ad3e-98224ecb112d/scratchpad/verify/after-home-320-band.png`.

**Captures** (avant = production au 2026-10-10, après = build local) :

- Accueil, haut de page : `/tmp/claude-1000/-home-j-ned-Projects-Portfolio-ng-portfolio-app/d6e00462-295b-4b2c-ad3e-98224ecb112d/scratchpad/verify/before-home-375.png`, `/tmp/claude-1000/-home-j-ned-Projects-Portfolio-ng-portfolio-app/d6e00462-295b-4b2c-ad3e-98224ecb112d/scratchpad/verify/after-home-375.png`,
  `/tmp/claude-1000/-home-j-ned-Projects-Portfolio-ng-portfolio-app/d6e00462-295b-4b2c-ad3e-98224ecb112d/scratchpad/verify/before-home-1440.png`, `/tmp/claude-1000/-home-j-ned-Projects-Portfolio-ng-portfolio-app/d6e00462-295b-4b2c-ad3e-98224ecb112d/scratchpad/verify/after-home-1440.png`
- Fiche DashFlow, fin de page : `/tmp/claude-1000/-home-j-ned-Projects-Portfolio-ng-portfolio-app/d6e00462-295b-4b2c-ad3e-98224ecb112d/scratchpad/verify/before-dashflow-end-375.png`,
  `/tmp/claude-1000/-home-j-ned-Projects-Portfolio-ng-portfolio-app/d6e00462-295b-4b2c-ad3e-98224ecb112d/scratchpad/verify/after-dashflow-end-375.png`, `/tmp/claude-1000/-home-j-ned-Projects-Portfolio-ng-portfolio-app/d6e00462-295b-4b2c-ad3e-98224ecb112d/scratchpad/verify/before-dashflow-end-1440.png`,
  `/tmp/claude-1000/-home-j-ned-Projects-Portfolio-ng-portfolio-app/d6e00462-295b-4b2c-ad3e-98224ecb112d/scratchpad/verify/after-dashflow-end-1440.png`

## Review code

**Verdict** : REJECTED
**Gates CI locaux** : tests ✅ (`pnpm exec ng cache clean && rm -rf node_modules/.vite && pnpm test` → 200 fichiers, 3483 passed / 3483, `exit=0`) / lint ✅ (`pnpm lint` → « All files pass linting », `exit=0`) / build ✅ (`pnpm run build --configuration production` → 20 routes prérendues, CSP sur 21 pages, `exit=0`) ; `pnpm run format:check` `exit=0` ; `pnpm install --frozen-lockfile` `exit=0`
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main sur le diff complet, fichiers non suivis compris. Archéologie (motif du profil) 0 hit ; `fakeAsync`/`waitForAsync`/`export default`/`effect(`/`innerHTML`/`console.`/snapshot/`.only`/`.skip` 0 hit ; U+00A0/U+202F littéral 0 dans les lignes `src` ajoutées
**Warnings de gate** : aucun (test, lint, build et prérendu lus en entier)
**Rendu compilé** : ❌ (bandeau recruteur à 320–414 px, point 1)
**Preuve de verify runtime** : ✅ (rejouée par la revue : build de prod servi en local, Chromium headless 1208, tout non-GET intercepté et répondu 204 localement ; seul observé `POST /api/analytics/track`. Console vide sur `/`, `/about`, `/offres/*`, `/projects`, `/projects/dashflow`, `/blog`)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ❌ (« bandeau recruteur discret dans le premier écran » non tenu en mobile, point 1)

**Mesures de la revue**

- Point 1 de la session vérifié : **pas de débordement horizontal**. `documentElement.scrollWidth` = largeur de fenêtre à 320, 360, 375, 390 et 414 px ; `scrollWidth` du `p` du bandeau = sa largeur (288 / 328 / 343 / 358 / 382). En revanche, le bandeau passe à la ligne **après le séparateur** : la première ligne finit sur « LinkedIn · », GitHub est seul sur une deuxième ligne 48 px plus bas (`min-h-11` + `gap-y-1`), à toutes ces largeurs. À 375×812, cette deuxième ligne occupe y = 796–840 : GitHub est sous le pli, d'où la capture. À 375×667 (viewport de référence du profil), le bandeau commence à y = 748 : **il est entièrement hors du premier écran**. À 320 px, il commence vers y = 900.
- Textes : H1, TXT-02 (« 890 € » lu depuis `OFFER_PRICES`), cartouche TXT-03, TXT-05 à 11, 13, 15, 16, 17 à 21 et 23 identiques dans le HTML prérendu. « Ouvert à un CDI… » inchangé. Ni employeur ni départ. « vingt ans / 20 ans / métallurgie » n'apparaissent que sur `/blog`, et ils viennent de l'article API (hors périmètre).
- CV : 0 requête `/api/cv` à l'hydratation de `/` et de `/about`. Liens prérendus (`https://api.nedellec-julien.fr/api/cv/download`, 1 sur `/`, 2 sur `/about`, `about-hero-cv` avant `#recrutement`). Un clic émet un seul `{"type":"cv_download"}` pour `home-recruiter-cv`, `about-hero-cv` et `about-hiring-cv`, et aucun `cta_click`.
- Avis : `HOME_REVIEWS = []`. Ni `home-reviews` ni placeholder dans le DOM. `ProfessionalService` sans clé `review`. `sameAs` = LinkedIn, GitHub, Malt (aucun `g.page`). Lien Google uniquement en pied de page, nom accessible « Laisser un avis sur Google (nouvel onglet) ». Un clic envoie `cta_click` `review_google`. 0 iframe, 0 script Google.
- « Décrire mon projet » : sur `/offres/site-vitrine` (en-tête) et `/offres/site-atelier` (pied de page), l'URL ne change pas, le focus va sur `#demande` (calé à 80 px) et `header_contact` est mesuré. Sur `/projects`, le bouton mène à `/` et met le focus sur `#contact`.
- A11y : un seul `h1` sur `/`, `/about`, `/projects/dashflow` (et un par page prérendue contrôlée) ; un `main`, un `header`, un `footer`. Le bloc de fin est une `section` nommée par « Un besoin similaire ? ». Blog : filtres « Tous 2, Stack 2, Sécurité 1, Parcours 1, Projets 1 », 0 `aria-disabled`.
- Écart `CvDownload` en `toSignal` au lieu de `rxResource` : **accepté**. Le contrat est tenu (`Signal<string | null>` en lecture seule, nul sans CV ou en erreur). L'instance appartient à la page, donc le désabonnement suit la destruction de la page. La lecture a lieu au prérendu et n'est pas rejouée à l'hydratation (mesuré). Voir la remarque mineure 1.
- Spec et ADR non suivis : frontmatter et tableaux cohérents. Voir la remarque mineure 2.
- Tests de `qa` : aucune modification de valeur attendue repérée. `filter-group.spec` n'est pas touché (E1). Seule l'assertion `console.warn` a été retirée, en RED (E2).

**Duplication / dérivation** (advisory, non bloquant) :
- ⚠️ `src/app/features/home/application/home-recruiter-band.ts:24-50`. La même liste de classes est répétée sur les trois liens externes. La classe du lien souligné est copiée entre `home-recruiter-band.ts:15` et `project-follow-up.ts:44`. Le correctif du point 1 peut rendre les liens par un `@for` sur un tableau `{ id, label, href, output }`.

**Risque résiduel** (advisory) :
- Le lien CV reflète l'état **au build**. Un CV supprimé dans l'admin laisse un lien 404 jusqu'au redéploiement (risque documenté dans la spec). Monitoring : Sentry.
- Non couvert par les gates : le rendu réel du bandeau en mobile. Aucun test ne mesure le passage à la ligne ni la position par rapport au pli.

**Remarques mineures** (non bloquantes) :
1. `src/app/features/cv/application/cv-download.ts:12` : le WHY est imprécis. En production, `HttpClient` retient aussi la stabilité jusqu'à la réponse. La différence avec `resource()` n'existe que sous `provideHttpClientTesting()` (`REQUESTS_CONTRIBUTE_TO_STABILITY = false`). Reformulation suggérée : un WHY exact, ou rien.
2. `specs/019-textes-et-parcours.md:456` : « écrits ` ` / ` ` » contient les caractères littéraux au lieu de la notation `<U+00A0>` / `<U+202F>` (illisible). Lignes 166-167 et 620-621 : lignes de continuation désindentées, artefact prettier, sans effet de rendu.

**Points à corriger** :
1. `src/app/features/home/application/home-recruiter-band.ts:21,32,42`. Les séparateurs `<span aria-hidden="true">·</span>` sont des éléments flex autonomes. Le bandeau passe donc à la ligne après « LinkedIn · » et laisse GitHub seul sur une deuxième ligne, à 320, 360, 375, 390 et 414 px. Correction attendue : attacher le séparateur à l'élément qui le suit (pseudo-élément `before:` sur les liens non premiers, ou liste `ul`/`li` avec séparateur en `before:`), pour qu'aucune ligne ne finisse par un séparateur. Corriger aussi le critère « dans le premier écran » de la Description, non tenu en mobile : à 375×667 le bandeau commence à 748 px, et à 375×812 GitHub est sous le pli. Il faut soit le repositionner ou le compacter (une seule ligne à 375 px, ou placement avant les CTA), soit faire arbitrer par la session, puis mettre à jour la Description et `DESIGN.md` (« Bandeau recruteur »). Valider par une capture à 375×667 et 375×812.
2. `src/app/features/home/application/home-recruiter-band.ts:24,35,45` et `src/app/features/profile/application/about-hero.ts:72`. Ces liens `target="_blank"` ajoutés par le diff n'annoncent pas le nouvel onglet. Les liens Google ajoutés dans le même diff le font (`REVIEW_INVITATION_COPY.newTab` en `sr-only`), comme les précédents de l'admin. Correction attendue : `<span class="sr-only"> (nouvel onglet)</span>`, depuis une copie unique. Le lien existant `about-hiring.ts:31,43` est hors diff : simple information.

### Addendum : relecture des correctifs (2026-10-10)

**Verdict** : APPROVED
**Gates CI locaux** : tests ✅ (`pnpm exec ng cache clean && rm -rf node_modules/.vite && pnpm test` → 200 fichiers, 3490 passed / 3490, `exit=0`) / lint ✅ (`pnpm lint`, `exit=0`) / build ✅ (`pnpm run build --configuration production` → 20 routes prérendues, CSP sur 21 pages, `exit=0`) ; `pnpm run format:check` `exit=0`
**Checks mécaniques** : checker non vendoré : greps joués à la main sur le delta (archéologie 0, U+00A0/U+202F littéral 0 dans `src` et dans la spec)
**Warnings de gate** : aucun
**Rendu compilé** : ✅
**Preuve de verify runtime** : ✅ (rejouée par la revue : build de prod servi en local, Chromium headless 1208, tout non-GET intercepté et répondu 204 localement, seul `POST /api/analytics/track` observé, console vide, 0 requête `/api/cv` à l'hydratation)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅ (critère « premier écran » amendé par arbitrage de la session : desktop exigé, mobile juste après les boutons, entrée mobile par le menu « Parcours » ; Description et DESIGN.md alignés)

**Point 1 (bandeau) : levé.** Mesures, accueil du build de prod :

| Fenêtre | `scrollWidth` doc / `p` | Bandeau (y) | Lignes |
|---|---|---|---|
| 320×667 | 320 / 288 = largeur | 852–940 (CTA finissent à 776) | 2 : « Vous recrutez ? » puis « CV (PDF) · LinkedIn · GitHub » entier |
| 375×667 | 375 / 343 = largeur | 748–792 (CTA à 672) | 1 |
| 414×896 | 414 / 382 = largeur | 719–763, dans l'écran | 1 |
| 1440×900 | 1440 / 682 = largeur | 761–805, **dans le premier écran** | 1 |

Chaque `·` est sur la même ligne que le lien qui le suit, à toutes les largeurs. Aucune ligne ne commence ni ne finit par un séparateur, aucun débordement. Le bandeau suit immédiatement les boutons en mobile, conformément à l'arbitrage. Le menu porte bien « Parcours » (`nav-items.ts:22`). Les clics restent mesurés une fois chacun : CV → `cv_download`, LinkedIn et GitHub → `cta_click` `home_recruiter_linkedin` / `_github`. `about-hero-cv` et `about-hiring-cv` émettent chacun un seul `cv_download`. Captures : `scratchpad/review/shots/v2-band-*.png`.

**Point 2 (nouvel onglet) : levé.** Écart `aria-label` au lieu de `sr-only` : **accepté**.
- **WCAG 2.5.3 (Label in Name)** : conforme. Noms accessibles mesurés : « CV (PDF) (nouvel onglet) », « LinkedIn (nouvel onglet) », « GitHub (nouvel onglet) », « Télécharger mon CV (PDF) (nouvel onglet) », « Profil LinkedIn (nouvel onglet) ». Chacun contient le libellé visible mot pour mot et **en tête**, ce qui est la pratique recommandée par le document *Understanding 2.5.3* : une commande vocale sur le libellé visible atteint le lien.
- **Cohérence avec les liens Google (`sr-only`)** : la technique diffère, mais le nom accessible obtenu a la même forme (« <libellé> (nouvel onglet) ») et la même source (`NEW_TAB_NOTICE`). L'écart est motivé par le contrat des tests de `qa` (`textContent` comparé à l'égalité) et a un précédent dans le repo (`admin-project-row.ts`, `admin-post-row.ts`). Ce n'est pas un défaut.

**Delta relu** : `home-recruiter-band.ts` (`@for` sur `{ id, label, href }` via `computed`, sorties indexées par `Record<ExternalLinkId, …>` vérifié au compilateur, classes factorisées, ce qui lève aussi la remarque de duplication) ; `shared/identity/new-tab-notice.ts` ; `about-hero.ts`, `about-hiring.ts` ; commentaire `cv-download.ts:12`, qui porte désormais le WHY exact (remarque mineure 1 levée) ; artefacts de la spec (NBSP littéraux remplacés, continuations réindentées : remarque mineure 2 levée). Les tests ajoutés ne touchent aucune valeur attendue existante.

**Remarques mineures** (non bloquantes) :
1. La Description (TXT-04, l. 58-59) note « Vous recrutez ? · CV (PDF) · … », mais le rendu sépare « Vous recrutez ? » du groupe par un espacement `gap-x-4`, sans point médian. DESIGN.md décrit fidèlement le rendu. Il reste à aligner la notation TXT-04 si l'on veut une table strictement exacte.
2. `shared/identity/new-tab-notice.ts` est une constante de copie et un helper, pas un composant d'interface. `shared/identity` aurait été un emplacement plus naturel (c'est déjà là que vit `REVIEW_INVITATION_COPY`, qui l'importe). C'est cosmétique.

**Risque résiduel** : inchangé (lien CV figé au build, Sentry en place).
