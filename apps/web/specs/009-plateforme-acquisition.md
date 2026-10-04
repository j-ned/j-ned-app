---
id: 009
title: Transformer le portfolio en plateforme d'acquisition client (catalogue d'offres, home commerciale, profil CDI en secondaire)
type: feat
status: draft
created: 2026-10-04
related: [PRODUCT.md, DESIGN.md, specs/007-offre-site-industrie.md, docs/adr/0004-contenu-statique-de-feature-sans-gateway.md, docs/adr/0005-catalogue-offres-routes-statiques.md]
---

# 009 — Plateforme d'acquisition

## Description

### Contexte

Le site sert aujourd'hui d'outil de qualification pour recruteurs (CDI) et clients tech (Malt).
Depuis la spec 007, une page d'offre isolée (`/offre-site-industrie`) vend un site vitrine aux
ateliers de mécanique. Julien est désormais entrepreneur individuel (SIRET dans
`SITE_IDENTITY.business`) et veut que le site devienne son **principal outil d'acquisition
client** : présenter un catalogue d'offres, convaincre par des preuves, et recueillir des
demandes qualifiées.

Décisions prises avec Julien (2026-10-04) :

- **Marque** : nom propre, « Julien Nédellec ». Pas de nom de studio.
- **Cible principale** : clients (TPE/PME, ateliers, équipes produit, CTO). Le recruteur CDI
  devient un public **secondaire**, servi par une page dédiée, hors du tunnel de vente.
- **Catalogue** : cinq offres, dont l'offre atelier existante, qui devient une déclinaison du
  modèle générique.
- **Démarche** : spec et maquette validées avant implémentation.

### Publics (à reporter dans `PRODUCT.md`)

1. **Dirigeant de TPE/PME ou artisan** (offres vitrine) : peu technique, lit sur téléphone,
   veut un prix fixe, un délai et un interlocuteur unique. Questions : combien, quand, qu'est-ce
   que j'obtiens, est-ce sérieux ?
2. **Gérant d'atelier mécanique** (offre atelier, spec 007) : sous-cas du public 1, vocabulaire du
   métier. Arrive par la prospection directe.
3. **Responsable métier / fondateur / CTO** (app sur mesure, refonte, régie) : technique ou
   semi-technique. Veut des preuves de livraison en production, une méthode, un cadre
   (forfait ou TJM). Arrive par recommandation, Malt, LinkedIn ou recherche.
4. **Recruteur tech (secondaire)** : trouve le parcours, la stack et le CV sur une page dédiée.

### Ce qui est attendu

#### 1. Positionnement et voix

- Promesse principale de la home (à affiner en maquette) : « Des sites et des applications
  web livrés en production, par un seul interlocuteur. » Sous-promesse : 20 ans d'industrie,
  aujourd'hui développeur full-stack Angular / NestJS ; rigueur d'atelier appliquée au logiciel.
- Voix inchangée (`PRODUCT.md`) : phrases courtes, aucun superlatif, aucun em-dash, faits
  vérifiables (prix, délais, livrables). Ne jamais citer l'employeur de Julien.
- Anti-références maintenues : pas de gradient hero, pas de faux mockup, pas de « Get Started ».
  La vente passe par des faits.

#### 2. Catalogue d'offres

Cinq offres, chacune avec : slug, nom, public visé, promesse, livrables, déroulé, tarif (ou cadre
tarifaire), FAQ, sujet prérempli du formulaire. **Prix validés par Julien le 2026-10-04.**

| Slug | Offre | Public | Cadre tarifaire |
|---|---|---|---|
| `site-vitrine` | Site vitrine pour TPE, PME et artisans, en ligne en 7 jours | 1 | Prix fixe **890 €** + maintenance **29 €/mois** |
| `site-atelier` | Site pro pour ateliers de mécanique (offre spec 007) | 2 | **690 €** + **29 €/mois** (existant) |
| `application-metier` | Application métier sur mesure (outil interne, back-office, portail client) | 3 | Sur devis après cadrage, « à partir de 4 500 € » |
| `refonte-maintenance` | Refonte, audit et maintenance d'une application existante | 3 | Audit au forfait **450 €** ; maintenance dès **190 €/mois** |
| `renfort-freelance` | Renfort développeur Angular / NestJS en régie | 3 | TJM communiqué sur demande, contractualisation possible via Malt |

- Page **catalogue** listant les cinq offres, regroupées en deux familles : « Sites » (vitrine,
  atelier) et « Applications » (sur mesure, refonte, régie).
- Une **page par offre**, gabarit commun réutilisant les sections de la spec 007 (en-tête avec
  prix, raisons, livrables, déroulé, tarif + mention TVA, FAQ native `<details>`, formulaire avec
  sujet prérempli). Les sections absentes d'une offre ne s'affichent pas (ex. pas de déroulé
  jour par jour pour la régie).
- **L'URL `/offre-site-industrie` continue de fonctionner** (elle figure dans la prospection
  déjà envoyée) : redirection permanente vers la nouvelle URL de l'offre atelier, ou maintien,
  au choix de l'architecte, sans contenu dupliqué indexable (canonical unique).
- L'offre atelier **reste absente de la home** (public de prospection directe) : elle figure
  dans le catalogue et dans le pied de page seulement (décision Julien, 2026-10-04).

#### 3. Nouvelle home (orientée conversion)

Ordre indicatif, à arbitrer en maquette :

1. **Hero** : promesse, sous-promesse, CTA principal « Décrire mon projet » (vers le formulaire),
   CTA secondaire « Voir les offres ». Disponibilité visible.
2. **Offres** : les familles Sites / Applications, avec prix d'appel ou cadre tarifaire, lien
   vers chaque page d'offre.
3. **Preuves** : réalisations (projets existants présentés comme études de cas : contexte,
   ce qui a été livré, stack, résultat), chiffres vérifiables. Aucun projet n'est présenté comme
   une référence client : « Le Vieux Comptoir » est un projet de **démo**, affiché avec un libellé
   explicite « Démo » partout où il apparaît (réalisations, home, détail).
4. **Méthode** : comment je travaille (cadrage, livraisons visibles, mise en production,
   maintenance), engagements (prix ferme, code et domaine au nom du client, pas d'abonnement
   caché).
5. **Pourquoi moi** : parcours industrie + logiciel, en trois arguments courts.
6. **FAQ générale** (natives `<details>`).
7. **Contact** : formulaire existant.

#### 4. Navigation et pages existantes

- Menu principal : Offres, Réalisations, Méthode (ou section home), Blog, À propos, plus un
  bouton d'appel « Décrire mon projet » visible en permanence.
- `/projects` présenté comme « Réalisations » (l'URL existante reste valide pour le SEO).
- `/about` devient la page **Parcours** : histoire, stack, diplômes, et un bloc dédié
  « Vous recrutez ? » (disponibilité CDI, CV téléchargeable, LinkedIn). C'est le seul point
  d'entrée du public recruteur, accessible depuis le footer et la page À propos.
- Blog inchangé fonctionnellement.
- Footer : liens vers toutes les offres, « Vous recrutez ? », mentions légales, confidentialité.
- `SITE_IDENTITY.availability` reformulé pour des clients (ex. « Disponible pour de nouveaux
  projets, démarrage sous 2 semaines »), la mention CDI passe sur la page Parcours.

#### 5. Formulaire et qualification

- Même backend, même endpoint, même anti-spam que le formulaire actuel. **Aucun changement
  backend dans cette spec.**
- Le formulaire peut être prérempli depuis une page d'offre (sujet = nom de l'offre), comme dans
  la spec 007.
- Hors backend, une qualification légère est souhaitée (type de projet, délai souhaité) : si elle
  exige un nouveau champ côté API, elle est reportée à une spec backend dédiée ; sinon elle est
  encodée dans le sujet ou le message. À trancher par l'architecte.

#### 6. SEO

- Chaque page d'offre et le catalogue sont **prérendus**, dans `sitemap.xml`, avec title,
  description, Open Graph, JSON-LD `Service` + `Offer` (prix quand il existe) et `BreadcrumbList`.
- La home passe d'un JSON-LD `Person` seul à `Person` + `ProfessionalService` (zone : Yvelines,
  Île-de-France, France à distance).
- Titles et descriptions orientés recherche client (« création site vitrine Yvelines »,
  « développeur Angular freelance », etc.).

#### 7. Documentation produit

- Réécrire `PRODUCT.md` : publics, purpose, critères de succès (demande de devis envoyée),
  séparation des publics, anti-références ajustées à un site qui vend.
- Mettre à jour `DESIGN.md` si la maquette introduit de nouveaux composants (carte d'offre,
  bloc prix, étude de cas).

### Hors périmètre

- Paiement en ligne, prise de rendez-vous intégrée, espace client.
- Changement backend (nouveaux champs de formulaire, CRM, tableau de bord prospects).
- Démo en ligne des modèles de sites (pas encore déployée) : aucun lien vers une démo inexistante.
- Nom de marque distinct et logo.
- Témoignages clients : aucun témoignage inventé. Un emplacement n'est créé que lorsqu'un vrai
  témoignage existe.

### Critères d'acceptation

- [ ] Les cinq pages d'offre et le catalogue sont prérendus : le HTML servi contient `<h1>`,
      prix ou cadre tarifaire, FAQ et formulaire.
- [ ] `/offre-site-industrie` répond (redirection permanente ou page), sans contenu dupliqué
      indexable.
- [ ] La home présente hero orienté client, offres, preuves, méthode, FAQ et contact ; un seul
      `<h1>` ; le CTA principal mène au formulaire.
- [ ] Le menu principal contient « Offres » et un bouton d'appel permanent.
- [ ] La page Parcours contient le bloc « Vous recrutez ? » ; aucune mention CDI ne reste sur
      la home ni dans le hero.
- [ ] Chaque formulaire d'offre a son sujet prérempli et modifiable ; le formulaire de la home
      garde un sujet vide.
- [ ] Toutes les nouvelles pages sont dans `sitemap.xml` avec title, description, `og:*`,
      JSON-LD `Service`/`Offer` et `BreadcrumbList`.
- [ ] « Le Vieux Comptoir » est libellé « Démo » sur la liste des réalisations, la home et sa
      page de détail ; aucun projet n'est présenté comme une référence client.
- [ ] `PRODUCT.md` réécrit pour la nouvelle stratégie.
- [ ] Zéro violation axe sur les pages publiques ; Lighthouse ≥ 95 (perf, a11y, SEO) sur home,
      catalogue et une page d'offre.
- [ ] Gates au vert : `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm test`, `pnpm lint`.

## Plan technique

> Décision structurante : **ADR-0005** (catalogue d'offres : contenu statique scindé, routes
> statiques générées depuis le catalogue, URL héritée redirigée par nginx). Prolonge ADR-0004
> (contenu statique = constante de domaine) et ADR-0001 (`@defer` avec trigger `hydrate`).
> Profil lu : `.claude/project-profile.md`. **Aucune dépendance ajoutée, aucun changement backend.**
>
> Fait structurant vérifié dans le `Dockerfile` : en production, **nginx sert le dossier
> `browser` prérendu**, il n'y a **pas** de serveur SSR à la requête (`src/server.ts` n'est pas
> exécuté). Toute réponse HTTP (statut 301, 404) se décide donc dans nginx ou au build, jamais
> dans Angular.

### 1. Architecture

**Feature `features/offer/` généralisée en catalogue**, toujours deux couches (`domain/` +
`application/`, ADR-0004), plus deux fichiers à la racine de la feature (comme
`features/projects/projects.routes.ts`) : `offer.routes.ts` (routes enfants lazy) et
`offer-seo.ts` (construction des `SeoData`, seule pièce qui importe `@shared`).

```
app.routes.ts
  ├─ { path: 'offres', loadChildren → OFFER_ROUTES }            (lazy, chunk offre)
  │     ├─ ''              → OfferCatalogue   data.seo = toOfferCatalogueSeo(OFFERS)
  │     └─ OFFERS.map(s →  s.slug → OfferPage  data { summary: s, content: OFFER_PAGES[s.slug],
  │                                                   seo: toOfferSeo(s, content, url) })
  ├─ { path: 'offre-site-industrie', redirectTo: '/offres/site-atelier' }   (navigation SPA)
  └─ '' Home : data.seo @graph [Person, ProfessionalService{ hasOfferCatalog: toOfferCatalogJsonLd(OFFERS) }]

app.routes.server.ts : 'offres' + OFFERS.map(s → `offres/${s.slug}`) en RenderMode.Prerender
scripts/generate-sitemap.mjs : '/offres' + OFFERS.map(offerPath)      (import tsx du domaine)
Dockerfile (nginx) : /offre-site-industrie → 301 /offres/site-atelier (query conservée)

domain/
  offer-catalog.static-data.ts  OFFERS : résumés (petits)  ← home, footer, header, sitemap, server routes
  offer-pages.static-data.ts    OFFER_PAGES : contenu complet, indexé par slug ← chunk lazy seulement
  offer-prices.static-data.ts   OFFER_PRICES : montants numériques, source unique (cartes, pages, JSON-LD)
```

- **Routing : routes statiques générées depuis `OFFERS`, pas de route paramétrée `:slug`.**
  Un slug inconnu (`/offres/inexistant`) ne correspond à aucune route : nginx ne trouve pas de
  fichier prérendu ⇒ **vraie 404** (`error_page 404 /index.csr.html`, déjà en place et vérifié
  par la CI) puis le routeur client tombe sur `**` (`PageNotFound`). Ni guard, ni resolver, ni
  lookup runtime. Détail et alternatives : ADR-0005.
- **Passage des données à la page** : `withComponentInputBinding()` (déjà actif) lie
  `data.summary` et `data.content` aux `input.required()` de `OfferPage`. Les clés de `data`
  priment sur les query params dans la liaison : un `?summary=` ne peut rien injecter.
- **`/offre-site-industrie`** : redirection permanente **dans nginx** (§ 8). La route Angular
  `redirectTo` ne sert qu'aux navigations client (dev server, ancien lien interne). Elle n'est
  **pas** déclarée en `Prerender` : un redirect prérendu ne produit qu'une page `meta refresh`,
  pas un 301.
- **Composants de page dumb** (`input()` seulement). Les seules dérivations sont des fonctions
  pures du domaine appelées à l'initialisation de champs constants (`groupOffersByFamily`) :
  **pas de presenter** (aucun état, aucune interaction, donnée statique → template).
- **Landmarks (ownership unique, inchangé)** : le shell `App` possède `main`, `banner`
  (`app-header`) et `contentinfo` (`app-footer`). Ni `OfferPage`, ni `OfferCatalogue`, ni les
  nouvelles sections de la home, ni `AboutHiring` n'émettent `main`, `footer` ou `header` hors
  `section`.
- **Formulaire de demande des pages d'offre sans `@defer`** (inchangé depuis la spec 007 : c'est
  le contenu principal de la route).

### 2. Fichiers à créer / modifier

Liste par tranche (§ Tranches). Récapitulatif des fichiers porteurs :

**Créer**

| Fichier | Rôle |
|---|---|
| `src/app/features/offer/domain/models/offer.model.ts` | `OfferSlug`, `OfferFamily`, `OfferSummary`, `OfferPageContent`, `OfferSection<T>`, `OfferPriceLine`, `OfferAmount`, `OfferPages` (remplace `site-offer.model.ts`) |
| `src/app/features/offer/domain/offer-prices.static-data.ts` | `OFFER_PRICES` (montants, par offre) |
| `src/app/features/offer/domain/offer-catalog.static-data.ts` | `OFFERS` (résumés ordonnés), `OFFER_FAMILY_LABELS` |
| `src/app/features/offer/domain/offer-pages.static-data.ts` | `OFFER_PAGES` (`satisfies OfferPages`, remplace `site-offer.static-data.ts`) |
| `src/app/features/offer/domain/format-eur.ts` | `formatEur(amount)` : `Intl.NumberFormat('fr-FR')` + ` €` |
| `src/app/features/offer/domain/offer-path.ts` | `OFFERS_BASE_PATH = 'offres'`, `offerPath(slug)` → `/offres/<slug>` |
| `src/app/features/offer/domain/group-offers-by-family.ts` | Regroupement Sites puis Applications, familles vides omises (T4) |
| `src/app/features/offer/offer-seo.ts` | `toOfferSeo`, `toOfferCatalogueSeo`, `toOfferCatalogJsonLd` (pures) |
| `src/app/features/offer/offer.routes.ts` | `OFFER_ROUTES` générées depuis `OFFERS` |
| `src/app/features/offer/application/offer-page.ts` | Page générique (remplace `site-offer.ts`) |
| `src/app/features/offer/application/offer-catalogue.ts` | Page catalogue `/offres` (T4) |
| `src/app/features/offer/application/components/offer-card.ts` | Carte d'offre (catalogue + home) (T4) |
| `src/app/shared/ui/faq-list.ts` | FAQ `<details>` native, promue depuis `OfferFaq` au 2e consommateur (T7) |
| `src/app/shared/ui/key-point-list.ts` | Liste `lead` + `detail`, promue depuis `OfferReasons` au 2e consommateur (T7) |
| `src/app/features/home/application/home-offers.ts` | Section offres de la home (T6) |
| `src/app/features/home/application/home-method.ts` | Section méthode + engagements (T7) |
| `src/app/features/home/domain/models/home-pitch.model.ts` + `home-pitch.static-data.ts` | Méthode, pourquoi moi, FAQ générale (constantes de domaine, ADR-0004) (T7) |
| `src/app/features/profile/application/about-hiring.ts` | Bloc « Vous recrutez ? » (T5) |
| `src/app/features/contact/domain/compose-contact-message.ts` | Encodage de la qualification dans le message (T9) |
| `src/app/features/contact/domain/contact-timelines.static-data.ts` | Options de délai (T9) |
| `docs/adr/0005-catalogue-offres-routes-statiques.md` | ADR (créé) |
| specs `*.spec.ts` associés | rôle `qa` |

**Modifier** : `app.routes.ts`, `app.routes.server.ts`, `scripts/generate-sitemap.mjs`,
`Dockerfile` (nginx), `.github/workflows/ci.yml` (smoke 301), offer `components/*` (titres de
section en données), `home.ts`, `home-hero-section.ts`, `home.static-data.ts`,
`site-identity.static-data.ts`, `about.ts`, `header.ts`, `nav-items.ts`, `footer.ts`,
`projects.ts` (libellé « Réalisations »), `contact-form.ts`, `PRODUCT.md`, `DESIGN.md`.

**Supprimer** (T1) : `site-offer.ts`, `site-offer.model.ts`, `site-offer.static-data.ts` et
leurs specs (réécrits sur le modèle générique). **Ne pas committer** `public/sitemap.xml`
régénéré localement (artefact du build Docker, conflit garanti).

### 3. Modèles de données

`type` immuables (`readonly`, `readonly T[]`), pas d'`interface`, unions plutôt qu'enums.

```ts
type OfferSlug = 'site-atelier';        // T1 ; T3 ajoute 'site-vitrine' | 'application-metier'
                                        //            | 'refonte-maintenance' | 'renfort-freelance'
type OfferFamily = 'sites' | 'applications';

type OfferAmount =                      // T1 : 'fixed' seul ; T3 ajoute 'from' et 'on-request'
  | { readonly kind: 'fixed'; readonly eur: number }
  | { readonly kind: 'from'; readonly eur: number }
  | { readonly kind: 'on-request' };
type OfferPeriod = 'once' | 'month' | 'day';

type OfferPriceLine = {
  readonly id: string; readonly name: string;           // « Création », « Maintenance », « Audit », « Régie »
  readonly amount: OfferAmount; readonly period: OfferPeriod;
  readonly label: string;                               // construit avec formatEur(OFFER_PRICES…)
  readonly terms: string; readonly includes?: readonly string[];
  readonly link?: 'malt';                               // T3 : clé de plateforme, résolue par la page
};

type OfferSummary = {
  readonly slug: OfferSlug; readonly family: OfferFamily;
  readonly name: string; readonly audience: string; readonly promise: string;
  readonly priceTeaser: string;                         // « 690 €, prix final », « À partir de 4 500 € »…
  readonly featuredOnHome: boolean;                     // false pour site-atelier (décision Julien)
  readonly seo: {
    readonly title: string; readonly description: string; readonly serviceType: string;
    readonly serviceDescription?: string;               // Service.description (atelier : texte actuel)
    readonly breadcrumbName?: string;                   // nom du fil d'Ariane, défaut `name` (atelier : « Sites pour ateliers »)
  };
};

type OfferSection<T> = { readonly heading: string; readonly items: readonly T[] };
type OfferPageContent = {
  readonly hero: { readonly title: string; readonly subtitle: string; readonly ctaLabel: string };
  readonly reasons?: OfferSection<OfferReason>;          // sections optionnelles :
  readonly deliverables?: OfferSection<string>;          // absentes ⇒ non rendues (@if)
  readonly steps?: OfferSection<OfferStep>;
  readonly pricing: { readonly heading: string; readonly lines: readonly OfferPriceLine[] };
  readonly faq?: OfferSection<OfferFaqItem>;
  readonly request: { readonly subject: string; readonly intro: string };
};
type OfferPages = Readonly<Record<OfferSlug, OfferPageContent>>;
```

- **Compile-time avant runtime** : `OFFER_PAGES` est annoté `: OfferPages` (pas `as const satisfies`, qui figerait chaque ligne de prix en type littéral et masquerait les champs optionnels comme `includes`) :
  ajouter un slug à `OfferSlug` sans page casse la compilation. La couverture inverse
  (`OFFERS` contient chaque slug une seule fois) n'est pas exprimable sur un tableau ordonné :
  elle est tenue par un test de domaine (ensemble des slugs de `OFFERS` = clés de `OFFER_PAGES`,
  sans doublon).
- **Scission résumé / contenu (pourquoi)** : `OFFERS` est consommé par le shell eager (footer,
  header) et la home (route par défaut, bundle initial). Le contenu complet (FAQ, livrables,
  déroulés de cinq offres) ne doit entrer que dans le chunk lazy `offres`. Deux fichiers, pas
  un : la scission se lit dans l'import, sans dépendre du tree-shaking.
- **Source unique des prix** : `OFFER_PRICES` (montants validés le 2026-10-04 : vitrine 890 +
  29/mois ; atelier 690 + 29/mois ; application métier à partir de 4 500 ; audit 450 ;
  maintenance applicative dès 190/mois ; régie sur demande). Libellés construits par
  `formatEur()` dans les fichiers de données (précédent spec 007 : libellés calculés à la
  définition, pas de pipe ni de `CurrencyPipe`, absent de la locale en TestBed). Tests : comparer
  le DOM à `formatEur(OFFER_PRICES…)` ou aux libellés des constantes, jamais à des littéraux
  (espaces insécables et séparateur de milliers U+202F).
- **Domaine pur** : aucun fichier de `domain/` n'importe `@shared` ni un alias `@…` (le script
  sitemap les importe via `tsx`) : imports relatifs seulement. La mention TVA reste dans
  `SITE_IDENTITY.business`, transmise par la page en `input()`.
- **Titres de section en données** : « Pourquoi un tourneur plutôt qu'une agence », « Le déroulé
  en 7 jours », « Ce que contient le site » sont propres à l'atelier ; ils passent dans
  `OfferSection.heading`. Les composants `offer-*` ne portent plus de texte métier.
- **Lien de plateforme d'une ligne de prix (T3)** : `OfferPriceLine.link?: 'malt'` est une clé
  de domaine, pas une URL (le domaine n'importe pas `@shared`). `OfferPage` la résout vers
  `SITE_IDENTITY.socials.malt` et la transmet à `OfferPricing` en `input()` (`maltUrl`), comme la
  mention TVA ; rendu `<a data-testid="offer-price-link" target="_blank" rel="noopener
  noreferrer" class="link-btn-outline">` dans la carte de la ligne. Seule la régie la porte.
- `SITE_IDENTITY` : `availability` reformulé pour les clients (T6), ajout de
  `hiringAvailability` (mention CDI, T5).
- Validation runtime aux frontières : sans objet (aucune donnée externe ajoutée).

### 4. Réactivité

- Catalogue, pages d'offre, sections de home : aucune réactivité (constantes en `input()`).
- Home : `rxResource` sur `HomeGateway` inchangé (hero, highlights, buildSteps, projets
  vedettes). Les nouvelles sections lisent des constantes synchrones.
- `AboutHiring` : URL du CV chargée côté client comme le header aujourd'hui (`afterNextRender`
  + `CvGateway.getCurrent()`, lien masqué sans CV). Le lien LinkedIn et la mention CDI sont
  statiques et prérendus.
- `ContactForm` (T9) : modèle local étendu `{ ...ContactFormData, projectType, timeline }` ; le
  payload envoyé au `ContactGateway` reste `ContactFormData` (contrat API inchangé), le message
  étant composé par `composeContactMessage()`.

### 5. État partagé & coordination

Aucun store, aucune facade, aucun gateway nouveau. `ContactGateway`, `CvGateway`, `HomeGateway`,
`SectionScroller`, `ActiveSection` réutilisés tels quels. Le CTA permanent du header et le CTA
du hero passent par `SectionScroller.scrollTo('contact')` (pattern existant de l'entrée
« Contact » de `NAV_LINKS`, que le CTA remplace).

### 6. Cross-platform

Sans objet (profil : aucune cible native).

### 7. Choix de bibliothèques

Aucun ajout. Axe et Lighthouse se prouvent en verify sur le build de prod (comme la spec 007).

### 8. Décisions tranchées (points 1 à 7 du brief)

**8.1 Catalogue et routing.** Routes statiques générées (cf. § 1, ADR-0005). URL :
catalogue `/offres`, détail `/offres/<slug>`, atelier `/offres/site-atelier`. Route `offres`
en `loadChildren` (le contenu complet reste hors du bundle initial ; `app.routes.ts` n'importe
plus `SITE_OFFER_PRICES`). `data.preload: true` posé quand « Offres » entre dans le menu (T8).
Server routes générées depuis `OFFERS` (pas de `getPrerenderParams` : il est fait pour des
routes paramétrées, et une server route `:slug` face à des routes applicatives statiques est un
appariement implicite qu'on n'a pas à parier). Test : chaque slug a sa server route `Prerender`.

**8.2 `/offre-site-industrie` : redirection permanente nginx (recommandée)**, plutôt que le
maintien avec canonical. Une seule URL indexable, aucun contenu dupliqué, les liens de
prospection déjà envoyés continuent de fonctionner, et le jus SEO de l'ancienne URL est
transféré. Bloc à ajouter au `server` du `Dockerfile` :

```nginx
location ~ ^/offre-site-industrie/?$ {
    absolute_redirect off;
    return 301 /offres/site-atelier$is_args$args;
}
```

- `absolute_redirect off` est **obligatoire** : sans lui nginx écrit
  `Location: http://<host>:3000/offres/…` (il ne voit ni le TLS ni le port publics, Traefik est
  devant). `Location` relatif est valide (RFC 9110).
- `$is_args$args` conserve les paramètres UTM des liens de prospection.
- Les en-têtes de sécurité sont hérités du `server` (la `location` ne pose aucun `add_header`).
- CI (`ci.yml`, job docker) : `curl` sur `/offre-site-industrie?utm_source=x` → statut 301,
  `location: /offres/site-atelier?utm_source=x` ; `/offres/site-atelier/` → 200 contenant
  `<app-offer-page`.

**8.3 SEO généré depuis `OFFERS`.** `toOfferSeo(summary, content, url): SeoData` produit title,
description, `type: 'website'`, et un `@graph` unique (le service `Seo` n'écrit qu'un script
JSON-LD) : `Service` (`name`, `serviceType`, `provider` Person, `areaServed` Yvelines +
Île-de-France, et pour la régie et les applications `{ '@type': 'Country', name: 'France' }`) +
`offers` dérivées des `OfferPriceLine` + `BreadcrumbList` Accueil → Offres → offre. Mapping :
`fixed`/`once` → `Offer.price` ; `fixed`/`month` → `UnitPriceSpecification` `unitCode: 'MON'` ;
`from`/`once` → `PriceSpecification.minPrice` ; `from`/`month` → `UnitPriceSpecification`
`minPrice` + `unitCode: 'MON'` ; `on-request` → `Offer` sans prix (ni `price` ni
`priceCurrency`), quelle que soit la période. Prix toujours
`String(montant)`, `priceCurrency: 'EUR'`. Le catalogue : `CollectionPage` + `ItemList` des
cinq URLs + `BreadcrumbList`. Invariants testés sur **toutes** les offres (`it.each(OFFERS)`) :
description ≤ 160 caractères, aucun `—`, URL = `siteUrl + offerPath(slug)`. Sitemap :
`staticUrls` perd `/offre-site-industrie`, gagne `/offres` (0.8) et `OFFERS.map(offerPath)`
(0.7), importés du domaine par `tsx`.

**8.4 Home.** Ordre : hero → offres → preuves (`HomeProof` + `HomeProjects`) → méthode →
pourquoi moi → FAQ → contact. Rendu :

| Section | Rendu | Raison |
|---|---|---|
| Hero (`HomeHeroSection`, données `HomeGateway`) | eager | LCP, `h1` unique |
| Offres (`HomeOffers`, `OFFERS`) | **eager** | chemin de conversion n° 1, contenu SEO, petit (résumés) |
| `HomeProof` | eager (inchangé, réserve de hauteur conservée) | |
| `HomeProjects` | `@defer (hydrate on viewport; on viewport; prefetch on idle; when eagerSections())` inchangé | images, données API |
| Méthode, pourquoi moi, FAQ | même `@defer` que ci-dessus, placeholders dimensionnés | sous le pli ; le trigger `hydrate` les met dans le HTML prérendu (ADR-0001) |
| Contact | `@defer` inchangé (ADR-0001, jamais `hydrate on interaction`) | |

Wrapper `<div id="methode" class="scroll-mt-20" appSectionVisibility="methode">` **hors** du
`@defer` (même gabarit que `#contact`) pour l'entrée de menu « Méthode ». Hero : CTA principal
« Décrire mon projet » (`SectionScroller`), secondaire « Voir les offres » (`<a routerLink>`
vers `/offres`, fonctionne sans JS) ; la disponibilité devient du texte, plus un lien Malt (Malt
reste au footer et sur l'offre régie). Analytics : identifiants `home_hero_contact` et
`home_hero_offers`. JSON-LD home : `@graph` `Person` (sans `jobTitle` CDI) +
`ProfessionalService` (`areaServed` Yvelines, Île-de-France, France ; `address` locality ;
`hasOfferCatalog` = `toOfferCatalogJsonLd(OFFERS)`). Les réalisations restent les projets de
l'API, rendus par `ProjectCard` : **aucun champ « étude de cas » n'est ajouté** (backend exclu) ;
« Le Vieux Comptoir » est libellé « Démo » par sa **catégorie**, éditée dans l'admin (donnée,
pas de code ; `ProjectCard` et le filtre de `/projects` affichent déjà la catégorie).

**8.5 Navigation.** `NAV_LINKS` : Offres (`/offres`), Réalisations (`/projects`), Méthode
(section `methode`), Blog, À propos. L'entrée section « Contact » disparaît au profit d'un
**bouton d'appel** « Décrire mon projet » hors `nav` (`data-testid="header-cta"`), visible à
toutes les largeurs (dans la barre en mobile, pas seulement dans le drawer). Il cible toujours
le formulaire de la home (comportement unique et prévisible ; les pages d'offre ont leur propre
CTA vers `#demande`). Le lien « Télécharger mon CV » et `CvGateway` quittent le header (public
recruteur servi par la page Parcours). Footer : nav « Offres » (les cinq, atelier compris, via
`OFFERS` + `offerPath`), « Vous recrutez ? » (`routerLink="/about" fragment="recrutement"`),
mentions légales, confidentialité. Le lien « Sites pour ateliers » est remplacé par l'entrée
atelier de la liste. `/projects` : route `title`/`seo`/fil d'Ariane et `h1` « Réalisations »,
URL inchangée.

**8.6 Parcours.** Route `/about` : title « Parcours | Julien Nédellec », fil d'Ariane
« Parcours », description sans tunnel commercial. `AboutHiring` rendu **sans `@defer`** et porte
`id="recrutement"` + `scroll-mt-20` : sur une navigation SPA, un bloc `@defer (on viewport)`
resterait sur son placeholder et l'ancre `#recrutement` ne trouverait rien. Contenu :
`SITE_IDENTITY.hiringAvailability`, lien CV (client), lien LinkedIn. Mention CDI : uniquement
ici (et dans le texte de motivation du profil, déjà sur `/about`). `SITE_IDENTITY.availability`
devient « Disponible pour de nouveaux projets, démarrage sous 2 semaines » (copy à confirmer,
§ Questions).

**8.7 Qualification sans backend : encodée dans le message, pas dans le sujet.** L'API accepte
`subject` ≤ 200 et `message` ≤ 5 000 caractères (DTO `CreateContactMessageDto` du repo API) ;
le sujet reste libre et prérempli par les pages d'offre. Deux `<select>` **optionnels**
(zéro friction) : « Type de projet » (options passées par `input()` `projectTypes`, vide ⇒
select non rendu ; la home passe les noms de `OFFERS` + « Autre », les pages d'offre ne passent
rien, leur sujet qualifie déjà) et « Délai souhaité » (`CONTACT_TIMELINES` du domaine contact).
`composeContactMessage()` préfixe `Type de projet : …` / `Délai souhaité : …` et une ligne vide,
seulement pour les valeurs choisies. Validation ajoutée au schéma : `maxLength(subject, 200)` et
un `validate` sur `message` qui refuse un message **composé** de plus de 5 000 caractères (borne
calculée sur la sortie réelle, pas sur une réserve devinée) : sans elle, l'API répondrait 400
après la saisie.

### 9. Risques & inconnues

- Largeur du header : cinq entrées + CTA + bascule de thème ne tiennent probablement pas à
  768 px ; la maquette doit trancher le point de bascule (`md` → `lg`) avant la tranche 8.
- Slugs futurs : un slug renommé après publication casse une URL indexée ; il faudra alors une
  redirection nginx de plus (la liste vit dans le `Dockerfile`, pas dans le code Angular).
- `app.routes.ts`, `footer.ts`, `home.ts` sont touchés par plusieurs tranches : merger dans
  l'ordre et rebaser (CLAUDE.md workflow item 7) ; T5 seule est parallélisable avec T1 à T4.

### Questions ouvertes pour Julien (tranchées le 2026-10-04)

1. **Maintenance 29 €/mois** : **deux tarifs distincts** de même montant (vitrine et atelier),
   chacun dans `OFFER_PRICES` de son offre.
2. **Vitrine 890 € à côté de l'atelier 690 €** dans le catalogue : **voulu**, affiché tel quel.
3. **« Démarrage sous 2 semaines »** : **confirmé**. `SITE_IDENTITY.availability` =
   « Disponible pour de nouveaux projets, démarrage sous 2 semaines » (T6).
4. Copy des quatre nouvelles offres : **validée le 2026-10-04**, voir `specs/009-copy-offres.md`
   (renfort à temps partiel uniquement). Atelier validé le 2026-10-04 : `audience` = « Ateliers d'usinage, de
   décolletage et de mécanique de précision », `promise` inchangée.
5. Numérotation : spec renumérotée **009** (`008-a11y-landmarks.md` existe sur `master`).

### Tranches

Une PR par tranche, dans l'ordre. Chaque tranche part de `master` à jour (la précédente mergée),
sauf T0 et T5, indépendantes. Les critères listés sont ceux que `qa` transforme en tests ; les
preuves de prérendu se font en verify (`pnpm build` puis `grep` dans
`dist/angular-portfolio-app/browser/**/index.html`).

- **Tranche 0 — documentation produit** (hors cycle TDD, aucune ligne de code) : réécriture de
  `PRODUCT.md` (publics 1 à 4 de la Description, purpose, succès = demande de devis envoyée,
  séparation des publics, anti-références d'un site qui vend par des faits, aucun projet
  présenté comme client). Parallélisable avec tout.

- **Tranche 1 — l'offre atelier sur le modèle générique** (refactor, URL et rendu inchangés).
  Fichiers : `offer.model.ts`, `offer-prices`, `offer-catalog`, `offer-pages`, `format-eur.ts`,
  `offer-seo.ts` (`toOfferSeo` seul, URL en paramètre), `offer-page.ts`, composants `offer-*`
  (titres en données, `OfferPricing` sur `lines`), `app.routes.ts` (route `offre-site-industrie`
  → `OfferPage`, `data` = `summary`/`content`/`toOfferSeo(…, siteUrl + '/offre-site-industrie')`).
  - La page rendue avec les données atelier affiche exactement les textes et testids de la spec
    007 (`offer-title`, `offer-hero-price` = `summary.priceTeaser`, `offer-reason` × 3,
    `offer-deliverable` × 9, `offer-step` × 4, `offer-faq-item` × 5, `offer-vat-mention`,
    `offer-request` avec sujet = `content.request.subject`), un seul `h1`.
  - Les titres de section `h2` = `content.<section>.heading`.
  - Une page construite sans `steps` ni `faq` (builder de test) ne rend ni `offer-step` ni
    `offer-faq-item`, ni leur `h2`.
  - `OfferPricing` rend une carte par `OfferPriceLine` (`offer-price-line` × `lines.length`), avec
    `label`, `terms`, `includes`.
  - `toOfferSeo(atelier)` produit un `@graph` égal à celui d'aujourd'hui (Service, deux Offer,
    BreadcrumbList) ; `formatEur(690)` = `'690 €'`, `formatEur(4500)` contient le séparateur
    de milliers fr-FR.
  - Domaine : slugs de `OFFERS` uniques et égaux aux clés de `OFFER_PAGES`.

- **Tranche 2 — l'atelier à son URL de catalogue, l'ancienne redirige.** Fichiers :
  `offer-path.ts`, `offer.routes.ts`, `app.routes.ts` (`offres` lazy + `redirectTo`),
  `app.routes.server.ts` (server routes générées), `generate-sitemap.mjs`, `Dockerfile`,
  `ci.yml`, `footer.ts` (lien vers `offerPath('site-atelier')`).
  - `OFFER_ROUTES` contient une route par entrée de `OFFERS`, `loadComponent` → `OfferPage`,
    `data.seo.url` = `siteUrl + offerPath(slug)`, `data.summary.slug` = slug.
  - `serverRoutes` déclare `offres/<slug>` en `Prerender` pour chaque slug.
  - La route `offre-site-industrie` redirige vers `/offres/site-atelier` (Router en test).
  - `footer-offer-link` : `href` = `/offres/site-atelier`.
  - Verify : `dist/…/browser/offres/site-atelier/index.html` existe et contient `<h1`, le prix,
    la FAQ et le formulaire ; `offre-site-industrie/index.html` n'existe pas ; sitemap régénéré
    (non commité) contient `/offres/site-atelier` et plus `/offre-site-industrie` ; image Docker
    locale : 301 + `Location` relatif avec query conservée, `/offres/inexistant` → 404.

- **Tranche 3 — les quatre nouvelles offres** (contenu ; découpable en une PR par offre si la
  copy arrive au fil de l'eau). Prérequis : question 4 tranchée. Fichiers : `offer.model.ts`
  (slugs, `OfferAmount` `from`/`on-request`, période `day`), `offer-prices`, `offer-catalog`,
  `offer-pages`, `offer-seo.ts` (mapping des nouveaux montants).
  - Pour chaque slug (`it.each`) : la page rend `h1`, `offer-hero-price`, `offer-request` avec
    son sujet ; server route `Prerender` présente.
  - `renfort-freelance` : aucun `offer-step` ; une ligne de prix `on-request` dont le libellé ne
    contient aucun chiffre ; lien Malt (`SITE_IDENTITY.socials.malt`) dans la section tarif.
  - JSON-LD : `from` → `minPrice` = `String(OFFER_PRICES…)` ; `on-request` → `Offer` sans
    `price` ; `month` → `unitCode: 'MON'`.
  - Invariants SEO sur toutes les offres (≤ 160 caractères, aucun `—`).
  - Verify : cinq `offres/<slug>/index.html` prérendus.

- **Tranche 4 — la page catalogue `/offres`.** Fichiers : `group-offers-by-family.ts`,
  `offer-catalogue.ts`, `offer-card.ts`, `offer.routes.ts` (route `''`), `offer-seo.ts`
  (`toOfferCatalogueSeo`), `app.routes.server.ts`, sitemap, `DESIGN.md` (carte d'offre).
  - `groupOffersByFamily` : ordre Sites puis Applications, ordre interne de `OFFERS` conservé,
    famille vide omise (test pur, sans TestBed).
  - La page rend un `h1`, deux sections `section[aria-labelledby]` (« Sites », « Applications »),
    `offer-card` × 5, chacune avec nom, public, `priceTeaser` et un lien `href` =
    `offerPath(slug)`.
  - SEO : `CollectionPage` + `ItemList` de cinq URLs + `BreadcrumbList`.
  - Verify : `offres/index.html` prérendu avec les cinq liens.

- **Tranche 5 — la page Parcours et le bloc « Vous recrutez ? »** (indépendante de T1 à T4).
  Fichiers : `about-hiring.ts`, `about.ts`, `site-identity.static-data.ts`
  (`hiringAvailability`), `app.routes.ts` (route `about`).
  - `about-hiring` porte `id="recrutement"`, un `h2`, `SITE_IDENTITY.hiringAvailability`, un lien
    LinkedIn (`SITE_IDENTITY.socials.linkedin`) ; lien CV rendu quand `CvGateway.getCurrent()`
    renvoie un CV (stub HTTP), absent sinon ; clic → `trackCvDownload`.
  - `about-hiring` n'est dans aucun `@defer` (présent au premier rendu en TestBed sans
    playthrough de defer) ; un seul `h1` sur la page.
  - Route `about` : `title` et fil d'Ariane « Parcours ».

- **Tranche 6 — la home commerciale : hero et offres.** Fichiers : `home-hero-section.ts`,
  `home.static-data.ts` (headline/lead), `home-offers.ts`, `home.ts`,
  `site-identity.static-data.ts` (`availability`), `app.routes.ts` (SEO home), `offer-seo.ts`
  (`toOfferCatalogJsonLd`).
  - `hero-cta-contact` déclenche `SectionScroller.scrollTo('contact')` et l'analytics
    `home_hero_contact` ; `hero-cta-offers` est un lien `href="/offres"`.
  - `hero-availability` = nouvelle `SITE_IDENTITY.availability`, n'est pas un lien ; aucun texte
    de la home ne contient « CDI ».
  - `home-offers` : cartes pour les offres `featuredOnHome` uniquement (atelier absent),
    regroupées par famille.
  - SEO home : `@graph` contient `Person` et `ProfessionalService` dont `areaServed` nomme
    Yvelines, Île-de-France, France et `hasOfferCatalog` liste les URLs des offres ; la
    description ne contient ni « CDI » ni `—`.
  - Opération (hors code, Julien) : catégorie « Démo » sur « Le Vieux Comptoir » dans l'admin ;
    verify : la carte du projet sur `/projects` affiche « Démo ».

- **Tranche 7 — la home : méthode, pourquoi moi, FAQ.** Fichiers : `home-pitch.model.ts`,
  `home-pitch.static-data.ts`, `home-method.ts`, `shared/ui/faq-list.ts`,
  `shared/ui/key-point-list.ts` (promotions ; `OfferFaq`/`OfferReasons` supprimés, pages d'offre
  migrées, leurs tests restent verts), `home.ts`.
  - `#methode` (wrapper hors `@defer`, `appSectionVisibility="methode"`) contient les étapes et
    les engagements de `HOME_METHOD`.
  - « Pourquoi moi » : `KeyPointList` × 3 arguments ; FAQ : `faq-item` × `HOME_FAQ.length`,
    `details` fermés, aucun `button` dans la section.
  - Ordre des sections dans le DOM : hero, offres, preuves, méthode, pourquoi moi, FAQ, contact ;
    un seul `h1` ; ids de titres uniques (`FaqList` reçoit `headingId`).
  - Verify : HTML prérendu de la home contient méthode, FAQ et contact (trigger `hydrate`) ;
    chunks : les nouveaux composants différés ne sont pas dans `main-*.js`.

- **Tranche 8 — navigation, CTA permanent, footer enrichi.** Prérequis : T4, T5, T7 mergées.
  Fichiers : `nav-items.ts`, `header.ts`, `footer.ts`, `app.routes.ts` (`preload` sur `offres`,
  libellés « Réalisations »), `projects.ts` (`h1`).
  - `NAV_LINKS` = Offres, Réalisations, Méthode (section `methode`), Blog, À propos, dans cet
    ordre ; aucune entrée « Contact ».
  - `header-cta` présent hors drawer, déclenche `scrollTo('contact')` ; plus aucun lien CV dans
    le header.
  - Footer : un lien par offre (`href` = `offerPath(slug)`, cinq), « Vous recrutez ? »
    (`href` = `/about#recrutement`), mentions légales, confidentialité ; landmarks inchangés.
  - `/projects` : `h1` et `title` « Réalisations ».

- **Tranche V — socle visuel « dessin technique »** (direction validée par Julien le 2026-10-04 sur
  la maquette v2). Prérequis avant T4, T6 et T7, qui consomment ses primitives. Fichiers :
  `src/index.html` (préconnexion Google Fonts ou polices auto-hébergées, à trancher pour la CSP et
  Lighthouse), `src/styles.css` (`@theme` : familles display / body / mono, tokens de trait),
  `shared/ui/cartouche.ts` (bloc titre + lignes libellé/valeur, `dl` sémantique),
  `shared/ui/dimension-line.ts` (cote décorative, `aria-hidden`), `DESIGN.md` (typographie,
  cartouche, cote, règles d'usage : un cartouche par écran au plus, cotes réservées aux délais).
  - `Cartouche` rend un titre, une référence optionnelle et un `dl` dont chaque ligne a `dt`/`dd`.
  - `DimensionLine` est `aria-hidden="true"` et ne porte aucune information exclusive.
  - Aucune régression axe (contraste des nouvelles couleurs de trait en clair et en sombre).
  - Verify : Lighthouse perf ≥ 95 sur la home avec les nouvelles polices (`font-display: swap`,
    sous-ensemble latin), CSP de prod toujours valide.

- **Tranche 9 — qualification légère du formulaire.** Fichiers : `compose-contact-message.ts`,
  `contact-timelines.static-data.ts`, `contact-form.ts`, `home.ts` (passe `projectTypes`).
  - `composeContactMessage` : sans qualification, message inchangé ; avec type et/ou délai,
    préfixe des seules lignes choisies (test pur).
  - Sans `projectTypes`, le select « Type de projet » n'est pas rendu (pages d'offre) ; la home
    le rend avec les noms de `OFFERS` + « Autre ».
  - Les selects sont optionnels : un formulaire valide sans eux s'envoie ; le payload reçu par le
    `ContactGateway` a le message composé et le sujet saisi, mêmes clés qu'avant.
  - Sujet > 200 caractères ou message composé > 5 000 : erreur de champ, aucun appel gateway.
  - Non-régression : tests existants du préremplissage (`initialSubject`) verts.

## Plan de test

### Tranche 1 — l'offre atelier sur le modèle générique

Refactor à URL et rendu inchangés : la couverture comportementale de `site-offer.spec.ts` (19
tests) et de `site-offer.static-data.spec.ts` (10 tests) est **reportée** sur le modèle générique,
puis ces deux specs sont **supprimées** dans le même RED (rien n'empêche plus la suppression de
`site-offer*.ts` au GREEN). Les sous-composants `offer-*` restent sans spec isolé (dumb, couverts
outside-in par `offer-page.spec.ts`). Les tests SEO détaillés de `app.routes.spec.ts` migrent vers
`offer-seo.spec.ts` (fonction pure) ; la spec de route ne vérifie plus que le câblage.

Contrats fixés par ce RED (le plan les laissait implicites) :

- `OFFER_PRICES` a la forme `{ 'site-atelier': { creationEur, maintenanceMonthlyEur } }`.
- Lignes de prix atelier : `name` « Création » (`fixed`/`once`, `label` = `formatEur(690)`) et
  « Maintenance » (`fixed`/`month`, `label` = `` `${formatEur(29)}/mois` ``, `includes` × 5).
- Testids de `OfferPricing` : `offer-price-line` (carte), `offer-price-name`, `offer-price-label`,
  `offer-price-terms`, `offer-price-include` (remplacent `offer-price-creation`,
  `offer-price-maintenance`, `offer-maintenance-include`).
- `OfferPage` : `input.required` `summary` et `content` (posés par `setInput`, comme le fera
  `withComponentInputBinding`).
- Builder de test : `src/app/features/offer/testing/offer-builders.ts` (`makeOfferSummary`,
  `makeOfferPageContent`, `makeOfferPriceLine`, `withoutSections`, `offerSummaryOf`).

**`domain/format-eur.spec.ts`** (TS pur, 3 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| format fr-FR (`it.each`) | 29, 690, 4500 | `29 €`, `690 €`, `4 500 €` (séparateur U+202F, espace insécable avant `€`) |

**`domain/offer-prices.static-data.spec.ts`** (TS pur, 1 test)

| Test | Scénario | Assertions clés |
|---|---|---|
| montants atelier | `OFFER_PRICES` | golden `toEqual({ 'site-atelier': { creationEur: 690, maintenanceMonthlyEur: 29 } })` |

**`domain/offer-catalog.static-data.spec.ts`** (TS pur, 3 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| slugs uniques | `OFFERS` | `Set` de même taille que la liste |
| slugs = pages | `OFFERS` vs `OFFER_PAGES` | slugs triés `toEqual` clés triées |
| résumé atelier | entrée `site-atelier` | famille `sites`, nom, `priceTeaser` = `` `${formatEur(690)}, prix final` ``, `featuredOnHome: false`, `serviceType`, description SEO actuelle |

**`domain/offer-pages.static-data.spec.ts`** (TS pur, 11 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| hero | `site-atelier.hero` | titre, sous-titre, `ctaLabel` mot pour mot (plus de `priceLabel`) |
| titres de section | `heading` × 5 | « Pourquoi un tourneur plutôt qu'une agence », « Ce que contient le site », « Le déroulé en 7 jours », « Tarif », « Questions fréquentes » |
| raisons, livrables, étapes, FAQ, demande | copy | égalités exactes reprises de la spec 007 |
| lignes de prix | `pricing.lines` | name/amount/period/label depuis `OFFER_PRICES` + `formatEur` |
| modalités | `terms`/`includes` | création sans inclusions, maintenance « sans engagement » + 5 inclus |
| ids distincts (`it.each` des pages) | raisons + étapes + FAQ + lignes | aucun doublon |
| aucun em-dash | `OFFERS` + `OFFER_PAGES` | aucune chaîne ne contient `—` |

**`offer-seo.spec.ts`** (TS pur, 6 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| atelier inchangé | `toOfferSeo(atelier, page, siteUrl + '/offre-site-industrie')` | `toEqual` du `SeoData` d'aujourd'hui : title, description, url, `website`, `@graph` [Service (2 Offer), BreadcrumbList « Accueil » → « Sites pour ateliers »], prix `String(OFFER_PRICES…)` |
| générique | résumé et URL de builder | Service `name` = `summary.name`, `serviceType` = `summary.seo.serviceType`, `url` (SeoData et Service) = URL passée |
| mapping des lignes | 3 lignes `fixed` (once, month, once) | `Offer.price` / `UnitPriceSpecification` `MON`, dans l'ordre, prix en chaîne |
| snippet (`it.each(OFFERS)`) | toutes les offres | 0 < longueur ≤ 160, aucun `—` |
| repli fil d'Ariane (complément de revue) | résumé de builder sans `seo.breadcrumbName` | dernier `ListItem` : `name` = `summary.name` |
| repli description (complément de revue) | résumé de builder sans `seo.serviceDescription` | `'description' in service` = `false` (clé absente, pas `undefined`) |

**`application/offer-page.spec.ts`** (TestBed + `provideRouter([])`, 33 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| h1 unique | atelier | un seul `h1` = `offer-title` = `hero.title` |
| sous-titre + prix | atelier | `offer-subtitle` = `hero.subtitle` ; `offer-hero-price` = `summary.priceTeaser` (égalité) |
| CTA + clic | atelier | `offer-cta` est un `A` vers `#demande` ; clic ⇒ fragment `demande` |
| landmarks | atelier | aucun `main` ni `footer` |
| raisons / livrables / étapes / FAQ | atelier | `offer-reason` × 3, `offer-deliverable` × 9, `offer-step` × 4 (`LI` d'un `OL`, jamais « Étape »), `offer-faq-item` × 5 (`details` fermés, `summary`, aucun `button`), textes = données |
| TVA | atelier | `offer-vat-mention` = `SITE_IDENTITY.business.vatMention` |
| demande | atelier | `#demande`, formulaire sans `@defer`, sujet = `content.request.subject`, intro = `content.request.intro` |
| h2 depuis les données (`describe.each` atelier + builder × `it.each` 5 sections) | section de chaque testid | `aria-labelledby` → `H2` dont le texte = `content.<section>.heading` |
| ordre des h2 | atelier + builder | h2 hors formulaire = headings dans l'ordre du contenu |
| sans `steps` ni `faq` | `withoutSections(builder, 'steps', 'faq')` | aucun `offer-step` ni `offer-faq-item` ; h2 = raisons, livrables, tarif seulement |
| tarif (`describe.each` : atelier, 1 ligne sans inclusions, 3 lignes) | `OfferPricing` | `offer-price-line` × `lines.length` ; name/label/terms/includes de chaque carte = ligne, dans l'ordre |

**`src/app/app.routes.spec.ts`** (adapté, 3 tests ; 9 tests SEO déplacés dans `offer-seo.spec.ts`)

| Test | Scénario | Assertions clés |
|---|---|---|
| lazy | route `offre-site-industrie` | pas de `component`, `loadComponent()` → `OfferPage` |
| données liées | `data` | clés `content`, `seo`, `summary` (pas de `preload`) ; `summary` = résumé atelier de `OFFERS`, `content` = `OFFER_PAGES['site-atelier']` (même référence) |
| SEO câblé | `title` + `data.seo` | `title` inchangé ; `data.seo` `toEqual` `toOfferSeo(atelier, page, siteUrl + '/offre-site-industrie')` |

Inchangés et toujours valides en T1 : `app.routes.server.spec.ts` (prérendu de
`offre-site-industrie`), `footer.spec.ts` (lien `/offre-site-industrie`), sitemap.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-04 12:27, 58 failed / 701 total). Nature des échecs : la compilation de la suite échoue
uniquement sur les modules applicatifs à créer au GREEN (`TS2307` / `Could not resolve` :
`domain/models/offer.model`, `offer-prices`, `offer-catalog`, `offer-pages` `.static-data`,
`format-eur`, `offer-seo`, `application/offer-page`) et sur leurs conséquences en cascade (types
`any`/`unknown` implicites, `TS7031`, `TS7006`, `TS18046`, `TS2345`) ; aucune faute de type propre
aux specs. Non-régression : nouvelles specs et `app.routes.spec.ts` mis de côté, `pnpm test` =
80 fichiers, 643 passed / 643. Scaffold dû au GREEN : les sept modules ci-dessus.

### Tranche 2 — l'atelier à son URL de catalogue, l'ancienne redirige

Sweep de l'ancienne URL (`offre-site-industrie`) sur tout `src/` : `app.routes.spec.ts`,
`app.routes.server.spec.ts`, `footer.spec.ts`, `offer-seo.spec.ts`, plus le code (`app.routes.ts`,
`app.routes.server.ts`, `footer.ts`) et `scripts/generate-sitemap.mjs`. Les quatre specs sont
ré-alignées dans ce RED ; aucun test ne porte plus l'ancienne URL sauf celui qui en épingle la
redirection et le non-prérendu.

Contrats fixés par ce RED :

- `domain/offer-path.ts` : `OFFERS_BASE_PATH = 'offres'`, `offerPath(slug)` = `/offres/<slug>`.
- `offer.routes.ts` exporte `OFFER_ROUTES` : en T2, exactement une route par entrée de `OFFERS`,
  dans l'ordre, `path` = slug (aucune route `:slug`, aucune route `''`, que T4 ajoutera en adaptant
  le premier test). Chaque route : pas de `component`, `loadComponent` → `OfferPage`,
  `title` = `summary.seo.title`, `data` aux seules clés `content`, `seo`, `summary` (le `preload`
  de T8 ira sur la route parente `offres`).
- `app.routes.ts` : route `offres` sans `component` ni `children`, `loadChildren` → `OFFER_ROUTES` ;
  route `offre-site-industrie` à `redirectTo: '/offres/site-atelier'`, sans `loadComponent`. La
  redirection Angular ne conserve pas la query (comportement du routeur) : seule celle de nginx le
  fait, ce n'est pas testé en Vitest.
- `serverRoutes` : `offres/<slug>` en `Prerender` pour chaque slug, aucune entrée
  `offre-site-industrie` (le `**` Client la prend).

**`domain/offer-path.spec.ts`** (TS pur, 2 tests, nouveau)

| Test | Scénario | Assertions clés |
|---|---|---|
| racine du catalogue | `OFFERS_BASE_PATH` | `toBe('offres')` |
| chemin d'une offre | `offerPath('site-atelier')` | `toBe('/offres/site-atelier')` |

**`offer.routes.spec.ts`** (sans TestBed, 4 tests, nouveau ; `describe.each(OFFERS)`)

| Test | Scénario | Assertions clés |
|---|---|---|
| une route par offre | `OFFER_ROUTES` | `path` × n `toEqual` slugs de `OFFERS`, dans l'ordre |
| lazy | route du slug | `component` absent ; `loadComponent()` → `OfferPage` |
| données liées | `data` | clés triées = `content`, `seo`, `summary` ; `summary` = l'entrée de `OFFERS` (même référence) ; `content` = `OFFER_PAGES[slug]` (même référence) |
| titre et SEO | `title` + `data.seo` | `title` = `summary.seo.title` ; `seo` `toEqual` `toOfferSeo(summary, OFFER_PAGES[slug], siteUrl + '/offres/' + slug)` ; `seo.url` = cette URL |

**`src/app/app.routes.spec.ts`** (réécrit, 4 tests ; les 3 tests de la route `offre-site-industrie`
de T1 migrent dans `offer.routes.spec.ts`)

| Test | Scénario | Assertions clés |
|---|---|---|
| catalogue lazy | route `offres` | pas de `component` ni `children` ; `loadChildren()` → `OFFER_ROUTES` (même référence) |
| atelier servi | `provideRouter(routes)` + `navigateByUrl('/offres/site-atelier')` | `router.url` = `/offres/site-atelier` ; `data.summary` de la route feuille = résumé atelier |
| redirection déclarée | route `offre-site-industrie` | `redirectTo` = `/offres/site-atelier` ; pas de `loadComponent` |
| redirection naviguée | `navigateByUrl('/offre-site-industrie')` | `router.url` = `/offres/site-atelier` ; `data.summary` de la feuille = résumé atelier |

**`src/app/app.routes.server.spec.ts`** (adapté : 1 test remplacé par 2)

| Test | Scénario | Assertions clés |
|---|---|---|
| prérendu des offres (`it.each(OFFERS)`) | `offres/<slug>` | `renderMode` = `RenderMode.Prerender` |
| ancienne URL non prérendue | `offre-site-industrie` | aucune server route (un redirect prérendu ne produit qu'un `meta refresh`, pas un 301) |

**`footer.spec.ts`** (ré-aligné, 3 tests inchangés en nombre) : le routeur de test déclare
`offres/site-atelier` et un `**` (une ancienne URL tombe sur une assertion d'URL, pas sur une
erreur `NG04002`) ; `href` du `footer-offer-link`, liste des `href` de la nav « Liens utiles » et URL
après clic = `/offres/site-atelier`. Libellé « Sites pour ateliers » inchangé (T8).

**`offer-seo.spec.ts`** (ré-aligné, reste vert) : `OFFER_URL` passé à `toOfferSeo` = l'URL
canonique `/offres/site-atelier`. La fonction prend l'URL en paramètre : le golden reste valide,
seule la donnée d'entrée (et donc les `url`/`item` dérivés) suit la nouvelle URL.

Hors Vitest, preuves de verify à la charge de l'implémenteur :

- `scripts/generate-sitemap.mjs` : script à `await` de premier niveau qui interroge l'API et écrit
  `public/sitemap.xml`, hors du `include` de `tsconfig.spec.json` ; pas de fonction pure exportée à
  tester sans changer sa forme. Verify : sitemap régénéré (non commité) contient `/offres/site-atelier`
  et plus `/offre-site-industrie`.
- `Dockerfile` (nginx) : `curl` sur l'image locale, `/offre-site-industrie?utm_source=x` → 301,
  `Location: /offres/site-atelier?utm_source=x` (relatif) ; `/offres/site-atelier/` → 200 avec
  `<app-offer-page` ; `/offres/inexistant` → 404.
- `.github/workflows/ci.yml` : smoke du job docker sur ces mêmes requêtes.
- Build de prod : `browser/offres/site-atelier/index.html` existe (`<h1`, prix, FAQ, formulaire),
  `browser/offre-site-industrie/index.html` n'existe pas ; `main-*.js` ne contient plus la copy de
  la FAQ atelier (point 4 de la revue T1).

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-04 13:13, 15 failed / 711 total). Nature des échecs : sans les modules à créer,
`pnpm test` s'arrête à la compilation, uniquement sur eux (`TS2307` / `Could not resolve` :
`domain/offer-path`, `offer.routes`) et leur cascade (`TS7006` sur `route` dans
`offer.routes.spec.ts`) ; aucune faute de type propre aux specs, format et lint verts sur les six
fichiers. Mesure du rouge comportemental : avec deux scaffolds vides posés le temps d'une exécution
puis supprimés (`OFFERS_BASE_PATH = ''`, `offerPath` identité, `OFFER_ROUTES = []`), `pnpm test` =
89 fichiers, 15 failed / 711 total, les 15 en `AssertionError` (offer-path 2, offer.routes 4,
app.routes 4, server routes 2, footer 3). Non-régression : les 696 autres tests passent, dont
`offer-seo.spec.ts` ré-aligné. Scaffold dû au GREEN : `src/app/features/offer/domain/offer-path.ts`
(`OFFERS_BASE_PATH`, `offerPath`) et `src/app/features/offer/offer.routes.ts` (`OFFER_ROUTES`).

### Tranche 3 — les quatre nouvelles offres

Source des attendus : l'annexe validée `specs/009-copy-offres.md`. La copy n'est pas recopiée en
entier : les tests épinglent ce qui engage (prix via `formatEur(OFFER_PRICES…)`, sujet prérempli,
titre du hero, titres et effectifs de section, sections absentes, 24 heures ouvrées, 7 jours,
4 à 8 semaines, échange gratuit, hébergement en France, restitution d'une heure, temps partiel).

Sweep de recalibration (`OFFER_PRICES`, `OfferSlug`, `OfferAmount`, `OfferPeriod`) sur tout
`src/` et `scripts/` : seule `offer-prices.static-data.spec.ts` assertait l'ancienne valeur (golden
atelier seul), **adaptée** (pas de test parallèle). Les suites qui itèrent déjà sur `OFFERS`
couvrent les cinq slugs sans modification une fois le catalogue étendu, et le nouveau test d'ordre
de `OFFERS` les y oblige : `offer.routes.spec.ts` (route lazy, données, SEO par slug),
`app.routes.server.spec.ts` (`offres/<slug>` en `Prerender`), `offer-seo.spec.ts` (snippet ≤ 160,
aucun `—`), `offer-pages.static-data.spec.ts` (ids distincts, aucun `—`). Aucune autre suite ne
nomme un slug autre que l'atelier (`footer.spec.ts`, `app.routes.spec.ts` : atelier seul,
inchangés). Aucun état seedé dont la sémantique change.

Contrats fixés par ce RED :

- `OFFER_PRICES` (golden) : `site-vitrine` `{ creationEur: 890, maintenanceMonthlyEur: 29 }`,
  `site-atelier` inchangé, `application-metier` `{ projectFromEur: 4500,
  maintenanceMonthlyFromEur: 190 }`, `refonte-maintenance` `{ auditEur: 450,
  maintenanceMonthlyFromEur: 190 }`, `renfort-freelance` `{}`.
- Ordre de `OFFERS` : `site-vitrine`, `site-atelier`, `application-metier`,
  `refonte-maintenance`, `renfort-freelance` ; `featuredOnHome` faux pour l'atelier seul.
- `priceTeaser` : `` `${formatEur(890)}, prix final` ``, `` `À partir de ${formatEur(4500)}` ``,
  `` `Audit ${formatEur(450)}, maintenance dès ${formatEur(190)}/mois` ``, `'TJM sur demande'`.
- Lignes de prix (`name` / `amount` / `period` / `label`) : vitrine = Création `fixed`/`once`
  `formatEur(890)` + Maintenance `fixed`/`month` `` `${formatEur(29)}/mois` `` (5 inclus, mêmes
  `terms` que l'atelier, `50 %`) ; application = Projet `from`/`once`
  `` `À partir de ${formatEur(4500)}` `` + Maintenance `from`/`month`
  `` `Dès ${formatEur(190)}/mois` `` ; refonte = Audit `fixed`/`once` `formatEur(450)` + Chantiers
  `on-request`/`once` `'Sur devis'` + Maintenance `from`/`month` (4 inclus) ; renfort = Régie
  `on-request`/`day` `'TJM sur demande'`, `terms` commençant par « Temps partiel ».
- JSON-LD : `from`/`once` → `priceSpecification` `{ '@type': 'PriceSpecification', minPrice,
  priceCurrency: 'EUR' }` ; `from`/`month` → `UnitPriceSpecification` avec `minPrice` et
  `unitCode: 'MON'` ; `on-request` → `{ '@type': 'Offer', name }` exactement (ni `price` ni
  `priceCurrency`) ; montants en `String(…)`. `areaServed` : famille `applications` = Yvelines,
  Île-de-France (`AdministrativeArea`) puis `{ '@type': 'Country', name: 'France' }` ; famille
  `sites` inchangée (golden atelier).
- Lien Malt : testid `offer-price-link`, un `A` dans la section tarif, `href` =
  `SITE_IDENTITY.socials.malt`, `target="_blank"`, `rel="noopener noreferrer"`, nom non vide ;
  aucun `offer-price-link` sur la page atelier. Le transport de l'URL jusqu'au composant est laissé
  au GREEN (le domaine n'importe pas `@shared`, cf. § 3).

**`domain/offer-prices.static-data.spec.ts`** (adapté, 1 test)

| Test | Scénario | Assertions clés |
|---|---|---|
| montants de toutes les offres | `OFFER_PRICES` | golden `toEqual` des cinq entrées ci-dessus |

**`domain/offer-catalog.static-data.spec.ts`** (+10 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| ordre et mise en avant | `OFFERS` | `{ slug, family, featuredOnHome }` × 5 `toEqual` l'ordre fixé |
| nom et prix d'appel (`it.each` × 4) | nouvelles offres | `name` + `priceTeaser` construit avec `formatEur(OFFER_PRICES…)` |
| engagements de prix du snippet (`it.each` × 4) | `seo.description` | contient les montants (`prix final`, `/mois sans engagement`, `à partir de`, `dès …/mois`, `TJM sur demande`) |
| renfort sans chiffre | `priceTeaser` + `seo.description` | aucun chiffre |

**`domain/offer-pages.static-data.spec.ts`** (+21 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| hero et sujet (`describe.each` × 4) | page | `hero.title` et `request.subject` mot pour mot |
| titres de section (× 4) | page | `heading` des sections présentes ; `steps` absent pour le renfort |
| effectifs (× 4) | page | raisons 3/3/3/3, livrables 9/8/6/6, étapes 4/4/4/absent, lignes 2/2/3/1, FAQ 5/5/4/3 |
| lignes de prix (× 4) | `pricing.lines` | contrats ci-dessus, montants lus dans `OFFER_PRICES` |
| engagements (× 5) | copy | vitrine : « sous 24 heures ouvrées », étapes jour 1 → jour 7 ; application : « 4 à 8 semaines », « 30 minutes est gratuit », « Hébergement en France » ; refonte : « restitution d'une heure » ; renfort : hero « à temps partiel » |

**`offer-seo.spec.ts`** (+7 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| mapping `from` / `on-request` | 3 lignes de builder (`from`/`once`, `from`/`month`, `on-request`/`day`) | `PriceSpecification.minPrice`, `UnitPriceSpecification` `minPrice` + `MON`, `Offer` sans prix |
| zone servie (`it.each` famille) | résumé de builder `sites` / `applications` | `areaServed` exact, France en `Country` pour les applications seulement |
| offres du catalogue (× 4) | `toOfferSeo` sur les vraies données | `offers` `toEqual`, prix `String(OFFER_PRICES…)` |

**`application/offer-page.spec.ts`** (+19 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| chaque offre du catalogue (`describe.each(OFFERS)` × 3) | page de chaque slug | un seul `h1` = `hero.title` ; `offer-hero-price` = `priceTeaser` ; sujet de `offer-request` = `request.subject` |
| renfort sans déroulé | `renfort-freelance` | aucun `offer-step` ; h2 = raisons, livrables, tarif, FAQ |
| renfort sur demande | idem | `offer-price-label` = libellés des lignes, aucun chiffre |
| renfort lien Malt | idem | un `offer-price-link` dans la section tarif, contrat ci-dessus |
| atelier sans plateforme | atelier | aucun `offer-price-link` |

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-04 14:42, 39 failed / 804 total). Nature des échecs : sans le code du GREEN, `pnpm test`
s'arrête à la compilation, uniquement sur les types et données applicatifs actés au plan
(`OfferSlug` à un seul membre : `TS2345`, `TS2367`, `TS7053` sur `OFFER_PAGES`/`OFFER_PRICES` ;
`OfferAmount` sans `from`/`on-request` et `OfferPeriod` sans `day` : `TS2322`) et leur cascade
(`TS7031`) ; aucune faute de type propre aux specs, prettier et eslint verts sur les cinq fichiers.
Mesure du rouge comportemental : scaffold temporaire posé le temps d'une exécution puis retiré
(unions élargies, quatre slugs ajoutés à `OFFERS` et `OFFER_PAGES` en recopiant l'atelier,
montants à 0, `toOfferSeo` tolérant l'absence de `eur`) : 91 fichiers, 39 failed / 804 total, les
39 en `AssertionError`. Les 18 nouveaux tests verts sous ce scaffold sont du câblage donnée → DOM
(`describe.each(OFFERS)` de la page) ou des effectifs que la vitrine partage avec l'atelier.
Non-régression : base avant RED 723 passed / 723 ; sous scaffold, aucun test préexistant ne tombe.
Recalibration du délai de réponse (décision Julien du 2026-10-04 : tous les délais = « 24 heures
ouvrées ») : sweep de « 48 h » sur `src/` et la spec, une seule assertion concernée, le test
« addresses the request form to a workshop owner » de `offer-pages.static-data.spec.ts`, dont
l'intro atelier attendue devient « Dites-moi le nom de votre atelier et ce que vous usinez. Je vous
rappelle sous 24 heures ouvrées. » (promesse de maquette retirée). `offer-page.spec.ts` compare à
la donnée, inchangé. La donnée `offer-pages.static-data.ts` est due au GREEN.
Scaffold dû au GREEN : `offer.model.ts` (`OfferSlug`, `OfferAmount`, `OfferPeriod`),
`offer-prices`, `offer-catalog`, `offer-pages` `.static-data.ts`, `offer-seo.ts`, `offer-page.ts`
ou `offer-pricing.ts` (lien Malt).

### Tranche 5 — la page Parcours et le bloc « Vous recrutez ? »

| Fichier | Tests |
|---|---|
| `features/profile/application/about-hiring.spec.ts` (8) | ancre `id="recrutement"` + h2 unique « Vous recrutez ? » relié par `aria-labelledby` ; `about-hiring-availability` = `SITE_IDENTITY.hiringAvailability` ; lien LinkedIn (`target="_blank"`, `rel` noopener noreferrer) ; sans CV ⇒ pas de `about-hiring-cv` ; aucun landmark ; CV publié ⇒ `href` = `CvGateway.getDownloadUrl()` ; clic ⇒ `trackCvDownload` × 1 ; erreur 500 ⇒ lien CV absent, LinkedIn présent |
| `app.routes.about.spec.ts` (2) | `title` et `seo.title` = « Parcours \| Julien Nédellec », `seo.url`, `structuredData` BreadcrumbList Accueil → Parcours (fichier séparé pour ne pas croiser la réécriture de `app.routes.spec.ts` en T1) |
| `features/profile/application/about.spec.ts` (+1) | sans déclencher les `@defer` (`DeferBlockBehavior.Manual`), `about-hiring` porte déjà `id="recrutement"` ; un seul h1 |
| `shared/identity/site-identity.static-data.spec.ts` (+1) | `hiringAvailability` contient « CDI » |

Builder partagé : `features/cv/testing/cv-builders.ts` (`makeCvInfo`).

RED confirmé le 2026-10-04 12:49 (worktree dédié, spec hors arbre) : 12 failed / 698 total, tous
comportementaux (assertions, requête `/api/cv` attendue) une fois les symboles posés en squelette
vide ; suite existante verte.

## Journal des tranches

- **Tranche 1 — l'offre atelier sur le modèle générique** : GREEN 701 passed / 701 total · refactor : aucun
- **Tranche 2 — l'atelier à son URL de catalogue, l'ancienne redirige** : GREEN 711 passed / 711 total · refactor : aucun (passe manuelle sur le diff ; server route écrite `${OFFERS_BASE_PATH}/${slug}` plutôt que de retailler `offerPath`)
- **Tranche 3 — les quatre nouvelles offres** : GREEN 804 passed / 804 total · refactor : zone servie de `toOfferSeo` factorisée (régions communes, France ajoutée pour la famille `applications`) ; id d'étape « audit » renommé `inspect` (collision avec la ligne de prix « audit » de la même page)
- **Tranche 5 — la page Parcours et le bloc « Vous recrutez ? »** : GREEN 698 passed / 698 total · refactor : liens du bloc passés sur l'utilitaire `link-btn-outline` (revue)

## Verify

### Tranche 1 — `/offre-site-industrie` (surface atteignable en production, restructurée)

Steps : `pnpm install --frozen-lockfile` → `pnpm run build --configuration production` (15 routes
prérendues) → lecture de `dist/angular-portfolio-app/browser/offre-site-industrie/index.html` →
`python3 -m http.server 4321` sur `dist/angular-portfolio-app/browser` → ouverture de
`http://localhost:4321/offre-site-industrie/` dans le navigateur.

- HTML prérendu : un seul `h1` (« Le site de votre atelier, en ligne en 7 jours. ») ;
  `offer-hero-price` = `690&nbsp;€, prix final` ; `offer-price-label` = `690&nbsp;€`,
  `29&nbsp;€/mois` ; `offer-reason` × 3, `offer-deliverable` × 9, `offer-step` × 4,
  `offer-faq-item` × 5 ; `h2` dans l'ordre (raisons, livrables, déroulé, Tarif, Questions
  fréquentes, puis le titre du formulaire) ; `<form>` présent, `contact-subject`
  `value="Site pro pour mon atelier"` ; `<title>`, meta description et canonical inchangés.
- JSON-LD : script `application/ld+json` **identique octet pour octet** (1 019 caractères) au
  `structuredData` littéral de la route sur `HEAD` (comparaison scriptée de `JSON.stringify`).
- Runtime : page hydratée (`app-offer-page` présent, 2 cartes de prix, sujet prérempli).
  Captures : hero, puis tarif et FAQ, prises dans le navigateur de session.
- Console : aucune erreur applicative (aucune `NG0…`, aucune erreur d'hydratation). Seules
  erreurs observées, toutes d'environnement : `GET /api/config` 404 (servi par nginx en
  production, absent de `http.server`) et CORS de `api.nedellec-julien.fr` refusant l'origine
  `localhost` (CV, analytics), d'où le toast d'erreur global. Indépendantes du diff.

Verdict : **PASS**.

### Tranche 2 — `/offres/site-atelier` et redirection de `/offre-site-industrie`

Steps : `pnpm install --frozen-lockfile` → `pnpm run build --configuration production` (15 routes
prérendues, CSP sur 16 pages) → lecture de `dist/angular-portfolio-app/browser/**` →
`docker build -t ng-portfolio-app:local .` → `docker run -p 3917:3000` → `curl -sI` puis
navigation dans le navigateur de session. `public/sitemap.xml` et `public/rss.xml` restaurés par
`git checkout` après build.

- HTML prérendu `browser/offres/site-atelier/index.html` : un seul `h1` (« Le site de votre
  atelier, en ligne en 7 jours. ») ; `offer-hero-price` = `690&nbsp;€, prix final` ;
  `offer-reason` × 3, `offer-deliverable` × 9, `offer-step` × 4, `offer-faq-item` × 5,
  `offer-price-line` × 2, `offer-request` × 1, un `<form>` ; canonical
  `https://nedellec-julien.fr/offres/site-atelier` ; JSON-LD `url` et `item` du fil d'Ariane sur
  la nouvelle URL ; aucune occurrence de `offre-site-industrie`.
- `browser/offre-site-industrie/index.html` : absent (dossier inexistant).
- Bundle initial : `main-*.js` ne contient ni la question de FAQ « J'ai déjà un site, ça vaut le
  coup ? » ni le nom de l'offre (0 occurrence) ; la copy n'est que dans le chunk lazy
  (`chunk-Dxwr4x-x.js`, préchargé par la seule page d'offre prérendue). Point 4 de la revue T1
  soldé.
- Sitemap régénéré (`pnpm sitemap:build`, non commité) : contient
  `https://nedellec-julien.fr/offres/site-atelier`, plus aucune `/offre-site-industrie`.
- nginx (image locale) :
  - `curl -sI '/offre-site-industrie?utm_source=x'` → `HTTP/1.1 301 Moved Permanently`,
    `Location: /offres/site-atelier?utm_source=x` (relatif, query conservée), en-têtes de sécurité
    présents (HSTS, `X-Frame-Options: DENY`) ;
  - `/offre-site-industrie/` → 301, `Location: /offres/site-atelier` ;
  - `/offres/site-atelier/` → 200, contient `<app-offer-page` ;
  - `/offres/inexistant` → 404 ;
  - le bloc smoke de `ci.yml` rejoué tel quel contre l'image (port adapté) : exit 0.
- Runtime : `http://localhost:3917/offre-site-industrie?utm_source=x` aboutit à
  `/offres/site-atelier?utm_source=x`, page hydratée (`app-offer-page`, 1 `h1`, 2 cartes de prix,
  5 FAQ, sujet prérempli « Site pro pour mon atelier ») ; sur la home, le lien footer « Sites pour
  ateliers » a `href="/offres/site-atelier"`. Capture : hero de la page d'offre, prise dans le
  navigateur de session.
- Console : aucune erreur applicative (aucune `NG0…`, aucune erreur d'hydratation). Seules erreurs,
  d'environnement et identiques à T1 : un 404 de ressource (`/api/config`, absent en local) et le
  CORS de `api.nedellec-julien.fr` refusant l'origine `localhost` (CV, analytics), d'où le toast
  d'erreur global.

### Tranche 3 — les cinq pages `/offres/<slug>` (dont `/offres/site-atelier`, surface atteignable en production)

Steps : `pnpm install --frozen-lockfile` → `pnpm run build --configuration production` (API de
prod joignable du premier coup ; 19 routes prérendues, CSP sur 20 pages) → lecture scriptée de
`dist/angular-portfolio-app/browser/offres/<slug>/index.html` → `public/` restauré par
`git checkout` → `python3 -m http.server 4323` sur `dist/angular-portfolio-app/browser` →
`/offres/renfort-freelance/` et `/offres/application-metier/` dans le navigateur de session.

- HTML prérendu, pour chacun des cinq slugs (`site-vitrine`, `site-atelier`,
  `application-metier`, `refonte-maintenance`, `renfort-freelance`) : un seul `h1` = titre du
  hero ; `offer-hero-price` = `priceTeaser` (`890 €, prix final`, `690 €, prix final`,
  `À partir de 4 500 €`, `Audit 450 €, maintenance dès 190 €/mois`, `TJM sur demande`) ; un
  `<form>`, `contact-subject` prérempli avec le sujet de l'offre ; canonical
  `https://nedellec-julien.fr/offres/<slug>` ; `<title>` = `seo.title`.
- JSON-LD `Service.offers` : vitrine et atelier `Offer.price` + `UnitPriceSpecification` `price`
  `MON` ; application `PriceSpecification.minPrice` `4500` + `UnitPriceSpecification.minPrice`
  `190` `MON` ; refonte `Offer.price` `450`, `Chantiers` sans prix, maintenance `minPrice` `190`
  `MON` ; renfort `{ "@type": "Offer", "name": "Régie" }` seul. `areaServed` : Yvelines +
  Île-de-France pour les sites, plus `Country` France pour les trois offres `applications`.
- `renfort-freelance` : `offer-step` × 0, « Temps partiel » présent, un seul `offer-price-link`
  (`href="https://www.malt.fr/profile/juliennedellec"`, `target="_blank"`, `rel="noopener
  noreferrer"`) ; aucun `offer-price-link` sur les quatre autres pages.
- Bundle initial : `main-*.js` ne contient aucune copy des nouvelles offres (« ni textes ni
  photos », « Stack et pratiques », « restitution d », « Fiche Google Business » : 0 occurrence) ;
  elle n'est que dans le chunk lazy des pages d'offre.
- Runtime : pages hydratées ; renfort : 1 `h1`, 0 étape, sujet « Proposition de mission Angular /
  NestJS », carte « Régie / TJM sur demande » avec le bouton « Voir mon profil Malt ». Captures :
  hero du renfort, section Conditions du renfort, hero de l'application métier.
- Console : aucune erreur applicative (aucune `NG0…`, aucune erreur d'hydratation). Erreurs
  d'environnement seulement, identiques aux tranches précédentes : `/api/config` 404 hors nginx et
  CORS de `api.nedellec-julien.fr` sur l'origine localhost (CV, analytics), d'où le toast global.

Verdict : **PASS**.

### Tranche 5 — `/about` (page Parcours, surface atteignable en production)

Steps : `pnpm run build --configuration production` → lecture de
`dist/angular-portfolio-app/browser/about/index.html` → service statique de
`dist/angular-portfolio-app/browser` sur `localhost:4317` → `/about/`, puis `/about#recrutement`
en lien direct et en navigation SPA depuis la home, desktop et mobile 375 px.

- HTML prérendu : un seul `h1`, un seul `main` (shell) ; `<title>Parcours | Julien Nédellec</title>` ;
  meta description « Parcours de Julien Nédellec… ouvert à un CDI en Île-de-France » ; JSON-LD
  BreadcrumbList Accueil → Parcours (`/about`) ; `<section id="recrutement" aria-labelledby
  data-testid="about-hiring">` prérendu hors `@defer`, entre `app-about-diploma` et le bloc différé
  `app-about-motivation`, avec h2, mention CDI et lien LinkedIn en `link-btn-outline`. Lien CV
  absent du prérendu (chargé côté client, attendu).
- Runtime : l'ancre `#recrutement` est atteinte en lien direct et en navigation SPA, h2 visible sous
  le header fixe ; rendu mobile vérifié.
- Console : aucune erreur applicative. Erreurs d'environnement seulement (`/api/config` 404 hors
  nginx, CORS de l'API sur l'origine localhost) ; `AboutHiring` suit son repli (lien CV masqué).
  Chemin heureux du lien CV couvert par les tests HTTP stubbés, non observable sans API locale.

Verdict : **PASS**.

## Review code

### Tranche 1

**Verdict** : APPROVED
**Gates CI locaux** : tests ✅ (`pnpm test`, exit 0, 87 fichiers / 703 passed en re-revue ; 701/701 en 1re revue après purge `ng cache clean` + `node_modules/.vite`) / lint ✅ (`pnpm lint`, exit 0, « All files pass linting ») / install ✅ (`pnpm install --frozen-lockfile`, exit 0, 1re revue) / build ✅ (`pnpm run build --configuration production`, exit 0, 15 routes prérendues, CSP sur 16 pages, 1re revue ; code applicatif inchangé depuis : `offer-seo.ts` retouché par la mutation temporaire puis restauré, contenu identique)
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main sur les fichiers du diff. Archéologie (motif du profil) 0 hit, y compris sur les 2 tests ajoutés ; un seul commentaire (`offer-page.spec.ts:26`, WHY d'une ligne). `export default`, `effect(`, helpers zone, `innerHTML`/`bypassSecurity`, `console.`, `.only`/`.skip`, snapshot, `fireEvent`, `interface`, `@capacitor` : 0 hit. Aucun résidu `site-offer`/`SITE_OFFER`/anciens testids de tarif dans `src/`, `scripts/`, `.github/`, `Dockerfile`.
**Warnings de gate** : aucun
**Rendu compilé** : N/A (pas de composant à sélecteur attribut ni `shared/ui/**` touché)
**Preuve de verify runtime** : ✅ (preuve `## Verify` complète ; rejouée par la revue sur le build prod : page hydratée, 1 `h1`, 2 cartes de prix, sujet prérempli, CTA ⇒ `#demande` ; console sans `NG0…`, seules erreurs `/api/config` 404 et CORS de l'API, environnementales)
**Score de mutation** : N/A (profil sans outil) — mutation manuelle ciblée sur les 2 replis de `toOfferSeo`, rapportée par l'implémenteur ci-dessous
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅ (ADR-0005 décision 1 alignée sur l'annotation `: OfferPages`, sans `as const`)

HTML prérendu `offre-site-industrie/index.html` (1re revue) : textes et testids de la spec 007 au complet (reason × 3, deliverable × 9, step × 4, faq-item × 5, price-line × 2, `690&nbsp;€, prix final`, `690&nbsp;€`, `29&nbsp;€/mois`), h2 dans l'ordre, title/description/canonical inchangés, JSON-LD identique au littéral de `master`.

Écarts signalés par l'implémenteur :
1. `seo.breadcrumbName` / `seo.serviceDescription` optionnels : **acceptable** (modèle du plan § 3) ; replis désormais testés.
2. `OFFER_PAGES: OfferPages` : **acceptable** (plan § 3) ; ADR aligné.
3. `OFFERS.find(...)!` dans `app.routes.ts:9` : **acceptable en T1** (invariant testé, disparaît en T2).
4. `OFFER_PAGES` dans le bundle initial : **acceptable en T1** (prescrit par le plan pour cette tranche, aucun budget dépassé). La revue T2 doit vérifier que `main-*.js` ne contient plus la copy de la FAQ.
5. `audience` / `promise` : **levé** (copy validée par Julien).

Re-revue : point bloquant 1 (ADR) soldé ; `offer-seo.spec.ts` épingle le repli du fil d'Ariane (`toEqual` sur `itemListElement`) et l'absence de clé `description` (`'description' in service === false`, qui discrimine bien une clé `undefined`). `specs/009-copy-offres.md` : annexe de copy hors code, non consommée en T1, sans effet sur les gates.

**Tests notables** :
- ✨ `src/app/features/offer/offer-seo.spec.ts` (replis) : assertion d'absence de clé par `in` plutôt que `toEqual`, seule forme qui tue le mutant « `description: undefined` ».
- ✨ `src/app/features/offer/application/offer-page.spec.ts:187` : `describe.each` atelier + builder sur les h2, ce qui prouve que les titres viennent des données.
- ✨ `src/app/features/offer/offer-seo.spec.ts:22` : golden du `SeoData` atelier égal au littéral de `master`.

**Risque résiduel** (advisory, § 8) :
- réversibilité : profil muet sur la livraison (Dokploy continu sur `master`) · monitoring : Sentry
- aucun état persistant touché
- non couvert par les gates : en T1, le bundle initial porte la copy complète de l'offre atelier (régression de poids temporaire, résorbée en T2).

Complément de revue (2026-10-04 12:43, code existant, tests verts d'emblée) : 2 tests sur les replis de `toOfferSeo` (`breadcrumbName ?? summary.name`, `description` posée seulement si `serviceDescription`). Discriminance vérifiée par mutation temporaire de `offer-seo.ts` : repli fil d'Ariane remplacé par un littéral ⇒ 1 failed / 6 ; `description: serviceDescription` posée sans condition ⇒ 1 failed / 6 ; fichier restauré à l'octet près (`cmp`). `pnpm test` : 703 passed / 703 ; `pnpm lint` : vert.

### Tranche 2

**Verdict** : APPROVED (re-revue ; 1re revue REJECTED sur le seul point de commentaire du `Dockerfile`, soldé)
**Gates CI locaux** : tests ✅ (`pnpm test`, exit 0, 89 fichiers / 711 passed, après `pnpm exec ng cache clean` + `rm -rf node_modules/.vite`) / lint ✅ (`pnpm lint`, exit 0, « All files pass linting ») / install ✅ (`pnpm install --frozen-lockfile`, exit 0) / build ✅ (`pnpm run build --configuration production`, exit 0, 15 routes prérendues, CSP sur 16 pages ; `public/` restauré par `git checkout`)
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main sur les lignes ajoutées. Motif d'archéologie du profil : 0 hit. `export default`, `effect(`, helpers zone, `innerHTML`, `console.`, `.only`/`.skip`, snapshot, `interface` : 0 hit. Sweep de l'ancienne URL (`git grep`, hors `specs/` et `public/`) : restent la route `redirectTo` (`app.routes.ts:134`), le bloc nginx, le smoke CI, les 3 tests qui épinglent redirection et non-prérendu, et l'historique des ADR 0004/0005 (légitime).
**Warnings de gate** : aucun (sorties complètes de test, lint et build relues)
**Rendu compilé** : N/A (ni `shared/ui/**` ni composant à sélecteur attribut touché)
**Preuve de verify runtime** : ✅ (preuve `## Verify` / Tranche 2 complète et cohérente avec le diff ; rejouée par la revue sur l'image `ng-portfolio-app:review` : `/offre-site-industrie?utm_source=x` aboutit à `/offres/site-atelier?utm_source=x`, page hydratée, 1 `h1`, 5 FAQ, 2 cartes de prix, sujet prérempli, canonical sur la nouvelle URL, `footer-offer-link` = `/offres/site-atelier` ; `/offres/inexistant` affiche la page 404 client ; console sans `NG0…`, seules erreurs `/api/config` 404 et CORS de l'API refusant l'origine `localhost`, environnementales)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅

Points jugés :

1. **Redirection.** `nginx -t` OK dans l'image. Ordre des `location` correct : la regex des assets (`\.(js|css|…)$`) ne capture pas l'ancienne URL, `= /rss.xml` est exacte, la regex `^/offre-site-industrie/?$` passe avant celle des routes CSR et avant le `location /` préfixe ; `/offre-site-industrie-x` tombe bien en 404. `curl -sI` sur l'image : `?utm_source=x` → `301`, `Location: /offres/site-atelier?utm_source=x` (relatif) ; sans slash et avec slash → `301`, `Location: /offres/site-atelier` ; les 7 en-têtes de sécurité du snippet sont présents sur la 301 (héritage du `server`, la `location` ne pose aucun `add_header`). `/offres/site-atelier/` et `/offres/site-atelier` → 200 ; `/offres/inexistant` → 404 sans `ng-state`. Smoke `ci.yml` rejoué 50 fois sous `set -euo pipefail` contre l'image : vert (le `curl … | grep -q` reprend le gabarit déjà en place pour `/about/`). `redirectTo` Angular limité aux navigations client, non prérendu : conforme au § 1.
2. **Server routes.** `OFFERS.map(({ slug }): ServerRoute => …)` : l'annotation de retour est nécessaire pour que le spread garde `renderMode` typé en littéral dans `ServerRoute[]`. Plus aucune entrée `offre-site-industrie` : le `**` Client la prend, épinglé par `app.routes.server.spec.ts:24`.
3. **Bundle initial.** `main-*.js` et les 5 chunks préchargés par la home ne contiennent ni « J'ai déjà un site », ni « Le site de votre atelier », ni « prix final », ni le sujet du formulaire. Toute la copy est dans le chunk lazy `chunk-Dxwr4x-x.js` (5,3 kB, cible du `loadChildren`, préchargé par la seule page d'offre). `main` ne garde que la table de routes et `offerPath('site-atelier')` (footer). Remarque 4 de la revue T1 soldée.
4. **Sitemap.** Régénéré par le `build` : `https://nedellec-julien.fr/offres/site-atelier` présent, aucune `/offre-site-industrie`. Import par `tsx` sans alias : `offer-catalog.static-data.ts` → `./format-eur`, `./offer-prices.static-data`, `./models/offer.model` (type) ; `offer-path.ts` → `import type` relatif.

Prérendu : `browser/offres/site-atelier/index.html` contient un seul `h1`, `690&nbsp;€, prix final`, `offer-faq-item` × 5, un `<form>`, canonical `/offres/site-atelier`, zéro occurrence de l'ancienne URL ; JSON-LD `Service.url` et fil d'Ariane (Accueil → Sites pour ateliers) sur la nouvelle URL, sans lien vers `/offres` (404 jusqu'à T4). `browser/offre-site-industrie/` absent.

**Tests notables** :
- ✨ `src/app/app.routes.spec.ts:43` : la redirection est prouvée par une vraie navigation (`navigateByUrl`, URL finale et `data.summary` de la feuille), pas seulement par la lecture de `redirectTo`.
- ✨ `src/app/features/offer/offer.routes.spec.ts:34` : l'URL attendue est recalculée indépendamment de `offerPath`, l'oracle ne réutilise pas le code testé.

**Risque résiduel** (advisory, § 8) :
- réversibilité : livraison continue Dokploy sur `master` · monitoring : Sentry
- aucun état persistant touché
- non couvert par les gates : la redirection Angular perd la query string (comportement du routeur, documenté au Plan de test) ; seuls les liens servis par nginx gardent les UTM.

**Points à corriger (1re revue)** — soldés :
1. ~~`Dockerfile:83-85` — bloc de commentaire de 3 lignes au-dessus de la `location` (QUOI + WHY ; le profil admet un WHY d'une ligne).~~ Soldé : le bloc est supprimé, une seule ligne de WHY au-dessus de `absolute_redirect off;` (« Traefik termine le TLS devant : un Location absolu pointerait sur http://<host>:3000. »).

Re-revue (2026-10-04) :
- Diff relu contre la base de branche `0b758d8` : mêmes 11 fichiers qu'en 1re revue, seul le `Dockerfile` a bougé (bloc de commentaire, aucune directive modifiée). Gates test/lint/build non rejouées : aucun fichier qu'elles lisent n'a changé.
- `docker build` : **échec d'infra hors diff**, au `prebuild` du stage Node (`generate-sitemap.mjs` : `https://api.nedellec-julien.fr/api/blog/posts answered HTTP 502`, API de prod indisponible). Pas un REJECTED de correctness. Pour valider la conf nginx sans ce stage, le bloc `default.conf` extrait du `Dockerfile` courant a été monté sur l'image de la 1re revue (même `browser/`) : `nginx -t` OK ; `/offre-site-industrie?utm_source=x` → 301, `Location: /offres/site-atelier?utm_source=x`, 7 en-têtes de sécurité présents ; `/offre-site-industrie/` → 301 ; smoke `ci.yml` rejoué sous `set -euo pipefail` : vert. L'image complète reste à reconstruire une fois l'API revenue (le job docker de la CI le fera).
- Information pour la session principale : `origin/master` a avancé pendant la revue (`c3e822e`, T5 mergée), qui touche aussi `app.routes.ts` (route `about`, hunk disjoint) et cette spec. Rebaser avant la PR, résoudre le conflit probable dans la spec, puis rejouer `pnpm test` / `pnpm lint` / `pnpm build` sur la branche rebasée.

### Tranche 3

**Verdict** : APPROVED
**Gates CI locaux** : tests ✅ (`pnpm test`, exit 0, 91 fichiers / 804 passed, après `pnpm exec ng cache clean` + purge `node_modules/.vite`) / lint ✅ (`pnpm lint`, exit 0, « All files pass linting ») / install ✅ (`pnpm install --frozen-lockfile`, exit 0) / build ✅ (`pnpm run build --configuration production`, exit 0, API de prod joignable du premier coup, 19 routes prérendues, CSP sur 20 pages ; `public/` restauré par `git checkout`)
**Checks mécaniques** : `aak-checks.sh --diff origin/master --zoneless --immutability --archaeology '<motif du profil>'` (version plugin, `.claude/checks/` non vendoré) : « aucun hit sur 12 fichier(s) » ; défauts universels pour page-suffix et seuils d'altitude
**Warnings de gate** : aucun (sorties test, lint et build lues en entier)
**Rendu compilé** : N/A (pas de composant à sélecteur attribut ni de fichier `shared/ui/**` touché ; `link-btn-outline` est un `@utility` existant)
**Preuve de verify runtime** : ✅ (preuve `## Verify` / Tranche 3 complète et cohérente avec le diff ; rejouée par la revue sur le build prod servi en statique : vitrine (desktop), renfort, refonte et atelier (375 px) hydratés, 1 `h1`, pas de débordement horizontal, sujets préremplis, lien Malt rendu ; console sans `NG0…` ni erreur d'hydratation, seulement `/api/config` 404 et CORS de l'API sur localhost, dus à l'environnement)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅

Points jugés :
1. **Copy** : les quatre offres sont fidèles à l'annexe validée, champ par champ (résumés, SEO, hero, sections, effectifs, lignes de prix, FAQ, demande). Tarifs 890 + 29/mois, à partir de 4 500, audit 450, dès 190/mois, TJM sur demande, tous lus dans `OFFER_PRICES` via `formatEur`. Engagements présents mot pour mot : 24 heures ouvrées (vitrine), 4 à 8 semaines, premier échange de 30 minutes gratuit et cadrage compris, hébergement en France, restitution d'une heure, temps partiel (hero, conditions et FAQ du renfort). Seuls écarts : la majuscule en tête des `detail` d'étape et de la `detail` « Angular récent… » d'une raison, et le scindage « Inclus : … » en `includes`, qui suivent les conventions de rendu de l'atelier. Aucun écart de fond.
2. **24 heures ouvrées** : intro atelier = « … Je vous rappelle sous 24 heures ouvrées. » (`offer-pages.static-data.ts:272`), promesse de maquette retirée, test recalibré au lieu d'être doublé. `grep -rnE '48 ?h|48 heures' src/` : seul hit `w-48 h-48` (classe Tailwind de `two-factor-enable-form.ts`). Aucun « 48 h » dans le HTML prérendu ni dans les chunks.
3. **Lien Malt** : `link?: 'malt'` reste une clé de domaine (aucun import `@` dans `domain/`). `OfferPage` la résout via `SITE_IDENTITY.socials.malt` et la passe en `input()` (`maltUrl`), comme la mention TVA, conformément au § 3. `offer-pricing.ts:29-39` : `target="_blank"`, `rel="noopener noreferrer"`, `link-btn-outline`. Libellé « Voir mon profil Malt » : validé par Julien et ajouté à l'annexe pendant la revue, ce n'est plus un écart.
4. **JSON-LD** (`offer-seo.ts:9-24`) : `from`/`once` → `PriceSpecification.minPrice`, `from`/`month` → `UnitPriceSpecification` `minPrice` + `MON`, `on-request` → `{ '@type': 'Offer', name }` sans prix ni devise, quelle que soit la période. Les replis `fixed` de l'atelier sont inchangés (golden vert). `areaServed` dépend de la famille (`AREAS_SERVED`) : France en `Country` pour les trois offres `applications`. Conforme au § 8.3 et vérifié dans les cinq `index.html`.
5. **Espaces insécables** : ` ` devant `:` dans 4 chaînes (`offer-pages.static-data.ts:111, 323, 398, 604`). Ce n'est pas une nouveauté dans la feature : `offer-reasons.ts:15` rend déjà `&nbsp;:` entre l'accroche et le détail, sur la même page. En revanche, le même fichier garde une espace simple devant `;` (`:133`, `:518`) et devant tous les `?` des questions, et le reste du site (`app.routes.ts`, pages légales) met une espace simple devant `:`. Convention partielle, non bloquante (cf. remarques).
6. **`audit` → `inspect`** : légitime. Il fallait respecter l'invariant pré-existant « ids distincts par page », que l'id d'étape `audit` cassait face à la ligne de prix `audit`. Les ids ne servent que de clé de `track`, donc sans effet sur le DOM ni l'analytics.
7. **Bundle initial** : `main-*.js` ne contient aucune chaîne des nouvelles offres (« ni textes ni photos », « Stack et pratiques », « restitution d », « Fiche Google Business », « Votre site vitrine », « Proposition de mission », « TJM sur demande », « Voir mon profil Malt » : 0 occurrence). Elles se trouvent uniquement dans les chunks lazy des pages d'offre.

Remarques non bloquantes (pour la session principale) :
- La ligne de journal de la tranche 3 (spec, l. 570) a été insérée dans `### Tranches` du Plan technique, entre T4 et T5, et non sous `## Journal des tranches`. À déplacer.
- Typographie : trancher une règle unique pour `: ; ? !` (insécable partout, ou espace simple partout) et l'appliquer à la copy des offres. Aujourd'hui, une même FAQ mélange les deux. À soumettre à Julien avec le reste de la copy, sans incidence sur le contenu validé.

**Tests notables** :
- ✨ `offer-page.spec.ts` `describe.each(OFFERS…)` : le câblage donnée → DOM est couvert pour chaque slug, sans recopier la copy.
- ✨ `offer-seo.spec.ts` « offers of the catalogue » : les `offers` réels sont comparés en `toEqual` exact à `String(OFFER_PRICES…)`, ce qui verrouille l'absence de prix sur `on-request`.
- ⚠️ `offer-pages.static-data.spec.ts` « fills each section with the validated number of items » : les effectifs seuls ne détectent pas une item de copy altérée. Écart accepté par le Plan de test, qui n'épingle que ce qui engage.

**Risque résiduel** (advisory, § 8) :
- réversibilité : profil muet (déploiement Dokploy continu sur `master`) · monitoring : Sentry
- non couvert par les gates : la typographie et la majuscule des `detail` ne sont épinglées par aucun test.

### Tranche 5

**Verdict** : APPROVED (re-revue, après un REJECTED en 1re revue)
**Gates CI locaux** : tests ✅ (`pnpm test`, 85 fichiers / 698 passed) / lint ✅ / install ✅ (`pnpm install --frozen-lockfile`) / build ✅ (`pnpm run build --configuration production`, 15 routes prérendues, CSP sur 16 pages, relancé en re-revue)
**Checks mécaniques** : `aak-checks.sh --diff origin/master --zoneless --archaeology` (version plugin), 0 hit sur 9 fichiers
**Preuve de verify runtime** : ✅ (ancre en lien direct et en SPA, mobile 375 px, h1 unique, console sans erreur due au diff)
**Conventions Angular 20+** : ✅ · **Cross-platform** : ✅ · **Tests** : ✅ · **Sécurité** : ✅ · **Alignement spec** : ✅

1re revue, points corrigés :
1. Bloquant : liste de classes « pilule à contour » dupliquée sur les deux liens d'`about-hiring.ts`
   (ADR-0003). Corrigé par l'utilitaire existant `link-btn-outline` (arbitrage : boutons
   rectangulaires conformes à la maquette). `header.ts` et `admin-dashboard.ts` portent encore
   la même liste : dette antérieure, celle du header disparaît en T8.
2. Mineur : commentaire descriptif dans `about.ts` supprimé, seul le WHY (bloc hors `@defer`) reste.

Écarts jugés acceptables : `loadCvUrl` dupliqué depuis `header.ts` (transitoire, retiré en T8) ;
texte de `hiringAvailability` (choix produit, épinglé par test).

**Tests notables** :
- ✨ `about.spec.ts` : `DeferBlockBehavior.Manual` prouve que le bloc existe sans déclencher les defer (décision 8.6).
- ✨ `about-hiring.spec.ts` : l'échec HTTP 500 laisse LinkedIn et masque le CV.
