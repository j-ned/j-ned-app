<div align="center">

# Portfolio — Julien Nédellec

### Site personnel full-stack : vitrine, blog, back-office et analytics maison, auto-hébergés

**Angular 22 zoneless · SSR + prérendu · API NestJS · PostgreSQL · zéro tracker tiers**

[![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![CI](https://img.shields.io/github/actions/workflow/status/j-ned/ng-portfolio-app/ci.yml?branch=master&style=for-the-badge&label=CI)](https://github.com/j-ned/ng-portfolio-app/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-3DA639?style=for-the-badge)](LICENSE)

[**Site live**](https://nedellec-julien.fr) · [**API (dépôt séparé)**](https://github.com/j-ned/nest-portfolio-app) · [**Captures**](#captures-décran) · [**Architecture**](#architecture) · [**Installation**](#installation)

</div>

---

## Sommaire

- [Le problème](#le-problème)
- [La réponse](#la-réponse)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Sécurité et vie privée](#sécurité-et-vie-privée)
- [Performance et SEO](#performance-et-seo)
- [Stack technique](#stack-technique)
- [Captures d'écran](#captures-décran)
- [Installation](#installation)
- [Qualité et livraison](#qualité-et-livraison)
- [Licence](#licence)

---

## Le problème

Un portfolio de développeur est rarement « juste une vitrine ». Il doit :

- **montrer du code de production**, pas un template sur étagère ;
- **permettre d'éditer le contenu sans redéployer**, sans passer par un CMS externe qui contredit le positionnement technique ;
- **être trouvable** : rendu serveur, données structurées, temps de chargement maîtrisé ;
- **être pilotable** : savoir qui visite quoi, sans envoyer les données à un tiers.

## La réponse

Une application full-stack auto-hébergée, construite et exploitée comme un vrai produit :

- **Front Angular 22** zoneless, signals, rendu serveur avec prérendu de toutes les pages publiques, clean architecture en trois couches par feature.
- **Back-office** : projets, articles de blog, CV, messages de contact, analytics, sécurité du compte.
- **API NestJS** dédiée ([`nest-portfolio-app`](https://github.com/j-ned/nest-portfolio-app)) : auth JWT + 2FA, PostgreSQL via Drizzle, stockage S3, mails, analytics.
- **Analytics maison** : aucun cookie, aucun tracker tiers, données brutes purgées au bout de 30 jours.
- **Auto-hébergement** : Docker multi-stage, Traefik, Dokploy, CI GitHub Actions qui rejoue exactement le build de production.

Ce dépôt ne contient que le front. L'API vit dans son propre dépôt et est appelée directement depuis le navigateur.

---

## Fonctionnalités

### Site public

| Section | Détails |
|---|---|
| **Accueil** | Hero, points forts, aperçu des projets mis en avant, section contact. Prérendu, hydratation incrémentale des sections sous la ligne de flottaison. |
| **À propos** | Parcours, diplômes, stack, expertises. |
| **Projets** | Liste filtrable par catégorie et paginée ; fiche par projet avec choix techniques, décisions d'architecture, liens démo et dépôts, navigation précédent / suivant. Toutes les fiches sont prérendues. |
| **Blog** | Articles en Markdown assainis par DOMPurify (ADR-0002), tags colorés par catégorie et filtre par tag, commentaires Giscus, compteur de « j'aime », flux RSS. |
| **Contact** | Formulaire Signal Forms, validation au bord, envoi par l'API (mail à l'admin et confirmation au visiteur). |
| **CV** | Téléchargement du PDF servi par l'API, comptabilisé dans les analytics. |
| **404** | Page dédiée, servie avec un vrai statut 404 par nginx. |

### Back-office (`/admin`)

| Module | Fonction |
|---|---|
| **Tableau de bord** | Indicateurs de visite, sessions, téléchargements du CV, clics projets. |
| **Projets** | CRUD, ordre, mise en avant, image convertie en AVIF ≤ 1600 px à l'upload par l'API. |
| **Blog** | CRUD, brouillon / publié, couverture, catalogue de tags, aperçu Markdown en direct. |
| **CV** | Remplacement du PDF. |
| **Messages** | Boîte de réception du formulaire de contact. |
| **Analytics** | Courbes de visites, pages, provenances, navigateurs, OS, pays, projets et articles les plus vus, export CSV, exclusion de l'appareil courant. |
| **Sécurité** | Changement de mot de passe, activation et désactivation de la 2FA TOTP avec codes de secours. |

### Transversal

- **Auth** par cookie httpOnly (JWT 7 jours) révocable, 2FA TOTP, restauration de session uniquement quand un indice local existe.
- **Thème** sombre par défaut et thème clair, tokens OKLCH dans `@theme`, Tailwind v4 CSS-first (ADR-0003).
- **View Transitions** entre routes, préchargement sélectif des routes.
- **Accessibilité** WCAG AA : cibles tactiles, `focus-visible`, régions et libellés ARIA, contrastes vérifiés sur les deux thèmes.

---

## Architecture

### Trois couches par feature

```
src/app/
├── core/          # singletons : auth store, exclusion analytics, intercepteurs, guards
├── features/
│   ├── admin/     # back-office (pages et composants)
│   ├── analytics/ # tracking et statistiques
│   ├── auth/      # login, 2FA, changement de mot de passe
│   ├── blog/      # articles, tags, commentaires, likes
│   ├── contact/   # formulaire
│   ├── cv/        # téléchargement et upload du PDF
│   ├── home/      # page d'accueil
│   ├── profile/   # page à propos
│   └── projects/  # liste, fiche, admin
├── layout/        # shell, header, footer, drawer
├── pages/         # 404
└── shared/        # UI, icônes, SEO, thème, identité du site
```

Chaque feature suit la même règle de dépendance :

```
src/app/features/<feature>/
├── domain/        # TypeScript pur : modèles (type), gateways (abstract class), use cases
├── infra/         # services Angular : gateways HTTP, adapters, données statiques
└── application/   # composants : pages smart, composants dumb
```

`application → domain ← infra`. Le domaine ne connaît ni Angular, ni HTTP, ni les types de l'API. Le câblage des implémentations se fait dans `app.config.ts` :

```ts
providers: [
  { provide: ProjectsGateway, useClass: HttpProjectsGateway },
  { provide: BlogGateway, useClass: HttpBlogGateway },
  { provide: AnalyticsGateway, useClass: HttpAnalyticsGateway },
];
```

### Rendu

- `outputMode: server` : les pages publiques (`/`, `/about`, `/projects`, `/projects/:slug`, `/blog`, `/blog/:slug`) sont **prérendues au build**, les slugs étant lus sur l'API de production. Le transfer cache du prérendu évite de refaire les appels après hydratation (spec 004).
- `login`, `two-factor` et `admin/**` sont rendus côté client depuis `index.csr.html`.
- En production, **nginx** sert le dossier `browser/` : une page prérendue par route, la coquille CSR pour les routes client, et un **404 réel** pour toute URL inconnue.
- Les sections sous la ligne de flottaison de la home et de l'à-propos utilisent `@defer` avec hydratation incrémentale (ADR-0001).

### Décisions documentées

- `docs/adr/` : hydratation incrémentale des `@defer`, assainissement du Markdown, utilitaires Tailwind et `@apply`.
- `specs/` : audits d'entrée, refactors et audit global du 2026-09-10 avec plan d'action.

---

## Sécurité et vie privée

### Front

- **CSP par hachages** : après le build, `scripts/apply-csp-hashes.mjs` remplace `'unsafe-inline'` par les SHA-256 des scripts et styles inline de chaque page prérendue et de la coquille CSR. La CI vérifie qu'aucun `unsafe-inline` ne subsiste.
- **En-têtes** posés par nginx sur toutes les réponses, assets compris : HSTS, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP.
- **Markdown** des articles assaini par DOMPurify côté serveur et côté client avant injection.
- **Auth** : cookie httpOnly `SameSite=Lax`, logout qui révoque toutes les sessions, 2FA TOTP, formulaire de connexion limité côté API.
- `security.txt` (RFC 9116) et `robots.txt` servis à la racine.

### Analytics sans tracker

- **Aucun cookie**, aucun script tiers.
- Identifiant de session dérivé côté API de `SHA-256(ip | user-agent | jour)` : l'adresse IP n'est jamais stockée.
- Pays via `geoip-lite` en local, navigateur et OS via `ua-parser-js`, aucun appel externe.
- Robots, adresses IP privées, pages 404, propriétaire connecté et appareils exclus ne sont pas comptés.
- Provenances réduites à l'hôte (`google.com`), jamais une URL du site lui-même.
- Données brutes purgées après **30 jours**, seuls les agrégats journaliers sont conservés.

---

## Performance et SEO

### Mesures Lighthouse mobile (10 septembre 2026, production)

| Page | Performance | Accessibilité | Bonnes pratiques | SEO |
|---|---|---|---|---|
| `/` | 87 | 100 | 96 | 100 |
| `/about` | 92 | 99 | 96 | 100 |
| `/projects` | 89 | 100 | 96 | 100 |
| `/projects/dashflow` | 95 | 96 | 96 | 100 |
| `/blog` | 85 | 100 | 96 | 100 |
| `/blog/:slug` | 93 | 96 | 96 | 100 |

### Ce qui les tient

- `NgOptimizedImage` sur chaque image, `priority` sur le visuel LCP de chaque page, dimensions explicites : CLS à 0.
- Images stockées en **AVIF ≤ 1600 px** par l'API à l'upload, clés dérivées du contenu et cache immuable d'un an.
- Assets hachés servis avec `Cache-Control: immutable`, gzip, préchargement sélectif des routes.
- `<title>`, meta, Open Graph et carte Twitter par route ; JSON-LD `Person`, `BreadcrumbList`, `BlogPosting` et `CreativeWork` ; canonical par page.
- `sitemap.xml` et `rss.xml` générés au build depuis l'API (`scripts/generate-sitemap.mjs`, `scripts/generate-rss.mjs`).

---

## Stack technique

### Front (ce dépôt)

- **Angular 22** : zoneless, signals, `@defer`, hydratation incrémentale, `httpResource` / `rxResource`, Signal Forms.
- **Tailwind CSS v4** en CSS-first (`@theme`, `@utility`), aucun fichier de style par composant.
- **Chart.js** pour les graphiques du back-office, **marked** + **DOMPurify** pour le Markdown, **Sentry** pour les erreurs.
- **Vitest 4** + happy-dom pour les tests, **ESLint** + angular-eslint + Prettier, Husky + lint-staged.

### API ([`nest-portfolio-app`](https://github.com/j-ned/nest-portfolio-app))

- **NestJS 11** sur Node 24, **Drizzle ORM** et **PostgreSQL 18**, migrations versionnées.
- **Argon2id**, JWT HS256 avec `tokenVersion`, **otplib** pour la 2FA, throttling par route.
- **S3** (compatible Garage / R2) derrière un proxy applicatif, **sharp** pour la conversion des images, **Nodemailer** pour les mails, **pino** pour les logs, **Sentry**.

### Exploitation

- **Docker** multi-stage : build Angular puis image nginx alpine.
- **Traefik** pour le TLS, **Dokploy** pour l'orchestration, sur un serveur auto-hébergé.
- **GitHub Actions** : lint, tests, build de production avec vérification du prérendu et de la CSP, build de l'image Docker et tests de fumée HTTP.

---

## Captures d'écran

<table>
  <tr>
    <td width="50%">
      <p align="center"><b>Accueil</b></p>
      <img src="docs/screenshots/home.webp" alt="Page d'accueil : hero et points forts" width="100%" />
    </td>
    <td width="50%">
      <p align="center"><b>À propos</b></p>
      <img src="docs/screenshots/about.webp" alt="Page à propos : parcours et stack" width="100%" />
    </td>
  </tr>
  <tr>
    <td width="50%">
      <p align="center"><b>Projets</b></p>
      <img src="docs/screenshots/projects.webp" alt="Liste des projets avec filtres par catégorie" width="100%" />
    </td>
    <td width="50%">
      <p align="center"><b>Blog</b></p>
      <img src="docs/screenshots/blog.webp" alt="Liste des articles avec tags colorés" width="100%" />
    </td>
  </tr>
</table>

---

## Installation

> Prérequis : Node.js 22, pnpm ≥ 10, et l'API [`nest-portfolio-app`](https://github.com/j-ned/nest-portfolio-app) lancée sur `http://localhost:3000` (elle embarque son propre `compose.yaml` pour PostgreSQL, MinIO et Mailpit).

```bash
git clone https://github.com/j-ned/ng-portfolio-app.git
cd ng-portfolio-app
pnpm install --frozen-lockfile
pnpm start          # http://localhost:4200, /api proxifié vers :3000 (proxy.conf.cjs)
```

Le front n'a aucune variable d'environnement : en développement il parle à `/api` via le proxy du CLI, en production directement à `https://api.nedellec-julien.fr/api`.

### Scripts

| Commande | Action |
|---|---|
| `pnpm start` | Serveur de développement avec proxy `/api` |
| `pnpm build` | Sitemap + RSS + build SSR ; `--configuration production` ajoute le prérendu et le hachage CSP |
| `pnpm test` | Vitest (63 fichiers, 493 tests) |
| `pnpm lint` | ESLint, zéro warning toléré |
| `pnpm check` | Prettier + lint |
| `pnpm icons:build` | Régénère le sprite d'icônes |

### Docker

```bash
docker build -t ng-portfolio-app:local .
docker run --rm -p 3000:3000 ng-portfolio-app:local   # nginx, pages prérendues + coquille CSR
```

---

## Qualité et livraison

Les gates sont ceux du Dockerfile, rejoués en local avant chaque PR et dans la CI :

```bash
pnpm install --frozen-lockfile
pnpm run build --configuration production   # sitemap + rss + build SSR + prérendu + CSP
docker build -t ng-portfolio-app:local .    # exactement ce que Dokploy exécute
```

- Une PR par changement, squash-merge sur `master`, branche protégée par les deux jobs de CI.
- Tests à trois niveaux : domaine sans TestBed, composants avec TestBed et mocks, intégration HTTP avec `HttpTestingController`.
- Conventions détaillées dans `.claude/CLAUDE.md` et `.claude/project-profile.md`.

---

## Licence

Le **code** de ce dépôt est publié sous licence [MIT](LICENSE).

Le **contenu éditorial** (articles de blog, textes du site, CV, photos, visuels et logos) reste sous **tous droits réservés** : il n'est pas couvert par la licence MIT et ne peut être réutilisé sans autorisation.

---

<div align="center">

**Développé par [Julien Nédellec](https://nedellec-julien.fr)**

[![Portfolio](https://img.shields.io/badge/Portfolio-nedellec--julien.fr-4f46e5?style=for-the-badge)](https://nedellec-julien.fr)
[![GitHub](https://img.shields.io/badge/GitHub-j--ned-181717?style=for-the-badge&logo=github)](https://github.com/j-ned)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-julien--nedellec-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/julien-nedellec/)

</div>
