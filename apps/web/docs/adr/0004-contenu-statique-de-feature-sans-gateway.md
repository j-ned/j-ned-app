# ADR-0004 — Contenu statique de feature : constante de domaine, sans gateway

- **Statut** : accepté
- **Date** : 2026-10-03
- **Contexte spec** : `specs/007-offre-site-industrie.md`

## Context

La page d'offre `/offre-site-industrie` est un contenu éditorial figé (textes, liste de livrables,
déroulé, prix, FAQ) sans API ni source de données variable. Le repo connaît deux façons de loger
du contenu statique :

1. **Feature avec gateway in-memory** (`features/home`, `features/profile`) : modèles dans
   `domain/models`, données dans `infra/data/*.static-data.ts`, `abstract class` gateway dans
   `domain/gateways`, `InMemory*Gateway` dans `infra/gateways`, câblage dans `app.config.ts`,
   lecture par `rxResource()` dans le composant. Le gateway y est justifié par une source
   distante envisagée (profil, bundle de la home) et par la règle « `application` ne dépend
   jamais d'`infra` ».
2. **Page plate** (`pages/legal-notice.ts`, `pages/privacy-policy.ts`) : texte écrit directement
   dans le template, aucune donnée typée.

Aucun des deux ne convient tel quel. Le gateway in-memory imposerait une `abstract class` à une
seule implémentation et sans seconde implémentation planifiée (contraire à la règle YAGNI du
profil : abstract seulement si 2+ implémentations), un câblage global et un passage asynchrone
(`rxResource`) pour une constante. La page plate ne permet pas de partager les prix entre le
template et le JSON-LD de la route (`app.routes.ts`), ni de découper la page en composants dumb
alimentés par `input()`.

## Decision

1. Une feature dont le contenu est **statique, sans source distante envisagée**, vit dans
   `features/<x>/` avec **deux couches seulement** : `domain/` et `application/`. Pas d'`infra/`,
   pas de gateway, pas de use case.
2. Le contenu est une **constante typée de domaine** : `features/<x>/domain/<x>.static-data.ts`,
   typée par `domain/models/<x>.model.ts` (`type` `readonly`), déclarée `as const satisfies <Type>`.
   Elle est du TypeScript pur (zéro import Angular, zéro import `@shared`), donc importable par
   `application/`, par `app.routes.ts` (données SEO) et par des scripts Node (`tsx`).
3. Les valeurs qui servent à plusieurs consommateurs (prix repris dans le JSON-LD) sont des
   constantes nommées du même fichier, jamais recopiées.
4. Le jour où une source distante apparaît (contenu éditable en admin, API), la constante migre
   vers `infra/data/` derrière un gateway, selon le modèle `features/home`. Ce passage est le
   déclencheur explicite, pas une anticipation.

## Consequences

- Le rendu est synchrone : tout le contenu est dans le HTML prérendu sans dépendre du transfer
  cache ni d'une résolution asynchrone.
- Les tests de composants consomment la constante réelle (pas de fake : le contenu statique
  n'est pas une frontière d'I/O au sens du profil).
- Une donnée identitaire transverse (SIRET, mention de TVA) reste dans `SITE_IDENTITY`
  (`@shared/identity`) : le domaine d'une feature ne l'importe pas ; le composant de page la
  transmet aux composants dumb par `input()`.
- Deux formes de « contenu statique » coexistent dans le repo (gateway in-memory pour home et
  profile, constante de domaine pour l'offre). Le critère de choix est la décision 1 : source
  distante envisagée ou non.

## Alternatives considered

- **`pages/site-offer/`** : cohérent avec les pages légales, mais `pages/` est plat et accueille
  des pages autonomes d'un seul fichier. Une page à six sous-composants, un modèle et une
  constante partagée avec le routage relève d'une feature (Screaming Architecture).
- **Gateway in-memory comme `features/home`** : rejeté, abstraction à une seule implémentation
  et asynchronisme sans objet (YAGNI).
- **Constante dans `application/`** : rejeté, `app.routes.ts` importerait un fichier de la couche
  composants pour lire un prix ; le domaine est la couche importable par tous.
