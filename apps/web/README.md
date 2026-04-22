<div align="center">

# 🎯 Portfolio — Julien Nédellec

### Portfolio **full-stack SSR** — vitrine, back-office admin, booking & analytics self-hosted

**Angular 21 zoneless · Hono API · PostgreSQL · Self-hosted · Zéro tracker tiers**

[![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Hono](https://img.shields.io/badge/Hono-4.12-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Drizzle](https://img.shields.io/badge/Drizzle-0.45-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Private-333?style=for-the-badge)]()

[**🔗 Site live**](https://j-ned.dev) · [**📸 Captures**](#-captures-décran) · [**🏗️ Architecture**](#️-architecture) · [**🛡️ Sécurité**](#️-sécurité--privacy-first) · [**🚀 Installation**](#-installation)

<img src="public/screen/home.webp" alt="Portfolio — Home" width="100%" />

</div>

---

## 📖 Sommaire

- [🎯 Le problème](#-le-problème)
- [💡 La réponse](#-la-réponse)
- [✨ Fonctionnalités](#-fonctionnalités)
- [🏗️ Architecture](#️-architecture)
- [🛡️ Sécurité & privacy-first](#️-sécurité--privacy-first)
- [⚡ Performance & SEO](#-performance--seo)
- [🧰 Stack technique](#-stack-technique)
- [📸 Captures d'écran](#-captures-décran)
- [🚀 Installation](#-installation)
- [🗺️ Roadmap](#️-roadmap)

---

## 🎯 Le problème

Un portfolio de développeur, c'est rarement « juste une vitrine ». Il faut :

- **Montrer du code production-ready** — pas un template bootstrap-sur-étagère
- **Pouvoir éditer le contenu sans redéployer** — un CMS, mais sans Notion/Strapi/WordPress qui trahissent le positionnement technique
- **Être trouvable** — SSR, SEO structuré, temps de chargement maîtrisé
- **Être pilotable** — savoir qui visite quoi, sans envoyer les données à Google

Les solutions « clés en main » (Notion-as-a-CMS, Webflow, SaaS portfolio) règlent 1 des 4 points.

## 💡 La réponse

Une application **full-stack self-hosted** construite comme un vrai produit :

- 🖥️ **Frontend SSR** — Angular 21 zoneless, prerender, hydration, Clean Architecture par feature
- 🔧 **Back-office admin** — édition live du hero, bio, CV, diplômes, projets, technos, services, highlights, réseaux sociaux
- 📅 **Booking custom** — calendrier FR (jours fériés, disponibilités), time picker, validation métier, notifications mail
- 📊 **Analytics privacy-first** — page views, durées, événements métier, agrégats journaliers, **zéro cookie tiers, zéro Google**
- 🔐 **Auth durcie** — Argon2 + JWT rotation + 2FA TOTP
- 🛡️ **Self-hosted** — Docker multi-stage, Traefik, Dokploy, VPS OVH

---

## ✨ Fonctionnalités

### 🌐 Site public

| Section | Détails |
|---------|---------|
| **Home** | Hero dynamique, highlights, what-I-do, aspirations, carrousel techno, tous éditables en admin |
| **À propos** | Biographie, parcours, diplômes, expertises — contenu 100% CMS |
| **Projets** | Portfolio filtrable, featured, liens live + repos front/back, tags |
| **Contact** | Formulaire validé Zod, envoi SMTP, rate limiting |
| **Booking** | Réservation de créneau de consultation avec calendrier français |
| **404 custom** | Page dédiée avec SEO désactivé |

### 🔧 Back-office admin (`/admin`)

| Module | Fonction |
|--------|----------|
| **Dashboard** | KPIs — visiteurs, sessions, téléchargements CV, clics projets |
| **Content** | Hero, biography, what-I-do, what-I-seek, highlights, diplomas, technologies |
| **Projets** | CRUD complet, ordre, featured flag, upload image S3 |
| **CV** | Upload / remplacement du PDF versionné S3 |
| **Services** | Liste des prestations proposées, ordre configurable |
| **Social buttons** | Liens GitHub, LinkedIn, X, etc. configurables |
| **Réservations** | Liste des bookings, gestion des disponibilités, jours indisponibles |
| **Messages** | Inbox des messages de contact |
| **Analytics** | Graphiques Chart.js — vues, durées, événements, bounces |
| **Settings** | Profil admin, changement de mot de passe, 2FA TOTP |

### ⚙️ Transversal

- 🔐 **Auth JWT** — access token (15min) + refresh token (7j) avec rotation
- 🔑 **2FA TOTP** — compatible Google Authenticator / Authy (QR code)
- ⚡ **View Transitions API** — animations natives entre routes
- 🎨 **Dark mode** — thème centralisé, TailwindCSS v4
- 🌍 **SEO dynamique** — meta tags et JSON-LD par route, sitemap.xml généré
- 📦 **PrimeNG 21** — composants complexes (tables, datepicker admin)
- ♿ **Accessibilité WCAG AA** — focus management, ARIA, navigation clavier

---

## 🏗️ Architecture

### Clean Architecture par feature — frontend

```mermaid
graph TD
  subgraph "Application Layer"
    SP[Smart Pages]
    DC[Dumb Components]
  end

  subgraph "Domain Layer"
    UC[Use Cases]
    GW[Gateways - Interfaces]
    MD[Models]
  end

  subgraph "Infrastructure Layer"
    HTTP[HTTP Gateways]
    ADP[Adapters]
  end

  SP --> UC
  DC --> SP
  UC --> GW
  HTTP -.implements.-> GW
  HTTP --> ADP
  UC --> MD
```

**Règle de dépendance** : `application → domain` ← `infrastructure`. Le domaine ne connaît ni Angular, ni HTTP, ni les types API.

### Structure — 3 couches par feature

```
src/app/features/<feature>/
├── domain/             # TypeScript pur, zéro dépendance framework
│   ├── models/         # Types métier (Booking, Project, Profile...)
│   └── gateways/       # Contrats (interfaces)
├── infrastructure/     # Services Angular, HTTP, adapters
│   ├── http-*.gateway.ts
│   └── *.adapter.ts    # Fonctions pures de transformation
└── application/        # Couche UI
    ├── pages/          # Smart components
    ├── components/     # Dumb components
    └── tokens/         # InjectionToken
```

Switch d'implémentation = **une ligne** dans `app.config.ts` :

```typescript
providers: [
  { provide: PROJECTS_GATEWAY, useClass: HttpProjectsGateway },
  // { provide: PROJECTS_GATEWAY, useClass: InMemoryProjectsGateway }, // tests/dev
]
```

### Backend Hono + Drizzle

```
server/
├── routes/            # Endpoints Hono (auth, projects, booking, analytics, contact, ...)
├── middleware/        # auth JWT, rate-limit
├── db/
│   ├── schema/        # Schéma Drizzle par domaine (user, project, booking, analytics...)
│   ├── migrations/    # Migrations SQL versionnées
│   └── client.ts      # Pool Postgres
├── services/          # auth-manager (JWT+Argon2+TOTP), mailer, storage S3, analytics-tracker
├── schemas/           # Validations Zod partagées
├── lib/               # env (Zod), cron, migrate, errors
└── scripts/           # create-user, seeders
```

**Un seul process runtime** : Hono sert l'API (`/api/*`), les assets Angular pré-rendus et le fallback SPA.

### Schéma base de données (13 tables)

```mermaid
erDiagram
  USER ||--o{ SESSION : has
  PROFILE ||--o{ DIPLOMA : contains
  PROFILE ||--o{ EXPERTISE : contains
  HOME ||--o{ HIGHLIGHT : features
  HOME ||--o{ TECHNOLOGY : showcases
  PROJECT }o--|| HOME : displayed
  BOOKING }o--o{ DISABLED_DATE : conflicts
  PAGE_VIEW }o--|| DAILY_STAT : aggregates
  ANALYTICS_EVENT }o--|| DAILY_STAT : aggregates
  CONTACT_MESSAGE ||--|| USER : notifies
```

---

## 🛡️ Sécurité & privacy-first

### Auth

- ✅ **Argon2id** — hashing des mots de passe (recommandation OWASP)
- ✅ **JWT rotation** — access 15min + refresh 7j, refresh token invalidé au logout
- ✅ **2FA TOTP** — `otplib` + QR code généré via `qrcode`, compatible Google Authenticator
- ✅ **Rate limiting** sur routes sensibles (login, contact, booking)
- ✅ **Secure headers** — CSP, Referrer-Policy, Permissions-Policy (camera, mic, geolocation **vides**)
- ✅ **CORS** strict — limité au domaine frontend
- ✅ **HTTPS** via Traefik (HSTS en amont)

### Analytics — privacy-first par design

**Aucun cookie, aucun Google Analytics, aucun tracker tiers.**

- `sessionHash` dérivé côté serveur (IP + User-Agent + salt) — **non réversible**, rotation quotidienne
- `geoip-lite` local — pas d'appel API externe pour le pays
- `ua-parser-js` pour browser/OS — parsing côté serveur uniquement
- Durée de page trackée via `sendBeacon` — aucune perte sur `unload`
- Agrégats journaliers (`daily_stat`) — les visiteurs individuels **ne sont pas conservés** au-delà de 90 jours (cron de purge)

### Envois SMTP

- Validation Zod stricte sur tous les inputs avant envoi
- Templates HTML dédiés (`server/mail-templates/`)
- Rate limiting sur formulaires publics

---

## ⚡ Performance & SEO

### Rendering strategy

- **SSR + prerender** — les pages publiques sont générées au build, servies en statique par Hono
- **Client Hydration** avec `withEventReplay()` — capture des clics pendant l'hydratation
- **Selective preloading** — routes `about`, `projects`, `contact` préchargées après idle
- **View Transitions API** — transitions natives entre routes
- **App initializer** — bundle home prefetché dès le bootstrap

### Images

```typescript
IMAGE_CONFIG: {
  breakpoints: [640, 768, 1024, 1280, 1920],
}
```

`NgOptimizedImage` partout, Sharp pour le resize côté serveur, stockage S3 Garage.

### SEO

- **Meta tags dynamiques** par route (title, description, keywords, OG, Twitter)
- **JSON-LD Person schema** sur la home — nom, job, adresse, `sameAs` réseaux sociaux, `knowsAbout`
- **sitemap.xml** généré dynamiquement par Hono
- **robots.txt** + **security.txt** (RFC 9116)
- **Hreflang / canonical** gérés côté app via `SeoService`

### Backend perf

- **Gzip compression** sur toutes les réponses (Hono middleware)
- **ESBuild bundle** — `server/index.ts` → `dist/server/index.mjs` un fichier
- **Connection pooling** Postgres avec `postgres.js`
- **Healthcheck** natif Node (pas de curl/wget dans l'image)

---

## 🧰 Stack technique

### Frontend

- **Framework** : Angular 21 (zoneless, Signals, standalone, SSR + prerender)
- **Routing** : lazy loading, `withComponentInputBinding`, `withViewTransitions`, `withInMemoryScrolling`
- **UI** : TailwindCSS v4 + PrimeNG 21 (admin uniquement) + PrimeIcons
- **Charts** : Chart.js (dashboard admin)
- **Forms** : Reactive Forms typés, Zod en backend
- **Tests** : Vitest (unit/component) + Playwright (e2e)
- **Lint** : ESLint + angular-eslint + Prettier + lint-staged + Husky

### Backend

- **Runtime** : Node.js 22 + Hono 4
- **ORM** : Drizzle ORM + drizzle-kit (migrations SQL versionnées)
- **Database** : PostgreSQL 17 (`postgres.js`)
- **Auth** : `jose` (JWT), `argon2` (hashing), `otplib` (TOTP), `qrcode`
- **Validation** : Zod partout (env, inputs, DB schemas via `drizzle-zod`)
- **Storage** : S3 (Garage compatible) — buckets séparés CV / projets / about
- **Email** : Nodemailer + templates HTML
- **Cron** : `node-cron` — purge sessions, agrégation stats journalières
- **Analytics** : `ua-parser-js` + `geoip-lite` (local, zéro appel externe)

### DevOps

- **Containerisation** : Docker multi-stage (build / prod-deps / production)
- **Natifs rebuild** : argon2 + sharp dans le stage prod-deps
- **Healthcheck** : Node natif sur `/api/sitemap.xml`
- **Reverse proxy** : Traefik (HTTPS/HSTS/edge compression)
- **Orchestration** : Dokploy sur VPS OVH
- **CI/CD** : GitHub Actions
- **Package manager** : pnpm 10

---

## 📸 Captures d'écran

<table>
  <tr>
    <td width="50%">
      <p align="center"><b>Home — Hero & highlights</b></p>
      <img src="public/screen/home.webp" alt="Home" width="100%" />
    </td>
    <td width="50%">
      <p align="center"><b>À propos — Parcours & expertises</b></p>
      <img src="public/screen/about.webp" alt="About" width="100%" />
    </td>
  </tr>
  <tr>
    <td width="50%">
      <p align="center"><b>Projets — Portfolio filtrable</b></p>
      <img src="public/screen/projects.webp" alt="Projects" width="100%" />
    </td>
    <td width="50%">
      <p align="center"><b>Contact — Formulaire validé</b></p>
      <img src="public/screen/contact.webp" alt="Contact" width="100%" />
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <p align="center"><b>Booking — Calendrier FR avec jours fériés</b></p>
      <img src="public/screen/booking.webp" alt="Booking" width="100%" />
    </td>
  </tr>
</table>

---

## 🚀 Installation

> Pré-requis : Node.js ≥ 20.19, pnpm ≥ 10, PostgreSQL 17, Docker (optionnel)

### Dev local

```bash
# 1. Cloner
git clone https://github.com/djoudj-dev/angular-portfolio-app.git
cd angular-portfolio-app

# 2. Install
pnpm install

# 3. Config env
cp .env.example .env
# → remplir DATABASE_URL, JWT_*, S3_*, SMTP_*

# 4. Migrations
pnpm db:migrate

# 5. Créer un user admin
pnpm db:create-user

# 6. Lancer front + back en parallèle
pnpm dev:all
# → Front : http://localhost:4200
# → API   : http://localhost:3000/api
```

### Variables d'environnement critiques

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/portfolio

# JWT (générer avec `openssl rand -hex 64`)
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# S3 (Garage / MinIO / AWS)
S3_ENDPOINT=https://s3.example.com
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_CV_BUCKET=portfolio-cv
S3_PROJECTS_BUCKET=portfolio-projects
S3_ABOUT_BUCKET=portfolio-about

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="Portfolio <noreply@example.com>"

# Contact
CONTACT_EMAIL=contact@example.com
CONTACT_PHONE=+33...
CONTACT_LOCATION=France
```

### Scripts disponibles

| Commande | Action |
|----------|--------|
| `pnpm start` | Front Angular (proxy vers API) |
| `pnpm dev:api` | API Hono en watch mode (tsx) |
| `pnpm dev:all` | Front + API en parallèle |
| `pnpm build` | Build Angular SSR prerender |
| `pnpm build:api` | Bundle ESBuild du serveur |
| `pnpm db:generate` | Génère une nouvelle migration Drizzle |
| `pnpm db:migrate` | Applique les migrations |
| `pnpm db:studio` | Drizzle Studio (UI DB) |
| `pnpm db:create-user` | Créer un user admin |
| `pnpm test` | Tests unitaires (Vitest) |
| `pnpm test:e2e` | Tests E2E (Playwright) |
| `pnpm check` | Format + lint (pré-commit) |

### Docker

```bash
# Build multi-stage
docker build -t portfolio .

# Run (Traefik en amont gère HTTPS)
docker run -p 3000:3000 --env-file .env portfolio
```

---

## 🗺️ Roadmap

- [x] Architecture Clean — 3 couches par feature
- [x] SSR Angular 21 + prerender + hydration
- [x] Back-office admin complet (hero, bio, CV, projets, technos, services, highlights)
- [x] Booking custom avec calendrier FR + jours fériés
- [x] Analytics privacy-first (page views, durées, événements, agrégats)
- [x] Auth JWT + 2FA TOTP
- [x] SEO dynamique + JSON-LD + sitemap.xml
- [x] Tests E2E Playwright (contact, navigation, theme, mobile drawer)
- [ ] Blog technique (markdown + syntax highlighting)
- [ ] i18n FR/EN
- [ ] Newsletter (opt-in RGPD)
- [ ] Export PDF des stats admin
- [ ] Webhooks Calendar (Google/Outlook) pour synchro bookings

---

<div align="center">

**Développé par [Julien Nédellec](https://j-ned.dev)**

[![Portfolio](https://img.shields.io/badge/Portfolio-j--ned.dev-4f46e5?style=for-the-badge)](https://j-ned.dev)
[![GitHub](https://img.shields.io/badge/GitHub-djoudj--dev-181717?style=for-the-badge&logo=github)](https://github.com/djoudj-dev)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-julien--nedellec-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/julien-nedellec/)

</div>
