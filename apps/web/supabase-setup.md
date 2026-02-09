# Setup Supabase - Portfolio Angular

## Partie 1 : Creation des tables

```sql
-- HOME
CREATE TABLE hero_data (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL, tagline text NOT NULL,
  technologies text[] NOT NULL DEFAULT '{}',
  description text NOT NULL, availability text NOT NULL
);
CREATE TABLE specialities (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL, description text NOT NULL
);
CREATE TABLE tech_stack (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL, category text NOT NULL, icon text
);

-- PROFILE
CREATE TABLE profile (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  display_name text NOT NULL, location text NOT NULL,
  avatar_url text NOT NULL, is_available boolean NOT NULL DEFAULT true,
  availability_message text NOT NULL DEFAULT ''
);
CREATE TABLE biography (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL, paragraphs text[] NOT NULL DEFAULT '{}'
);
CREATE TABLE social_buttons (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  icon text NOT NULL, label text NOT NULL, href text NOT NULL
);
CREATE TABLE diplomas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug text NOT NULL UNIQUE, title text NOT NULL,
  provider text NOT NULL, short_description text NOT NULL,
  skills text[] NOT NULL DEFAULT '{}'
);
CREATE TABLE technologies (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL, category text NOT NULL, icon text NOT NULL
);
CREATE TABLE highlights (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL, description text NOT NULL, icon text NOT NULL
);
CREATE TABLE what_i_do (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL, description text NOT NULL
);
CREATE TABLE what_i_seek (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL, description text NOT NULL
);

-- PROJECTS
CREATE TABLE projects (
  id text PRIMARY KEY, title text NOT NULL, category text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}', description text NOT NULL,
  image text NOT NULL, live_url text, repo_url text,
  repo_url_front text, repo_url_back text,
  featured boolean NOT NULL DEFAULT false,
  "order" integer NOT NULL DEFAULT 0
);
CREATE INDEX idx_projects_featured ON projects (featured);
CREATE INDEX idx_projects_category ON projects (category);

-- CONTACT
CREATE TABLE contact_info (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL, phone text NOT NULL, location text NOT NULL
);
CREATE TABLE social_links (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE contact_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL, email text NOT NULL, subject text NOT NULL,
  message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  read boolean NOT NULL DEFAULT false
);

-- BLOG
CREATE TABLE articles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL, author text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  excerpt text NOT NULL, content text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}', image text NOT NULL
);
CREATE TABLE comments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_article bigint NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  author text NOT NULL, content text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE
);

-- BOOKING
CREATE TABLE bookings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date date NOT NULL, start_time text NOT NULL,
  duration integer NOT NULL, name text NOT NULL,
  email text NOT NULL, phone text NOT NULL,
  subject text NOT NULL, message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE disabled_dates (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date date NOT NULL UNIQUE, reason text
);

-- ADMIN
CREATE TABLE site_stats (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  total_visits integer NOT NULL DEFAULT 0,
  total_article_clicks integer NOT NULL DEFAULT 0,
  total_project_clicks integer NOT NULL DEFAULT 0,
  total_cv_downloads integer NOT NULL DEFAULT 0,
  article_stats jsonb NOT NULL DEFAULT '[]'::jsonb,
  project_stats jsonb NOT NULL DEFAULT '[]'::jsonb
);
CREATE TABLE cv_info (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  file_name text NOT NULL, file_url text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  file_size integer NOT NULL DEFAULT 0,
  downloads integer NOT NULL DEFAULT 0
);
```

## Partie 2 : Row Level Security (RLS)

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE hero_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_stack ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE biography ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_buttons ENABLE ROW LEVEL SECURITY;
ALTER TABLE diplomas ENABLE ROW LEVEL SECURITY;
ALTER TABLE technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE what_i_do ENABLE ROW LEVEL SECURITY;
ALTER TABLE what_i_seek ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE disabled_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_info ENABLE ROW LEVEL SECURITY;

-- LECTURE PUBLIQUE (donnees du site)
CREATE POLICY "Public read" ON hero_data FOR SELECT USING (true);
CREATE POLICY "Public read" ON specialities FOR SELECT USING (true);
CREATE POLICY "Public read" ON tech_stack FOR SELECT USING (true);
CREATE POLICY "Public read" ON profile FOR SELECT USING (true);
CREATE POLICY "Public read" ON biography FOR SELECT USING (true);
CREATE POLICY "Public read" ON social_buttons FOR SELECT USING (true);
CREATE POLICY "Public read" ON diplomas FOR SELECT USING (true);
CREATE POLICY "Public read" ON technologies FOR SELECT USING (true);
CREATE POLICY "Public read" ON highlights FOR SELECT USING (true);
CREATE POLICY "Public read" ON what_i_do FOR SELECT USING (true);
CREATE POLICY "Public read" ON what_i_seek FOR SELECT USING (true);
CREATE POLICY "Public read" ON projects FOR SELECT USING (true);
CREATE POLICY "Public read" ON contact_info FOR SELECT USING (true);
CREATE POLICY "Public read" ON social_links FOR SELECT USING (true);
CREATE POLICY "Public read" ON articles FOR SELECT USING (true);
CREATE POLICY "Public read" ON comments FOR SELECT USING (true);
-- bookings : pas de lecture publique (donnees personnelles)
CREATE POLICY "Public read" ON disabled_dates FOR SELECT USING (true);
CREATE POLICY "Public read" ON site_stats FOR SELECT USING (true);
CREATE POLICY "Public read" ON cv_info FOR SELECT USING (true);

-- ECRITURE PUBLIQUE (formulaires visiteurs)
CREATE POLICY "Public insert" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert" ON comments FOR INSERT WITH CHECK (true);

-- ADMIN (utilisateur authentifie = CRUD complet)
CREATE POLICY "Admin all" ON hero_data FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON specialities FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON tech_stack FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON profile FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON biography FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON social_buttons FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON diplomas FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON technologies FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON highlights FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON what_i_do FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON what_i_seek FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON projects FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON contact_messages FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON articles FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON comments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON bookings FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON disabled_dates FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON site_stats FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON cv_info FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
```

### Migration securite (si base deja existante)

Si la base est deja creee, executer ce SQL pour corriger les policies :

```sql
-- Supprimer la lecture publique sur les tables sensibles
DROP POLICY IF EXISTS "Public read" ON contact_messages;
DROP POLICY IF EXISTS "Public read" ON bookings;

-- Ajouter insert public sur comments (si manquant)
CREATE POLICY "Public insert" ON comments FOR INSERT WITH CHECK (true);

-- Definir le role admin sur l'utilisateur Supabase Auth
-- Remplacer USER_ID par l'UUID de votre utilisateur admin
UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb WHERE id = 'USER_ID';
```

## Partie 3 : Seed des donnees

```sql
-- HERO DATA
INSERT INTO hero_data (name, tagline, technologies, description, availability) VALUES
('Julien NÉDELLEC', 'Développeur d''applications web modernes avec', ARRAY['Angular', 'NestJS'], 'Je conçois des applications web modernes avec un focus sur la qualité du code, la performance et les bonnes pratiques. Du développement au déploiement.', 'Disponible pour nouvelles missions');

-- SPECIALITIES
INSERT INTO specialities (title, description) VALUES
('Frontend Moderne', 'Applications Angular réactives avec architecture signals, standalone components et contrôle de flux optimisé. TypeScript strict pour une maintenance facilitée et moins de bugs en production.'),
('Backend & Data', 'APIs REST avec NestJS : architecture modulaire, validation stricte des données, gestion d''erreurs professionnelle. PostgreSQL optimisé pour la performance et l''intégrité des données.'),
('Déploiement & Infrastructure', 'Déploiements Docker automatisés, infrastructure self-hosted haute disponibilité (Traefik reverse proxy, Dokploy orchestration). CI/CD pour des mises en production sans friction.');

-- TECH STACK
INSERT INTO tech_stack (name, category, icon) VALUES
('Angular', 'Framework', 'angular'),
('NestJS', 'Backend', 'nestjs'),
('TypeScript', 'Language', 'typescript'),
('Tailwind CSS', 'Styling', 'tailwindcss'),
('PostgreSQL', 'Database', 'postgresql'),
('Docker', 'DevOps', 'docker');

-- PROFILE
INSERT INTO profile (display_name, location, avatar_url, is_available, availability_message) VALUES
('Julien NÉDELLEC', 'Voisins-Le-Bretonneux, France', '/photoProfil.avif', true, 'Disponible pour de nouveaux projets');

-- BIOGRAPHY
INSERT INTO biography (title, paragraphs) VALUES
('Mon parcours', ARRAY[
  '20 ans dans l''industrie m''ont appris ce qu''est vraiment la rigueur. Aujourd''hui, je l''applique au code.',
  'Je ne suis pas venu au développement web par hasard. En métallurgie, j''ai vu les outils numériques transformer un secteur entier. J''ai compris que je pouvais avoir plus d''impact en créant ces outils plutôt qu''en les utilisant.',
  'Formé dans un environnement où l''erreur coûte cher, j''ai développé une exigence qui me sert aujourd''hui : chaque ligne de code doit être pensée pour durer. Autodidacte par nécessité, je ne me contente pas de faire fonctionner, je comprends pourquoi ça fonctionne, de la requête SQL au déploiement en production.',
  'Cette expérience m''a donné une vision systémique rare : je ne code pas des features isolées, je conçois des solutions complètes qui résolvent de vrais problèmes métier.'
]);

-- SOCIAL BUTTONS
INSERT INTO social_buttons (icon, label, href) VALUES
('lucide-linkedin', 'LinkedIn', 'https://www.linkedin.com/in/nedellec-julien/'),
('lucide-github', 'GitHub', 'https://github.com/djoudj-dev'),
('lucide-mail', 'Mail', 'mailto:contact@julien-nedellec.fr'),
('bi-discord', 'Discord', 'https://discord.gg/nedellec_julien'),
('bi-twitter-x', 'X', 'https://x.com/djoudj_78');

-- TECHNOLOGIES
INSERT INTO technologies (name, category, icon) VALUES
('Angular', 'Framework', 'angular'),
('TypeScript', 'Langage', 'typescript'),
('Tailwind CSS', 'Styling', 'tailwindcss'),
('NestJS', 'Backend', 'nestjs'),
('PostgreSQL', 'Base de données', 'postgresql'),
('Docker', 'Devops', 'docker');

-- DIPLOMAS
INSERT INTO diplomas (slug, title, provider, short_description, skills) VALUES
('dwwm', 'Développeur Web et Web Mobile - Bac+2', 'Studi', 'Titre professionnel de niveau 5 axé sur la conception, le développement et la maintenance d''applications web et mobiles, avec une pédagogie orientée bonnes pratiques et travail en équipe.', ARRAY['HTML5, CSS3, JavaScript', 'Angular & TypeScript', 'SQL & NoSQL', 'Git & GitHub', 'Responsive Design', 'API REST']),
('pgi-erp', 'Développeur d''applications PGI/ERP - Bac+2', 'ALT-RH', 'Titre professionnel de niveau 5 dédié à la conception et à la maintenance d''applications de gestion intégrées, avec un focus sur l''architecture logicielle et la collaboration agile.', ARRAY['HTML5, CSS3, JavaScript, jQuery', 'Java & J2EE', 'MySQL, UML & modélisation', 'Git & gestion de version', 'Algorithmique & design patterns', 'Méthodes agiles (Scrum, RUP)']);

-- HIGHLIGHTS
INSERT INTO highlights (title, description, icon) VALUES
('Exigence de production', 'Formé dans un environnement où l''erreur coûte cher, j''écris du code pensé pour durer. Type-safe, testé, documenté.', 'valid'),
('Autonomie réelle', 'Autodidacte par nécessité, je trouve des solutions quand il n''y a pas de tutoriel. Je lis la doc, je comprends les sources, je creuse jusqu''à résoudre.', 'book'),
('Vision d''ensemble', 'Je ne code pas dans le vide. Je comprends le métier, l''architecture, les contraintes. Vingt ans à optimiser des systèmes complexes, ça laisse des traces.', 'spider-web');

-- WHAT I DO
INSERT INTO what_i_do (title, description) VALUES
('Applications complètes', 'Je construis des applications de production de bout en bout : conception, Full Stack (Angular moderne, NestJS, PostgreSQL) et déploiement conteneurisé (Docker). Pas des démos, mais des systèmes qui tournent.'),
('Infrastructure', 'Je gère l''intégralité de mon infrastructure : auto-hébergement (VPS) et déploiement continu (CI/CD) via Dokploy, jusqu''aux services en production. Ce contrôle opérationnel total garantit la fiabilité et fait de moi un développeur plus complet.');

-- WHAT I SEEK
INSERT INTO what_i_seek (title, description) VALUES
('Ce que je cherche', 'Un environnement où la tech sert un impact positif. GreenTech, industrie durable, projets à sens. Une équipe qui valorise la qualité technique et l''apprentissage continu.');

-- PROJECTS
INSERT INTO projects (id, title, category, tags, description, image, live_url, repo_url_front, repo_url_back, featured, "order") VALUES
('candidash', 'CandiDash', 'Application Web', ARRAY['Angular', 'Typescript', 'TailwindCSS', 'NestJS', 'PostgreSQL', 'Docker', 'Vitest'], 'Application Angular moderne pour suivre ses candidatures d''emploi avec tableau de bord personnel. Suivi des candidatures, gestion des statuts, authentification multi-rôles et thème clair/sombre.', '/images/candidash.avif', 'https://candidash.djoudj.dev', 'https://github.com/djoudj-dev/ng-candidash-app', 'https://github.com/djoudj-dev/nest-candidash-app', true, 1),
('arcadia', 'Zoo Arcadia', 'Application Web', ARRAY['Angular', 'Typescript', 'TailwindCSS', 'NestJS', 'PostgreSQL', 'MongoDB', 'JWT'], 'Application frontend moderne pour le Zoo Arcadia. Interface interactive pour la gestion complète d''un parc zoologique avec tableaux de bord dédiés pour administrateurs, vétérinaires et employés.', '/images/arcadia.avif', 'https://arcadia.nedellec-julien.fr/', 'https://github.com/djoudj-dev/arcadia-zoo-app-front', 'https://github.com/djoudj-dev/arcadia-zoo-app-back', true, 4);

INSERT INTO projects (id, title, category, tags, description, image, repo_url, featured, "order") VALUES
('labelsync-pro', 'LabelSync Pro', 'Script', ARRAY['Bash', 'GitHub', 'Automation', 'API', 'DevOps'], 'Script Bash pour synchroniser les labels GitHub entre plusieurs dépôts. Automatise la gestion des labels avec import/export et réplication entre repositories. Gain de temps pour la standardisation des projets.', '/images/label-sync.avif', 'https://github.com/djoudj-dev/labelsync-pro', false, 2),
('gitpush-auto', 'GitPush Auto', 'Script', ARRAY['Bash', 'Git', 'Automation', 'CLI'], 'Script Bash pour automatiser les opérations Git. Simplifie l''ajout, le commit et le push de modifications avec une seule commande. Idéal pour accélérer le workflow de développement.', '/images/gitpush.avif', 'https://github.com/djoudj-dev/gitpush-auto', false, 3);

-- CONTACT INFO
INSERT INTO contact_info (email, phone, location) VALUES
('contact@nedellec-julien.fr', '+33 6 22 86 92 79', 'Voisins-Le-Bretonneux, France');

-- SOCIAL LINKS (jsonb)
INSERT INTO social_links (data) VALUES
('{"linkedin": {"url": "https://www.linkedin.com/in/nedellec-julien/", "label": "LinkedIn", "icon": "lucide-linkedin"}, "github": {"url": "https://github.com/djoudj-dev", "label": "GitHub", "icon": "lucide-github"}, "email": {"url": "mailto:contact@nedellec-julien.fr", "label": "Email", "icon": "lucide-mail"}, "phone": {"url": "tel:+33622869279", "label": "Téléphone", "icon": "lucide-phone"}, "twitter": {"url": "https://x.com/djoudj_78", "label": "X (Twitter)", "icon": "bi-twitter-x"}}'::jsonb);

-- ARTICLES
INSERT INTO articles (title, author, date, excerpt, content, tags, image) VALUES
('Pourquoi j''ai choisi Angular pour mes projets', 'Julien Nédellec', '2026-01-15', 'Retour d''expérience sur le choix d''Angular comme framework principal pour le développement d''applications web professionnelles.', 'Angular est souvent perçu comme un framework complexe. Pourtant, c''est précisément cette structure qui en fait un outil puissant pour les applications d''entreprise.

Après avoir travaillé avec plusieurs frameworks, j''ai choisi Angular pour sa rigueur, son système de typage fort avec TypeScript, et son architecture modulaire qui favorise la maintenabilité à long terme.

Les signals, introduits récemment, ont encore simplifié la gestion d''état. Combinés avec les standalone components et le nouveau contrôle de flux (@if, @for), Angular offre une expérience de développement moderne et productive.

Dans cet article, je partage mon parcours et les raisons qui m''ont poussé à adopter Angular comme stack principale.', ARRAY['Angular', 'TypeScript', 'Architecture'], '/images/blog/angular-choice.avif'),
('Clean Architecture en Angular : retour d''expérience', 'Julien Nédellec', '2026-01-28', 'Comment j''ai structuré mon portfolio Angular avec une architecture clean inspirée du pattern EAK.', 'La clean architecture n''est pas réservée au backend. En Angular, elle permet de séparer clairement les responsabilités et de rendre le code testable et maintenable.

Dans ce projet portfolio, j''ai adopté le pattern feature-first avec trois couches par feature : domain (models, gateways, use-cases), infrastructure (implémentations des gateways), et application (composants UI).

Chaque gateway est défini comme un type avec un InjectionToken, ce qui permet de switcher facilement entre une implémentation in-memory et une implémentation HTTP. C''est exactement ce pattern qui nous permet de migrer vers json-server sans toucher à la couche application.

La clé : les composants ne dépendent que du domain, jamais de l''infrastructure.', ARRAY['Angular', 'Clean Architecture', 'Design Patterns'], '/images/blog/clean-archi.avif'),
('Docker et déploiement self-hosted : mon setup', 'Julien Nédellec', '2026-02-05', 'Guide pratique pour déployer ses applications Angular/NestJS sur un VPS avec Docker, Traefik et Dokploy.', 'Déployer ses propres applications sur un VPS offre un contrôle total sur l''infrastructure. Voici comment j''ai mis en place mon setup de production.

Mon stack de déploiement repose sur Docker pour la conteneurisation, Traefik comme reverse proxy avec gestion automatique des certificats SSL, et Dokploy pour l''orchestration et le déploiement continu.

Chaque application est conteneurisée avec un Dockerfile multi-stage : build Angular en production, puis serving via Nginx. Le tout est orchestré par docker-compose avec des variables d''environnement pour la configuration.

Ce setup me permet de déployer en un push git, avec rollback automatique en cas d''erreur.', ARRAY['Docker', 'DevOps', 'Déploiement'], '/images/blog/docker-setup.avif');

-- COMMENTS
INSERT INTO comments (id_article, author, content, date) VALUES
(1, 'Marie D.', 'Super article ! J''hésitais entre Angular et React, ton retour d''expérience m''aide beaucoup.', '2026-01-17'),
(2, 'Thomas R.', 'La clean architecture en frontend, c''est exactement ce qu''il manquait. Merci pour le partage !', '2026-01-30');

-- CONTACT MESSAGES
INSERT INTO contact_messages (name, email, subject, message, created_at, read) VALUES
('Jean Dupont', 'jean@example.com', 'Collaboration', 'Bonjour, je souhaite discuter d''une collaboration...', '2026-02-01T10:00:00Z', false);

-- DISABLED DATES
INSERT INTO disabled_dates (date) VALUES
('2026-02-08'),
('2026-02-13');

-- SITE STATS
INSERT INTO site_stats (total_visits, total_article_clicks, total_project_clicks, total_cv_downloads, article_stats, project_stats) VALUES
(1250, 340, 520, 89,
'[{"articleId": 1, "title": "Pourquoi j''ai choisi Angular", "clicks": 156}, {"articleId": 2, "title": "Clean Architecture en Angular", "clicks": 112}, {"articleId": 3, "title": "Docker et déploiement self-hosted", "clicks": 72}]'::jsonb,
'[{"projectId": "candidash", "title": "CandiDash", "clicks": 245}, {"projectId": "arcadia", "title": "Zoo Arcadia", "clicks": 178}, {"projectId": "labelsync-pro", "title": "LabelSync Pro", "clicks": 57}, {"projectId": "gitpush-auto", "title": "GitPush Auto", "clicks": 40}]'::jsonb);

-- CV INFO
INSERT INTO cv_info (file_name, file_url, uploaded_at, file_size, downloads) VALUES
('CV_JULIEN_NEDELLEC.pdf', '/docs/CV_JULIEN_NEDELLEC.pdf', '2026-01-15T09:00:00Z', 245000, 89);
```

## Partie 4 : Resend (envoi d'emails)

### Prerequis

1. Creer un compte sur [resend.com](https://resend.com)
2. Generer une API key dans le dashboard Resend
3. Verifier le domaine `nedellec-julien.fr` dans Resend (DNS records)
4. Installer le CLI Supabase : `npm install -g supabase`

### Configuration des secrets

```bash
# Se connecter au projet Supabase
supabase login
supabase link --project-ref tnsinlwzvcacdhupxyfi

# Ajouter les secrets
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
supabase secrets set CONTACT_RECIPIENT_EMAIL=contact@nedellec-julien.fr
supabase secrets set RESEND_FROM_EMAIL="Portfolio <noreply@nedellec-julien.fr>"
```

### Deploiement de la Edge Function

```bash
# Deployer la fonction send-contact-email
supabase functions deploy send-contact-email --project-ref tnsinlwzvcacdhupxyfi
```

### Fonctionnement

Quand un visiteur soumet le formulaire de contact :
1. Le message est sauvegarde dans la table `contact_messages` (Supabase)
2. La Edge Function `send-contact-email` est appelee automatiquement
3. Un email de notification est envoye a l'admin via Resend
4. Un email de confirmation est envoye au visiteur

Si l'envoi d'email echoue, le message reste sauvegarde en base (pas de perte de donnees).

## Partie 5 : Fonctions RPC pour le tracking

```sql
-- track_visit : incremente le compteur de visites
CREATE OR REPLACE FUNCTION track_visit()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE site_stats SET total_visits = total_visits + 1 WHERE id = 1;
END;
$$;
GRANT EXECUTE ON FUNCTION track_visit() TO anon;

-- track_project_click : incremente les clics projet + upsert dans project_stats JSONB
CREATE OR REPLACE FUNCTION track_project_click(p_project_id text, p_title text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stats jsonb;
  idx int;
BEGIN
  SELECT project_stats INTO current_stats FROM site_stats WHERE id = 1;

  -- Chercher l'index du projet dans le tableau JSONB
  SELECT i INTO idx
  FROM generate_series(0, jsonb_array_length(current_stats) - 1) AS i
  WHERE current_stats->i->>'projectId' = p_project_id;

  IF idx IS NOT NULL THEN
    -- Projet existe : incrementer les clics
    current_stats = jsonb_set(
      current_stats,
      ARRAY[idx::text, 'clicks'],
      to_jsonb((current_stats->idx->>'clicks')::int + 1)
    );
  ELSE
    -- Nouveau projet : ajouter au tableau
    current_stats = current_stats || jsonb_build_array(
      jsonb_build_object('projectId', p_project_id, 'title', p_title, 'clicks', 1)
    );
  END IF;

  UPDATE site_stats
  SET total_project_clicks = total_project_clicks + 1,
      project_stats = current_stats
  WHERE id = 1;
END;
$$;
GRANT EXECUTE ON FUNCTION track_project_click(text, text) TO anon;

-- track_article_click : incremente les clics article + upsert dans article_stats JSONB
CREATE OR REPLACE FUNCTION track_article_click(p_article_id bigint, p_title text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stats jsonb;
  idx int;
BEGIN
  SELECT article_stats INTO current_stats FROM site_stats WHERE id = 1;

  SELECT i INTO idx
  FROM generate_series(0, jsonb_array_length(current_stats) - 1) AS i
  WHERE (current_stats->i->>'articleId')::bigint = p_article_id;

  IF idx IS NOT NULL THEN
    current_stats = jsonb_set(
      current_stats,
      ARRAY[idx::text, 'clicks'],
      to_jsonb((current_stats->idx->>'clicks')::int + 1)
    );
  ELSE
    current_stats = current_stats || jsonb_build_array(
      jsonb_build_object('articleId', p_article_id, 'title', p_title, 'clicks', 1)
    );
  END IF;

  UPDATE site_stats
  SET total_article_clicks = total_article_clicks + 1,
      article_stats = current_stats
  WHERE id = 1;
END;
$$;
GRANT EXECUTE ON FUNCTION track_article_click(bigint, text) TO anon;

-- track_cv_download : incremente les telechargements CV
CREATE OR REPLACE FUNCTION track_cv_download()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE site_stats SET total_cv_downloads = total_cv_downloads + 1 WHERE id = 1;
  UPDATE cv_info SET downloads = downloads + 1 WHERE id = 1;
END;
$$;
GRANT EXECUTE ON FUNCTION track_cv_download() TO anon;
```
