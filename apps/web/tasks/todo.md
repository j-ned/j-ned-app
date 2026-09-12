# Blog — SEO article + RSS (branche `fix/blog-seo-rss`)

> Créé le 2026-09-12. Audit prod de l'article AES-256-GCM : `og:image:alt` faux (statique index.html),
> description 263 car., JSON-LD `BlogPosting` sans `dateModified`/`mainEntityOfPage`/`publisher`,
> sitemap `lastmod` = date de publication, h2 sans `id`, pas de `<article>`/`<time>`, RSS 2.0 nu
> (pas d'`atom:link self`, `content:encoded`, `dc:creator`, `category`), servi `text/xml` sans charset.
> Hors périmètre (repo API / éditorial) : `og:image` en AVIF, titre 122 car., lien vers le 1er article.

## Front
- [x] Domain `BlogPost.updatedAt` (l'API l'expose, `like` ne le touche pas)
- [x] `Seo` : `imageAlt` → `og:image:alt` + `twitter:image:alt` (fallback avatar)
- [x] `BlogDetail` : `<article>` + `<time datetime>` (publié / mis à jour), description ≤ 155 (`truncateAtWord`), JSON-LD complet
- [x] `parseMarkdown` : `id` sur les titres (ancres), slug ASCII dédupliqué
- [x] Sitemap : `lastmod` = `updatedAt`
- [x] RSS : `atom:link self`, `lastBuildDate`, `dc:creator`, `category`, `content:encoded`, `enclosure`
- [x] nginx : `charset utf-8`, `/rss.xml` en `application/rss+xml`, `gzip_types` corrigé
- [x] Gates : test, lint, `pnpm install --frozen-lockfile`, `pnpm run build --configuration production`

## Review
- Prérendu vérifié dans `dist/` : `og:image:alt` = illustration, description 152 car., JSON-LD avec
  `dateModified`/`mainEntityOfPage`/`publisher`/`inLanguage`, `<article>` + 2 `<time datetime>`, h2 avec `id`
- RSS régénéré : 2 items, `content:encoded` (HTML assaini par `parseMarkdown`), `enclosure` AVIF (HEAD sur l'API)
- Image Docker : `nginx -t` OK, `/rss.xml` servi `application/rss+xml; charset=utf-8`
- Reste hors repo : `og:image` JPEG 1200×630 côté API, titre < 60 car. et lien vers le 1er article (éditorial)

---

# Analytics — trafic propre (self-referrals, appareils de l'admin, 404)

> Créé le 2026-09-10. Constat : « Provenance du trafic » liste `nedellec-julien.fr/admin/*`.
> Données prod (page_view, 2026-08-11 → 2026-09-10) : 80 vues / 43 sessions, 13 vues avec
> referrer same-site (Safari iOS + Edge, FR = les appareils de l'admin), 6 vues 404 d'un scanner DE.

## Diagnostic
- `document.referrer` est envoyé brut ; l'API le stocke tel quel (`https://www.google.com/`, same-site inclus)
- Le front n'envoie pas le cookie sur `/analytics/track` (API cross-origin) : l'API ne peut pas reconnaître l'admin
- Le front track aussi la route `**` (404) : les URL devinées par les scanners polluent « Pages vues »

## API (nest-portfolio-app) — branche `fix/analytics-referrer-normalization`
- [x] `normalizeReferrer(raw, siteOrigins)` : hôte sans `www.`, `null` si same-site / invalide (+ spec)
- [x] Tracker : referrer normalisé à l'ingestion (config `CORS_ORIGINS` = origines du site)
- [x] Gates : `pnpm install --frozen-lockfile`, test, lint, build

## Front (ng-portfolio-app) — branche `fix/analytics-self-traffic`
- [x] `core/analytics/analytics-device-exclusion.ts` : opt-out par appareil (localStorage, SSR-safe)
- [x] Gateway : no-op si `AuthStore.isLoggedIn()` ou appareil exclu (toutes les méthodes + beacon)
- [x] Tracking : pas de page_view / page_duration sur la route `**`
- [x] Header analytics : bouton « Exclure cet appareil » (`aria-pressed`)
- [x] Gates : test, lint, build production

## Prod (à confirmer avant exécution)
- [ ] Nettoyage `page_view` : supprimer les sessions admin identifiées, normaliser les referrers existants

## Review
(à compléter)
