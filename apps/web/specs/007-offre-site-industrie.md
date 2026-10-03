---
id: 007
title: Page d'offre « Site pro en 7 jours » pour ateliers et sous-traitants mécaniques, et passage des mentions légales en version professionnelle
type: feat
status: draft
created: 2026-10-03
related: [PRODUCT.md, src/app/pages/legal-notice.ts]
---

# 007 — Page d'offre « Site pro en 7 jours »

## Description

### Contexte

Julien lance une activité d'entrepreneur individuel (SIRET 937 999 860 00029, APE 62.01Z) : la
création de sites vitrines pour les ateliers d'usinage, de décolletage et de mécanique de précision
des Yvelines. Le modèle technique existe dans un dépôt séparé (Astro, `site-industrie`). La
prospection (visite, téléphone, email, LinkedIn) renvoie vers une page qui présente l'offre et
recueille la demande. Cette page n'existe pas.

Cible de la page : **un gérant ou un responsable commercial d'atelier de 5 à 50 salariés**, peu
technique, qui lit sur téléphone entre deux réglages. Ce n'est **pas** la cible du reste du site
(recruteurs et clients tech, cf. `PRODUCT.md`). La page doit donc vivre à part : elle ne modifie ni
la home, ni le menu principal.

### Ce qui est attendu

#### 1. Une route publique dédiée : `/offre-site-industrie`

- Rendue en **prérendu** (même régime que `mentions-legales`), indexable, présente dans
  `public/sitemap.xml` (généré par `scripts/generate-sitemap.mjs`).
- `Title` + `Meta` (description, Open Graph) via le mécanisme `data.seo` existant des routes.
  Données structurées : `Service` (ou `Offer`) avec prix `690` EUR, fournisseur = Julien Nédellec,
  zone desservie = Yvelines / Île-de-France ; plus un `BreadcrumbList` comme les autres routes.
- Un seul `<h1>`. WCAG AA, zéro violation axe.

#### 2. Contenu de la page (dans cet ordre)

Copy en français, phrases courtes, **aucun em-dash**, aucun superlatif (voix `PRODUCT.md`).
Vocabulaire du métier (tolérances, parc machines, EN 9100), pas du jargon web.

1. **En-tête de l'offre**
   - Titre : « Le site de votre atelier, en ligne en 7 jours. »
   - Sous-titre : « Je suis tourneur CN dans l'aéronautique. Je crée des sites qui montrent à un
     acheteur ce que vous savez usiner, en trente secondes. »
   - Bouton principal « Demander mon site » vers le formulaire (§ 3). Prix visible dès l'en-tête :
     « 690 €, prix final ».
2. **Pourquoi un tourneur plutôt qu'une agence** : 3 arguments courts.
   - Je parle votre langue : capacités, matières, tolérances, certifications.
   - Je sais ce qu'un acheteur cherche : parc machines, EN 9100, délais, contact direct.
   - Sans surprise : un site rapide, lisible sur téléphone, sans abonnement caché.
   - Ne jamais citer le nom de l'employeur de Julien.
3. **Ce que contient le site** : savoir-faire, parc machines, matières et secteurs, qualité et
   certifications, étapes de travail, formulaire de demande de devis, mentions légales, adapté au
   téléphone, référencement local Google.
4. **Le déroulé en 7 jours** : verbes d'action, pas de « Étape 1 ».
   - Échanger (jour 1) : 20 minutes au téléphone ou à l'atelier, vous me donnez photos et liste
     des machines.
   - Construire (jours 2 à 5) : je monte le site et je vous envoie un lien de prévisualisation.
   - Ajuster (jour 6) : vos corrections.
   - Mettre en ligne (jour 7) : sur votre nom de domaine.
5. **Tarif**
   - Création : **690 €**, une fois. 50 % à la commande, 50 % à la mise en ligne.
   - Maintenance : **29 €/mois**, sans engagement : hébergement, nom de domaine, HTTPS,
     sauvegardes, 30 minutes de modifications par mois.
   - Mention obligatoire sous les prix : « TVA non applicable, art. 293 B du CGI ».
6. **Questions fréquentes** (éléments natifs `<details>`/`<summary>`, pas de JS) :
   - « J'ai déjà un site, ça vaut le coup ? »
   - « Je n'ai pas le temps de m'en occuper. »
   - « Mes clients viennent par le réseau. »
   - « Le nom de domaine reste à moi ? » (oui, il est à votre nom)
   - « Et si j'arrête la maintenance ? » (vous récupérez les fichiers du site)
7. **Demande** : le formulaire de contact existant (`features/contact`), avec le **sujet prérempli**
   « Site pro pour mon atelier ». Le visiteur peut modifier le sujet. Pas de nouveau backend :
   même endpoint, même validation, même anti-spam que le formulaire de la home.

#### 3. Accès depuis le reste du site

- Un lien discret dans le **pied de page**, à côté des liens légaux : « Sites pour ateliers ».
- **Rien** dans le menu principal ni sur la home.

#### 4. Mentions légales en version professionnelle

`src/app/pages/legal-notice.ts` indique aujourd'hui « édité à titre personnel et non
professionnel ». Une page qui vend une prestation rend le site professionnel (LCEN art. 6-III).

- Remplacer par : édité par **Julien Nédellec, entrepreneur individuel**, SIRET
  **937 999 860 00029**, code APE 62.01Z, avec l'adresse de domiciliation déjà affichée.
- Ajouter : « TVA non applicable, art. 293 B du CGI ».
- Mettre à jour `LEGAL_LAST_UPDATE`.
- SIRET et statut centralisés dans `SITE_IDENTITY` (`@shared/identity/site-identity.static-data.ts`),
  jamais en dur dans deux templates.

### Hors périmètre

- Démo en ligne du modèle Astro (pas encore déployée). La page ne contient aucun lien vers une démo
  inexistante.
- Paiement en ligne, prise de rendez-vous, tableau de bord prospects.
- Mise à jour de `PRODUCT.md` (qui affirme encore « pas une vitrine pour clients freelance » alors
  que #140 a ajouté le positionnement freelance) : à traiter dans une PR de doc séparée.

### Critères d'acceptation

- [ ] `/offre-site-industrie` est prérendue : le HTML servi contient le `<h1>`, les prix, la FAQ et
      le formulaire (pas un placeholder `@defer` vide, cf. spec 003).
- [ ] Le formulaire de la page s'affiche avec le sujet « Site pro pour mon atelier » prérempli,
      modifiable, et l'envoi passe par le même chemin que celui de la home.
- [ ] Le formulaire de la home garde un sujet vide par défaut (aucune régression).
- [ ] La page est dans `sitemap.xml`, avec `title`, `description`, `og:*` et le JSON-LD `Service`.
- [ ] Le pied de page contient le lien « Sites pour ateliers » ; le menu principal est inchangé.
- [ ] Les mentions légales affichent le statut d'entrepreneur individuel, le SIRET et la mention de
      TVA, lus depuis `SITE_IDENTITY`.
- [ ] Zéro violation axe sur la page ; un seul `<h1>`.
- [ ] Gates du Dockerfile au vert : `pnpm install --frozen-lockfile`,
      `pnpm run build --configuration production`, plus `pnpm test` et `pnpm lint`.

## Plan technique

> Décision structurante : **ADR-0004** (contenu statique de feature = constante de domaine, sans
> gateway). Profil lu : `.claude/project-profile.md`. Aucune dépendance ajoutée.

### 1. Architecture

**Emplacement : `features/offer/`, deux couches (`domain/` + `application/`), pas d'`infra/`.**
Contenu figé, aucune source distante envisagée : pas de gateway, pas de use case, pas de
`rxResource` (cf. ADR-0004). `pages/` est écarté : il loge des pages autonomes d'un fichier, alors
que l'offre a six sous-composants, un modèle et des prix partagés avec `app.routes.ts` (JSON-LD).

```
app.routes.ts ──(data.seo, prix)──────────────┐
  └─ loadComponent ─▶ SiteOffer (page, application/)
                        ├─ lit SITE_OFFER (domain/site-offer.static-data.ts)
                        ├─ lit SITE_IDENTITY.business.vatMention (@shared/identity)
                        ├─ <app-offer-hero>          input: hero, prix
                        ├─ <app-offer-reasons>       input: reasons
                        ├─ <app-offer-deliverables>  input: deliverables
                        ├─ <app-offer-timeline>      input: steps
                        ├─ <app-offer-pricing>       input: pricing, vatMention
                        ├─ <app-offer-faq>           input: faq
                        └─ <div id="demande"> <app-contact-form [initialSubject]> (features/contact)
```

- **Composants dumb** (`input()` uniquement, zéro `inject()`, zéro dérivation) ; la page est le
  seul composant qui lit les constantes. **Pas de presenter** : aucune dérivation état→affichage
  (données statiques → template), un presenter serait de l'indirection spéculative.
- **Sections 2 à 6** : chaque sous-composant enveloppe `<app-split-section [heading]
  [headingId]>` (`shared/ui/split-section.ts`, déjà `section[aria-labelledby]` + `h2.section-title`).
  Pas de nouvelle primitive `shared/ui/`.
- **Landmarks (ownership unique)** : le shell `App` possède `<main>` (autour du `router-outlet`),
  `<app-header>` (banner) et `<app-footer>` (contentinfo). **La page d'offre n'émet ni `<main>`,
  ni `<footer>`, ni `<header>` hors section** (le `<header>` interne de `SplitSection` est dans un
  `<section>`, donc pas un `banner`). Racine de la page : `host: { class: 'block pt-20' }` + des
  `<section>`. Constat hors périmètre : `Home` et `LegalNotice` émettent déjà un `<main>` imbriqué
  dans celui du shell (cf. Risques).
- **Formulaire de demande rendu sans `@defer`**. C'est l'objectif de conversion de la page, donc
  son contenu principal (CLAUDE.md § `@defer` : jamais pour le contenu principal d'une route). La
  route est déjà lazy (`loadComponent`) : le coût bundle du formulaire est payé par ce seul chunk.
  Conséquences : le formulaire est dans le HTML prérendu sans dépendre d'un trigger `hydrate`
  (ADR-0001 sans objet ici), et il s'hydrate avec la page au bootstrap (pas de fenêtre « HTML
  visible mais non hydraté » propre aux blocs différés). La home garde son `@defer (hydrate on
  viewport; …)` inchangé.
- **CTA « Demander mon site »** : `<a routerLink="." fragment="demande" class="link-btn-primary">`.
  `withInMemoryScrolling({ anchorScrolling: 'enabled' })` est déjà actif ; le SSR rend
  `href="/offre-site-industrie#demande"`, donc le lien fonctionne aussi sans JS. Interdit :
  `href="#demande"` brut (résolu contre `<base href="/">`, il recharge la home). Cible :
  `<div id="demande" class="scroll-mt-20" data-testid="offer-request">` autour de
  `<app-contact-form>` (même gabarit que le wrapper `#contact` de la home). `SectionScroller`
  n'est **pas** utilisé (il ramène sur `/`).

### 2. Fichiers à créer / modifier

**Créer**

| Fichier | Rôle |
|---|---|
| `src/app/features/offer/domain/models/site-offer.model.ts` | Types `SiteOffer`, `OfferHero`, `OfferReason`, `OfferStep`, `OfferPricing`, `OfferFaqItem` |
| `src/app/features/offer/domain/site-offer.static-data.ts` | `SITE_OFFER_PRICES` (montants numériques) + `SITE_OFFER` (contenu, libellés de prix construits depuis `SITE_OFFER_PRICES`) |
| `src/app/features/offer/application/site-offer.ts` | Page routée `SiteOffer` (`app-site-offer`) : compose les sections et le formulaire |
| `src/app/features/offer/application/components/offer-hero.ts` | `<h1>`, sous-titre, prix, CTA vers `#demande` |
| `src/app/features/offer/application/components/offer-reasons.ts` | « Pourquoi un tourneur plutôt qu'une agence » (3 arguments) |
| `src/app/features/offer/application/components/offer-deliverables.ts` | « Ce que contient le site » (liste) |
| `src/app/features/offer/application/components/offer-timeline.ts` | « Le déroulé en 7 jours » (`<ol role="list">`) |
| `src/app/features/offer/application/components/offer-pricing.ts` | Création + maintenance + mention TVA |
| `src/app/features/offer/application/components/offer-faq.ts` | FAQ en `<details>`/`<summary>` natifs |
| `src/app/features/offer/application/*.spec.ts`, `components/*.spec.ts` | Tests (rôle `qa`) |
| `src/app/layout/components/footer/footer.spec.ts` | Test du lien footer (aucun spec footer aujourd'hui) |
| `docs/adr/0004-contenu-statique-de-feature-sans-gateway.md` | ADR (créé) |

**Modifier**

| Fichier | Changement |
|---|---|
| `src/app/features/contact/application/contact-form.ts` | `input` `initialSubject` + modèle en `linkedSignal` + reset vers le sujet initial ; `data-testid="contact-subject"` sur l'input sujet |
| `src/app/features/contact/application/contact-form.spec.ts` | Tests du préremplissage (qa) |
| `src/app/app.routes.ts` | Route `offre-site-industrie` (lazy, `title`, `data.seo` + JSON-LD `@graph`) |
| `src/app/app.routes.server.ts` | `{ path: 'offre-site-industrie', renderMode: RenderMode.Prerender }` |
| `src/app/app.routes.server.spec.ts` | Assertion prerender de la route (qa) |
| `scripts/generate-sitemap.mjs` | Entrée statique `/offre-site-industrie` |
| `src/app/layout/components/footer/footer.ts` | Lien « Sites pour ateliers » dans la nav légale |
| `src/app/shared/identity/site-identity.static-data.ts` | Bloc `business` (statut, SIRET, APE, mention TVA) |
| `src/app/pages/legal-notice.ts` | Éditeur professionnel lu depuis `SITE_IDENTITY.business`, mention TVA, `LEGAL_LAST_UPDATE` |
| `src/app/pages/legal-pages.spec.ts` | Assertions version pro (qa) |

**Non modifiés (délibérément)** : `src/styles.css` (aucune utility nouvelle : `page-container`,
`section-title`, `link-btn-primary`, `form-*` suffisent), `app.config.ts`, `header.ts` /
`nav-items.ts`, `home.ts`, `shared/seo/seo.ts`, `public/sitemap.xml` (artefact régénéré par
`pnpm build` dans le Dockerfile : ne pas committer sa régénération locale, elle réécrit tous les
`<lastmod>` et crée un conflit garanti avec toute autre PR).

### 3. Modèles de données

`type` immuables (`readonly` partout, `readonly T[]`), conformément au profil. Esquisse de forme
(l'implémenteur fixe les noms exacts) :

```ts
type OfferHero = { readonly title: string; readonly subtitle: string; readonly ctaLabel: string; readonly priceLabel: string };
type OfferReason = { readonly id: string; readonly lead: string; readonly detail: string };
type OfferStep = { readonly id: string; readonly verb: string; readonly when: string; readonly detail: string };
type OfferPricing = {
  readonly creation: { readonly priceLabel: string; readonly terms: string };
  readonly maintenance: { readonly priceLabel: string; readonly terms: string; readonly includes: readonly string[] };
};
type OfferFaqItem = { readonly id: string; readonly question: string; readonly answer: string };
type SiteOffer = {
  readonly hero: OfferHero; readonly reasons: readonly OfferReason[]; readonly deliverables: readonly string[];
  readonly steps: readonly OfferStep[]; readonly pricing: OfferPricing; readonly faq: readonly OfferFaqItem[];
  readonly requestSubject: string;
};
```

- **Source unique des prix** : `SITE_OFFER_PRICES = { creationEur: 690, maintenanceMonthlyEur: 29 } as const`.
  Les libellés (`690 €, prix final`, `690 €`, `29 €/mois`) sont construits par template literal
  dans `SITE_OFFER` avec espace insécable (` `) avant `€`. Le JSON-LD lit
  `String(SITE_OFFER_PRICES.creationEur)`. Pas de `CurrencyPipe` : il dépend de
  `registerLocaleData(localeFr)` fait dans `app.config.ts`, absent en TestBed (footgun de test).
- `SITE_OFFER` déclaré `as const satisfies SiteOffer` (vérification à la compilation sans perdre
  les littéraux).
- **Tests** : comparer le DOM aux valeurs de `SITE_OFFER` / `SITE_IDENTITY`, jamais à des
  littéraux retapés (les espaces insécables rendent les littéraux fragiles).
- `SITE_IDENTITY.business` (ajout, reste un objet `as const` en TS pur car
  `scripts/generate-sitemap.mjs` l'importe via `tsx`) :
  `{ status: 'entrepreneur individuel', siret: '937 999 860 00029', ape: '62.01Z', vatMention: 'TVA non applicable, art. 293 B du CGI' }`.
  La mention TVA est lue par les mentions légales **et** par `OfferPricing` (via `input()` depuis
  la page) : une seule source.
- Validation runtime aux frontières : sans objet (aucune donnée externe ; profil : pas de lib de
  validation front).

**Copy des sections** : celle de la `## Description`, à la lettre (aucun em-dash, aucun
superlatif). Titres `h2` : « Pourquoi un tourneur plutôt qu'une agence », « Ce que contient le
site », « Le déroulé en 7 jours », « Tarif », « Questions fréquentes ». Les arguments sont
découpés en `lead` (« Je parle votre langue ») + `detail` (« capacités, matières, tolérances,
certifications. »). Réponses FAQ : la Description n'en fixe que deux ; **proposition à valider par
le propriétaire avant GREEN de la tranche 5** :

1. J'ai déjà un site, ça vaut le coup ? « Si votre site ne montre ni votre parc machines, ni vos
   matières, ni vos certifications, un acheteur ne trouve pas ce qu'il cherche. Je reprends ce qui
   sert et je refais le reste. »
2. Je n'ai pas le temps de m'en occuper. « Vingt minutes d'échange et la liste de vos machines
   suffisent. J'écris les textes, vous relisez. »
3. Mes clients viennent par le réseau. « Un acheteur qui reçoit votre nom regarde souvent votre
   site avant d'appeler. Le site confirme ce que le réseau dit de vous. »
4. Le nom de domaine reste à moi ? « Oui. Il est enregistré à votre nom, vous en restez
   propriétaire. »
5. Et si j'arrête la maintenance ? « Vous récupérez les fichiers du site et vous l'hébergez où
   vous voulez. »

### 4. Réactivité

- Page et sections : aucune réactivité propre (constantes passées en `input()`).
- `ContactForm` — **préremplissage par `input()`, pas par query param** :
  - `readonly initialSubject = input<string>('')` ;
  - `private readonly _blankContact = computed(() => ({ ...EMPTY_CONTACT, subject: this.initialSubject() }))` ;
  - `private readonly _model = linkedSignal<ContactFormData>(() => this._blankContact())`
    (pattern `linkedSignal` déjà établi : `admin-project-inline-form.ts`) ;
  - après succès : `field().reset(this._blankContact())` au lieu de `reset(EMPTY_CONTACT)`, sinon
    la page d'offre perd son sujet après un premier envoi.
  - Home : aucun binding ⇒ `''` ⇒ comportement et validation strictement inchangés (même schéma,
    même gateway, même anti-spam côté API).
  - Pourquoi pas un query param (`?sujet=`) : le prérendu est statique (un seul HTML par route,
    sans query), le sujet n'apparaîtrait qu'après hydratation ; il ouvrirait aussi une entrée
    d'URL injectée dans un formulaire, sans besoin produit. L'`input()` est rendu au serveur et
    se teste par `setInput`.
  - Nom `initialSubject` (pas `subject`) : signale une valeur de départ, pas un binding
    bidirectionnel ; `model()` est exclu (le parent n'écoute pas les retours).
- Le binding côté page est statique : `<app-contact-form [initialSubject]="offer.requestSubject" />`.
  `linkedSignal` ne se recalcule donc jamais pendant la saisie.

### 5. État partagé & coordination

Aucun store, aucune facade, aucun gateway nouveau. `ContactGateway` (déjà fourni dans
`app.config.ts`) est réutilisé tel quel par `ContactForm`. Signaux locaux uniquement.

### 6. Cross-platform

Sans objet (profil : aucune cible native).

### 7. Choix de bibliothèques

Aucun ajout. **`@axe-core/*` n'est pas en dépendance** et n'est pas ajouté (toucher `package.json`
et le lockfile crée une intersection avec toute PR parallèle, CLAUDE.md workflow item 7). Le
critère « zéro violation axe » se prouve en verify : axe (extension navigateur ou
`pnpm dlx @axe-core/cli`) sur la page servie depuis le build de prod, résultat collé dans
`## Verify`. Les tests portent les invariants structurels (un `h1`, `section[aria-labelledby]`,
landmarks uniques, `details`/`summary`).

### 8. SEO

- **Route** (`app.routes.ts`), insérée avant `mentions-legales` :
  `path: 'offre-site-industrie'`, `title: 'Site pro pour ateliers de mécanique | Julien Nédellec'`,
  `loadComponent: () => import('./features/offer/application/site-offer').then((m) => m.SiteOffer)`,
  **pas** de `data.preload` (route hors menu). `data.seo` : `title` identique, `description`
  (≤ 160 caractères, sans em-dash, ex. « Site vitrine pour ateliers d'usinage et de décolletage
  des Yvelines, en ligne en 7 jours. 690 € prix final, par un tourneur CN. »), `url:
  \`${SITE_IDENTITY.siteUrl}/offre-site-industrie\``, `type: 'website'`. Pas d'`image` : repli
  avatar existant du service `Seo` (carte `summary`).
- **JSON-LD** : `Seo.addStructuredData` n'écrit **qu'un** `<script type="application/ld+json">`
  par page. Les deux entités vont donc dans **un seul objet `@graph`**, sans toucher `seo.ts` :
  - `Service` : `name`, `serviceType: 'Création de site vitrine'`, `description`, `url`,
    `provider: { '@type': 'Person', name: 'Julien Nédellec', url: SITE_IDENTITY.siteUrl }`,
    `areaServed: [{ '@type': 'AdministrativeArea', name: 'Yvelines' }, { '@type': 'AdministrativeArea', name: 'Île-de-France' }]`,
    `offers: [ { '@type': 'Offer', name: 'Création', price: String(SITE_OFFER_PRICES.creationEur), priceCurrency: 'EUR' },
    { '@type': 'Offer', name: 'Maintenance', priceSpecification: { '@type': 'UnitPriceSpecification', price: String(SITE_OFFER_PRICES.maintenanceMonthlyEur), priceCurrency: 'EUR', unitCode: 'MON' } } ]` ;
  - `BreadcrumbList` : Accueil → « Sites pour ateliers » (même forme que `/about`).
  - Le script JSON-LD est exclu du durcissement CSP (`apply-csp-hashes.mjs` saute
    `application/ld+json`) : rien à faire côté CSP.
- **Prérendu** : `app.routes.server.ts`, ligne `Prerender` à côté de `mentions-legales`.
- **Sitemap** : `scripts/generate-sitemap.mjs`, `staticUrls` +
  `{ loc: \`${SITE_URL}/offre-site-industrie\`, changefreq: 'monthly', priority: '0.6' }`.
- Rappel : le SEO de route est appliqué par `initializeSeo()` sur `NavigationEnd`, exécuté au
  prérendu ; rien d'impératif à ajouter dans la page.

### 9. Footer et mentions légales

- **Footer** : troisième lien dans la nav existante,
  `<a routerLink="/offre-site-industrie" data-testid="footer-offer-link">Sites pour ateliers</a>`,
  mêmes classes que les deux autres. La nav passe en `flex-wrap justify-center gap-x-4 gap-y-2`
  (à 375 px les trois libellés en `text-sm` dépassent la largeur utile de 343 px : à vérifier
  visuellement, le wrap évite le débordement horizontal). `aria-label` de la nav : « Informations
  légales » devient « Liens utiles » (elle ne contient plus seulement du légal). Menu principal
  (`NAV_LINKS`) inchangé.
- **Mentions légales** : remplacer « édité à titre personnel et non professionnel par » par
  « édité par **Julien Nédellec**, {{ business.status }} » ; ajouter une liste : SIRET, code APE,
  mention TVA, toutes interpolées depuis `SITE_IDENTITY.business` (testids `legal-status`,
  `legal-siret`, `legal-ape`, `legal-vat`). L'adresse de domiciliation reste celle affichée.
  `LEGAL_LAST_UPDATE` = date du merge (format existant, ex. `'3 octobre 2026'`).

### 10. Design (DESIGN.md)

- Hero : pas de Display (réservé au hero de la home). `h1` sur le gabarit des autres pages
  (`text-[clamp(2.25rem,5.4vw,4.5rem)] font-extrabold leading-[1.04] tracking-[-0.035em]
  text-balance max-w-[20ch]`), sous-titre en body-large `max-w-[60ch] text-muted`, prix en
  `text-primary font-semibold`, CTA `link-btn-primary`. Fade-up existant (`animate-fade-up`)
  autorisé, il respecte déjà `prefers-reduced-motion`.
- Arguments : **pas** de grille de trois cartes icône-titre-paragraphe (anti-pattern nommé dans
  DESIGN.md § Overview) : liste verticale, `lead` en `font-semibold`, `detail` en `text-muted`.
- Livrables : liste à deux colonnes en `sm+`, puce `app-icon` `check` en `text-primary`
  (`aria-hidden`).
- Déroulé : `<ol role="list">`, verbe en `title`, `when` en mono `text-muted` (chiffre
  technique), aucun « Étape n ».
- Tarif : deux cartes plates (`rounded-xl border border-foreground/8 bg-surface p-6`), montant en
  `text-[clamp(2rem,4vw,3rem)] font-extrabold`, mention TVA en `text-sm text-muted` sous les
  deux cartes.
- FAQ : `<details class="border-b border-foreground/8">` + `<summary class="min-h-11 cursor-pointer
  py-3 font-semibold">` ; marqueur natif conservé ; le focus visible de `summary` est déjà
  global (`styles.css` l. 82).
- Tokens uniquement (`text-primary`, `text-muted`, `bg-surface`, `border-foreground/8`) : aucune
  nouvelle paire de couleurs, donc aucun ratio de contraste nouveau à calculer. Vérifier les deux
  registres (`.app-dark` et ivoire) en verify.

### Tranches

Chaque tranche liste les comportements observables à tester (sélecteurs `data-testid`
uniquement). Données de test = constantes réelles (`SITE_OFFER`, `SITE_IDENTITY`).

- **Tranche 1 — la page existe et présente l'offre** : modèle + `SITE_OFFER` (au minimum
  `hero`), `SiteOffer`, `OfferHero`, route lazy `offre-site-industrie`, ligne `Prerender`.
  - `offer-title` : unique `h1` de la page, texte = `SITE_OFFER.hero.title` ; `querySelectorAll('h1').length === 1`.
  - `offer-subtitle` = `hero.subtitle` ; `offer-hero-price` contient `hero.priceLabel`.
  - `offer-cta` : `<a>` dont `href` se termine par `#demande`, texte = `hero.ctaLabel`.
  - La page n'émet ni `main` ni `footer` (landmarks du shell).
  - `routes` contient `offre-site-industrie` dont `loadComponent` résout `SiteOffer` ;
    `serverRoutes` la déclare en `RenderMode.Prerender` (`app.routes.server.spec.ts`).
- **Tranche 2 — pourquoi moi, et ce que contient le site** : `OfferReasons`, `OfferDeliverables`,
  branchés dans la page.
  - `offer-reason` × `SITE_OFFER.reasons.length` (3), chacun avec `offer-reason-lead` et
    `offer-reason-detail` égaux aux données, dans l'ordre.
  - `offer-deliverable` × 9, textes = `SITE_OFFER.deliverables` dans l'ordre.
  - Chaque section est un `section[aria-labelledby]` dont l'id pointe un `h2` (via `SplitSection`).
- **Tranche 3 — le déroulé en 7 jours** : `OfferTimeline`.
  - `offer-step` × 4 portés par des `li` d'un `ol` ; `offer-step-verb`, `offer-step-when`,
    `offer-step-detail` = données, dans l'ordre.
  - Aucun texte de la section ne correspond à `/Étape/`.
- **Tranche 4 — le tarif** : `OfferPricing` (+ bloc `business` dans `SITE_IDENTITY`, nécessaire à
  la mention).
  - `offer-price-creation` contient `pricing.creation.priceLabel` et `pricing.creation.terms`.
  - `offer-price-maintenance` contient `pricing.maintenance.priceLabel` ; `offer-maintenance-include`
    × `pricing.maintenance.includes.length`.
  - `offer-vat-mention` = `SITE_IDENTITY.business.vatMention`.
  - Les libellés contiennent `String(SITE_OFFER_PRICES.creationEur)` et
    `String(SITE_OFFER_PRICES.maintenanceMonthlyEur)` (source unique).
- **Tranche 5 — la FAQ** : `OfferFaq` (copy des réponses validée au préalable, cf. § 3).
  - `offer-faq-item` × 5, chacun un élément `DETAILS`, fermé par défaut (`open === false`).
  - `offer-faq-question` est le `summary` de chaque item, texte = `faq[i].question` ;
    `offer-faq-answer` = `faq[i].answer`.
  - Aucun `button` dans la section (pas de JS).
- **Tranche 6 — le formulaire de contact accepte un sujet initial** (feature `contact`, sans la
  page).
  - Sans `initialSubject` : `contact-subject` a une valeur vide et le champ porte l'erreur
    `required` (non-régression home, les tests existants restent verts).
  - Avec `setInput('initialSubject', X)` : `contact-subject` vaut X et le formulaire n'a pas
    d'erreur sur `subject`.
  - Le sujet reste modifiable : saisie Y → modèle `subject === Y` → le payload envoyé au
    `ContactGateway` contient Y.
  - Sujet non modifié : le payload contient X.
  - Après un envoi réussi : `contact-subject` revient à X (pas à vide).
- **Tranche 7 — la demande depuis la page d'offre** : wrapper `#demande` + `ContactForm` dans
  `SiteOffer` (stub `ContactGateway` en test, comme `contact-form.spec.ts`).
  - `offer-request` porte l'id `demande` (cible du CTA de la tranche 1) et contient un `form`.
  - `contact-subject` dans `offer-request` vaut `SITE_OFFER.requestSubject` (« Site pro pour mon
    atelier »).
  - Toujours un seul `h1` sur la page complète (le `h2` du formulaire ne le concurrence pas).
  - Non testable en TestBed (le comportement par défaut des `@defer` en test est le playthrough) :
    l'absence de `@defer` et la présence du formulaire dans le HTML prérendu se prouvent en
    verify (cf. ci-dessous).
- **Tranche 8 — référencement** : `data.seo` + JSON-LD + sitemap.
  - La route `offre-site-industrie` a `data.seo.title`, `description`, `url` =
    `${SITE_IDENTITY.siteUrl}/offre-site-industrie`, `type: 'website'`.
  - `data.seo.structuredData['@graph']` contient un `Service` dont `offers` inclut un `Offer`
    `price === String(SITE_OFFER_PRICES.creationEur)`, `priceCurrency === 'EUR'`, `provider.name
    === 'Julien Nédellec'`, `areaServed` nomme Yvelines et Île-de-France ; et un `BreadcrumbList`
    à deux éléments dont le second pointe l'URL de la page.
  - `description` ne contient pas de `—`.
  - Sitemap : pas de test unitaire (le script appelle l'API prod) ; preuve en verify
    (`pnpm sitemap:build` puis `grep offre-site-industrie public/sitemap.xml`, sans committer
    le fichier régénéré).
- **Tranche 9 — le lien du pied de page** : `Footer` (nouveau `footer.spec.ts`).
  - `footer-offer-link` : `href === '/offre-site-industrie'`, texte « Sites pour ateliers ».
  - `NAV_LINKS` ne contient aucune entrée vers `/offre-site-industrie` (menu inchangé).
- **Tranche 10 — mentions légales professionnelles** : `SITE_IDENTITY.business` (déjà posé en
  tranche 4) consommé par `LegalNotice`.
  - `legal-status`, `legal-siret`, `legal-ape`, `legal-vat` affichent les valeurs de
    `SITE_IDENTITY.business`.
  - Le texte de la page ne contient plus « non professionnel ».
  - La page affiche `LEGAL_LAST_UPDATE`, différent de `'10 septembre 2026'`.
  - Le SIRET n'apparaît en dur dans aucun template : `grep -rn "937 999 860" src/app` ne renvoie
    que `site-identity.static-data.ts` (preuve en verify).

**Verify transverse (après la tranche 10, avant `code-reviewer`)** : `pnpm install
--frozen-lockfile && pnpm run build --configuration production`, puis sur
`dist/angular-portfolio-app/browser/offre-site-industrie/index.html` : présence du `h1`, de
`690`, des 5 `<details>`, d'un `<form` et de `id="demande"`, du JSON-LD `"@type":"Service"`, de
`og:title` et du `canonical` ; aucun placeholder de bloc différé (aucun `@placeholder`
vide). Réaction fonctionnelle après hydratation (CLAUDE.md workflow item 4) : saisie dans le nom
+ blur → `aria-invalid`. axe sur la page servie, deux registres de thème, viewport 375 px.

### Risques & inconnues

- **Valeur du sujet dans le HTML prérendu** : `[formField]` pose la propriété `value` ; selon le
  DOM serveur, l'attribut `value="Site pro pour mon atelier"` peut manquer du HTML statique et
  n'apparaître qu'à l'hydratation (critère « formulaire dans le HTML » tenu, préremplissage
  visible avant JS non garanti). À constater en verify ; si absent, accepter (hydratation au
  bootstrap, pas de `@defer`) plutôt que doubler `[formField]` d'un `[value]`. Le texte
  d'introduction de `ContactForm` (« sur le code de ce site ou sur mon parcours ») vise la cible
  tech, pas un gérant d'atelier : hors périmètre ici (spec = réutiliser le formulaire), à
  arbitrer par le propriétaire (un `input` d'intro serait l'évolution naturelle).
- **Landmarks préexistants** : `Home` et `LegalNotice` émettent un `<main>` dans le `<main>` du
  shell (axe `landmark-no-duplicate-main`). La page d'offre l'évite ; corriger les deux autres
  relève d'une PR séparée (la spec ne modifie que le texte de `LegalNotice`). Le lien « Contact »
  du header ramène vers la home depuis la page d'offre (comportement de `SectionScroller`),
  acceptable vu que le menu est hors périmètre.
- **Branches parallèles** : `feat/blog-editorial-layout` (#139) et `feat/projects-editorial-layout`
  (#138) sont déjà squash-mergées dans `master` (leurs refs restantes ne diffèrent de `HEAD` que
  par des retours en arrière) ; intersection réelle nulle. Cette PR ne touche ni `src/styles.css`
  ni `package.json`/lockfile ni `public/sitemap.xml` ; seuls fichiers partagés à risque :
  `app.routes.ts`, `footer.ts`, `site-identity.static-data.ts`, `contact-form.ts` (contrôler
  `git diff --name-only master...<branche>` avant merge, CLAUDE.md item 7).

## Arbitrages du propriétaire (2026-10-03)

- **FAQ** : les cinq réponses proposées au § 3 du plan sont validées telles quelles. La tranche 5
  peut passer en GREEN.
- **Texte d'introduction du formulaire** : **dans le périmètre**, rattaché à la tranche 6.
  `ContactForm` reçoit un second `input()` `intro`, dont la valeur par défaut est le texte actuel
  (« Une question sur un projet, sur le code de ce site ou sur mon parcours : je lis et je réponds
  personnellement. ») : la home ne change pas. La page d'offre passe : « Dites-moi le nom de votre
  atelier et ce que vous usinez. Je vous rappelle sous 48 h avec une première maquette. »
  Tests attendus : `data-testid="contact-intro"` affiche le texte par défaut sans binding, et le
  texte fourni avec binding.

## Plan de test

### Tranche 1 à 5 — lot A : la page présente l'offre (hero, arguments, livrables, déroulé, tarif, FAQ)

Lot joué en une invocation (arbitrage propriétaire : tranches 1 à 5 regroupées). Les sous-composants
dumb (`OfferHero`, `OfferReasons`, `OfferDeliverables`, `OfferTimeline`, `OfferPricing`, `OfferFaq`)
n'ont **pas** de spec isolé : zéro logique propre, leur rendu est prouvé outside-in par
`site-offer.spec.ts` (tous les `data-testid` du plan y sont exercés). Le contenu de `SITE_OFFER`
est épinglé côté domaine (carve-out TS pur), sinon les tests DOM, qui comparent aux constantes,
ne verrouilleraient pas la copy.

**`src/app/features/offer/domain/site-offer.static-data.spec.ts`** (TS pur, 10 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| prix | `SITE_OFFER_PRICES` | `toEqual({ creationEur: 690, maintenanceMonthlyEur: 29 })` |
| hero mot pour mot | `SITE_OFFER.hero` | `toEqual` titre, sous-titre, `ctaLabel` « Demander mon site », `priceLabel` `690 €, prix final` |
| libellés depuis la source unique | 3 libellés de prix | construits depuis `SITE_OFFER_PRICES`, espace insécable avant `€` (`690 €`, `29 €/mois`) |
| 3 arguments | `reasons` | longueur 3 ; `reasons[0]` = `Je parle votre langue` / `capacités, matières, tolérances, certifications.` |
| 9 livrables | `deliverables` (casse ignorée) | égalité ordonnée avec la liste de la Description |
| 4 étapes | `steps` verb/when | `Échanger`/`jour 1`, `Construire`/`jours 2 à 5`, `Ajuster`/`jour 6`, `Mettre en ligne`/`jour 7` |
| modalités | `pricing.*.terms`, `includes` | création : `50`, `à la commande`, `à la mise en ligne` ; maintenance : `sans engagement`, 5 inclus |
| FAQ validée | `faq` question/answer | égalité exacte avec les 5 Q/R du § 3 validées le 2026-10-03 |
| ids distincts | reasons + steps + faq | aucun `id` en double |
| aucun em-dash | toutes les chaînes de `SITE_OFFER` | aucune ne contient `—` |

**`src/app/features/offer/application/site-offer.spec.ts`** (TestBed + `provideRouter([])`, 19 tests)

| Test | Scénario | Assertions clés |
|---|---|---|
| h1 unique | rendu page | `querySelectorAll('h1')` longueur 1, c'est `offer-title`, texte = `hero.title` |
| sous-titre + prix | rendu | `offer-subtitle` = `hero.subtitle` ; `offer-hero-price` contient `hero.priceLabel` |
| CTA | rendu | `offer-cta` est un `A`, texte = `hero.ctaLabel`, `href` finit par `#demande` |
| CTA cliqué | clic + `whenStable` | fragment de `Router.url` = `demande` |
| landmarks | rendu | aucun `main` ni `footer` dans la page |
| arguments | rendu | `offer-reason` × `reasons.length`, `offer-reason-lead`/`-detail` = données, dans l'ordre |
| livrables | rendu | `offer-deliverable` × 9, textes = `deliverables` dans l'ordre |
| déroulé | rendu | `offer-step` × 4, chacun `LI` enfant d'un `OL` ; verb/when/detail = données dans l'ordre |
| pas d'« Étape » | texte de la section du déroulé | ne matche pas `/Étape/` |
| tarif création | rendu | `offer-price-creation` contient `priceLabel`, `terms` et `690 €` |
| tarif maintenance | rendu | `offer-price-maintenance` contient `priceLabel` et `29 €/mois` ; `offer-maintenance-include` = `includes` dans l'ordre |
| mention TVA | rendu | `offer-vat-mention` = `SITE_IDENTITY.business.vatMention` |
| FAQ native | rendu | `offer-faq-item` × 5, tous `DETAILS`, `open === false` ; `offer-faq-question` est le `SUMMARY` enfant direct, texte = `question` ; `offer-faq-answer` = `answer` |
| FAQ sans JS | section de la FAQ | 0 `button` |
| sections étiquetées (`it.each` × 5) | section contenant reasons / deliverables / steps / pricing / faq | `aria-labelledby` pointe un `H2` dont le texte est le titre du plan § 3 |

**`src/app/shared/identity/site-identity.static-data.spec.ts`** (1 test) : `SITE_IDENTITY.business`
`toEqual` `{ status: 'entrepreneur individuel', siret: '937 999 860 00029', ape: '62.01Z', vatMention: 'TVA non applicable, art. 293 B du CGI' }`.

**`src/app/app.routes.spec.ts`** (nouveau, 1 test) : la route `offre-site-industrie` n'a pas de
`component` eager et `await loadComponent()` résout `SiteOffer`.

**`src/app/app.routes.server.spec.ts`** (+1 test) : `offre-site-industrie` en `RenderMode.Prerender`.

Sweeps : ajout de `SITE_IDENTITY.business` balayé sur `src/**/*.spec.ts` (`legal-pages.spec.ts`,
`about-hero.spec.ts`, `home-hero-section.spec.ts` lisent des clés existantes, aucun `toEqual` sur
l'objet entier) : aucune suite existante impactée. Aucune constante recalibrée, aucun état seedé.

#### Symboles dus au GREEN (scaffold applicatif, contrat acté au Plan technique § 2-3)

- `src/app/features/offer/domain/site-offer.static-data.ts` → `SITE_OFFER`, `SITE_OFFER_PRICES`
  (+ `domain/models/site-offer.model.ts`).
- `src/app/features/offer/application/site-offer.ts` → `SiteOffer`.
- `src/app/shared/identity/site-identity.static-data.ts` → bloc `business`.

#### Preuve RED (2026-10-03)

1. **Commande test complète du profil** (`pnpm test`, 2026-10-03 18:50) : la gate build/typecheck
   échoue **uniquement** sur les symboles dus au GREEN : `Could not resolve` / `TS2307` sur
   `./site-offer`, `../domain/site-offer.static-data`, `./site-offer.static-data`,
   `@features/offer/application/site-offer` ; `TS2339 Property 'business' does not exist` (2 sites) ;
   et les `TS7006`/`TS7031` (implicit any) qui en découlent mécaniquement dans les callbacks sur
   `SITE_OFFER`. Aucune autre erreur de type, format Prettier vert.
2. **Non-régression** (`pnpm test` avec les 4 nouveaux fichiers non compilables mis de côté,
   2026-10-03 18:55) : **1 failed / 612 total**, le seul échec est l'assertion neuve
   `prerenders the site offer page` (`AssertionError: expected undefined to be 2`) ; les 611 tests
   existants sont verts.
3. **Nature des échecs** (`pnpm test` avec des stubs vides temporaires des 3 symboles, supprimés
   aussitôt, aucun fichier applicatif laissé dans l'arbre) : **25 failed / 643 total**, les 25
   échecs sont tous des `AssertionError` (aucune erreur DI, router ou harnais) ; les 611 existants
   restent verts. Les 7 nouveaux tests verts sous stub le sont parce que le stub est vide
   (`'' === ''`, longueurs à 0) ; ils discriminent avec les vraies données, épinglées par le spec
   domaine.

RED confirmé via la commande test du profil le 2026-10-03 18:55 : 32 tests neufs, 25 failed / 643 total
en échec d'assertion comportementale, tranches antérieures sans objet (premier lot).

### Tranche 6 et 7 — lot B : le formulaire accepte un sujet et une intro, la page d'offre l'embarque

Lot joué en une invocation (tranches 6 et 7, plus l'arbitrage `intro` du 2026-10-03). Attentes de
sélecteurs : `data-testid="contact-subject"` sur l'input sujet, `data-testid="contact-intro"` sur
le paragraphe d'introduction (`features/contact/application/contact-form.ts`). Côté offre, deux
champs entrent dans `SiteOfferContent` / `SITE_OFFER` : `requestSubject` et `requestIntro`.
Inputs passés par `fixture.componentRef.setInput` (convention du profil). Doublure
`ContactGateway` partagée créée : `src/app/features/contact/testing/stub-contact-gateway.ts`
(`stubContactGateway(overrides)`), réutilisée par `contact-form.spec.ts` et `site-offer.spec.ts`.

**`src/app/features/contact/application/contact-form.spec.ts`** (+7 tests, tranche 6)

| Test | Scénario | Assertions clés |
|---|---|---|
| sujet vide sans binding | aucun `initialSubject` | `contact-subject` `value === ''` ; erreurs de `subject` contiennent `required` |
| sujet prérempli | `setInput('initialSubject', 'Site pro pour mon atelier')` | `contact-subject` `value` = ce sujet ; `subject().errors()` `toEqual([])` |
| sujet non modifié envoyé | prérempli, nom/email/message saisis, submit | gateway appelé une seule fois avec `makeContactData({ subject: X })` |
| sujet réécrit envoyé | prérempli, saisie DOM (`input` event) d'un autre sujet, submit | modèle `subject` = valeur saisie ; payload unique avec ce sujet |
| reset vers le sujet initial | prérempli, envoi réussi | `contactForm().value()` `toEqual({ name: '', email: '', subject: X, message: '' })` ; `contact-subject` `value === X` |
| intro par défaut | aucun binding `intro` | `contact-intro` = texte actuel de la home, mot pour mot |
| intro fournie | `setInput('intro', …)` | `contact-intro` = texte fourni |

**`src/app/features/offer/application/site-offer.spec.ts`** (+4 tests, tranche 7 ; TestBed passe en
`DeferBlockBehavior.Manual` et fournit `stubContactGateway()`)

| Test | Scénario | Assertions clés |
|---|---|---|
| cible du CTA | rendu page | `offer-request` `id === 'demande'` et contient un `form` |
| sans `@defer` | rendu en mode Manual | `fixture.getDeferBlocks()` longueur 0 et `contact-subject` présent dans `offer-request` au premier rendu |
| sujet de l'offre | rendu | `contact-subject` (dans `offer-request`) `value === SITE_OFFER.requestSubject` |
| intro atelier | rendu | `contact-intro` (dans `offer-request`) = `SITE_OFFER.requestIntro` |

**`src/app/features/offer/domain/site-offer.static-data.spec.ts`** (+1 test) : `{ requestSubject,
requestIntro }` `toEqual` `{ 'Site pro pour mon atelier', 'Dites-moi le nom de votre atelier et ce
que vous usinez. Je vous rappelle sous 48 h avec une première maquette.' }`. Le test « aucun
em-dash » couvre les deux nouvelles chaînes sans modification.

Le « toujours un seul `h1` » de la tranche 7 est porté par le test existant `renders the offer title
as the only h1 of the page`, qui s'exécutera sur la page avec formulaire (adapté, pas dupliqué).

Sweeps : symboles de l'ancien contrat (`EMPTY_CONTACT`, texte d'intro actuel, `input#subject`,
`SiteOfferContent`) balayés sur `src/**/*.spec.ts` : seuls `contact-form.spec.ts` et
`site-offer.spec.ts` les touchent. Le test existant « reset to empty » reste valide (sans binding,
le sujet initial est `''`). `home.spec.ts` monte `ContactForm` sans binding : non impacté. Aucune
constante recalibrée, aucun état seedé dont la sémantique change.

Adaptation mécanique : `contact-form.spec.ts` (stub inline `makeGatewayStub` remplacé par l'import
de `stubContactGateway`, même comportement ; `setup()` accepte des inputs optionnels) et
`site-offer.spec.ts` (provider `ContactGateway` + `deferBlockBehavior` ajoutés au `beforeEach`) :
2 sites repointés, aucune valeur attendue modifiée.

#### Symboles dus au GREEN (scaffold applicatif, contrat acté au Plan technique § 3-4 et à l'arbitrage)

- `src/app/features/offer/domain/models/site-offer.model.ts` → `requestSubject: string`,
  `requestIntro: string` dans `SiteOfferContent`.
- `src/app/features/offer/domain/site-offer.static-data.ts` → `SITE_OFFER.requestSubject`,
  `SITE_OFFER.requestIntro`.
- `src/app/features/contact/application/contact-form.ts` → inputs `initialSubject` et `intro`
  (sans eux `setInput` lève `NG0303` au runtime).

#### Preuve RED (2026-10-03)

1. **Commande test complète du profil** (`pnpm test`, 2026-10-03 19:20) : la gate typecheck échoue
   **uniquement** sur 4 `TS2339` (`requestSubject` / `requestIntro` absents de `SITE_OFFER`, dans
   `site-offer.spec.ts` et `site-offer.static-data.spec.ts`). Aucune autre erreur de type ;
   Prettier et ESLint verts sur les fichiers de test touchés.
2. **Nature des échecs et non-régression** (`pnpm test` avec stubs temporaires : champs
   `requestSubject: ''` / `requestIntro: ''` dans le modèle et `SITE_OFFER`, inputs
   `initialSubject = input('')` / `intro = input('')` sans template, tous retirés aussitôt, arbre
   applicatif restauré à l'identique) : **11 failed / 655 total**, les 11 échecs sont des
   `AssertionError` (`expected undefined to be 'Site pro pour mon atelier'`, `expected null to be an
   instance of HTMLInputElement`, `expected undefined to be 'demande'`, …), aucune erreur DI,
   router ou harnais. Les **643 tests existants restent verts** (644 passed = 643 + 1 neuf vert sous
   stub : `speaks to a workshop owner in the form intro`, vert parce que `'' === ''` ; il
   discrimine avec la vraie valeur, épinglée par le spec domaine).

RED confirmé via la commande test du profil le 2026-10-03 19:20 : 12 tests neufs, 11 failed / 655 total
en échec d'assertion comportementale ; tranches 1 à 5 vertes.

### Tranche 8, 9 et 10 — lot C : référencement, lien du pied de page, mentions légales professionnelles

Lot joué en une invocation (tranches 8 à 10). Aucun symbole applicatif nouveau n'est référencé :
`route.data` est typé `Data` (indexé), `Footer`, `LegalNotice`, `LEGAL_LAST_UPDATE` et
`SITE_IDENTITY.business` existent ⇒ typecheck vert, aucun scaffold dû au GREEN.

**`src/app/app.routes.spec.ts`** (+8 tests, tranche 8)

| Test | Scénario | Assertions clés |
|---|---|---|
| données de route | `data` de `offre-site-industrie` | `Object.keys(data)` `toEqual(['seo'])` (pas de `preload`, route hors menu) |
| titre, url, type | `data.seo` | `route.title` et `seo.title` = `Site pro pour ateliers de mécanique \| Julien Nédellec` ; `url` = `${SITE_IDENTITY.siteUrl}/offre-site-industrie` ; `type` = `website` |
| extrait de recherche | `seo.description` | chaîne non vide, ≤ 160 caractères, sans `—` |
| graphe unique | `seo.structuredData` | `@context` = `https://schema.org` ; types du `@graph` triés = `['BreadcrumbList', 'Service']` |
| service | nœud `Service` | `serviceType` = `Création de site vitrine` ; `url` = URL de la page ; `provider` `toEqual` `{ Person, Julien Nédellec, siteUrl }` |
| zone desservie | `Service.areaServed` | `toEqual` deux `AdministrativeArea` : Yvelines, Île-de-France |
| offres | `Service.offers` | `toEqual` `Offer` Création `price: String(SITE_OFFER_PRICES.creationEur)` EUR ; `Offer` Maintenance avec `UnitPriceSpecification` `String(SITE_OFFER_PRICES.maintenanceMonthlyEur)` EUR `MON` |
| fil d'Ariane | `BreadcrumbList.itemListElement` | `toEqual` Accueil → `siteUrl`, « Sites pour ateliers » → URL de la page |

Sitemap : pas de test unitaire, conformément au plan (le script appelle l'API de prod) ; preuve en
verify (`pnpm sitemap:build`, `grep offre-site-industrie public/sitemap.xml`, fichier non committé).

**`src/app/layout/components/footer/footer.spec.ts`** (nouveau, 3 tests, tranche 9 ;
`provideRouter` avec une route `offre-site-industrie` vers un composant vide)

| Test | Scénario | Assertions clés |
|---|---|---|
| lien d'offre | rendu | `footer-offer-link` est un `A`, `href` = `/offre-site-industrie`, texte = `Sites pour ateliers` |
| place dans la nav | nav parente du lien | `aria-label` = `Liens utiles` ; `href` des liens de la nav `toEqual` `['/mentions-legales', '/confidentialite', '/offre-site-industrie']` |
| clic | clic + `whenStable` | `Router.url` = `/offre-site-industrie` |

**`src/app/layout/components/header/header.spec.ts`** (+1 test, tranche 9) : destinations de
`NAV_LINKS` `toEqual` `['/projects', '/blog', '/about', 'contact']` (menu principal inchangé,
golden de constante ; vert dès le RED, c'est une garde de non-régression, pas un test pilote).

**`src/app/pages/legal-pages.spec.ts`** (+6 tests, tranche 10). Contrat de sélecteur : chaque
`data-testid` porte l'élément qui contient **la valeur seule** (ex. `<span data-testid="legal-siret">`).

| Test | Scénario | Assertions clés |
|---|---|---|
| valeurs pro (`it.each` × 4) | `legal-status`, `legal-siret`, `legal-ape`, `legal-vat` | texte = `SITE_IDENTITY.business.status` / `siret` / `ape` / `vatMention` |
| éditeur professionnel | paragraphe parent de `legal-status`, espaces normalisés | contient `Ce site est édité par Julien Nédellec, entrepreneur individuel` (lu depuis `business.status`) |
| date de mise à jour | constante + rendu | `LEGAL_LAST_UPDATE` = `3 octobre 2026` ; la page contient `Dernière mise à jour : ${LEGAL_LAST_UPDATE}` |

Écarts assumés au plan : « ne contient plus “non professionnel” » et « différent de
`'10 septembre 2026'` » ne sont pas écrits en tests négatifs (ils testeraient le diff, pas le
comportement) ; ils sont impliqués par les assertions positives (phrase d'éditeur exacte, date
épinglée). La date est épinglée sur le jour du lot (2026-10-03) : si la fusion a lieu un autre jour,
constante et test se mettent à jour ensemble. « SIRET en dur dans un seul fichier » reste une preuve
en verify (`grep -rn "937 999 860" src/app`), comme au plan.

Sweeps : symboles de l'ancien contrat (« Informations légales », « non professionnel »,
`LEGAL_LAST_UPDATE`, `10 septembre`, `NAV_LINKS`, `footer`, `mentions-legales`,
`offre-site-industrie`, `business`) balayés sur `src/**/*.spec.ts` : aucune suite existante
n'encode l'aria-label de la nav du footer ni le texte de l'éditeur (`legal-pages.spec.ts` ne vérifie
que nom, ville, téléphone et courriel, toujours vrais) ; `header.spec.ts` ne dépend pas du footer.
Aucune constante recalibrée hors `LEGAL_LAST_UPDATE` (aucune autre occurrence), aucun état seedé.
Prettier appliqué aux 4 fichiers touchés (`legal-pages.spec.ts` contenait déjà une dérive de format
sur deux lignes existantes, reformatées sans changement de valeur).

#### Preuve RED (2026-10-03)

1. **Commande test complète du profil** (`pnpm exec ng cache clean` puis `pnpm test`, 2026-10-03
   19:28) : typecheck vert (aucune erreur `TS`), ESLint et Prettier verts sur les fichiers touchés.
   **17 failed / 673 total** (fichiers : 3 failed / 82).
2. **Nature des échecs** : les 17 sont des `AssertionError`, aucune erreur DI, router ou harnais :
   `expected [] to deeply equal [ 'seo' ]`, `expected undefined to be 'Site pro pour ateliers de
   mécanique |…'`, `expected 'undefined' to be 'string'`, `expected undefined to deeply equal [ {
   '@type': 'Offer', …(3) }, …(1) ]`, `expected null to be an instance of HTMLAnchorElement` (× 2),
   `expected undefined to be 'Liens utiles'`, `expected undefined to be '937 999 860 00029'`,
   `expected '10 septembre 2026' to be '3 octobre 2026'`, …
3. **Non-régression** : 656 passed = les **655 tests existants** + 1 neuf vert par construction (la
   garde `NAV_LINKS`). Tranches 1 à 7 vertes.

RED confirmé via la commande test du profil le 2026-10-03 19:28 : 18 tests neufs, 17 failed / 673 total
en échec d'assertion comportementale ; tranches 1 à 7 vertes.

## Journal des tranches

- **Tranches 1 à 5, lot A : la page présente l'offre** : GREEN 643 passed / 643 total · refactor : aucun (passe qualité sur le diff : réutilisation, simplification, efficacité, altitude ; seuls constats mineurs écartés : deux cartes de tarif proches mais de contenu distinct, champs `status`/`siret`/`ape` de `SITE_IDENTITY.business` exigés par le test du lot A et consommés en tranche 10, export de `SITE_OFFER_PRICES` lu par les specs et par le JSON-LD de la tranche 8)
- **Tranches 6 et 7, lot B : le formulaire accepte un sujet et une intro, la page d'offre l'embarque** : GREEN 655 passed / 655 total · refactor : aucun (passe qualité manuelle sur le diff, `simplify` indisponible en sous-agent : `_blankContact` sert à la fois de source du `linkedSignal` et de cible du reset, pas de duplication ; noms explicites ; wrapper `#demande` conservé car il porte l'ancre et le `scroll-mt-20`, pas un wrapper de rôle)
- **Tranches 8 à 10, lot C : référencement, lien du pied de page, mentions légales professionnelles** : GREEN 673 passed / 673 total · refactor : aucun (passe qualité manuelle sur le diff, `simplify` indisponible en sous-agent : URL de la page répétée dans `data.seo` comme sur les routes voisines `about`/`projects`, pas de constante à un seul site ; description de route interpolée depuis `SITE_OFFER_PRICES` pour garder une seule source du prix ; aucun nom cryptique, aucun wrapper ajouté)

## Verify

### Lot A (tranches 1 à 5), 2026-10-03

Gates : `pnpm test` 81 fichiers, 643 passed / 643 total ; `pnpm lint` « All files pass linting » ;
`pnpm run build --configuration production` exit 0, « Prerendered 15 static routes », chunk lazy
`site-offer` 10,40 kB, CSP appliquée sur 16 pages (`public/rss.xml` régénéré par le build restauré,
non committé).

HTML prérendu `dist/angular-portfolio-app/browser/offre-site-industrie/index.html` : 1 `<h1`,
`690` présent, 5 `<details`, `href="/offre-site-industrie#demande"`, « TVA non applicable »,
6 `aria-labelledby="offer-…"`, un seul `<main` (celui du shell), `<title>` = titre de route,
aucun em-dash.

Runtime (build servi en statique sur `http://localhost:4321`, navigateur intégré) :

1. Ouvrir `/offre-site-industrie/` en desktop puis en 375×812 : hero, arguments, livrables,
   déroulé, tarif (2 cartes + 5 inclus + mention TVA), FAQ (5 `details` fermés), footer du shell.
   DOM après hydratation : 1 `h1`, 1 `main`, 6 sections étiquetées, pas de débordement horizontal
   à 375 px.
2. Cliquer « Demander mon site » après hydratation : l'URL devient
   `/offre-site-industrie#demande` (la cible `#demande` arrive avec le formulaire, tranche 7).
3. Basculer le thème : registres sombre (`.app-dark`) et ivoire lisibles, aucun texte perdu.

Captures (session de verify) : hero desktop sombre, hero 375 px sombre, tarif 375 px sombre,
tarif/FAQ 375 px sombre, hero et tarif 375 px ivoire.

Console : aucune erreur imputable à la page. Erreurs présentes, **identiques sur
`/mentions-legales/` (référence)** et dues au serveur statique local : `404 /api/config` (servi
par nginx en prod) et CORS vers `api.nedellec-julien.fr` (`/cv`, `/analytics/track`) depuis
l'origine `localhost`.

Verdict : **PASS**. axe et vérification du formulaire prérendu : au verify transverse (après la
tranche 10), comme prévu au plan.

### Lot B (tranches 6 et 7), 2026-10-03

Gates : `pnpm test` 81 fichiers, 655 passed / 655 total ; `pnpm lint` « All files pass linting » ;
Prettier vert sur les fichiers touchés ; `pnpm run build --configuration production` exit 0,
« Prerendered 15 static routes », CSP appliquée sur 16 pages (`public/rss.xml` régénéré par le
build restauré, non committé).

HTML prérendu `dist/angular-portfolio-app/browser/offre-site-industrie/index.html` : 1 `<form`,
`id="demande"` et `data-testid="offer-request"` présents, 1 `<h1`, intro atelier présente
(« Je vous rappelle sous 48 h »), intro tech absente. **`value="Site pro pour mon atelier"` figure
dans le HTML statique** sur l'input `contact-subject` : le risque « préremplissage visible avant JS
non garanti » du plan ne se matérialise pas. Aucun placeholder de bloc différé (le formulaire est
rendu sans `@defer`).

Home `dist/angular-portfolio-app/browser/index.html` : `contact-subject` rendu avec `value` vide,
`contact-intro` = texte d'origine (« Une question sur un projet, sur le code de ce site ou sur mon
parcours : je lis et je réponds personnellement. »), aucune trace du sujet de l'offre.

Runtime (build servi en statique sur `http://localhost:4321`, navigateur intégré) :

1. Ouvrir `/offre-site-industrie/` après hydratation : `offer-request` a l'id `demande`, 1 `form`,
   1 `h1`, sujet = « Site pro pour mon atelier », intro = `SITE_OFFER.requestIntro`.
2. Cliquer « Demander mon site » : URL `/offre-site-industrie#demande`, la vue défile sur le
   formulaire (« Écrivez-moi. », intro atelier, sujet prérempli).
3. Réaction après hydratation : vider le sujet puis blur → `aria-invalid="true"` et « Le sujet est
   obligatoire » ; valeur restaurée ensuite. Formulaire non soumis (envoi réel vers l'API).
4. Ouvrir `/#contact` : sujet vide, intro d'origine, 1 `h1`.

Captures (session de verify) : formulaire de la page d'offre après clic sur le CTA (intro atelier,
sujet prérempli) ; formulaire de la home (intro d'origine, champs vides).

Console : aucune erreur imputable au formulaire ni à la page. Erreurs présentes, de même nature
qu'au lot A et sur la home, dues au serveur statique local : `404 /api/config`, CORS vers
`api.nedellec-julien.fr` (`/cv`, `/analytics/track`, `/projects` sur la home).

Verdict : **PASS**.

### Lot C (tranches 8 à 10), 2026-10-03

Gates : `pnpm install --frozen-lockfile` OK ; `pnpm test` 82 fichiers, 673 passed / 673 total ;
`pnpm lint` « All files pass linting » ; Prettier vert sur les fichiers touchés ;
`pnpm run build --configuration production` exit 0, « Prerendered 15 static routes », CSP appliquée
sur 16 pages.

HTML prérendu `dist/angular-portfolio-app/browser/offre-site-industrie/index.html` :
`<title>` = « Site pro pour ateliers de mécanique | Julien Nédellec » ; `meta description` (127
caractères, sans em-dash, prix lu depuis `SITE_OFFER_PRICES`) ; `og:type` `website`, `og:title`,
`og:description`, `og:url` `https://nedellec-julien.fr/offre-site-industrie`, `og:image` (repli
avatar), `twitter:card` `summary` ; `canonical` sur l'URL de la page ; **un seul**
`<script type="application/ld+json">` contenant le `@graph` `Service` (offres `690` EUR et `29`
EUR `MON`, provider, Yvelines / Île-de-France) + `BreadcrumbList` (Accueil → Sites pour ateliers).
Mentions légales prérendues : `legal-status`, `legal-siret`, `legal-ape`, `legal-vat` portent les
valeurs seules, « non professionnel » absent.

Sitemap : `pnpm sitemap:build` (15 URLs) puis `grep` : `<loc>https://nedellec-julien.fr/offre-site-industrie</loc>`
(`monthly`, `0.6`). `public/sitemap.xml` et `public/rss.xml` restaurés (`git checkout`), hors diff.

`grep -rn "937 999 860" src/app` : `site-identity.static-data.ts` (source applicative unique) et
`site-identity.static-data.spec.ts` (golden de la constante, posé au lot A).

Runtime (build servi en statique sur `http://localhost:4321`, navigateur intégré) :

1. Ouvrir `/mentions-legales/` en 375×812 : phrase « Ce site est édité par Julien Nédellec,
   entrepreneur individuel, développeur Full-Stack, domicilié à Voisins-Le-Bretonneux (78960),
   France. », liste SIRET / code APE / mention TVA / courriel / téléphone, « Dernière mise à jour :
   3 octobre 2026 ».
2. Pied de page en 375×812 : nav « Liens utiles » = mentions légales, confidentialité, sites pour
   ateliers ; le troisième lien passe à la ligne (wrap), aucun débordement horizontal. En desktop
   (961 px) les trois liens tiennent sur une ligne.
3. Cliquer « Sites pour ateliers » : navigation vers `/offre-site-industrie`, titre de route
   appliqué, 1 `h1`, 1 script JSON-LD.

Captures (session de verify) : mentions légales 375 px (éditeur pro + liste), pied de page 375 px
(trois liens, wrap).

Console : aucune erreur imputable au lot. Erreurs présentes, de même nature qu'aux lots A et B et
dues au serveur statique local : `404 /api/config`, CORS vers `api.nedellec-julien.fr` (`/cv`,
`/projects`, `/analytics/track`), d'où le toast « Erreur » générique au chargement.

Verdict : **PASS**.

### Re-verify code-reviewer (axe manquant au verify transverse), 2026-10-03

Build de prod issu des gates de revue (cache invalidé), servi en statique sur
`http://127.0.0.1:4377`, navigateur intégré, axe-core 4.10.2 chargé en same-origin (fichier
temporaire retiré ensuite), tags `wcag2a/aa`, `wcag21a/aa`, `wcag22aa`, `best-practice`.

1. `/offre-site-industrie/` (thème sombre puis ivoire, 375×667) : 1 `h1`, 1 `main`, 0 `main`
   imbriqué, 7 `section[aria-labelledby]` pointant leur titre, aucun débordement horizontal,
   sujet = « Site pro pour mon atelier », intro atelier, 1 script JSON-LD, titre de route.
2. Clic CTA : URL `/offre-site-industrie#demande`. Vider le sujet + blur : `aria-invalid="true"`,
   « Le sujet est obligatoire ».
3. `/` : sujet vide, intro d'origine, 1 `h1`, aucun lien d'offre dans le header ni la home, lien
   présent dans le footer.
4. `/mentions-legales/` : statut, SIRET, TVA lus depuis `SITE_IDENTITY.business`, « non
   professionnel » absent, « Dernière mise à jour : 3 octobre 2026 ».

axe sur la page d'offre, deux registres : **0 violation induite par la page**. Seule violation :
`region` × 2, sur le logo du shell (`app-header > div > div > a > div > span`, hors landmark),
**identique sur `/mentions-legales/`**, donc préexistante et hors diff. `color-contrast` en
`incomplete` sur `#message` (textarea, non calculable par axe). Pour mémoire, `/mentions-legales/`
porte en plus `landmark-no-duplicate-main`, `landmark-main-is-top-level`, `landmark-unique`
(préexistants, signalés aux Risques).

Console : aucune erreur Angular (aucun `NG0`, aucune erreur d'hydratation) ; uniquement les
erreurs d'environnement local déjà décrites (`404 /api/config`, CORS vers `api.nedellec-julien.fr`).
Captures : hero 375 px sombre, formulaire `#demande` en erreur de sujet 375 px (session de revue).

Verdict : **PASS**.

## Review code

**Verdict** : APPROVED
**Gates CI locaux** : tests ✅ (`pnpm test` exit 0, 82 fichiers, 673 passed / 673) / lint ✅ (`pnpm lint` exit 0, « All files pass linting. ») / build ✅ (`pnpm install --frozen-lockfile` exit 0 puis `pnpm run build --configuration production` exit 0, « Prerendered 15 static routes », CSP sur 16 pages). Rejoués après les corrections post-review, précédés de `pnpm exec ng cache clean` + `rm -rf node_modules/.vite` ; `public/sitemap.xml` et `public/rss.xml` restaurés ensuite, hors diff.
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main sur le diff de travail complet (suivis + non suivis). Archéologie : 0 hit hors ADR. Em-dash : 0 dans `src/` et dans le HTML prérendu de la page. `export default`, `effect(`, helpers zone, `innerHTML`, `console.`, `any`, `.only/.skip`, snapshot, `interface`, `@capacitor`, alias d'import : 0.
**Warnings de gate** : (b) préexistant hors diff : `pnpm install` « Ignored build scripts: @parcel/watcher, @sentry/cli, lmdb » (aucun changement de `package.json`/lockfile). Test, lint, build : aucun warning.
**Rendu compilé** : ✅ (aucun composant à sélecteur attribut ; inspection visuelle 375×667, deux thèmes ; HTML prérendu : 3 `offer-reason`, le troisième « Sans surprise : un site rapide, lisible sur téléphone, sans abonnement caché. »)
**Preuve de verify runtime** : ✅ (lots A à C + re-verify de revue, axe inclus ; corrections post-review limitées à de la copy statique, à un import de test et à l'ordre des membres, revérifiées sur le HTML prérendu : 1 `h1`, 1 `main`, 1 `form`, `value="Site pro pour mon atelier"`)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅ (Description alignée sur la nouvelle formulation du troisième argument, cf. Corrections post-review)

**Tests notables** :
- ✨ `src/app/features/offer/domain/site-offer.static-data.spec.ts:38` : les trois arguments sont désormais épinglés (`lead` + `detail`), la copy ne peut plus dériver silencieusement.
- ✨ `src/app/features/offer/application/site-offer.spec.ts:171` : `getDeferBlocks()` à 0 en `DeferBlockBehavior.Manual` + présence du champ au premier rendu, preuve directe que le formulaire n'est pas différé.
- ✨ `src/app/features/contact/application/contact-form.spec.ts:265` : le reset après succès est vérifié sur le modèle et sur le DOM, ce qui verrouille le `_blankContact` du `linkedSignal`.

**Duplication / dérivation** (advisory, non bloquant) :
- ⚠️ `src/app/app.routes.ts` (route `offre-site-industrie`) : `${SITE_IDENTITY.siteUrl}/offre-site-industrie` × 3 et le titre × 2. Conforme au gabarit des routes voisines (`about`, `projects`) : non bloquant.

**Historique** : premier passage REJECTED (3 points : copy du troisième argument et épinglage des trois arguments, alias `makeGatewayStub`, ordre des inputs de `ContactForm`), tous soldés et revérifiés (cf. Corrections post-review). Hors périmètre, renvoyé à un ticket séparé par la session principale : violation axe `region` du header du shell et `<main>` imbriqués de `Home`/`LegalNotice` (préexistants).

## Corrections post-review (2026-10-03)

Faites par l'orchestrateur, hors sous-agents (corrections mécaniques, aucune nouvelle logique) :

1. Troisième argument reformulé pour lire le modèle « titre : détail » : `lead` « Sans surprise »,
   `detail` « un site rapide, lisible sur téléphone, sans abonnement caché. ». La Description est
   alignée. Les trois arguments sont épinglés (`lead` + `detail`) dans
   `site-offer.static-data.spec.ts`.
2. Alias `makeGatewayStub` retiré de `contact-form.spec.ts` : appel direct à `stubContactGateway`.
3. `ContactForm` : inputs `initialSubject` et `intro` remontés juste après les dépendances injectées.

Preuve : `pnpm test` 673/673, `pnpm lint` sans erreur.
