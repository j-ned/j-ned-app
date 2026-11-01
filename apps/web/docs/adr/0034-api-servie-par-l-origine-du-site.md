# ADR-0034 — API servie par l'origine du site, cookie `__Host-` strict et contrôle d'origine

- **Statut** : accepté (2026-11-01)
- **Date** : 2026-11-01
- **Contexte** : phase 1 de la migration de l'API vers Hono dans le monorepo (`apps/api`) ; le
  durcissement précède le changement de framework pour rester réversible étape par étape
- **Étend** : ADR-0018 (images même origine), ADR-0021 (relais de mesure), ADR-0024 (nginx devant Node)

## Context

Le site (`nedellec-julien.fr`) appelait l'API sur son sous-domaine (`api.nedellec-julien.fr`) :
requêtes cross-origin avec credentials, donc CORS `credentials: true`, cookie de session posé avec
`Domain` (variable `COOKIE_DOMAIN`) pour être partagé entre les deux hôtes, `SameSite=Lax`. Aucune
protection CSRF explicite : tout reposait sur `SameSite` et CORS. Tout sous-domaine pouvait lire ou
écraser le cookie de session.

nginx relayait déjà deux chemins d'API par l'origine du site : les images (`/api/storage/`, en cache)
et la mesure d'audience (`/api/analytics/track`, sans cookie).

## Decision

1. **Même origine** : nginx relaie tout `/api/` à l'API (`location ^~ /api/`, après les deux relais
   précis, qui gardent cache et restrictions). Le navigateur appelle `https://nedellec-julien.fr/api`
   (`PUBLIC_API_ORIGIN`) ; le rendu serveur garde l'URL interne (`API_UPSTREAM`) et le transfer cache
   mappe l'origine interne sur celle du site. `client_max_body_size 11m` (CV de 10 Mo), XFF de Traefik
   transmis tel quel (l'API, `trust proxy 1`, en retient la dernière entrée). `Set-Cookie` n'est plus
   masqué par le snippet commun, seulement par les relais images et mesure.
2. **Cookie** `__Host-token` : `HttpOnly`, `Secure` (aussi en développement : `http://localhost` est
   une origine sûre), `SameSite=Strict`, `Path=/`, **sans `Domain`**. Le préfixe fait refuser par le
   navigateur toute variante qui violerait ces règles. `COOKIE_DOMAIN` disparaît.
3. **CSRF** : garde global `CrossOriginGuard` de l'API, même algorithme que `CrossOriginProtection` de
   Go : une écriture passe si `Sec-Fetch-Site` vaut `same-origin` ou `none`, ou si `Origin` est dans
   `CORS_ORIGINS` ; une requête sans aucun des deux en-têtes n'est pas un navigateur et passe. Ni
   jeton ni état serveur ; erreur 403 au format JSON de l'API.
4. **CSP** : `connect-src` se réduit à `'self'` (plus Sentry) ; `img-src` garde l'ancien sous-domaine
   pour les images d'articles enregistrées avec son URL absolue.

## Ordre de déploiement

L'API se déploie **avant** le front, et reste compatible avec l'ancien front : le cookie `__Host-` posé
par `api.nedellec-julien.fr` reste envoyé par un appel same-site avec credentials, et le garde accepte
`Origin: https://nedellec-julien.fr` (listé dans `CORS_ORIGINS`). Le front bascule ensuite sur la même
origine.

Effet visible : **une reconnexion admin**, deux fois au plus (l'ancien cookie `token` n'est plus lu ;
le cookie `__Host-` posé par le sous-domaine n'est pas envoyé à l'origine du site).

## Consequences

- Plus de cookie partagé entre sous-domaines ; un sous-domaine compromis ne touche plus la session.
- Plus de pré-vol CORS sur les écritures : une requête de moins par écriture admin.
- Le site et l'API ne peuvent plus être servis sur des hôtes distincts sans revoir cette décision.
- **À retirer plus tard** (une fois Hono en place) : CORS de l'API, les origines de confiance du garde
  si aucun appel ne passe plus par le sous-domaine, puis `api.nedellec-julien.fr` lui-même — après
  réécriture des URL absolues d'images dans le contenu des articles et retrait de `img-src`.
- Variable `COOKIE_DOMAIN` à supprimer de l'environnement Dokploy de l'API (ignorée désormais).
