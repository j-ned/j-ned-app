# Suite de parité HTTP de l'API

Tests **boîte noire** de l'API : ils ne connaissent que son URL et parlent HTTP comme le ferait le
navigateur derrière un relais (`X-Forwarded-For`, `Sec-Fetch-Site`, `Origin`, cookie de session).
Ils ne savent rien du framework : la même suite a validé l'API NestJS, puis son portage en Hono
(ADR-0035), à l'identique.

Ils visent **l'API construite** (`apps/api/dist`), lancée par Node en mode production (Swagger fermé),
pas les sources, devant une base Postgres vide où les migrations viennent d'être appliquées.

## Lancer

```bash
pnpm --filter @portfolio/api build
# Base vide dédiée, par exemple sur le Postgres de `pnpm --filter @portfolio/api db:up` :
export PARITY_DATABASE_URL=postgres://portfolio:portfolio@127.0.0.1:55432/parity
pnpm --filter @portfolio/api-parity stack:up    # migrations, API sur :3100, admin créé, .parity-env écrit
pnpm --filter @portfolio/api-parity test
pnpm --filter @portfolio/api-parity stack:down
```

La CI (`.github/workflows/api-ci.yml`) rejoue la suite sur l'API qu'elle vient de construire, devant le
Postgres du job.

## Ce qui est couvert

| Fichier            | Contrat                                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `access.spec.ts`   | Inventaire des routes (`routes.ts`) : chaque route admin répond 401 sans session ou avec un cookie forgé, chaque lecture publique est servie, routes inconnues en 404, Swagger absent.                 |
| `auth.spec.ts`     | Cookie `__Host-token` (attributs exacts), pas d'énumération des comptes, JWT forgés refusés (`alg: none`, autre secret, signature retirée), déconnexion qui révoque toutes les sessions, 2FA complète. |
| `csrf.spec.ts`     | Toute écriture venue d'un autre site refusée en 403 ; même origine, origine de confiance et client hors navigateur acceptés ; lectures jamais refusées.                                                |
| `throttle.spec.ts` | Quotas par visiteur (connexion et 2FA 5/min, contact 3/h, défaut 10/min, lectures publiques 120/min) ; le visiteur est la **dernière** entrée de `X-Forwarded-For`.                                    |
| `limits.spec.ts`   | 413 au-delà de la taille d'envoi (4 Mo partout, limite des fonctions Vercel), avant tout stockage.                                                                                                     |
| `errors.spec.ts`   | 400 sur JSON invalide, champ inconnu, champ mal typé ; 413 au-delà de 100 ko de JSON ; format d'erreur unique.                                                                                         |
| `headers.spec.ts`  | Ni `X-Powered-By` ni sniffing MIME ; CORP `cross-origin` sur les images ; CORS ouvert au seul site (transition, ADR-0034).                                                                             |

Le format d'erreur (`api-error.ts`) fige ce que le front lit : le statut et `message` (texte ou liste),
plus les cinq clés `statusCode`, `error`, `message`, `path`, `timestamp` et l'absence de toute pile.

## Points volontairement non figés

La suite les laisse libres : ils variaient sous NestJS ou doivent pouvoir évoluer.

- **`error`** : sous NestJS, l'intitulé HTTP (`"Forbidden"`) ou le nom d'énumération Nest
  (`"UNAUTHORIZED"`) selon l'origine de l'exception ; depuis Hono, toujours l'intitulé HTTP.
- **Message du 429** : `"ThrottlerException: Too Many Requests"` sous NestJS, `"Too Many Requests"`
  depuis Hono.
- **Conversion implicite** (`enableImplicitConversion`, gardée au portage) : un mot de passe numérique
  est converti en texte au lieu d'être refusé. Cible : 400, au passage des DTO à Zod.
- **`path`** reprend la query string de la requête ; seul le chemin est figé.
- **Rejeu TOTP** : un code déjà utilisé dans sa fenêtre de 30 s est accepté ; la suite attend la fenêtre
  suivante pour rester neutre.

## Écarts connus, figés (à trancher avant de les changer)

- Le JWT est aussi accepté en `Authorization: Bearer` (hérité de l'extracteur passport). Aucun client ne s'en sert ;
  le retirer est un changement de contrat, à faire en connaissance de cause dans cette suite.

## Règles

- Une route ajoutée, retirée ou dont l'accès change est d'abord ajoutée à `routes.ts`.
- Chaque test prend ses propres visiteurs (`newVisitor()`) : une IP de 198.18.0.0/16 chacun, pour que
  les quotas ne débordent pas d'un test à l'autre.
- Les fichiers tournent l'un après l'autre (un seul admin) ; le test 2FA la désactive en sortant.
