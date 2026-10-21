---
id: 030
title: Les ADR deviennent des articles de blog, avec un maillage interne
type: feature
status: draft
created: 2026-10-21
related: [specs/029-repositionnement-portfolio-passion.md, docs/adr/0011-themes-du-blog-derives-du-catalogue-de-tags.md, docs/adr/0024-rendu-a-la-requete-des-pages-de-contenu.md, PRODUCT.md]
---

# 030 — Les ADR deviennent des articles de blog

## Description

### Objectif

Demande du propriétaire (2026-10-21) : transformer les ADR en articles de blog. C'est la suite
annoncée par la spec 029 (« Hors périmètre : phase SEO active… transformation des ADR en
articles : spec dédiée »). Le site est un portfolio personnel : un lecteur développeur doit y
trouver du raisonnement technique vérifiable, et non une vitrine commerciale. Les ADR contiennent
déjà ce raisonnement (contexte, options, décision, conséquences), mais ils sont rédigés pour le
dépôt, pas pour un lecteur.

### Arbitrages (2026-10-21)

1. **Périmètre : contenu + maillage.** Des articles tirés des ADR, plus le code qui relie les
   articles entre eux et aux projets. Le reste de la phase SEO (`ProfilePage`, etc.) fera l'objet
   d'une autre spec.
2. **Quatre articles d'abord**, un par groupe d'ADR proches :

   | # | Sujet | ADR sources |
   |---|---|---|
   | A1 | Rendu et performance : du HTML frais sans rebuild | 0024, 0001, 0014 |
   | A2 | Sécurité du contenu : Markdown, images, CSP sans `unsafe-inline` | 0002, 0015, 0018 |
   | A3 | Accessibilité vérifiée en CI dans un vrai navigateur | 0025, 0016, 0017 |
   | A4 | Design system : polices, thème, utilities Tailwind v4 | 0006, 0012, 0003 (avec 0017) |

### Exigences

#### Contenu (A1 à A4)

1. Chaque article est **réécrit pour un lecteur**, pas recopié : le problème de départ, les options
   envisagées, la décision, ce qu'elle coûte, ce qu'elle a donné. Un exemple de code court quand il
   éclaire la décision.
2. **Tout fait est vérifiable** : chaque chiffre, comportement ou en-tête cité est revérifié sur le
   code de `master` ou en production au moment de la rédaction, et non repris de l'ADR sans contrôle
   (plusieurs ADR ont été amendés ou remplacés en partie depuis).
3. Chaque article **cite ses ADR** avec un lien vers le fichier sur GitHub (les dépôts
   `j-ned/ng-portfolio-app` et `j-ned/nest-portfolio-app` sont publics).
4. **Règles éditoriales du site** : aucun mot du verrou `editorial-identity.spec.ts` ni de
   `forbidden-wordings.ts`, aucun appel commercial. La fin d'un article renvoie vers le code, l'ADR
   et un autre article, pas vers une prestation.
5. **Tags** pris dans le catalogue (ADR-0011) pour que chaque article tombe dans un thème. Les tags
   manquants (voir Constat 4) sont ajoutés au catalogue, dans le bon thème.
6. Les brouillons sont relus en PR (`docs/articles/`) avant publication. La publication se fait par
   l'admin ; le slug, généré par l'API au premier enregistrement, est ensuite figé.

#### Maillage (code)

7. **Article → articles** : la page d'un article propose jusqu'à trois autres articles publiés,
   choisis par proximité (tags et thème partagés), **dans le HTML servi** (rendu à la requête,
   ADR-0024), et non ajoutés par le navigateur après coup.
8. **Article ↔ projet** : un article qui parle d'un projet renvoie vers sa fiche, et la fiche du
   projet liste les articles publiés qui le concernent. Comment un article « déclare » son projet
   (tag, champ, convention) est à décider dans le plan technique.
9. Les données structurées restent `BlogPosting` (déjà en place) ; le plan technique dit si les liens
   ci-dessus doivent aussi y apparaître (`isBasedOn` vers l'ADR, `about` vers le projet, etc.).
10. Aucune régression : AXE à zéro violation (ADR-0025), verrou éditorial vert, pages de contenu
    toujours rendues à la requête sans rebuild.

### Constat (2026-10-21, `master` `ec11541`)

1. 28 ADR, de 280 à 1 650 mots. Les ADR 0005 et 0026 à 0028 sont obsolètes (spec 029) et ne
   seront jamais publiés. Plusieurs ADR utiles ne sont plus à jour seuls : 0003 est remplacé en partie
   par 0017, 0015 est amendé par 0018, 0024 amende 0023. Les ADR 0016 et 0018 sont encore au
   statut « proposé », alors qu'ils sont appliqués : `shared/ui/field-error.ts` est utilisé dans
   17 fichiers, et nginx relaie `/api/storage/` depuis l'origine du site (`Dockerfile`, bloc
   `location ^~ /api/storage/`). Leur statut est à passer à « accepté » avant de les citer.
2. Le format marche déjà : l'article « Mesurer la fréquentation de son site sans cookie ni bandeau
   de consentement » (publié le 2026-10-18) est tiré des ADR 0021 et 0022.
3. La page d'un article (`features/blog/pages/blog-detail/blog-detail.ts`) émet un JSON-LD
   `BlogPosting` (auteur, dates, mots-clés). Elle ne propose aucun autre article ni aucun projet :
   un lecteur arrivé de Google repart sans lien vers la suite. La fiche projet (`CreativeWork`) ne
   cite aucun article.
4. Le catalogue de tags (`features/blog/domain/models/blog-tag.model.ts`) n'a ni « Performance »,
   ni « SSR », ni « Accessibilité », ni « CSP », ni « Design system », ni « Tailwind CSS ».
   L'API accepte des tags libres (15 au plus) : un tag hors catalogue reste neutre et ne compte
   dans aucun thème (ADR-0011).
5. Les projets ont leurs propres tags (`project.tags`, côté API), sans lien avec ceux du blog.

### Découpage en PR

| # | Dépôt | Périmètre | Dépend de |
|---|---|---|---|
| 1 | front | cette spec (Description) | — |
| 2 | front | plan technique (`architect`), ADR si décision structurante | 1 |
| 3 | front (+ API si le plan l'exige) | maillage : articles proches, lien article ↔ projet, tags ajoutés | 2 |
| 4 à 7 | front | un brouillon par PR (`docs/articles/`), puis publication par l'admin, un par semaine | 3 pour les liens, sinon 1 |

Les articles peuvent être rédigés pendant que le maillage se code : seule leur publication gagne à
attendre la PR 3.

### Hors périmètre

- `ProfilePage`, refonte des titres et descriptions, `llms.txt` : autre spec SEO.
- Les autres ADR (0004, 0007 à 0011, 0013, 0019 à 0023) : candidats d'une deuxième vague, choisis
  après la mesure d'audience des quatre premiers articles.
- Traduction anglaise, newsletter, série d'articles numérotée.

### Arbitrages complémentaires (2026-10-21)

1. **Brouillons dans le dépôt** : un fichier par article dans `docs/articles/` (par exemple
   `docs/articles/030-a1-rendu-et-performance.md`), relu en PR, puis collé dans l'admin. L'historique
   et les faits vérifiés restent traçables.
2. **Un article par semaine**, dans l'ordre A1 à A4 (modifiable). La mesure d'audience de chaque
   article informe la rédaction du suivant.
