# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Angular 21 portfolio website (French language) using clean/hexagonal architecture. Client-side SPA with Tailwind CSS 4, Vitest for testing, and pnpm as package manager.

## Commands

```bash
pnpm start              # Dev server (port 4200)
pnpm test               # Run Vitest tests
pnpm run lint           # ESLint check
pnpm run lint:fix       # ESLint auto-fix
pnpm run format         # Prettier format
pnpm run format:check   # Prettier check only
pnpm run check          # format:check + lint (CI pipeline)
pnpm run build          # Production build (outputs to browser/)
pnpm run optimize:images # Optimize images in public/images to responsive AVIF
```

## Architecture

The app follows **clean/hexagonal architecture** with four layers:

### Core (`src/app/core/`)
Business logic layer. Contains domain models (readonly interfaces), gateway interfaces (abstract DI tokens), and use-case services. Organized by domain: `projects/`, `home/`, `profile/`, `contact/`, `seo/`.

### Infrastructure (`src/app/infrastructure/`)
Data access implementations. Each domain has `in-memory/` (mock data with simulated delays) and `http/` (REST API with DTOs) gateway implementations. Gateway binding happens in `app.config.ts` via DI tokens — currently all wired to in-memory implementations.

### Layout (`src/app/layout/`)
Shared structural components: header (nav, theme toggle, mobile menu) and reusable button.

### Pages (`src/app/pages/`)
Route-level components. Each page is lazy-loaded via `loadComponent()` in `app.routes.ts`. Pages: home, about, projects, contact, page-not-found.

## Key Patterns

- **Standalone components only** — no NgModules. All components use `OnPush` change detection.
- **Angular signals** for local reactive state; RxJS for async data streams.
- **DI tokens** for gateway injection (e.g., `PROJECTS_GATEWAY`). To swap data sources, change the `useClass` binding in `app.config.ts`.
- **SEO data** is declared per route in `app.routes.ts` and auto-applied on navigation via `SeoService` initialized in `app.config.ts`.
- **New Angular control flow** syntax: `@if`, `@for`, `@switch` (not `*ngIf`/`*ngFor`).
- **Tailwind CSS 4** with CSS custom properties for theming (`--theme-*` variables in `styles.css`). Dark mode is the default.
- Components use **inline templates and styles** (not separate `.html`/`.css` files).

## Code Style Enforcement

- **Selectors**: components use `app-` prefix with kebab-case elements; directives use `app` prefix with camelCase attributes.
- **TypeScript**: `no-explicit-any` (error), `explicit-function-return-type` (warn), unused vars prefixed `_` are allowed.
- **Prettier**: single quotes, 100 char width, trailing commas (es5), no parens on single arrow params.
- **Pre-commit hook** (Husky): runs tests if `*.spec.ts` files exist.