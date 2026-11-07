# Previews Vercel isolées de la production

Une preview du projet Vercel `j-ned-app` (`VERCEL_ENV=preview`, toute branche autre que `master`)
ne doit jamais toucher aux données ni aux secrets de production. Elle tourne sur la branche Neon
`preview` (schéma + seed de démo, **jamais de copie de prod**) avec ses propres secrets.

## Ce que fait le code (sans configuration)

La distinction production / preview repose sur `VERCEL_ENV`, posé par Vercel lui-même, jamais sur
`NODE_ENV` (qui peut valoir `production` sur une preview) ni sur une variable du projet : une variable
oubliée ou mal ciblée ne peut pas faire partir de vrais emails depuis une preview.

| Sujet                               | Production (`VERCEL_ENV=production`)                                                   | Preview (`VERCEL_ENV=preview`)                                                                                                                                                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Emails (Resend)                     | `RESEND_API_KEY` et `MAIL_FROM` **obligatoires** : l'API refuse de démarrer sans elles | **Aucun envoi**, même si des variables Resend traînent en Preview. Log : destinataire masqué (`c***@nedellec-julien.fr`) et sujet, jamais le contenu, l'adresse du visiteur ni le template. Le message de contact reste enregistré en base |
| Fichiers (S3 / R2)                  | `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` **obligatoires**          | Sans configuration S3 complète : envois, suppressions et `/api/storage/...` répondent **503** « File storage is disabled on this environment ». Les pages publiques s'affichent, les images sont absentes                                  |
| Cron quotidien                      | Vercel Cron + `CRON_SECRET`                                                            | Vercel ne lance pas les crons sur une preview ; sans `CRON_SECRET`, `/api/cron/daily` répond 404                                                                                                                                           |
| IP du visiteur transmise par le SSR | `SSR_FORWARD_SECRET`                                                                   | Sans lui, l'en-tête est ignoré (quotas comptés sur l'IP de la fonction SSR)                                                                                                                                                                |

Hors Vercel (poste local, CI), les mêmes variables sont facultatives : sans clé Resend, les mails sont
journalisés ; sans S3 complet, le stockage répond 503.

## Variables à créer en **Preview uniquement** (Vercel → Settings → Environment Variables)

| Nom                  | Valeur                                                                          | Statut                                                  |
| -------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`       | Chaîne de connexion **poolée** de la branche Neon `preview`                     | Obligatoire                                             |
| `JWT_SECRET`         | Nouveau secret, jamais celui de prod : `openssl rand -base64 48`                | Obligatoire (32 caractères min.)                        |
| `SSR_FORWARD_SECRET` | Nouveau secret partagé par les services `api` et `web` : `openssl rand -hex 32` | Recommandé (sans lui, quotas par IP de la fonction SSR) |
| `NODE_ENV`           | `production` (logs JSON, pas de journal SQL Drizzle)                            | Obligatoire en pratique, pas un secret                  |
| `CRON_SECRET`        | `openssl rand -hex 32`, seulement pour appeler `/api/cron/daily` à la main      | Facultatif (absent : 404)                               |

`JWT_EXPIRES_IN` et `TOTP_APP_NAME` peuvent rester en Preview : ce ne sont pas des secrets (défauts
`7d` et `J-Ned Portfolio`).

À **ne pas** créer en Preview : `RESEND_API_KEY`, `MAIL_FROM`, `SMTP_*` (ignorées), `S3_*` (le nom du
bucket `portfolio-storage` est fixé dans le code : tester le stockage en preview exigerait un compte
R2 distinct, avec son propre endpoint), `SENTRY_DSN` (l'environnement Sentry suit `NODE_ENV` : les
erreurs de preview arriveraient étiquetées `production` dans le projet de prod), `CORS_ORIGINS`
(le site de preview appelle l'API sur sa propre origine, le CORS n'intervient pas ; défaut
`http://localhost:4200`).

## Variables dont il faut **retirer la cible Preview**

- Famille Neon `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `PG*`, `POSTGRES_*`, `NEON_*` : régler
  l'intégration Neon de Vercel sur **Production only** (le ciblage se règle dans l'intégration, pas
  variable par variable), puis créer `DATABASE_URL` en Preview (ci-dessus).
- Variables propres à Preview, aux valeurs possiblement copiées de la prod : **supprimer**
  `JWT_SECRET`, `SSR_FORWARD_SECRET`, `CRON_SECRET` (puis recréer les deux premières avec de
  nouvelles valeurs), `S3_ACCESS_KEY`, `S3_ENDPOINT`, `S3_REGION`, `S3_SECRET_KEY`, `SENTRY_DSN`,
  `CORS_ORIGINS`.
- `MAIL_FROM`, `RESEND_API_KEY`, `SMTP_*` sont déjà en Production seulement : les laisser ainsi.

Après le changement, redéployer la preview (les variables sont lues au démarrage des fonctions).

## Secret GitHub Actions

| Nom                             | Valeur                                                       | Effet                                                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PREVIEW_DATABASE_URL_UNPOOLED` | Chaîne **directe** (non poolée) de la branche Neon `preview` | Le job `preview-db` de `api-ci.yml` applique les migrations de chaque PR sur cette branche, après le job `verify` (Postgres jetable). Sans le secret (forks, Dependabot), le job ne fait rien |

Une migration d'une PR non fusionnée reste appliquée sur la base de preview : en cas de conflit,
réinitialiser la base (étapes ci-dessous).

## Initialiser la base de preview (vide, sans donnée réelle)

1. Neon → _Branches_ → _Create branch_ `preview` **sans données** (option « schema only » ; à
   défaut, un projet Neon séparé). Jamais une branche avec données : ce serait une copie de prod.
2. Une branche « schema only » a les tables mais pas l'historique Drizzle : vider le schéma avant
   d'initialiser, sinon la première migration échoue sur des tables existantes.

   ```sql
   DROP SCHEMA IF EXISTS drizzle CASCADE;
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```

3. Les rôles d'une branche Neon sont hérités de la branche parente : **régénérer le mot de passe du
   rôle** sur la branche `preview` (Neon → _Roles_ → _Reset password_), pour que la chaîne de preview
   ne contienne pas le mot de passe de prod.
4. Migrations puis seed de démo :

   ```bash
   DATABASE_URL="<URL directe de la branche preview>" \
   DEMO_ADMIN_PASSWORD="$(openssl rand -base64 18)" \
   pnpm --filter @portfolio/api db:init-demo
   ```

   La commande crée l'admin `admin@demo.portfolio.test` (mot de passe = `DEMO_ADMIN_PASSWORD`, à
   garder dans un gestionnaire de mots de passe, 2FA désactivée), trois projets et trois articles
   fictifs (slugs `demo-…`, sans image). Elle **refuse** de tourner si `VERCEL_ENV=production`, et
   refuse, **avant toute migration**, une base qui contient un autre compte que celui de démo
   (production ou copie). Relançable : elle recrée les données de démo à l'identique et change le
   mot de passe de l'admin de démo.

   Les migrations versent aussi le contenu public du parcours et du guide d'atelier (migrations
   `0021` et `0030`) : textes déjà publiés sur le site, aucune donnée personnelle.

## Ce qui reste désactivé en preview

- Envoi d'emails (notification du formulaire de contact : journalisée, non envoyée).
- Stockage de fichiers (images de projets et d'articles, portrait, CV) : 503.
- Cron quotidien (rollup analytics, purge des quotas) : pas de cron Vercel hors production.

## Retour arrière

Remettre la cible Preview sur les variables de production rétablit l'état antérieur (previews sur
les données de prod) : à éviter. Côté code, revenir au commit précédent rend de nouveau `S3_*`,
`RESEND_API_KEY` et `MAIL_FROM` obligatoires partout ; en production, rien ne change (elles y sont
déjà).
