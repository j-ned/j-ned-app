# Portfolio API (Hono)

API du portfolio J-Ned, en [Hono](https://hono.dev) sur Node (`@hono/node-server`). Toutes les routes sont montées sous **`/api`** (`src/create-app.ts`) ; toute route inconnue, sous `/api` ou non, répond par la même erreur JSON (`src/common/error-handler.ts`). Le contrat HTTP (statuts, en-têtes, cookies, quotas, CSRF, format d'erreur) est figé par la suite boîte noire [`packages/api-parity`](../../packages/api-parity/README.md), qui tourne en CI contre l'API construite, lancée par Node.

## Quickstart

**Prérequis :** Node 26 (cf. `.nvmrc`), pnpm, Podman (ou Docker - `compose.yaml` est compatible).

```bash
pnpm install
cp .env.example .env    # si absent, voir la section Configuration pour la liste complète des variables
pnpm db:up && pnpm db:wait
pnpm db:migrate                       # applique les migrations Drizzle
pnpm db:seed                          # crée l'admin (idempotent, no-op si un user existe déjà)
pnpm start:dev                        # démarre l'app en watch
```

> `pnpm dev` (= alias de `start:dev`) a un hook `predev` qui démarre Postgres (`pnpm db:up && pnpm db:wait`). Le container MinIO n'est **pas** démarré par ce hook - le démarrer manuellement (`podman compose up -d minio minio-init`, cf. `compose.yaml`) si les features S3 (Projects/CV) sont testées en local.

Endpoints disponibles une fois démarré :

| URL                                | Description                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| `http://localhost:3000/api/health` | Healthcheck (200 avec `status: "ok"` ou `"degraded"` selon l'état DB - jamais 503) |
| `http://localhost:3000/api/config` | Config publique pour le frontend (Sentry DSN/env/release)                          |

## Architecture

Pas de framework d'injection : `src/main.ts` lit la configuration, ouvre les connexions et assemble l'application à la main.

- **`src/instrument.ts`** - premier import de `main.ts` : charge `.env` puis initialise Sentry (`@sentry/node`) avant tout module instrumenté.
- **`src/config/`** - `validateEnv()` (Zod) puis `AppConfigService`, getters typés sur l'environnement validé.
- **`src/database/database.ts`** - `connectDatabase(config)` : pool `postgres-js` + Drizzle, `close()` à l'arrêt.
- **`src/services.ts`** - `createServices()` : racine de composition, chaque service reçoit ses dépendances par son constructeur (une instance chacun).
- **`src/create-app.ts`** - `createApp()` : middlewares globaux (log des requêtes, en-têtes de sécurité, CORS, contrôle d'origine), puis les routes de chaque module (`<module>/<module>.routes.ts`, une fabrique `xxxRoutes(services…, requireAuth)` par module), erreur et 404 au format JSON.
- **`src/common/`** - briques HTTP partagées : `http.ts` (corps JSON validé, query, UUID, fichiers envoyés, IP du visiteur), `validation.ts` (DTO zod), `throttle.ts` (quotas), `cross-origin.ts` (CSRF), `error-handler.ts`, `logger.ts`, `http-errors.ts`.
- **Tâche quotidienne** - `GET /api/cron/daily` (service `portfolio-cron` de la pile, 00:00 UTC) : rollup analytics (`src/analytics/analytics.schedule.ts`), puis purge du journal des connexions de plus de 90 jours. En local : `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/daily`.

Arrêt (`SIGTERM`, relayé par tini) : plus de nouvelle requête, celles en cours se terminent, puis le pool Postgres et S3 sont fermés.

## Configuration

Toute la config passe par les variables d'env, validées au boot par Zod (`src/config/env.schema.ts`). **L'app crash immédiatement avec un message lisible** si une variable requise est manquante ou invalide.

| Variable                    | Type                                               | Défaut                       | Rôle                                                                                                                            |
| --------------------------- | -------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                  | `development` \| `production` \| `test`            | `development`                | Pilote le format des logs, le sample rate Sentry                                                                                |
| `APP_ENV`                   | `production` \| `preview`                          | _(absent)_                   | Déclare l'hébergement : `production` rend mail et stockage obligatoires, `preview` désigne une démonstration sans envoi de mail |
| `PORT`                      | int 1-65535                                        | `3000`                       | Port HTTP                                                                                                                       |
| `DATABASE_URL`              | URL `postgres://...`                               | _(requis)_                   | Connexion Drizzle                                                                                                               |
| `LOG_LEVEL`                 | `fatal`\|`error`\|`warn`\|`info`\|`debug`\|`trace` | `debug` en dev, `info` sinon | Niveau Pino                                                                                                                     |
| `JWT_SECRET`                | string, 32+ chars                                  | _(requis)_                   | Signature JWT                                                                                                                   |
| `JWT_EXPIRES_IN`            | durée, de `5m` à `30d`                             | `24h`                        | Durée de la session : JWT et cookie (`<nombre>` suivi de `ms`, `s`, `m`, `h` ou `d`) ; hors bornes, l'app ne démarre pas        |
| `ADMIN_EMAIL`               | email                                              | _(optionnel)_                | Requis uniquement pour `pnpm db:seed`                                                                                           |
| `ADMIN_INITIAL_PASSWORD`    | string, 12+ chars                                  | _(optionnel)_                | Requis uniquement pour `pnpm db:seed`                                                                                           |
| `TOTP_APP_NAME`             | string                                             | `J-Ned Portfolio`            | Nom affiché dans l'app authenticator                                                                                            |
| `CORS_ORIGINS`              | CSV                                                | `http://localhost:4200`      | Origines du site : CORS (credentials), CSRF (`CrossOriginGuard`), référents internes de la mesure                               |
| `S3_ENDPOINT`               | URL                                                | _(requis en production)_     | Endpoint S3-compatible (MinIO/R2)                                                                                               |
| `S3_REGION`                 | string                                             | _(requis en production)_     | Région S3                                                                                                                       |
| `S3_ACCESS_KEY`             | string, 4+ chars                                   | _(requis en production)_     | Access key S3                                                                                                                   |
| `S3_SECRET_KEY`             | string, 8+ chars                                   | _(requis en production)_     | Secret key S3                                                                                                                   |
| `RESEND_API_KEY`            | string                                             | _(requis en production)_     | Clé API Resend (envoi seul)                                                                                                     |
| `MAIL_FROM`                 | email                                              | _(requis en production)_     | Expéditeur des mails, sur un domaine vérifié dans Resend                                                                        |
| `SENTRY_DSN`                | URL                                                | _(optionnel)_                | DSN backend ; vide = Sentry désactivé                                                                                           |
| `SENTRY_RELEASE`            | string                                             | _(optionnel)_                | Release du déploiement : tag Sentry et `version` de `/api/health`. Posée dans l'image par la CI (`APP_RELEASE=sha-<commit>`)    |
| `SENTRY_TRACES_SAMPLE_RATE` | float 0-1                                          | `0.2` prod / `1.0` dev       | Sample rate tracing                                                                                                             |
| `SENTRY_FRONTEND_DSN`       | URL                                                | _(optionnel)_                | DSN d'un **projet Sentry distinct** pour le frontend, exposé publiquement via `GET /api/config`                                 |

`S3_*`, `RESEND_API_KEY` et `MAIL_FROM` sont **requis en production** (`APP_ENV=production`) : l'app refuse d'y démarrer sans eux. Ailleurs (preview, poste local, CI), ils sont facultatifs : sans configuration S3 complète, le stockage répond 503 ; sans clé Resend, et **toujours en preview**, les mails sont seulement journalisés (destinataire masqué et sujet).

## Base de données

PostgreSQL 17-alpine dans un container Podman/Docker dédié (`portfolio-db`, `compose.yaml`), exposé sur le **port 55432** (isolation vs d'autres backends locaux).

### Choix techniques

- **Drizzle ORM**, driver `postgres-js` (recommandé par la doc Drizzle, zéro dépendance native).
- **`casing: 'snake_case'`** dans `drizzle.config.ts` : convention Postgres standard, conversion auto vers `camelCase` côté TS.

### Schéma actuel (`src/database/schema/`)

Une table par module métier réellement implémenté : `users`, `project`, `project_image`, `contact_message`, `cv_file`, `blog_post`, `blog_comment`, `profile_content` (une seule ligne), plus les tables analytics (`page_view`, `analytics_event`, `daily_stat`).

### Workflow migrations

```bash
pnpm db:up              # Démarre le container Postgres
pnpm db:wait             # Attend que Postgres réponde (poll pg_isready)
pnpm db:generate        # Génère une migration depuis le schéma TS
pnpm db:migrate         # Applique les migrations en attente
pnpm db:studio          # UI web (Drizzle Studio)
pnpm db:reset           # Wipe + recrée + migrations + seed (dev only)
pnpm db:down            # Stoppe le container
```

## Logging

[Pino](https://getpino.io), une ligne par requête (`src/common/request-logger.ts`) et `Logger` nommé par module (`src/common/logger.ts`). Tout log `error` qui ne porte pas déjà une exception part aussi à Sentry.

- **Dev** : sortie `pino-pretty`.
- **Prod/test** : JSON structuré.
- **Redaction** automatique (liste unique `LOG_REDACT_PATHS`, `src/common/log-redact.ts`) : `authorization`, `cookie`, `set-cookie`, et dans le body `password`, `newPassword`, `currentPassword`, `code`, `token`, `refreshToken`, `phone`, `email`.
- Le sérialiseur `req` (`serializeRequest`) ne garde que `id`, `method` et le chemin de l'URL, sans query string.
- **`/api/health`** est ignoré par le logger HTTP (évite de polluer les logs au rythme des sondes).
- Tout log `error` (level ≥ 50) est aussi envoyé à Sentry via `Sentry.captureMessage`, sauf s'il s'agit déjà d'une exception capturée par le filter global (anti-doublon).

## Erreurs

Format JSON unifié émis par `HttpExceptionFilter` (`src/common/filters/http-exception.filter.ts`) :

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Cannot GET /api/foo",
  "path": "/api/foo",
  "timestamp": "2026-04-25T13:42:00.000Z"
}
```

`SentryGlobalFilter` (posé en `APP_FILTER`, avant `HttpExceptionFilter`) capture toute exception non gérée vers Sentry.

## Auth

Admin unique pré-seedé (pas de `/register`), JWT en cookie httpOnly, 2FA TOTP avec 10 backup codes hashés Argon2.

**Setup initial** :

```bash
pnpm db:seed     # crée l'admin avec ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD (idempotent - no-op si des users existent déjà)
```

**9 endpoints sous `/api/auth`** :

| Méthode | Chemin                  | Auth | Rôle                                                                                             |
| ------- | ----------------------- | ---- | ------------------------------------------------------------------------------------------------ |
| POST    | `/auth/login`           | ❌   | Login email + password. Renvoie un JWT (cookie) si pas de 2FA, sinon un `challengeToken` (5 min) |
| POST    | `/auth/2fa/verify`      | ❌   | Complète le login 2FA (`challengeToken` + `code` TOTP ou `backupCode`)                           |
| POST    | `/auth/logout`          | ✅   | Clear cookie                                                                                     |
| GET     | `/auth/me`              | ✅   | Infos user courant                                                                               |
| GET     | `/auth/login-events`    | ✅   | Journal des connexions, paginé (`?page=&limit=`), du plus récent au plus ancien                  |
| POST    | `/auth/change-password` | ✅   | Change le mot de passe                                                                           |
| POST    | `/auth/2fa/generate`    | ✅   | Génère secret + QR code (n'active pas encore)                                                    |
| POST    | `/auth/2fa/enable`      | ✅   | Active 2FA après vérif code, renvoie 10 backup codes one-time                                    |
| POST    | `/auth/2fa/disable`     | ✅   | Désactive 2FA (requiert password courant)                                                        |

**Décisions clés** :

- JWT unique (24 h par défaut, `JWT_EXPIRES_IN`), un seul cookie `__Host-token` (`HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, sans `Domain` : attaché à l'hôte exact, aucun sous-domaine ne peut le lire ni l'écraser), pas de refresh token (compromis assumé pour un backend mono-admin - un vrai couple access/refresh roté serait overkill ici).
- **CSRF** : `crossOriginProtection` (middleware global, `src/common/cross-origin.ts`) rejette en 403 toute écriture (`POST`/`PUT`/`PATCH`/`DELETE`) dont `Sec-Fetch-Site` n'est ni `same-origin` ni `none`, sauf si `Origin` figure dans `CORS_ORIGINS`. Une requête sans `Origin` ni `Sec-Fetch-Site` (curl, scripts) n'est pas un navigateur et passe. Même algorithme que `CrossOriginProtection` de Go.
- Algorithme JWT épinglé explicitement (`HS256`) au sign comme au verify - anti confusion d'algorithme.
- **Émetteur et audience** (`src/auth/jwt.service.ts`) : chaque jeton porte `iss` (`j-ned-portfolio-api`) et `aud`, exigés à la vérification. Une audience par usage (`j-ned-portfolio:session`, `j-ned-portfolio:2fa-challenge`) : un jeton de challenge n'ouvre pas de session, un jeton de session ne répond pas à un challenge. Un jeton sans ces revendications, dont `aud` est une liste, ou sans expiration (`exp`) est refusé en 401.
- **Révocation via `tokenVersion`** : colonne `users.token_version` (int), embarquée dans le payload JWT à l'émission. Incrémentée par `UsersService` sur `updatePassword`/`enableTwoFactor`/`disableTwoFactor`. `requireAuth` (`src/auth/require-auth.ts`) rejette tout JWT dont le `tokenVersion` ne correspond pas à celui en DB - un changement de mot de passe (ou `pnpm db:change-password`) invalide immédiatement tous les tokens déjà émis, sans avoir besoin d'un vrai refresh token.
- Argon2id pour le hash password et les backup codes.
- `requireAuth` rejette tout JWT avec `scope === '2fa-challenge'` - un challenge token ne peut jamais servir de session (défense en profondeur).
- Connexion et vérification 2FA : 5 tentatives par minute et par IP (`AUTH_ATTEMPT_THROTTLE`).
- **Visiteur d'un quota** : la dernière entrée de `X-Forwarded-For` (écrite par le proxy de confiance) si c'est une adresse IP, sinon l'adresse de la socket (`clientIp`, `src/common/http.ts`). Le compteur d'une adresse IPv6 est celui de son préfixe /64 (`quotaAddress`, `src/common/throttle.ts`) : un abonné ne multiplie pas ses quotas en changeant d'adresse dans son préfixe. Une IPv4 mappée (`::ffff:a.b.c.d`) compte comme l'IPv4.
- **Mot de passe redemandé sous session** (`change-password`, `2fa/disable`) : 5 essais par quart d'heure et par compte (`REAUTH_ACCOUNT_THROTTLE`), compteur commun aux deux routes, remis à zéro par un succès ; au-delà, 429 avec `Retry-After`. Une session volée ne sert pas à deviner le mot de passe.
- **Lectures de l'admin** (`GET` sous session : `/auth/me`, `/auth/login-events`, `/blog/posts/admin`, `/contact/messages`, `/contact/messages/unread-count`, `/blog/comments`, `/blog/comments/pending-count`) : `throttleSession` (`src/common/throttle.ts`) compte une session valide **par compte et par route**, d'où qu'elle vienne : 60 par minute (`ADMIN_READ_THROTTLE`, 120 pour `/auth/me`). Une requête refusée en 401 est comptée par IP (10 par minute, 120 pour `/auth/me`) ; une IP qui a épuisé ses refus reçoit 429 avant toute vérification de session, donc sans lecture en base. Un anonyme ne consomme jamais le quota d'un compte ; un admin connecté derrière la même IP qu'un anonyme épuisé reçoit lui aussi 429 jusqu'à la fin de la fenêtre. Les écritures de l'admin gardent leur quota par IP devant `requireAuth`.
- **Compteurs bornés** (`MemoryThrottleStore`) : 5 000 clés au plus par route ou par usage (`DEFAULT_MAX_KEYS_PER_SCOPE`), fenêtres expirées purgées d'abord, jamais d'éviction d'un compteur vivant. Portée pleine : un nouveau visiteur reçoit 429 sur la connexion, la 2FA et le contact (`whenFull: 'reject'`, défaut), et il est servi sans être compté sur les lectures publiques, la mesure d'audience et les routes au quota par défaut (`whenFull: 'allow'`).
- JWT signés et vérifiés par `jsonwebtoken` (`src/auth/jwt.service.ts`).
- **Journal des connexions** (`login_event`, `src/auth/login-journal.service.ts`) : une ligne par étape de connexion, acceptée ou refusée (`password_accepted`/`password_rejected`, `two_factor_accepted`/`two_factor_rejected`), avec le compte s'il est connu, le pays, le navigateur et le système. Ni adresse IP ni e-mail saisi. Une écriture qui échoue est journalisée en erreur et ne bloque pas la connexion. Conservé 90 jours, purgé par la tâche quotidienne.

**Consommer l'auth dans un module** :

```typescript
.post('/something', throttle(), requireAuth, async (c) => {
  const dto = await jsonBody(c, CreateSomethingDto);
  return reply(c, await service.create(c.var.user, dto), 201);
})
```

Une lecture de l'admin passe la session à `throttleSession`, qui l'exécute entre ses deux compteurs :

```typescript
.get('/something', throttleSession(requireAuth), async (c) =>
  reply(c, await service.findAll(c.var.user)),
)
```

## Validation HTTP

`validateDto()` (`src/common/validation.ts`), appelé par `jsonBody`/`queryParams`, valide chaque entrée par son schéma zod :

- objets stricts (`z.strictObject`) : **400 si le client envoie un champ inattendu** (détection précoce de bugs frontend) ;
- messages des contraintes aplatis, préfixés du chemin du parent pour les objets imbriqués ;
- clés `__proto__` retirées à toute profondeur, par un parcours itératif : un corps de 100 ko imbriqué sur des dizaines de milliers de niveaux reçoit un 400, pas un 500 par débordement de pile.

Corps JSON : `application/json` seul, 100 ko au plus (413), JSON invalide → 400. Fichiers : `uploadedFile()` → 413 au-delà de la taille permise, 422 si absent ou si ses octets ne sont pas du type attendu (`file-type`, pas l'en-tête du client).

## Tests

- **Unitaires** : `*.spec.ts` à côté du code source, runner Jest (config inline dans `package.json`, `rootDir: src`, `reflect-metadata` chargé par `setupFiles`). Certaines dépendances sont publiées en ESM pur : Jest tourne sous `node --experimental-vm-modules` (support `require(esm)`, Node ≥ 24.9), avertissement `ExperimentalWarning` masqué.
- **Routes** : `<module>.routes.spec.ts` passent par HTTP (`testApp(prefix, routes).request(...)`, `src/testing/test-app.ts`, avec les gardes `passThrough`/`denyAll` et `fileForm` de `src/testing/`, dossier exclu du build) ; `src/create-app.spec.ts` vérifie l'application complète (erreurs JSON, CSRF, CORS, en-têtes).
- **Parité HTTP** : `packages/api-parity`, contre l'API construite (`dist/main.js`) ; mode d'emploi dans son README.

```bash
pnpm test           # Tous les tests unitaires
pnpm test:watch     # Mode watch
pnpm test:cov       # Avec coverage
```

## Scripts pnpm - récap

Liste réelle (`package.json`) - pas de script `s3:*` (démarrer MinIO à la main via `podman compose up -d minio minio-init`) :

| Script                                           | Description                                                                                                                                   |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm start`                                     | `node dist/main.js` (nécessite `pnpm build`)                                                                                                  |
| `pnpm start:dev` / `pnpm dev`                    | `tsc --watch` + `node --watch` sur `dist/` (`dev` déclenche le hook `predev`, voir Quickstart)                                                |
| `pnpm start:prod`                                | `node dist/main` (nécessite `pnpm build` avant)                                                                                               |
| `pnpm build`                                     | `tsc` → `dist/`                                                                                                                               |
| `pnpm lint` / `pnpm format`                      | ESLint (`--fix`) / Prettier                                                                                                                   |
| `pnpm lint:check` / `format:check` / `typecheck` | Vérifications sans écriture : ESLint, Prettier, `tsc --noEmit` (specs comprises). Ce que joue la CI                                           |
| `pnpm test` / `test:watch` / `test:cov`          | Jest (sous `--experimental-vm-modules`, cf. Tests)                                                                                            |
| `pnpm db:up` / `db:down` / `db:wait`             | Cycle container Postgres (`podman compose`)                                                                                                   |
| `pnpm db:generate` / `db:migrate` / `db:studio`  | Drizzle Kit                                                                                                                                   |
| `pnpm db:seed`                                   | Crée l'admin (idempotent, `ADMIN_EMAIL`/`ADMIN_INITIAL_PASSWORD`)                                                                             |
| `pnpm db:init-demo`                              | Base de preview : migrations puis admin de démo (`DEMO_ADMIN_PASSWORD`) et contenu fictif ; refuse la prod et toute base avec un autre compte |
| `pnpm db:change-password <email> <newPassword>`  | Change le mot de passe d'un user directement en DB (newPassword 12+ chars) - utile en cas de perte d'accès, bypass l'API                      |
| `pnpm db:reset`                                  | Wipe volume + recrée + migrate + seed (dev only)                                                                                              |
| `pnpm sentry:check-instrumentation`              | Vérifie que Sentry trace `@Injectable`, `@Catch`, `@Cron` (`scripts/check-sentry-instrumentation.cjs`, après `pnpm build`)                    |

**CI** (`.github/workflows/api-ci.yml`, à chaque PR et sur `master`) : `install --frozen-lockfile`, `lint:check`, `format:check`, `typecheck`, `pnpm test` **avec** les tests d'intégration (service `postgres:17-alpine`, bases jetables `PROFILE_IT_DATABASE_URL`, `DEMO_IT_DATABASE_URL` et `COMMENTS_IT_DATABASE_URL`), `build`, puis la suite de parité HTTP contre l'API construite, lancée par Node devant une base jetable. Le job `image` construit ensuite l'image du conteneur, joue ses migrations sur un Postgres jetable et interroge sa sonde ; sur `master`, elle est publiée sur GHCR (ADR-0038).

## S3 Storage

Module d'infrastructure S3-compatible, consommé par Projects, Blog, Profile et CV.

**Délais** (`src/storage/s3-client.ts`, `S3_TIMEOUTS`) : connexion 5 s, requête 30 s avec `throwOnRequestTimeout` (le SDK n'impose aucune borne par défaut et ne ferait qu'un warning), 3 tentatives au plus. 30 s couvrent le plus gros envoi (4 Mo) dès ~3 Mbit/s montants ; un stockage bloqué donne une erreur au lieu de tenir la requête, et le verrou du portrait, indéfiniment.

**Stack** : `@aws-sdk/client-s3` v3. Dev local : container MinIO (`compose.yaml`, ports 9000 API / 9001 console, bucket `portfolio-storage` initialisé en anonymous-read par le service `minio-init`). Prod : Cloudflare R2 (visé, non figé dans le code - juste un endpoint S3-compatible).

**API (`StorageService`)** :

| Méthode        | Signature                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `upload`       | `(bucket, key, body: Buffer, contentType): Promise<void>`                                                                                         |
| `get`          | `(bucket, key): Promise<S3ObjectStream>` (stream + contentType + contentLength ; 404 si absent)                                                   |
| `delete`       | `(bucket, key): Promise<void>` (idempotent)                                                                                                       |
| `getPublicUrl` | `(bucket, key): string` - retourne **`/storage/{bucket}/{key}`**, un chemin relatif servi par le relais `storageRoutes`, _pas_ une URL S3 directe |

**`storageRoutes`** (`src/storage/storage.routes.ts`) : `GET /api/storage/:bucket/<clé>`, stream l'objet S3 avec ses `Content-Type`/`Content-Length` d'origine. Le proxy existe car R2 nécessite soit un Custom Domain (DNS géré par Cloudflare, pas encore le cas), soit ce détour applicatif - le proxy détient les credentials et sert les objets publics sans exposer le bucket directement.

## Projects

CRUD admin des projets affichés sur le portfolio.

**Schéma** : table `project` (uuid, `slug` unique, `category`, `featured`, `order`, `image` (key S3), `version`, etc.).

**6 endpoints sous `/api/projects`** :

| Méthode | Chemin                | Auth | Rôle                                                                                                                                                                                                                              |
| ------- | --------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET     | `/projects`           | ❌   | Liste publique. Filtres `?category=`, `?featured=true`. Tri `order ASC, createdAt DESC`.                                                                                                                                          |
| GET     | `/projects/:id`       | ❌   | 404 si absent.                                                                                                                                                                                                                    |
| POST    | `/projects`           | ✅   | Crée. Slug auto-généré depuis `title`. 409 si collision de slug.                                                                                                                                                                  |
| PATCH   | `/projects/:id`       | ✅   | Met à jour. Re-slugifie si `title` change. `image: null` supprime l'image S3 (via `@Equals(null)` - pas de valeur arbitraire acceptée). `If-Match` facultatif (voir « Version des articles et des projets »).                     |
| DELETE  | `/projects/:id`       | ✅   | Supprime le projet + son image S3 si présente.                                                                                                                                                                                    |
| POST    | `/projects/:id/image` | ✅   | Upload multipart (`file`, max 4 Mo, MIME whitelist `image/webp\|jpeg\|png\|avif`, 422 si invalide). Converti en **AVIF ≤ 1600 px** (`sharp`) avant stockage, clé `<id>-<sha8>.avif` (cache immuable 1 an). `If-Match` facultatif. |

**Lifecycle S3** : key = `projects/<id>.<ext>`. Ordre upload → update DB → cleanup ancienne clé (jamais l'inverse, pour ne jamais laisser une référence DB cassée). Les réponses API exposent une URL proxy (`getPublicUrl`), jamais la key S3 brute.

## Blog

CRUD admin des articles de blog + endpoints publics de consultation/like. Le front lit les articles à la requête (rendu serveur, spec front 022) : une écriture admin est visible dès la requête suivante, sans rebuild.

**Schéma** : table `blog_post` (uuid, `slug` unique, `excerpt`, `contentMarkdown`, `coverImage` (key S3), `tags` (array), `status: 'draft' | 'published'`, `likesCount`, `version`, `publishedAt`).

**8 endpoints sous `/api/blog/posts`** :

| Méthode | Chemin                   | Auth | Rôle                                                                                                                                                                                                                                                              |
| ------- | ------------------------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET     | `/blog/posts`            | ❌   | Liste publique des articles publiés, triés par `publishedAt DESC`.                                                                                                                                                                                                |
| GET     | `/blog/posts/admin`      | ✅   | Liste complète (drafts inclus), triée par `createdAt DESC`.                                                                                                                                                                                                       |
| GET     | `/blog/posts/:slug`      | ❌   | Détail public d'un article **publié**. 404 sur un slug draft/dépublié/inconnu (pas de fuite de contenu non publié).                                                                                                                                               |
| POST    | `/blog/posts`            | ✅   | Crée. Slug auto-généré depuis `title`. 409 si collision de slug.                                                                                                                                                                                                  |
| PATCH   | `/blog/posts/:id`        | ✅   | Met à jour. Slug **figé** une fois l'article publié (ne se re-génère plus au changement de titre - casserait l'URL publique et les liens entrants). `coverImage: null` supprime l'image S3. `If-Match` facultatif (voir « Version des articles et des projets »). |
| DELETE  | `/blog/posts/:id`        | ✅   | Supprime l'article + son image S3.                                                                                                                                                                                                                                |
| POST    | `/blog/posts/:id/image`  | ✅   | Upload multipart (`file`, max 4 Mo, MIME whitelist `image/webp\|jpeg\|png\|avif`). Converti en **AVIF ≤ 1600 px** (`sharp`) avant stockage, clé `<id>-<sha8>.avif` (cache immuable 1 an).                                                                         |
| POST    | `/blog/posts/:slug/like` | ❌   | Incrémente le compteur de likes d'un article **publié** (public, pas d'auth). 404 sur un slug draft/dépublié/inconnu.                                                                                                                                             |

**Lifecycle S3** : identique à Projects (key `blog/<id>.<ext>`, ordre upload → update DB → cleanup ancienne clé).

## Version des articles et des projets

Écriture conditionnelle des éditeurs de l'admin (ADR-0041 du front) : un brouillon parti d'une version périmée ne remplace plus en silence une version enregistrée ailleurs.

- **Colonne `version`** (`integer NOT NULL DEFAULT 1`) sur `blog_post` et `project` (migration `0037_content_version.sql`). Incrémentée dans le même `UPDATE` par toute écriture du contenu édité : `PATCH` (couverture retirée comprise), `POST …/image`, et pour un projet chaque écriture de galerie (`POST /projects/:id/images`, `PATCH`/`DELETE /projects/:id/images/:imageId`, `PUT /projects/:id/images/order`), par la première requête de la transaction de la capture (le projet est verrouillé avant ses captures, dans l'ordre de `DELETE project` et de sa cascade : pas d'interblocage avec une suppression concurrente ; projet absent ⇒ 404). `POST /blog/posts/:slug/like` ne la change pas.
- **Exposée** dans toutes les réponses : lectures (`GET /blog/posts/:slug`, `GET /projects/:id`), listes (`GET /blog/posts`, `/blog/posts/admin`, `/projects`) et réponses des écritures. Les réponses d'une entité (lecture, création, `PATCH`, `POST …/image`) portent `ETag: "<version>"`. Il désigne la version du contenu édité (le nombre de « j'aime » peut changer sous le même `ETag`) ; l'API ne lit pas `If-None-Match` et ne répond jamais 304. Les quatre écritures de galerie portent la **version du projet** en `ETag` (pas celle de la capture) : l'éditeur enregistre ensuite sous celle-ci.
- **`If-Match: "<version>"`** (facultatif) sur `PATCH /blog/posts/:id`, `POST /blog/posts/:id/image`, `PATCH /projects/:id` et `POST /projects/:id/image` : l'écriture devient `UPDATE … WHERE id = :id AND version = :version`. Version périmée ⇒ **412 Precondition Failed** (« Une version plus récente de cet article (ce projet) a été enregistrée ailleurs : recharge-le avant d'enregistrer. »), au format d'erreur commun, rien n'est écrit ; si la version lue avant l'envoi diffère déjà, le 412 part avant tout envoi S3. Le **409** reste celui du slug déjà pris (titre d'une autre entité), avec ou sans `If-Match`. Entité supprimée ⇒ 404. En-tête mal formé (sans guillemets, `W/`, `*`, liste, `"0"`, au-delà de 2 147 483 647) ⇒ **400**. Sans en-tête : écriture inconditionnelle, comme avant. Le parcours (`PUT /profile`), qui envoie sa version dans le corps, garde son 409.
- **Concurrence** : deux `PATCH` partis de la même version, un seul passe, l'autre reçoit 412 ; une écriture de galerie concurrente d'une suppression du projet reçoit 404, jamais un interblocage (test d'intégration `src/content-version.integration.spec.ts`, base jetable créée sur le serveur de `PROFILE_IT_DATABASE_URL`).

## Commentaires du blog

Un lecteur commente un article publié avec un nom et un e-mail, sans compte. **Rien n'est publié sans la validation du propriétaire** ; un seul niveau de réponse ; texte brut (aucune balise interprétée, l'échappement est l'affaire du rendu). Module `src/blog-comments/`, monté dans les routes du blog.

**Schéma** : table `blog_comment` (migration `0036_blog_comment.sql`) : `post_id` (cascade depuis `blog_post`), `parent_id`, `depth` et `parent_depth`, `status` (`pending` / `published` : refuser un commentaire, c'est le supprimer), `moderated_at`, `author_kind` (`visitor` / `owner`), `author_name`, `author_email`, `sender_hash`, `body`, `created_at`. La base porte elle-même les règles, quel que soit le code qui écrit :

- **un seul niveau, sur le même article** : clé étrangère composite `(parent_id, post_id, parent_depth) → (id, post_id, depth)` avec `parent_depth = 0` imposé par `CHECK` ; une réponse à une réponse ou à un commentaire d'un autre article est refusée ; supprimer un commentaire supprime ses réponses ;
- statut cohérent avec `moderated_at` ; un visiteur a un nom (2 à 80 caractères) et un e-mail, le propriétaire n'a ni nom, ni e-mail, ni empreinte et n'est jamais `pending` ; corps de 2 à 2 000 caractères.

**7 endpoints sous `/api/blog`** :

| Méthode | Chemin                         | Auth | Rôle                                                                                                                                                                                                                                   |
| ------- | ------------------------------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET     | `/blog/posts/:slug/comments`   | ❌   | Commentaires publiés d'un article **publié**, du plus ancien au plus récent, chacun avec toutes ses réponses publiées. Paginé sur les commentaires (`?page&limit`, 10 par défaut, 100 au plus). 404 sinon. 120 req/min.                |
| POST    | `/blog/posts/:slug/comments`   | ❌   | Envoi d'un commentaire ou d'une réponse (`parentId`). **202 `{ id }`** (identifiant du commentaire, en attente de validation). **Quota : 5 par heure et par IP** (`COMMENT_THROTTLE`). 400, 404, 409, 413, 429, 503 (voir ci-dessous). |
| GET     | `/blog/comments`               | ✅   | File de modération paginée (`?status=pending\|published&page&limit`), du plus récent au plus ancien, avec l'article, l'auteur (e-mail compris), le parent et le nombre de réponses.                                                    |
| GET     | `/blog/comments/pending-count` | ✅   | `{ count }` des commentaires en attente.                                                                                                                                                                                               |
| PATCH   | `/blog/comments/:id`           | ✅   | `{ status: "published" }` : publie un commentaire en attente. 409 s'il l'est déjà, ou pour une réponse dont le parent n'est pas publié. 60 req/min.                                                                                    |
| DELETE  | `/blog/comments/:id`           | ✅   | **Refus ou suppression**, définitif, réponses comprises (en attente ou publiées). 204, 404. 60 req/min.                                                                                                                                |
| POST    | `/blog/comments/:id/replies`   | ✅   | `{ body }` : réponse du propriétaire à un commentaire **publié**, publiée immédiatement (`author.kind = "owner"`), sans notification. 201, 404, 409 (parent non publié, ou parent qui est une réponse). 60 req/min.                    |

**Sortie publique, sans e-mail par construction** : `{ data: [{ id, author: { kind: "visitor", name } | { kind: "owner" }, body, createdAt, replies: [{ id, author, body, createdAt }] }], total, page, limit }`. La requête ne lit ni `author_email` ni `sender_hash` (liste de colonnes fermée, `DrizzleCommentStore`), et la route renvoie `publicCommentPageSchema.parse(...)` (`public-comment.ts`), qui retire toute clé non déclarée.

**Entrée** (`dto/create-comment.dto.ts`, objet strict) : `name` (2 à 80 caractères, sans caractère de contrôle, sans caractère de format `\p{Cf}` hors ZWJ, sans moitié de paire UTF-16 isolée, avec au moins un caractère visible), `email`, `body` (retours chariot normalisés en `\n`, 2 à 2 000 caractères, sans caractère de contrôle hors `\n` et `\t`, mêmes règles que le nom pour les caractères invisibles, chevrons acceptés), `parentId` (UUID, facultatif), `website` (champ piège). Les longueurs se comptent en caractères, comme `char_length` côté base.

**Ordre de traitement d'un envoi** : champ piège rempli → 202 `{ id }` avec un UUID aléatoire jamais stocké (même forme qu'un envoi accepté), rien d'écrit ni d'envoyé ; article inconnu ou non publié → 404 ; parent inconnu, d'un autre article ou en attente → 404 (l'existence d'un commentaire non publié ne fuit pas) ; parent qui est une réponse → 409 ; 3 commentaires déjà en attente pour cet expéditeur (`PENDING_PER_SENDER`, compté en base sur l'empreinte HMAC de l'adresse découpée comme le quota : une IPv4, sa forme mappée comprise, ou un /64 IPv6) → 429 ; 100 commentaires en attente au total (`PENDING_TOTAL`) → 503 ; sinon insertion, puis notification. Comptage et insertion se font dans une transaction sous verrou consultatif (`pg_advisory_xact_lock`) : deux envois simultanés ne dépassent pas les plafonds. Le quota par IP vit en mémoire (remis à zéro au redémarrage), les plafonds en base.

**Notification** : template Resend **`comment-notification`** (`COMMENT_NOTIFICATION_TEMPLATE`), à créer dans le dashboard Resend, envoyé à `OWNER_EMAIL`, `reply_to` = adresse du commentateur, objet `Commentaire en attente : <titre>`. Variables : `NAME`, `SENDER_EMAIL`, `POST_TITLE`, `POST_SLUG`, `PARENT_NAME` (vide pour un commentaire ; nom de l'auteur du commentaire parent pour une réponse), `MESSAGE`, `YEAR`. Envoi fire-and-forget après l'insertion : un échec (template absent compris) est journalisé en erreur et remonte à Sentry, l'adresse et le nom saisis masqués dans le message du fournisseur ; le commentaire reste dans la file de l'admin. Aucun mail ne part vers l'adresse saisie.

**Conservation** : refuser un commentaire le supprime aussitôt (`DELETE`), avec ses réponses ; un commentaire disparaît avec son article. Aucune purge différée.

**Tests** : `blog-comments.routes.spec.ts` joue les scénarios HTTP (`src/testing/comment-route-scenarios.ts`) sur un stockage en mémoire ; `blog-comments.integration.spec.ts` les rejoue sur un vrai Postgres et y ajoute les garanties de la base (insertions SQL directes refusées, cascades, plafonds sous concurrence) : `COMMENTS_IT_DATABASE_URL=… pnpm test -- blog-comments.integration` (base dédiée, migrée puis vidée ; ignoré sans cette variable).

## Profile (page Parcours)

Contenu de `/about` édité depuis l'admin (spec front 021, ADR-0023 du front) : **un document unique** versionné, lu à la requête par le front (rendu serveur, spec front 022 : aucune écriture ne déclenche de rebuild), l'identité (phrase d'accroche commune, nom, ville, réseaux) restant dans le code du front.

**Schéma** : table `profile_content`, une seule ligne (`id = 'main'`, `CHECK`) : `content jsonb` (biographie, traits, résumé et liste « ce que je fais », technos, résumé et liste des formations, motivation), `version integer`, `portrait_key` et `previous_portrait_key` (hors version), `updated_at`. Contenu initial versé par la migration `0021_profile_seed.sql` (généré depuis le contenu statique du front, égal à `src/profile/profile.seed.ts`, vérifié par test).

| Méthode | Chemin              | Auth | Rôle                                                                                                                                                                                                                                                                                                                             |
| ------- | ------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET     | `/profile`          | ❌   | Document à plat + `version`, `updatedAt`, `portrait` (URL proxy ou `null` = portrait par défaut du front). 120 req/min.                                                                                                                                                                                                          |
| PUT     | `/profile`          | ✅   | Remplace le document entier (`UpdateProfileDto` + `version` lue). Document identique à la `version` courante ⇒ 200 sans écriture ; version périmée ⇒ **409** ; 400 sur clé inconnue, borne (`PROFILE_LIMITS`), liste vide, `id` non UUID ou dupliqué, icône hors `^[a-z0-9-]{1,40}$`, texte blanc ou contenant du balisage HTML. |
| POST    | `/profile/portrait` | ✅   | Multipart `file` (max 4 Mo, `image/webp\|jpeg\|png\|avif`, 422 sinon). Recadré en **AVIF 640×800** (`ImageOptimizer.toPortrait`, `position: attention`), clé `profile/portrait-<sha8>.avif`. 200 + document. Envois simultanés sérialisés (verrou de ligne).                                                                     |
| DELETE  | `/profile/portrait` | ✅   | Retour au portrait par défaut. 204 (sans portrait : 204 sans écriture).                                                                                                                                                                                                                                                          |

**Lifecycle S3 du portrait** : une page `/about` déjà servie (onglet ouvert, cache HTTP) cite encore l'ancienne clé ; la supprimer à l'envoi casserait son image LCP. Chaque changement (envoi ou retrait) fait donc glisser les clés - courante → `previous_portrait_key` - et ne supprime que l'**avant-dernière** clé : au plus un fichier en trop dans le bucket, jamais une image citée absente.

**Sérialisation** : toute opération portrait tient le verrou de la ligne (`SELECT … FOR UPDATE` dans une transaction) : raccourci « même fichier », envoi S3 et `UPDATE` sous le même verrou, puis, après le `COMMIT`, suppression de l'objet devenu inutile dans une seconde transaction verrouillée qui ne supprime que si la ligne ne cite la clé ni comme courante ni comme précédente. La clé étant adressée par contenu, seule une opération portrait peut la réintroduire, envoi compris, et elle attend le verrou : une suppression décidée sous verrou ne retire jamais un objet cité. Deux envois simultanés s'appliquent l'un après l'autre (pas de 409). Envoi ou `UPDATE` en échec ⇒ rollback, puis l'objet envoyé est supprimé s'il n'est pas cité. Échec S3 du nettoyage ⇒ journalisé avec la clé (`S3 orphan …`), l'écriture reste validée, jamais une 500. **Durées bornées** : chaque transaction sur la ligne (opérations portrait **et** `PUT` texte) commence par `SET LOCAL lock_timeout = '5s'` ; au-delà, Postgres annule l'attente (`55P03`) et l'API répond **503** (« réessayez dans quelques secondes »), au lieu de garder une connexion du pool (10, partagé avec la lecture publique) indéfiniment. Le `PUT` texte ne prend pas le verrou `FOR UPDATE` et n'écrit jamais les colonnes du portrait (hors versionnage), mais son `UPDATE` attend derrière une opération portrait en cours : cette attente est bornée de la même façon. La lecture publique (`GET /profile`, `SELECT` simple) n'attend jamais le verrou. La détention du verrou est bornée par les délais du client S3 (`S3_TIMEOUTS`, ci-dessous). Test d'intégration sur Postgres réel : `PROFILE_IT_DATABASE_URL=… pnpm test -- profile-portrait.integration` (ignoré sans cette variable).

## Mailer

Envoi par l'API HTTP de [Resend](https://resend.com) (`fetch`, sans SDK ni SMTP), consommé par Contact et par les commentaires du blog. Domaine `nedellec-julien.fr` vérifié dans Resend (DKIM + SPF via le sous-domaine `send`).

**Dev local** : une clé Resend dans `.env.local` ; les mails partent réellement (vers `OWNER_EMAIL`). Sans clé, ils sont seulement journalisés.
**Démonstration** (`APP_ENV=preview`) : aucun envoi, quelles que soient les variables (`LogMailer`).
**Prod** : `RESEND_API_KEY` et `MAIL_FROM` dans les variables de la pile ([deploy/portfolio.env.example](../../deploy/portfolio.env.example)).

**API (`MailerService`)** : `sendMail(...): Promise<void>` - 3 tentatives, backoff linéaire 1s/2s, même `Idempotency-Key` d'une tentative à l'autre (pas de doublon), throw après épuisement une erreur dont le destinataire et le `replyTo` sont masqués (l'appelant la journalise).

**Templates** : hébergés dans Resend (dashboard → Templates), désignés par leur alias. `sendMail({ to, subject, template: { id, variables }, replyTo? })` échappe chaque variable (`escapeHtml`, `src/mailer/mailer.utils.ts`) avant l'envoi : Resend insère les `{{{KEY}}}` telles quelles, et les valeurs viennent du formulaire public.

## Contact

Formulaire de contact public + gestion admin des messages.

**Schéma** : table `contact_message` (uuid, `name`, `email`, `subject`, `message`, `read: boolean`, `createdAt`).

**6 endpoints sous `/api/contact`** :

| Méthode | Chemin                            | Auth | Rôle                                                                                                                                       |
| ------- | --------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| POST    | `/contact/messages`               | ❌   | Soumission publique. **Quota : 3 par heure et par IP** (`CONTACT_THROTTLE`). Insère en DB, puis notifie l'admin par mail. 201 avec la row. |
| GET     | `/contact/messages`               | ✅   | Liste paginée (`?page&limit`), tri `createdAt DESC`.                                                                                       |
| GET     | `/contact/messages/unread-count`  | ✅   | Compteur de messages non lus.                                                                                                              |
| PATCH   | `/contact/messages/mark-all-read` | ✅   | Marque tous les messages non lus comme lus, renvoie `{ count }`.                                                                           |
| PATCH   | `/contact/messages/:id/read`      | ✅   | Marque un message comme lu.                                                                                                                |
| DELETE  | `/contact/messages/:id`           | ✅   | Suppression hard.                                                                                                                          |

**Stratégie mails** : fire-and-forget après le `db.insert` (helper `fireAndForget` dans `src/common/utils.ts`) - le visiteur reçoit 201 dès la persistance garantie ; un échec d'envoi (3 tentatives épuisées) est loggé mais invisible côté visiteur, le message reste consultable côté admin.

**Destinataire admin codé en dur** : `OWNER_EMAIL = 'contact@nedellec-julien.fr'` dans `src/mailer/mailer.constants.ts` (utilisé par le contact) - pas de variable d'env dédiée. `MAIL_FROM` reste l'expéditeur (rôle distinct).

**Template** : `contact-notification` dans Resend (alias dans `CONTACT_NOTIFICATION_TEMPLATE`, `src/mailer/mailer.constants.ts`). Variables : `NAME`, `SENDER_EMAIL`, `SUBJECT`, `MESSAGE`, `YEAR` (`EMAIL` est réservé par Resend). `reply_to` = adresse du visiteur : « Répondre » lui écrit directement.

## CV

Gestion du CV téléchargeable (pattern singleton - 1 row max en DB).

**Schéma** : table `cv_file` (uuid, `fileName`, `fileKey` unique, `fileSize`, `mimeType`, `uploadedAt`, `updatedAt`).

**4 endpoints sous `/api/cv`** :

| Méthode | Chemin         | Auth | Rôle                                                                                                                       |
| ------- | -------------- | ---- | -------------------------------------------------------------------------------------------------------------------------- |
| POST    | `/cv/upload`   | ✅   | Upload multipart (`file`, `application/pdf` strict). Upsert sur key fixe `cv/cv.pdf` (`onConflictDoUpdate` sur `fileKey`). |
| GET     | `/cv`          | ❌   | Métadonnées du CV courant, ou `null`.                                                                                      |
| GET     | `/cv/download` | ❌   | Stream backend du PDF, `Content-Disposition: attachment; filename="<original>"`. 404 si aucun CV.                          |
| DELETE  | `/cv`          | ✅   | Supprime DB row puis S3 (ordre inverse de Projects - DB d'abord, S3 ensuite).                                              |

**Pourquoi un proxy backend pour le download** : préserve le nom de fichier original uploadé par l'admin (pas la clé S3 `cv.pdf`).

## Analytics

Collecte de page-views/events custom du portfolio public + agrégation quotidienne via cron.

**3 tables** :

- `page_view` (raw, purgé après 30j)
- `analytics_event` (events custom : `project_click`, `article_view`, `cv_download`, purgé après 30j)
- `daily_stat` (rollup quotidien, conservé indéfiniment, unique sur `date`)

**8 endpoints sous `/api/analytics`** :

| Méthode | Chemin                                                              | Auth | Rôle                                                                                                        |
| ------- | ------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------- |
| POST    | `/analytics/track`                                                  | ❌   | Track page-view ou event custom. Fire-and-forget, 204. **Throttle 10/sec/IP**. Filtre les bots via `isbot`. |
| GET     | `/analytics/stats/overview`                                         | ✅   | Totaux (visitors, pv, sessions, bounceRate, avgDuration, eventCounts) sur une date range.                   |
| GET     | `/analytics/stats/chart`                                            | ✅   | Time-series quotidien (`daily_stat` + agrégation live pour aujourd'hui).                                    |
| GET     | `/analytics/stats/metrics?type=url\|referrer\|browser\|country\|os` | ✅   | Top N par dimension.                                                                                        |
| GET     | `/analytics/stats/active`                                           | ✅   | Sessions actives (5 dernières minutes).                                                                     |
| GET     | `/analytics/stats/projects`                                         | ✅   | Top projets cliqués.                                                                                        |
| GET     | `/analytics/stats/articles`                                         | ✅   | Top articles vus.                                                                                           |
| GET     | `/analytics/stats/cv-downloads`                                     | ✅   | Total + timeline 30j.                                                                                       |

**Privacy** : pas de cookies posés/lus ; IP utilisée uniquement pour hash de session + lookup pays, jamais persistée ; User-Agent jamais persisté brut (parsé en `browser`/`os`) ; session hash = `SHA256(IP + UA + YYYY-MM-DD UTC)`, non réversible, change chaque jour ; bots filtrés à l'entrée.

**Cron** : `@Cron('0 0 * * *', { timeZone: 'UTC' })` dans `AnalyticsAggregatorService` - agrège J-1 dans `daily_stat` (upsert idempotent), purge `page_view` + `analytics_event` de plus de 30 jours.

**Adresse du visiteur** : `clientIp` (`src/common/http.ts`) lit la dernière entrée de `X-Forwarded-For`, celle du reverse proxy, ou l'IP transmise par le rendu serveur du site quand l'appel porte `SSR_FORWARD_SECRET`.

## Observabilité (Sentry)

`@sentry/node` (error tracking uniquement, pas de profiling CPU - overkill pour le trafic d'un portfolio), initialisé dans `src/instrument.ts`, importé en tout premier dans `main.ts` : `.env` chargé, puis Sentry avant le module `http`. Les exceptions non gérées sont envoyées par `handleError` ; le rollup quotidien est suivi en cron monitor (`Sentry.withMonitor`).

- **Désactivé si `SENTRY_DSN` est vide** - pas de crash, juste no-op.
- **`@sentry/node` 11.6.0** (épinglée) : la v11 supprime `sendDefaultPii` et collecte tout par défaut. `dataCollection` ferme donc chaque catégorie : `userInfo` (IP comprise), `cookies`, `httpHeaders` (requête : `User-Agent` seul, réponse : rien), `httpBodies: []`, `urlQueryParams`, `graphQL`, `genAI`, `databaseQueryData`, `queues`, `stackFrameVariables`. Seul `frameContextLines` (lignes de notre code autour des frames) garde son défaut. `traceLifecycle: 'static'` : des transactions entières plutôt que les spans diffusés un à un (`stream`, défaut v11).
- `beforeSend` sert de filet : retire `user.ip_address`, les cookies, les en-têtes `authorization`/`proxy-authorization`/`cookie`/`set-cookie` en toute casse, la query string et le fragment de `request.url` (et `query_string`), et filtre les champs sensibles du body (liste `SENSITIVE_BODY_FIELDS` de `src/common/log-redact.ts`).
- `tracesSampleRate` : 20% en prod, 100% en dev (ou override via `SENTRY_TRACES_SAMPLE_RATE`).
- Les erreurs HTTP (4xx, 429 compris) ne partent jamais à Sentry : seules les exceptions non gérées (500) y vont.
- **`GET /api/config`** expose un DSN Sentry **distinct** (`SENTRY_FRONTEND_DSN`) pour le frontend Angular - projet Sentry séparé du backend, volontairement public (il ship dans le bundle browser une fois fetché).
- `pnpm sentry:check-instrumentation` (`scripts/check-sentry-instrumentation.cjs`, après `pnpm build`) : décore des classes témoins avec les vrais `@Injectable`, `@Catch`, `@Cron` après `dist/instrument.js` et vérifie les marques posées par Sentry ; exit 1 si l'un n'est pas tracé.

## Dev local

`compose.yaml` sert uniquement au dev (Postgres + MinIO, `pnpm db:up`) - aucune image applicative. En production, l'API est l'image `j-ned-app-api` (`Dockerfile`, ADR-0038), qui applique elle-même les migrations (`node dist/database/scripts/migrate.js`) ; en local, `pnpm db:migrate`.

## État réel

Modules réellement présents et livrés : Fondations, Auth, S3 Storage, Projects, Blog, Commentaires du blog, Profile, Mailer, Contact, CV, Analytics, Runtime Config.

## Licence

Le **code** est publié sous licence [MIT](LICENSE). Le **contenu éditorial** servi par l'API (articles, fiches projets, CV, visuels, templates de mail) reste sous **tous droits réservés** et n'est pas couvert par la licence MIT.
