# ADR-0009 — Galerie d'un projet : table `project_image`, exposée dans la liste, gérée comme un contenu

- **Statut** : accepté (2026-10-06, arbitrage du propriétaire, spec 011)
- **Date** : 2026-10-06
- **Contexte spec** : `specs/011-realisations-nature-galerie.md`
- **À distinguer de** : ADR-0007 (images statiques de `public/`, versionnées dans le code)

## Context

Chaque projet n'a qu'une image (`project.image`, clé S3 `projects/<id>-<sha8>.avif`, normalisée
en AVIF de 1 600 px de large au plus par `ImageOptimizer`, servie avec un cache immuable par
`GET /api/storage/:bucket/*splat`). La spec 011 ajoute plusieurs captures par projet. Chacune a un
`alt` et une place dans l'ordre, et l'admin doit pouvoir en ajouter, les réordonner, modifier leur
`alt` et les supprimer.

Faits vérifiés :

- Le front ne demande **jamais** un projet seul : la page détail retrouve le sien dans la liste
  partagée (`HttpProjectsGateway.allProjects$`, `share` avec `resetOnRefCountZero: false`). Ce
  `GET /api/projects` est mis en cache de transfert au prérendu (`isPublicReadUrl`) et sert à la
  home, à `/projects` et à chaque détail. L'API n'a pas de route par slug (`GET /projects/:id`
  attend un UUID).
- `ImageOptimizer.optimize()` renvoie déjà `width` et `height` (sortie de sharp) : les dimensions
  intrinsèques sont connues à l'upload, sans coût supplémentaire.
- Toute écriture passe sous le throttle global de 10 requêtes par minute (`ThrottlerModule`).
- Le prérendu lit l'API de production au build : une image ajoutée ou remplacée dans l'admin
  n'apparaît dans le HTML servi qu'au **build suivant** du front.
- `uploadImage` supprime l'ancienne clé S3 dès que la nouvelle est écrite : le HTML prérendu qui
  citait l'ancienne clé affiche une image cassée jusqu'au redéploiement du front.

## Decision

1. **Table dédiée `project_image`** : `id` (uuid), `project_id` (FK vers `project.id`,
   `ON DELETE CASCADE`), `key` (unique), `alt` (non vide), `width`, `height`, `order`, ainsi que
   les dates. Index sur `(project_id, order)`.
2. **Clé S3** : `project-images/<imageId>-<sha8>.avif`. On suit la convention `<type>/<id>-<sha8>`
   et le même proxy, avec le même cache immuable.
3. **Endpoints d'écriture** sous `/projects/:id/images`, tous derrière `JwtAuthGuard` :
   `POST` (multipart `file` + `alt`), `PATCH /:imageId` (`alt`), `PUT /order` (`imageIds`, qui doit
   être une permutation exacte des captures du projet), `DELETE /:imageId`. Plafonds retenus :
   **12 captures** par projet (422 au-delà), **`alt` de 300 caractères** au plus. Ils ont un throttle
   admin dédié de 60 requêtes par minute, parce qu'ajouter cinq captures puis renseigner leur `alt`
   dépasse 10 requêtes.
4. **La galerie est dans chaque projet de `GET /projects`** (et de `GET /projects/:id`), triée par
   `order`, avec une URL publique au lieu de la clé. La liste n'est pas allégée. Le détail n'a pas
   besoin d'une seconde requête.
5. **Pas de variantes de taille** : une capture est servie telle que stockée (AVIF de 1 600 px au
   plus). Le front pose `width`/`height` intrinsèques et `loading="lazy"`, sans `srcset` ni
   `IMAGE_LOADER` (ADR-0007 §3 inchangé).
6. **Les visuels sont du contenu** : ils arrivent en production par l'admin, jamais par un commit
   dans `public/`. L'ADR-0007 ne s'applique pas à eux. Après une session de mise à jour des
   visuels, il faut **redéployer le front** pour régénérer le HTML prérendu.

## Consequences

- Plusieurs uploads en parallèle insèrent des lignes indépendantes, sans écriture perdue.
- `GET /projects` fait deux requêtes SQL (projets, puis captures `WHERE project_id IN (…)`). Le
  regroupement se fait dans une fonction pure. La réponse grossit d'environ 250 octets par
  capture : 6 projets × 5 captures ≈ 7,5 Ko avant compression, sérialisés dans le cache de
  transfert de chaque page prérendue qui lit la liste.
- Supprimer un projet efface ses lignes par cascade. Le service lit d'abord les clés S3 des
  captures, puis les supprime après l'écriture en base (même ordre que l'image de couverture : un
  orphelin S3 plutôt qu'une base qui pointe vers une clé effacée).
- Remplacer ou supprimer un visuel casse l'image dans le HTML prérendu jusqu'au redéploiement du
  front. La procédure de mise à jour des visuels inclut donc ce redéploiement.
- Une miniature télécharge le fichier de 1 600 px. Cette mesure de performance est hors périmètre
  (décision du 2026-10-06). Si on ajoute des variantes plus tard, il faudra stocker des clés par
  largeur ou utiliser un CDN qui redimensionne.

## Alternatives considered

- **Colonne `jsonb` `gallery` sur `project`** (précédent : `tech_choices`). Rejeté : chaque
  opération lit puis réécrit tout le tableau. Deux uploads simultanés perdent une capture, sauf à
  verrouiller la ligne. Il n'y a pas non plus d'identifiant stable sans générer des UUID dans le
  JSON, ni d'unicité de `key` garantie en base.
- **Galerie uniquement dans le détail** (nouvelle route `GET /projects/by-slug/:slug`). Rejeté :
  chaque page détail ferait une requête de plus, avec une seconde entrée de cache de transfert, un
  second état de chargement et d'erreur, et une route d'API en plus. Le gain serait de quelques Ko
  sur une liste de six projets.
- **Fichiers versionnés dans `public/` (ADR-0007).** Rejeté : la galerie est un contenu
  administrable. Un commit par capture ferait sortir la gestion des visuels de l'admin.
- **Glisser-déposer pour réordonner.** Rejeté pour l'admin : des boutons « monter » et
  « descendre » sont utilisables au clavier sans dépendance (pas de `@angular/cdk/drag-drop`).
