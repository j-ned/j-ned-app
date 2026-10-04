---
id: 009
title: Transformer le portfolio en plateforme d'acquisition client (catalogue d'offres, home commerciale, profil CDI en secondaire)
type: feat
status: draft
created: 2026-10-04
related: [PRODUCT.md, DESIGN.md, specs/007-offre-site-industrie.md, docs/adr/0004-contenu-statique-de-feature-sans-gateway.md, docs/adr/0005-catalogue-offres-routes-statiques.md, docs/adr/0006-polices-auto-hebergees.md]
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
| `src/app/features/offer/domain/offer-catalog.static-data.ts` | `OFFERS` (résumés ordonnés), `OFFER_FAMILY_LABELS`, `OFFER_FAMILY_LEADS`, `OFFER_CATALOGUE_HEADING`, `OFFER_CATALOGUE_LEAD` (T4) |
| `src/app/features/offer/domain/offer-pages.static-data.ts` | `OFFER_PAGES` (`satisfies OfferPages`, remplace `site-offer.static-data.ts`) |
| `src/app/features/offer/domain/format-eur.ts` | `formatEur(amount)` : `Intl.NumberFormat('fr-FR')` + ` €` |
| `src/app/features/offer/domain/offer-path.ts` | `OFFERS_BASE_PATH = 'offres'`, `offerPath(slug)` → `/offres/<slug>` |
| `src/app/features/offer/domain/group-offers-by-family.ts` | Regroupement Sites puis Applications, familles vides omises (T4) |
| `src/app/features/offer/offer-seo.ts` | `toOfferSeo`, `toOfferCatalogueSeo`, `toOfferCatalogJsonLd` (pures) |
| `src/app/features/offer/offer.routes.ts` | `OFFER_ROUTES` générées depuis `OFFERS` |
| `src/app/features/offer/application/offer-page.ts` | Page générique (remplace `site-offer.ts`) |
| `src/app/features/offer/application/offer-catalogue.ts` | Page catalogue `/offres` (T4) |
| `src/app/features/offer/application/components/offer-card.ts` | Carte d'offre de la famille Sites, sur `Cartouche` (T4) |
| `src/app/features/offer/application/components/offer-row.ts` | Ligne d'offre de la famille Applications, lien unique (T4) |
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

### Tranche V — plan détaillé

> Décision structurante : **ADR-0006** (polices auto-hébergées, remplace la « System-Stack Rule »
> de `DESIGN.md`). Prolonge ADR-0003 (`@utility` réservé à l'élément natif unique). Profil lu.
> **Aucune dépendance ajoutée, aucune modification de CSP, aucun changement backend.** Maquette de
> référence : `maquette-plateforme.html` (validée par Julien le 2026-10-04), dont on reprend les
> valeurs, pas le chargement Google Fonts.

#### V.1 Hébergement des polices (tranché : auto-hébergées)

- Quatre fichiers woff2 dans `public/fonts/`, servis par nginx depuis l'origine du site :
  `archivo-2.001-latin-wdth100-110-wght600-800.woff2` (39 512 o, `wdth` 100–110 et `wght` 600–800, seules plages
  employées), `jn-sans-3.201-latin-wght.woff2` (35 864 o),
  `jn-sans-3.201-latin-wght-italic.woff2` (38 840 o, vraie italique, `wght` 400–700 comme le
  romain), `jn-mono-2.3-latin-500.woff2` (14 924 o, fichier statique 500, non instancié).
  Total mesuré **129 140 o** (fontTools 4.66.1) ; une page sans italique en charge au plus 90 300.
  **IBM Plex renommée** : « Plex » est un *Reserved Font Name* de la licence amont, et les fichiers
  servis (sous-ensemble latin, axes réduits) sont des *Modified Versions* au sens de l'OFL ; la
  famille est renommée « JN Sans » / « JN Mono » dans la table `name` de **tous** les fichiers
  Plex servis, Mono compris, glyphes et axes intacts (commande dans ADR-0006 § 6 et § 2).
  Plage de l'italique non réduite : 400–600 ne gagnerait que 832 o (mesuré) et rendrait
  `em strong` sans vraie graisse. Archivo réduit après mesure des parades au coût Lighthouse
  (variante C, cf. `## Verify` / Tranche V) : 57 504 o → 39 512 o, rendu identique.
  Source exacte (paquets Fontsource 5.3.0, sous-ensemble `latin`), plages d'axes réduites par
  `fontTools.varLib.instancer`, commande de reproduction et licences : ADR-0006. L'implémenteur
  rejoue la commande de l'ADR dans le scratchpad (aucun outil installé dans le repo) et commite
  les quatre binaires plus `public/fonts/OFL-archivo.txt` et `public/fonts/OFL-ibm-plex.txt`
  (en-tête amont `with Reserved Font Name "Plex"`, note sur les modifications et le renommage).
- **Pourquoi pas Google Fonts** (la maquette l'utilise) : transfert d'IP sans consentement
  (RGPD, LG München 2022), CSP à élargir sur deux origines, feuille externe bloquante. Auto-hébergé,
  la CSP actuelle (`font-src 'self'`) couvre tout sans changement, et `scripts/apply-csp-hashes.mjs`
  n'est pas touché (les `@font-face` qui atterrissent dans le CSS critique inliné sont hachés comme
  le reste des `<style>`).
- **Noms versionnés** : nginx sert `woff2` en `immutable` sur un an et `public/` n'est pas haché ;
  tout changement de binaire change le nom (ADR-0006 § Decision 3).
- **`@font-face`** dans `src/styles.css`, après les `@import`/`@plugin`, URLs **absolues**
  (`url('/fonts/…') format('woff2')`, laissées telles quelles par le builder : à vérifier dans le
  CSS émis, cf. verify) :

  | `font-family` | Fichier | Descripteurs |
  |---|---|---|
  | `'Archivo'` | `archivo-2.001-…` | `font-weight: 600 800; font-stretch: 100% 110%; font-display: swap` |
  | `'JN Sans'` | `jn-sans-3.201-…` | `font-weight: 400 700; font-display: swap` |
  | `'JN Sans'` | `jn-sans-3.201-…-italic` | `font-style: italic; font-weight: 400 700; font-display: swap` (pas de préchargement) |
  | `'JN Mono'` | `jn-mono-2.3-…` | `font-weight: 500; font-display: swap` |
  | `'Archivo Fallback'` | `local('Arial Bold')`, `local('Arial-BoldMT')`, `local('Liberation Sans Bold')`, `local('LiberationSans-Bold')` | `font-weight: 600 800; size-adjust: 109.59%; ascent-override: 80.11%; descent-override: 19.16%; line-gap-override: 0%` |
  | `'JN Sans Fallback'` | `local('Arial')` | `size-adjust: 101.88%; ascent-override: 100.60%; descent-override: 26.99%; line-gap-override: 0%` |

  Les valeurs des faces de repli sont **calculées** (tables `hhea`/`OS/2` et chasse moyenne d'un
  échantillon français, contre Liberation Sans, métriquement identique à Arial) ; méthode dans
  ADR-0006. Pas d'`unicode-range` : chaque fichier ne contient que le sous-ensemble latin.
- **Préchargement** de la seule police du LCP (Archivo, police du `h1` de chaque page publique)
  dans `src/index.html`, juste après la `<meta>` CSP :
  `<link rel="preload" href="/fonts/archivo-2.001-latin-wdth100-110-wght600-800.woff2" as="font" type="font/woff2" crossorigin />`
  (`crossorigin` obligatoire même en même origine, sinon double téléchargement). Aucune
  préconnexion à ajouter.

#### V.2 Tokens `@theme` (sans casser l'existant)

Ajouts au bloc `@theme` de `src/styles.css` (aucun token existant renommé ni modifié) :

```css
--font-display: 'Archivo', 'Archivo Fallback', system-ui, sans-serif;
--font-sans: 'JN Sans', 'JN Sans Fallback', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JN Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
--color-line: var(--theme-line);
--color-line-strong: var(--theme-line-strong);
```

- `--font-sans` et `--font-mono` **surchargent** les défauts Tailwind : le preflight les applique
  à `html` et à `code/kbd/pre`, donc tout le site (pages publiques, blog, admin) passe en Plex
  sans toucher un template, et les 32 `font-mono` existants passent en Plex Mono.
  `--font-display` crée l'utilitaire `font-display` (pas de collision : Tailwind n'a pas
  d'utilitaire de ce nom).
- Couche de thème, dans les deux blocs `:root` existants :

  | Token | Sombre (`:root`) | Clair (`:root:not(.app-dark)`) |
  |---|---|---|
  | `--theme-line` | `color-mix(in srgb, var(--theme-foreground) 9%, transparent)` | `color-mix(in srgb, var(--theme-foreground) 12%, transparent)` |
  | `--theme-line-strong` | `color-mix(in srgb, var(--theme-foreground) 22%, transparent)` | `color-mix(in srgb, var(--theme-foreground) 28%, transparent)` |

  Valeurs de la maquette. Contrastes **calculés** (composition sRGB, formule WCAG 2.x) :

  | Trait | Sur fond | Sur carte |
  |---|---|---|
  | `line` sombre | 1,22:1 | 1,25:1 |
  | `line-strong` sombre | 1,88:1 | 1,94:1 |
  | `line` clair | 1,26:1 | 1,26:1 |
  | `line-strong` clair | 1,77:1 | 1,78:1 |
  | cote (`text-primary`) sombre `#818cf8` | 6,64:1 | 6,33:1 |
  | cote (`text-primary`) clair `#4338ca` | 7,40:1 | 7,90:1 |

  **Décision** : `line` et `line-strong` sont des traits **décoratifs** (cadre et séparateurs du
  cartouche, que le texte `dt`/`dd` rend redondants) ; ils sont sous 3:1 et ne doivent **jamais**
  porter seuls une information ni délimiter un composant interactif (WCAG 1.4.11). Le seul trait
  porteur de sens de la tranche, la cote, est dessiné en `currentColor` = `text-primary`, ≥ 6,3:1
  dans les deux registres. Un futur trait porteur d'information utilise `text-primary` ou
  `foreground` à **≥ 50 % en clair (3,04:1 sur fond) et ≥ 35 % en sombre (3,05:1)** : seuils
  calculés, à écrire dans `DESIGN.md`.
- Base typographique, dans un `@layer base` de `src/styles.css` (règles d'élément, comme le
  `body` existant ; pas de classe ad hoc) :
  - `html { font-synthesis-weight: none; }` (une graisse hors plage prend la plus proche, jamais
    de faux gras). `em`/`i` utilisent la vraie italique Plex Sans ; seuls Archivo et Plex Mono, sans
    italique livrée, retomberaient sur une oblique synthétisée (usage non prévu).
  - `h1, h2, h3 { font-family: var(--font-display); }` et `font-stretch` par niveau, valeurs de la
    maquette : `h1` 108 %, `h2` 106 %, `h3` 104 %. Les classes de taille, graisse et interlettrage
    des titres existants ne changent pas (`font-extrabold` = 800, dans la plage d'Archivo).
- **Pas de nouvelle `@utility`** (ADR-0003) : cartouche et cote sont des structures de plusieurs
  éléments ⇒ composants `shared/ui/`. Les données chiffrées s'écrivent `font-mono tabular-nums`
  dans le template (deux classes, pas d'abstraction).

#### V.3 API des primitives

**`src/app/shared/ui/cartouche.ts`** — `Cartouche`, sélecteur `app-cartouche`.

```ts
export type CartoucheRow = { readonly label: string; readonly value: string };
// inputs
readonly title = input.required<string>();
readonly reference = input<string>('');
readonly rows = input<readonly CartoucheRow[]>([]);
```

- Hôte : `class="block rounded-sm border-[1.5px] border-line-strong bg-surface text-sm"`,
  `role="group"`, `[attr.aria-label]="title()"` (nom accessible = texte visible du titre ; pas
  d'id à générer). Le type `CartoucheRow` est co-localisé dans le fichier (précédent :
  `AppTagSeverity` dans `tag.ts`).
- Barre de titre : `div` `grid gap-1 border-b-[1.5px] border-line-strong p-3.5` (référence
  **empilée sous le titre**, décision de Julien en T4 : noms et publics d'offre trop longs pour
  une barre sur une ligne), contenant `<p data-testid="cartouche-title">` (`font-display
  font-bold font-stretch-110%`) et, si `reference()` non vide, `<p data-testid="cartouche-reference">`
  (`font-mono text-xs text-muted`). Le titre n'est **pas** un titre de section (`h*`) : son niveau
  dépend du contexte ; un consommateur qui a besoin d'un titre le projette.
- Si `rows().length > 0` : `<dl>` contenant, par ligne (`@for … track $index`, données
  statiques jamais réordonnées), un
  `<div data-testid="cartouche-row" class="grid grid-cols-[8.5rem_minmax(0,1fr)] border-t border-line first:border-t-0">`
  avec `<dt data-testid="cartouche-label">` (`font-mono text-xs uppercase tracking-[0.06em]
  text-muted border-r border-line px-3.5 py-2.5`) et `<dd data-testid="cartouche-value">`
  (`font-medium tabular-nums px-3.5 py-2.5`). `dl > div > dt + dd` est du HTML valide.
  `rows` vide ⇒ pas de `dl` (aucun `dl` vide dans l'arbre).
- `<ng-content />` après le `dl` : le cadre et la barre de titre servent aussi de carte (carte
  d'offre de T4, qui projette son corps et son prix).
- Contrastes du contenu : `text-muted` sur carte 7,63:1 (clair) et 7,37:1 (sombre), calculés.

**`src/app/shared/ui/dimension-line.ts`** — `DimensionLine`, sélecteur `app-dimension-line`.

```ts
readonly label = input.required<string>();
```

- Hôte : `aria-hidden="true"`, `class="flex max-w-120 items-center text-primary"`.
- Gabarit (sept `span`, aucun pseudo-élément, aucun `styles:`) : trait de rappel gauche
  (`h-3.5 border-l border-current`), pointe gauche (`size-0 border-y-4 border-y-transparent
  border-r-8 border-r-current`), ligne (`flex-1 border-t border-current`),
  `<span data-testid="dimension-line-label">` (`shrink-0 px-2 font-mono text-xs font-medium`),
  ligne, pointe droite (`border-l-8`), trait de rappel droit. Les traits sont des **bordures**, pas
  des fonds : elles restent visibles en `forced-colors`. La ligne s'interrompt autour du libellé
  (deux segments `flex-1`) au lieu d'être masquée par un fond : la cote se pose sur n'importe quelle
  surface (fond, carte).
- **Règle d'usage** (dans `DESIGN.md`, vérifiée en revue, non testable en unitaire) : la cote
  est décorative ; son libellé **répète** une information écrite ailleurs dans le texte lisible
  (délai, durée). Cotes réservées aux délais ; au plus un cartouche par écran.

#### V.4 Périmètre : ce qui change visuellement dès cette PR

Le socle est posé et appliqué **globalement par la typographie**, sans refondre aucune page :

1. **Texte courant** de toutes les pages (publiques, blog, admin) : pile système → IBM Plex Sans.
2. **Titres `h1` à `h3`** (y compris ceux de la prose du blog) : Archivo, élargi de 104 à 108 %.
   Tailles, graisses, interlettrages inchangés.
3. **Italique** (`em`, `i`, prose du blog) : vraie italique IBM Plex Sans au lieu de l'italique
   système.
4. **Libellés `font-mono` et `code`** : IBM Plex Mono 500. Les deux `font-mono font-semibold`
   (`home-proof.ts`, `project-card.ts`) s'affichent en 500, sans faux gras.
5. **Boutons** : rayon 8 px → 6 px (`rounded-lg` → `rounded-md`) dans `shared/ui/button.ts`
   (variante non `rounded`) et dans l'`@utility link-btn` de `src/styles.css`. La variante pilule
   reste.
6. **Marque du header** (« Julien Nédellec ») : `font-display` sur le conteneur des deux `span`
   (`header.ts`).

Ne change **pas** : couleurs (palette indigo, ivoire, console inchangées), mises en page,
contenus, cartes existantes (`border-foreground/8` non migré vers `line`), formulaires. Le
`Cartouche` et la `DimensionLine` ne sont rendus **nulle part** dans cette PR : T4 (carte d'offre),
T6 (cartouche « Cadre de travail » et cote du hero) et T7 les consomment.

#### V.5 Fichiers

| Fichier | Action | Rôle |
|---|---|---|
| `public/fonts/archivo-2.001-latin-wdth100-110-wght600-800.woff2` | créer | Archivo, axes réduits |
| `public/fonts/jn-sans-3.201-latin-wght.woff2` | créer | IBM Plex Sans renommée JN Sans, `wght` 400–700 |
| `public/fonts/jn-sans-3.201-latin-wght-italic.woff2` | créer | IBM Plex Sans Italic renommée, `wght` 400–700 |
| `public/fonts/jn-mono-2.3-latin-500.woff2` | créer | IBM Plex Mono 500 renommée JN Mono |
| `public/fonts/OFL-archivo.txt`, `public/fonts/OFL-ibm-plex.txt` | créer | licences OFL 1.1 jointes (`OFL-ibm-plex.txt` : en-tête amont avec le *Reserved Font Name* « Plex », note de modification et de renommage, un seul texte OFL) |
| `src/styles.css` | modifier | `@font-face` (6), tokens `@theme`, `--theme-line*` (2 registres), `@layer base` titres, `link-btn` `rounded-md` |
| `src/index.html` | modifier | `<link rel="preload">` d'Archivo |
| `src/app/shared/ui/button.ts` | modifier | `rounded-lg` → `rounded-md` |
| `src/app/layout/components/header/header.ts` | modifier | `font-display` sur la marque |
| `src/app/shared/ui/cartouche.ts` (+ `.spec.ts`) | créer | primitive cartouche |
| `src/app/shared/ui/dimension-line.ts` (+ `.spec.ts`) | créer | primitive cote |
| `.github/workflows/ci.yml` | modifier | job `verify` : chaque `rel="preload"` de `browser/index.html` pointe un fichier existant du build ; job `docker` : `/fonts/archivo-…woff2` → 200, `content-type: font/woff2` |
| `DESIGN.md` | modifier | § 3 Typographie réécrit (trois familles, rôles, plages de graisse, remplacement de la « System-Stack Rule » et de « Don't charger une Google Font »), § 2 tokens de trait et seuils 3:1, § 5 Cartouche et Cote (API, règles d'usage), boutons `rounded-md` |
| `DESIGN.json` | modifier | miroir : `typography`, règles nommées, `ds-btn-*` `border-radius: 6px` |
| `docs/adr/0006-polices-auto-hebergees.md` | créé | décision d'hébergement |

#### V.6 Critères testables (`qa`) et preuves (verify)

**V1 — hors TDD** (CSS, assets, config : aucun test unitaire ne lit une police calculée en
happy-dom). Non-régression : la suite existante reste verte (aucun test ne dépend de `rounded-lg`
ni d'une famille de police, vérifié par `grep`).

**V2 — `Cartouche`** (hôte de test qui projette du contenu, sur le modèle de
`split-section.spec.ts`) :
- Titre et référence ⇒ `cartouche-title` = titre, `cartouche-reference` = référence ; hôte
  `role="group"` et `aria-label` = titre.
- Référence vide (défaut) ⇒ aucun `cartouche-reference`.
- `it.each` sur 0, 1 et 3 lignes : `cartouche-row` × n ; chaque ligne a exactement un `dt`
  (`cartouche-label` = `label`) et un `dd` (`cartouche-value` = `value`), dans l'ordre des
  données ; les lignes sont les enfants directs de l'unique `dl` ; 0 ligne ⇒ aucun `dl`.
- Contenu projeté rendu dans l'hôte, après le `dl`.

**V3 — `DimensionLine`** :
- Hôte `aria-hidden="true"` ; `dimension-line-label` = `label`.
- L'arbre ne contient aucun élément focalisable ni rôle ARIA (rien n'échappe à `aria-hidden`).

**Preuves verify** (section `## Verify` de la spec, sur `pnpm build` puis l'image Docker locale) :
1. Gates : `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`, `pnpm build`.
2. Assets : `dist/angular-portfolio-app/browser/fonts/` contient les quatre woff2 ; le CSS émis
   contient `url(/fonts/archivo-2.001-latin-wdth100-110-wght600-800.woff2)` non réécrit ; `browser/index.html`
   contient le `preload` et la CSP hachée sans `unsafe-inline` (garde CI existante).
3. CSP : aucune violation dans la console (Browser pane) sur `/`, `/about`, une page d'offre et
   `/blog`, en clair et en sombre ; la `<meta>` CSP de prod est identique à `master` hors hachages.
4. Réseau : les polices viennent de l'origine du site, aucune requête vers un tiers de polices ;
   Archivo est demandée avant le CSS non critique (préchargement), Plex Mono seulement sur les
   pages qui en affichent. **Italique** : `jn-sans-3.201-latin-wght-italic.woff2` absente
   des requêtes de `/` et de l'offre atelier (pages sans `em`, à confirmer par `grep '<em'` dans
   leur HTML prérendu), présente sur un article de blog qui contient de l'italique ; jamais en
   `preload` dans `index.html`.
5. Lighthouse mobile (image Docker locale), mesuré sur `master` puis sur la branche, sur `/`,
   `/about` et l'offre atelier : perf, a11y, SEO **≥ 95** ; CLS ≤ 0,05 ; écart de LCP rapporté.
6. axe : zéro violation sur les mêmes pages **dans les deux registres** (bascule de la classe
   `app-dark` sur `<html>` dans le Browser pane, puis exécution d'axe-core injecté par évaluation
   de script, qui n'est pas soumise à la CSP de la page).
7. Rendu : captures clair et sombre de la home et d'une page d'offre (titres Archivo, texte Plex,
   boutons à 6 px) et d'un article de blog (italique Plex réelle, pas une oblique) ; contrôle visuel des prix à séparateur de milliers (`4 500 €`, U+202F pris dans
   la police de repli) et de la flèche `→` ; aucun décalage visible au chargement (repli ajusté).
   `Cartouche` et `DimensionLine` ne sont pas atteignables en production dans cette PR : leur
   preuve est la suite unitaire (V2, V3), leur rendu réel arrive avec T6.

#### V.7 Risques & inconnues

- CSS critique (beasties) : si les `@font-face` de Plex ne sont pas dans le CSS inliné, Plex Sans
  n'est découverte qu'au chargement de la feuille complète ; le repli ajusté limite le CLS, mais
  la mesure verify 5 tranche. Si le CLS dépasse 0,05, précharger aussi Plex Sans (36 Ko).
- Primitives livrées sans consommateur jusqu'à T4/T6 : `knip` les signalera ; accepté et tracé
  ici, la prochaine tranche consommatrice lève le signal.
- Repli calculé contre Arial : Android n'a pas Arial (repli sur Roboto, métriques différentes),
  l'ajustement y est approximatif ; le lab Lighthouse (desktop Chrome) ne le voit pas.
  `ci.yml` est aussi modifié par T2 : rebaser l'une sur l'autre (conflit attendu, trivial).

#### V.8 Questions pour Julien (tranchées le 2026-10-04)

1. **Trait du cartouche** : discret, comme la maquette (`line-strong` 22 % / 28 %, environ 1,8:1),
   décoratif, jamais seul porteur d'information. Plan inchangé.
2. **Boutons à 6 px et marque du header en display** : dans cette PR. Plan inchangé.
3. **Italique** : vraie italique IBM Plex Sans livrée (même source Fontsource, même instancer,
   `wght` 400–700, licence OFL jointe), sans préchargement, téléchargée seulement sur les pages qui
   en contiennent. Intégré en V.1, V.2, V.4, V.5, V.6 et dans ADR-0006.
4. **Admin** : la nouvelle typographie s'applique partout, admin compris. Plan inchangé.

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
  `offer-catalogue.ts`, `offer-card.ts`, `offer-row.ts`, `offer.routes.ts` (route `''`),
  `offer-seo.ts` (`toOfferCatalogueSeo`), `app.routes.server.ts`, sitemap, `DESIGN.md` (carte et
  ligne d'offre).
  - `groupOffersByFamily` : ordre Sites puis Applications, ordre interne de `OFFERS` conservé,
    famille vide omise (test pur, sans TestBed).
  - La page rend un `h1` et son accroche, deux sections `section[aria-labelledby]` (« Sites »,
    « Applications ») avec leur accroche ; Sites en `offer-card` × 2 (`Cartouche` : nom, public,
    `priceTeaser`, lien), Applications en `offer-row` × 3 (nom, promesse, `priceTeaser`, lien
    unique) ; chaque lien a `href` = `offerPath(slug)` (décisions de Julien, maquette).
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
  la maquette v2). **Plan détaillé : « Tranche V — plan détaillé » ci-dessus, ADR-0006.** Une PR,
  partie de `master` ; prérequis de T4, T6 et T7 (qui consomment `Cartouche` et `DimensionLine`),
  indépendante de T2, T3, T5, T9. Trois sous-tranches dans la même PR :
  - **V1 — typographie et tokens** (CSS et assets, hors TDD, prouvée en verify) : polices
    auto-hébergées, `@font-face`, `@theme` (`--font-display`/`--font-sans`/`--font-mono`,
    `--color-line`/`--color-line-strong`), base titres, boutons `rounded-md`, marque du header,
    garde CI du préchargement, `DESIGN.md`/`DESIGN.json`.
  - **V2 — `Cartouche`** : titre, référence optionnelle, `dl` de lignes `dt`/`dd`, contenu
    projeté, groupe nommé.
  - **V3 — `DimensionLine`** : cote `aria-hidden`, libellé décoratif.

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

### Tranche 4 — la page catalogue `/offres`

Sweep de contrat (fil d'Ariane à trois niveaux, route `''` ajoutée à `OFFER_ROUTES`) sur tout
`src/` : `BreadcrumbList`, `position: 2`, `OFFER_ROUTES`, `toOfferSeo`, `'/offres'`. Suites
impactées et **adaptées dans ce RED** (pas de test parallèle) : `offer-seo.spec.ts` (golden atelier
et repli du fil d'Ariane, désormais Accueil → Offres → offre) et `offer.routes.spec.ts` (le test
« une route par offre » devient « catalogue puis une route par offre »). Vertes par construction :
le test « titre et SEO » de `offer.routes.spec.ts` compare à `toOfferSeo(…)` et suit seul ;
`app.routes.about.spec.ts` (fil d'Ariane de `/about`, hors offres) ; `app.routes.spec.ts` (route
`offres` en `loadChildren`, atelier servi : la route `''` ne doit pas capturer
`/offres/site-atelier`, ce test le garde) ; `footer.spec.ts` (atelier seul, T8). Aucun état seedé
dont la sémantique change.

Contrats fixés par ce RED :

- `OFFER_FAMILY_LABELS` (dans `offer-catalog.static-data.ts`) : golden `{ sites: 'Sites',
  applications: 'Applications' }`.
- `groupOffersByFamily(offers)` (`domain/group-offers-by-family.ts`) rend
  `readonly { family; offers }[]` : `sites` puis `applications`, ordre d'entrée conservé dans
  chaque famille, famille vide omise, `[]` pour une entrée vide, mêmes références de résumés.
- Présentation par famille (décision Julien du 2026-10-04, conforme à la maquette) : la famille
  décide du rendu, pas un champ d'offre. Sites = 2 `offer-card`, Applications = 3 `offer-row`,
  aucune carte chez les Applications ni ligne chez les Sites.
- `OfferCard` réutilise `Cartouche` (plan V.3) : dans chaque `offer-card`, `cartouche-title` =
  `summary.name`, `cartouche-reference` = `summary.audience` ; corps projeté : `offer-card-price`
  = `summary.priceTeaser`, `offer-card-link` = `A`, `href` = `offerPath(slug)`, nom accessible non
  vide. Le testid `offer-card` est sur l'élément qui contient le cartouche (hôte de `OfferCard` ou
  `app-cartouche`, au choix du GREEN).
- `OfferRow` (`application/components/offer-row.ts`, dumb) : dans chaque `offer-row`,
  `offer-row-name` = `summary.name`, `offer-row-promise` = `summary.promise`, `offer-row-price` =
  `summary.priceTeaser`, tous trois **à l'intérieur** de l'unique `A` de la ligne
  (`offer-row-link`, `href` = `offerPath(slug)`, texte non vide) : toute la ligne est cliquable par
  ce seul lien. Aucun lien imbriqué dans la page.
- `OFFER_FAMILY_LEADS` (dans `offer-catalog.static-data.ts`, à côté de `OFFER_FAMILY_LABELS`) :
  golden `{ sites: 'Pour être trouvé sur Google et convaincre en trente secondes.', applications:
  'Pour remplacer un tableur, outiller une équipe ou reprendre un existant.' }` ; rendu dans la
  section de sa famille sous le testid `offer-family-lead` (un par section, texte = la constante).
- `OfferCatalogue` sans `input()` : un seul `h1` = « Cinq offres, un tarif annoncé avant de
  commencer. », suivi de `offer-catalogue-lead` = « Un site pour être trouvé, ou une application
  pour travailler mieux. Chaque offre précise ce qui est livré, en combien de temps et à quel
  prix. » ; une
  `section[aria-labelledby]` par famille, reliée à un `H2` = `OFFER_FAMILY_LABELS[family]`, ids
  distincts ; mention TVA `offer-vat-mention` = `SITE_IDENTITY.business.vatMention` ; ni `main`,
  ni `header`, ni `footer`.
- Route `''` de `OFFER_ROUTES`, en tête : pas de `component`, `loadComponent` → `OfferCatalogue`,
  `data` à la seule clé `seo` = `toOfferCatalogueSeo(OFFERS)`, `title` = `seo.title`.
- `toOfferCatalogueSeo(offers)` : `url` = `siteUrl + '/offres'`, `type: 'website'`, `title` =
  « Offres et tarifs, sites et applications web | Julien Nédellec », `description` = `` `Sites
  en 7 jours dès ${formatEur(OFFER_PRICES['site-atelier'].creationEur)}, application métier
  dès ${formatEur(OFFER_PRICES['application-metier'].projectFromEur)}, refonte, maintenance et
  renfort Angular. Prix annoncé avant de commencer.` `` (≤ 160 caractères, sans `—` ; « Sites » et non « Site vitrine » : 690 € est le prix de l'atelier) ;
  `@graph` = `[CollectionPage, BreadcrumbList]` (dans cet ordre, `@context` schema.org) ;
  `CollectionPage.name` = le `h1`, `CollectionPage.url` = URL du catalogue, `mainEntity` =
  `ItemList` dont `itemListElement` = `{ '@type': 'ListItem',
  position, name: summary.name, url: siteUrl + offerPath(slug) }` pour chaque offre reçue, dans
  l'ordre ; fil d'Ariane Accueil → Offres (`item` = URL du catalogue).
- `toOfferSeo` : `BreadcrumbList` Accueil (1, `siteUrl`) → Offres (2, `siteUrl + '/offres'`) →
  offre (3, `breadcrumbName ?? name`, URL de l'offre).
- `serverRoutes` : `offres` en `Prerender`.

**`domain/group-offers-by-family.spec.ts`** (TS pur, 6 tests, nouveau)

| Test | Scénario | Assertions clés |
|---|---|---|
| catalogue groupé | `OFFERS` | `toEqual` [sites : vitrine, atelier ; applications : métier, refonte, renfort] |
| sites d'abord | builders entrelacés app, site, app, site | `[['sites', [Site A, Site B]], ['applications', [App A, App B]]]` |
| famille vide omise (`it.each` sites, applications) | deux offres d'une seule famille | familles = `[présente]` ; offres = l'entrée |
| entrée vide | `[]` | `[]` |
| références conservées | `OFFERS` | première offre des sites `toBe` le résumé vitrine |

**`domain/offer-catalog.static-data.spec.ts`** (+2 tests) : goldens de `OFFER_FAMILY_LABELS` et de
`OFFER_FAMILY_LEADS`.

**`offer-seo.spec.ts`** (2 tests adaptés, +6 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| golden atelier (adapté) | `toOfferSeo(atelier)` | fil d'Ariane à trois `ListItem` : Accueil, Offres, « Sites pour ateliers » |
| repli fil d'Ariane (adapté) | builder sans `breadcrumbName` | trois `ListItem`, le dernier nommé `summary.name` |
| page du catalogue | `toOfferCatalogueSeo(OFFERS)` | `url`, `website`, titre et description validés (égalité, montants via `formatEur(OFFER_PRICES…)`), types du `@graph`, `@context` |
| snippet | idem | 0 < longueur ≤ 160, aucun `—` |
| `CollectionPage` | idem | `name` = le `h1`, `url` = catalogue, `mainEntity['@type']` = `ItemList` |
| liste des offres | idem | `itemListElement` `toEqual` les cinq `ListItem` (position, nom, URL) |
| dérivée de l'argument | deux résumés de builder | deux `ListItem` exactement, dans l'ordre reçu |
| fil d'Ariane | idem | Accueil → Offres |

**`offer.routes.spec.ts`** (1 test adapté, +2 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| routes (adapté) | `OFFER_ROUTES` | `path` = `['', ...slugs]` |
| catalogue lazy | route `''` | pas de `component` ; `loadComponent()` → `OfferCatalogue` |
| catalogue : titre et SEO | route `''` | clés de `data` = `['seo']` ; `seo` `toEqual` `toOfferCatalogueSeo(OFFERS)` ; `title` = `seo.title` |

**`src/app/app.routes.spec.ts`** (+1 test) : `navigateByUrl('/offres')` ⇒ `router.url` = `/offres`,
composant de la feuille = `OfferCatalogue`, `data.seo` `toEqual` `toOfferCatalogueSeo(OFFERS)`.

**`src/app/app.routes.server.spec.ts`** (+1 test) : `offres` en `RenderMode.Prerender`.

**`application/offer-catalogue.spec.ts`** (TestBed, `provideRouter` des cinq chemins d'offre vers
une page vide, 23 tests, nouveau ; `OfferCard` et `OfferRow` sans spec isolé, dumb, couverts ici)

| Test | Scénario | Assertions clés |
|---|---|---|
| h1 unique | rendu | un seul `h1` = « Cinq offres, un tarif annoncé avant de commencer. » |
| accroche du catalogue | rendu | `offer-catalogue-lead` après le `h1` (`DOCUMENT_POSITION_FOLLOWING`), texte exact |
| accroche de famille | sections | un `offer-family-lead` par section = `OFFER_FAMILY_LEADS.sites` puis `.applications` |
| landmarks | rendu | aucun `main`, `header`, `footer` |
| familles | sections | `section[aria-labelledby]` → `H2` « Sites » puis « Applications » ; deux ids distincts |
| cartes et lignes par famille | sections | Sites : cartes [vitrine, atelier], aucune ligne ; Applications : lignes [métier, refonte, renfort], aucune carte (atelier présent, contrairement à la home) |
| contenu de carte (`describe.each` × 2 sites) | carte nommée `summary.name` | `cartouche-reference` = `audience` ; `offer-card-price` = `priceTeaser` (égalité) |
| lien de carte (× 2) | idem | `offer-card-link` est un `A`, `href` = `offerPath(slug)`, nom non vide |
| clic de carte (× 2) | clic sur le lien | `router.url` = `offerPath(slug)` |
| contenu de ligne (`describe.each` × 3 applications) | ligne nommée `summary.name` | `offer-row-promise` = `promise` ; `offer-row-price` = `priceTeaser` |
| ligne = un seul lien (× 3) | idem | un seul `a` dans la ligne = `offer-row-link`, `href` = `offerPath(slug)` ; nom, promesse et prix contenus dans le lien ; texte non vide |
| clic de ligne (× 3) | clic sur le lien | `router.url` = `offerPath(slug)` |
| pas de lien imbriqué | rendu | aucun `a a` |
| TVA | rendu | `offer-vat-mention` = `SITE_IDENTITY.business.vatMention` |

Hors Vitest (verify) : sitemap régénéré (non commité) avec `/offres` à 0.8 ;
`browser/offres/index.html` prérendu avec un `h1` et les cinq liens ; `DESIGN.md` (carte d'offre).

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-04 16:14, 38 failed / 864 total ; repris après les décisions de Julien sur la
présentation par famille et la copy). Nature des échecs : sur l'arbre réel, `pnpm test` (après
`ng cache clean` et purge de `node_modules/.vite`) s'arrête à la compilation, uniquement sur les
symboles applicatifs à créer au GREEN (`TS2307` / `Could not resolve` :
`domain/group-offers-by-family`, `application/offer-catalogue` ; `TS2305` : `OFFER_FAMILY_LABELS`,
`toOfferCatalogueSeo`) et leur cascade (`TS7031` dans `group-offers-by-family.spec.ts`) ; aucune
faute de type propre aux specs, prettier et eslint verts sur les sept fichiers. Mesure du rouge
comportemental : scaffolds vides posés le temps d'une exécution puis retirés
(`groupOffersByFamily` → `[]`, libellés vides, `toOfferCatalogueSeo` → titre et description
factices, `OfferCatalogue` au gabarit vide, `OFFER_ROUTES` et `serverRoutes` inchangés) : 96
fichiers, 38 failed / 864 total, les 38 en `AssertionError` (35 nouveaux tests, 3 tests adaptés).
Trois nouveaux tests sont verts sous ce scaffold, par nature : « aucun landmark », « aucun lien
imbriqué » (invariants) et « entrée vide ⇒ `[]` ». Harnais vérifié : sous une implémentation
jetable (retirée), les 21 tests de `offer-catalogue.spec.ts` passent (cartes `Cartouche` et lignes
à lien unique) ; navigation `/offres` vérifiée au tour précédent, `/offres/site-atelier` reste
servi. Non-régression : base avant RED 826 passed / 826 ; sous scaffold 826 passed = 826 − 3
adaptés + 3 nouveaux verts, aucun test préexistant ne tombe.
Delta après GREEN (décisions de Julien du 2026-10-04 : description SEO corrigée, accroches de la
maquette ; la référence du `Cartouche` passe sous le titre, point visuel prouvé en verify,
`cartouche.spec.ts` ne dépend pas de la disposition) : RED confirmé via la commande test du profil
le 2026-10-04 16:33, 4 failed / 867 total. Sur l'arbre réel, la compilation échoue uniquement sur
`OFFER_FAMILY_LEADS` (`TS2724`, scaffold dû au GREEN). Avec ce seul symbole posé à vide le temps
d'une exécution puis retiré (fichier restauré à l'octet près, `cmp`) : 4 failed / 867 total, tous
en `AssertionError` (description SEO adaptée, golden `OFFER_FAMILY_LEADS`, accroche du catalogue,
accroches de famille). Non-régression : 863 passed = 864 du GREEN − 1 test adapté. Typographie :
aucun des textes épinglés ne contient `: ; ? !`.
Scaffold dû au GREEN (delta) : `OFFER_FAMILY_LEADS` dans `offer-catalog.static-data.ts`, rendu de
`offer-catalogue-lead` et `offer-family-lead` dans `offer-catalogue.ts`, description de
`toOfferCatalogueSeo`.
Scaffold dû au GREEN : `domain/group-offers-by-family.ts` (`groupOffersByFamily`),
`offer-catalog.static-data.ts` (`OFFER_FAMILY_LABELS`), `offer-seo.ts` (`toOfferCatalogueSeo`, fil
d'Ariane à trois niveaux), `application/offer-catalogue.ts` (`OfferCatalogue`),
`application/components/offer-card.ts` (`OfferCard`), `application/components/offer-row.ts`
(`OfferRow`), `offer.routes.ts` (route `''`),
`app.routes.server.ts` (`offres`).

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

### Tranche V — socle visuel « dessin technique » (V2 `Cartouche`, V3 `DimensionLine`)

V1 (polices, tokens `@theme`, `@layer base`, rayon des boutons, préchargement) est **hors TDD**
comme le prescrit le plan : aucun test unitaire ajouté. Non-régression V1 vérifiée par `grep` :
aucune spec ne mentionne `rounded-lg`, `rounded-md`, `font-family`, `font-display` ni
`font-mono`. Aucune suite existante impactée (primitives neuves, sans consommateur) : pas
d'adaptation, pas de sweep de contrat.

Contrats fixés par ce RED :

- `CartoucheRow` exporté par `shared/ui/cartouche.ts` (`{ readonly label; readonly value }`).
- `reference` à défaut `''` : `Cartouche` monté seul avec le seul `title` ne rend pas de
  `cartouche-reference`.
- Le titre et le `aria-label` de l'hôte suivent un changement de `title` (réactivité).
- Le contenu projeté est rendu même sans ligne (`rows` vide), et hors du `dl` quand il existe.
- `DimensionLine` : l'hôte ne porte ni `tabindex` ni `role` ; aucun descendant focalisable ni
  `[role]`.

**`src/app/shared/ui/cartouche.spec.ts`** (TestBed, hôte de test à signaux qui projette un
`<p data-testid="projected">`, 9 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| titre + référence, groupe nommé | `title` « Cadre de travail », `reference` « RÉF. 009 » | `cartouche-title` = `['Cadre de travail']`, `cartouche-reference` = `['RÉF. 009']` ; hôte `role="group"`, `aria-label` = titre |
| titre en paragraphe | titre seul | `cartouche-title` est un `P` ; aucun `h1`–`h6` dans le cartouche |
| référence par défaut | `Cartouche` seul, `setInput('title')` | aucun `cartouche-reference` ; titre rendu |
| réactivité du titre | `title` → « Délais » | `cartouche-title` = « Délais », `aria-label` = « Délais » |
| lignes (`it.each` 1, 3) | `rows` de n entrées | un seul `dl` ; `cartouche-row` × n = enfants directs du `dl` ; chaque ligne = `[DT, DD]` (`cartouche-label`, `cartouche-value`) aux textes `label`/`value`, dans l'ordre |
| 0 ligne | `rows: []` | titre rendu ; aucun `dl`, `cartouche-row`, `cartouche-label`, `cartouche-value` |
| contenu projeté après le `dl` | 2 lignes | `projected` = « Corps projeté », dans l'hôte, `DOCUMENT_POSITION_FOLLOWING` par rapport au `dl`, hors du `dl` |
| contenu projeté sans ligne | `rows: []` | `projected` = « Corps projeté » dans l'hôte |

**`src/app/shared/ui/dimension-line.spec.ts`** (TestBed, `setInput('label')`, 4 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| hôte masqué + libellé (`it.each` « 7 jours », « 3 semaines ») | libellé posé | hôte `aria-hidden="true"` ; `dimension-line-label` = `[label]` |
| réactivité du libellé | `label` → « 10 jours » | `dimension-line-label` = `['10 jours']` |
| rien n'échappe au masquage | « 7 jours » | libellé rendu ; aucun `a[href]`, `button`, champ, `iframe`, `summary`, `[tabindex]`, `[contenteditable]`, `[role]` ; hôte sans `tabindex` ni `role` |

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-04 14:03, 13 failed / 716 total). Nature des échecs : `pnpm test` sur l'arbre réel
échoue à la compilation uniquement sur les deux modules applicatifs à créer au GREEN (`TS2307` /
`Could not resolve` `./cartouche` et `./dimension-line`, et `NG1010` en cascade sur
`imports: [Cartouche]` de l'hôte de test) ; aucune faute de type ni de format propre aux specs
(`eslint` et `prettier --check` verts sur les deux fichiers). Chiffrage pris avec des stubs vides
temporaires (inputs du plan, template vide, retirés ensuite) : 13 échecs, tous des
`AssertionError` (`expected null to be 'true'`, `expected [] to deeply equal [ '7 jours' ]`,
`expected undefined to be 'P'`…). Non-régression : 87 autres fichiers, 703 passed / 703.
Scaffold dû au GREEN : `src/app/shared/ui/cartouche.ts` (`Cartouche`, `CartoucheRow`) et
`src/app/shared/ui/dimension-line.ts` (`DimensionLine`).

### Tranche 6 — la home commerciale : hero et offres

**Copy validée par Julien (2026-10-04)**, épinglée en golden sur les constantes :

- h1 (`STATIC_HERO.headline`) : « Des sites et des applications web, livrés en production par un
  seul interlocuteur. »
- lead (`STATIC_HERO.lead`) : « Vingt ans d'industrie, aujourd'hui développeur full-stack. Je
  cadre, je construis, je mets en ligne et je maintiens. Vous savez ce que vous payez et quand
  c'est livré. »
- CTA : `hero-cta-contact` « Décrire mon projet », `hero-cta-offers` « Voir les offres et les
  prix ».
- `SITE_IDENTITY.availability` : « Disponible pour de nouveaux projets, démarrage sous 2
  semaines ».
- Cartouche : « Cadre de travail », « réf. JN-2026 » ; Interlocuteur → « Un seul, du devis à la
  maintenance » ; Site vitrine → « 7 jours, prix fixe » ; Application → « Devis ferme après
  cadrage » ; Propriété → « Code et domaine à votre nom » ; Tolérance prix → « ±⍽0⍽€ hors avenant
  signé » (U+00A0 après `±` et avant `€`).
- Cote : « de la demande à la mise en ligne ».
- h2 des offres de la home : « Ce que je peux faire pour vous. ».
- Lien `home-offers-catalogue-link` (`HOME_OFFERS_CATALOGUE_LINK`) : « Voir toutes les offres et
  leurs prix ».
- Route `''` : `title` et `seo.title` « Julien Nédellec | Sites et applications web, Yvelines » ;
  `seo.description` « Sites et applications web livrés en production par un seul
  interlocuteur⍽: site vitrine en 7 jours, application sur mesure, maintenance. Yvelines et à
  distance. » (U+00A0 avant `:`, 160 caractères mesurés).
- Accent du h1 : « livrés en production » dans un `em` (couleur primaire), segment unique ; le
  surlignage Angular/NestJS disparaît.
- Relevé technique (`proofs`) retiré du premier écran ; la section `home-proof` (pipeline) reste
  inchangée (T7).

Sweeps. Contrat modifié (CTA du hero, disponibilité, h1/lead, JSON-LD home) : `grep` sur `src/`,
`scripts/`, `.github/` de `hero-cta-projects`, `home_hero_projects`, `Voir les projets`,
`hero-keyword`, `Disponible en freelance`, `jobTitle`, `Je livre des applications`,
`STATIC_HERO`, `availability`. Suites adaptées dans ce RED : `home-hero-section.spec.ts` (les
4 tests du CTA projets et de la disponibilité-lien Malt remplacés, pas doublés) ; `home-hero.spec.ts`
(test « Angular et NestJS surlignés » **retiré** : la copy validée ne contient plus de mot-clé,
le cas n'existe plus) ; `home.spec.ts` (harnais `renderHomeTemplate` : paramètre `overrides` de
bundle, construction d'entrée seulement). Vertes par construction : `http-analytics.gateway.spec.ts`
(`home_hero_projects` y est une donnée d'exemple du gateway générique, pas le contrat du hero) ;
`in-memory-home.gateway.spec.ts` (compare à `STATIC_HERO`, suit la constante) ; `home-hero.spec.ts`
h1/lead (comparent à `STATIC_HERO`) et h1 sans `animate-` (invariant #152, conservé) ;
`app.routes.spec.ts`, `app.routes.about.spec.ts` (hors home). États seedés : seul consommateur de
`SITE_IDENTITY.availability` = le hero (aucun autre seed impacté). Typographie : les trois
nouvelles constantes ajoutées à `editorial-typography.spec.ts`.

Contrats fixés par ce RED :

- `src/app/features/home/domain/home-hero.static-data.ts` (domaine pur, imports relatifs) :
  `HOME_HERO_CTA_LABELS = { contact, offers }` ; `HOME_WORK_FRAME = { title, reference, rows:
  readonly { label; value }[], dimension }` (forme compatible `CartoucheRow`, sans importer
  `@shared`).
- `src/app/features/home/domain/home-offers.static-data.ts` : `HOME_OFFERS_HEADING`,
  `HOME_OFFERS_CATALOGUE_LINK`.
- `HomeHero` rendu avec `STATIC_HERO` : texte du h1 = `headline` (inchangé), exactement un `em`
  dans `hero-headline`, de texte « livrés en production » ; h1 sans classe `animate-`. La source
  de l'accent (champ de `HeroData` ou découpe dans le composant) est laissée au GREEN ;
  recommandation : donnée, pas littéral de template.
- Premier écran sans relevé technique : dans `HomeHeroSection`, l'unique `dl` est celui du
  cartouche `hero-work-frame`. Le retrait de `HeroData.proofs`/`STATIC_HERO.proofs` est laissé au
  GREEN ; s'il a lieu, le littéral `proofs: []` du builder local de `home.spec.ts` s'adapte
  mécaniquement (aucune valeur attendue).
- `STATIC_HERO.headline`/`lead` portent la copy validée (`home.static-data.ts`, données du
  `HomeGateway`).
- `HomeHeroSection` : `hero-cta-contact` (bouton, ou hôte contenant un `button`) au texte
  `HOME_HERO_CTA_LABELS.contact` ; clic ⇒ `SectionScroller.scrollTo('contact')` × 1 et
  `trackCtaClick('home_hero_contact', label)` × 1. `hero-cta-offers` = `A`, `href="/offres"`
  (`routerLink`), texte = `HOME_HERO_CTA_LABELS.offers` ; clic ⇒ `router.url` = `/offres` et
  `trackCtaClick('home_hero_offers', label)`. `hero-availability` = `SITE_IDENTITY.availability`,
  ni dans ni contenant un `a`. Cartouche : `hero-work-frame` = hôte `Cartouche` (`role="group"`,
  `aria-label` = titre), `cartouche-title`/`cartouche-reference`/lignes = `HOME_WORK_FRAME` ;
  `hero-work-frame-dimension` = hôte `DimensionLine` (`aria-hidden="true"`,
  `dimension-line-label` = `HOME_WORK_FRAME.dimension`).
- `src/app/features/home/application/home-offers.ts` (`HomeOffers`, sans `input()`) :
  `home-offers` = `SECTION` `aria-labelledby` → `H2` = `HOME_OFFERS_HEADING` ; une
  `home-offers-family` par famille (Sites puis Applications) titrée par un `H3` =
  `OFFER_FAMILY_LABELS[famille]` ; offres `featuredOnHome` seules, dans l'ordre de `OFFERS`
  (atelier absent) ; Sites en `offer-card` (`OfferCard`), Applications en `offer-row` (`OfferRow`) ;
  `home-offers-catalogue-link` = `A`, `href="/offres"`, texte = `HOME_OFFERS_CATALOGUE_LINK` ;
  aucun landmark.
- `Home` : `HomeOffers` rendu **eager** (présent sans déclencher aucun `@defer`), un seul `h1` ;
  ordre DOM `hero-headline` → `home-offers` → `home-proof-pipeline` →
  `home-projects-placeholder` → `home-contact-placeholder` ; aucun texte « CDI » une fois les
  deux blocs différés rendus avec `STATIC_HERO`.
- `toOfferCatalogJsonLd(offers): Record<string, unknown>` (`offer-seo.ts`) : `{ '@type':
  'OfferCatalog', name: 'Offres', url: siteUrl + '/offres', itemListElement: offers.map(s => ({
  '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: siteUrl +
  offerPath(s.slug) } })) }`, dérivé de l'argument.
- Route `''` : `title` = `seo.title` = la copy validée ; `seo.description` golden ; 1–160 caractères, sans `—` ; aucune occurrence de « CDI » dans
  tout `seo` (titre, description, mots-clés, JSON-LD) ; `structuredData` = `@context`
  schema.org + `@graph` `[Person, ProfessionalService]` ; `Person` `name` « Julien Nédellec »,
  `url` = `siteUrl` ; `ProfessionalService.areaServed` nommés `['Yvelines', 'Île-de-France',
  'France']`, `address` `addressLocality` = `SITE_IDENTITY.location`, `addressCountry` `FR`,
  `hasOfferCatalog` `toEqual` `toOfferCatalogJsonLd(OFFERS)`.

| Fichier | Tests |
|---|---|
| `features/home/domain/home-hero.static-data.spec.ts` (2, nouveau) | goldens `HOME_HERO_CTA_LABELS` et `HOME_WORK_FRAME` |
| `features/home/infra/data/home.static-data.spec.ts` (2, nouveau) | goldens `STATIC_HERO.headline` et `.lead` |
| `shared/identity/site-identity.static-data.spec.ts` (+1) | golden `availability` |
| `features/home/application/home-hero-section.spec.ts` (12, réécrit : 4 anciens retirés) | unique `dl` du premier écran = cartouche ; CTA contact : texte, `scrollTo('contact')` × 1, analytics `home_hero_contact` ; CTA offres : `A` `href="/offres"` + texte, clic ⇒ `router.url` `/offres`, analytics `home_hero_offers` ; disponibilité en texte, hors lien ; cartouche : groupe nommé, titre + référence, lignes `toEqual` `HOME_WORK_FRAME.rows` ; cote `aria-hidden` + libellé |
| `features/home/application/home-hero.spec.ts` (−2, +1) | tests des mots-clés surlignés et du relevé de quatre preuves retirés (cas disparus) ; accent unique `em` « livrés en production » |
| `features/home/application/home-offers.spec.ts` (15, nouveau ; `OfferCard`/`OfferRow` sans spec isolé) | section + `H2` ; offres = `featuredOnHome` dans l'ordre ; familles `H3` Sites puis Applications ; cartes (vitrine) vs lignes (métier, refonte, renfort) ; `describe.each` × 4 offres : `href` = `offerPath(slug)` et clic ⇒ `router.url` ; lien catalogue `href` + clic ; aucun landmark |
| `features/home/application/home.spec.ts` (+3) | offres eager + h1 unique ; ordre DOM ; aucun « CDI » |
| `app.routes.home.spec.ts` (9, nouveau) | `title`/`seo.title` et description goldens ; snippet ≤ 160 sans `—` ; aucun CDI dans `seo` ; `@graph` `[Person, ProfessionalService]` ; Person ; `areaServed` ; `address` ; `hasOfferCatalog` |
| `features/offer/offer-seo.spec.ts` (+3) | `toOfferCatalogJsonLd` : type, nom, URL ; cinq `Offer`/`Service` en ordre ; dérivé de l'argument (builders) |
| `editorial-typography.spec.ts` (+4) | `HOME_HERO_CTA_LABELS`, `HOME_WORK_FRAME`, `HOME_OFFERS_HEADING`, `HOME_OFFERS_CATALOGUE_LINK` |

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil
le 2026-10-04 17:10, 43 failed / 943 total). Nature des échecs : sur l'arbre réel, `pnpm test`
(après `ng cache clean` et purge de `node_modules/.vite`) s'arrête à la compilation, uniquement
sur les symboles applicatifs à créer au GREEN (`TS2307` / `Could not resolve` :
`home/domain/home-hero.static-data`, `home/domain/home-offers.static-data`,
`home/application/home-offers` ; `TS2724` : `toOfferCatalogJsonLd`) ; aucune faute de type propre
aux specs, prettier et eslint verts sur les dix fichiers, aucun hit du pattern d'archéologie.
Mesure du rouge comportemental : scaffolds vides posés le temps d'une exécution puis retirés
(constantes vides, `HomeOffers` au gabarit vide non branché, `toOfferCatalogJsonLd` factice ;
`offer-seo.ts` restauré à l'octet près) : 101 fichiers, 43 failed / 943 total, les 43 en
`AssertionError`. Quatre nouveaux tests verts sous scaffold, par nature : « aucun landmark » de
`HomeOffers` et les trois cas typographiques (invariants qui jugeront la vraie copy). Harnais
vérifié : sous une implémentation jetable (retirée, `home.ts` et `home-hero-section.ts` restaurés
par `git checkout`), les 41 tests de `home-hero-section`, `home-offers` et `home.spec` passent,
hormis la disponibilité volontairement fausse du jetable. Non-régression : base avant RED 901
passed / 901 ; sous scaffold 900 passed = 901 − 5 retirés/remplacés + 4 nouveaux verts, aucun test
préexistant ne tombe (h1 sans animation compris).
Delta après les décisions de Julien du 2026-10-04 (copy du lien catalogue, titre et description
SEO de la home, accent `em`, relevé retiré du hero) : RED confirmé via la commande test du profil
le 2026-10-04 17:14, 47 failed / 947 total. Sur l'arbre réel, mêmes erreurs de compilation, toutes
sur les symboles à créer (dont `HOME_OFFERS_CATALOGUE_LINK`). Sous les mêmes scaffolds vides
(retirés, `offer-seo.ts` restauré, `git status` sans fichier applicatif) : 47 failed, tous en
`AssertionError` = 43 + 4 nouveaux (accent `em`, unique `dl`, titre, description) ; le golden du
lien catalogue est porté par un test existant de `home-offers.spec.ts`. Non-régression : 900
passed = 900 − 1 (relevé de preuves retiré) + 1 (nouveau cas typographique, vert par nature) ;
h1 sans animation toujours vert. Hors Vitest, verify (implémenteur) : les meta par défaut de
`src/index.html` (`description`, `og:description`) ne contiennent plus « CDI ».
Complément demandé par la revue (après GREEN) dans `home-offers.spec.ts` (+2) : « accroche par
famille » (dans chaque `home-offers-family`, un `home-offers-family-lead` = `OFFER_FAMILY_LEADS
[family]`, Sites puis Applications) et « mention TVA » (`home-offers-vat-mention` =
`SITE_IDENTITY.business.vatMention`, mention légale : son retrait doit casser la suite).
Volontairement omis, faute de copy validée par Julien : l'eyebrow de la maquette au-dessus du h1
(« Développeur web indépendant · Yvelines et à distance ») et un lead sous le h2 des offres ; aucun
test ne les exige. RED confirmé via la commande test du profil le 2026-10-04 17:36, 2 failed / 949
total, tous deux en `AssertionError` (`expected [ [], [] ] to deeply equal …`, `expected '' to be
'TVA non applicable, art. 293 B du CGI'`) ; compilation, prettier et eslint verts (testids
absents de `home-offers.ts`, aucun symbole nouveau). Non-régression : 947 passed, le reste de la
suite vert après GREEN.
Scaffold dû au GREEN (complément) : `home-offers.ts` (rendu des accroches de famille et de la
mention TVA).
Scaffold dû au GREEN : `features/home/domain/home-hero.static-data.ts` (`HOME_HERO_CTA_LABELS`,
`HOME_WORK_FRAME`), `features/home/domain/home-offers.static-data.ts` (`HOME_OFFERS_HEADING`,
`HOME_OFFERS_CATALOGUE_LINK`), `home-hero.ts` (accent `em`, relevé retiré),
`features/home/application/home-offers.ts` (`HomeOffers`), `offer-seo.ts`
(`toOfferCatalogJsonLd`), `home.static-data.ts` (copy), `site-identity.static-data.ts`
(`availability`), `home-hero-section.ts`, `home.ts`, `app.routes.ts` (SEO home).

## Journal des tranches

- **Tranche 1 — l'offre atelier sur le modèle générique** : GREEN 701 passed / 701 total · refactor : aucun
- **Tranche 2 — l'atelier à son URL de catalogue, l'ancienne redirige** : GREEN 711 passed / 711 total · refactor : aucun (passe manuelle sur le diff ; server route écrite `${OFFERS_BASE_PATH}/${slug}` plutôt que de retailler `offerPath`)
- **Tranche 3 — les quatre nouvelles offres** : GREEN 804 passed / 804 total · refactor : zone servie de `toOfferSeo` factorisée (régions communes, France ajoutée pour la famille `applications`) ; id d'étape « audit » renommé `inspect` (collision avec la ligne de prix « audit » de la même page)
- **Tranche 4 — la page catalogue `/offres`** : GREEN 867 passed / 867 total (reprise : accroches, description SEO, référence du cartouche empilée ; 864 au premier passage) · refactor : aucun (passe manuelle sur le diff, `simplify` non invoqué ; fil d'Ariane factorisé dès l'écriture en `HOME_CRUMB`/`CATALOGUE_CRUMB`, partagés par `toOfferSeo` et `toOfferCatalogueSeo`)
- **Tranche 5 — la page Parcours et le bloc « Vous recrutez ? »** : GREEN 698 passed / 698 total · refactor : liens du bloc passés sur l'utilitaire `link-btn-outline` (revue)
- **Tranche V — socle visuel « dessin technique »** : GREEN 716 passed / 716 total · refactor : aucun
- **Tranche 6 — la home commerciale : hero et offres** : GREEN 947 passed / 947 total · refactor : liste d'offres d'une famille (cartes Sites / lignes Applications) sortie en `OfferFamilyList`, partagée par `OfferCatalogue` et `HomeOffers` (passe manuelle sur le diff, `simplify` non invoqué en sous-agent)

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

### Tranche 4 — `/offres` (catalogue) et fil d'Ariane des cinq pages d'offre

Surface nouvelle (`/offres`) et restructuration d'une surface atteignable (`BreadcrumbList` des
cinq `/offres/<slug>`). Joué le 2026-10-04 sur le build de production.

**Steps**

1. `pnpm install --frozen-lockfile` puis `pnpm run build --configuration production` (sitemap et
   RSS régénérés par le script `build`, API de prod joignable) : « Prerendered 20 static routes ».
2. `dist/angular-portfolio-app/browser/offres/index.html` inspecté (grep + `json.loads` du
   JSON-LD), puis `offres/site-atelier/index.html`.
3. `public/sitemap.xml` régénéré lu (copie de preuve hors repo), puis `git checkout public/`.
4. Bundle : chaînes propres à `OFFER_PAGES` cherchées dans `main-*.js` et les chunks.
5. `browser/` servi en statique (`127.0.0.1:4321`), `/offres/` ouvert dans le navigateur à
   375×812 et 1440×900, thème clair et sombre (clé `j-ned:theme`) ; `scrollWidth` mesuré ;
   axe-core 4.10.2 injecté (script même origine, retiré ensuite) ; clic dans le corps d'une carte.

**Résultats**

- Prérendu : un seul `h1` « Cinq offres, un tarif annoncé avant de commencer. » ; 2
  `offer-card` + 3 `offer-row` ; cinq liens `href="/offres/<slug>"` (site-vitrine, site-atelier,
  application-metier, refonte-maintenance, renfort-freelance) ; `offer-vat-mention` « TVA non
  applicable, art. 293 B du CGI » ; `<link rel="canonical" href="https://nedellec-julien.fr/offres">` ;
  `<title>` et meta description validés ; JSON-LD `@graph` = `CollectionPage` (nom = h1, url du
  catalogue, `mainEntity` `ItemList` de cinq `ListItem` position/nom/URL) + `BreadcrumbList`
  Accueil → Offres.
- Page d'offre : `offres/site-atelier/index.html`, `BreadcrumbList` à trois niveaux : Accueil (1) →
  Offres (2, `/offres`) → « Sites pour ateliers » (3, `/offres/site-atelier`).
- Sitemap régénéré : `<loc>https://nedellec-julien.fr/offres</loc>` (priorité 0.8), suivi des cinq
  pages d'offre (0.7). `public/` restauré (`git status public` vide).
- Bundle : « Pourquoi un tourneur », « Le déroulé en 7 jours », « Ce que contient le site », « Le
  nom de domaine reste à moi » : 0 occurrence dans `main-AYNBB62Y.js`, présents dans le seul chunk
  lazy des offres ; le titre du catalogue n'est pas non plus dans `main`.
- Mise en page : pas de débordement (`scrollWidth` = `clientWidth` : 375/375, 1425/1425) ; liens de
  ligne 343×144 à 168 px, liens de carte 120×44 px étirés sur toute la carte (clic dans le corps
  d'une carte → `/offres/site-vitrine`) ; `app-cartouche` en `display: flex`, pieds alignés.
- axe : 0 violation à 375 px (clair et sombre) et à 1440 px (clair ; sombre rechargé en thème
  sombre). Un premier passage sombre à 1440 px, lancé 300 ms après une bascule de classe, signalait
  des contrastes sur le header et la référence du cartouche pendant la transition de couleurs ;
  rejoué après rechargement en sombre : 0 violation.
- Console : aucune erreur applicative. Erreurs présentes, toutes d'environnement (origine locale
  `127.0.0.1` refusée par le CORS de l'API de prod pour `/api/cv` et `/api/analytics/track`,
  `/api/config` absent du serveur statique), à l'origine du toast « Une erreur est survenue » des
  captures ; aucune ne touche le catalogue.

**Captures** (`~/.claude/projects/-home-j-ned-Projects-Portfolio-ng-portfolio-app/d6e00462-295b-4b2c-ad3e-98224ecb112d/tool-results/`)

- 1440 sombre : `mcp-Claude_Browser-blob-1791123726217-uiq9kn.jpg`, `…-c3nnmi.jpg`
- 375 sombre : `mcp-Claude_Browser-blob-1791123745968-76lhp7.jpg`, `…1791123745969-v36xdm.jpg`, `…1791123745969-5kf7ai.jpg`
- 1440 clair : `mcp-Claude_Browser-blob-1791123779067-puhct7.jpg`, `…-64ruyb.jpg`
- 375 clair : `mcp-Claude_Browser-blob-1791123790791-y6y3ub.jpg`, `…-fl7e4p.jpg`

**Verdict : PASS.**

**Reprise après les arbitrages de Julien (2026-10-04)** : description SEO « Sites en 7 jours dès… »,
accroches du catalogue et des familles, référence du cartouche empilée sous le titre. Rejoué sur un
nouveau build de production (867 passed / 867).

- Prérendu `offres/index.html` : `<meta name="description" content="Sites en 7 jours dès 690 €,
  application métier dès 4 500 €, refonte, maintenance et renfort Angular. Prix annoncé avant de
  commencer.">` ; `offer-catalogue-lead` juste après le `h1` ; deux `offer-family-lead` (Sites,
  Applications) dans la colonne libellé de leur section.
- Sitemap régénéré : `/offres` toujours présent ; `public/` restauré. `main-*.js` toujours sans
  contenu de `OFFER_PAGES`.
- Cartes : barre de titre lisible à toutes les largeurs, nom sur sa ligne puis public en mono dessous,
  sans troncature (à 375 px, nom tenu sur une ligne pour la vitrine, public sur une à trois lignes).
- `scrollWidth` = `clientWidth` aux quatre combinaisons (375/375, 1425/1425).
- axe : 0 violation à 375 et 1440 px, clair et sombre (thème posé par rechargement, pas par
  bascule de classe).
- Console : seules les erreurs d'environnement déjà décrites (CORS de l'API de prod vers
  `127.0.0.1`, `/api/config` absent du serveur statique).

**Captures** (`~/.claude/projects/-home-j-ned-Projects-Portfolio-ng-portfolio-app/d6e00462-295b-4b2c-ad3e-98224ecb112d/tool-results/`)

- 1440 sombre : `mcp-Claude_Browser-blob-1791124615422-krqrgf.jpg`
- 375 sombre : `mcp-Claude_Browser-blob-1791124615422-7xqhk8.jpg`, `…1791124615423-teqmgm.jpg`
- 375 clair : `mcp-Claude_Browser-blob-1791124631762-e19at1.jpg`
- 1440 clair : `mcp-Claude_Browser-blob-1791124631762-hfzp8b.jpg`

**Verdict (reprise) : PASS.**

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

### Tranche V — socle visuel (polices, tokens, base titres, boutons 6 px, marque du header)

Surfaces atteignables restructurées : **toutes les pages** (typographie globale, rayon des boutons,
marque du header). `Cartouche` et `DimensionLine` ne sont rendus nulle part : preuve = suite
unitaire (V2, V3).

Steps : `pnpm install --frozen-lockfile` → `pnpm run build --configuration production` (API de prod
joignable : sitemap 15 URL, 15 routes prérendues, CSP durcie sur 16 pages) → lecture de
`dist/angular-portfolio-app/browser/**` → `docker build` de la branche **et** de sa base `0b758d8`
(`git archive`, aucune écriture git), conteneurs nginx sur `:3301` (branche) et `:3302` (base) →
Chromium headless (Playwright, viewport 375×812) sur `/`, `/about/`, `/offre-site-industrie/`,
`/blog/`, `/blog/de-20-ans-de-metallurgie-a-developpeur-full-stack/`, chaque page en sombre puis en
clair (bascule de `app-dark` sur `<html>`), axe-core injecté par évaluation de script →
Lighthouse 12 mobile, 3 passes par page et par image, médiane. `public/sitemap.xml` et
`public/rss.xml` restaurés par `git checkout` après le build.

1. **Assets** : `browser/fonts/` contient les quatre woff2 et les deux `OFL-*.txt` ; le CSS émis
   contient 6 `@font-face` et les quatre `url(/fonts/…woff2)` intactes (non réécrites vers
   `media/`) ; `browser/index.html` contient `<link rel="preload" href="/fonts/archivo-2.001-latin-wdth100-110-wght600-800.woff2" as="font" type="font/woff2" crossorigin>`
   et aucun préchargement de l'italique. Garde CI du préchargement rejouée à la main sur le build :
   OK. Image Docker : `/fonts/archivo-…woff2` → 200, `Content-Type: font/woff2`,
   `Cache-Control: public, max-age=31536000, immutable`.
2. **CSP** : `<meta>` CSP de la home identique à la base hors hachages (empreinte égale après
   suppression des `sha256-…`) ; aucune `unsafe-inline` dans `script-src`/`style-src` des pages
   prérendues. Aucune violation CSP liée aux polices ni à la feuille, dans les deux registres, sur
   les cinq pages. Seule violation observée : `connect-src` sur `https://giscus.app/default.css`
   dans l'article de blog, **identique sur la base** (préexistante, hors périmètre).
3. **Réseau** : polices servies par l'origine du site, **aucune requête vers un tiers de polices**.
   `/`, `/about/`, `/offre-site-industrie/`, `/blog/` : Archivo, JN Sans, JN Mono ; **italique
   absente** (HTML prérendu de `/` et de l'offre sans `<em>` ni `<i>`). Article de blog (un `<em>`) :
   italique **téléchargée**. Lighthouse : Archivo demandée en premier (priorité High, avant la
   feuille de styles), JN Sans/Mono découvertes par le CSS critique inliné.
4. **Rendu** (captures, scratchpad de session `lh/shots-branch/` : `_-{dark,light}.png`,
   `_offre-site-industrie_-{dark,light}.png`, `_blog_de-20-ans-…_-{dark,light}.png`,
   `blog-italic-{dark,light}.png`) : titres en Archivo élargi (`h1` calculé
   `font-stretch: 108%`), texte en JN Sans, libellés mono en JN Mono ; boutons non pilule à
   `6px` (« Demander mon site », « Envoyer le message ») ; italique du blog : vraie italique JN Sans
   (`a` à un étage, `fontStyle: italic`), `font-synthesis-weight: none` effectif. Prix de l'offre
   `690 €, prix final`, `690 €`, `29 €/mois` rendus sans glyphe manquant.
5. **axe** (2 registres × 5 pages) : aucune violation imputable au diff. **Une violation
   `color-contrast` existe**, sur le toast d'erreur global « Erreur » (`text-status-error` sur
   `status-error/15`, **3,81:1**, sous les 4,5:1 requis) : le toast s'affiche dès que l'API refuse
   l'origine locale (CORS), et la violation se reproduit **en clair sur `/`, l'offre et `/blog/`**
   chaque fois que le toast est à l'écran au moment de l'analyse ; en sombre, elle n'a pas été
   relevée. Elle est **identique sur la base `0b758d8`** (revérifiée par la revue) : préexistante,
   hors du diff de la tranche, mais réelle en production dès qu'une erreur API survient. **Ticket
   séparé** à ouvrir (contraste du toast d'erreur en registre clair). Hors toast, zéro violation
   sur les cinq pages dans les deux registres.
5bis. **Licence IBM Plex (*Reserved Font Name* « Plex »), après revue** : les trois fichiers Plex
   servis sont renommés dans leur table `name` (« JN Sans » / « JN Mono », PostScript `JNSans-…` /
   `JNMono-…`) et republiés sous de nouveaux noms versionnés (`jn-sans-3.201-latin-wght.woff2`
   35 864 o, `jn-sans-3.201-latin-wght-italic.woff2` 38 840 o, `jn-mono-2.3-latin-500.woff2`
   14 924 o). Preuves :
   - fontTools sur `dist/…/browser/fonts/*.woff2` : **0 occurrence de « Plex »** dans les tables
     `name` ; nameIDs 1/3/4/6 = `JN Sans` · `3.201;JN;JNSans-Regular` · `JN Sans Regular` ·
     `JNSans-Regular` (italique : `…-Italic`), `JN Mono Medium` · `2.3;JN;JNMono-Medium` ·
     `JN Mono Medium` · `JNMono-Medium` ; noms d'instances 264–272 en `JNSans-…` ;
   - fontTools, comparaison table par table avec les fichiers d'avant renommage : seules `name` et
     `head.checkSumAdjustment` diffèrent (glyphes, `fvar`, `gvar`, `STAT`, métriques intacts) ;
   - CSS émis et `index.html` : aucune occurrence de « Plex » ; `@font-face` `'JN Sans'` /
     `'JN Mono'`, `url(/fonts/jn-…)` intactes ;
   - navigateur (build prod servi en statique, comparé à l'image de la variante C d'avant
     renommage) : les polices se chargent sous leurs nouveaux noms (`jn-sans-…` et `jn-mono-…` en
     200, `jn-sans-…-italic` seulement sur l'article), `document.fonts` = `Archivo`, `JN Sans`
     (+ `italic` sur l'article), `JN Mono` ; **rendu identique au pixel** (0 px de différence) sur le
     `h1`, le premier paragraphe et l'italique de `/`, de l'offre et de l'article, en clair et en
     sombre ; aucune violation CSP.
   - **Repli d'Archivo** (`Archivo Fallback` pointé vers Arial Bold, `font-weight: 600 800`) :
     largeur du `h1` de l'offre sur une ligne (36 px, graisse 800), Archivo bloquée par
     interception réseau dans Chromium : **735,5 px** avec le nouveau repli contre **740,4 px** en
     Archivo (−0,7 %) ; l'ancienne face (`local('Arial')`) donnait **699,5 px** (−5,5 %). Sur ce
     lab Linux, Arial est absente : l'ancienne face échouait (repli `system-ui`) et la nouvelle se
     résout sur `Liberation Sans Bold`, métriquement identique à Arial Bold. La mesure du
     relecteur (335,5 px regular contre 370,5 px bold, −9,4 %) est cohérente avec l'écart corrigé ;
     macOS et Windows (Arial Bold native) non vérifiables ici.

6. **Lighthouse mobile, parades au coût de la tranche** (image Docker locale, Lighthouse 12
   mobile en throttling simulé, mêmes conditions pour toutes les images). Passe 1 : 3 passes par
   page et par image, médiane, toutes images mesurées dans la même session. Passe 2 : 5 passes de
   plus sur `/` et l'offre pour la base, la branche initiale et C (images jugées proches).
   Variantes construites depuis une copie de la branche (scratchpad), seule la parade changeant :
   - **branche initiale** : preload d'Archivo, `swap` partout, Archivo `wdth` 100–125 /
     `wght` 500–800 (57 504 o) ;
   - **A** : sans preload d'Archivo ;
   - **B** : Archivo en `font-display: optional` (preload conservé), Plex en `swap` ;
   - **C** : Archivo réduit aux seules plages employées, `wdth` 100–110 (marque du header 100 %,
     titres 104–108 %, titre du cartouche 110 %) et `wght` 600–800 (graisses des titres : 600, 700,
     800 ; aucun titre en 500 n'est rendu en Archivo), **39 512 o** (−17 992 o, −31 %). Une instance
     figée à 108 % pèserait 25 024 o mais casserait la marque (100 %), les `h2`/`h3` (106/104 %)
     et le cartouche (110 %) : écartée ;
   - **D** : aucune combinaison utile, A et B n'apportant rien (ci-dessous) : D = C.

   Passe 1, médiane de 3 (perf · LCP · CLS max) :

   | Image | `/` | `/about/` | `/offre-site-industrie/` | Polices romanes |
   |---|---|---|---|---|
   | base `0b758d8` | 89 · 3 101 ms · 0 | 75 · 3 693 ms · 0 | 81 · 3 819 ms · 0 | 0 o |
   | branche initiale | 78 · 4 167 ms · 0 | 70 · 4 412 ms · 0 | 79 · 3 995 ms · 0,003 | 108 284 o |
   | A (sans preload) | 77 · 4 073 ms · 0 | 70 · 4 486 ms · 0 | 74 · 4 590 ms · **0,040** | 108 284 o |
   | B (`optional`) | 72 · 4 429 ms · 0 | 71 · 4 398 ms · 0 | 74 · 4 576 ms · 0,003 | 108 284 o |
   | C (plages réduites) | 80 · 3 992 ms · 0 | 67 · 4 248 ms · 0 | 71 · 4 506 ms · 0,003 | 90 292 o |

   Passe 2, médiane de 5 (perf · LCP · render delay) :

   | Image | `/` | `/offre-site-industrie/` |
   |---|---|---|
   | base `0b758d8` | 87 · 3 361 ms · 2 909 ms | 80 · 3 824 ms · 3 372 ms |
   | branche initiale | 80 · 4 019 ms · 3 567 ms | 82 · 3 787 ms · 3 335 ms |
   | C | 81 · 3 886 ms · 3 434 ms | 78 · 4 423 ms · 3 971 ms |

   Toutes images confondues, a11y = 100 et SEO = 100 (passe 1). Dispersion entre passes d'une même
   image : jusqu'à 26 points de perf (B sur `/` : 72/80/54), 8 à 12 points couramment. Le LCP est
   à 89 % du « render delay » (le `h1` porte `animate-fade-up`), jamais du chargement d'une ressource.

   Lecture :
   - **Coût réel de la tranche** : sur `/`, −7 points et +650 ms de LCP, stable sur 8 passes ; sur
     l'offre, dans le bruit (80 → 82 sur 5 passes). Les polices entrent dans le chemin critique
     simulé : c'est l'ensemble des faces, pas Archivo seule, qui pèse.
   - **A** n'apporte rien (perf égale ou plus basse) et fait monter le CLS de l'offre à 0,040 : sans
     preload, Archivo arrive après le premier rendu et le `h1` change de métrique sous les yeux.
     **Écartée.**
   - **B** n'apporte rien de mesurable. Constat visuel à froid (cache désactivé, 4G lente émulée
     par CDP, captures `cold-B-slow4g_*.png`) : **le `h1` reste sur la police de repli** pour toute
     la visite. Sans throttling, Archivo s'affiche. Compromis visuel sans gain : **écartée.**
   - **C** : −18 Ko par page, rendu inchangé (comparaison pixel à pixel avec la branche initiale :
     2 à 3 px d'anticrénelage différents sur 38 759 à 64 484 px de `h1`, 0 px sur la marque du
     header), CLS inchangé. Perf et LCP indiscernables de la branche initiale dans le bruit du lab
     (`/` : 81 contre 80 ; offre : 78 contre 82, inversé en passe 1). **Retenue** : le seul gain
     sûr (octets), sans contrepartie visuelle.
   - **Perf ≥ 95** : la base elle-même est entre 75 et 89 dans ce lab ; le seuil n'y est pas
     mesurable. Résiduel sur `/` à arbitrer, ou à mesurer en conditions de prod (PageSpeed sur le
     déploiement).

   Appliqué : C, avec un nouveau nom de fichier versionné
   `archivo-2.001-latin-wdth100-110-wght600-800.woff2` (`@font-face` `font-weight: 600 800`,
   `font-stretch: 100% 110%`), preload d'Archivo et `swap` conservés.
7. **Console** : aucune erreur applicative (`NG0…`, hydratation). Erreurs d'environnement seules :
   `GET /api/config` 404 (absent de l'image locale) et CORS de `api.nedellec-julien.fr` refusant
   `localhost`, identiques sur la base.

Verdict : **PASS** sur les critères fonctionnels (assets, CSP, réseau, italique, rendu, CLS
≤ 0,05 ; axe sans violation imputable au diff, la violation de contraste du toast étant
préexistante et suivie à part), constatés sur la branche initiale, revérifiés après passage à C
puis après le renommage des polices IBM Plex : build prod (assets, `url()`, preload, garde CI),
tables `name` sans « Plex », rendu identique au pixel. **Réserve** : Lighthouse perf ≥ 95 non vérifiable localement (base entre 75 et 89), et
coût résiduel mesuré sur `/` (−7 points, +650 ms de LCP) qu'aucune parade testée ne réduit
au-delà du bruit.

### Tranche 6 — `/` (home commerciale, surface atteignable en production, restructurée)

Steps : `pnpm install --frozen-lockfile` → `pnpm run build --configuration production` (20 routes
prérendues, CSP durcie sur 21 pages) → lecture de `dist/angular-portfolio-app/browser/index.html`
et des chunks → `docker build` de la branche (arbre de travail) **et** de `origin/master` `5feff21`
(worktree détaché dans le scratchpad, retiré ensuite), conteneurs nginx `:3331` (branche) et
`:3332` (base) → Chromium headless (Playwright) sur `/` à 375×812 et 1440×900, clair puis sombre
(bascule de `app-dark`), axe-core injecté par évaluation de script → Lighthouse 12.8 mobile
(throttling simulé), 3 passes par image, médiane. `public/sitemap.xml` et `public/rss.xml`
restaurés par `git checkout` après les builds.

1. **HTML prérendu de `/`** : un seul `<h1 data-testid="hero-headline">`, texte « Des sites et des
   applications web, livrés en production par un seul interlocuteur. », unique
   `<em class="not-italic text-primary">livrés en production</em>` ; `hero-work-frame` (« Cadre de
   travail », réf., cinq lignes) et `hero-work-frame-dimension` (« de la demande à la mise en
   ligne ») présents ; section offres : `offer-card-link` → `/offres/site-vitrine`,
   `offer-row-link` → `/offres/application-metier`, `/offres/refonte-maintenance`,
   `/offres/renfort-freelance`, **aucune carte atelier** (les deux seules occurrences de
   `site-atelier` sont le JSON-LD et le lien du footer) ; `hero-cta-offers` et
   `home-offers-catalogue-link` en `href="/offres"`.
2. **« CDI »** : 0 occurrence dans tout le document, `<head>` compris. `<title>` = « Julien
   Nédellec | Sites et applications web, Yvelines » ; `meta description` et `og:description` =
   la description validée (U+00A0 avant `:`). Les valeurs par défaut de `src/index.html`
   (`title`, `description`, `og:title`, `og:description`) sont alignées sur la home.
3. **JSON-LD** : `@graph` `[Person, ProfessionalService]` ; `Person` (`@id`, `name`, `url`,
   `sameAs`, `knowsAbout`, `email`, plus de `jobTitle`) ; `ProfessionalService` (`name`, `url`,
   `founder` → `@id` de la personne, `address`, `areaServed` Yvelines / Île-de-France / France,
   `hasOfferCatalog` `OfferCatalog` des cinq URLs `/offres/<slug>`).
4. **Bundle initial** : `main-*.js` contient les résumés (`Site vitrine pour TPE…`) mais aucun
   contenu de page d'offre (« Site pro pour mon atelier », « Audit de mon application », « Ce qui
   change avec une application sur mesure », « Comment ça se passe » : 0 dans `main`, présents
   dans le seul chunk lazy des pages d'offre).
5. **Rendu** (captures, scratchpad de session `lh/shots-t6/head-{375,1440}-{light,dark}-{hero,offers,offers-full}.png`) :
   en 1440, texte à gauche (`h1` 682×366 px), cartouche à droite (470 px, aligné en bas) et cote
   dessous, comme la maquette ; en 375, cartouche et cote empilés sous le texte (cartouche à
   y = 729, sous le pli), aucun défilement horizontal. Accent en `text-primary` dans les deux
   registres. Section offres : `h2`, familles Sites (une carte) puis Applications (trois lignes),
   mention TVA et lien catalogue.
6. **axe** (2 largeurs × 2 registres) : aucune violation imputable au diff. Seule violation
   relevée : `color-contrast` sur `toast-summary` (375, clair), le toast d'erreur global affiché
   parce que l'API refuse l'origine locale : préexistante (déjà constatée en Tranche V, ticket
   séparé). Lighthouse a11y 100 et SEO 100 sur les six passes.
7. **Lighthouse mobile `/`** (médiane de 3, perf · LCP · render delay · CLS) :

   | Image | Perf (passes) | LCP | Render delay | CLS | Poids |
   |---|---|---|---|---|---|
   | base `5feff21` | 90 (90/88/90) | 3 045 ms | 2 594 ms | 0 | 440 634 o |
   | branche | 89 (89/89/86) | 3 047 ms | 2 596 ms | 0,014 | 449 198 o |

   L'élément LCP reste le `h1` (`app-home-hero > h1`) sur toutes les passes, opacité 1 au premier
   rendu (aucune classe `animate-`) : **pas de régression du LCP** après #152 (+2 ms, bruit).
   Perf dans le bruit (−1). CLS 0,014 (sous 0,1, base 0) : unique décalage attribué au chargement
   de JN Sans (`font-display: swap`), qui réajuste la hauteur du paragraphe et des CTA et décale le
   bloc cartouche placé dessous.
8. **Console** : aucune erreur applicative (`NG0…`, hydratation). Erreurs d'environnement seules :
   `GET /api/config` 404 et CORS de `api.nedellec-julien.fr` refusant l'origine locale, comme en
   Tranche V.

Verdict : **PASS**. Réserve : CLS 0,014 dû au swap de police sous le texte du hero (sous le
seuil « bon »).

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

### Tranche 4

**Verdict** : APPROVED (re-revue ; 1re revue REJECTED sur deux points, soldés)
**Gates CI locaux** : install ✅ (`pnpm install --frozen-lockfile`, exit 0, 1re revue ; lockfile inchangé depuis) / tests ✅ (`pnpm test`, exit 0, 96 fichiers / 867 passed / 867, relancé en re-revue après `ng cache clean` + purge `node_modules/.vite`) / lint ✅ (`pnpm lint`, exit 0, « All files pass linting », re-revue) / build ✅ (`pnpm run build --configuration production`, exit 0, relancé en re-revue : « Prerendered 20 static routes », CSP sur 21 pages). `public/` restauré par `git checkout`.
**Checks mécaniques** : `aak-checks.sh --diff <merge-base> --zoneless --archaeology '<motif profil>'` (plugin 0.37.0, non vendoré) : « 1 hit(s) — archeologie », levé : `app.routes.server.ts:77` `'admin/**'` est une chaîne de glob, pas un commentaire, ligne hors diff. Les non suivis passés par `--scope src/app/features/offer` : « aucun hit sur 30 fichier(s) ». Immutabilité : profil muet, défaut universel.
**Warnings de gate** : aucun
**Rendu compilé** : ✅ (`Cartouche` à sélecteur élément : encapsulation normale ; `app-cartouche` de la carte en `display: flex`, pieds alignés)
**Preuve de verify runtime** : ✅ (preuve `## Verify` / Tranche 4 et sa reprise complètes ; rejouée par la revue sur le build prod servi en statique : 375 et 1440 px, clair et sombre, axe-core sur le document entier 0 violation aux quatre combinaisons, `scrollWidth` = `clientWidth`, Tab atteint les cinq offres dans l'ordre (vitrine, atelier, métier, refonte, renfort) avec contour 2 px visible, clic routeur → `/offres/site-vitrine` ; console sans erreur due au diff, seulement CORS de l'API de prod et `/api/config` 404. La correction de la re-revue ne touche qu'un texte `sr-only` : prérendu contrôlé, pas de nouvelle passe navigateur)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅

1re revue, points corrigés (vérifiés en re-revue) :
1. `offer-card.ts:34` : le texte `sr-only` est désormais `&nbsp;: {{ summary().name }}`. Le prérendu de `offres/index.html` contient bien `&nbsp;: Site…` sur les deux cartes.
2. Spec alignée sur le code. V.3 (l. 629) décrit la barre `grid gap-1 …` avec la référence empilée sous le titre (décision de Julien en T4). Le tableau du § 2 donne `offer-card` = Sites sur `Cartouche`, ajoute `offer-row.ts` et les constantes `OFFER_FAMILY_LEADS`, `OFFER_CATALOGUE_HEADING`, `OFFER_CATALOGUE_LEAD`. La tranche T4 (l. 830-841) décrit 2 cartes + 3 lignes, les accroches et `offer-row.ts`.

Jugements demandés :
- `shared/ui/cartouche.ts` (barre `grid gap-1`) : accepté. Seul consommateur en production : `OfferCard`. `cartouche.spec.ts` ne dépend pas de la disposition. `DESIGN.md` § Cartouche et le plan V.3 décrivent désormais tous deux la barre empilée.
- Lien couvrant la carte : un seul `a` par carte, aucun `a a`, `after:absolute after:inset-0` contenu par le cartouche en `relative`. Le nom accessible est « Détail de l'offre : <nom> » (la flèche est `aria-hidden`). Contour de focus global 2 px sur le lien, cible 44 px. Ligne d'application : lien unique 343 × 144 à 168 px, nom, promesse et prix inclus.
- Landmarks : le prérendu n'a qu'un `main` et un `header` (ceux du shell) et deux `section[aria-labelledby]` → `h2`. Aucun `header` dans les sections.
- JSON-LD prérendu (`offres/index.html`, parsé) : `CollectionPage` (nom = h1, URL du catalogue) avec `mainEntity` `ItemList` de cinq `ListItem`, puis `BreadcrumbList` Accueil → Offres. `offres/site-atelier/index.html` a un fil à trois niveaux. Canonical, `og:*`, title et description conformes.
- Sitemap : `/offres` est présent (0.8), suivi des cinq pages d'offre.
- Bundle : aucun contenu de `OFFER_PAGES` dans `main-*.js`, et le h1 du catalogue non plus. Les deux vivent dans le seul chunk lazy.
- Typographie : conforme après correction. Pas de `—`. L'apostrophe droite suit l'usage du repo et de la maquette.

**Altitude composant** : rien (checker `[altitude]` 0 hit, `OfferCatalogue` 82 LOC)

**Tests notables** :
- ✨ `offer-catalogue.spec.ts` « makes the whole row a single link » : vérifie que nom, promesse et prix sont contenus dans l'unique `a`, ce qui épingle la décision « ligne = un lien » et pas seulement la présence d'un lien.
- ✨ `group-offers-by-family.spec.ts` « puts sites first even when applications come first » : l'entrée entrelacée par builders prouve l'ordre de famille sans dépendre de l'ordre de `OFFERS`.
- ⚠️ `offer-catalog.static-data.ts:14` : le h1 « Cinq offres » est figé alors qu'aucun test ne le lie à `OFFERS.length`. Une sixième offre laisserait un titre faux. Copy validée, donc non bloquant ; à garder en tête au prochain ajout d'offre.

**Risque résiduel** (advisory, § 8) :
- réversibilité : profil muet (déploiement Dokploy continu sur `master`) · monitoring : Sentry
- Clic réel sans navigation dans le Browser pane : classé artefact du pane. Diagnostic de l'orchestrateur : `document.elementFromPoint` renvoie `<html>` partout dans l'onglet, aucun `click` n'atteint le lien. Le même comportement apparaît sur le header de la home et sur le site de production, donc antérieur au diff. Les tests Vitest valident la navigation au clic.
- Nuance levée le 2026-10-04 : Julien a vérifié dans Chrome, hors du Browser pane, que Tab puis Entrée sur « Blog » en production ouvre bien la page. La navigation au clavier fonctionne ; le symptôme était propre au pane. Risque clos.
- `app-cartouche` de la carte porte à la fois `block` (hôte) et `flex` (consommateur). Le rendu est correct (`flex` gagne par l'ordre CSS de Tailwind), mais le conflit d'utilitaires est fragile.

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

### Tranche V

**Verdict** : APPROVED (re-revue ; 1re revue REJECTED sur la licence IBM Plex, soldée)
**Gates CI locaux** : install ✅ (`pnpm install --frozen-lockfile`, exit 0, 1re revue ; lockfile inchangé depuis) / tests ✅ (`pnpm test`, exit 0, 716 passed / 716, après `ng cache clean` + purge `node_modules/.vite`) / lint ✅ (`pnpm lint`, exit 0, « All files pass linting ») / build ✅ (`pnpm run build --configuration production`, exit 0, API de prod joignable du premier coup : sitemap 15 URL, 15 routes prérendues, CSP durcie sur 16 pages). `public/sitemap.xml` et `public/rss.xml` restaurés par `git checkout`.
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main sur le diff et les non suivis. Archéologie (motif du profil) 0 hit ; `export default`, `effect(`, helpers zone, `innerHTML`/`bypassSecurity`, `console.`, `.only`/`.skip`, snapshot, `fireEvent`, `interface`, `@capacitor` : 0 hit. `Cartouche`/`DimensionLine`/`CartoucheRow` sans consommateur hors specs : prescrits par le plan (V.3, V.7).
**Warnings de gate** : aucun
**Rendu compilé** : ✅ (sélecteurs élément ; CSS émis : 6 `@font-face`, quatre `url(/fonts/…woff2)` intactes, dont les trois `jn-*` ; replis émis avec leurs `local()` ; utilitaires des primitives générés)
**Preuve de verify runtime** : ✅ (preuve `## Verify` complète ; rejouée par la revue sur l'image Docker reconstruite après renommage : quatre woff2 en 200, `font/woff2`, anciens `ibm-plex-*` non servis ; Chromium 375×812 sur `/` et l'offre, sombre et clair : `h1` Archivo à 108 %, texte en `JN Sans`, aucune violation CSP ; console : seules les erreurs d'environnement, `/api/config` 404 et CORS de l'API)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅ (CSP de `src/index.html` inchangée)
**Alignement spec** : ✅

Points de la 1re revue, vérifiés :
1. **RFN « Plex » (bloquant)** : soldé.
   - Table `name` lue avec fontTools : aucune occurrence de « plex » dans aucun enregistrement des quatre fichiers servis. Familles « JN Sans » / « JN Mono », PostScript `JNSans-Regular`, `JNSans-Italic`, `JNMono-Medium`.
   - Comparaison table par table avec les anciens `ibm-plex-*` : seules `head` et `name` diffèrent, donc glyphes et axes identiques (`wght` 400–700).
   - `OFL-ibm-plex.txt` porte l'en-tête amont « with Reserved Font Name "Plex" » et une note sur les versions modifiées renommées.
   - ADR-0006 (titre, tableau, commande avec renommage, § 5, § 6, conséquences), plan et `DESIGN.md`/`DESIGN.json` sont cohérents.
   - Tailles réelles = ADR : 39 512 / 35 864 / 38 840 / 14 924, total 129 140, romanes 90 300.
2. **Repli d'Archivo** : soldé. `woff2` bloqués dans le navigateur, `Archivo Fallback 600 800` est chargé et un texte en 800 mesure 405,9 px, soit Arial Bold (370,5 px) × 109,59 %. Le repli gras est donc bien utilisé, avec son ajustement. `JN Sans Fallback` : 344,3 px = Arial (338,0 px) × 101,88 %, le repli résout désormais sur Linux.
3. **Verify item 5** : soldé. La violation du toast est déclarée telle quelle. La revue la reproduit en clair sur `/` et l'offre, identique sur la base `0b758d8`.
4. **Statut de l'ADR** : laissé à « proposé (à accepter avec la Tranche V) ». Non bloquant ; à passer à « accepté » au merge.
5. **`aria-label` du `Cartouche`** : inchangé, advisory, à revoir en T6 si le doublon gêne.

**Tests notables** :
- ✨ `src/app/shared/ui/cartouche.spec.ts` : `children` du `dl` comparés aux lignes, qui épingle la structure `dl > div` et l'ordre.
- ✨ `src/app/shared/ui/dimension-line.spec.ts` : sélecteur de focalisables et de rôles, qui garde l'invariant `aria-hidden`.

**Risque résiduel** (advisory, § 8) :
- réversibilité : profil muet (Dokploy continu sur `master`) · monitoring : Sentry
- aucun état persistant touché ; polices en cache `immutable` sous noms versionnés
- non couvert par les gates : Lighthouse perf ≥ 95 non mesurable en lab, coût sur `/` accepté par Julien ; contraste du toast d'erreur préexistant (ticket séparé).

### Tranche 6

**Verdict** : APPROVED (re-revue ; 1re revue REJECTED sur deux points, soldés)
**Gates CI locaux** : install ✅ (`pnpm install --frozen-lockfile`, exit 0) / tests ✅ (`pnpm test`, exit 0, 101 fichiers, 949 passed / 949 à la re-revue, après `pnpm exec ng cache clean` et purge de `node_modules/.vite` ; 947 / 947 en 1re revue) / lint ✅ (`pnpm lint`, exit 0, « All files pass linting », rejoué à la re-revue) / build ✅ (`pnpm run build --configuration production`, exit 0 en 1re revue ; non rejoué, la re-revue n'ajoute que deux `data-testid` et des tests, API de prod joignable du premier coup : sitemap 20 URL, 20 routes prérendues, CSP durcie sur 21 pages). `public/` restauré par `git checkout`.
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main sur `git diff 2ae4b66` et les non suivis. Archéologie (motif du profil) : 0 hit nouveau (le commentaire de `http-analytics.gateway.ts:79` est préexistant, son exemple est mis à jour ; celui de `home.static-data.ts:12-13` est déplacé). `export default`, `effect(`, helpers zone, `innerHTML`, `console.`, `.only`/`.skip`, snapshot, `fireEvent`, `interface` : 0 hit. Exports ajoutés : `toOfferCatalogJsonLd` (prescrit par le plan, consommé par `app.routes.ts`), `OfferFamilyList` (2 consommateurs), constantes `HOME_*` (composants + specs). Code mort : `HERO_KEYWORDS`, `HeroProof`, `proofs`, `hero-keyword`, `hero-proof`, `hero-cta-projects` : 0 occurrence dans `src/`, `scripts/`, `.github/` (`home_hero_projects` ne reste que comme donnée d'exemple de `http-analytics.gateway.spec.ts`, sans lien avec le hero).
**Warnings de gate** : aucun (build, test et lint lus en entier, aucun warning ni stderr)
**Rendu compilé** : N/A (aucun composant à sélecteur attribut touché ; `OfferFamilyList`, `HomeOffers`, `Cartouche` et `DimensionLine` ont des sélecteurs élément)
**Preuve de verify runtime** : ✅ (toujours valable à la re-revue : le seul changement applicatif est l'ajout de deux `data-testid`, sans effet de rendu ; preuve `## Verify` / Tranche 6 complète et cohérente avec le diff ; rejouée par la revue sur le build de production servi en statique, Chromium 375×812 et 1440×900, clair et sombre : rendu conforme, aucun défilement horizontal, `h1` sans `animate-` et opacité 1, accent `em` `not-italic` en `text-primary` dans les deux registres. Clavier : CTA contact → CTA offres → carte vitrine → trois lignes → lien catalogue, `:focus-visible` et outline de 2 px sur chaque arrêt. axe : seule violation, `color-contrast` du toast d'erreur global en clair, préexistante et due à l'environnement. Console : seulement les erreurs d'environnement, un 404 et le CORS de l'API.)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅ (accroches de famille et mention TVA épinglées à la re-revue)
**Sécurité** : ✅ (CSP inchangée, aucun lien externe ajouté ; le lien Malt quitte le hero)
**Alignement spec** : ✅ (fichiers du plan T6 présents ; `OfferFamilyList` est un refactor sous vert, tracé au journal)

Vérifications du HTML prérendu de `/` : un seul `h1`, texte validé, un seul `<em class="not-italic text-primary">livrés en production</em>` ; `hero-work-frame` (titre, réf., cinq lignes ; `± 0 €` porte des U+00A0 aux bons endroits) ; `hero-work-frame-dimension` ; `home-offers` avec une `offer-card` (vitrine) et trois `offer-row`, sans atelier (`site-atelier` n'apparaît que dans le JSON-LD et le footer) ; « CDI » : 0 occurrence dans tout le document, `<head>` compris. `<title>`, `description` et `og:*` portent la copy validée (U+00A0 avant `:`). JSON-LD : `@graph` `[Person, ProfessionalService]`, `founder` → `@id` de la personne, `areaServed` et `hasOfferCatalog` (cinq URL) conformes. `main-*.js` : les résumés des offres et la copy de la home y sont (section eager, attendu) ; aucun contenu de page d'offre (« Site pro pour mon atelier », « Audit de mon application », « Comment ça se passe », « Ce qui change avec une application » : seulement dans le chunk lazy des offres). « CDI » est présent 2 fois dans `main-*.js` via `SITE_IDENTITY.hiringAvailability`, qui n'est pas rendu sur la home (décision de Julien).

Points à juger, réponses de la revue :
1. **Frontière de `OfferFamilyList`** : acceptable dans `features/offer/application/components`. Le composant connaît `OfferSummary`, `OfferCard` et `OfferRow` : c'est un composant de feature, pas une primitive du DS. `shared/ui` serait la mauvaise couche. L'import entre features au niveau `application` a un précédent (`home.ts` importe `ContactForm` depuis `features/contact/application`). Refactor sous vert vérifié : `offer-catalogue.spec.ts` n'est pas modifié et passe. Reste un doublon, en advisory ci-dessous.
2. **Ajouts non couverts** : la pastille de disponibilité est décorative (`aria-hidden`), son absence de test est acceptée. Les accroches de famille et la mention TVA de `HomeOffers` sont du contenu visible, et la mention TVA est légale. Ni le RED, ni le plan de test T6 ne les couvrent, et les retirer ne ferait échouer aucun test. Le catalogue, lui, les épingle (`offer-family-lead`, `offer-vat-mention`). Bloquant en 1re revue, soldé en re-revue. Eyebrow et lead sous le h2 : leur omission est cohérente avec la copy validée par Julien (h2 changé, aucun eyebrow ni lead validés), désormais tracée au plan de test T6.
3. **Modifications hors brief** : `index.html` est légitime. Le delta RED l'annonce (« meta par défaut sans CDI »), il sert de repli aux routes sans SEO, et ses U+00A0 sont présentes. Le remplacement de la règle « Indigo Keyword » est nécessaire, puisque la règle contredisait le nouveau h1. Il laisse cependant deux mentions périmées, voir point 2. `@id` + `founder` : c'est la bonne pratique schema.org pour relier les deux nœuds du `@graph`, mais aucun test ne l'épingle (advisory).
4. **CLS 0,014** : acceptable, sous le seuil « bon » de 0,1. Les replis métriques existent déjà (`JN Sans Fallback`, avec `size-adjust` et les trois overrides). Le résidu vient d'un retour à la ligne différent du lead, qui pousse le bloc dessous (empilé en mobile, aligné en bas `items-end` en desktop). Aucun correctif simple et sûr : une réserve de hauteur en `lh` sur un texte fluide serait fragile. Laisser tel quel.
5. **h1 et LCP** : invariant tenu. Pas de `animate-`, opacité 1 au premier rendu, test conservé (`home-hero.spec.ts`). `HERO_KEYWORDS` et `proofs` sont supprimés sans reste.
6. **Typographie** : tenue. U+00A0 après `±` et avant `€` (octets vérifiés), avant `:` dans la description (route et `index.html`). `editorial-typography.spec.ts` couvre les quatre nouvelles constantes. `STATIC_HERO` y était déjà.

**Tests notables** :
- ✨ `src/app/features/home/application/home.spec.ts:312` : « aucun CDI » vérifié après rendu forcé des deux blocs différés, avec `STATIC_HERO` réel. Le test couvre toute la page, pas seulement le hero.
- ✨ `src/app/features/home/application/home-offers.spec.ts:88` : `describe.each` sur les offres mises en avant, `href` et navigation réelle, un cas nommé par offre.
- ⚠️ `src/app/app.routes.home.spec.ts:48` : le lien `founder` → `@id` de `Person` n'est pas épinglé. Un renommage d'`@id` casserait le graphe en silence.

**Duplication / dérivation** (advisory, non bloquant) :
- ⚠️ `src/app/features/home/application/home-offers.ts:25-34` et `src/app/features/offer/application/offer-catalogue.ts:32-46` : même bloc de famille (grille `lg:grid-cols-[13rem_minmax(0,1fr)]`, colonne titre + accroche, mêmes classes), sur 2 sites. Le refactor n'a extrait que la liste. Seul le niveau de titre diffère (h3 contre h2, plus `section` contre `div`). On peut l'accepter tant qu'il n'y a que deux sites. Un troisième site imposerait un composant `OfferFamilyBlock` avec un niveau de titre en entrée.

**Risque résiduel** (advisory, § 8) :
- réversibilité : profil muet (Dokploy continu sur `master`) · monitoring : Sentry
- aucun état persistant touché
- non couvert par les gates : la branche de repli de `HomeHero.headlineSegments` (accent introuvable dans le titre) n'est pas testée ; le `Cartouche` du hero est annoncé deux fois par les lecteurs d'écran (`aria-label` = titre visible), un point advisory hérité de la Tranche V, où la maquette proposait un libellé distinct.

Points de la 1re revue, vérifiés :
1. **Tests manquants** : soldé. `home-offers.spec.ts` gagne deux tests. Le premier vérifie, dans chaque `home-offers-family`, que les `home-offers-family-lead` valent `[[OFFER_FAMILY_LEADS.sites], [OFFER_FAMILY_LEADS.applications]]` : il épingle aussi le rattachement de chaque accroche à sa famille. Le second vérifie que `home-offers-vat-mention` vaut `SITE_IDENTITY.business.vatMention`. RED tracé au plan de test (2 failed / 949, en `AssertionError`). Côté GREEN, `home-offers.ts:32` et `:42` ne portent que les deux `data-testid` ajoutés, rien d'autre. Le plan de test T6 trace aussi les omissions volontaires (eyebrow, lead sous le h2).
2. **`DESIGN.md`** : soldé. Les lignes 151 et 380 renvoient à l'accent unique (`em` `not-italic text-primary`, The Indigo Accent Rule). Plus aucune occurrence de `kw` ni de « Keyword » dans `DESIGN.md` ni `DESIGN.json`.

Advisories maintenus, non bloquants : bloc de famille dupliqué sur 2 sites, lien `founder` → `@id` non épinglé, branche de repli de `headlineSegments` non testée, double annonce du `Cartouche` du hero.
