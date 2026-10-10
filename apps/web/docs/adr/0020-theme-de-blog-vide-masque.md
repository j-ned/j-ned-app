# ADR-0020 — Un thème de blog sans article est masqué

- **Statut** : proposé (2026-10-10, spec 019)
- **Date** : 2026-10-10
- **Contexte spec** : `specs/019-textes-et-parcours.md`
- **Remplace** : ADR-0011 §4 (« un thème sans article reste proposé, inactif »)

## Context

ADR-0011 §4 gardait les cinq thèmes visibles, un thème vide restant proposé avec `aria-disabled`
et un compte `0`. L'audit du 2026-10-10 lit ce bouton « Ingénierie 0 article » comme un cul-de-sac :
le visiteur voit une promesse sans contenu. Le propriétaire demande de masquer les thèmes vides.

## Decision

1. Le groupe de filtres de `/blog` ne propose que « Tous » et les thèmes dont le compte est `> 0`,
   dans l'ordre du catalogue (`BLOG_TAG_CATEGORIES`).
2. Le cartouche « Thèmes » ne liste que les thèmes dont le compte est `> 0`, dans le même ordre.
   Sans aucune ligne, le cartouche n'est pas rendu.
3. `FilterGroup` **garde** l'option `disabled` et son état `aria-disabled` : les filtres de l'admin
   la posent toujours (`admin-posts-view.ts`, `admin-projects-view.ts`, option sans élément). Seul le
   blog cesse de produire des options inactives.

## Consequences

- Le HTML prérendu ne montre que les thèmes réellement couverts ; un nouvel article dans un thème
  vide le fait apparaître au prochain build.
- Le compte de « Tous » reste le total ; les autres comptes ne valent jamais `0` à l'écran.
- DESIGN.md (« Liste du blog », « Groupe de filtres ») est mis à jour.

## Alternatives considered

- **Garder l'état inactif (ADR-0011 §4)** : refusé par le propriétaire (cul-de-sac visible).
- **Masquer les filtres mais garder les lignes à 0 du cartouche** : incohérent, le même « 0 article »
  reste affiché.
