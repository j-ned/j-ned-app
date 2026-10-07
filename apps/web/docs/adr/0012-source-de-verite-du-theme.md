# ADR-0012 — Source de vérité du thème clair / sombre, partagée par le site et l'admin

- **Statut** : accepté (2026-10-07, PR a de la spec 015 mergée, clôture de la spec)
- **Date** : 2026-10-07
- **Contexte spec** : `specs/015-refonte-admin.md` (constat A.4, tranche A4)

## Context

Le thème est porté par la classe `.app-dark` sur `<html>` : `styles.css` définit le registre
Console sur `:root` et le registre Ivoire sur `:root:not(.app-dark)`, et la variante Tailwind
`dark:` lit la même classe.

Faits vérifiés sur `master` (`30ef475`) :

- **Une seule écriture**, dans le `Header` public (`layout/components/header/header.ts`) : un
  `signal` initialisé depuis `localStorage['j-ned:theme']` (repli `prefers-color-scheme`), un
  `afterNextRender` et un `effect` qui posent la classe et **réécrivent la préférence résolue** dans
  le stockage dès le premier rendu (la préférence système est donc figée à la première visite).
- `App` ne rend pas le `Header` sous `/admin` (`app.ts`) et `index.html` ne pose pas la classe.
  Un rechargement direct de `/admin` s'affiche en Ivoire quelle que soit la préférence ;
  l'admin n'a aucun bouton de thème.
- **Une lecture**, `ThemeWatcher` (`shared/theme/theme-watcher.ts`, service dans `shared/`, ce que
  `CLAUDE.md` exclut) : un `MutationObserver` sur la classe, consommé par `BlogComments` (thème
  Giscus) et `AdminAnalytics` (couleurs du graphique). Il ne fait que refléter l'effet de bord du
  `Header`.
- Les pages publiques sont prérendues ; `/admin/**` est en `RenderMode.Client`. Le HTML servi ne
  porte jamais `.app-dark` : un visiteur en sombre voit l'Ivoire jusqu'à l'exécution du `Header`.
- La CSP de `index.html` autorise `script-src 'self' 'unsafe-inline'`.
- La maquette validée de l'admin propose un réglage à trois valeurs (Système, Clair, Sombre).

## Decision

1. **Un store racine, `ThemeStore`** (`core/theme/theme-store.ts`, `providedIn: 'root'`) possède
   la préférence et en dérive le thème effectif. Il est partagé par des composants non liés
   (`Header`, coque admin, Paramètres admin, `BlogComments`, graphiques) : seuil de promotion en
   store du profil atteint, suffixe `-store`.
   - `preference: Signal<ThemePreference>` avec `type ThemePreference = 'system' | 'light' | 'dark'` ;
   - `isDark: Signal<boolean>` = `resolveIsDark(preference, systemPrefersDark)` ;
   - commandes `setPreference(p)` et `toggle()` (choix explicite de l'inverse du thème effectif).
2. **Stockage inchangé** : clé `j-ned:theme`, valeurs `'dark'` / `'light'` ; `'system'` ⇔ clé
   absente. Les préférences déjà enregistrées restent valides. Le store n'écrit qu'**au choix
   explicite** de l'utilisateur ; il n'enregistre plus la valeur résolue au premier rendu.
3. **Application de la classe par le store lui-même**, dans un `effect` (navigateur seulement,
   `EffectRef` détruit au `DestroyRef`, règle `CLAUDE.md`), et **instanciation au démarrage par
   `App`** (injection dans le composant racine) : la classe est donc juste sous toutes les routes,
   `/admin` compris, indépendamment du `Header`.
4. **Préférence système réactive** : `matchMedia('(prefers-color-scheme: dark)')` alimente un
   signal mis à jour sur `change` (écouteur retiré au `DestroyRef`).
5. **Pré-peinture** : un script en ligne de quelques lignes, en tête de `index.html`, pose
   `.app-dark` avant la première peinture selon la même règle (clé absente → `matchMedia`). Il
   corrige le flash d'Ivoire sur les pages prérendues comme sur le shell CSR de l'admin. Le store
   reste la seule source de vérité **à l'exécution** ; le script n'en est que la projection
   statique, sous `try/catch` (stockage bloqué → règle système).
6. **Côté serveur** (prérendu) : ni stockage ni `matchMedia` → `isDark = true`, comme le `Header`
   et `ThemeWatcher` actuels (aucun changement du HTML prérendu hors script).
7. **`ThemeWatcher` est supprimé** ; ses consommateurs lisent `ThemeStore.isDark`. Le dossier
   `shared/theme/` disparaît.

## Consequences

- Rechargement direct de `/admin` : thème juste dès la première peinture ; bouton de thème dans
  la coque admin et réglage à trois valeurs dans Paramètres, partagés avec le site public.
- Le `Header` perd sa logique de stockage et d'application (lecture `isDark()`, appel `toggle()`).
- **Duplication assumée** de la règle de résolution entre `theme-preference.ts` (testée en
  TypeScript pur) et le script de pré-peinture (non testable en unitaire, vérifié au navigateur et
  par `grep` du HTML prérendu). Toute évolution de la clé ou des valeurs modifie les deux.
- Changement de comportement : un visiteur qui n'a jamais cliqué suit désormais sa préférence
  système même si elle change, au lieu d'être figé sur la valeur de sa première visite.
- Tout le HTML prérendu change (script en tête) : vérification en prod après déploiement.

## Alternatives considered

- **Garder l'écriture dans le `Header` et en ajouter une dans la coque admin** : deux écrivains
  du même effet de bord, désynchronisables ; la préférence système reste figée. Rejeté.
- **`ThemeWatcher` étendu en écrivain** : un service dans `shared/` (interdit), et un observateur
  de DOM qui deviendrait la source de vérité de ce qu'il observe. Rejeté.
- **Sans script de pré-peinture** : corrige `/admin` après démarrage seulement ; flash d'Ivoire à
  chaque rechargement pour un utilisateur en sombre, sur le site comme sur l'admin. Rejeté.
- **Attribut `data-theme` ou `color-scheme` seul** : changerait la variante `dark:` et toutes les
  règles `:root:not(.app-dark)` de `styles.css` pour un gain nul. Rejeté.
