# ADR-0041 — Version entière des articles et des projets, écriture conditionnelle par `If-Match`

- **Statut** : proposé (2026-11-22)
- **Date** : 2026-11-22
- **Spec** : 041 (fraîcheur des données, section « Éditeurs : version plus récente enregistrée
  ailleurs »)
- **Prolonge** : le contrôle de version du parcours (`profile_content.version`, `PUT /profile`, 409)

## Context

`PATCH /api/blog/posts/:id` et `PATCH /api/projects/:id` écrivaient sans condition : un brouillon
parti d'une version périmée remplaçait en silence la version enregistrée depuis dans un autre onglet
ou sur un autre poste. Le front ne l'avertissait que si la version plus récente avait déjà été
détectée au retour sur l'onglet (au plus toutes les 15 s), en comparant `updatedAt`.

Le parcours, lui, porte déjà une version entière (`profile_content.version`) envoyée dans le corps
du `PUT` ; l'API répond 409 sur une version périmée et l'éditeur affiche l'avertissement commun
(`NewerVersionCheck.reportConflict()`).

Contraintes :

- une seule API, un seul front, un seul administrateur ; le front appelle l'API sur sa propre
  origine (relais nginx), CORS ne sert plus qu'à l'ancien front pendant la transition ;
- le déploiement migre la base avant de démarrer la nouvelle API, l'ancienne image peut tourner
  quelques instants sur la base migrée, et le retour arrière consiste à redéployer l'image
  précédente ;
- un « j'aime » écrit dans `blog_post` sans être une modification du contenu.

## Options

### Ce qui identifie une version

- **`updatedAt`** : déjà là, sans migration. Mais Postgres le garde à la microseconde et JSON le
  rend à la milliseconde : la valeur que le client renverrait ne correspond jamais exactement à
  celle de la ligne (`defaultNow()` d'une ligne jamais modifiée compris). Il faudrait tronquer des
  deux côtés et accepter deux écritures dans la même milliseconde. Écarté.
- **Colonne `version integer NOT NULL DEFAULT 1`**, incrémentée dans le même `UPDATE` que chaque
  écriture du contenu : comparaison exacte, comme le parcours. **Retenu.**

### Statut d'une version périmée

- **412 Precondition Failed** : ce que prévoit HTTP (RFC 9110) pour un `If-Match` qui ne correspond
  pas.
- **409 Conflict** : ce que l'API répond déjà pour le parcours, ce que le front sait traiter
  (`isStaleVersion`), et ce qui distingue le cas d'un en-tête mal formé (400). **Retenu** pour la
  cohérence des trois éditeurs ; l'écart avec la RFC est assumé et documenté dans le contrat de
  l'API.

### Où passe la version attendue

- **Dans le corps** (comme le parcours) : mêle une métadonnée au document, et un `PATCH` partiel
  devrait la déclarer dans chaque DTO, y compris pour l'envoi multipart de la couverture.
- **En-tête `If-Match: "<version>"`**, ETag fort : sans toucher aux DTO stricts, valable pour le
  `PATCH` et l'envoi de la couverture, et l'`ETag` des réponses donne la valeur à renvoyer.
  **Retenu.** Seule une valeur entre guillemets est acceptée ; `*`, une liste ou un ETag faible
  (`W/`) répondent 400.

### Facultative ou obligatoire

- **Obligatoire** : casserait tout client qui ne l'envoie pas (ancien front pendant la transition,
  scripts) et rendrait l'API et le front indissociables au déploiement.
- **Facultative** : sans en-tête, l'écriture reste inconditionnelle, comme avant. **Retenu** ; le
  front l'envoie à chaque enregistrement.

## Decision

1. Colonne `version` (`integer NOT NULL DEFAULT 1`) sur `blog_post` et `project`, ajoutée par la
   migration `0037_content_version.sql` (deux `ADD COLUMN` à défaut constant, sans réécriture de
   table).
2. Toute écriture du contenu édité l'incrémente dans le même `UPDATE` : `PATCH` (couverture retirée
   comprise), envoi de couverture, et pour un projet chaque écriture de galerie (ajout, texte
   alternatif, ordre, retrait), dans la transaction de la capture. Le « j'aime » ne la change pas.
3. `PATCH` et `POST …/image` acceptent `If-Match: "<version>"` : l'écriture devient
   `UPDATE … WHERE id = :id AND version = :version`. Aucune ligne écrite : 409 si l'entité existe
   encore (relue après coup), 404 sinon. Une version déjà différente à la lecture préalable répond
   409 avant tout envoi S3.
4. `version` est exposée dans toutes les réponses (lectures, listes, écritures) ; `ETag: "<version>"`
   est posé sur les réponses d'une entité. Il n'est pas ajouté à `Access-Control-Expose-Headers` :
   le front lit la version dans le corps et appelle l'API sur sa propre origine.
5. Front : chaque `PATCH` et chaque envoi de couverture part avec la version d'où vient le brouillon
   (la couverture, avec celle que l'écriture vient de rendre). Un 409 donne l'avertissement du
   parcours ; « Enregistrer quand même » relit la dernière version et l'envoie, jamais sans
   `If-Match`. Les écritures de galerie faites depuis l'onglet avancent la version attendue d'autant.

## Consequences

- Deux enregistrements partis de la même version : un seul passe, l'autre reçoit 409 (vérifié sur
  Postgres, y compris quand la seconde écriture attend le verrou de la première).
- Une modification de galerie faite ailleurs est désormais signalée par l'éditeur de projet.
- Une écriture de galerie réussie côté API mais perdue en route (coupure réseau) n'est pas comptée
  par l'onglet : son prochain enregistrement reçoit 409 et l'avertissement propose de recharger.
- L'`ETag` désigne la version du contenu édité : le nombre de « j'aime » peut changer sous le même
  `ETag`. L'API ne répond jamais 304 et ne lit pas `If-None-Match`.
- Pendant le déploiement, l'ancienne API écrit sur la base migrée sans incrémenter la version ;
  l'écart se referme à la première écriture de la nouvelle API.

## Rollback

Redéployer l'image précédente de l'API et du front : la colonne reste, inerte (défaut 1, ignorée
par l'ancien code, vérifié en faisant tourner l'API de `master` sur la base migrée). La supprimer
n'est pas nécessaire ; si elle l'était, `ALTER TABLE blog_post DROP COLUMN version;` et
`ALTER TABLE project DROP COLUMN version;` après le retour de l'ancienne image, dans une migration
dédiée.
