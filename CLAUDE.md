# j-ned-app (monorepo pnpm)

- `apps/web` : front Angular. Conventions dans `apps/web/.claude/CLAUDE.md`.
- `apps/api` : API Hono. Conventions dans `apps/api/README.md`.

La branche par défaut est `master` (il n'y a pas de `main`).

## Agents AAK (plugin `angular-team`) dans ce monorepo

Les agents supposent un dépôt Angular à la racine. Ici le front vit dans `apps/web`, donc tout brief
d'agent AAK précise ces trois points :

- **Profil-projet** : `apps/web/.claude/project-profile.md` (et non `.claude/project-profile.md`).
- **Diff de branche** : `git diff master...HEAD` (et non `main...HEAD`).
- **Gates** (`pnpm test`, `pnpm lint`, `pnpm build`) : à lancer depuis `apps/web`.

Le checker mécanique se lance **depuis la racine**, avec la racine de source du front :

```bash
apps/web/.claude/checks/aak-checks.sh --diff master...HEAD --src apps/web/src --zoneless
```

Lancé depuis `apps/web`, il ne voit aucun fichier du diff et rend « aucun hit » : `git diff` rend des
chemins relatifs à la racine. Vérifier que la ligne `mode : diff … N fichier(s) .ts` annonce un `N`
cohérent avec le diff.

`apps/web/.claude/checks/` est ignoré par git (code AAK sous licence, dépôt public). Absent d'un
clone neuf, il se recopie depuis le plugin installé :

```bash
cp -rp ~/.claude/plugins/cache/aak/angular-team/<version>/checks apps/web/.claude/checks
```
