---
id: 032
title: L'atelier, le métier de tourneur CN sur le site
type: feature
status: draft
created: 2026-10-21
related: [PRODUCT.md, specs/031-ton-amical.md, specs/030-adr-en-articles.md, docs/adr/0011-themes-du-blog-derives-du-catalogue-de-tags.md, docs/adr/0007-images-statiques-versionnees-et-picture.md]
---

# 032 — L'atelier

## Description

### Objectif

Demande du propriétaire (2026-10-21) : donner une place au métier de Julien, **tourneur sur
commande numérique dans l'aéronautique**, mis en place **progressivement**. Le site le cite
aujourd'hui en une phrase (« Tourneur CN le jour, développeur web le reste du temps ») et par son
motif visuel (cartouche, cotes), mais ne montre rien du métier lui-même. Le ton est celui de la
spec 031 : amical, au tutoiement.

### Arbitrages (2026-10-21)

Les quatre volets sont retenus, livrés l'un après l'autre :

| Volet | Ce que c'est |
|---|---|
| V1 | **Page « L'atelier »** : le métier raconté (le tournage CN, l'aéronautique, les machines, une journée type), avec des photos si c'est possible |
| V2 | **Rubrique « Atelier » du blog** : des articles sur l'usinage (G-code, outils, tolérances, contrôle) |
| V3 | **Calculateur de conditions de coupe** : un outil interactif (vitesse de coupe, fréquence de rotation, avance) |
| V4 | **Pont usinage ↔ code** : le lien entre la rigueur de l'atelier et celle du code, rendu visible sur tout le site |

### Exigences communes

1. **Exactitude** : tout ce qui est dit du métier vient de Julien ou d'une source citée. Aucune
   donnée technique inventée (matières, vitesses, outils).
2. **Confidentialité** : rien qui puisse exposer l'employeur, ses clients, ses pièces ou ses plans
   (secteur aéronautique, souvent soumis à des clauses de confidentialité et à des contrôles
   d'export). Aucune photo de pièce client, aucune référence de programme ou de client.
3. **Mêmes standards que le reste du site** : rendu côté serveur, titre, description, canonical et
   données structurées ; WCAG AA (audit axe en CI) ; ton de la spec 031 ; verrou éditorial.
4. **Navigation** : l'atelier est atteignable depuis le menu principal dès qu'une page publique
   existe (aujourd'hui : Blog, Réalisations, Parcours).

### Exigences par volet

**V1 — Page « L'atelier »**

5. Une page publique (route à fixer, par exemple `/atelier`) qui explique le métier à un développeur
   qui n'a jamais vu un tour : ce que fait un tour CN, ce qu'est une cote et une tolérance, ce que
   change l'aéronautique (matières, exigences de contrôle), une journée type.
6. Le contenu vient de Julien. Les photos, si elles existent, sont des photos qu'il a le droit de
   publier (outillage personnel, atelier de formation, machine sans pièce client) ; images statiques
   versionnées selon ADR-0007.

**V2 — Rubrique « Atelier » du blog**

7. Un thème « Atelier » s'ajoute au catalogue de tags (ADR-0011), avec ses tags (par exemple
   G-code, Tournage, Tolérances, Métrologie) ; un thème vide reste masqué (ADR-0020).
8. Le premier article de la rubrique est écrit avec Julien (son sujet, ses exemples).

**V3 — Calculateur de conditions de coupe**

9. Un outil interactif dans le navigateur : à partir du diamètre et d'une vitesse de coupe, il donne
   la fréquence de rotation ; à partir de l'avance par tour, l'avance en mm/min. Formules du
   tournage : `n = 1000 × Vc / (π × D)` et `Vf = n × f`.
10. Les plages de vitesses par matière, si l'outil en propose, viennent d'une source que Julien
    valide (catalogue d'un fabricant d'outils, son expérience), affichées avec leur source et un
    avertissement : un calcul indicatif ne remplace ni les données de l'outil ni l'expérience.
11. Utilisable au clavier et au lecteur d'écran (champs étiquetés, résultat annoncé), sans appel
    d'API, résultats arrondis de façon lisible.

**V4 — Pont usinage ↔ code**

12. Le lien entre l'atelier et le code devient visible : renvois entre la page « L'atelier », la
    rubrique du blog et les articles techniques ; la règle de l'atelier (« une pièce hors tolérance
    ne part pas ») expliquée là où elle s'applique (tests, CI, accessibilité).

### Constat (2026-10-21, `master` `2e55a1a`)

- Menu principal (`layout/components/header/nav-items.ts`) : Blog, Réalisations, Parcours.
- Thèmes du blog (`blog-tag.model.ts`) : stack, security, engineering, journey, projects. Le thème
  « Parcours » contient déjà Industrie et Usinage n'y est pas.
- Accroche de l'accueil (`home.static-data.ts`) : « Tourneur CN le jour, développeur web le reste du
  temps. »
- Le brouillon A1 et les ADR citent déjà la règle de l'atelier.

### Découpage en PR (proposé)

| # | Dépôt | Périmètre | Dépend de |
|---|---|---|---|
| 1 | front | cette spec | — |
| 2 | front | plan technique (`architect`) du volet en cours | 1 |
| 3+ | front | un volet par PR (ou deux PR pour V3 : moteur de calcul, puis interface) | 2 |

Ordre retenu : **V1, V2, V3, V4**. V1 pose la page et l'entrée de menu « L'atelier » dont les autres
volets ont besoin ; V4 se fait au fil de l'eau une fois les trois premiers en ligne.

### Hors périmètre

- Simulateur de G-code, visualisation 3D de trajectoires d'outil : à rouvrir plus tard si l'envie
  est là.
- Toute donnée de l'employeur ou de ses clients.

### Arbitrages complémentaires (2026-10-21)

1. **Ordre** : V1 (page), V2 (rubrique du blog), V3 (calculateur), V4 (pont usinage ↔ code).
2. **Nom dans le menu** : « L'atelier ».

### Questions ouvertes

1. **Photos** : as-tu des photos que tu peux publier sans risque (outillage, poste sans pièce, atelier
   de formation) ? Ton employeur a-t-il une règle sur ce sujet ? (à trancher avant V1)
2. **Calculateur** : quelles matières et quelles sources pour les vitesses de coupe (fabricant
   d'outils, tes propres valeurs) ? Tournage seulement, ou aussi fraisage plus tard ? (à trancher
   avant V3)
