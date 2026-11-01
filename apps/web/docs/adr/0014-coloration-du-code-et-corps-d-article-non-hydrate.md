# ADR-0014 — Coloration du code au rendu Markdown, corps d'article non hydraté

- **Statut** : accepté (2026-10-07, livré par la PR « rendu » de la spec 016)
- **Date** : 2026-10-07
- **Contexte spec** : `specs/016-editeur-articles.md` (tranches R1 à R3)
- **Prolonge** : ADR-0001 (hydratation incrémentale des `@defer` publics), ADR-0002
  (assainissement du Markdown), ADR-0013 (aperçu admin par les composants publics)

## Context

Le propriétaire veut des blocs de code colorés « comme sur Obsidian » (12 langages : TypeScript,
JavaScript, HTML, CSS, SCSS, JSON, Bash, SQL, YAML, Markdown, Dockerfile, Python), avec étiquette du
langage et bouton « Copier », calculés au prérendu, sans JavaScript ajouté pour le lecteur, en clair
et en sombre sur les tokens du site.

Faits vérifiés :

- `parseMarkdown` (marked 18 + `isomorphic-dompurify`) tourne à trois endroits : au prérendu (Node),
  dans `scripts/generate-rss.mjs` (Node), et **dans le navigateur** : `BlogDetail.renderedContent`
  est un `computed()` évalué à l'hydratation, et l'aperçu de l'admin le réévalue à chaque frappe.
  Le chunk qui porte marked et DOMPurify pèse **74,7 Ko minifiés / 24,6 Ko gzip**
  (`dist/angular-portfolio-app/browser/chunk-DdQaO-sR.js`, build du 2026-10-07) et il est chargé
  aujourd'hui par tout lecteur d'un article.
- `DOMPurify.sanitize(…, { USE_PROFILES: { html: true }, FORBID_ATTR: ['style'] })` conserve
  `class`, `tabindex`, `data-*`, `<button type="button">`, `<u>`, `<s>`, `<del>`, `width`,
  `height`, `loading`, `decoding` ; il retire `style`, `onclick` et `formaction` (essai sur le
  paquet du dépôt, `dompurify` 3.4.15).
- La CSP de production hache chaque attribut `style="…"` du HTML prérendu (`apply-csp-hashes.mjs`,
  `'unsafe-hashes'`) : une coloration à styles inline ajouterait un hachage par jeton coloré, et
  DOMPurify les retirerait de toute façon.
- Mesures (esbuild `--minify`, `gzip -9`, 12 langages, scratchpad de session) :

  | Bibliothèque | Minifié | gzip | Sortie |
  |---|---|---|---|
  | highlight.js 11.12 (`lib/core` + 12 grammaires) | 83,6 Ko | 23,3 Ko | classes `hljs-*` |
  | Prism 1.30 (+ 9 composants) | 43,2 Ko | 16,3 Ko | classes `token …` |
  | Shiki 4.5 (moteur regex JS, 12 grammaires, 1 thème) | 878,9 Ko | 144,3 Ko | `style="color:…"` |

## Decision

1. **highlight.js 11, cœur + 12 grammaires enregistrées explicitement**, appelé dans le renderer
   `code` de `parseMarkdown` (pas de `marked-highlight` : le renderer doit de toute façon émettre
   l'étiquette et le bouton). Le catalogue des langages (identifiant, alias, libellé) est une donnée
   du domaine (`features/blog/domain/code-language.ts`) ; l'infra associe une grammaire à chaque
   identifiant par un `Record<CodeLanguageId, LanguageFn>` : un langage ajouté au catalogue sans
   grammaire ne compile pas. Un langage inconnu est rendu en texte échappé, sans étiquette.
2. **La sortie reste du HTML à classes, assaini par DOMPurify** (ADR-0002 inchangé : `parseMarkdown`
   reste le seul point d'assainissement). Aucune couleur inline.
3. **Thème par tokens** : `--theme-code-{keyword,function,string,number,tag,comment}` définis dans
   les deux registres, exposés en `--color-code-*` dans `@theme`, appliqués aux classes `hljs-*` par
   un unique `@utility code-syntax` de `src/styles.css`. Exception assumée à ADR-0003 : les `span`
   produits par la bibliothèque ne peuvent pas porter d'utilitaires, d'où des sélecteurs descendants
   dans l'utility. Contrastes calculés ≥ 4,5:1 sur le fond des blocs, dans les deux registres
   (spec 016, § 3).
4. **Le corps de l'article sort de `BlogDetail` dans `BlogArticleBody`, sous
   `@defer (on immediate; hydrate never)`**, recréé par `@for (current of [p]; track current.id)`
   quand l'article change (précédent : la zone de dépôt de `AdminGalleryUploadForm`). Le prérendu
   rend le contenu (trigger `hydrate`, ADR-0001 §1) ; sur une arrivée directe, le bloc n'est jamais
   hydraté et **ni marked, ni DOMPurify, ni highlight.js ne sont téléchargés**. En navigation
   interne, le bloc est rendu côté client et charge ces trois bibliothèques à la demande.
   Exception documentée à la règle de `CLAUDE.md` « `@defer` jamais pour le contenu principal
   d'une route » : la règle protège le HTML servi et le LCP, que `hydrate never` ne touche pas.
5. **« Copier » par délégation** : le renderer émet `<button type="button" data-code-copy>` dans
   chaque bloc (option `codeCopyButton`, désactivée par défaut, donc absente du flux RSS) ; une
   directive `CodeCopy`, posée sur un ancêtre **hydraté** du corps, écoute `click`, lit le texte du
   `code` voisin et l'écrit par `navigator.clipboard.writeText`. Aucun gestionnaire inline (CSP
   inchangée) ; un clic antérieur à l'hydratation est rejoué par `withEventReplay()`.
6. **L'aperçu admin utilise le même `BlogArticleBody`** et la même directive : rendu identique au
   site, `topHeadingLevel` mis à part (ADR-0013 §3).

## Consequences

- Arrivée directe sur un article : environ **−24,6 Ko gzip** de JavaScript (le chunk marked +
  DOMPurify n'est plus chargé) au lieu de +23,3 Ko si la coloration restait dans `BlogDetail`.
  Navigation interne vers un article : environ +23,3 Ko gzip, chargés à la demande.
- Le chunk de l'admin grossit d'environ 23,3 Ko gzip (aperçu en direct coloré).
- Un bloc `hydrate never` ne reçoit plus les changements d'entrée : toute donnée du corps doit
  passer par la recréation du bloc (`@for … track id`), jamais par une mise à jour en place.
- Le flux RSS porte les `span class="hljs-*"` (inoffensifs, sans style chez les agrégateurs) et ni
  bouton ni script.
- Les tests de composant qui lisent le corps passent en `DeferBlockBehavior.Playthrough` ; le
  comportement « jamais hydraté » ne se prouve qu'au navigateur (requêtes réseau d'une arrivée
  directe).
- `DESIGN.md` reçoit une exception bornée à la One Indigo Rule : la coloration syntaxique, et elle
  seule, utilise plusieurs teintes (spec 016, arbitrage B).

## Alternatives considered

- **Shiki** : rendu de qualité VS Code, mais 6 fois plus lourd (144 Ko gzip dans l'admin et en
  navigation interne) et sortie à styles inline, retirés par DOMPurify et incompatibles avec la
  CSP hachée ; `transformerStyleToClass` génère sa feuille à l'exécution, sans lien avec les
  tokens `@theme`. Rejeté.
- **Prism** : 7 Ko gzip de moins, mais modèle à global mutable (`Prism.languages`, composants à
  effet de bord), pas d'export ESM par langage, projet en maintenance sans v2. Rejeté pour la
  maintenance et l'isolation au prérendu.
- **Colorer côté client au chargement de la page** : contraire à la demande (JavaScript lecteur)
  et décalage visuel à l'hydratation. Rejeté.
- **Garder le corps dans `BlogDetail`** : +23,3 Ko gzip pour chaque lecteur. Rejeté.
- **`hydrate on viewport` sur le corps** : charge marked, DOMPurify et highlight.js dès que
  l'article est visible, c'est-à-dire toujours. Rejeté.
- **Bouton « Copier » sans JavaScript** : impossible, le presse-papiers n'est accessible que par
  script. Un `<details>` « Voir le code brut » ne copie rien. Rejeté.
- **Un composant Angular par bloc de code** : le corps est du HTML injecté et non hydraté ; il ne
  peut pas contenir de composants. Rejeté.
