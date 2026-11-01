# ADR-0033 — Référentiel d'usinage : la source est dans le type, l'absence est un état

- **Statut** : remplacé par la spec 035 (2026-10-27) ; proposé le 2026-10-25 (plan technique de la spec 034)
- **Note** (2026-10-27) : le référentiel sourcé est retiré. Le guide des plaquettes devient un document
  saisi par Julien dans l'admin et lu dans l'API (`specs/035-guide-plaquettes-simplifie.md`) : plus de
  source fabricant, plus de déduction, donc plus de source portée par le type.
- **Date** : 2026-10-25
- **Contexte spec** : `specs/034-guide-plaquettes.md` (exigences 1 et 2, arbitrages 1 à 4) ;
  `specs/032-atelier.md` (exigence commune 1, volet V3)
- **Prolonge** : ADR-0004 (contenu statique de feature en constante de domaine), ADR-0032
  (confidentialité vérifiable du contenu d'atelier)
- **S'écarte de** : ADR-0004, Conséquences, « les tests de composants consomment la constante
  réelle » (décision 5)

## Context

Le guide des plaquettes (spec 034) est le premier outil de l'atelier qui affiche des **données
techniques** : matières et leurs correspondances de désignations, groupe ISO 513, comportement à la
coupe, type de plaquette, géométrie, nuance, plage de vitesse de coupe, pièges. Le calculateur V3
suivra avec des plages de vitesse. Une donnée fausse sur un site public engage la crédibilité de
Julien, dont c'est le métier, et peut induire un débutant en erreur.

Faits (2026-10-25) :

- L'exigence 1 impose que **chaque donnée affichée porte sa source** et qu'une combinaison sans
  recommandation sourcée le dise, sans extrapoler.
- La liste de départ des matières est un document **produit par une IA** (Gemini). Il n'est pas une
  source ; ses valeurs n'entrent pas sans vérification dans Sandvik Coromant (arbitrage 2).
- Les données seront saisies **plus tard**, fiche par fiche, et validées par Julien : l'interface se
  construit avant qu'elles existent.
- Les recommandations des fabricants d'outils sont publiées par famille d'opération ; la
  désignation ISO 1832 ne concerne que les plaquettes de tournage extérieur et intérieur. Gorge,
  tronçonnage, filetage et perçage se décrivent autrement.

## Decision

1. **La citation est obligatoire dans le type.** Toute donnée affichée est un `Sourced<T>` (`value`,
   `cite`) ; `cite` référence une source d'une union fermée `SourceId`, adossée à un catalogue
   `Record<SourceId, Source>` (titre, éditeur, URL `https` quand le document a une adresse publique,
   date de consultation). Une donnée sans citation, ou citant une source hors catalogue, ne compile
   pas.
2. **L'absence est un état, jamais un trou comblé.** La résolution rend `incomplete`, `unavailable`
   ou `available`. Une recommandation **liste explicitement** les matières qu'elle couvre : aucun
   repli automatique du groupe ISO vers la matière, aucune interpolation entre matières voisines.
   Ce qui n'est pas saisi s'affiche « pas encore de recommandation pour ce cas ».
3. **La forme suit la famille d'opération, à la compilation.** Le type de la plaquette est un type
   conditionnel sur l'opération : désignation ISO 1832 partielle (champ, code, signification, chacun
   sourcé) pour le tournage extérieur et intérieur ; description par aspects (largeur, profil, nombre
   d'arêtes, fixation) pour les autres familles.
4. **Les données vivent dans le code, chaque ajout passe une PR.** Constantes de domaine (ADR-0004) ;
   toute PR de données porte une liste de vérification que Julien coche lui-même : valeur vérifiée
   dans la source citée, localisation (`locator`) exacte, aucune valeur reprise d'une sortie d'IA
   sans vérification, aucun nom commercial, confidentialité (ADR-0032). Des tests d'intégrité
   tournent sur les données réelles : formats, unicités, références croisées, aucune source dont le
   titre, l'éditeur ou l'URL désigne une IA, aucun nom commercial hors du catalogue des sources,
   garde `findConfidentialReferences` sur le texte libre.
5. **L'interface lit le référentiel par un `InjectionToken`** dont la `factory` rend les constantes
   réelles. Les tests de composants fournissent une **fixture manifestement fictive** ; les tests
   d'intégrité du domaine portent sur les constantes réelles. Raison de l'écart à ADR-0004 : le
   référentiel est vide quand l'interface se construit et change à chaque PR de données ; des tests
   de composants couplés à son contenu seraient impossibles d'abord, réécrits ensuite.

## Consequences

- Le compilateur refuse la donnée orpheline avant tout test ; une erreur de rattachement (source
  inexistante, matière inconnue) casse `pnpm test` avant le commit.
- Le guide peut être en ligne avec très peu de données : l'état `unavailable` est la règle tant que
  la saisie avance, et c'est voulu.
- La saisie coûte plus cher qu'un tableau libre : chaque valeur porte sa localisation dans la
  source. C'est le prix de l'exigence 1.
- Une recommandation donnée par la source pour un groupe de matières doit être rattachée nommément
  aux matières vérifiées de ce groupe : ce rattachement est une lecture de la source, tracée dans la
  citation et validée par Julien.
- Le calculateur V3 réutilise `Sourced<CuttingSpeedRange>` et le même catalogue de sources.
- Si le référentiel devait un jour être saisi dans l'admin, il migrerait vers `infra/` derrière un
  gateway (ADR-0004 §4) ; le type sourcé et les tests d'intégrité deviendraient la validation de
  l'API. Rien n'est anticipé ici.

## Alternatives considered

- **Source optionnelle, vérifiée par un test** : le test attrape l'oubli, mais après coup et sans
  dire au moment de la saisie ce qui manque. Rejetée : la contrainte est structurelle, elle va dans
  le type.
- **Une source par fiche plutôt que par donnée** : plus léger, mais une fiche mélange correspondances
  de désignations, groupe et recommandations, issues de documents différents. Rejetée (exigence 1).
- **Recommandation par groupe ISO, appliquée à toutes ses matières** : moins de saisie, mais elle
  affirme pour un alliage ce que la source n'a peut-être pas dit pour lui. Rejetée : extrapolation.
- **Données dans un fichier JSON** : saisie plus simple hors code, mais aucune garantie de
  compilation ; il faudrait un validateur runtime. Rejetée.
- **Données dans l'API et l'admin** (comme les fiches V5) : publication sans revue ni test. Rejetée
  pour un contenu technique dont chaque valeur doit être vérifiée avant d'être en ligne.
- **Tests de composants sur les données réelles** (ADR-0004 tel quel) : rejetée, voir décision 5.

## Amendement (2026-10-26)

Décisions de Julien 9 à 12, 15 et 17 de la spec 034 :

- **Décision 1, précisée** : une citation dit sa **base**, `stated` (la source écrit la valeur) ou
  `deduced` (la valeur est déduite d'un principe que la source écrit). Une valeur `deduced` s'affiche
  avec la mention « déduit des principes du fabricant » ; la citation pointe la page du principe.
- **Décision 4, remplacée pour les données du guide** : plus de case « vérifiée par Julien » ; une PR
  de données doit montrer, pour chaque valeur, sa source et sa base. Les gardes de test (IA citée
  comme source, noms commerciaux, confidentialité, intégrité) restent.
- **Correspondances indicatives** : les désignations d'une matière viennent de la liste de travail de
  Julien et s'affichent comme indicatives ; elles ne sont jamais présentées comme vérifiées sur une
  norme.
- **Décision 1, URL facultative** (décision 15) : une source sans adresse publique (la liste de
  travail de Julien) n'a pas d'URL ; son titre s'affiche sans lien. Le type rend l'URL facultative,
  `https` si elle existe ; un test d'intégrité garde que seule la liste de travail en est privée et
  qu'aucune source ne pointe vers le site lui-même.
- **Conseil de sous-groupe** (décision 17) : un conseil écrit dans la section d'un sous-groupe (inox
  austénitiques, duplex, ferritiques et martensitiques, aciers trempés…) ne couvre que les matières de
  ce sous-groupe, jamais le groupe ISO entier. Chaque matière porte son sous-groupe ; un test garde
  qu'une recommandation ne couvre que les matières du sous-groupe dont elle cite la section, et qu'une
  matière dont le sous-groupe n'a pas de section reste sans recommandation. La mention affichée est
  « conseil du sous-groupe ».
