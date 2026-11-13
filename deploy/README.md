# Déploiement sur le serveur (Dokploy, ADR-0038)

La pile de production est `compose.yaml` : site, API, migrations, cron, Postgres et sauvegarde. Dokploy
ne construit rien ; il tire les images publiées sur GHCR par la CI (`j-ned-app-web`, `j-ned-app-api`,
`j-ned-app-backup`). Le trafic arrive par le tunnel Cloudflare, puis le Traefik de Dokploy.

## Mise en place (une fois)

1. **Paquets GHCR** : les trois paquets doivent être lisibles par le serveur. Publics, rien à faire ;
   privés, déclarer `ghcr.io` dans les registres de Dokploy avec un jeton `read:packages`.
2. **Bucket de sauvegarde** : bucket R2 privé (`portfolio-backups`), jeton d'API limité à ce bucket,
   règle de cycle de vie qui supprime les objets après la durée voulue (30 jours par exemple).
3. **Dokploy** : nouveau service de type **Compose**, fournisseur GitHub, dépôt `j-ned/j-ned-app`,
   branche `master`, chemin `deploy/compose.yaml`. **Auto Deploy désactivé** : c'est la CI qui
   déclenche, une fois les images publiées.
4. **Environment** : coller `portfolio.env.example` rempli.
5. **Domains** : service `portfolio-web`, port `3000`, HTTP (le TLS est celui de Cloudflare). Le bouton
   _Preview Compose_ doit montrer `portfolio-web` sur `default` **et** `dokploy-network`, et les autres
   services sur `default` seulement.
6. **Premier déploiement** à la main (bouton Deploy), puis import des données (ci-dessous).
7. **Déclenchement par la CI** : secrets du dépôt `DOKPLOY_URL` (adresse du panneau, sans `/` final),
   `DOKPLOY_API_KEY` (profil → API) et `DOKPLOY_COMPOSE_ID` (dernier segment de l'URL du service).
   Variable facultative `DEPLOY_HEALTH_URL` (`https://…/healthz`) pour sonder le site après coup.
   Tant que ces secrets manquent, le workflow `Deploy` ne fait rien.

## Import des données depuis Neon

À lancer sur le serveur, base vide juste migrée par le premier déploiement. `<neon>` est la chaîne de
connexion **directe** (non poolée) de Neon, `<db>` le conteneur `portfolio-db` (`docker ps`).

```bash
docker exec <db> sh -c 'pg_dump --format=custom --no-owner --no-privileges --data-only --exclude-schema=drizzle "<neon>" > /tmp/neon.dump'
```

```bash
docker exec <db> sh -c 'pg_restore --no-owner --no-privileges --data-only --disable-triggers --exit-on-error -U "$POSTGRES_USER" -d "$POSTGRES_DB" /tmp/neon.dump && rm /tmp/neon.dump'
```

Le schéma vient des migrations, seules les données sont copiées. Vérifier ensuite quelques comptes de
lignes des deux côtés, et que l'admin se connecte.

## Sauvegardes

Le service `portfolio-backup` envoie chaque nuit (3 h UTC) un dump chiffré dans le bucket. `<backup>`
est son conteneur.

- Sauvegarde immédiate : `docker exec <backup> backup.sh once`
- Restauration dans une base **vide** : créer la base, puis
  `docker exec -e PGDATABASE=<base> <backup> backup.sh restore <objet>`
- La phrase `BACKUP_PASSPHRASE` se conserve aussi hors du serveur : sans elle, aucune sauvegarde ne
  se déchiffre.
- Un échec n'alerte personne : il s'écrit dans les journaux du conteneur. Regarder le bucket de temps
  en temps, et rejouer une restauration avant de supprimer Neon.

## Retour à une version

Dans Environment, fixer `WEB_IMAGE` et/ou `API_IMAGE` sur un tag `sha-<commit>` publié, puis Deploy.
Une migration déjà appliquée ne se défait pas ainsi : l'ancienne image doit tolérer le nouveau schéma
(expand, migrate, contract).
