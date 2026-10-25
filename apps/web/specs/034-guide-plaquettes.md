---
id: 034
title: Guide des plaquettes, de la matière à l'outil de coupe
type: feature
status: draft
created: 2026-10-25
related: [specs/032-atelier.md, specs/031-ton-amical.md, PRODUCT.md, DESIGN.md, docs/adr/0032-confidentialite-verifiable-du-contenu-d-atelier.md]
---

# 034 — Guide des plaquettes

## Description

### Objectif

Demande du propriétaire (2026-10-25) : un outil de l'atelier (spec 032) qui guide le choix d'un
outil de coupe en tournage. On tape le début du nom d'une matière, le guide propose les matières
connues ; on choisit la matière puis l'opération, et le guide indique le **type** de plaquette à
utiliser, avec ce qu'il faut savoir pour bien usiner cette matière. Public : des devs et des curieux
(PRODUCT.md), mais aussi des usineurs débutants ; ton de la spec 031, au tutoiement.

### Parcours

1. **Matière** : un champ de saisie avec suggestions. La recherche porte sur toutes les désignations
   d'une matière (EN, numéro matière, AISI/UNS, ancienne AFNOR, nom courant), sans tenir compte de
   la casse, des espaces, des tirets ni des accents : `42cd4`, `4140` et `1.7225` trouvent toutes
   `42CrMo4`. Le choix affiche le groupe ISO 513 (lettre, couleur, nom) et le comportement de la
   matière à la coupe.
2. **Opération**, regroupée par famille :

   | Famille | Opérations |
   |---|---|
   | Tournage extérieur | ébauche, semi-finition, finition |
   | Intérieur (alésage) | ébauche, finition |
   | Gorge et tronçonnage | gorge, tronçonnage |
   | Filetage | filetage |
   | Perçage | perçage au foret à plaquettes |

3. **Recommandation** pour le couple matière × opération :
   - le type de plaquette. En tournage extérieur et intérieur, c'est un code de désignation ISO
     partiel (forme, dépouille, rayon de bec…) dont chaque champ est expliqué. En gorge,
     tronçonnage, filetage et perçage, les plaquettes ne suivent pas cette désignation : elles sont
     décrites par leur type (largeur, profil, nombre d'arêtes, système de fixation) ;
   - la géométrie (brise-copeaux, préparation d'arête) et la nuance, **décrites avec des mots**,
     jamais par un nom commercial ;
   - une plage de vitesse de coupe indicative quand la source en donne une ;
   - les pièges propres à la matière (écrouissage, arête rapportée, usure en entaille…) ;
   - la source de chaque information et un avertissement : la recommandation est indicative et ne
     remplace ni le catalogue de l'outil ni l'expérience.

### Exigences

1. **Exactitude (exigence 1 de la spec 032)** : chaque donnée affichée porte sa source. Une
   recommandation sans source n'existe pas dans le référentiel. Aucune donnée inventée : une
   combinaison matière × opération sans recommandation sourcée l'affiche franchement (« pas encore
   de recommandation pour ce cas ») plutôt que d'extrapoler.
2. **Sources** :
   - matières, groupes ISO 513, correspondances de désignations et comportement : les tables de
     classification et de correspondance des matières de Sandvik Coromant. Le « Référentiel des
     alliages d'usinage » fourni par Julien a été produit par une IA (Gemini) : il sert de liste de
     départ, chaque valeur est vérifiée dans la source citée avant d'entrer dans le référentiel, et
     il n'est jamais cité comme source ;
   - recommandations d'outils par matière et opération : le **catalogue Sandvik Coromant**, cité
     sur chaque fiche ;
   - désignation des plaquettes : la norme ISO 1832, via la page « désignation » du catalogue
     Sandvik Coromant.
3. **Confidentialité (spec 032, ADR-0032)** : aucune donnée de l'employeur ni de ses clients. Les
   noms d'alliages, de normes et les valeurs de coupe génériques sont autorisés.
4. **Accessibilité** : le champ à suggestions est utilisable au clavier (flèches, Entrée, Échap) et
   annoncé au lecteur d'écran (nombre de suggestions, suggestion active) ; la recommandation est
   annoncée quand elle change ; aucune information portée par la seule couleur du groupe ISO.
5. **Rendu et SEO** : page publique rendue côté serveur, sans appel d'API ; la saisie (matière,
   opération) se reflète dans l'URL pour partager une fiche ; titre, description et canonical
   comme le reste du site.
6. **Lien avec la spec 032** : le guide vit sous « L'atelier ». La plage de vitesse affichée
   pré-remplit le calculateur de conditions de coupe (V3) quand celui-ci existe.

### Constat (2026-10-25, `master` `5c2e228`)

- **Référentiel des alliages** (3 pages) : 6 groupes ISO 513, une trentaine de matières avec
  correspondances EN / numéro / AISI-UNS / AFNOR, usinabilité et applications. Correspondances
  contrôlées par sondage (C45 1.0503, 42CrMo4 1.7225 / 4140, 316L 1.4404, 17-4 PH 1.4542,
  TA6V R56400 / 3.7165, Inconel 718 N07718 / 2.4668…) : aucun écart trouvé. Trois passages sont
  **coupés au saut de page** : les règles d'or du groupe P, la fin du tableau des aluminiums (série
  5000 et suivantes, cuivreux, laitons, bronzes), et les repères de vitesse des groupes S et H.
  Le document ne contient **aucune recommandation de plaquette par opération**.
- **Fiche de codification des plaquettes** : affiche de la boutique « Un Petit Usineur », offerte en
  téléchargement sur sa page « Guide complet : tout savoir sur la désignation des plaquettes de
  tournage » (copyright 2026, aucune condition de réutilisation, aucune source citée). Elle cite
  « ISO 1853 », alors que la désignation des plaquettes amovibles relève de l'ISO 1832 ; son tableau
  des angles de dépouille donne deux valeurs pour les lettres D, E et P. Ni l'affiche ni la page ne
  donnent de recommandation par matière ou par opération. Elle ne sert donc pas de source et rien
  n'en est recopié ; la désignation est reprise de Sandvik Coromant.
- La page « L'atelier » (V1 de la spec 032) a son plan technique (PR #256) mais n'est pas encore
  implémentée : la route `/atelier` n'existe pas.

### Découpage en PR (proposé)

| # | Périmètre | Dépend de |
|---|---|---|
| 1 | cette spec | — |
| 2 | plan technique (`architect`) de l'accueil de l'espace et du guide | 1 |
| 3 | accueil `/atelier` (intro courte, carte du guide, menu et pied de page) | 2 |
| 4 | référentiel des matières et recherche (domaine pur, sans interface) | 2 |
| 5 | interface : champ à suggestions, choix de l'opération, fiche matière | 3, 4 |
| 6+ | recommandations, une famille d'opérations par PR, au rythme de la saisie des données sourcées | 5 |

### Hors périmètre

- Fraisage.
- Références commerciales, prix, liens d'achat.
- Conditions de coupe complètes (profondeur de passe, avance) au-delà de ce que donne la source.
- Décodeur et composeur de désignation ISO en outil séparé : à rouvrir après ce guide.

### Arbitrages (2026-10-25)

1. **Catalogue** : Sandvik Coromant, pour toutes les familles d'opérations. Les fiches décrivent les
   types de plaquettes et les géométries avec des mots ; aucun nom commercial ni référence Sandvik
   n'est affiché, seule la source est citée.
2. **Référentiel des alliages** : produit par Gemini à la demande de Julien. Une sortie d'IA n'est
   pas une source (exigence 1) : la liste des matières est reprise comme point de départ, mais
   chaque correspondance, groupe, comportement et plage de vitesse est vérifié et cité dans Sandvik
   Coromant. Ce qui n'y figure pas n'est pas publié. Les trois passages coupés ne sont pas à
   récupérer : leur contenu viendra de la même source.
3. **Fiche de codification** : écartée comme source (voir Constat).
4. **Liste des matières** : celles du référentiel seulement pour cette version, une fois vérifiées
   dans Sandvik Coromant. D'autres matières pourront s'ajouter plus tard, selon la même règle.
5. **Place dans « L'atelier »** : « L'atelier » devient un espace d'éléments de métier (spec 032,
   arbitrages du 2026-10-25). Le guide en est le **premier outil** : il est livré avec l'accueil de
   l'espace (`/atelier` : intro courte, cartes des éléments), et vit sous `/atelier` (chemin exact
   fixé par le plan technique). Le plan technique couvre donc les deux.
