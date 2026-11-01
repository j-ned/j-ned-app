# Suite de parité HTTP de l'API

Tests **boîte noire** de l'API : ils ne connaissent que son URL et parlent HTTP comme le ferait le
navigateur derrière le relais nginx (`X-Forwarded-For`, `Sec-Fetch-Site`, `Origin`, cookie de session).
Ils ne savent rien de NestJS. C'est le contrat que l'implémentation actuelle tient et que la version
Hono devra tenir à l'identique avant la bascule.

Ils visent **l'image Docker** en mode production (migrations au démarrage, Swagger fermé), pas les
sources, devant un Postgres jetable.

## Lancer

```bash
docker buildx bake api --load            # depuis la racine : image nest-portfolio-app:ci
pnpm --filter @portfolio/api-parity stack:up    # Postgres + API sur :3100, admin créé, .parity-env écrit
pnpm --filter @portfolio/api-parity test
pnpm --filter @portfolio/api-parity stack:down
```

Une autre image : `scripts/stack.sh up <image>`. La CI (`.github/workflows/api-ci.yml`, job `docker`)
rejoue la suite sur l'image qu'elle vient de construire.

## Ce qui est couvert

| Fichier            | Contrat                                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `access.spec.ts`   | Inventaire des routes (`routes.ts`) : chaque route admin répond 401 sans session ou avec un cookie forgé, chaque lecture publique est servie, routes inconnues en 404, Swagger absent.                 |
| `auth.spec.ts`     | Cookie `__Host-token` (attributs exacts), pas d'énumération des comptes, JWT forgés refusés (`alg: none`, autre secret, signature retirée), déconnexion qui révoque toutes les sessions, 2FA complète. |
| `csrf.spec.ts`     | Toute écriture venue d'un autre site refusée en 403 ; même origine, origine de confiance et client hors navigateur acceptés ; lectures jamais refusées.                                                |
| `throttle.spec.ts` | Quotas par visiteur (connexion et 2FA 5/min, contact 3/h, défaut 10/min, lectures publiques 120/min) ; le visiteur est la **dernière** entrée de `X-Forwarded-For`.                                    |
| `limits.spec.ts`   | 413 au-delà de la taille d'envoi (CV 10 Mo, images 5 Mo), avant tout stockage.                                                                                                                         |
| `errors.spec.ts`   | 400 sur JSON invalide, champ inconnu, champ mal typé ; 413 au-delà de 100 ko de JSON ; format d'erreur unique.                                                                                         |
| `headers.spec.ts`  | Ni `X-Powered-By` ni sniffing MIME ; CORP `cross-origin` sur les images ; CORS ouvert au seul site (transition, ADR-0034).                                                                             |

Le format d'erreur (`api-error.ts`) fige ce que le front lit : le statut et `message` (texte ou liste),
plus les cinq clés `statusCode`, `error`, `message`, `path`, `timestamp` et l'absence de toute pile.

## Écarts connus de NestJS, volontairement non figés

À normaliser au portage plutôt qu'à reproduire ; la suite les laisse libres.

- **`error`** vaut l'intitulé HTTP (`"Forbidden"`) ou le nom d'énumération Nest (`"UNAUTHORIZED"`,
  `"TOO_MANY_REQUESTS"`) selon l'origine de l'exception. Cible : toujours l'intitulé HTTP.
- **Message du 429** : `"ThrottlerException: Too Many Requests"`, qui nomme la bibliothèque. Cible :
  `"Too Many Requests"`.
- **Conversion implicite** (`enableImplicitConversion`) : un mot de passe numérique est converti en
  texte au lieu d'être refusé. Cible : 400 (Zod strict).
- **`path`** reprend la query string de la requête ; seul le chemin est figé.
- **Rejeu TOTP** : un code déjà utilisé dans sa fenêtre de 30 s est accepté ; la suite attend la fenêtre
  suivante pour rester neutre.

## Écarts connus, figés (à trancher avant de les changer)

- Le JWT est aussi accepté en `Authorization: Bearer` (extracteur passport). Aucun client ne s'en sert ;
  le retirer est un changement de contrat, à faire en connaissance de cause dans cette suite.

## Règles

- Une route ajoutée, retirée ou dont l'accès change est d'abord ajoutée à `routes.ts`.
- Chaque test prend ses propres visiteurs (`newVisitor()`) : une IP de 198.18.0.0/16 chacun, pour que
  les quotas ne débordent pas d'un test à l'autre.
- Les fichiers tournent l'un après l'autre (un seul admin) ; le test 2FA la désactive en sortant.
