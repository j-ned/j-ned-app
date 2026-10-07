# ADR-0011 — Thèmes du blog dérivés du catalogue de tags, filtre local à options inactives

- **Statut** : accepté (2026-10-07, arbitrages du propriétaire, spec 014)
- **Date** : 2026-10-07
- **Contexte spec** : `specs/014-refonte-blog.md`
- **Prolonge** : ADR-0010 §7 (filtre local, hors URL, sur une page prérendue)

## Context

La liste `/blog` est refondue pour être raccord avec `/projects` : un cartouche « Thèmes » dans
l'en-tête et des filtres par thème, sur le modèle de la légende et des filtres par nature.

Faits vérifiés :

- Un article n'a pas de champ « thème ». Il porte des `tags: readonly string[]` libres. Le domaine
  connaît un catalogue `BLOG_TAGS_BY_CATEGORY` à cinq catégories (`stack`, `security`,
  `engineering`, `journey`, `projects`) et `blogTagCategory(tag)` (`null` pour un tag libre). Ce
  catalogue sert aujourd'hui à l'admin (sélecteur de tags, `AVAILABLE_BLOG_TAGS`) et à la palette
  des pastilles (`blog-tag-palette.ts`), pas à la navigation publique.
- Les articles en production (relevé API du 2026-10-07) ont 9 et 15 tags, répartis sur 2 et 4
  catégories. Avec la règle « au moins un tag de la catégorie » et le catalogue d'alors, les
  comptes étaient : Stack 2, Sécurité 1, Ingénierie 0, Parcours 2, Projets 1. L'article sur le
  chiffrement comptait dans « Parcours » par son seul tag `Full-Stack` (rangé dans `journey`).
  La somme dépasse le nombre d'articles.
- `/blog` est prérendue une fois, sans query. nginx sert ce HTML quelle que soit la query. Le
  filtre `?tag=` existant (liens de tags de la page article) est lié par
  `withComponentInputBinding()`.
- Les filtres de `/projects` masquent une nature sans projet. Le propriétaire veut au contraire
  que les cinq thèmes restent visibles, grisés à 0.

## Decision

1. **Un thème est une catégorie du catalogue de tags.** Pas de champ API, pas de migration. Un
   article appartient à un thème si au moins un de ses tags est classé dans cette catégorie. Il
   peut appartenir à plusieurs thèmes. Un tag libre n'en donne aucun.
2. **La liste des thèmes est une constante ordonnée du domaine**,
   `BLOG_TAG_CATEGORIES = ['stack', 'security', 'engineering', 'journey', 'projects'] as const`,
   dont `BlogTagCategory` est dérivé (précédent `PROJECT_KINDS`). Les libellés publics vivent
   dans un `Record<BlogTagCategory, string>` : ajouter une catégorie fait échouer la compilation
   tant que son libellé manque.
3. **Le filtre par thème est local** (signal, hors URL), comme celui de `/projects` (ADR-0010 §7).
   Le HTML prérendu montre toujours « Tous ».
4. **Un thème sans article reste proposé, inactif** : `aria-disabled="true"`, compte `0`,
   focusable et annoncé, clic sans effet. Pas d'attribut `disabled` natif, qui retirerait le
   bouton de l'ordre de tabulation et de la lecture.
5. **Un seul filtre actif à la fois.** Le `?tag=` (plus fin, venu de la page article) prend la
   place du groupe de thèmes : bandeau « Filtré par <tag> » avec retrait, pas de croisement tag ×
   thème. Le type le dit : `BlogListFilter` est une union discriminée
   `{ by: 'tag'; tag } | { by: 'category'; category }`.
6. **Primitive partagée.** Le groupe de filtres à boutons bascule (`aria-pressed`, compte, option
   inactive) devient `shared/ui/filter-group.ts`, générique sur le type de valeur. `/projects`
   l'adopte (son `ProjectKindFilters` est supprimé) sans changer de comportement : ses options
   n'ont jamais `disabled`.
7. **`Full-Stack` est rangé dans `stack`** (arbitrage du propriétaire, 2026-10-07), et non plus
   dans `journey` : c'est une compétence technique, pas une étape de parcours. Comptes attendus
   avec les articles actuels : Stack 2, Sécurité 1, Ingénierie 0, Parcours 1, Projets 1. Dans
   l'admin, seule la position de la puce change (`AVAILABLE_BLOG_TAGS` suit l'ordre des
   catégories) ; couleur et valeur stockée sont inchangées.

## Consequences

- **Classer un tag dans le catalogue devient un acte éditorial public** : il fait entrer
  l'article dans un thème de navigation. Un tag transverse mal rangé gonfle un thème (premier cas
  corrigé : `Full-Stack`, point 7). La correction se fait dans le catalogue ou sur les tags de
  l'article, jamais dans la vue.
- Les comptes du cartouche ne s'additionnent pas au total. Le sur-titre « N articles » reste le
  seul total.
- Aucun changement d'API, de prérendu ni de SEO. Les liens `?tag=` existants continuent de
  fonctionner.
- Ajouter une catégorie ajoute un thème, un filtre et une ligne de cartouche, sans autre code.
- L'état inactif repose sur `aria-disabled`. Le texte grisé d'un composant inactif est exempté du
  critère de contraste WCAG 1.4.3 ; l'information « 0 article » reste portée par le compte, pas
  par la seule opacité.

## Alternatives considered

- **Champ `theme` (ou `themes`) sur l'article, saisi dans l'admin** : classement exact, mais
  évolution d'API, migration et saisie pour un gain nul tant que le catalogue suffit. Rejeté
  (YAGNI) ; à reconsidérer si le classement par tags devient trop bruité.
- **Thème principal unique = catégorie du premier tag** : comptes qui s'additionnent, mais
  dépend de l'ordre de saisie des tags (même fragilité que la stack de ADR-0010 §5). Rejeté.
- **Masquer un thème vide** (comme les natures de `/projects`) : contredit la demande du
  propriétaire, qui veut un vocabulaire de thèmes stable.
- **`disabled` natif** : bouton ni focusable ni annoncé (CLAUDE.md, Formulaires). Rejeté.
- **Filtre par thème dans l'URL (`?theme=`)** : le HTML prérendu (état « Tous ») divergerait de
  l'état hydraté, et cela crée des URL indexables à canoniser (audit N04). Rejeté, comme pour
  `/projects`.
- **Croiser `?tag=` et thème** : deux filtres dont les comptes ne se reflètent pas, résultat vide
  fréquent. Rejeté au profit d'un seul filtre actif.
