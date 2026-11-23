#!/usr/bin/env bash
# Juge `app-role.sql` devant un Postgres jetable de la version de la production : le schéma est posé
# par les migrations de l'image de l'API sous le rôle propriétaire, le script crée le rôle applicatif
# (deux fois : il se rejoue sans effet), puis ce rôle, connecté par son mot de passe, doit réussir ce
# dont l'API a besoin et se voir refuser toute atteinte au schéma. L'API elle-même démarre enfin
# sous ce rôle. Même script en CI et en local, après
# `docker build -f apps/api/Dockerfile -t j-ned-app-api:ci .` depuis la racine.
#   deploy/postgres/check.sh [image de l'API]
# CHECK_PREFIX : préfixe des conteneurs et du réseau jetables (défaut `portfolio-app-role`).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE="${1:-j-ned-app-api:ci}"
PREFIX="${CHECK_PREFIX:-portfolio-app-role}"
NETWORK="$PREFIX-ci"
DB="$PREFIX-db"
API="$PREFIX-api"
PORT=3191
OWNER=portfolio
APP=portfolio_app
DATABASE=portfolio
POSTGRES_IMAGE="$(sed -n 's/^ *image: \(postgres:[^ ]*\)$/\1/p' "$HERE/../compose.yaml")"
test -n "$POSTGRES_IMAGE" || { echo "image postgres introuvable dans compose.yaml" >&2; exit 1; }

cleanup() {
  # `-v` : le volume anonyme de l'image postgres part avec le conteneur.
  docker rm -f -v "$API" "$DB" >/dev/null 2>&1 || true
  docker network rm "$NETWORK" >/dev/null 2>&1 || true
}
trap cleanup EXIT
cleanup

OWNER_PASSWORD="$(openssl rand -hex 32)"
APP_PASSWORD="$(openssl rand -hex 32)"
CRON_SECRET="$(openssl rand -hex 32)"

fail() { echo "$1" >&2; exit 1; }

docker network create "$NETWORK" >/dev/null
docker run -d --name "$DB" --network "$NETWORK" \
  -e POSTGRES_USER="$OWNER" -e POSTGRES_PASSWORD="$OWNER_PASSWORD" -e POSTGRES_DB="$DATABASE" \
  "$POSTGRES_IMAGE" >/dev/null
for _ in $(seq 1 60); do
  if docker exec "$DB" psql -U "$OWNER" -d "$DATABASE" -c 'select 1' >/dev/null 2>&1; then break; fi
  sleep 1
done

owner_url="postgres://$OWNER:$OWNER_PASSWORD@$DB:5432/$DATABASE"
app_url="postgres://$APP:$APP_PASSWORD@$DB:5432/$DATABASE"
migrate() { docker run --rm --network "$NETWORK" -e DATABASE_URL="$1" "$IMAGE" node dist/database/scripts/migrate.js; }
# Rôle propriétaire, par le socket du conteneur.
owner_psql() { docker exec -i "$DB" psql -U "$OWNER" -d "$DATABASE" -v ON_ERROR_STOP=1 -At "$@"; }
# Rôle applicatif, par le réseau : seul chemin où son mot de passe est exigé (le socket local de
# l'image postgres fait confiance à tout le monde).
app_psql() {
  docker run --rm -i --network "$NETWORK" -e PGPASSWORD="$APP_PASSWORD" "$POSTGRES_IMAGE" \
    psql -h "$DB" -U "$APP" -d "$DATABASE" -v ON_ERROR_STOP=1 -At "$@"
}
# `apply_role <mot de passe>` : le script tel que le joue le propriétaire du serveur (README.md).
apply_role() {
  docker exec -i -e POSTGRES_APP_PASSWORD="$1" "$DB" psql -U "$OWNER" -d "$DATABASE" -q -f - \
    < "$HERE/app-role.sql"
}

migrate "$owner_url" >/dev/null
owner_psql -c "select 1 from pg_roles where rolname = '$OWNER' and rolsuper" | grep -q 1 \
  || fail "le rôle propriétaire du test n'est pas celui de l'image postgres (superutilisateur)"

# Sans mot de passe, ou avec un mot de passe qui casserait l'URL de connexion : refus, rien de créé.
for refused in '' 'trop-court' "$(openssl rand -hex 16)@$(openssl rand -hex 16)"; do
  if apply_role "$refused" >/dev/null 2>&1; then fail "script accepté avec un mot de passe invalide"; fi
done
test "$(owner_psql -c "select count(*) from pg_roles where rolname = '$APP'")" = "0" \
  || fail "rôle créé malgré un mot de passe refusé"

apply_role "$APP_PASSWORD" >/dev/null
apply_role "$APP_PASSWORD"

# Aucun attribut d'administration, membre d'aucun rôle, propriétaire de rien.
test "$(owner_psql -c "select rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls,
    (select count(*) from pg_auth_members where member = r.oid),
    (select count(*) from pg_class where relowner = r.oid)
  from pg_roles r where rolname = '$APP'")" = "t|f|f|f|f|f|0|0" || fail "attributs du rôle applicatif inattendus"

# Un mauvais mot de passe est refusé.
if docker run --rm --network "$NETWORK" -e PGPASSWORD=mauvais "$POSTGRES_IMAGE" \
  psql -h "$DB" -U "$APP" -d "$DATABASE" -c 'select 1' >/dev/null 2>&1; then
  fail "connexion du rôle applicatif acceptée avec un mauvais mot de passe"
fi

# Ce dont l'API a besoin : chaque privilège accordé sert, dans une transaction annulée à la fin.
app_psql >/dev/null <<'SQL' || fail "une opération nécessaire à l'API est refusée au rôle applicatif"
BEGIN;
SET LOCAL lock_timeout = '5s';
SELECT id FROM profile_content WHERE id = 'main' FOR UPDATE;
UPDATE profile_content SET version = version + 1 WHERE id = 'main';
SELECT count(*) FROM users;
UPDATE users SET token_version = token_version + 1;
INSERT INTO daily_stat (date) VALUES ('2000-01-01')
  ON CONFLICT (date) DO UPDATE SET updated_at = now();
INSERT INTO page_view (session_hash, url) VALUES ('check', '/');
UPDATE page_view SET url = '/about' WHERE session_hash = 'check';
DELETE FROM page_view WHERE session_hash = 'check';
INSERT INTO analytics_event (session_hash, event_type) VALUES ('check', 'cv_download');
DELETE FROM analytics_event WHERE session_hash = 'check';
INSERT INTO login_event (kind) VALUES ('password_rejected');
DELETE FROM login_event WHERE kind = 'password_rejected';
INSERT INTO contact_message (name, email, subject, message) VALUES ('Témoin', 'temoin@parity.test', 'Sujet', 'Message');
UPDATE contact_message SET read = true;
DELETE FROM contact_message;
INSERT INTO blog_post (id, title, slug, excerpt, content_markdown)
  VALUES ('00000000-0000-4000-8000-000000000001', 'Témoin', 'temoin-role', 'Extrait', 'Corps');
INSERT INTO blog_comment (post_id, author_kind, author_name, author_email, sender_hash, body)
  VALUES ('00000000-0000-4000-8000-000000000001', 'visitor', 'Témoin', 'temoin@parity.test', 'check', 'Un commentaire');
SELECT count(*) FROM blog_comment WHERE status = 'pending';
UPDATE blog_comment SET status = 'published', moderated_at = now(), sender_hash = NULL;
DELETE FROM blog_comment;
SELECT count(*) FROM blog_post;
SELECT count(*) FROM project;
SELECT count(*) FROM project_image;
SELECT count(*) FROM cv_file;
DELETE FROM blog_post;
DELETE FROM project_image;
DELETE FROM project;
DELETE FROM cv_file;
ROLLBACK;
SQL

# Ce qui lui est refusé : chaque commande doit échouer par manque de privilège (42501), pas pour une
# autre raison. Une commande acceptée arrête tout.
denied() {
  app_psql >/dev/null <<SQL || fail "le rôle applicatif a pu exécuter une commande interdite (voir ci-dessus)"
DO \$check\$
DECLARE
  command text;
BEGIN
  FOREACH command IN ARRAY ARRAY[$1] LOOP
    BEGIN
      EXECUTE command;
    EXCEPTION WHEN insufficient_privilege THEN
      CONTINUE;
    END;
    RAISE EXCEPTION 'commande acceptée : %', command;
  END LOOP;
END
\$check\$;
SQL
}
denied "
  'CREATE TABLE public.intrus (id int)',
  'CREATE TEMPORARY TABLE intrus (id int)',
  'CREATE SCHEMA intrus',
  'CREATE INDEX intrus ON public.project (title)',
  'CREATE TYPE public.intrus AS ENUM (''a'')',
  'CREATE FUNCTION public.intrus() RETURNS int LANGUAGE sql AS ''select 1''',
  'CREATE EXTENSION pgcrypto',
  'CREATE ROLE intrus',
  'ALTER TABLE public.project ADD COLUMN intrus int',
  'ALTER TABLE public.users DISABLE ROW LEVEL SECURITY',
  'DROP TABLE public.project',
  'DROP TABLE public.project_image',
  'DROP SCHEMA public CASCADE',
  'TRUNCATE public.page_view',
  'TRUNCATE public.contact_message',
  'TRUNCATE public.blog_comment',
  'INSERT INTO public.users (email, password_hash) VALUES (''intrus@parity.test'', ''x'')',
  'DELETE FROM public.users',
  'INSERT INTO public.profile_content (id, content) VALUES (''main'', ''{}'')',
  'DELETE FROM public.profile_content',
  'DELETE FROM public.daily_stat',
  'UPDATE public.analytics_event SET event_type = ''x''',
  'UPDATE public.login_event SET kind = ''password_accepted''',
  'SELECT * FROM drizzle.__drizzle_migrations',
  'DELETE FROM drizzle.__drizzle_migrations',
  'ALTER ROLE $APP SUPERUSER',
  'ALTER ROLE $APP CREATEDB',
  'SET ROLE $OWNER',
  'COPY public.users TO PROGRAM ''cat''',
  'SELECT pg_read_file(''/etc/passwd'')'
"

# Les migrations ne passent plus avec le rôle applicatif : elles gardent le rôle propriétaire.
if migrate "$app_url" >/dev/null 2>&1; then fail "migrations acceptées sous le rôle applicatif"; fi

# Une table et une séquence créées par une migration future sont utilisables sans rejouer le script,
# et toujours pas modifiables.
owner_psql -q -c 'CREATE TABLE public.table_future (id serial PRIMARY KEY, label text)'
app_psql >/dev/null <<'SQL' || fail "table créée après coup inaccessible au rôle applicatif (privilèges par défaut)"
INSERT INTO table_future (label) VALUES ('a');
UPDATE table_future SET label = 'b';
SELECT * FROM table_future;
DELETE FROM table_future;
SQL
denied "'TRUNCATE public.table_future', 'DROP TABLE public.table_future', 'ALTER TABLE public.table_future ADD COLUMN intrus int'"
# Le script rejoué après cette « migration » ne retire pas l'accès à la nouvelle table.
apply_role "$APP_PASSWORD" >/dev/null
app_psql -c 'SELECT count(*) FROM table_future' >/dev/null || fail "accès à la nouvelle table perdu en rejouant le script"
owner_psql -q -c 'DROP TABLE public.table_future'

# Une table que le rôle ne peut pas lire (créée avant les privilèges par défaut, absente de la liste)
# arrête le script, qui n'applique rien.
owner_psql -q -c "CREATE TABLE public.table_oubliee (id int); REVOKE ALL ON public.table_oubliee FROM $APP"
if apply_role "$APP_PASSWORD" >/dev/null 2>&1; then
  fail "script accepté alors qu'une table de public reste inaccessible au rôle applicatif"
fi
owner_psql -q -c 'DROP TABLE public.table_oubliee'
apply_role "$APP_PASSWORD" >/dev/null

# L'API elle-même, sous le rôle applicatif : sonde (qui interroge la base), lecture publique, écriture
# publique, tâche quotidienne (agrégat inséré ou mis à jour, purges).
docker run -d --name "$API" --network "$NETWORK" -p "127.0.0.1:$PORT:3000" \
  -e DATABASE_URL="$app_url" -e "JWT_SECRET=$(openssl rand -hex 32)" -e CRON_SECRET="$CRON_SECRET" \
  -e APP_ENV=production -e CORS_ORIGINS=https://nedellec-julien.fr \
  -e S3_ENDPOINT=http://s3.invalid:9000 -e S3_REGION=auto \
  -e S3_ACCESS_KEY=role-check -e S3_SECRET_KEY=role-check-secret \
  -e RESEND_API_KEY=re_role_check -e MAIL_FROM=role-check@parity.test "$IMAGE" >/dev/null
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then break; fi
  sleep 1
done
api_fail() { docker logs "$API" >&2 || true; fail "$1"; }
curl -fsS "http://127.0.0.1:$PORT/api/health" | grep -q '"db":{"status":"up"' \
  || api_fail "sonde de l'API : base non jointe sous le rôle applicatif"
for path in /api/projects /api/blog/posts /api/profile /api/cv; do
  test "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT$path")" = "200" || api_fail "$path ne répond pas 200"
done
test "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $CRON_SECRET" \
  "http://127.0.0.1:$PORT/api/cron/daily")" = "200" || api_fail "tâche quotidienne refusée sous le rôle applicatif"
test "$(owner_psql -c 'select count(*) from daily_stat')" -ge 1 || api_fail "agrégat quotidien non écrit"
test "$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
  -d '{"name":"Témoin","email":"temoin@parity.test","subject":"Rôle applicatif","message":"Message écrit sous le rôle applicatif."}' \
  "http://127.0.0.1:$PORT/api/contact/messages")" = "201" || api_fail "message de contact non enregistré"
test "$(owner_psql -c "select count(*) from contact_message where subject = 'Rôle applicatif'")" = "1" \
  || api_fail "message de contact absent de la base"
if docker logs "$API" 2>&1 | grep -qi 'permission denied'; then api_fail "l'API a essuyé un refus de privilège"; fi

echo "Rôle $APP ($POSTGRES_IMAGE, image $IMAGE) : besoins de l'API servis, schéma hors d'atteinte, script rejouable."
