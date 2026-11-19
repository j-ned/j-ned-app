# Skills — Base de connaissances Claude

Ce dossier contient les documents de référence, cours, tips et docs
que Claude peut consulter pour fournir des réponses contextualisées.

## Structure

```
skills/
├── typescript/         # Tips TS, utility types, patterns avancés, strict mode
├── tailwind/           # Config v4, plugins, patterns UI
├── vitest/             # Config, mocking, testing patterns
├── css/                # Tips CSS, layouts, animations
├── html/               # HTML sémantique, ARIA, formulaires
```

## Comment alimenter ce dossier

Déposer les fichiers dans le sous-dossier correspondant à la techno :
- `.md` pour les notes et résumés
- `.pdf` pour les cours et docs officielles
- `.ts` / `.sql` pour les snippets de référence
- Tout autre format pertinent

Claude consultera automatiquement ce dossier quand une question
touche à une technologie documentée ici.

Angular n'a pas de sous-dossier ici : la référence est la doc officielle (https://angular.dev),
les skills AAK du plugin `angular-team` et la section Angular de `.claude/CLAUDE.md`.
