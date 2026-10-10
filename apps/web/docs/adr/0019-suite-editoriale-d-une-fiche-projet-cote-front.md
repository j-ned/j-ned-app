# ADR-0019 — Suite éditoriale d'une fiche projet portée par le front

- **Statut** : proposé (2026-10-10, spec 019)
- **Date** : 2026-10-10
- **Contexte spec** : `specs/019-textes-et-parcours.md`
- **Nuance** : ADR-0010 (champs éditoriaux d'un projet servis par l'API)

## Context

L'audit du 2026-10-10 relève deux manques sur `/projects/:slug` :

1. la fiche commence par la description technique, sans dire **quel besoin** le projet règle ni
   **pour qui** (DashFlow et CandiDash sont d'usage personnel, sans chiffre d'utilisateurs) ;
2. la fiche finit en cul-de-sac : ni offre liée, ni entrée pour un recruteur.

ADR-0010 a placé les textes éditoriaux d'un projet (`pitch`, `highlight`, `scope`) **dans l'API**,
saisis dans l'admin. Ajouter un champ « problème → résultat » suivrait ce précédent, mais demande
une PR API, une migration, l'adaptation du formulaire admin et l'ordre de déploiement API puis front
(CLAUDE.md, workflow §10). Le propriétaire préfère ne pas faire évoluer l'API pour cette PR.

Faits vérifiés (GET `https://api.nedellec-julien.fr/api/projects`, 2026-10-10) : six projets,
slugs `dashflow`, `candidash` (`production`), `le-vieux-comptoir`, `coaching-life` (`demo`),
`labelsync-pro`, `gitpush-auto` (`script`). Le `pitch` existant décrit ce qu'est le projet, pas le
besoin qu'il règle ; il sert d'accroche sur `/projects` et doit y rester tel quel.

## Decision

1. **La phrase « problème → résultat » et la mention d'usage vivent dans le front**, en contenu
   statique de domaine (`features/projects/domain/project-outcomes.static-data.ts`), indexées par
   slug. Même logique que ADR-0004 (contenu statique de feature sans gateway) : texte validé par le
   propriétaire, publié au build, aucune saisie admin.
2. **Absence = rien.** Un slug sans entrée n'affiche ni phrase ni mention. Le front n'invente jamais
   de texte de remplacement (ADR-0010 §4). Seuls DashFlow et CandiDash reçoivent une entrée dans
   cette PR.
3. **L'usage est une union fermée** (`ProjectUsage = 'personal'`) dont le libellé est porté par une
   table de libellés : seule une valeur validée par le propriétaire peut être publiée, et en ajouter
   une est une décision visible dans le type.
4. **L'offre liée se dérive de la nature** (`kind`) par une table exhaustive
   `Record<ProjectKind, OfferSlug | null>` : elle vaut pour tout projet présent et futur, sans
   entrée par slug. `null` (et un projet sans nature) renvoie au catalogue `/offres`.

## Consequences

- Couplage par slug : si un slug change dans l'admin, la phrase disparaît sans erreur (règle 2).
  Le renommage d'un slug casse déjà les URL indexées ; on l'accepte au même titre.
- Modifier une phrase demande un commit front et un déploiement. C'est déjà le cas pour les champs
  API, puisque le HTML des fiches est prérendu (ADR-0010, Consequences).
- **Seuil de migration** : si plus de la moitié des projets reçoit une entrée, ou si le propriétaire
  veut éditer ces textes depuis l'admin, on les déplace en colonnes API (`outcome`, `usage`) selon
  ADR-0010, et ce fichier disparaît.

## Alternatives considered

- **Colonnes API `outcome` / `usage`** : cohérent avec ADR-0010, écarté pour cette PR (évolution
  d'API non souhaitée, deux entrées seulement). Reste la cible au-delà du seuil.
- **Réécrire `pitch` dans l'admin** : zéro code, mais change l'accroche des cartes de `/projects`
  et mélange deux intentions (ce qu'est le projet / ce qu'il règle) dans un champ de 160 caractères.
- **Offre liée par slug** : plus précise, mais exige une entrée par projet ; la nature suffit
  (les deux démos sont déjà les exemples de l'offre site vitrine).
