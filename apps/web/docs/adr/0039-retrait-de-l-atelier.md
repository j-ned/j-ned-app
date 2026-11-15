# ADR-0039 — Retrait de l'atelier (guide des plaquettes, décodeur)

- **Statut** : accepté et appliqué (2026-11-15) : front retiré (PR #43), puis API et table (migration 0034)
- **Date** : 2026-11-15
- **Retire** : specs 032, 034, 035, 036, 037 et 038 ; ADR-0032 (confidentialité du contenu
  d'atelier), ADR-0033 (référentiel d'usinage sourcé par le type)

## Context

L'atelier (`/atelier`) portait deux outils : le guide des plaquettes (`/atelier/plaquettes`, saisi
dans `/admin/guide-plaquettes`) et le décodeur de code ISO 1832 (`/atelier/decodeur`). Faits au
2026-11-15 :

- En production les deux interrupteurs sont éteints : seul l'accueil de l'atelier est en ligne,
  sans aucun outil à présenter.
- Le guide contient quatre lignes, pour une seule matière. Le remplir demande des données
  techniques (plaquettes, rayons, nuances) vérifiées une à une ; une donnée fausse en ligne engage
  la crédibilité du propriétaire, dont c'est le métier.
- Décision du propriétaire (2026-11-15) : le coût d'entretien dépasse l'intérêt, le site se
  recentre sur le blog.

## Decision

1. **Tout l'atelier sort du site** : accueil, guide, décodeur, éditeur admin, leurs entrées de menu
   et de pied de page, leurs URL dans le sitemap, la table de routes nginx et les scénarios de CI.
   Le code devenu sans usage part avec (champ à suggestions, recherche de suggestions, grille des
   lignes d'outil, icône de clé).
2. **Les anciennes adresses répondent 404**, sans redirection : nginx ne les relaie plus au rendu
   Node, et côté client elles tombent sur la page introuvable.
3. **En deux temps (expand → contract à l'envers)** : le front part d'abord et cesse d'appeler
   `/api/workshop-guide` ; l'API et la table `workshop_guide` partent ensuite, dans une PR à part,
   après déploiement du front et copie JSON du document enregistré.

## Consequences

- Le site public se résume à l'accueil, au blog, aux réalisations et au parcours.
- Entre les deux PR, l'API garde une route et une table que plus rien n'appelle : sans effet pour le
  visiteur, à ne pas laisser durer.
- Revenir en arrière se fait par `git revert` de la PR du front tant que la table existe ; après sa
  suppression, il faudra aussi rejouer la migration et ressaisir le contenu depuis la copie JSON.
- Les brouillons et notes de recherche de `tasks/` (non suivis par git) restent chez le propriétaire.

## Alternatives considered

- **Laisser les interrupteurs éteints** : aucun travail, mais l'accueil de l'atelier reste en ligne
  vide et le code reste à maintenir à chaque montée de version. Rejetée.
- **Garder le décodeur seul** : il ne dépend d'aucune saisie, mais il lit son interrupteur dans le
  document du guide et n'a de sens qu'à côté de lui. Rejetée par le propriétaire.
- **Retirer front et API dans la même PR** : une image du front encore en cache appellerait une
  route disparue pendant le déploiement. Rejetée.
