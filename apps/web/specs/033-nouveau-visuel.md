---
id: 033
title: Nouveau visuel, plus amical et passionné
type: refactor
status: draft
created: 2026-10-21
related: [DESIGN.md, PRODUCT.md, src/styles.css, specs/029-repositionnement-portfolio-passion.md, specs/031-ton-amical.md, specs/032-atelier.md, docs/adr/0003-utility-tailwind-et-apply.md, docs/adr/0006-polices-auto-hebergees.md, docs/adr/0012-source-de-verite-du-theme.md, docs/adr/0017-bouton-en-directive-d-attribut.md, docs/adr/0025-audit-axe-en-navigateur-reel-contre-l-image-de-ci.md]
---

# 033 — Nouveau visuel, plus amical et passionné

## Description

### Objectif

Demande du propriétaire (2026-10-21) : un visuel **moins professionnel, plus amical et passionné**.
Le système actuel (`DESIGN.md`, « The Production Console » : sombre comme un terminal
d'observabilité, Signal Indigo, densité de dashboard SRE) a été pensé pour un recruteur senior et
des clients. Depuis la spec 029 le site est un portfolio personnel non commercial, et depuis la
spec 031 il parle au tutoiement : l'ambiance « console de production » ne colle plus à la voix.
Le nouveau visuel doit donner envie, sentir le plaisir de fabriquer (au tour comme au clavier),
sans rien perdre en lisibilité, en accessibilité ni en performance.

### Arbitrages (2026-10-21)

Trois directions ont été montrées en maquette (clair et sombre) : A « Atelier chaleureux »
(papier, graphite, laiton), B « Carnet de bord » (papier quadrillé, encre bleue, surligneur,
annotations manuscrites), C « Copeaux vifs » (couleurs franches, formes rondes, autocollants),
plus l'option « garder l'actuel, adouci ». Julien a d'abord retenu A, puis a changé d'avis.

1. **Direction retenue : C, « Copeaux vifs ».** Couleurs franches (orange copeau sur sable en clair,
   sur bleu nuit en sombre), formes rondes, petites pastilles et autocollants. C'est la direction la
   plus éloignée de l'actuel et la plus ludique.
2. **On garde le cartouche et les cotes** (`shared/ui/cartouche.ts`, `shared/ui/dimension-line.ts`)
   comme clin d'œil au métier, restylés dans la nouvelle direction (coins arrondis, trait plus
   épais), avec les mêmes règles d'usage (au plus un cartouche décoratif par écran, cote décorative
   qui répète une information écrite). Le tampon (`stamp.ts`) devient un autocollant.
3. **L'indigo n'est plus imposé.** L'accent devient l'orange copeau ; la One Indigo Rule devient une
   règle d'accent unique (« One Orange Rule »), les couleurs des autocollants étant une exception
   bornée (exigence 4).
4. **Typographie** : **Bricolage Grotesque** pour les titres, à la place d'Archivo ; **JN Sans** et
   **JN Mono** conservées pour le texte et les données (arbitrage complémentaire du 2026-10-21,
   exigence 7).
5. **Thème au premier chargement : suivre le système** (préférence `prefers-color-scheme`), comme
   aujourd'hui (script d'`index.html`, `ThemeStore`, ADR-0012). Les deux thèmes restent égaux
   (Two Registers Rule conservée).
6. **Fantaisie retenue** (confirmée pour C) : au plus **un autocollant décoratif par écran**, le texte et le code restent
   prioritaires. **Pas de police manuscrite.**

### Direction C en détail

| | Clair « Sable » | Sombre « Nuit » |
|---|---|---|
| Fond | `oklch(97% 0.015 70)` `#fcf4eb`, sable | `oklch(22% 0.03 265)` `#141a29`, bleu nuit |
| Surface (carte) | `oklch(100% 0 0)` `#ffffff` | `oklch(27% 0.035 265)` `#1e2638` |
| Texte | `oklch(24% 0.03 265)` `#181f2e`, bleu nuit | `oklch(96% 0.01 70)` `#f6f1eb`, crème |
| Texte secondaire | `oklch(45% 0.03 265)` `#4d5566` | `oklch(78% 0.02 265)` `#b1b7c5` |
| Accent texte (liens, focus, accent du `h1`) | `oklch(53% 0.18 40)` `#bc3700`, orange brûlé | `oklch(76% 0.15 55)` `#f99549`, orange copeau |
| Accent plein (bouton primaire) | `oklch(68% 0.18 48)` `#ed6e12`, texte bleu nuit | `oklch(76% 0.15 55)` `#f99549`, texte couleur du fond |
| Autocollant sauge (fond / texte) | `#b9eec2` / `#174825` | `#235430` / `#d5f5da` |
| Autocollant lavande (fond / texte) | `#d1e2ff` / `#233971` | `#2d416d` / `#d8e5ff` |
| Succès / avertissement / erreur | `#067132` / `#974d00` / `#b71824` | `#67d283` / `#eec05b` / `#f97676` |

Contrastes calculés (WCAG 2.x, OKLCH converti en sRGB, gamut borné, mélanges `color-mix` en sRGB) :

| Paire | Clair, sur fond / sur surface | Sombre, sur fond / sur surface |
|---|---|---|
| Texte | 15,08 / 16,47 | 15,42 / 13,43 |
| Texte secondaire | 6,82 / 7,45 | 8,66 / 7,54 |
| Accent texte | 5,23 / 5,72 | 7,74 / 6,74 |
| Succès | 5,64 / 6,16 | 9,17 / 7,99 |
| Avertissement | 5,71 / 6,23 | 10,20 / 8,88 |
| Erreur | 6,07 / 6,63 | 6,51 / 5,67 |
| Texte du bouton primaire sur l'accent plein | 5,36 | 7,74 |
| Texte d'autocollant sur son fond (sauge / lavande) | 8,00 / 8,40 | 7,57 / 7,96 |

- **Traits** (mélange `foreground` / fond, même mécanique qu'aujourd'hui) : en clair, 12 % donne
  1,27:1 et 28 % 1,80:1 (décoratifs) ; un bord de champ doit être à **≥ 50 %** (3,17:1 fond,
  3,24:1 surface). En sombre, 12 % donne 1,39:1, 28 % 2,38:1 ; le bord de champ à **38 %** donne
  3,30:1 fond, 3,19:1 surface. Les cartes à bord plein `foreground` 2 px (maquette) sont très au-delà
  de 3:1.
- **Bouton primaire clair** : l'aplat orange a 2,81:1 contre le sable. Acceptable (le texte du
  bouton identifie le contrôle, WCAG 1.4.11 n'exige pas de bordure), mais un bouton qui ne porte
  qu'une icône doit avoir un trait ≥ 3:1.
- **Orange et rouge d'erreur** sont proches en teinte : une erreur n'est jamais signalée par la seule
  couleur (icône et texte, comme aujourd'hui), et l'orange n'est jamais utilisé pour un état.
- **Formes** : rayons 16 px (cartes), 22 px (grands blocs), pilule pour les boutons, les entrées de
  navigation actives et les autocollants ; champs de formulaire 12 px. Cartouche et tampon gardent
  un rayon plus petit (8 px) pour rester lisibles comme « pièce technique ».
- **Autocollants** : pastilles pilule courtes (4 mots au plus), éventuellement inclinées de 3° au
  plus ; jamais un lien, un bouton ou un paragraphe incliné.
- **Matière** : aplats francs, bords pleins de 2 px sur les cartes, pas de dégradé, pas d'ombre
  décorative (Flat-By-Default conservée), pas de flou (No-Glass conservée).
- **Ambiance** : un atelier coloré et accueillant, des copeaux qui volent, pas une salle de contrôle.
  Le mono reste pour les données (cotes, références, code), beaucoup moins de libellés en majuscules
  mono dans les pages publiques.

### Exigences

1. **`DESIGN.md` réécrit** pour la direction C : nouvelle étoile du nord, front matter (couleurs,
   typographie, rayons, composants), palettes des deux thèmes avec contrastes calculés, règles
   nommées mises à jour (One Orange Rule à la place de One Indigo Rule ; Two Registers, Decorative
   Line, Flat-By-Default, No-Glass conservées ; règle des autocollants), Do's and Don'ts relus. Plus
   aucune mention de recruteur, de SRE ni de « signal de séniorité ».
2. **`PRODUCT.md`**, principe de design 3 (« l'identité indigo […] reste le socle ») et « Soigné » :
   réécrits pour la nouvelle direction. Modification faite **après** le merge de la PR 1 de la
   spec 031, qui réécrit ce fichier.
3. **Tokens dans `src/styles.css`** (`@theme`, variables `--theme-*` des deux thèmes), en OKLCH,
   sans nouvelle couleur en dur dans les composants. Un token `--color-on-primary` remplace les
   `text-white` posés sur `bg-primary-bg` (5 occurrences aujourd'hui, dont `blog-tag-palette.ts`) :
   sur l'orange, le texte est sombre.
3. **Couleurs d'autocollant** (sauge, lavande, et au plus une troisième) : tokens dédiés, réservés aux
   autocollants et pastilles de catégorie. Elles ne portent jamais seules une information (le texte
   de la pastille la porte) et ne servent ni aux liens, ni aux boutons, ni aux états.
5. **Coloration syntaxique** des blocs de code re-dérivée de la nouvelle palette (six teintes,
   exception bornée maintenue), chaque teinte ≥ 4,5:1 sur le fond de bloc dans les deux thèmes.
6. **Identité hors CSS** : `favicon.svg` (aujourd'hui un dégradé bleu/violet, contraire à la règle
   « pas de gradient décoratif »), `<meta name="theme-color">` (`#000000` en dur, à décliner clair et
   sombre avec `media`), images Open Graph si elles portent l'ancienne palette, sprite d'icônes si
   des couleurs y sont figées.
7. **Typographie** : Bricolage Grotesque (variable, licence OFL) pour les titres à la place
   d'Archivo ; JN Sans et JN Mono conservées sans changement pour le texte et les données. Les axes
   de Bricolage (`opsz`, `wdth`, `wght`) sont réduits aux valeurs employées, la largeur et l'œil
   optique fixés au plan technique. Toujours **trois familles au plus**, **auto-hébergées** (`public/fonts/`, ADR-0006) : sous-ensemble latin,
   axes réduits aux valeurs employées, nom de fichier versionné (cache `immutable`), face de repli
   métriquement ajustée pour ne pas décaler la mise en page, seule la police du `<h1>` (élément LCP)
   préchargée, CSP `font-src 'self'` inchangée. Une police modifiée ne garde pas un nom réservé de sa
   licence (cas de « Plex », ADR-0006).
8. **Tailwind v4 CSS-first** : tokens dans `@theme`, `@utility` seulement selon ADR-0003, boutons par
   la directive `appButton` (ADR-0017, variante pilule), autocollant en composant `shared/ui/`
   (structure réutilisée), aucune classe CSS ad hoc ni `@apply` hors `@utility`, aucun fichier de
   style de composant.
9. **Accessibilité** : WCAG 2.2 AA strict dans **les deux thèmes**, contrastes calculés et inscrits
   dans `DESIGN.md` ; job CI `a11y` (axe, ADR-0025) à **zéro violation** ; focus visible ≥ 3:1 sur
   fond et surface, qui suit le rayon de l'élément ; aucune information portée par la seule
   couleur ; rendu correct en `forced-colors` (un autocollant garde un contour) ; cibles tactiles
   ≥ 44 × 44 px malgré les pilules.
10. **Mouvement** : aucune animation nouvelle obligatoire ; toute animation décorative ≤ 400 ms,
    désactivée sous `prefers-reduced-motion: reduce`. L'inclinaison d'un autocollant est statique.
11. **Performance** : pas de régression Lighthouse (> 95 partout, mesuré avant/après sur l'accueil,
    la liste du blog, un article, les réalisations, une fiche et le parcours), **CLS inchangé**
    (0 sur les pages mesurées), poids des polices préchargées égal ou inférieur à aujourd'hui, aucune
    image décorative ajoutée.
12. **Anti-références de `PRODUCT.md`** tenues : la direction ludique ne doit pas glisser vers le
    template portfolio générique (hero centré « Hi, I'm », barres de compétences, nuage de logos de
    technologies en autocollants), ni vers l'over-design (curseur custom, scroll-jacking, intro
    animée, autocollants partout) ; glassmorphism toujours exclu.
13. **Admin** : suit les tokens (il les partage), sans refonte de ses gabarits ; il doit rester
    lisible et conforme AA dans les deux thèmes.

### Constat (2026-10-21, `master` `5af4b88`)

- `DESIGN.md` : « Creative North Star: The Production Console », sombre « comme un terminal
  d'observabilité à 2h du matin », « le recruteur senior y lit la même précision instrumentale »,
  focus décrit comme « un signal de séniorité technique ». Règles One Indigo, Two Registers,
  Decorative Line, Glassmorphism Containment, Flat-By-Default, Three Families, Single-Display,
  Indigo Accent.
- `src/styles.css` : thème sombre sur `:root` (neutral-950, indigo-400/600, violet-400), thème clair
  sur `:root:not(.app-dark)` (ivoire `#faf7f2`, stone-800, indigo-700). Six teintes de code, statuts,
  traits `line` / `line-strong` / `field` en `color-mix`.
- Polices (`public/fonts/`) : Archivo 2.001 (`wdth` 100–110, `wght` 600–800, préchargée), JN Sans
  3.201 (romain et italique), JN Mono 2.3 (500).
- Boutons (`shared/ui/button.ts`) : `rounded-md` par défaut, `rounded-full` en option.
- Indigo en dur hors `styles.css` : seulement dans des tests (`blog-tag-palette.spec.ts`,
  `analytics-presenter.spec.ts`, `admin-overview.spec.ts`) ; `text-white` sur `bg-primary-bg` à cinq
  endroits.
- `public/favicon.svg` : dégradé `#2563eb` → `#a78bfa`. `index.html` : `theme-color` `#000000`.
- Usages : `font-display` dans 15 fichiers de `src/app`, `font-mono` dans 51, `uppercase` dans 11.
- `PRODUCT.md` (version de la branche `feat/031-ton-amical`) garde au principe 3 « l'identité
  indigo + clair/sombre + Tailwind v4 reste le socle ».

### Découpage en PR

**L'implémentation attend le merge de la PR de textes de la spec 031** (PR 2 de son découpage) : les
deux touchent les mêmes gabarits publics, et la PR 1 de la spec 031 réécrit `PRODUCT.md`.

| # | Dépôt | Périmètre | Dépend de |
|---|---|---|---|
| 1 | front | cette spec | — |
| 2 | front | plan technique (`architect`) : tokens, sous-ensemble de Bricolage Grotesque, fichiers touchés, ADR (accent unique orange et couleurs d'autocollant, police de titres) | 1 |
| 3 | front | `DESIGN.md` et `PRODUCT.md` (principe 3) réécrits | 2, spec 031 PR 1 mergée |
| 4 | front | tokens des deux thèmes, `on-primary`, couleurs d'autocollant, coloration syntaxique, `favicon.svg`, `theme-color` | 3, spec 031 PR 2 mergée |
| 5 | front | Bricolage Grotesque auto-hébergée (fichier, `@font-face`, repli ajusté, preload), Archivo retirée | 4 |
| 6 | front | formes et composants signature (boutons pilule, cartes, autocollant, cartouche, cote) et ajustements de gabarits publics | 5 |

Chaque PR passe les gates du Dockerfile, le job `a11y` et une mesure Lighthouse avant/après
(PR 4 à 6). Les PR 4 à 6 se suivent : elles touchent les mêmes fichiers.

### Hors périmètre

- Les textes (spec 031) et le contenu de l'atelier (spec 032) : cette spec ne change que le visuel.
- Une refonte des gabarits de l'admin.
- Toute police servie par un CDN, toute image décorative, toute animation d'intro.
- Les directions A (atelier chaleureux) et B (carnet de bord), écartées le 2026-10-21.

### Arbitrages complémentaires (2026-10-21)

1. **Typographie** : Bricolage Grotesque pour les titres ; JN Sans et JN Mono gardées.
2. **Fantaisie** : un autocollant décoratif par écran, confirmé pour la direction C.
3. **Nom dans l'en-tête** : « Julien Nédellec » reste (marque de `PRODUCT.md`) ; la forme courte
   « julien. » de la maquette est écartée.

### Questions ouvertes

1. **Couleurs d'autocollant** : sauge et lavande suffisent-elles, ou une troisième (jaune, rose) ?
2. **Image Open Graph** : à redessiner dans la nouvelle palette, ou à garder telle quelle ?
