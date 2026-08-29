---
description: Lance un audit de code (intake) sur une feature ou la codebase entière, via l'agent intake-auditor
---

# AAK — Audit de code (intake)

Tu orchestres un **audit de codebase hors cycle PR** : tu résous le scope, tu prépares la spec d'intake, puis tu **délègues à l'agent `intake-auditor`** qui produit le rapport. Tu ne fais **pas** l'audit toi-même.

Ce n'est **pas** la gate de PR (revue d'un diff → agent `code-reviewer`). Ici, on audite une surface existante à la demande : « lance une revue sur telle feature / sur toute la codebase ».

## Argument

`$ARGUMENTS` = le scope souhaité :

- un **chemin feature/module** sous `src/app/` (`features/profile`, `core/auth`, `shared/ui`) → audit borné par un manifeste de périmètre figé ;
- un **token repo entier** (`.`, `repo`, « toute la codebase ») → audit du `src/` entier ;
- **vide** → demande le scope (`AskUserQuestion`) : propose les features détectées (`find src/app/features -maxdepth 1 -type d 2>/dev/null`) + l'option « repo entier ».

## Process

### 1. Résoudre le scope

- Confirme qu'on est dans un repo de l'écosystème Angular (présence d'`angular.json`). Sinon, refuse : « scope hors spécialité Angular — refusé ».
- Normalise : un chemin → `features/<x>` / `core/<x>` / `shared/ui` ; un token repo → `repo`.
- `<scope-slug>` pour le nom de fichier : remplace `/` par `-` (`features/profile` → `features-profile`) ; token repo → `repo`.

### 2. Créer la spec d'intake

- Numéro `NNN` = prochain libre dans `specs/` :
  `ls specs/ 2>/dev/null | grep -oE '^[0-9]{3}' | sort -n | tail -1` puis +1 (défaut `001`). Crée le dossier `specs/` s'il n'existe pas.
- Écris `specs/NNN-intake-audit-<scope-slug>.md` avec :
  ```
  ---
  type: intake-audit
  ---

  # Intake audit — <scope lisible>

  ## Description

  Audit d'entrée du scope **<scope>** (<repo entier | chemin feature/module>).
  Déclenché le <YYYY-MM-DD> via `/aak-audit`. Aucun diff : la portée est ce scope.
  ```
- Si le fichier d'intake pour ce scope existe déjà, **demande** avant d'écraser (proposer : écraser / annuler / nouveau numéro).

### 3. Déléguer à l'agent `intake-auditor`

- Lance l'agent `intake-auditor` (outil Task / sous-agent) avec le brief exact :
  `scope=<scope>, spec=specs/NNN-intake-audit-<scope-slug>.md`
- L'agent lit le profil-projet, audite les 10 dimensions, et **écrit lui-même** la section `## Intake audit` dans la spec. Tu ne dupliques pas son travail.

### 4. Rapport

- Relaie le récap 3 lignes de l'agent (scope, findings par sévérité, top 1 critique).
- Affiche le chemin de la spec produite (`specs/NNN-intake-audit-<scope-slug>.md`) — le rapport y vit, transmissible au client.

## Anti-patterns à éviter

- Faire l'audit toi-même au lieu de déléguer à `intake-auditor`.
- Inventer un scope que l'utilisateur n'a pas confirmé.
- Écraser silencieusement une spec d'intake existante.
- Confondre avec la gate de PR (`code-reviewer`) : ici, pas de diff, pas de verdict APPROVED/REJECTED — un rapport priorisé.
