# ADR-0015 — Images du corps des articles : ressource sans rattachement, dimensions dans la clé

- **Statut** : proposé (2026-10-07, spec 016)
- **Date** : 2026-10-07
- **Contexte spec** : `specs/016-editeur-articles.md` (tranches A1, A2, R4, E4)
- **À distinguer de** : ADR-0009 (galerie de projet, table dédiée)

## Context

Le propriétaire veut insérer des images dans le corps d'un article depuis l'éditeur : choix du
fichier, texte alternatif obligatoire, envoi à l'API (AVIF sur S3/R2, comme la couverture), puis
`![texte alternatif](url)` inséré au curseur (décision du 2026-10-07).

Faits vérifiés (`nest-portfolio-app`, `origin/master` 7f30363) :

- La couverture passe par `POST /blog/posts/:id/image` : `ParseUUIDPipe`, 5 Mo, `image/(webp|jpeg|
  png|avif)`, `ImageOptimizer.optimize()` (AVIF ≤ 1 600 px, renvoie `width` et `height`), clé
  `blog/<id>-<sha8>.avif`, ordre « S3 puis base puis nettoyage ». La route exige un article
  existant.
- `StorageService.getPublicUrl()` renvoie `/storage/<bucket>/<key>` ; le front préfixe par
  `API_BASE_URL` (`https://api.nedellec-julien.fr/api` en production et au prérendu, `/api` en
  développement). La CSP autorise `img-src https://api.nedellec-julien.fr`.
- Le proxy `GET /storage/:bucket/*splat` sert toute clé du bucket public avec un cache immuable
  d'un an.
- Le HTML des articles est figé au prérendu : un objet S3 supprimé casse l'image servie jusqu'au
  redéploiement du front (constat d'ADR-0009).
- Le Markdown n'a pas de syntaxe pour les dimensions d'une image ; sans `width`/`height`, chaque
  image du corps décale la mise en page à son chargement (CLS).
- Le flux RSS (`generate-rss.mjs`) publie le HTML de `parseMarkdown` : une URL relative y serait
  résolue contre le site, pas contre l'API.

## Decision

1. **`POST /blog/content-images`** (multipart `file`), `JwtAuthGuard`, `AdminWriteThrottle`
   (60/min), mêmes validateurs que la couverture (5 Mo, `webp|jpeg|png|avif`, 422 ; 413 au-delà de
   la limite Multer), même `ImageOptimizer`. Réponse `201 { url, width, height }`, `url` relative
   (`/storage/portfolio-storage/blog-content/…`).
2. **Aucun rattachement en base** : pas de table, pas de migration. L'image est adressée par le
   Markdown qui la cite. On peut donc téléverser depuis `/admin/blog/new`, avant le premier
   enregistrement.
3. **Clé `blog-content/<uuid>-<sha8>-<largeur>x<hauteur>.avif`** : la convention `<type>/<id>-<sha8>`
   d'ADR-0009, suivie des dimensions intrinsèques. Le renderer `image` de `parseMarkdown` les relit
   dans l'URL et pose `width`, `height`, `loading="lazy"` et `decoding="async"` : pas de CLS, sans
   requête ni table.
4. **Le Markdown stocke l'URL absolue** que le gateway front a résolue (`API_BASE_URL` + `url`) :
   le contenu se lit tel quel au prérendu, dans l'aperçu, dans le flux RSS et hors du site.
5. **Cycle de vie minimal** : rien n'est supprimé quand le Markdown change (le HTML prérendu cite
   encore l'image jusqu'au redéploiement, l'annulation peut la réinsérer, un autre article peut la
   citer). À la suppression d'un article, l'API supprime les objets `blog-content/` que son
   Markdown citait et qu'aucun autre article ne cite. Les orphelins (envoi abandonné, image retirée
   du texte) sont acceptés.
6. **Le texte alternatif vit dans le Markdown** : obligatoire et limité à 300 caractères dans le
   formulaire de l'admin (schéma partagé avec la galerie), jamais envoyé à l'API.

## Consequences

- Un seul endpoint et un service, sans migration : la PR API se déploie seule, avant le front.
- Un changement de domaine de l'API, ou le passage des images en même origine (levier de
  performance relevé le 2026-10-06), impose de réécrire les URL des articles
  (`UPDATE … SET content_markdown = replace(…)`) puis de redéployer le front.
- Du contenu écrit contre une API de développement porte des URL `/api/storage/…` : il reste local.
- Les orphelins s'accumulent lentement (une image AVIF fait environ 100 Ko) ; un balayage
  (`StorageService.list` sur `blog-content/`, croisé avec les articles) est possible plus tard,
  sans changement de format.
- Une image citée par un autre article survit à la suppression du premier.
- Seuls les articles enregistrés comptent comme citations : supprimer un article efface une image
  qu'il partage avec le brouillon non enregistré d'un autre article (formulaire ouvert, pas encore
  sauvegardé), qui citera alors un objet absent. Rare (une même image dans deux articles, dont l'un
  en cours d'édition) ; il suffit de la téléverser de nouveau.

## Alternatives considered

- **Table `blog_post_image` rattachée à l'article (comme ADR-0009)** : exige un article enregistré
  avant tout téléversement, une migration, et un rapprochement texte/table à chaque écriture, alors
  que le Markdown est déjà la source de ce qui est affiché. Rejeté.
- **Supprimer les images retirées du texte à chaque `PATCH`** : casse les pages prérendues jusqu'au
  redéploiement et les images réinsérées par annulation ou citées ailleurs. Rejeté.
- **Insérer une balise `<img width height>` brute** : Markdown illisible dans l'éditeur. Rejeté.
- **Dimensions dans le titre Markdown (`![alt](url "1600x900")`)** : détourne le `title`, qui
  devient une infobulle. Rejeté.
- **URL relative dans le Markdown, résolue par `parseMarkdown`** : chaque consommateur (prérendu,
  RSS, aperçu) doit connaître la base de l'API ; le contenu n'est plus lisible hors du site.
  Rejeté, au prix décrit dans les conséquences.
- **Téléversement en data URL dans le Markdown** : contenu de plusieurs centaines de Ko par image,
  pas d'AVIF. Rejeté.
