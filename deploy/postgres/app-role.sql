-- Rôle applicatif de l'API : lit et écrit les lignes dont l'API a besoin, sans aucun droit sur le
-- schéma. Les migrations et la sauvegarde gardent le rôle propriétaire (POSTGRES_USER), seul à
-- pouvoir créer, modifier ou supprimer une table : une injection SQL ou une API compromise ne peut
-- plus altérer le schéma, ni vider une table d'un TRUNCATE.
--
-- À jouer avec le rôle propriétaire, celui qui applique les migrations, dans la base de l'API. Le mot
-- de passe se lit dans l'environnement de psql : jamais dans ce fichier ni sur la ligne de commande.
--   POSTGRES_APP_PASSWORD  obligatoire, 32 caractères au moins parmi A-Z a-z 0-9 _ - (il entre tel
--                          quel dans l'URL de connexion) : openssl rand -hex 32
--   POSTGRES_APP_USER      facultatif, `portfolio_app` par défaut
-- Mode d'emploi, déploiement et retour arrière : README.md de ce dossier. Vérifié par check.sh.
--
-- Rejouable : une seconde exécution rend le même état (et change le mot de passe si la variable a
-- changé). Tout se joue dans une transaction : une erreur ne laisse rien d'appliqué.

\set ON_ERROR_STOP on
\set app_role portfolio_app
\getenv app_role POSTGRES_APP_USER
\set app_password ''
\getenv app_password POSTGRES_APP_PASSWORD

BEGIN;

-- Un échec de la commande qui pose le mot de passe l'écrirait en clair dans le journal du serveur
-- (`log_min_error_statement`). Réglage réservé à un superutilisateur, ce qu'est le rôle créé par
-- l'image postgres ; sinon le script continue, et le signale.
DO $$
BEGIN
  SET LOCAL log_min_error_statement = 'panic';
  SET LOCAL log_statement = 'none';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'journalisation des commandes non réglable par ce rôle : vérifier log_statement = none';
END
$$;

-- Garde-fous : mot de passe utilisable dans une URL, rôle applicatif distinct du propriétaire, et
-- toutes les tables de `public` à ce propriétaire (les privilèges par défaut posés plus bas ne
-- valent que pour les tables qu'il créera).
SELECT set_config('portfolio.app_role', :'app_role', true) AS role,
       set_config('portfolio.password_ok', (:'app_password' ~ '^[A-Za-z0-9_-]{32,}$')::text, true) AS password_ok
\gset guard_
DO $$
DECLARE
  app_role text := current_setting('portfolio.app_role');
  foreign_tables text;
BEGIN
  IF current_setting('portfolio.password_ok') <> 'true' THEN
    RAISE EXCEPTION 'POSTGRES_APP_PASSWORD absent ou invalide : 32 caractères au moins parmi A-Z a-z 0-9 _ -';
  END IF;
  IF app_role = current_user OR app_role = session_user THEN
    RAISE EXCEPTION 'le rôle applicatif (%) doit être distinct du rôle propriétaire', app_role;
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = app_role AND rolsuper) THEN
    RAISE EXCEPTION 'le rôle % existe et il est superutilisateur : choisir un autre nom', app_role;
  END IF;
  SELECT string_agg(format('%I (%s)', tablename, tableowner), ', ') INTO foreign_tables
  FROM pg_tables WHERE schemaname = 'public' AND tableowner <> current_user;
  IF foreign_tables IS NOT NULL THEN
    RAISE EXCEPTION 'tables de public hors du rôle % : % ; jouer le script avec le rôle des migrations',
      current_user, foreign_tables;
  END IF;
END
$$;

-- 1. Le rôle : connexion par mot de passe, aucun attribut d'administration, membre d'aucun rôle.
SELECT format('CREATE ROLE %I', :'app_role')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'app_role') \gexec
SELECT format(
  'ALTER ROLE %I WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L',
  :'app_role', :'app_password') \gexec
SELECT format('REVOKE %I FROM %I', granted.rolname, :'app_role')
FROM pg_auth_members
JOIN pg_roles AS granted ON granted.oid = pg_auth_members.roleid
JOIN pg_roles AS member ON member.oid = pg_auth_members.member
WHERE member.rolname = :'app_role' \gexec

-- 2. La base : connexion, et plus de table temporaire pour quiconque (privilège donné à PUBLIC par
--    défaut ; le rôle propriétaire, superutilisateur, n'en dépend pas).
SELECT format('REVOKE TEMPORARY ON DATABASE %I FROM PUBLIC', current_database()) \gexec
SELECT format('REVOKE ALL ON DATABASE %I FROM %I', current_database(), :'app_role') \gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'app_role') \gexec

-- 3. Les schémas : usage de `public` sans y créer d'objet ; rien sur `drizzle` (suivi des migrations).
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM :"app_role";
GRANT USAGE ON SCHEMA public TO :"app_role";
SELECT format('REVOKE ALL ON SCHEMA drizzle FROM %I; REVOKE ALL ON ALL TABLES IN SCHEMA drizzle FROM %I',
  :'app_role', :'app_role')
WHERE EXISTS (SELECT FROM pg_namespace WHERE nspname = 'drizzle') \gexec

-- 4. Les tables existantes, au plus juste de ce que fait le code de l'API (apps/api/src). Jamais
--    TRUNCATE, REFERENCES ni TRIGGER. Une table absente arrête le script : le schéma a changé, la
--    liste est à revoir.
--      users            lue et modifiée (mot de passe, 2FA, révocation) ; l'admin se crée et se
--                       supprime avec le rôle propriétaire (`db:seed`)
--      profile_content  une seule ligne, créée par une migration ; SELECT … FOR UPDATE exige UPDATE
--      daily_stat       agrégat quotidien inséré ou mis à jour (ON CONFLICT), jamais supprimé
--      analytics_event, login_event  insérés, lus, purgés par la tâche quotidienne ; jamais modifiés
--      cv_file          inséré ou remplacé (ON CONFLICT), supprimé
--      autres           création, lecture, modification, suppression depuis l'admin ou le site
SELECT format('REVOKE ALL ON TABLE public.%I FROM %I; GRANT %s ON TABLE public.%I TO %I',
  needed.table_name, :'app_role', needed.privileges, needed.table_name, :'app_role')
FROM (VALUES
  ('users',           'SELECT, UPDATE'),
  ('profile_content', 'SELECT, UPDATE'),
  ('daily_stat',      'SELECT, INSERT, UPDATE'),
  ('analytics_event', 'SELECT, INSERT, DELETE'),
  ('login_event',     'SELECT, INSERT, DELETE'),
  ('page_view',       'SELECT, INSERT, UPDATE, DELETE'),
  ('cv_file',         'SELECT, INSERT, UPDATE, DELETE'),
  ('contact_message', 'SELECT, INSERT, UPDATE, DELETE'),
  ('blog_post',       'SELECT, INSERT, UPDATE, DELETE'),
  ('project',         'SELECT, INSERT, UPDATE, DELETE'),
  ('project_image',   'SELECT, INSERT, UPDATE, DELETE')
) AS needed(table_name, privileges) \gexec

-- Aucune séquence dans `public` aujourd'hui (clés uuid) ; celles qui existeraient restent utilisables.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO :"app_role";

-- 5. Les tables et séquences que créeront les prochaines migrations (jouées par le rôle courant) :
--    lecture et écriture des lignes, sans nouvelle intervention. Une migration peut restreindre
--    ensuite par un REVOKE, et la liste du point 4 se complète alors.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"app_role";
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO :"app_role";

COMMIT;

-- État obtenu, à relire : une table de `public` sans ligne ici n'est pas accessible à l'API.
\echo 'Privilèges du rôle applicatif sur les tables :'
SELECT table_schema || '.' || table_name AS "table",
       string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE grantee = :'app_role'
GROUP BY 1
ORDER BY 1;
