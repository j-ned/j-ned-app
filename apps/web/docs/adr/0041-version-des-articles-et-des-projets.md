# ADR-0041 — Version entière des articles et des projets, écriture conditionnelle par `If-Match`

- **Statut** : proposé (2026-11-22), révisé le même jour après revue (412 au lieu de 409)
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

- **409 Conflict** : ce que l'API répond déjà pour le parcours. Retenu d'abord pour la cohérence
  des trois éditeurs, **abandonné (2026-11-22, revue de la branche)** : le `PATCH` d'un article ou
  d'un projet répond déjà 409 quand le nouveau titre donne un slug pris. Le front prenait ce refus
  pour une version périmée : renommer un projet du titre d'un autre affichait « une version plus
  récente… », recharger faisait perdre le brouillon et « Enregistrer quand même » renvoyait le même
  409 sans fin. Distinguer les deux par le texte du message serait fragile.
- **412 Precondition Failed** : ce que prévoit HTTP (RFC 9110, § 13.1.1) pour un `If-Match` qui ne
  correspond pas ; aucune autre cause ne le produit sur ces routes. **Retenu.** Le parcours, qui
  envoie sa version dans le corps (pas de précondition HTTP), garde son 409 : contrat inchangé.

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
   `UPDATE … WHERE id = :id AND version = :version`. Aucune ligne écrite : **412** si l'entité
   existe encore (relue après coup), 404 sinon. Une version déjà différente à la lecture préalable
   répond 412 avant tout envoi S3. Le 409 reste réservé au slug déjà pris.
4. Chaque écriture de galerie commence par l'`UPDATE` de la version du projet (projet absent : 404) : le projet est verrouillé avant ses captures, dans l'ordre de `DELETE project` puis de sa
   cascade. L'ordre inverse (capture, puis projet) s'interbloquait avec une suppression
   concurrente (`deadlock detected`, 500 ; reproduit sur Postgres). Les quatre écritures de galerie
   renvoient la version du projet dans leur `ETag`.
5. `version` est exposée dans toutes les réponses (lectures, listes, écritures) ; `ETag: "<version>"`
   est posé sur les réponses d'une entité. Il n'est pas ajouté à `Access-Control-Expose-Headers` :
   le front lit la version dans le corps et appelle l'API sur sa propre origine.
6. Front : chaque `PATCH` et chaque envoi de couverture part avec la version d'où vient le brouillon
   (la couverture, avec la plus haute de celle que l'écriture vient de rendre et de celle que la
   galerie a rendue). Un 412 donne l'avertissement du parcours ; « Enregistrer quand même » relit la
   dernière version et l'envoie, jamais sans `If-Match`. Un 409 dit que le titre est déjà pris,
   sans avertissement de version et sans toucher au brouillon. L'éditeur de projet retient la plus
   haute version connue : celle du projet enregistré ou relu, ou celle qu'une écriture de galerie a
   rendue, quel que soit l'ordre d'arrivée des réponses. Compter +1 par écriture de galerie
   (première version) se désynchronisait quand une écriture de galerie chevauchait un
   enregistrement ou un rechargement.

## Consequences

- Deux enregistrements partis de la même version : un seul passe, l'autre reçoit 412 (vérifié sur
  Postgres, y compris quand la seconde écriture attend le verrou de la première).
- Une modification de galerie faite ailleurs est désormais signalée par l'éditeur de projet.
- Une écriture de galerie réussie côté API dont la réponse se perd (coupure réseau) ne fait pas
  connaître sa version à l'onglet : son prochain enregistrement reçoit 412 et l'avertissement
  propose de recharger. De même si un enregistrement part pendant qu'une écriture de galerie de
  l'onglet est encore en route et que celle-ci est validée la première.
- L'`ETag` désigne la version du contenu édité, pas l'octet près de la représentation : le nombre
  de « j'aime » d'un article public peut changer sous le même `ETag`. Laissé en l'état (décision de
  la revue) : c'est un validateur du contenu édité, l'API ne lit pas `If-None-Match` et ne répond
  jamais 304. Sur une écriture de galerie, l'`ETag` est la version du projet, pas celle de la
  capture.
- Une couverture refusée en 412 après son envoi à S3 (version changée entre la lecture préalable et
  l'`UPDATE`) laisse un objet S3 orphelin, comme tout échec d'écriture après l'envoi. Laissé en
  l'état (décision de la revue) : supprimer l'objet risquerait d'effacer une clé encore citée si le
  même fichier est renvoyé.
- Pendant le déploiement, l'ancienne API écrit sur la base migrée sans incrémenter la version ;
  l'écart se referme à la première écriture de la nouvelle API.

## Rollback

Redéployer l'image précédente de l'API et du front : la colonne reste, inerte (défaut 1, ignorée
par l'ancien code, vérifié en faisant tourner l'API de `master` sur la base migrée). La supprimer
n'est pas nécessaire ; si elle l'était, `ALTER TABLE blog_post DROP COLUMN version;` et
`ALTER TABLE project DROP COLUMN version;` après le retour de l'ancienne image, dans une migration
dédiée.
