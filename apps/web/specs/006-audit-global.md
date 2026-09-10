# 006 — Audit global : technique, sécurité, présentation

> Réalisé le 2026-09-10 sur `ng-portfolio-app` (master `a3b25f8`), `nest-portfolio-app` (master `e2818e4`),
> la prod (`nedellec-julien.fr`, `api.nedellec-julien.fr`, VPS Dokploy) et le profil GitHub `j-ned`.
> Méthode : trois audits parallèles (suivi de la spec 005, API NestJS, cohérence de présentation)
> + contrôles directs en prod (Lighthouse mobile sur 6 pages, headers, DNS mail, TLS, GitHub, Dependabot).
> Aucun fichier modifié par l'audit. Les findings de la spec 005 gardent leur numéro `Fxxx` ; les nouveaux
> sont `Nxx` (front), `Hx/Mx/Bx` (API), `Px` (présentation).

---

## 1. Synthèse — les 12 points qui comptent

| # | Impact | Domaine | Constat | Où |
|---|---|---|---|---|
| 1 | **Critique** | Perf/SEO | `/blog` : LCP **24,8 s**, perf Lighthouse **69**. Les couvertures d'articles sont des JPG bruts de 2816×1536 (2,8 Mo et 1,6 Mo) affichés en 356 px. L'API ne convertit ni ne redimensionne aucune image (les visuels projets sont en AVIF 32 Ko uniquement parce qu'ils ont été uploadés ainsi). Le premier visuel est en `loading="lazy"`. | API `blog.service.ts:158` (upload brut), front `blog-post-card.ts` (pas de `priority`) |
| 2 | **Haute** | SEO/SMO | `og:image` pointe sur `/photoProfil.webp` → **404 sur toutes les pages**. Aucun partage LinkedIn/X n'a de visuel. | `seo.ts:39,47` |
| 3 | **Haute** | Sécurité | Mail de contact : `{{name}}`, `{{email}}`, `{{subject}}`, `{{message}}` injectés **sans échappement** dans le HTML du mail admin (phishing brandé, pixel de tracking). Le mail de confirmation part vers **n'importe quelle adresse** (spam brandé, réputation du domaine). | API `mailer.utils.ts:8-12`, `contact.service.ts:105-121` |
| 4 | **Haute** | Sécurité/SEO | `security.txt` sur un domaine qui n'existe pas (`julien-nedellec.fr`, NXDOMAIN). | `public/security.txt` |
| 5 | **Haute** | Technique/SEO | nginx sert la **home prérendue** (100 Ko, hydratation, `<title>Accueil`, canonical `/`) pour `/login`, `/admin/**` et toute URL inconnue, au lieu de `index.csr.html`. Les 404 sont des **soft-404 en 200** (contenu dupliqué indexable). | `Dockerfile:64` |
| 6 | **Haute** | Présentation | Disponibilité contradictoire : site « Ouvert aux opportunités · CDI », blog « en recherche active », CV « en CDI industriel à temps plein, disponible sous préavis 1 mois ». Titre de poste flottant : h1 home « Développeur Angular », ailleurs « Full-Stack ». | `home.static-data.ts:5,10`, `about-hero.ts:36`, `cv.pdf` |
| 7 | **Haute** | Présentation | Stacks projets contradictoires CV ↔ site : DashFlow « Hono » (CV) vs « NestJS/Drizzle » (site) ; CandiDash « Prisma » (CV) vs « Drizzle » (site), « extension Chrome » (blog) vs « app Angular » (fiche). Diplôme ALT-RH avec deux intitulés. | CV, `/api/projects`, article blog, `profile.static-data.ts:42` |
| 8 | **Haute** | Légal | Aucune mention légale ni politique de confidentialité, alors que le site collecte : contact (DB + 2 mails), analytics (hash `ip|ua|jour`, pays geoip, 30 j), Giscus. Obligation LCEN + RGPD art. 13. | footer, routes |
| 9 | **Haute** | Présentation | README front obsolète (Angular 21, PrimeNG, module Booking inexistant, captures 404, clone `djoudj-dev`, « 13 tables », purge « 90 jours »). GitHub : aucune description ni licence sur les deux repos, `homepage` du front = ancienne URL github.io, 6 repos épinglés sans description. | `README.md`, GitHub |
| 10 | **Moyenne** | Sécurité | API : logout sans révocation (JWT 7 j reste valide), brute force TOTP limité par IP seulement, `pnpm add` non épinglé dans l'image prod, **zéro test de controller/e2e** et **pas de CI** (Dependabot désactivé, branche non protégée). | `auth.controller.ts:88`, `throttle.ts:19`, `Dockerfile:32` |
| 11 | **Moyenne** | Technique | #97 met en cache un **échec** de `GET /projects` pour toute la session (`catchError → of([])` + `shareReplay`) : une panne transitoire = skeleton perpétuel partout jusqu'au rechargement. | `http-projects.gateway.ts:27-34` |
| 12 | **Moyenne** | A11y | Contraste : tags « Parcours » `text-amber-700` sur fond clair = **4,14–4,48 < 4,5** (régression introduite par #103 aujourd'hui) ; libellé `text-muted/70` sur les fiches projet = 3,48. Lien logo du header : `aria-label` ≠ texte visible. `alt` redondants sur les icônes de stack (about). | `blog-tag-palette.ts:19`, `project-detail.ts`, `header.ts:36`, `about-stack.ts` |

---

## 2. Mesures en prod

### Lighthouse mobile (simulé, 2026-09-10)

| Page | Perf | A11y | BP | SEO | LCP | TBT | CLS | Échecs binaires |
|---|---|---|---|---|---|---|---|---|
| `/` | 87 | 100 | 96 | 100 | 3,2 s | 220 ms | 0 | 401 console, label logo |
| `/about` | 92 | 99 | 96 | 100 | 2,4 s | 240 ms | 0,009 | + `alt` redondants |
| `/projects` | 89 | 100 | 96 | 100 | 3,4 s | 110 ms | 0 | 401 console, label logo |
| `/blog` | **69** | 96 | 96 | 100 | **24,8 s** | 230 ms | 0 | + contraste tags |
| `/blog/:slug` | 93 | 96 | 96 | 100 | 2,4 s | 180 ms | 0 | + contraste tags |
| `/projects/dashflow` | 95 | 96 | 96 | 100 | 2,3 s | 120 ms | 0 | + contraste `text-muted/70` |

- **401 en console sur chaque page** : `GET /api/auth/me` part pour tout visiteur anonyme (`auth-store.ts:129`). Une erreur réseau visible dans DevTools et un appel API inutile par visite. Ne restaurer la session que si un indice local existe (flag `localStorage` posé au login, effacé au logout).
- `GET /api/cv` et `GET /api/config` partent aussi sur chaque page publique.
- JS inutilisé : 68 Ko sur `main`, 29 Ko sur le premier chunk. Images projets AVIF servies 2× plus grandes que l'affichage (pas de `ngSrcset`, pas d'`IMAGE_LOADER`).
- Cache des images API : `max-age=86400` alors que les clés sont des UUID immuables → `max-age=31536000, immutable`.

### Infra et sécurité en prod

| Contrôle | Résultat |
|---|---|
| Headers front | HSTS 2 ans, `X-Frame-Options DENY`, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP ✅. CSP complète (hashes) dans la `<meta>`. **Perdus sur les assets** (`location ~* \.(js|css…)` redéclare `add_header`, N08). |
| Headers API | HSTS 1 an, `nosniff`, `X-Frame-Options SAMEORIGIN`, COOP, CORS credentialisé sur origines explicites ✅. Swagger fermé (404) ✅. `/api/health` public expose `version: "dev"`, uptime, latence DB. |
| Redirections | `http://` → 301 https ✅, `www` → 301 apex ✅. |
| 404 | `/does-not-exist` → **200** (soft-404). |
| TLS | Let's Encrypt, expire 2026-10-25 (renouvellement Traefik) ✅. |
| DNS mail | SPF `-all` Infomaniak ✅, DMARC `p=reject` ✅, DKIM **non trouvé** sur les sélecteurs usuels (à vérifier chez Infomaniak : avec `p=reject`, un DKIM absent ou cassé = mails de contact en spam/rejet). |
| Secrets | Aucun `.env` ni clé dans l'historique des deux repos ✅. |
| Dependabot | Front : **22 alertes ouvertes** (12 high) — toutes en scope `development` (svgo, postcss, xmldom, hono, undici…) ; `pnpm audit --prod` = 0. API : Dependabot **désactivé** ; `pnpm audit --prod` = 1 low (`body-parser`). |
| Protection de branche | Front : 2 checks requis, admins inclus ✅, 0 review. API : **aucune protection**, **aucun workflow CI**. |
| GitHub repos | Description vide sur les 2 repos, pas de `LICENSE`, `homepage` front = `j-ned.github.io/ng-portfolio-app/` (obsolète). Profil : nom « J - Ned », bio et README cohérents avec le site (Full-Stack, 20 ans, CDI IDF). Repos épinglés sans description ; `le-vieu-comptoir` (typo assumée ?). |

---

## 3. Technique — front (`ng-portfolio-app`)

### 3.1 Suivi de la spec 005 (38 findings)

**13 corrigés** (F002 XSS markdown, F004 prerender projets, F005 CSP Giscus, F006/F007 contact, F008 happy-dom, F010, F015, F018, F022 CI, F029, F038), **1 caduc** (F001), **4 partiels** (F009, F016, F017, F037), **18 ouverts**, **2 régressés** :

- **F024 régressé** : 7 → 15 blocs `/** */` hors spec (dont `analytics-device-exclusion.ts`, `parse-markdown.ts`).
- **F032 régressé** : 3 liens vers la même URL par carte blog (image, « +N », titre).
- Ouverts notables : **F003** (liste vide = erreur, aggravé par N02), **F011** (`effect()` + `localStorage` dans le header), **F012** (`effect()` mutant le DOM dans le drawer), **F013** (paginator sans `flex-wrap`), **F014** (`npm test` dans le hook pre-commit), **F016** (aucun `@media (forced-colors)`), **F017** (cibles < 44 px : `tag.ts`, 404, « Effacer », `project-card`, footer), **F019** (`aria-live` englobant un `role="alert"`), **F020** (année du footer figée au prérendu, `SectionScroller` mort), **F023** (`subscribe` sans `takeUntilDestroyed`), **F026** (`void router.navigate`), **F027** (tables markdown), **F028** (badge inline vs `AppTag`), **F030** (filtre projets : flash + accent manquant), **F034** (aucun `priority` sur `/projects`), **F035/F036** (flex sans wrap, `truncate` sans `title`).

### 3.2 Dette neuve depuis le 2026-09-08

| ID | Impact | Constat | Correction |
|---|---|---|---|
| N01 | Haute | Fallback nginx = home prérendue pour CSR et 404 (cf. synthèse 5). `index.csr.html` (16 Ko) existe et n'est pas utilisé ; il n'est pas non plus haché par `apply-csp-hashes.mjs:31`. | `try_files $uri $uri/index.html /index.csr.html;` + hacher `index.csr.html` + prérendre `/404` et `error_page 404 /404/index.html`. |
| N02 | Haute | Échec de `GET /projects` mis en cache pour la session (#97). Aucun test d'erreur dans `http-projects.gateway.spec.ts`. | Ne pas cacher l'échec (`throwError` ou `retry({count:2})` + état d'erreur), test « erreur puis nouvel abonné → nouvelle requête ». |
| N03 | Moyenne | Palette tags en couleurs Tailwind brutes hors `@theme` ; amber-700 sous 4,5:1 en clair. | Tokens `--color-tag-*` OKLCH dans `@theme`, amber → nuance 800 en clair, vérifier les 2 thèmes. |
| N04 | Moyenne | `/blog?tag=X` : 43 URLs indexables, canonical avec query string. | Canonical sur le pathname, ou `noindex,follow` quand `tag()` est défini. |
| N05 | Moyenne | `application` → `infra` (`parse-markdown`) et admin → application blog (`blog-tag-palette`). | Token/gateway câblé dans `app.config.ts` ; palette dans `shared/ui/`. |
| N06 | Basse | Hachage CSP des `styles:` garanti seulement si chaque composant stylé apparaît dans une page prérendue ; aucun test. | Test CI bundle ↔ hashes, ou garde documentée. |
| N07 | Basse | `script-src-attr 'unsafe-hashes'` ignoré par Safari < 15.4 → CSS non bloquant refusé. | Documenter, ou charger le CSS sans `onload`. |
| N08 | Basse | `add_header` redéclaré dans la `location` assets → headers de sécurité perdus sur les assets. | Snippet d'en-têtes commun en `include`. |
| N09 | Basse | URL API dupliquée 6 fois, host Sentry en dur dans la CSP. | Source unique (`src/environments` ou constante partagée). |
| N10 | Basse | Actions CI non épinglées sur SHA. | Épingler. |
| N11 | Basse | `beforeunload` pour `page_duration` : non fiable sur iOS. | `pagehide` + `visibilitychange`. |

### 3.3 Gates et dépendances

`pnpm test` 486/486 · `pnpm lint` 0 warning · `pnpm audit --prod` 0 · Majeures en retard : TypeScript 7, Vitest 5, svgo 4, Font Awesome 7 (PR dédiées, vérifier le support `@angular/build`).

---

## 4. Sécurité et technique — API (`nest-portfolio-app`)

**Socle solide à conserver** : argon2id, HS256 épinglé, révocation par `tokenVersion`, challenge 2FA à scope dédié, 5 req/min sur login et 2FA, `whitelist + forbidNonWhitelisted`, `ParseUUIDPipe`, validation de type par magic numbers sur les uploads, SQL brut paramétré, helmet, Swagger fermé, Sentry sans PII, Docker non-root + tini + healthcheck, analytics sans cookie ni IP persistée.

| ID | Impact | Constat | Correction |
|---|---|---|---|
| H1 | Haute | Injection HTML dans le mail admin depuis le formulaire public (`renderTemplate` sans échappement, y compris dans un `href="mailto:{{email}}…"`). Le README affirme le contraire. | `escapeHtml` par défaut sur toutes les variables, `encodeURIComponent` dans les `href`, test `it.each` avec payloads HTML. |
| M1 | Moyenne | Mail de confirmation vers une adresse arbitraire avec `name`/`subject` contrôlés (backscatter, spam brandé). | Supprimer, ou captcha/Turnstile vérifié côté API, ou ne plus injecter `name`/`subject`. |
| M2 | Moyenne | Logout n'incrémente pas `tokenVersion` : un JWT volé reste valide 7 jours. | `users.bumpTokenVersion(user.id)` au logout (mécanisme existant). |
| M3 | Moyenne | TOTP : 25 essais/IP/challenge de 5 min, challenge jamais consommé, pas de compteur par compte. | Compteur d'échecs par `sub`/`jti`, verrouillage à 5, `jti` single-use. |
| M4 | Moyenne | `pnpm add drizzle-kit dotenv tsx` non épinglé après `--frozen-lockfile` dans l'image prod. | `migrate()` de `drizzle-orm` compilé avec l'app. |
| M5 | Moyenne | 8 controllers sans spec, `test/` vide, pas de CI : guards, throttle, pipes jamais exercés. | e2e supertest par module (401 sans cookie, 429, 400 champ inconnu) + `ci.yml` (install frozen, lint, test, docker build). |
| B1–B12 | Basse | TOTP sans tolérance d'horloge ni anti-replay ; proxy S3 public non throttlé ; `Content-Disposition` non échappé ; email visiteur dans logs/Sentry ; hash session non salé ; mots de passe sans `MaxLength` ; `JWT_EXPIRES_IN` validé au premier login ; oracle de timing ; `/api/health` public en 200 même `degraded` ; SMTP sans `requireTLS` ; `body-parser` low ; `metadata` jsonb libre restitué au dashboard. | Voir rapport détaillé : chaque point tient en un diff court. |
| T1 | Technique | Heure locale vs UTC mélangées (`common/utils.ts` vs aggregator) : fonctionne parce que le conteneur est en UTC. Index doublon sur `daily_stat.date`. `manualRun` et export « Task 7 » morts. `noImplicitAny: false`, pas de `strict`. README : `.env.example` supprimé, `compose.yaml` en postgres 17 (prod 18). | Tout en `getUTC*`, retirer l'index redondant, supprimer le code mort, activer `strict`, réaligner README/compose. |

Gates : `pnpm test` 301/301 · lint 0 · `pnpm audit --prod` 1 low · NestJS 11 → 12 disponible (majeure).

---

## 5. Présentation — cohérence à 100 %

### 5.1 Identité telle qu'elle apparaît aujourd'hui

| Champ | Variantes | Où |
|---|---|---|
| Nom | « Julien Nédellec » / « Nédellec Julien » (about, `alt`) / « Julien N. » / « Julien.N » (mails) / « J-Ned » (Swagger, TOTP, GitHub) / « J - Ned » (profil GitHub) | JSON-LD, `profile.static-data.ts`, header/footer, templates mail, `TOTP_APP_NAME` |
| Titre | « Développeur Angular » (h1 home) / « Développeur Angular \| NestJS & Typescript » (about) / « Développeur Full-Stack » (JSON-LD, mail) / « Développeur Full-Stack Angular & NestJS » (og:title, CV) / « Développeur Angular & NestJS » (`<title>`) | 5 fichiers |
| Statut | « Ouvert aux opportunités · CDI · IDF » / « en recherche active » / « en CDI industriel, préavis 1 mois » | home, blog, CV |
| Handles | GitHub `j-ned` vs `djoudj-dev` (README front, 4 projets en base, redirection 301 fragile) ; X `Nedjuldev` vs `@nedjuldev` | `SITE_IDENTITY`, README, `/api/projects` |
| Mail | `contact@nedellec-julien.fr` partout **sauf** `security.txt` | `public/security.txt` |
| Photo | `/avatar.avif` 400×400 (about) / `/photoProfil.webp` 404 (OG) | `seo.ts` |

### 5.2 Incohérences

**Haute** : P1 `og:image` 404 · P2 `security.txt` mauvais domaine · P3 disponibilité (site/blog/CV) · P4 diplôme ALT-RH (« PGI/ERP » vs « application internet ») et « deux titres en parallèle » vs dates séquentielles · P5 stacks projets (DashFlow Hono/NestJS, CandiDash Prisma/Drizzle, extension/app) et « ERP aéronautique multi-tenant » cité au blog, absent des projets et du CV · P6 README front obsolète · P7 soft-404 · P8 aucune page légale.

**Moyenne** : P9 titre de poste unique à choisir · P10 `<title>` de route ≠ `og:title`, 5 formats de séparateur · P11 meta description projet coupée mi-mot · P12 CV cite Jest/Cypress/Prisma/Angular 18+ (repos : Vitest, Drizzle, Angular 22) et n'exploite pas Sentry, Zod, SSR, Signal Forms, Argon2, S3 · P13 handles GitHub mixtes en base · P14 `displayName` inversé · P15 « 20 ans » (site) vs 24 ans réels au CV · P16 carte X `summary_large_image` avec un 400×400.

**Basse** : coquilles (« Javascript », « Typescript », espace final, `Docker` classé « Base de données », « Le vieux comptoir » / « Le Vieux Comptoir »), `package.json` sans `author`/`description`, `prerender-routes.txt` avec `/contact` et `/booking` inexistants, pas de manifest ni `apple-touch-icon`, `robots.txt` bloque un `/api/` qui n'existe pas sur ce domaine.

**Vérifié OK** : sitemap et RSS à jour, `lang`, canonical, JSON-LD valides, liens live et repos tous 200, CV téléchargeable, téléphone/mail identiques, vouvoiement constant, profil GitHub aligné sur le site.

---

## 6. Plan d'action ordonné

**Aujourd'hui (quick wins, < 1 h chacun)**
1. `seo.ts` → `/avatar.avif` (ou carte OG 1200×630) · `security.txt` sur le bon domaine.
2. Ré-uploader les 2 couvertures blog en AVIF ≤ 1600 px ; `priority` sur la première carte de `/blog`.
3. Tags amber → nuance 800 en clair ; `text-muted/70` → `text-muted` ; `aria-label` du logo incluant le texte visible ; `alt=""` sur les icônes de stack.
4. API : `escapeHtml` dans `renderTemplate` (H1) · `bumpTokenVersion` au logout (M2).
5. GitHub : description + homepage + licence sur les 2 repos, descriptions des repos épinglés, activer Dependabot et protéger `master` sur l'API.

**Cette semaine**
6. nginx : `index.csr.html` en fallback + `/404` prérendu avec statut 404 (N01) ; snippet d'en-têtes commun (N08).
7. Pipeline image côté API (`sharp` : resize 1600, AVIF + WebP) pour blog et projets ; `max-age` immuable sur `/storage`.
8. Session : ne pas appeler `auth/me` sans indice local (401 sur chaque page).
9. N02 : ne plus cacher l'échec de `GET /projects` + test.
10. Une seule phrase de statut et un seul titre de poste, répliqués : h1 home, about, JSON-LD, `<title>`, mails, CV. Aligner ALT-RH et les stacks projets (CV ↔ `/api/projects` ↔ blog).
11. Pages `/mentions-legales` et `/confidentialite` (éditeur, hébergeur, contact, analytics 30 j, Giscus) + phrase d'information sous le formulaire.
12. README front réécrit ; handles `j-ned` en base ; `displayName` ; coquilles.

**Ensuite**
13. API : M1 (confirmation), M3 (TOTP), M4 (migrate compilé), M5 (e2e + CI), lot B1–B12, UTC partout, `strict`.
14. Front : reste des findings 005 ouverts (F003/F011/F012/F013/F014/F016/F017/F019/F020/F023/F026/F027/F028/F030/F034/F035/F036), N03–N07, N09–N11 ; majeures TS 7 / Vitest 5 en PR dédiées.
15. DKIM chez Infomaniak à confirmer ; `IMAGE_LOADER` + `ngSrcset` pour les visuels projets.
