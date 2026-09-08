# Home — visibilité SSR & hiérarchie de la landing

> Créé le 2026-09-06. Attaque prévue le 2026-09-07.
> Origine : constat analytics « les visiteurs ne dépassent pas la home ».
> Le plan initial (screenshots projets + Plausible + 1 CTA) a été révisé après lecture du code :
> 2 étapes sur 4 étaient déjà faites ou redondantes, et le bug réel n'y figurait pas.

---

## Contexte — ce qui est DÉJÀ en place (ne pas refaire)

- [x] Projets sur la home : `home-projects.ts` + `ProjectCard` (image `NgOptimizedImage` `fill`, catégorie, tags, liens live/repo)
- [x] Tracking projet : `trackProjectClick` dans `ProjectCard`
- [x] Analytics self-hosted : `AnalyticsGateway` (referrer, page_duration, bounceRate, avgDuration, sessions) + dashboard admin lisant `url` / `referrer` / `country` / `browser` / `os` (`admin-analytics.ts:267-299`)
  → **Ne PAS déployer Plausible/Umami : redondant.**
- [x] SSR actif : `outputMode: "server"` + `provideClientHydration(withIncrementalHydration(), withEventReplay())`
- [x] Hiérarchie visuelle des CTA (primary / outlined / text) — le problème n'est pas le poids, c'est la redondance avec la nav

---

## Diagnostic

### 1. Bug SSR (bloquant, cause racine)

`home.ts:69` et `home.ts:88` utilisent `@defer (on viewport; ...)` **sans trigger `hydrate`**, alors que
`withIncrementalHydration()` est actif et que `about.ts:39+` utilise correctement `@defer (hydrate on viewport)`.

Conséquence : côté serveur, ces blocs rendent leur `@placeholder` → **la section projets et le formulaire
de contact ne sont pas dans le HTML SSR de la home**. Crawler, aperçu de partage, no-JS : deux `<div>` vides
(`h-64`, `h-96`).

Doctrine violée — `Méthode — Construire un frontend Angular de A à Z.md`, étape 7 :
> Page publique dont le référencement compte → SSR/SSG. *Piège si posé trop tard : contenu posé en
> client-only, invisible aux crawlers.*

Et `CLAUDE.md` : *« @defer — Jamais pour : above-the-fold, contenu principal d'une route, SEO critique sans hydrate »*.
La section projets est le contenu principal de la route par défaut → 2 critères sur 3 violés.

### 2. Layout : les projets sont hors champ par construction

`home.ts:20` — `min-h-[calc(100svh-5rem)] mt-20` verrouille hero + 3 cartes d'expertise sur **100 % du
premier écran**. Aucune réécriture de contenu ne corrige ça.

**P0 et P1 sont couplés** : si la 1ʳᵉ carte projet remonte above-the-fold, `on viewport` se déclenche au
chargement → le `@defer` ne diffère plus rien et ajoute un aller-retour de chunk sur le chemin critique
de la route eager. Trancher trigger + layout dans le même mouvement.

**Ne pas supprimer le `@defer`** : `HomeProjects` et `ContactForm` n'étant référencés que dans des blocs
`@defer`, le compilateur les sort du bundle initial. Les retirer ferait entrer `ProjectCard` +
`NgOptimizedImage` + le formulaire dans le chunk eager de `path: ''`.

### 3. CTA : doublons de la nav

`nav-items.ts:18-21` expose déjà Projets / Blog / À propos / Contact. Les 3 CTA du hero
(`home-hero-section.ts`) répètent 3 des 4 liens trois lignes plus bas — zéro capacité de navigation ajoutée.

### 4. Accroche : le différenciateur est enterré

- `home.static-data.ts:6` — le `h1` est **« Développeur Angular »** : intitulé générique, rendu en 8xl.
- `home.static-data.ts:8` — la moitié de la tagline est une **demande** (« Je recherche un CDI en IDF… »),
  alors que le badge `availability` porte déjà l'info.
- Le seul différenciateur réel — `profile.static-data.ts:23`, *« 20 ans dans l'industrie m'ont appris ce
  qu'est vraiment la rigueur »* — est sur `/about`, pas sur la page qui encaisse le trafic.
- Incohérence à aligner d'un coup : « 3 ans » (home) vs « 20 ans » (`/about` + `app.routes.ts:52`).

### 5. Trou de test

`home.spec.ts` ne rend **aucun** des deux blocs `@defer` — il ne teste que l'API de classe (`bundle`,
`expertises`, `eagerSections`). Rien ne prouve aujourd'hui que la section projets s'affiche.

---

## Lot 1 — SSR + layout (haute valeur, faible risque)

Spec cible : `specs/003-home-ssr-visibility.md`
Cycle : `architect` (Plan technique) → `qa` (RED) → `angular-expert` (GREEN) → `code-reviewer` (gate)

- [x] **P0** — `hydrate on viewport` sur les 2 blocs `@defer` de `home.ts:69,88` — **PROUVÉ**
      (`project-card-link` 0→2, `<app-contact-form` 0→1, `<form>`+3 `<input>` servis,
      placeholders disparus, HTML 52→84 ko ; chunking intact : 0 marqueur dans `main-*.js`,
      hashs de chunks lazy identiques au baseline, +177 o sur le bundle initial)
  - Forme cible : `@defer (hydrate on viewport; on viewport; prefetch on idle; when eagerSections())`
  - Envisager `hydrate on interaction` sur le bloc contact (`withEventReplay()` déjà actif → clic rejoué)
  - ⚠️ Vérifier que `ContactForm` n'accède pas à `window` / `localStorage` sans garde : il va désormais
    être rendu côté serveur. **Seul risque réel du lot.**
- [x] **P0bis** — tests de rendu des blocs dans `home.spec.ts` — 6 `it` ajoutés (4 RED → verts,
      2 de non-régression), pilotage `Manual`, une fixture par scénario. **407/407** au vert.
  - Pilotage **Manual** obligatoire : `fixture.getDeferBlocks()` + `render(DeferBlockState.Complete)`
  - `Control Flow.md` : *« Ne jamais tester en mode Playthrough — sous jsdom, `on viewport` échoue
    silencieusement en l'absence d'IntersectionObserver, le placeholder reste sans qu'aucune assertion
    ne le détecte. »*
  - Les transitions ne rembobinent pas → **une fixture par scénario**
- [~] **P1** — lock `min-h-[calc(100svh-5rem)]` supprimé + paddings réduits (≈ 112 px dégagés).
      **Vérifié sur le code, PAS vérifié visuellement** : aucun outil navigateur dans la session
      (ni playwright/puppeteer, ni extension Chrome). Validation visuelle à faire sur
      `http://localhost:4200/`. Levier « réduire les cartes d'expertise » **rejeté** (arbitrage
      2026-09-07 : pas de troncature éditoriale dans un lot SSR/layout).
- [ ] Nettoyage candidat **après mesure de P0** (hors lot) : le hack `when eagerSections()` du
      `SectionScroller` perd sa raison d'être une fois le contenu réellement rendu côté serveur

### Preuve exigée (P0 n'est PAS prouvable en Vitest/jsdom)

```bash
pnpm build && node dist/ng-portfolio-app/server/server.mjs
curl -s localhost:4000/ | grep -c 'data-testid="project-card-link"'   # 0 avant, N après
```

P1 : capture 1440×900 + 390×844.

---

## Lot 2 — hiérarchie & mesure

- [x] **P3** — 1 CTA primaire dans le hero (« Voir les projets »), « Me contacter » et « En savoir
      plus » supprimés avec leurs méthodes (`home-hero-section.ts`) — **PROUVÉ** sur le prérendu
      (1 seul `app-button` dans la section hero, `jsaction="click:;"` → replay armé)
  - Non-régression nav : `header.spec.ts` vérifie que **toutes** les entrées de `NAV_LINKS` restent
    desservies (route → `<a href>`, section → bouton), piloté par la constante, pas par de la copie
  - `SectionScroller` n'est plus injecté par le hero : le seul chemin vers la section contact est la nav
- [x] **P4** — événement `cta_click` : `analytics.types.ts` (union `TrackPayload['type']`),
      `analytics.gateway.ts`, `http-analytics.gateway.ts` + 2 specs (`HttpTestingController` : émission
      `{ type:'cta_click', entityId, entityTitle }`, no-op SSR)
  - Forme choisie : `trackCtaClick(ctaId, label)` calqué sur `trackProjectClick` — `entityId` porte
    l'emplacement (`home_hero_projects`), donc un futur `/stats/cta` se lit comme `/stats/projects`
  - ⚠️ **Aucune mesure tant que l'API (repo séparé) n'accepte pas `cta_click`** : le back valide
    probablement `type` contre un enum → 400, et `fireAndForget` avale l'erreur (`catchError(() => EMPTY)`).
    Le front est prêt ; le lot ne livre pas la lecture. Reste à faire côté API : accepter le type,
    puis exposer un compteur (`StatsOverview.ctaClicks` ou `/stats/cta`) pour le dashboard admin.
  - Seul trou de mesure réel : impossible aujourd'hui de connaître le taux de clic home → /projects par source
  - Note YAGNI : `AnalyticsGateway` est une `abstract class` à **une seule** implémentation — ce que
    `Méthode…md` liste dans les pièges. On ajoute à l'existant, **on ne refactore pas l'abstraction ici**.

---

## Lot 3 — éditorial

**Cible arbitrée le 2026-09-06 : industrial tech en priorité, sans fermer fintech/greentech.**
Conséquence de formulation : les 20 ans d'industrie se posent comme **preuve de rigueur** (lisible par
tous les secteurs), jamais comme verrou sectoriel. Pas de nom de secteur cible dans le hero — la porte
reste ouverte, et c'est le badge `availability` qui porte la demande.

Contraintes techniques du hero (à respecter par toute formulation) :
- `name` = le `<h1>`, rendu en `text-5xl md:text-7xl lg:text-8xl` → **~20 caractères** (l'actuel « Développeur Angular » en fait 19)
- `tagline` : `home-hero.ts` splite sur `/(Angular|NestJS)/` → ces deux mots écrits littéralement
  sont **surlignés en `--color-primary` gratuitement**. Aucun autre mot ne l'est.
- `availability` : badge à pastille verte, `text-xs` → 4-6 mots maximum

- [x] **P2** — réécrire le hero : `home.static-data.ts:6-9` — **RÉVISÉ après validation visuelle
      du 2026-09-07** : l'option A (nom en `h1`, tagline de 158 car.) rendait 4 lignes en `text-3xl`,
      plus lourdes que le `h1` lui-même. Arbitrage utilisateur sur capture : `h1` = « Développeur
      Angular », tagline courte centrée sur le niveau technique.

  ```ts
  name: 'Développeur Angular',
  tagline:
    'Angular, NestJS, PostgreSQL, Docker : je mène une application du composant à la mise en production.',
  availability: 'Ouvert aux opportunités · CDI · Île-de-France',
  ```

  - 99 caractères → 2 lignes, `Angular` et `NestJS` toujours surlignés, « 3 ans » toujours absent,
    la demande CDI reste dans le badge
  - Le garde-fou `app.routes.spec.ts` (le `h1` et le `Person` schema.org nomment la même personne)
    est **supprimé** : il posait une contrainte qui n'existe pas — un `h1` n'a pas à répéter le `name`
    d'une métadonnée `Person`
  - Constat visuel restant, **non traité** : le CTA unique flotte au centre d'un écran large, et les
    3 cartes d'expertise occupent le premier écran avec de la prose invérifiable, à la place des
    projets (cf. P2ter, dont la capture confirme que c'est le poste dominant)

- [x] ~~**P2** — version initiale~~ — **PROUVÉ** sur le prérendu
      (`<h1>` = « Julien Nédellec », `Angular` et `NestJS` surlignés, badge `availability` porte le CDI)

  **Formulation retenue le 2026-09-06 (option A — « nom + preuve ») :**

  ```ts
  export const STATIC_HERO: HeroData = {
    id: 'c64a566f-9e53-44f9-96de-f938f0166b9c',   // inchangé
    name: 'Julien Nédellec',
    tagline:
      "Développeur Angular / NestJS. 20 ans dans l'industrie avant le code : je conçois, déploie et maintiens mes applications en production, sur ma propre infrastructure.",
    availability: 'Ouvert aux opportunités · CDI · Île-de-France',
  };
  ```

  Ce que la formulation règle, et qu'il ne faut pas défaire en la retouchant :
  - le `<h1>` porte le nom, ce que `structuredData` affirme déjà (`'@type': 'Person'`,
    `name: 'Julien Nédellec'` dans `app.routes.ts`) alors que le `h1` disait autre chose
  - « 3 ans » disparaît sans mensonge → incohérence avec `/about` et `app.routes.ts:52` résolue
  - la demande CDI quitte la tagline pour le badge `availability`
  - « Angular » et « NestJS » restent littéraux → surlignage `--color-primary` automatique
  - « 20 ans dans l'industrie » se lit *rigueur* pour la fintech et *domaine* pour l'industrial tech
    → porte ouverte conservée
  - « sur ma propre infrastructure » est vérifiable par le site lui-même

- [x] **P2bis** — aligner le SEO de la route home (`app.routes.ts:16-20`), **même commit que P2** — **PROUVÉ**
      (`<meta name="description">` et `keywords` du prérendu portent la nouvelle formulation)
  - La description actuelle finit par « **disponible pour vos projets** » → lecture freelance,
    alors que la recherche est un CDI. Bloquant : contredit le badge `availability` de P2.
  - Ajouter l'angle industrie dans `description` + `keywords`
  - Élargissement assumé : `src/index.html` portait la **même** lecture freelance (« Disponible pour
    vos projets web ») dans son `<meta name="description">` de repli — alignée sur la description de
    route dans le même commit. `og:`/`twitter:` non touchés : le service `Seo` les réécrit par route.
- [ ] **P2ter** _(optionnel, à trancher après P2)_ — les 3 cartes d'expertise
  (`home.static-data.ts:12-34`) restent de la prose générique (« architecture signals »,
  « validation stricte des données »). Candidates à une passe « preuve » plus tard — **hors lot**,
  ne pas élargir P2.

---

## Explicitement hors périmètre

- Screenshots de projets — déjà en place
- Plausible / Umami — redondant avec l'analytics maison
- Refonte graphique, animations, blog
- Refactor de l'abstraction `AnalyticsGateway`

## Après livraison

Deux semaines de mesure avant de retoucher quoi que ce soit. L'outil existe déjà.

---

## Review

_(à remplir en fin de lot)_

---

# Responsive — toutes tailles d'écran (2026-09-08)

> Origine : capture iPhone de la home — la carte « Frontend moderne » dépassait dans le premier
> écran mobile. Audit responsive complet (agent Explore) + intake AAK `specs/005-intake-audit-repo.md`.
> Preuves : captures Playwright 375/390/768/1280 (mock `/api/**`), `scrollWidth === clientWidth`
> sur toutes les pages, 414/414 tests, lint 0 erreur, build SSR 5 routes prerendered.

## Home (cause du ticket)
- [x] `home-hero-section.ts` : hero = `min-h-[calc(100svh-5rem)]` + `justify-center` **sous md**
      seulement (md+ garde hero + cartes dans le premier écran, décision #77). Carte à +32px sous le pli
      sur iPhone SE et 15 (mesuré), tablette/desktop inchangés.
- [x] Gouttières hero alignées sur `page-container` (`px-4 sm:px-6 lg:px-8` au lieu de `px-6`)
- [x] Blobs ambiants réduits sous md (18/14rem, blur 60px) — coût repaint mobile
- [x] Placeholders `@defer` et skeleton alignés (`px-4 sm:px-6`, `gap-6 md:gap-8`)

## Pages publiques
- [x] `login` / `two-factor-verify` / `404` : centrage sous le header fixe (`calc(100svh-5rem)` + `mt-20`),
      suppression du `<main>` imbriqué dans celui de `app.ts`
- [x] `about.ts` : `pt-15` (60px) → `pt-20` (header 80px) ; gaps mobiles `gap-6`
- [x] `project-detail-nav.ts` : grille 2 colonnes sous sm, « Tous les projets » en dernière ligne
- [x] `blog-detail.ts` : `page-container` + `max-w-3xl` en conflit → conteneur explicite ; `prose` protégé
      (`break-words`, tables scrollables) ; liens tags 44px
- [x] `contact-form.ts` : padding vertical inversé (`py-16 md:py-10`) → `py-12 md:py-20`, `page-container`
- [x] `styles.css` : `form-input` / `app-select` en `text-base sm:text-sm` (zoom iOS < 16px) + `min-h-11`,
      `min-w-44` retiré du défaut select
- [x] `header.ts` : logo `text-xl sm:text-2xl`, gaps réduits sous sm (marge sur 320px)
- [x] `drawer.ts` + `index.html` : `viewport-fit=cover`, safe-area, `overscroll-contain`
- [x] `toast.ts` : `100vw` (inclut la scrollbar) → `left-4 right-4 ml-auto`
- [x] `about-stack` (`text-[10px]` → `text-xs`, 2 col < 400px), `about-highlights` / `about-diploma` (`text-sm`)

## Admin (débordements horizontaux à 375px)
- [x] `admin-blog.ts` : table sans `admin-table-shell` → utilities admin ; `p-6` doublon retiré
- [x] Barres d'actions non wrappables : `admin-projects`, `admin-analytics-header`, `admin-table`,
      `admin-messages`, `admin-settings`, `two-factor-disable-form` (boutons empilés sous sm)
- [x] `admin-cv.ts` : grille 1 col mobile, `break-all` sur le nom de fichier, boutons 44px

## Hors lot (signalé, non corrigé)
- [ ] CSP `index.html:56` : `script-src 'self'` + `frame-src 'none'` bloquent Giscus
      (`blog-comments.ts` charge `https://giscus.app/client.js`) — les commentaires ne peuvent pas s'afficher
- [ ] Angular 22 : la doc officielle (MCP `get_best_practices`) dit de ne plus écrire `OnPush`
      explicitement (défaut v22) — CLAUDE.md et `project-profile.md` (« Angular 21 ») à mettre à jour
- [ ] Cibles tactiles admin < 44px restantes (`admin-tags-selector`, `admin-nav` collapse, checkbox
      inline-form, `file-dropzone` « Remplacer », `admin-dashboard` « Tout voir »)
