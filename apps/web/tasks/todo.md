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
