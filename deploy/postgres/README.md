# Rôle Postgres de l'API

L'image `postgres` ne crée qu'un rôle, `POSTGRES_USER` : superutilisateur et propriétaire du schéma.
Tant que l'API s'y connecte, une injection SQL ou une API compromise peut supprimer une table, en
modifier la structure ou lire un fichier du serveur. `app-role.sql` crée un second rôle,
`portfolio_app`, réservé à l'API :

| Rôle                           | Utilisé par                                             | Peut                                       |
| ------------------------------ | ------------------------------------------------------- | ------------------------------------------ |
| `POSTGRES_USER` (propriétaire) | `portfolio-migrate`, `portfolio-backup`, gestes manuels | tout : schéma, données, restauration       |
| `portfolio_app` (applicatif)   | `portfolio-api`                                         | lire et écrire les lignes, table par table |

Le rôle applicatif n'a aucun attribut d'administration, n'est membre d'aucun rôle et ne possède
rien. Il ne peut ni créer (table, table temporaire, index, schéma, fonction, extension, rôle), ni
modifier ou supprimer une table, ni la vider par `TRUNCATE`, ni lire le suivi des migrations
(schéma `drizzle`).

## Privilèges accordés

Relevés dans le code de l'API (`apps/api/src`), table par table :

| Table                                                                 | Privilèges                     | Pourquoi                                                                             |
| --------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------ |
| `users`                                                               | SELECT, UPDATE                 | connexion, mot de passe, 2FA, révocation ; l'admin se crée avec le rôle propriétaire |
| `profile_content`                                                     | SELECT, UPDATE                 | une ligne, créée par migration ; `SELECT … FOR UPDATE` du portrait exige UPDATE      |
| `daily_stat`                                                          | SELECT, INSERT, UPDATE         | agrégat quotidien inséré ou mis à jour (`ON CONFLICT`), jamais supprimé              |
| `analytics_event`, `login_event`                                      | SELECT, INSERT, DELETE         | insérés, lus, purgés par la tâche quotidienne ; jamais modifiés                      |
| `page_view`                                                           | SELECT, INSERT, UPDATE, DELETE | durée de visite mise à jour, purge                                                   |
| `cv_file`, `contact_message`, `blog_post`, `project`, `project_image` | SELECT, INSERT, UPDATE, DELETE | gérés depuis l'admin (et le formulaire de contact)                                   |

`SET LOCAL lock_timeout` ne demande aucun privilège. Il n'y a aucune séquence dans `public` (clés
`uuid`). Les tables que créeront les **prochaines migrations** reçoivent d'office SELECT, INSERT,
UPDATE, DELETE (`ALTER DEFAULT PRIVILEGES` du rôle propriétaire) : aucune intervention à prévoir.

Conséquences à connaître :

- Une évolution de l'API qui écrit autrement dans une table existante (par exemple supprimer un
  compte) demande d'étendre la liste de `app-role.sql`, de mettre `check.sh` à jour et de rejouer le
  script en production **avant** de déployer ce code. La CI de l'API tourne sous un superutilisateur
  et ne verra pas l'oubli ; `check.sh` et l'API en production, si.
- Création de l'admin (`node dist/database/seeds/admin.seed.js`) : avec le rôle propriétaire, en
  passant son URL (`docker exec -e DATABASE_URL=… <api> …`). Le changement de mot de passe
  (`dist/database/scripts/change-password.js`) passe sous le rôle applicatif.
- Une **restauration** (`backup.sh restore`) recrée les tables sans leurs privilèges, et un serveur
  neuf n'a pas le rôle : rejouer `app-role.sql` dans la base restaurée avant d'y brancher l'API.

## Vérification locale

`check.sh` joue le script devant un Postgres jetable de la version du compose : schéma posé par les
migrations de l'image de l'API, script joué deux fois, puis le rôle applicatif doit réussir chaque
opération accordée, se voir refuser chaque atteinte au schéma (`42501`), et l'API démarre sous ce
rôle (sonde, lectures, message de contact, tâche quotidienne).

```bash
docker build -f apps/api/Dockerfile -t j-ned-app-api:ci .
deploy/postgres/check.sh
```

## Mise en service (expand, migrate, contract)

À lancer sur le serveur. `<db>`, `<api>` et `<backup>` sont les conteneurs `portfolio-db`,
`portfolio-api` et `portfolio-backup` (`docker ps`). Chaque étape se vérifie et se défait avant de
passer à la suivante. Seule l'étape 2 interrompt l'API, quelques secondes.

### 0. Sauvegarde

```bash
docker exec <backup> backup.sh once
```

Vérification : la ligne `sauvegarde envoyée : portfolio-….dump.gpg` s'affiche et l'objet est dans le
bucket. Noter son nom : c'est le point de retour si la base devait être restaurée (README du dossier
parent, « Sauvegardes »).

### 1. Expand : créer le rôle (aucune coupure)

L'API tourne encore sous le rôle propriétaire : rien ne change pour elle. Copier `app-role.sql` sur
le serveur, puis, le mot de passe venant d'être généré (il n'apparaît ni à l'écran ni dans
l'historique) :

```bash
export POSTGRES_APP_PASSWORD="$(openssl rand -hex 32)"
docker exec -i -e POSTGRES_APP_PASSWORD <db> sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f -' < app-role.sql
```

Vérification : le script finit par le tableau des privilèges (11 tables, celles de la section
ci-dessus) sans `ERROR`. Le rôle se connecte par le réseau avec son mot de passe et ne peut pas
créer (depuis le conteneur de sauvegarde, qui a `psql` et joint la base ; dans le conteneur de la
base, la connexion locale ne demande aucun mot de passe et ne prouverait rien) :

```bash
docker exec -e PGUSER=portfolio_app -e PGPASSWORD="$POSTGRES_APP_PASSWORD" <backup> \
  psql -c 'select count(*) from project' -c 'create table intrus (id int)'
```

Attendu : un compte de lignes, puis `ERROR:  permission denied for schema public`.

Retour arrière : supprimer le rôle (sans effet sur les données ni sur l'API, qui ne l'utilise pas
encore).

```bash
docker exec -i <db> sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1' <<'SQL'
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM portfolio_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM portfolio_app;
DROP OWNED BY portfolio_app;
DROP ROLE portfolio_app;
GRANT TEMPORARY ON DATABASE portfolio TO PUBLIC;
SQL
```

### 2. Migrate : brancher l'API sur le rôle (coupure de l'API : quelques secondes)

Dans Dokploy, onglet Environment, ajouter les deux variables **ensemble** (l'une sans l'autre donne
une URL de connexion fausse et l'API ne démarre pas), puis Deploy :

```
POSTGRES_APP_USER=portfolio_app
POSTGRES_APP_PASSWORD=<valeur de l'étape 1 : echo "$POSTGRES_APP_PASSWORD">
```

Seul le conteneur de l'API est recréé ; les migrations sont rejouées sous le rôle propriétaire, la
base, le site et la sauvegarde ne bougent pas. Pendant ces secondes, nginx sert les pages déjà
rendues et les appels à l'API échouent.

Vérification :

```bash
docker exec <db> sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select usename, count(*) from pg_stat_activity where datname = current_database() group by 1"'
docker logs <api> 2>&1 | grep -ci 'permission denied'
```

Attendu : des connexions `portfolio_app` (et plus aucune du rôle propriétaire hors cette session), `0`
refus. Puis `https://…/api/health` répond `"db":{"status":"up"}`, la connexion à l'admin fonctionne,
une modification d'article s'enregistre. Surveiller les journaux de l'API jusqu'au lendemain : la
tâche de minuit UTC (`cron quotidien : ok` dans `portfolio-cron`) écrit l'agrégat et purge.
Terminer par `unset POSTGRES_APP_PASSWORD` une fois la valeur rangée dans le gestionnaire de mots de
passe.

Retour arrière : commenter les deux variables dans Environment, puis Deploy. L'API revient au rôle
propriétaire (même coupure de quelques secondes). Le rôle peut rester en place.

### 3. Contract : rendre le rôle obligatoire

Après quelques jours sans refus de privilège dans les journaux, une PR rend les deux variables
obligatoires, pour qu'un oubli ne ramène pas l'API au rôle propriétaire en silence :

- `compose.yaml`, service `portfolio-api` :
  `DATABASE_URL=postgres://${POSTGRES_APP_USER:?}:${POSTGRES_APP_PASSWORD:?}@portfolio-db:5432/${POSTGRES_DB:?}` ;
- `portfolio.env.example` : les deux lignes décommentées ;
- `compose.check.sh` : le cas « sans `POSTGRES_APP_*` » devient un refus attendu de
  `docker compose config`.

Aucune coupure (la valeur résolue ne change pas : l'API n'est pas recréée). Retour arrière : annuler
la PR.

## Changer le mot de passe

Rejouer `app-role.sql` avec une nouvelle valeur, puis la reporter dans Environment et Deploy. Entre
les deux, les connexions déjà ouvertes de l'API continuent ; une nouvelle connexion serait refusée :
enchaîner sans attendre.
