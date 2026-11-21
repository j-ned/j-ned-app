# Déploiement sur le serveur (Dokploy, ADR-0038)

La pile de production est `compose.yaml` : site, API, migrations, cron, Postgres et sauvegarde. Dokploy
ne construit rien ; il tire les images publiées sur GHCR par la CI (`j-ned-app-web`, `j-ned-app-api`,
`j-ned-app-backup`). Le trafic arrive par le tunnel Cloudflare, puis le Traefik de Dokploy.

## Mise en place (une fois)

1. **Paquets GHCR** : les trois paquets doivent être lisibles par le serveur. Publics, rien à faire ;
   privés, déclarer `ghcr.io` dans les registres de Dokploy avec un jeton `read:packages`.
2. **Bucket de sauvegarde** : bucket R2 privé (`portfolio-backups`), jeton d'API limité à ce bucket,
   règle de cycle de vie qui supprime les objets après la durée voulue (30 jours par exemple).
3. **Dokploy** : nouveau service de type **Compose** dont la source est le dépôt : fournisseur
   **Git**, URL `https://github.com/j-ned/j-ned-app.git`, branche `master`, Compose Path
   `./deploy/compose.yaml` (la valeur par défaut, `./docker-compose.yml`, échoue avec « Compose file
   not found »). **Auto Deploy désactivé** : c'est la CI qui déclenche, une fois les images
   publiées. Dokploy clone le dépôt à chaque déploiement : une modification de `compose.yaml` part
   donc à la fusion, comme le code. En mode **Raw**, Dokploy rejouerait le YAML collé dans son
   éditeur et ignorerait le dépôt.
4. **Environment** : coller `portfolio.env.example` rempli (les deux variables `POSTGRES_APP_*`
   restent commentées jusqu'à l'étape 6).
5. **Domains** : service `portfolio-web`, port `3000`, HTTP (le TLS est celui de Cloudflare). Le bouton
   _Preview Compose_ doit montrer `portfolio-web` sur `default` **et** `dokploy-network`, la base sur
   `portfolio-db` seulement, et aucun autre service sur `dokploy-network` (tableau de « Durcissement
   de la pile »).
6. **Premier déploiement** à la main (bouton Deploy), puis import des données (ci-dessous), puis
   création du rôle Postgres de l'API ([postgres/README.md](postgres/README.md), étapes 1 et 2).
7. **Déclenchement par la CI** : l'interrupteur _Autodeploy_ de Dokploy ne sert pas ici (il
   partirait avant la publication des images). C'est le workflow `Deploy` qui appelle Dokploy une fois
   les images publiées, après avoir validé `compose.yaml` (`deploy/compose.check.sh`). Secrets du dépôt : `DOKPLOY_URL` (adresse du panneau, sans `/`
   final), `DOKPLOY_API_KEY` (profil → API) et `DOKPLOY_COMPOSE_ID` (dernier segment de l'URL du
   service). Le panneau étant derrière Cloudflare Access, il faut aussi un jeton de service (Zero
   Trust → Service Tokens), autorisé par une règle **Service Auth** sur l'application du panneau, dans
   `CF_ACCESS_CLIENT_ID` et `CF_ACCESS_CLIENT_SECRET`. Variable facultative `DEPLOY_HEALTH_URL`
   (`https://…/healthz`) pour sonder le site après coup. Tant que les secrets Dokploy manquent, le
   workflow ne fait rien ; une fois posés, une redirection ou un refus le font échouer.

## Import de données depuis une autre base

À lancer sur le serveur, dans la base juste migrée par un déploiement. `SOURCE` est la chaîne de
connexion directe de la base d'origine, `<db>` le conteneur `portfolio-db` (`docker ps`).

```bash
read -rs SOURCE
```

Le dump se fait avec un client de la version de la base d'origine (ici 18), limité au schéma `public` :
le schéma vient des migrations, seules les données sont copiées.

```bash
(umask 077; docker run --rm -e SOURCE="$SOURCE" postgres:18-alpine sh -c 'pg_dump --data-only --no-owner --no-privileges --schema=public "$SOURCE"' > ~/source.sql; echo "code=$?")
```

Les migrations créent déjà quelques lignes : les tables sont vidées puis remplies dans une seule
transaction, qui ne laisse rien en cas d'erreur.

```bash
{ cat <<'SQL'
SET session_replication_role = replica;
DO $$
DECLARE tables text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ') INTO tables
  FROM pg_tables WHERE schemaname = 'public';
  EXECUTE 'TRUNCATE ' || tables || ' RESTART IDENTITY CASCADE';
END $$;
SQL
cat ~/source.sql; } | docker exec -i <db> sh -c 'psql -q -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 --single-transaction'; echo "code=$?"
```

Comparer ensuite quelques comptes de lignes des deux côtés et vérifier que l'admin se connecte, puis
effacer le fichier, qui contient les données : `shred -u ~/source.sql; unset SOURCE`.

## Durcissement de la pile

Chaque service tourne sur un système de fichiers en lecture seule (`read_only`), sans capacité Linux
(`cap_drop: [ALL]`), sans élévation de privilège (`no-new-privileges`), avec une mémoire et un nombre
de processus bornés. `compose.check.sh` l'affirme sur la configuration résolue avant chaque
déploiement, et refuse un service ajouté sans ces garanties.

| Service             | Utilisateur              | Inscriptible                                                                          | Capacités rendues           | Mémoire, processus | Réseaux                      |
| ------------------- | ------------------------ | ------------------------------------------------------------------------------------- | --------------------------- | ------------------ | ---------------------------- |
| `portfolio-web`     | root, puis `ssr`/`nginx` | tmpfs `/etc/nginx/conf.d`, `/run` ; volume `portfolio-web-cache` (`/var/cache/nginx`) | CHOWN, KILL, SETGID, SETUID | 512 Mo, 256        | `default`, `dokploy-network` |
| `portfolio-api`     | `node`                   | tmpfs `/tmp`                                                                          | aucune                      | 768 Mo, 256        | `default`, `portfolio-db`    |
| `portfolio-migrate` | `node`                   | rien                                                                                  | aucune                      | 256 Mo, 64         | `portfolio-db`               |
| `portfolio-cron`    | `node`                   | rien                                                                                  | aucune                      | 32 Mo, 16          | `default`                    |
| `portfolio-db`      | `postgres`               | tmpfs `/run/postgresql` ; volume `portfolio-db-data`                                  | aucune                      | 1 Go, 256          | `portfolio-db`               |
| `portfolio-backup`  | `postgres`               | volume `portfolio-backup-work` (`/tmp`)                                               | aucune                      | 256 Mo, 64         | `default`, `portfolio-db`    |

- **Site** : son script de démarrage reste root pour lancer Node sous `ssr` et nginx sous `nginx`
  (SETUID, SETGID), les surveiller et les arrêter (KILL), et nginx remet ses dossiers de cache à son
  utilisateur (CHOWN). Sans l'une des quatre, le conteneur ne démarre pas. Le port 3000 ne demande pas
  NET_BIND_SERVICE. S'en passer demanderait de changer l'image (nginx et Node lancés sans root).
- **Cache du site et dossier de travail de la sauvegarde sur volume**, pas en tmpfs : un tmpfs compte
  dans la mémoire du conteneur, et le cache des images va jusqu'à 1 Go, le dump jusqu'à la taille de
  la base. Le cache survit désormais à un redéploiement ; le vider :
  service arrêté, `docker volume rm <volume>` (celui qui finit par `portfolio-web-cache` dans
  `docker volume ls`).
- **Base** : lancée directement sous `postgres` (uid 70, déjà propriétaire du volume), donc sans les
  capacités que demande le passage par root. À vérifier avant le premier déploiement durci :
  `docker exec <db> stat -c %u /var/lib/postgresql/data` rend `70`.
- **Réseaux** : `portfolio-db` est interne (aucune sortie) et ne relie la base qu'à l'API, aux
  migrations et à la sauvegarde ; le site et le cron ne la voient pas. Aucun port n'est publié.
- **Limites** : `mem_limit` et `pids_limit`, lues par `docker compose up` (un `deploy.resources` vise
  Swarm). Un dépassement de mémoire tue le conteneur, que sa politique relance : `docker stats` donne
  la consommation réelle, et `docker inspect <conteneur> --format '{{.State.OOMKilled}}'` dit si la
  limite est trop basse. Au repos : site ~100 Mo, API ~70 Mo, base ~25 Mo.
- **Premier déploiement durci** : tous les conteneurs sont recréés, base comprise. Le site et l'API
  sont coupés le temps du redémarrage (de l'ordre de 30 s). Retour arrière : annuler le commit du
  compose sur `master` et redéployer ; les données ne sont pas touchées.

## Rôle Postgres de l'API

L'API se connecte avec un rôle qui lit et écrit les lignes sans aucun droit sur le schéma ; les
migrations et la sauvegarde gardent le rôle propriétaire. Création du rôle, privilèges, mise en
service pas à pas et retours arrière : [postgres/README.md](postgres/README.md).

## Sauvegardes

Le service `portfolio-backup` envoie chaque nuit (3 h UTC) un dump chiffré dans le bucket. `<backup>`
est son conteneur.

- Sauvegarde immédiate : `docker exec <backup> backup.sh once`
- Restauration dans une base **vide** : créer la base, puis
  `docker exec -e PGDATABASE=<base> <backup> backup.sh restore <objet>`. Les privilèges ne sont pas
  dans la sauvegarde : rejouer `postgres/app-role.sql` dans la base restaurée avant d'y brancher l'API.
- La phrase `BACKUP_PASSPHRASE` se conserve aussi hors du serveur : sans elle, aucune sauvegarde ne
  se déchiffre.
- Un échec n'alerte personne : il s'écrit dans les journaux du conteneur. Regarder le bucket de temps
  en temps, et rejouer une restauration de temps à autre.

## Retour à une version

Dans Environment, fixer `WEB_IMAGE` et/ou `API_IMAGE` sur un tag `sha-<commit>` publié, puis Deploy.
Une migration déjà appliquée ne se défait pas ainsi : l'ancienne image doit tolérer le nouveau schéma
(expand, migrate, contract).
