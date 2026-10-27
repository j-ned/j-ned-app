---
id: 036
title: Décodeur de code plaquette ISO, lié au guide des plaquettes
type: feature
status: draft
created: 2026-10-27
related: [specs/035-guide-plaquettes-simplifie.md, specs/032-atelier.md, docs/adr/0024-rendu-a-la-requete-des-pages-de-contenu.md, specs/assets/036/table-iso-1832.md, specs/assets/036/notes-iso-1832.md]
---

# 036 — Décodeur de code plaquette

## Description

### Objectif

Demande du propriétaire (2026-10-27) : un deuxième outil de l'atelier, qui **explique un code de
plaquette ISO** lettre par lettre (`CNMG 120408` → losange 80°, dépouille 0°, tolérance M, trou et
brise-copeaux deux faces, arête 12, épaisseur 4,76 mm, rayon de bec 0,8 mm). Il va de pair avec le
guide des plaquettes (spec 035) : le guide dit **quelle** plaquette, le décodeur dit **ce que veut
dire** son code.

### Arbitrages (2026-10-27)

1. **Outil à part, lié au guide** : sa propre page `/atelier/decodeur`, deuxième carte de l'accueil
   de l'atelier, **toujours en ligne** (indépendante de l'interrupteur du guide). Dans le guide,
   chaque code de plaquette **décodable** devient un lien vers son décodage.

### Parcours

1. Un champ « Code de plaquette » : on tape `CNMG 120408`, `cnmg120408`, `CNMG 120408-PM`… La saisie
   tolère casse, espaces et tirets.
2. Le décodage s'affiche position par position : la lettre ou le chiffre, sa signification, et
   pour les positions 1 à 7 la source (Mitsubishi Materials et Kyocera, concordants).
3. La suite éventuelle (après la position 7, par exemple `-PM`) s'affiche telle quelle comme
   **suffixe propre au fabricant** (brise-copeaux, nuance), sans être décodée.
4. Le code reste dans l'URL (`?code=CNMG120408`) : depuis le guide, un clic sur un code ouvre
   directement son décodage, et un décodage se partage.

### Exigences

1. **Données** : uniquement la table des positions 1 à 7 de `specs/assets/036/table-iso-1832.md`,
   valeurs **concordantes** entre Mitsubishi Materials et Kyocera. Ce qui n'est écrit que par une
   source (forme X, dépouille O, épaisseurs S1/T0/T1/05, micro-rayons) n'entre pas, ou s'affiche
   « non reconnu ». Chaque position cite sa source ; l'ISO 1832 (payante, non lue) est nommée comme
   norme, pas comme source.
2. **Erreurs claires et localisées** : une saisie invalide dit **quelle position** ne va pas
   (« 2ᵉ lettre `X` : dépouille inconnue »), sans planter. Les codes en pouces (ANSI, par exemple
   `CNMG 432`) sont reconnus comme tels et refusés avec ce motif, jamais décodés à tort.
3. **Rendu** : page rendue à la requête **sans appel d'API** (son affichage dépend de `?code`,
   comme l'était le guide de la spec 034, ADR-0024) ; la location SSR de nginx, le sitemap et
   `ci/smoke.sh` / `ci/verify-prerender.sh` suivent.
4. **Accessibilité et SEO** : champ étiqueté, résultat dans une liste de définitions (`dl`)
   annoncée quand elle change, erreurs en `role="alert"`, page lisible à 375 px ; titre, description
   et canonical sans query string ; tutoiement.
5. **Lien depuis le guide** : un code du guide n'est un lien que s'il se décode (positions 1 à 7
   reconnues) ; sinon il reste du texte. Le lien ne change rien à l'interrupteur du guide.
6. **Domaine pur** : le décodage est une fonction pure (`parse` → résultat typé ou erreur
   localisée), testée sans TestBed, avec une propriété « décoder puis recomposer redonne le code
   normalisé ».

### Découpage en PR (proposé)

| # | Dépôt | Périmètre | Dépend de |
|---|---|---|---|
| 1 | front | cette spec et la table sourcée | — |
| 2 | front | domaine : table ISO 1832 sourcée, décodage pur et ses tests | 1 |
| 3 | front | page `/atelier/decodeur`, carte sur l'accueil, lien depuis le guide | 2 |

Pas d'API : tout est dans le code. Chaque PR part de `master` à jour (jamais de PR empilée).

### Hors périmètre

- Plaquettes de fraisage, de gorge, de filetage (codifications propres aux fabricants).
- Décodage des suffixes fabricant (brise-copeaux, nuances).
- Schéma dessiné de la forme : à rouvrir plus tard si l'envie est là.
