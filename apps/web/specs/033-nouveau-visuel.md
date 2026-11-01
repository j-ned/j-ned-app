---
id: 033
title: Nouveau visuel, plus amical et passionné
type: refactor
status: draft
created: 2026-10-21
related: [DESIGN.md, PRODUCT.md, src/styles.css, specs/029-repositionnement-portfolio-passion.md, specs/031-ton-amical.md, specs/032-atelier.md, docs/adr/0003-utility-tailwind-et-apply.md, docs/adr/0006-polices-auto-hebergees.md, docs/adr/0012-source-de-verite-du-theme.md, docs/adr/0017-bouton-en-directive-d-attribut.md, docs/adr/0025-audit-axe-en-navigateur-reel-contre-l-image-de-ci.md, docs/adr/0030-accent-unique-orange-et-couleurs-d-autocollant.md, docs/adr/0031-police-de-titres-bricolage-grotesque.md]
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
   exigence 8).
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
4. **Couleurs d'autocollant** : **deux seulement**, sauge et lavande ; tokens dédiés, réservés aux
   autocollants et pastilles de catégorie. Elles ne portent jamais seules une information (le texte
   de la pastille la porte) et ne servent ni aux liens, ni aux boutons, ni aux états.
5. **Coloration syntaxique** des blocs de code re-dérivée de la nouvelle palette (six teintes,
   exception bornée maintenue), chaque teinte ≥ 4,5:1 sur le fond de bloc dans les deux thèmes.
6. **Identité hors CSS** : `favicon.svg` (aujourd'hui un dégradé bleu/violet, contraire à la règle
   « pas de gradient décoratif »), `<meta name="theme-color">` (`#000000` en dur, à décliner clair et
   sombre avec `media`), sprite d'icônes si des couleurs y sont figées.
7. **Image Open Graph redessinée** : aujourd'hui `og:image` (défaut d'`index.html`, et `core/seo/seo.ts`
   quand une page n'en fournit pas) pointe sur `avatar.png`, la photo de profil. Une carte de partage
   1200 × 630 dans la nouvelle direction la remplace par défaut (nom, accroche, palette Sable ou
   Nuit, un autocollant au plus), image statique versionnée (ADR-0007) avec son `og:image:alt`.
   Les pages qui fournissent leur propre visuel (articles, fiches projet) le gardent.
8. **Typographie** : Bricolage Grotesque (variable, licence OFL) pour les titres à la place
   d'Archivo ; JN Sans et JN Mono conservées sans changement pour le texte et les données. La
   largeur et l'œil optique de Bricolage sont fixés au plan technique. Toujours **trois familles au
   plus**, **auto-hébergées** (`public/fonts/`, ADR-0006) : sous-ensemble latin, axes (`opsz`,
   `wdth`, `wght`) réduits aux valeurs employées, nom de fichier versionné (cache `immutable`), face de repli
   métriquement ajustée pour ne pas décaler la mise en page, seule la police du `<h1>` (élément LCP)
   préchargée, CSP `font-src 'self'` inchangée. Une police modifiée ne garde pas un nom réservé de sa
   licence (cas de « Plex », ADR-0006).
9. **Tailwind v4 CSS-first** : tokens dans `@theme`, `@utility` seulement selon ADR-0003, boutons par
   la directive `appButton` (ADR-0017, variante pilule), autocollant en composant `shared/ui/`
   (structure réutilisée), aucune classe CSS ad hoc ni `@apply` hors `@utility`, aucun fichier de
   style de composant.
10. **Accessibilité** : WCAG 2.2 AA strict dans **les deux thèmes**, contrastes calculés et inscrits
   dans `DESIGN.md` ; job CI `a11y` (axe, ADR-0025) à **zéro violation** ; focus visible ≥ 3:1 sur
   fond et surface, qui suit le rayon de l'élément ; aucune information portée par la seule
   couleur ; rendu correct en `forced-colors` (un autocollant garde un contour) ; cibles tactiles
   ≥ 44 × 44 px malgré les pilules.
11. **Mouvement** : aucune animation nouvelle obligatoire ; toute animation décorative ≤ 400 ms,
    désactivée sous `prefers-reduced-motion: reduce`. L'inclinaison d'un autocollant est statique.
12. **Performance** : pas de régression Lighthouse (> 95 partout, mesuré avant/après sur l'accueil,
    la liste du blog, un article, les réalisations, une fiche et le parcours), **CLS inchangé**
    (0 sur les pages mesurées), poids des polices préchargées égal ou inférieur à aujourd'hui, aucune
    image décorative ajoutée.
13. **Anti-références de `PRODUCT.md`** tenues : la direction ludique ne doit pas glisser vers le
    template portfolio générique (hero centré « Hi, I'm », barres de compétences, nuage de logos de
    technologies en autocollants), ni vers l'over-design (curseur custom, scroll-jacking, intro
    animée, autocollants partout) ; glassmorphism toujours exclu.
14. **Admin** : suit les tokens (il les partage), sans refonte de ses gabarits ; il doit rester
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
| 4 | front | tokens des deux thèmes, `on-primary`, couleurs d'autocollant, coloration syntaxique, `favicon.svg`, `theme-color`, image Open Graph par défaut | 3, spec 031 PR 2 mergée |
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
4. **Autocollants** : deux couleurs, sauge et lavande, pas de troisième.
5. **Image Open Graph** : redessinée dans la nouvelle direction (exigence 7).

### Questions ouvertes

Aucune : toutes tranchées le 2026-10-21. Les choix de goût issus du plan technique sont listés à la
fin de celui-ci (« Décisions à arbitrer par le propriétaire »).

## Plan technique

Rédigé le 2026-10-21 sur `master` `175b78e`. Couvre les PR 3 à 6 du découpage ; la PR 6 est scindée en
**6a** (composants signature, carte Open Graph) et **6b** (gabarits publics), pour garder deux diffs
relisibles. Les deux questions ouvertes sont tranchées par le propriétaire (2026-10-21) : **deux**
couleurs d'autocollant (sauge, lavande), **image Open Graph par défaut redessinée**.

### Décisions structurantes

- **ADR-0030** (`docs/adr/0030-accent-unique-orange-et-couleurs-d-autocollant.md`) : One Orange Rule,
  `on-primary` et `on-status-success`, teinte d'accent sous texte d'accent ≤ 8 %, couleurs d'autocollant
  bornées par un type fermé, coloration syntaxique re-dérivée, **tous les tokens dans le gamut sRGB**.
- **ADR-0031** (`docs/adr/0031-police-de-titres-bricolage-grotesque.md`, amende ADR-0006) : Bricolage
  Grotesque 1.001, `opsz` 48 et `wdth` 100 fixés, `wght` 600–800, 37 460 octets, repli ajusté.
- Pas d'ADR pour la carte Open Graph : application de la décision 1 d'ADR-0007 (nom versionné).

### Architecture

- **Aucune couche domaine ni infra nouvelle**, aucun état nouveau. Couches touchées : `src/styles.css`
  (tokens, `@font-face`, `@utility`), `shared/ui/` (bouton, autocollant, tampon, cartouche, cote, carte de
  lien, toast), gabarits publics, `src/index.html`, `core/seo/seo.ts` et `shared/seo/share-image.ts`,
  `public/` (police, favicon, carte de partage), `ci.yml`.
- **Thème** : `ThemeStore` et le script de pré-peinture (ADR-0012) ne changent pas. Les graphiques de
  l'admin lisent `--theme-primary-text` (`chart-palette.ts`) : ils passent à l'orange sans code.
- **Landmarks** : inchangés (en-tête et pied de page restent possédés par la coque).
- **Presenter** : aucun. L'autocollant est purement présentationnel (entrées → classes, sur le
  précédent de la directive `Button`).
- **Contrainte structurelle encodée dans les types** : la liste des couleurs d'autocollant
  (`StickerTone`) et l'inclinaison bornée (`StickerTilt`, 2° au plus) sont des unions fermées ; aucune
  entrée ne prend un angle ou une couleur libre.

### Tokens des deux thèmes (PR 4)

Tous les tokens sont dans le gamut sRGB (ADR-0030, décision 6). Hex = rendu 8 bits.
`--theme-on-*` et les traits restent des références (`var()` / `color-mix`), comme aujourd'hui.

| Token `--theme-*` | Clair « Sable » (`:root:not(.app-dark)`) | Sombre « Nuit » (`:root`) |
|---|---|---|
| `background` | `oklch(97% 0.015 70)` `#fcf4eb` | `oklch(22% 0.03 265)` `#141a29` |
| `surface` | `oklch(100% 0 0)` `#ffffff` | `oklch(27% 0.035 265)` `#1e2638` (opaque, plus de `rgba`) |
| `surface-elevated` | `oklch(98.5% 0.01 70)` `#fff9f3` | `oklch(31% 0.04 265)` `#263045` |
| `foreground` | `oklch(24% 0.03 265)` `#181f2e` | `oklch(96% 0.01 70)` `#f6f1eb` |
| `muted` | `oklch(45% 0.03 265)` `#4d5566` | `oklch(78% 0.02 265)` `#b1b7c5` |
| `primary-text` | `oklch(53.2% 0.178 37)` `#bc3700` | `oklch(76% 0.15 55)` `#f99549` |
| `primary-bg` | `oklch(68% 0.18 48)` `#ed6e12` | `oklch(76% 0.15 55)` `#f99549` |
| `on-primary` (nouveau) | `var(--theme-foreground)` | `var(--theme-background)` |
| `status-success` | `oklch(48% 0.13 150)` `#067132` | `oklch(78% 0.15 150)` `#67d283` |
| `status-warn` | `oklch(50.2% 0.122 56)` `#974e02` | `oklch(83% 0.13 85)` `#eec05b` |
| `status-error` | `oklch(50% 0.19 25)` `#b71824` | `oklch(72% 0.161 22)` `#f97676` |
| `on-status-success` (nouveau) | `oklch(100% 0 0)` | `var(--theme-background)` |
| `on-status-error` | `oklch(100% 0 0)` | `var(--theme-background)` |
| `field` | `foreground` 50 % | `foreground` 38 % |
| `line` / `line-strong` | `foreground` 12 % / 28 % | `foreground` 12 % / 28 % (au lieu de 9 / 22) |
| `nav-border` | `var(--theme-line)` | `var(--theme-line)` |
| `nav-shadow` | formule actuelle, teinte `var(--theme-foreground)` | `0 1px 0` `foreground` 6 % |
| `sticker-sage` / `on-sticker-sage` (nouveaux) | `oklch(90.1% 0.081 150)` `#b9eec2` / `oklch(35.8% 0.079 150)` `#174825` | `oklch(40% 0.08 150)` `#235430` / `oklch(94% 0.049 150)` `#d5f5da` |
| `sticker-lavender` / `on-sticker-lavender` (nouveaux) | `oklch(91% 0.043 261)` `#d1e2ff` / `oklch(36% 0.1 265)` `#233971` | `oklch(38.1% 0.079 264)` `#2d416d` / `oklch(92% 0.038 264)` `#d8e5ff` |
| `accent` | **supprimé** (aucun consommateur) | **supprimé** |

Écarts à la `## Description`, tous deux sous le seuil de rendu visible : l'accent texte clair
`oklch(53% 0.18 40)` est hors gamut (son `#bc3700` vient d'un rognage) et devient `oklch(53.2% 0.178 37)`,
même hex ; l'avertissement clair passe de `#974d00` (hors gamut à l'arrondi) à `#974e02`.

**`@theme`** : ajouter `--color-on-primary`, `--color-on-status-success`, `--color-sticker-sage`,
`--color-on-sticker-sage`, `--color-sticker-lavender`, `--color-on-sticker-lavender` (chacun
`var(--theme-…)`), retirer `--color-accent`. PR 5 : `--font-display`. PR 6a : rayons
`--radius-part: 0.5rem` (8 px, cartouche et tampon), `--radius-field: 0.75rem` (12 px, champs),
`--radius-card: 1rem` (16 px, cartes), `--radius-block: 1.375rem` (22 px, grands blocs), qui donnent
`rounded-part`, `rounded-field`, `rounded-card`, `rounded-block` (espace de noms `--radius-*` de
Tailwind v4). Pilule = `rounded-full`. Le rayon par défaut de l'anneau de focus (4 px, `@layer base`)
ne change pas.

**Contrastes calculés** (script : OKLCH → sRGB linéaire → sRGB, mélanges `color-mix` composés en sRGB,
luminance WCAG 2.x ; on retient le **minimum** entre le calcul flottant et le rendu quantifié 8 bits ;
les écarts à la `## Description` sont de ± 0,05) :

| Paire | Clair, fond / surface | Sombre, fond / surface |
|---|---|---|
| `foreground` | 15,08 / 16,47 | 15,42 / 13,43 |
| `muted` (et sur `surface-elevated`) | 6,82 / 7,45 (7,13) | 8,64 / 7,52 (6,57) |
| `primary-text` (liens, focus) | 5,21 / 5,69 | 7,74 / 6,74 |
| `status-success` / `warn` / `error` | 5,64 / 6,15 ; 5,66 / 6,16 ; 6,07 / 6,63 | 9,17 / 7,99 ; 10,19 / 8,87 ; 6,51 / 5,67 |
| `on-primary` sur `primary-bg` (repos ; survol `/90`) | 5,36 ; 5,90 | 7,74 ; 6,48 |
| `on-status-success` sur `status-success` (repos ; survol `/90`) | 6,15 ; 5,09 | 9,17 ; 7,62 |
| `on-status-error` sur `status-error` | 6,63 | 6,51 |
| `primary-text` sur `primary` à 5 % / 8 % / 10 % | 4,85 / 4,63 / **4,50** (fond) | 7,19 / 6,84 / 6,59 (fond) |
| Code en ligne : `primary-text` sur `foreground` 6 % | 4,64 / 5,07 | 6,66 / 5,70 |
| Texte d'autocollant sauge / lavande | 8,08 / 8,44 | 7,51 / 7,93 |
| Aplat `primary-bg` contre le fond (bouton) | 2,81 / 3,07 | 7,74 / 6,74 |
| Traits `field` | 3,17 / 3,24 | 3,30 / 3,19 |
| Traits décoratifs `line` / `line-strong` | 1,27 / 1,80 | 1,39 / 2,37 |
| Fond d'autocollant contre la page (décoratif) | sauge 1,20, lavande 1,20 | sauge 1,95, lavande 1,72 |

Conséquences appliquées dans la PR 4 :

- **Teinte d'accent sous un texte d'accent ≤ 8 %** (à 10 % le clair est à 4,50, à 20 % 3,86 : échec) :
  pastille de tag `bg-primary/5` → survol `bg-primary/8` ; puce du filtre actif de la liste du blog,
  idem ; bouton `text` survol `bg-primary/8` ; suggestion sélectionnée du sélecteur de tags de l'admin
  `aria-selected:bg-primary/8` ; tuiles « JN » de l'en-tête et de la coque admin (`/15`, `/12`, survol
  `/20`) en `bg-primary/5`, survol `/8`.
- **Tag sélectionné** (`solid`) : `bg-primary-bg text-on-primary border-foreground`. L'aplat clair ne fait
  que 2,81:1 contre le sable ; le contour `foreground` (15:1) porte l'état « sélectionné » (WCAG 1.4.11),
  `aria-pressed` le dit aux technologies d'assistance.
- **Cases à cocher** : `accent-primary` (5,21:1) au lieu d'`accent-primary-bg` (2,81:1).
- **Bouton primaire icône seule** : interdit sans trait ≥ 3:1 (aucun aujourd'hui ; règle écrite dans
  `DESIGN.md`).

### Coloration syntaxique (PR 4)

Fond réel du bloc : `foreground` à 4 % (`bg-foreground/4`, `render-code-block.ts`), sur le fond de page
(article) **et** sur la surface (aperçu de l'éditeur dans une carte). Clair : `#f3ebe3` / `#f6f6f7` ;
sombre : `#1d2330` / `#272e3f`. Méthode : pour chaque rôle, teinte et chroma fixés (chroma réduit au
gamut), luminosité cherchée par pas de 0,5 % jusqu'à **≥ 5,0:1 en clair** et **≥ 6,0:1 en sombre** sur
le **pire** des deux fonds (marge sur le 4,5:1 exigé). Le mot-clé garde l'accent (en sombre, c'est
exactement `primary-text`), le commentaire reprend `muted`, comme aujourd'hui.

| Rôle `--theme-code-*` | Clair | Ratio bloc/fond · bloc/surface | Sombre | Ratio bloc/fond · bloc/surface |
|---|---|---|---|---|
| `keyword` (orange) | `oklch(51.5% 0.16 40)` `#af3c03` | 5,13 · 5,60 | `oklch(76% 0.15 55)` `#f99549` | 7,03 · 6,05 |
| `function` (lavande) | `oklch(51% 0.15 280)` `#5857b9` | 5,11 · 5,58 | `oklch(75.5% 0.11 280)` `#a2a8f4` | 7,05 · 6,07 |
| `string` (sauge) | `oklch(48.5% 0.12 150)` `#1b7138` | 5,13 · 5,60 | `oklch(73.5% 0.13 150)` `#67c07d` | 7,05 · 6,07 |
| `number` (ocre) | `oklch(50.5% 0.1 80)` `#825d0d` | 5,05 · 5,51 | `oklch(75% 0.12 90)` `#cbaa4b` | 7,03 · 6,06 |
| `tag` (rose) | `oklch(52.5% 0.18 355)` `#b32c70` | 5,06 · 5,52 | `oklch(76.5% 0.14 355)` `#f78bb7` | 6,99 · 6,01 |
| `comment` (= `muted`) | `oklch(45% 0.03 265)` `#4d5566` | 6,32 · 6,89 | `oklch(78% 0.02 265)` `#b1b7c5` | 7,83 · 6,75 |
| texte (`foreground`) | | 13,97 · 15,25 | | 14,00 · 12,04 |

Teintes écartées de 40° au moins entre voisines (40, 80, 150, 280, 355) : orange, ocre, sauge, lavande,
rose restent distinctes. Aucune ne reprend un token de statut. Le commentaire reste droit (JN Mono n'a
pas d'italique). Les ratios sont recopiés en commentaire en face de chaque valeur dans `styles.css`,
comme aujourd'hui.

### Police (PR 5)

Tout est tranché et mesuré dans ADR-0031 : source `@fontsource-variable/bricolage-grotesque@5.3.0`
(Bricolage Grotesque **1.001**, `google/fonts` au commit amont `84745e5b96`, **OFL 1.1 sans Reserved
Font Name**), `fontTools.varLib.instancer` 4.67.0 avec `--no-recalc-timestamp` (binaire reproductible),
`opsz=48 wdth=100 wght=600:800`.

- Fichier : `public/fonts/bricolage-grotesque-1.001-latin-opsz48-wdth100-wght600-800.woff2`.
- `@font-face` : `font-family: 'Bricolage Grotesque'`, `font-weight: 600 800`, `font-display: swap`,
  sans `font-stretch`.
- Repli `'Bricolage Grotesque Fallback'` (`local('Arial Bold')`, `local('Arial-BoldMT')`,
  `local('Liberation Sans Bold')`, `local('LiberationSans-Bold')`, `font-weight: 600 800`) :
  `size-adjust: 97.56%`, `ascent-override: 95.32%`, `descent-override: 27.67%`,
  `line-gap-override: 0%` (calibré à `wght` 760 sur le fichier final ; la même méthode redonne les
  valeurs d'Archivo en place à 0,15 point près).
- `--font-display: 'Bricolage Grotesque', 'Bricolage Grotesque Fallback', system-ui, sans-serif`.
- Préchargement : même `<link rel="preload" as="font" type="font/woff2" crossorigin>`, nouveau chemin.
- **Budget** : 37 460 octets préchargés contre 39 512 (Archivo) : **− 2 052 (− 5,2 %)** ; polices d'une
  page sans italique 88 248 octets contre 90 300. Une plage d'œil optique (24–96 : 65 936 octets) est
  hors budget, d'où l'œil fixé.
- Retrait du code sans effet : règles `font-stretch` des `h1`–`h3` (`@layer base`) et les 12 classes
  `font-stretch-*` des gabarits (11 dans l'admin, 1 dans `cartouche.ts`).

### Composants (PR 6a)

**Autocollant** `shared/ui/sticker.ts` (nouveau), sélecteur `app-sticker`, texte projeté.

```ts
export type StickerTone = 'sage' | 'lavender';
export type StickerTilt = 'none' | 'left' | 'right';
// tone = input<StickerTone>('sage'), tilt = input<StickerTilt>('none'),
// host: { '[class]': 'classes()' }  (même mécanique que la directive Button)
```

- Classes de base : `inline-flex w-fit items-center rounded-full border-2 border-transparent px-3 py-1
  font-display text-sm font-bold leading-tight forced-colors:border-[CanvasText]` ; ton :
  `bg-sticker-sage text-on-sticker-sage` | `bg-sticker-lavender text-on-sticker-lavender` ; inclinaison :
  `''` | `-rotate-2` | `rotate-2` (2°, statique, sous la borne de 3° ; pas de transition).
- **Accessibilité** : ni rôle, ni `tabindex`, ni `aria-*` : le texte est lu tel quel. Jamais un lien, un
  bouton, un titre, ni un parent d'interactif (règle `DESIGN.md`). En `forced-colors`, le fond est
  neutralisé par le navigateur ; le bord transparent devient `CanvasText` : la pastille garde son contour
  (exigence 10).
- Usage : au plus **un autocollant décoratif par écran**, 4 mots au plus. Placement initial unique, la
  page d'accueil (PR 6b) ; son libellé est une constante `HOME_HERO_STICKER_LABEL` de
  `features/home/domain/home-hero.static-data.ts` (précédent : `HOME_HERO_CTA_LABELS`), ton et
  inclinaison dans le gabarit (le domaine n'importe pas `shared/ui`).

**Bouton** `shared/ui/button.ts` (ADR-0017, gabarit unique conservé) :

- Pilule par défaut : `rounded-full` dans la base ; l'entrée `rounded` disparaît (plus de consommateur
  qui la distingue : `header.ts` ×2 retire `[rounded]="true"`). `ghost-icon` passe en `rounded-full`.
- `primary` : `bg-primary-bg text-on-primary hover:bg-primary-bg/90` (PR 4) ; `outlined` :
  `border-2 border-foreground text-foreground hover:border-primary hover:text-primary` ;
  `outlined-danger` : `border-2` ; `text` : survol `bg-primary/8` (PR 4). Le reste inchangé.
- Cible : `min-h-11` (et `size-11` / `min-w-11` en icône) garde 44 px malgré la pilule.

**Tampon** `shared/ui/stamp.ts` (« devient un autocollant » sans perdre son rôle de mention) : même API
(`dashed`), apparence `rounded-part border-2 border-foreground bg-surface px-2.5 py-1 text-xs
font-semibold text-foreground` : forme d'autocollant (aplat, trait épais), rayon de pièce technique
(8 px), plus de mono majuscule. **Neutre** : sur la grille des réalisations il y en a un par carte, une
couleur d'autocollant y ferait « des autocollants partout » (exigence 13). Contraste 16,47 / 13,43.

**Cartouche** `shared/ui/cartouche.ts` : cadre et barre de titre `border-2 border-foreground`, rayon
`rounded-part` (`overflow-hidden` pour que les séparateurs suivent le coin), séparateurs internes
`border-line-strong` (décoratifs), titre `font-display font-bold` (largeur retirée en PR 5), libellés
`dt` en JN Sans `text-xs font-semibold text-muted` sans majuscules ; la référence reste en mono (donnée).

**Cote** `shared/ui/dimension-line.ts` : traits de 2 px (`border-l-2`, `border-t-2`), pointes
proportionnelles (`border-y-[5px] border-r-10` / `border-l-10`), toujours `currentColor` = `text-primary`,
libellé mono (donnée). `aria-hidden` inchangé.

**Carte de lien** `shared/ui/link-card.ts` : `rounded-card border-2 border-foreground bg-surface p-6`,
survol `hover:border-primary` (bord 5,21:1, au-delà de 3:1 dans les deux thèmes).

**Toast** `shared/ui/toast.ts` : fond opaque `bg-surface` (le `bg-*/10` translucide dépend de ce qui
défile dessous), `backdrop-blur-sm` retiré (No-Glass Rule), barre `border-l-4` de la couleur de statut
conservée, bouton de fermeture survol `bg-foreground/5`.

### Identité hors CSS

- **`public/favicon.svg`** (PR 4) : sans dégradé, pastille `rx="16"` en `#ed6e12` (`primary-bg` clair),
  « JN » en `#181f2e` (5,36:1), même `font-family` système qu'aujourd'hui. Valable dans les deux thèmes
  (aucune `@media` dans le SVG). Même nom de fichier : nginx le sert en `must-revalidate` (garde de
  `ci.yml`).
- **`public/favicon.ico`** (PR 4) : régénéré depuis le SVG en 16, 32 et 48 px (le `<link>` déclare déjà
  `sizes="48x48"`, l'actuel n'a que 16 et 32) : capture Playwright `omitBackground` du SVG, empaquetage
  ICO par Pillow, hors repo ; commande notée dans la description de PR.
- **`theme-color`** (PR 4), dans `src/index.html`, à la place de `#000000` :
  `<meta name="theme-color" media="(prefers-color-scheme: light)" content="#fcf4eb" />` et
  `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#141a29" />`. Hex (pas
  d'OKLCH : prise en charge des navigateurs non garantie dans ce champ).
- **Carte Open Graph par défaut** (PR 6a) : `public/og/julien-nedellec-AAAAMMJJ.png` (date de production,
  ADR-0007 décision 1 ; nouveau nom à chaque changement), 1200 × 630, PNG (aplats : poids visé
  ≤ 150 Ko, mesuré et noté). Thème clair : fond sable, carte `surface` à bord `foreground` 2 px et rayon
  22 px, « Julien Nédellec » en Bricolage 800, l'accroche de l'accueil en JN Sans 600 (décision de goût 3), un
  autocollant sauge incliné, une cote orange, l'adresse du site. Aucune photo, aucun dégradé.
  Source : `docs/og/og-default.html` (hors sources Tailwind, `@source not '../docs'`), qui charge les
  woff2 de `public/fonts/` ; rendu par `pnpm exec playwright screenshot --viewport-size "1200, 630"
  file://$PWD/docs/og/og-default.html public/og/julien-nedellec-AAAAMMJJ.png` (Playwright est déjà une
  dépendance de dev, aucune nouvelle dépendance).
- **Câblage** : `shared/seo/share-image.ts` gagne `DEFAULT_SHARE_IMAGE = { url, width: 1200, height: 630,
  type: 'image/png', alt: 'Julien Nédellec. Tourneur CN le jour, développeur web le reste du temps.' } as const`
  (décision de goût 3). `seo.ts`
  remplace `AVATAR_IMAGE` / `AVATAR_ALT` par cette constante ; `twitter:card` vaut toujours
  `summary_large_image` (la carte par défaut est grande). `index.html` : `og:image`, `og:image:alt`, et
  ajout de `og:image:width`, `og:image:height`, `og:image:type` (parité avec `seo.ts`, pour les coquilles
  CSR). `avatar.png` reste dans `public/` (lien externe possible), il n'est plus référencé par le site.

### Modèles de données

- `StickerTone`, `StickerTilt` (ci-dessus), exportés de `sticker.ts`.
- `Button` : retrait de l'entrée `rounded` ; `ButtonVariant` inchangé.
- `DEFAULT_SHARE_IMAGE` : `as const`, champs `readonly` de fait. `SeoData` inchangé.
- Aucun modèle de domaine modifié ; une constante de chaîne ajoutée (`HOME_HERO_STICKER_LABEL`).

### Fichiers à créer / modifier

**PR 3 (documentation, après la PR 1 de la spec 031)**

- `DESIGN.md` : réécrit (étoile du nord « Copeaux vifs », front matter couleurs / typographie / rayons /
  composants, palettes et contrastes de ce plan, règles nommées : **One Orange Rule** avec ses deux
  exceptions bornées (code, autocollants), **Sticker Rule** (un décoratif par écran, 4 mots, 2° statique,
  jamais interactif, sauge ou lavande), Two Registers, Decorative Line (seuils 50 % clair, 38 % sombre),
  Flat-By-Default, No-Glass (absorbe la Glassmorphism Containment Rule, les surfaces sombres étant
  opaques), Three Families (Bricolage Grotesque, JN Sans, JN Mono), Single-Display, Orange Accent Rule
  (ex-Indigo Accent), Do's and Don'ts relus). Plus aucune mention de recruteur, de SRE, de séniorité.
  Le § 5 (classes exactes des composants) est mis à jour **par chaque PR qui change le composant** (4,
  5, 6a, 6b), pour que le document ne décrive jamais des classes absentes du code.
- `DESIGN.json` : miroir des couleurs, de la typographie et des rayons.
- `PRODUCT.md` : principe 3 et « Soigné » réécrits.

**PR 4 (tokens, après la PR 2 de la spec 031)**

- `src/styles.css` : tokens des deux thèmes, `@theme` (+ 6, − 1), six teintes de code et leurs ratios,
  commentaires « indigo » remplacés (`code-syntax`, `nav-underline`).
- `src/app/shared/ui/button.ts` (+ `button.spec.ts`) : `text-on-primary`, survol `text` à 8 %.
- `src/app/features/blog/application/blog-tag-palette.ts` (+ spec) : `solid` et teintes (ci-dessus).
- `src/app/features/blog/pages/blog-list/blog-list.ts` : puce du filtre actif 5 / 8 %.
- `src/app/pages/page-not-found.ts` : `text-on-primary`.
- `src/app/features/auth/application/two-factor-enable-form.ts` : `text-on-status-success`.
- `src/app/layout/components/header/header.ts`, `src/app/features/admin/pages/admin-layout/admin-layout.ts`,
  `src/app/features/admin/application/components/admin-tags-selector.ts` : teintes ≤ 8 %.
- `src/app/features/admin/application/components/admin-post-form.ts`,
  `admin-project-identity-fields.ts` (+ `admin-project-form.spec.ts`) : `accent-primary`.
- Specs renommés (le mot « indigo » et les valeurs d'exemple) : `analytics-presenter.spec.ts`,
  `admin-overview.spec.ts`, `chart-palette.spec.ts`.
- `public/favicon.svg`, `public/favicon.ico`, `src/index.html` (`theme-color`).
- `.github/workflows/ci.yml` (job `verify`) : garde « deux `theme-color` avec `media` clair et sombre dans
  le HTML prérendu ».
- `DESIGN.md` § 2 et § 5 (variantes du bouton, tags, bloc de code), `DESIGN.json`.

**PR 5 (police)**

- Créer `public/fonts/bricolage-grotesque-1.001-latin-opsz48-wdth100-wght600-800.woff2`,
  `public/fonts/OFL-bricolage-grotesque.txt` ; supprimer `archivo-2.001-latin-wdth100-110-wght600-800.woff2`,
  `OFL-archivo.txt`.
- `src/styles.css` (`@font-face`, repli, `--font-display`, règles `font-stretch` retirées), `src/index.html`
  (preload).
- Retrait de `font-stretch-*` : `shared/ui/cartouche.ts` ; admin : `admin-project-row.ts`,
  `admin-project-preview.ts`, `admin-wording-notice.ts`, `admin-post-preview.ts`, `overview-content.ts`,
  `admin-setting-row.ts`, `admin-form-section.ts`, `admin-pair-rows.ts`, `admin-section-head.ts`,
  `pages/admin-layout/admin-layout.ts` (×2, `[font-stretch:104%]`).
- `.github/workflows/ci.yml` : nom de police du contrôle de type et de cache (job `docker`).
- `docs/adr/0006-polices-auto-hebergees.md` : ligne de statut « amendé par ADR-0031 ».
- `DESIGN.md` § 3, `DESIGN.json` (typographie).

**PR 6a (composants signature et carte de partage)**

- Créer `src/app/shared/ui/sticker.ts`, `sticker.spec.ts`.
- Modifier `shared/ui/button.ts` (+ spec), `stamp.ts` (+ spec), `cartouche.ts` (+ spec si une classe y
  est figée), `dimension-line.ts`, `link-card.ts` (+ spec), `toast.ts` ; `src/styles.css` (rayons
  `@theme`, `form-input` / `app-select` en `rounded-field`).
- Créer `docs/og/og-default.html`, `public/og/julien-nedellec-AAAAMMJJ.png` ; modifier
  `shared/seo/share-image.ts`, `core/seo/seo.ts` (+ `seo.spec.ts`), `src/index.html`.
- `.github/workflows/ci.yml` : garde « l'`og:image` par défaut du HTML prérendu existe dans `dist/` »
  (job `verify`) et « l'`og:image` de la coquille CSR `/login` répond 200 en `image/png` » (job `docker`).
- `e2e/a11y/forced-colors.spec.ts` (nouveau, voir Tests).
- `DESIGN.md` § 5, `DESIGN.json` (composants).

**PR 6b (gabarits publics)**

- Inventaire à recalculer sur `master` au moment de la PR (les specs 031 et 032 réécrivent ces
  gabarits) : `grep -rlE "rounded-(md|lg|xl|2xl)|border-foreground/[0-9]+|border-line|uppercase" src/app
  --exclude-dir=admin --exclude-dir=auth`, specs exclus. Au 2026-10-21 : 43 fichiers (accueil, parcours `about-*`,
  réalisations `project-*`, blog `blog-*` et `render-code-block.ts`, contact, en-tête, pied de page,
  404, `shared/ui` restants : `confirm-dialog`, `drawer`, `fact-list`, `file-dropzone`, `icon-tile`).
- Règles appliquées : cartes `rounded-card border-2 border-foreground bg-surface` ; grands blocs
  (hero, bloc de code, galerie) `rounded-block` ; boutons faits main remplacés par `appButton` (lien de
  la 404) ; entrée de navigation active de l'en-tête en pilule `rounded-full bg-primary/8` (remplace la
  barre `nav-underline`, `@utility` supprimé s'il n'a plus de consommateur) ; tuile « JN » en aplat
  `bg-primary-bg text-on-primary rounded-full` (5,36 / 7,74) ; `@utility footer-heading` en JN Sans
  `font-semibold`, sans majuscules ni mono ; libellés `font-mono uppercase` publics ramenés à JN Sans
  (le mono reste aux données : cotes, références, dates chiffrées, code).
- `features/home/domain/home-hero.static-data.ts` (`HOME_HERO_STICKER_LABEL`),
  `features/home/application/home-hero-section.ts` : l'autocollant de l'accueil, après le `h1` dans
  l'ordre du DOM, sans recouvrir de texte à 375 px.
- Auth (`login`, double authentification) et admin : couleurs par les tokens, gabarits inchangés.
- `DESIGN.md` § 5 (composants de page).

### Tranches

Les PR se suivent (mêmes fichiers) ; chaque tranche est verte sans les suivantes.

- **Tranche unique PR 3 : la doctrine écrite** (documentation, aucun test ; relue contre ce plan).
- **Tranche 4.1 : le texte reste lisible sur l'accent** : tokens des deux thèmes, `on-primary`,
  `on-status-success`, teintes ≤ 8 %, `accent-primary`, tag sélectionné à contour. Tests : `button.spec`,
  `blog-tag-palette.spec`, `admin-project-form.spec`, renommages ; axe sur toutes les pages.
- **Tranche 4.2 : le code se lit dans les deux thèmes** : six teintes `--theme-code-*`. Vérifiée par axe
  sur `/blog/article-temoin` (bloc de code de la doublure) en clair et en sombre.
- **Tranche 4.3 : l'identité hors CSS** : favicon, `theme-color` et sa garde CI.
- **Tranche unique PR 5 : les titres en Bricolage Grotesque** (fichier, `@font-face`, repli, preload,
  garde CI, retrait des largeurs) : un seul comportement, indivisible (le preload et la face doivent
  changer ensemble).
- **Tranche 6a.1 : les boutons sont des pilules** : base `rounded-full`, entrée `rounded` retirée,
  `outlined` à 2 px, rayons `@theme`.
- **Tranche 6a.2 : l'autocollant existe** : `sticker.ts` et son spec, `forced-colors.spec.ts`.
- **Tranche 6a.3 : tampon, cartouche, cote, carte de lien, toast restylés.**
- **Tranche 6a.4 : la carte de partage par défaut** : PNG versionné, `share-image.ts`, `seo.ts`,
  `index.html`, gardes CI.
- **Tranche 6b.1 : formes des gabarits publics** (cartes, blocs, navigation, pied de page, libellés).
- **Tranche 6b.2 : l'autocollant de l'accueil.**

### Tests

**À adapter** (valeurs figées par l'ancienne direction) :

- `shared/ui/button.spec.ts` : `PRIMARY` → `text-on-primary` (plus de `text-white`) ; `OUTLINED` ;
  survol `text` ; base avec `rounded-full` ; cas de l'entrée `rounded` supprimés ; `ghost-icon`
  `rounded-full`.
- `features/blog/application/blog-tag-palette.spec.ts` : libellés « Signal Indigo » → « accent » ;
  `solid` contient `text-on-primary` et `border-foreground`, jamais `text-white` ; teinte ≤ 8 %
  (assertion sur `bg-primary/5` et `hover:bg-primary/8`).
- `features/admin/application/components/admin-project-form.spec.ts` : `accent-primary`.
- `features/analytics/domain/analytics-presenter.spec.ts`, `features/admin/pages/admin-overview/admin-overview.spec.ts`,
  `features/admin/application/chart-palette.spec.ts` : libellés et valeurs d'exemple orange (le
  comportement testé, lire le token, ne change pas).
- `shared/ui/stamp.spec.ts`, `link-card.spec.ts` (et `cartouche.spec.ts` si une classe y est figée) :
  nouvelles listes de classes.
- `core/seo/seo.spec.ts` : sans visuel, `og:image` contient `/og/julien-nedellec-`, `1200` × `630`,
  `image/png`, `twitter:card` = `summary_large_image` ; avec visuel, inchangé.

**À ajouter** :

- `shared/ui/sticker.spec.ts` (TestBed, `setInput`) : `it.each` sur `StickerTone` (classes `bg-sticker-*`
  et `text-on-sticker-*`) et sur `StickerTilt` (`''`, `-rotate-2`, `rotate-2`) ; base avec
  `rounded-full`, `border-transparent`, `forced-colors:border-[CanvasText]` ; aucun `role` ni
  `tabindex` sur l'hôte ; texte projeté rendu. Sélecteurs `data-testid` uniquement.
- `e2e/a11y/forced-colors.spec.ts` (Playwright, contre l'image) : sur `/`, `emulateMedia({ forcedColors:
  'active' })`, le bord calculé de l'autocollant n'est pas transparent. (Hors axe, qui ne teste pas ce
  mode ; même harnais, même réseau fermé.)
- `e2e/a11y/scenarios.ts` : scénario `{ path: '/blog?tag=Angular', ready: 'tag-filter-banner' }` (puce
  du filtre actif ; `Angular` est un tag de la doublure) dans les deux thèmes.

### Vérifications

- **Gates du Dockerfile** à chaque PR : `pnpm install --frozen-lockfile`, `pnpm run build --configuration
  production`, plus `pnpm lint`, `pnpm test` (lire le code de sortie), `pnpm run format:check`.
- **Job `a11y`** (ADR-0025) à zéro violation, clair et sombre, pages publiques et admin.
- **Lighthouse avant / après** (PR 4, 5, 6a, 6b), protocole de la spec 010 adapté au rendu à la requête
  (ADR-0024) : image Docker de la base et de la branche, servies tour à tour derrière la doublure
  (`ci/a11y-stack.sh up <image>`), Lighthouse 12.8.2 (`pnpm dlx lighthouse@12.8.2`), mobile simulé et
  desktop, 5 passes alternées, requêtes tierces bloquées. Pages : `/`, `/blog`, `/blog/article-temoin`,
  `/projects`, `/projects/projet-temoin`, `/about`. Critères : médianes non dégradées de plus de
  2 points (bruit mesuré en spec 010), **CLS médian 0**, élément LCP identique, octets de police
  transférés sur `/` ≤ base. Relevé inscrit dans la spec ; la cible absolue (> 95) se vérifie en
  production après déploiement.
- **PR 5** : en DevTools, police bloquée (repli seul) puis débloquée, aucun déplacement mesurable du
  `h1` du hero (CLS 0 dans la trace).
- **Production** après chaque merge : `theme-color` (PR 4), `content-type` et cache immuable de la
  nouvelle police (PR 5), carte de partage lue par un validateur Open Graph (PR 6a).

### Risques & inconnues

- Les PR 2 de la spec 031 et la spec 032 réécrivent les gabarits publics avant la PR 6b : l'inventaire
  se recalcule au rebase ; la règle des teintes ≤ 8 % n'a pas de garde mécanique (axe n'audite pas les
  survols) et ne tient que par la revue.
- `theme-color` suit la préférence système, pas un choix explicite contraire fait dans `ThemeStore` :
  barre du navigateur de l'autre couleur dans ce cas (cosmétique, accepté). Le widget Giscus garde ses
  thèmes GitHub `light` / `dark`, qui détonneront sur le bleu nuit (hors périmètre, suivi possible).
- L'œil optique fixé à 48 n'a été jugé que sur mesures, pas sur rendu ; un `h1` à 70 px peut paraître
  moins expressif qu'en maquette (si la maquette chargeait l'axe complet). À valider à l'œil en PR 5.

### Décisions de goût (propriétaire, 2026-10-21)

1. **Autocollant de l'accueil** : « Fait main », sauge, incliné à gauche.
2. **Tampon** : neutre à contour, aucune couleur d'autocollant.
3. **Carte de partage** : texte seul, sans portrait. Sous le nom, l'**accroche de l'accueil**, « Tourneur
   CN le jour, développeur web le reste du temps. » (`STATIC_HERO.headline` de
   `features/home/infra/data/home.static-data.ts`), décision du propriétaire du 2026-10-22 ; elle remplace
   le sous-titre « Tourneur CN et développeur web » proposé. Texte alternatif cohérent : « Julien Nédellec.
   Tourneur CN le jour, développeur web le reste du temps. » (le nom, puis l'accroche telle quelle).
4. **Boutons `outlined`** : contour 2 px `foreground`, assorti aux cartes.
5. **Œil optique** : **48**, confirmé par le propriétaire le 2026-10-22 sur une comparaison visuelle 48 / 96
   des titres de l'accueil (96 : même poids, dessin plus serré).

## Plan de test

Commande : `pnpm test` (typecheck des specs + Vitest), précédée de `pnpm exec ng cache clean` et de la
purge de `node_modules/.vite` ; code de sortie lu (`1`). `pnpm run format:check` et `eslint` sur les
fichiers de test : verts. Tous les échecs sont des assertions (`AssertionError` sur `toEqual`), aucun
échec de harnais ni de typage. Le reste de la suite est vert.

Sweep de contrat (anciennes valeurs `text-white`, `accent-primary-bg`, `bg-primary/10` à `/20` sous texte
d'accent, `--color-accent`, `--theme-accent`, « indigo », `oklch(… 277)`, `theme-color` `#000000`) sur
`src/**/*.spec.ts`, `e2e/` et `ci/` : aucun autre test n'encode l'ancien contrat.
`blog-tag-link.spec.ts` ne portait que le libellé « Signal Indigo » (renommé, reste vert).

Helper partagé ajouté : `src/app/shared/testing/accent-tints.ts` (`accentTints(element)` : jetons
`bg-primary/N`, préfixes de variante compris, triés ; `null` si l'élément manque).

### Tranche 4.1 — le texte reste lisible sur l'accent

- `shared/ui/button.spec.ts` (adapté) : `PRIMARY` = `bg-primary-bg text-on-primary hover:bg-primary-bg/90` ;
  variante `text` = `text-primary hover:bg-primary/8`. Les 8 cas qui composent `PRIMARY` ou `text` tombent.
- `features/blog/application/blog-tag-palette.spec.ts` (réécrit) : pastille catalogue avec `text-primary`
  et teintes exactement `bg-primary/5`, `hover:bg-primary/8` (5 catégories) ; `solid` exactement
  `bg-primary-bg border-foreground text-on-primary` (catalogue et tag libre, 6 cas) ; aucune couleur
  Tailwind par défaut ni `*-white` (6 cas) ; parité des catégories et tag libre neutre (verts).
- `admin-project-form.spec.ts` (adapté) : la case « Mettre en avant » porte `accent-primary` et `size-5`.
- `admin-post-form.spec.ts` (ajout) : les deux radios de publication portent `accent-primary`, seule
  classe `accent-*`.
- `pages/page-not-found.spec.ts` (ajout) : le lien `not-found-home-link` mène à `/` ; ses couleurs
  (`bg-*`/`text-*` hors tailles) sont exactement `bg-primary-bg`, `text-on-primary`.
- `two-factor-enable-form.spec.ts` (ajout) : le bouton `twofa-submit` a pour couleurs exactement
  `bg-status-success`, `text-on-status-success`.
- `header.spec.ts` (ajout) : `header-monogram` a pour teintes `bg-primary/5`, `group-hover:bg-primary/8`.
- `admin-layout.spec.ts` (ajout) : les deux `admin-monogram` (barre latérale, barre mobile) ont pour
  teinte `bg-primary/5`.
- `admin-tags-selector.spec.ts` (ajout) : l'option active (`aria-selected="true"`) a pour teinte
  `aria-selected:bg-primary/8`.
- `blog-list.spec.ts` (ajout) : la puce `tag-filter-clear` a pour teintes `bg-primary/5`,
  `hover:bg-primary/8`.
- `src/app/theme-tokens.spec.ts` (nouveau, lit `src/styles.css` comme `editorial-identity.spec.ts` lit les
  sources) : valeurs des 21 tokens du tableau « Tokens des deux thèmes », clair et sombre (golden) ;
  ensemble exact des `--theme-*` déclarés par thème (ajout de `on-primary`, `on-status-success`,
  `sticker-*`, `on-sticker-*`, plus d'`accent`) ; carte complète des `--color-*` de `@theme`, chacun en
  `var(--theme-…)` (`primary` → `primary-text`).
- Renommages sans changement de comportement (verts, attendu) : `analytics-presenter.spec.ts`,
  `admin-overview.spec.ts`, `chart-palette.spec.ts` (valeurs d'exemple orange et texte du nouveau thème),
  `blog-tag-link.spec.ts`.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le
2026-10-22 20:58, 38 failed / 4368 total), par assertion : classes actuelles `text-white`,
`accent-primary-bg`, `bg-primary/10`–`/20`, testids `not-found-home-link`, `twofa-submit`,
`header-monogram`, `admin-monogram` absents, tokens absents ou à l'ancienne valeur.

### Tranche 4.2 — le code se lit dans les deux thèmes

- `src/app/theme-tokens.spec.ts`, `describe('syntax highlighting tokens')` : `it.each` clair / sombre, les
  six `--theme-code-*` valent exactement les teintes du tableau « Coloration syntaxique » (le mot-clé
  sombre = `primary-text`, le commentaire = `muted`).

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le
2026-10-22 20:58, 2 failed / 4368 total), par assertion : teintes indigo / violet actuelles.

### Tranche 4.3 — l'identité hors CSS

- `src/app/browser-identity.spec.ts` (nouveau) : `src/index.html` déclare exactement deux
  `meta[name="theme-color"]`, `(prefers-color-scheme: light)` `#fcf4eb` puis `(prefers-color-scheme: dark)`
  `#141a29` ; `public/favicon.svg` n'a ni dégradé ni `<style>`, sa pastille `rect` a `rx="16"` et
  `fill="#ed6e12"`, son texte « JN » `fill="#181f2e"`.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le
2026-10-22 20:58, 2 failed / 4368 total), par assertion : une seule `theme-color` sans `media`, favicon
à dégradé.

Laissé au GREEN, hors Vitest : `favicon.ico` 16/32/48 (régénéré hors repo), garde `ci.yml` « deux
`theme-color` avec `media` dans le HTML prérendu », scénario axe `/blog?tag=Angular` dans
`e2e/a11y/scenarios.ts`, et la règle « teinte ≤ 8 % » hors des gabarits ci-dessus (revue). Les contrastes
eux-mêmes restent prouvés par le job `a11y` (happy-dom ne les calcule pas).

### Tranche 5 — les titres en Bricolage Grotesque

Sweep de contrat (`archivo`, `Archivo`, `font-stretch`, `fonts/`, `woff2` sur `src/**/*.spec.ts`, `e2e/`,
`ci/`) : aucun test existant ne fige Archivo ni une largeur, rien à adapter. Hors tests, l'ancien contrat
reste dans `.github/workflows/ci.yml:238` (nom du fichier de police du job `docker`), à changer au GREEN.

`src/app/display-font.spec.ts` (nouveau, lit `src/styles.css`, `src/index.html` et `public/fonts/` comme
`theme-tokens.spec.ts` et `browser-identity.spec.ts`) :

- face `'Bricolage Grotesque'` : déclarations exactement `src: url('/fonts/bricolage-grotesque-1.001-latin-opsz48-wdth100-wght600-800.woff2') format('woff2')`,
  `font-weight: 600 800`, `font-display: swap` (golden : aucun `font-stretch`) ;
- face `'Bricolage Grotesque Fallback'` : exactement les quatre `local()` (Arial Bold, Arial-BoldMT,
  Liberation Sans Bold, LiberationSans-Bold), `font-weight: 600 800`, `size-adjust: 97.56%`,
  `ascent-override: 95.32%`, `descent-override: 27.67%`, `line-gap-override: 0%` ;
- familles déclarées : exactement Bricolage Grotesque, JN Sans (×2), JN Mono et les deux replis ;
- `--font-display` = `'Bricolage Grotesque', 'Bricolage Grotesque Fallback', system-ui, sans-serif` ;
- `styles.css` : aucun `font-stretch` (face et règles `h1`–`h3`) ;
- `it.each` sur `styles.css` et `index.html` : plus aucune mention d'Archivo (commentaires compris) ;
- `index.html` : les `link[rel=preload][as=font]` sont exactement un, vers le nouveau fichier,
  `type="font/woff2"`, `crossorigin` ;
- `public/fonts/` contient exactement les six fichiers attendus (Bricolage Grotesque et
  `OFL-bricolage-grotesque.txt` à la place des deux fichiers Archivo) ;
- le fichier de police commence par la signature `wOF2` ;
- `OFL-bricolage-grotesque.txt` contient « SIL OPEN FONT LICENSE Version 1.1 » et « The Bricolage Grotesque
  Project Authors » ;
- balayage des `.ts` non-spec de `src/app` : aucune ligne avec `font-stretch-` ou `[font-stretch:`
  (liste `fichier:ligne` attendue vide).

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le
2026-10-22 22:04, 12 failed / 4374 total), après `pnpm exec ng cache clean` et purge de
`node_modules/.vite`, code de sortie `1` ; `pnpm run format:check` et `eslint` du fichier : verts ; aucune
erreur de typage. Les 12 échecs sont des `AssertionError` : faces Bricolage absentes (`undefined`), familles
et `--font-display` à Archivo, 4 `font-stretch` dans `styles.css`, mentions d'Archivo (6 dans `styles.css`,
1 dans `index.html`), preload vers le fichier Archivo, dossier `public/fonts/` à l'ancienne, fichier et
licence absents (`null`), 12 lignes de largeur dans 11 gabarits. Les 4362 autres tests restent verts.

Laissé au GREEN, hors Vitest : `ci.yml` (job `docker`), statut d'ADR-0006, `DESIGN.md` § 3 et `DESIGN.json`,
et la vérification « police bloquée puis débloquée, `h1` immobile » (DevTools, plus Lighthouse).

### PR 6a — balayage et mesure communs

Sweep de contrat (`[rounded]`, `rounded-md`, `rounded-sm`, `rounded-xl`, `rounded-lg`, `border-foreground/8`,
`border-foreground/15`, `hover:border-primary/35`, `border-[1.5px]`, `tracking-[0.06em]`, `backdrop-blur`,
`bg-*/10`, `avatar.png`, « Photo de profil », `og:image`, `twitter:card`) sur `src/**/*.spec.ts`, `e2e/` et
`ci/` : seuls les specs ci-dessous figeaient l'ancien contrat (`admin-save-bar.spec.ts` ne lit
`border-line-strong` que sur sa propre barre, hors périmètre). Hors tests, `header.ts` lie encore
`[rounded]="true"` deux fois (à retirer au GREEN avec l'entrée).

Mesure : les quatre tranches touchent des fichiers disjoints et chaque bloc ci-dessous ne tombe que sur
son composant ; elles ont été mesurées ensemble (un seul `pnpm test`), sous un squelette jetable posé le
temps de la mesure puis retiré (précédent : spec 011) : `sticker.ts` exportant `StickerTone`,
`StickerTilt` et un composant `Sticker` aux deux entrées, sans classe, et un `DEFAULT_SHARE_IMAGE` aux
valeurs de l'avatar actuel. Sur l'arbre commité, la compilation s'arrête sur `TS2307` `./sticker` et
`TS2305` `DEFAULT_SHARE_IMAGE` (trois specs) : **symboles dus au GREEN** (`src/app/shared/ui/sticker.ts`,
`src/app/shared/seo/share-image.ts`), aucune autre erreur de typage. `prettier --check` et `eslint` des
11 specs : verts.

Mesure commune : `pnpm test` le 2026-10-22 22:49, après `pnpm exec ng cache clean` et purge de
`node_modules/.vite`, code de sortie `1`, 48 failed / 4396 total ; les 48 échecs sont des
`AssertionError`, aucun échec de harnais ; les 4348 autres tests sont verts (tranches 4.1 à 5
comprises).

### Tranche 6a.1 — les boutons sont des pilules

- `shared/ui/button.spec.ts` (adapté) : `rounded-full` entre dans la base, `rounded-md` disparaît de tous
  les attendus ; `OUTLINED` = `border-2 border-foreground text-foreground hover:border-primary
  hover:text-primary` ; `outlined-danger` en `border-2` ; `GHOST_ICON` en `rounded-full` ; le cas
  « Given rounded » et l'hôte `[rounded]="true"` supprimés (l'entrée disparaît). 16 cas, tous rouges.
- `src/app/theme-tokens.spec.ts`, `describe('radius tokens')` (ajout) : `@theme` déclare exactement
  `--radius-part: 0.5rem`, `--radius-field: 0.75rem`, `--radius-card: 1rem`, `--radius-block: 1.375rem` ;
  `it.each` `form-input` / `app-select` : le seul jeton `rounded*` de l'`@utility` est `rounded-field`
  (lecture par découpe sur `@utility `, sans capture d'accolades). 3 rouges.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le
2026-10-22 22:49, 19 failed / 4396 total), par assertion : `rounded-md`, `border border-foreground/15`,
`hover:border-primary/40`, aucun `--radius-*`, `rounded-lg` dans les deux utilitaires.

### Tranche 6a.2 — l'autocollant existe

- `shared/ui/sticker.spec.ts` (nouveau, TestBed, hôtes à `input()` + `setInput`, `data-testid="sticker"`) :
  sans liaison, pastille sauge droite et texte projeté « Fait main » ; `it.each` sur `StickerTone`
  (`bg-sticker-*` + `text-on-sticker-*`) et sur `StickerTilt` (`none` sans rotation, `left` `-rotate-2`,
  `right` `rotate-2`), listes exactes avec la base `inline-flex w-fit items-center rounded-full border-2
  border-transparent px-3 py-1 font-display text-sm font-bold leading-tight
  forced-colors:border-[CanvasText]` ; réactivité (ton et inclinaison changés après rendu) ; ni `role`, ni
  `tabindex`, ni `aria-*` sur l'hôte, aucun interactif ni titre dedans (vert sous le squelette, par
  nature : il garde le contrat).

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le
2026-10-22 22:49, 7 failed / 4396 total), par assertion : l'hôte n'a aucune classe.

`e2e/a11y/forced-colors.spec.ts` est **reporté à la tranche 6b.2** : il vise `/`, et l'autocollant n'y est
posé qu'en 6b ; écrit ici, il serait rouge jusqu'à la PR suivante (une tranche doit être verte sans les
suivantes), et l'y injecter à la main testerait une copie des classes, pas le composant. En 6a, le
contour en couleurs forcées est tenu par la classe `forced-colors:border-[CanvasText]` (spec ci-dessus).

### Tranche 6a.3 — tampon, cartouche, cote, carte de lien, toast restylés

- `shared/ui/stamp.spec.ts` (adapté) : liste exacte `inline-block rounded-part border-2 border-foreground
  bg-surface px-2.5 py-1 text-xs font-semibold text-foreground` (plus de mono majuscule) ; placement et
  `border-dashed` inchangés. 4 rouges.
- `shared/ui/cartouche.spec.ts` (ajout) : cadre `block rounded-part border-2 border-foreground bg-surface
  text-sm overflow-hidden` ; barre de titre `cartouche-head` (testid **à poser au GREEN**) `grid gap-1
  border-b-2 border-foreground p-3.5` ; lignes `border-t border-line-strong first:border-t-0` ; libellés
  `dt` `border-r border-line-strong px-3.5 py-2.5 text-xs font-semibold text-muted`. 1 rouge.
- `shared/ui/dimension-line.spec.ts` (ajout) : les sept pièces de l'hôte, dans l'ordre : attaches
  `h-3.5 border-l-2`, pointes `size-0 border-y-[5px] border-y-transparent border-r-10` / `border-l-10`
  (`*-current`), lignes `flex-1 border-t-2`, libellé mono inchangé ; hôte `text-primary`. 1 rouge.
- `shared/ui/link-card.spec.ts` (adapté, renforcé) : liste **exacte** (était `arrayContaining`)
  `group grid gap-1 rounded-card border-2 border-foreground bg-surface p-6 transition-colors
  hover:border-primary`, plus `text-right` en alignement de fin. 2 rouges.
- `shared/ui/toast.spec.ts` (adapté) : le cas « teinté à 10 % » devient, par sévérité, fond exactement
  `bg-surface`, aucun `*blur*`, `border-l-4` et une couleur de bord de la sévérité ; ajout : survol du
  bouton de fermeture exactement `hover:bg-foreground/5`. 8 rouges.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le
2026-10-22 22:49, 16 failed / 4396 total), par assertion : `rounded-sm`/`rounded-xl`, traits de 1 ou 1,5 px,
`border-line`, mono majuscule, `bg-*/10`, `backdrop-blur-sm`, survols teintés de la sévérité.

### Tranche 6a.4 — la carte de partage par défaut

- `shared/seo/share-image.spec.ts` (ajout) : golden `DEFAULT_SHARE_IMAGE` = `{ url:
  https://nedellec-julien.fr/og/julien-nedellec-AAAAMMJJ.png, width: 1200, height: 630, type: 'image/png',
  alt }`, l'alt valant « Julien Nédellec. » suivi de `STATIC_HERO.headline` (il suit l'accroche de l'accueil) ; `public/og/`
  contient exactement une carte datée et c'est celle annoncée ; son en-tête est un PNG de 1200 × 630 ;
  `docs/og/og-default.html` écrit le nom et l'accroche, sans `<img>` ni dégradé. 4 rouges.
- `core/seo/seo.spec.ts` (adapté) : sans visuel, `og:image` contient `/og/julien-nedellec-` et vaut
  `DEFAULT_SHARE_IMAGE.url`, alt = `DEFAULT_SHARE_IMAGE.alt`, `1200` × `630`, `image/png`, `twitter:card`
  `summary_large_image` ; avec visuel, inchangé (vert). 1 rouge.
- `src/app/browser-identity.spec.ts` (ajout) : `src/index.html` annonce la même carte que `seo.ts`
  (`og:image`, `og:image:alt`, `og:image:width` `1200`, `og:image:height` `630`, `og:image:type`
  `image/png`, `twitter:card` `summary_large_image`). 1 rouge.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le
2026-10-22 22:49, 6 failed / 4396 total), par assertion : avatar 400 × 400 et « Photo de profil »,
`public/og/` et `docs/og/` absents (`null`, 0 fichier), `index.html` sans dimensions ni type.

Laissé au GREEN, hors Vitest : le PNG lui-même (rendu Playwright de `docs/og/og-default.html`, poids
mesuré et noté), les deux gardes `ci.yml` (`og:image` du HTML prérendu présente dans `dist/`, `og:image` de
la coquille `/login` en 200 `image/png`), `header.ts` (`[rounded]` retiré), `DESIGN.md` § 5 et
`DESIGN.json`. Le validateur Open Graph se passe en production.

### PR 6b — inventaire, balayage et mesure communs

Inventaire recalculé le 2026-10-23 sur `feat/033-pages` (`d78e2c4`, PR 6a non mergée, specs 031 et 032
déjà sur la base) : `grep -rlE "rounded-(md|lg|xl|2xl)|border-foreground/[0-9]+|border-line|uppercase" src/app
--exclude-dir=admin --exclude-dir=auth`, specs exclus : **40 fichiers** (43 au 2026-10-21).

- Blog (7) : `blog-tag-palette.ts`, `blog-like-button.ts`, `blog-post-row.ts`, `blog-tag-link.ts`,
  `render-code-block.ts`, `blog-detail.ts`, `blog-list.ts`.
- Contact (2) : `contact-info-panel.ts`, `contact-form.ts`.
- Accueil (3) : `home-hero.ts`, `home-latest-posts.ts`, `pages/home/home.ts`.
- Parcours (8) : `about-diploma.ts`, `about-hero.ts`, `about-highlights.ts`, `about-journey.ts`,
  `about-motivation.ts`, `about-stack.ts`, `about-what-i-do.ts`, `pages/about/about.ts`.
- Réalisations (10) : `project-articles.ts`, `project-cover.ts`, `project-detail-arch-decisions.ts`,
  `project-detail-header.ts`, `project-detail-nav.ts`, `project-detail-tech-choices.ts`,
  `project-gallery.ts`, `project-kind-legend.ts`, `pages/project-detail/project-detail.ts`,
  `pages/projects/projects.ts`.
- Coque (3) : `footer.ts`, `header.ts`, `pages/page-not-found.ts`.
- `shared/ui` (7) : `cartouche.ts`, `confirm-dialog.ts`, `drawer.ts`, `fact-list.ts`, `file-dropzone.ts`,
  `icon-tile.ts`, `toast.ts` (`cartouche` et `toast` n'y restent que par `border-line*`, traits décoratifs
  légitimes, et `rounded-lg`/`rounded-md` pour le toast).

Les `border-line*` restants sont des traits décoratifs (Decorative Line Rule) : ni balayés ni testés en
masse ; les `border-foreground/N` des cartes tombent avec les cartes. Sur 40 fichiers, **19** portent un
rayon générique (38 occurrences), **1** des capitales (`project-detail-nav.ts`, deux libellés
`uppercase` sans mono). Le seul `font-mono uppercase` public est `@utility footer-heading`
(`table-head` est consommé par l'admin seulement).

Règles mesurables retenues : (1) aucun `rounded-(md|lg|xl|2xl|3xl)` (côtés compris) dans les sources
publiques, **sans exception** : chaque occurrence a son rayon nommé (`part`, `field`, `card`, `block`,
`full`) ; (2) aucun `uppercase` dans les sources publiques ; (3) le mono reste autorisé partout où il
pose une donnée (dates, durées, références, cotes, compteurs, catégories en sur-titre, code) : il n'est
pas balayé, la frontière libellé / donnée n'étant pas mécanique. Public = toute source `.ts` non spec de
`src/app` hors dossiers `admin` et `auth` (même périmètre que la commande d'inventaire).

Sweep de contrat (`header-monogram`, `not-found-home-link`, `nav-underline`, `is-link-active`,
`footer-heading`, `rounded-(md|lg|xl)`, `uppercase`, `bg-primary/5` du monogramme, `font-mono`) sur
`src/**/*.spec.ts`, `e2e/` et `ci/` : seuls `header.spec.ts` (monogramme) et `page-not-found.spec.ts`
(lien) figeaient l'ancien contrat, adaptés ci-dessous. `blog-post-row.spec.ts` (sur-titre `font-mono`,
donnée) et `blog-list.spec.ts` (teintes de la puce de filtre) restent valides. Hors tests, `icon-tile.ts`
sert aussi `login.ts` et `two-factor-verify.ts` : son rayon change pour l'auth aussi (au GREEN, le
choisir sans conflit avec le `rounded-full` posé par l'en-tête).

Mesure : les deux tranches touchent des fichiers disjoints et ont été mesurées ensemble,
sous un squelette jetable retiré après mesure (précédent : 6a) : `export const HOME_HERO_STICKER_LABEL =
''` dans `home-hero.static-data.ts`. Sur l'arbre commité, la compilation s'arrête sur `TS2724`
`HOME_HERO_STICKER_LABEL` (deux specs) : **symbole dû au GREEN**
(`src/app/features/home/domain/home-hero.static-data.ts`), aucune autre erreur de typage
(`tsc -p tsconfig.spec.json`). `prettier --check` et `eslint` des 10 specs : verts ; `pnpm a11y:typecheck` : vert.

Mesure commune : `pnpm test` le 2026-10-23 13:48, après `pnpm exec ng cache clean` et purge de
`node_modules/.vite`, code de sortie `1`, 13 failed / 4408 total ; les 13 échecs sont des
`AssertionError`, aucun échec de harnais ; les 4395 autres tests sont verts (tranches 4.1 à 6a.4
comprises).

### Tranche 6b.1 — formes des gabarits publics

- `layout/components/header/header.spec.ts` (ajout) : routeur sur `/blog` (routes de `NAV_LINKS`
  posées par `resetConfig`), la navigation principale vaut exactement `/blog` `aria-current="page"` en
  pilule (`rounded-full` et `bg-primary/8`), `/projects` et `/about` sans `aria-current` ni teinte. Rouge :
  `aria-current` absent (le lien porte bien `is-link-active`, la navigation a eu lieu).
- `header.spec.ts` (adapté) : la tuile `header-monogram` a pour seuls jetons de fond, texte, bord et
  rayon `bg-primary-bg`, `rounded-full`, `text-on-primary` (plus de teinte 5 / 8 %, plus de bord, plus de
  `rounded-xl` hérité d'`icon-tile`). Rouge : `bg-primary/5`, `border`, `border-primary/25`, `rounded-xl`.
- `pages/page-not-found.spec.ts` (adapté) : `not-found-home-link` mène à `/` et a **exactement** les
  classes d'un `<a appButton>` primaire rendu à côté (hôte de référence dans le spec). Rouge : bouton
  fait main (`rounded-lg`, `shadow-sm`, `text-sm`).
- `features/profile/application/about-what-i-do.spec.ts` (ajout) : chaque activité
  (`what-i-do-card`, **testid à poser au GREEN**) a pour jetons de rayon, bord et fond exactement
  `bg-surface border-2 border-foreground rounded-card`. Rouge : aucune carte trouvée (`[]`).
- `features/contact/application/contact-form.spec.ts` (ajout) : panneau du message (`contact-form-card`,
  **testid à poser au GREEN**), même liste. Rouge : `[]`.
- `features/blog/infra/parse-markdown.spec.ts` (ajout) : le seul rayon d'un `[data-code-block]` est
  `rounded-block`. Rouge : `rounded-lg`.
- `src/app/theme-tokens.spec.ts`, `describe('footer heading')` (ajout) : `@utility footer-heading`
  applique exactement `mb-3 text-xs font-semibold text-muted` (triés ; plus de mono, de capitales ni
  d'interlettrage). Rouge : `font-mono`, `font-medium`, `uppercase`, `tracking-[0.06em]`.
- `src/app/public-templates.spec.ts` (nouveau, lecture des sources) : aucun rayon générique dans les
  sources publiques (rouge : les 38 occurrences listées fichier par fichier) ; aucune capitale (rouge :
  `project-detail-nav.ts` ×2) ; garde « chaque `@utility` de `styles.css` a un consommateur » (`src/app`
  hors specs, `index.html` ou autre utilitaire), **verte par nature** : elle fera tomber le GREEN s'il
  retire la barre de l'en-tête sans supprimer `@utility nav-underline`.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le
2026-10-23 13:48, 9 failed / 4408 total), par assertion : `aria-current` absent, monogramme teinté,
lien fait main, cartes sans testid, `rounded-lg` du bloc de code, `footer-heading` mono majuscule,
38 rayons génériques, 2 capitales.

### Tranche 6b.2 — l'autocollant de l'accueil

- `features/home/domain/home-hero.static-data.spec.ts` (ajout) : `HOME_HERO_STICKER_LABEL` vaut
  « Fait main ». Rouge : `''` sous le squelette.
- `features/home/application/home-hero-section.spec.ts`, `describe('sticker')` (ajout ; testid
  `hero-sticker` **à poser au GREEN**) : un seul `app-sticker` dans le premier écran, c'est
  `hero-sticker` et il lit `HOME_HERO_STICKER_LABEL` ; jetons de ton et d'inclinaison exactement
  `-rotate-2 bg-sticker-sage text-on-sticker-sage` ; il suit le `h1` (`hero-headline`) dans l'ordre du
  DOM, sans titre, lien ni bouton parmi ses ancêtres, sans interactif dedans. 3 rouges : aucun
  autocollant rendu.
- `e2e/a11y/forced-colors.spec.ts` (nouveau, Playwright, harnais `a11y-test.ts`, contre l'image Docker en
  CI, **hors `pnpm test`**) : `/` sous `emulateMedia({ forcedColors: 'active' })`, `forced-colors: active`
  vérifié dans la page, un seul `app-sticker`, bord haut de `hero-sticker` à `2px` `solid` et non
  transparent. Typé par `pnpm a11y:typecheck` (vert) ; non exécuté localement (pile Docker), il tomberait
  aujourd'hui sur `hero-sticker` introuvable.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le
2026-10-23 13:48, 4 failed / 4408 total), par assertion : aucun autocollant dans le hero, libellé vide
sous le squelette.

Laissé au GREEN, hors Vitest : `DESIGN.md` § 5 (composants de page, bloc de code en `rounded-block`),
le non-recouvrement de texte à 375 px (à l'œil et par le job `a11y`), la mesure Lighthouse 6b.

## Journal des tranches

- **Tranche 4.1 — le texte reste lisible sur l'accent** : GREEN 4368 passed / 4368 total · refactor : classes de l'état sélectionné des tags factorisées dans une constante (deux palettes, un seul jeu)
- **Tranche 4.2 — le code se lit dans les deux thèmes** : GREEN 4368 passed / 4368 total · refactor : aucun
- **Tranche 4.3 — l'identité hors CSS** : GREEN 4368 passed / 4368 total · refactor : aucun
- **Tranche unique PR 5 — les titres en Bricolage Grotesque** : GREEN 4374 passed / 4374 total · refactor : aucun
- **Tranche 6a.1 — les boutons sont des pilules** : GREEN 4396 passed / 4396 total · refactor : aucun
- **Tranche 6a.2 — l'autocollant existe** : GREEN 4396 passed / 4396 total · refactor : aucun
- **Tranche 6a.3 — tampon, cartouche, cote, carte de lien, toast restylés** : GREEN 4396 passed / 4396 total · refactor : `iconClass` et `close` du toast fusionnés en un seul champ `colour` (devenus identiques une fois le survol teinté retiré)
- **Tranche 6a.4 — la carte de partage par défaut** : GREEN 4396 passed / 4396 total · refactor : aucun
- **Tranche 6b.1 — formes des gabarits publics** : GREEN 4408 passed / 4408 total · refactor : `group` retiré du lien du monogramme (plus aucun `group-hover` après l'aplat)
- **Tranche 6b.2 — l'autocollant de l'accueil** : GREEN 4408 passed / 4408 total · refactor : aucun

## Verify

Exécuté par `angular-expert` le 2026-10-22 sur la branche `feat/033-tokens` : `pnpm start` (port 4200,
SSR de dev) devant la doublure `ci/api-stub` (`PORT=3000 STUB_ADMIN_SESSION=1 node ci/api-stub/server.mjs`,
cible du proxy `/api`), navigateur intégré, `prefers-color-scheme` émulé.

Steps :

1. Clair, `/blog?tag=Angular` : fond `oklch(0.97 0.015 70)` (sable) ; puce `tag-filter-clear` sur
   `primary` à 5 %, texte `oklch(0.532 0.178 37)` ; bouton « M'écrire » aplat `oklch(0.68 0.18 48)`,
   texte `oklch(0.24 0.03 265)` (`on-primary` = `foreground`) ; monogramme de l'en-tête à 5 % ; deux
   `meta[name="theme-color"]` (`light #fcf4eb`, `dark #141a29`).
2. Clair, `/blog/article-temoin` : bloc de code, `const` en `oklch(0.515 0.16 40)`, `42` en
   `oklch(0.505 0.1 80)` (teintes `code-keyword` / `code-number` du plan).
3. Sombre, `/blog/article-temoin` : classe `app-dark` posée par la préférence système, fond bleu nuit,
   bloc de code lisible.
4. Sombre, `/does-not-exist` : fond `oklch(0.22 0.03 265)` ; lien `not-found-home-link` aplat
   `oklch(0.76 0.15 55)`, texte `oklch(0.22 0.03 265)` (`on-primary` = `background`).
5. Build de production : garde `ci.yml` « deux `theme-color` avec `media` » jouée sur
   `dist/…/mentions-legales/index.html` et `index.csr.html` : code 0.
6. `public/favicon.ico` : capture Playwright du nouveau SVG (pastille orange, « JN » bleu nuit) en 16,
   32 et 48 px, vérifiée à l'œil sur le 48 px.

Captures : `/blog?tag=Angular` clair, `/blog/article-temoin` clair et sombre, `/does-not-exist` sombre
(navigateur intégré de la session).

Console : aucune erreur JS ni d'hydratation (« Angular hydrated 16 component(s) ») ; seules erreurs,
réseau et environnementales : `GET /api/config` 404 (route absente de la doublure) et le 404 attendu du
document `/does-not-exist` ; avertissement de dev sur le préchargement d'Archivo (inchangé, PR 5).

Verdict : **PASS**.

### PR 5 (police)

Exécuté par `angular-expert` le 2026-10-22 sur la branche `feat/033-police` : `pnpm start` (port 4200,
SSR de dev) devant la doublure `ci/api-stub` (`PORT=3000 STUB_ADMIN_SESSION=1 node ci/api-stub/server.mjs`),
navigateur intégré.

Fichier de police produit hors repo (dossier vide du scratchpad), binaire identique sur deux exécutions
(SHA-256 `10dd73b15fe8917443b93d9ddf0aa1cf5d66c2e665920af37b5b9a50c192b5dd`, 37 460 octets, la valeur
d'ADR-0031) :

```sh
npm pack @fontsource-variable/bricolage-grotesque@5.3.0 --registry https://registry.npmjs.org
tar xzf fontsource-variable-bricolage-grotesque-5.3.0.tgz
python3 -m pip install --target .ft fonttools==4.67.0 brotli==1.2.0
PYTHONPATH=.ft python3 -m fontTools.varLib.instancer \
  package/files/bricolage-grotesque-latin-standard-normal.woff2 \
  opsz=48 wdth=100 wght=600:800 --no-recalc-timestamp \
  -o bricolage-grotesque-1.001-latin-opsz48-wdth100-wght600-800.woff2
```

Source : 131 548 octets, 226 points de code, `head.fontRevision` 1.001, nom ID 5 « Version 1.001 » ;
sortie : seul l'axe `wght` 600–800 reste, 226 points de code, métriques `OS/2` typo 930 / −270 / 0 sur
1 000. Licence : `LICENSE` du paquet (« Copyright 2022 The Bricolage Grotesque Project Authors », SIL OFL
1.1), copiée en `public/fonts/OFL-bricolage-grotesque.txt`.

Steps :

1. `/` à 1 024 px : `h1` en `"Bricolage Grotesque", "Bricolage Grotesque Fallback", system-ui, sans-serif`,
   graisse 800, `font-stretch` 100 %, face `Bricolage Grotesque 600 800` chargée
   (`document.fonts.check` vrai) ; ressource `/fonts/bricolage-grotesque-1.001-…woff2` lancée par le
   `link` de préchargement ; `curl` : `200`, `Content-Type: font/woff2`, `Content-Length: 37460` ; aucune
   ressource hors origine (`performance.getEntriesByType('resource')`).
2. Repli seul contre police chargée (famille du `h1` forcée sur `'Bricolage Grotesque Fallback'`, face
   `local()` chargée, puis rétablie) : boîte du `h1` **identique** au pixel près. 1 024 px : `y` 186,25,
   `w` 521,41, `h` 172,5, 3 lignes, élément suivant à `y` 402,75 dans les deux cas (largeur du texte
   470,4 contre 475,7). 375 px : `y` 128, `w` 343, `h` 112,31, 3 lignes, suivant à 280,31 dans les deux
   cas (306,3 contre 309,7). Trois premiers `h2` : hauteurs et positions identiques.
3. `/` à 375 px, rechargé : aucune entrée `layout-shift` (`PerformanceObserver`, `buffered`).
4. Build de production : `dist/…/browser/fonts/` porte les six fichiers attendus, aucun fichier Archivo ;
   le HTML prérendu précharge le nouveau fichier.

Capture : `/` à 375 px, `h1` « Tourneur CN le jour, développeur web le reste du temps. » en Bricolage
Grotesque (navigateur intégré de la session).

Console : aucune erreur JS ni d'hydratation (« Angular hydrated 12 component(s) ») ; seule erreur, réseau
et environnementale : `GET /api/config` 404 (route absente de la doublure, comme en PR 4). Plus
d'avertissement de préchargement non utilisé.

Gates : `pnpm test` (après `ng cache clean` et purge de `node_modules/.vite`) 226 fichiers, 4374/4374,
code 0 ; `pnpm lint` 0 ; `pnpm run format:check` 0 ; `pnpm run build --configuration production` 0, sans
avertissement.

Verdict : **PASS**.

### PR 6a (composants signature, carte de partage)

Exécuté par `angular-expert` le 2026-10-22 sur la branche `feat/033-composants` : `pnpm start` (port 4200,
SSR de dev) devant la doublure `ci/api-stub` (`PORT=3000 STUB_ADMIN_SESSION=1 node ci/api-stub/server.mjs`),
navigateur intégré, `prefers-color-scheme` émulé.

Carte de partage : `docs/og/og-default.html` rendu par `pnpm exec playwright screenshot --viewport-size
"1200, 630" --wait-for-timeout 500 file://$PWD/docs/og/og-default.html
public/og/julien-nedellec-20261022.png` : PNG 1200 × 630, **35 246 octets** (≤ 150 Ko), vérifié à l'œil
(fond sable, carte blanche à bord 2 px rayon 22 px, nom en Bricolage 800, accroche en JN Sans 600 sur
deux lignes équilibrées, autocollant sauge « Fait main » incliné, cote orange, adresse du site).

Steps :

1. Clair, `/projects` : boutons de l'en-tête en pilule (`border-radius` 3,36e7 px), bascule de thème
   `outlined` à 2 px `oklch(0.24 0.03 265)` ; tampons et cartouche de légende : rayon 8 px, bord 2 px
   `foreground`, fond `surface` blanc.
2. Sombre, `/blog/article-temoin` : trois cartes de lien, rayon 16 px, bord 2 px `oklch(0.96 0.01 70)`,
   fond `oklch(0.27 0.035 265)` ; bouton « J'ai trouvé ça utile » en pilule ; `og:image` =
   `…/og/julien-nedellec-20261022.png`, `twitter:card` `summary_large_image`.
3. Sombre, même page, deux toasts déclenchés par `ToastStore.add` (succès, erreur) : fond opaque
   `oklch(0.27 0.035 265)`, `backdrop-filter: none`, barre gauche 4 px de la couleur de sévérité.
4. Clair, `/` : cartouche et cote, traits de la cote à 2 px, pointes 5 / 10 px, couleur
   `oklch(0.532 0.178 37)`.
5. HTML SSR de `/` (`curl`) : `og:image`, `og:image:alt`, `og:image:width` 1200, `og:image:height` 630,
   `og:image:type` `image/png` ; `GET /og/julien-nedellec-20261022.png` : `200 image/png`.
6. Build de production : garde `ci.yml` (job `verify`) rejouée sur `dist/…/mentions-legales/index.html` et
   `index.csr.html` : l'`og:image` annoncée existe dans `dist/…/browser/`. La garde du job `docker`
   (coquille `/login`, 200 `image/png` par nginx) n'est pas rejouée en local (image Docker non construite) :
   le fichier est servi par la `location` des images de l'nginx du `Dockerfile`.

Captures : `/projects` clair, `/blog/article-temoin` sombre, `/` clair (navigateur intégré de la session).

Console : aucune erreur JS ni d'hydratation (« Angular hydrated 29 component(s) ») ; seules erreurs,
réseau et environnementales : `GET /api/config` 404 (route absente de la doublure).

Gates : `pnpm test` 227 fichiers, 4396/4396, code 0 ; `pnpm lint` 0 ; `pnpm run format:check` 0 ;
`pnpm run build --configuration production` 0.

Verdict : **PASS**.

### PR 6b (gabarits publics, autocollant de l'accueil)

Exécuté par `angular-expert` le 2026-10-23 sur la branche `feat/033-pages` : `ng serve` (port 4200, SSR de
dev) devant la doublure `ci/api-stub` (`PORT=3002 STUB_ADMIN_SESSION=1`, le port 3000 étant tenu par une
pile `a11y` Docker en cours : proxy `/api` copié vers `localhost:3002`), Chromium Playwright,
`colorScheme` clair puis sombre, viewports 375 × 800 et 1280 × 800.

Steps (8 routes × 2 thèmes × 2 largeurs) :

1. `/` : un seul `app-sticker`, `hero-sticker` « Fait main », sauge, incliné, au-dessus du cartouche,
   aligné à droite (1280 : `x` 1158, `y` 252, 90 × 33 ; 375 : `x` 270, `y` 625, sous les boutons).
   Intersection de sa boîte avec tout élément texte de la page (`h1`, `p`, `a`, `button`, cellules,
   cartouche) : **vide** aux deux largeurs et dans les deux thèmes.
2. `/blog` : navigation principale `/blog` `aria-current="page"`, `/projects` et `/about` sans ; pilule
   teintée visible.
3. `/blog/article-temoin`, `/projects`, `/projects/projet-temoin`, `/about`, `/contact`, `/page-inexistante` :
   rendus (titres « Article témoin A », « Projet témoin A »), monogramme en disque orange, lien de la 404 en
   bouton primaire.

Captures : `/` clair 1280, `/` sombre 1280, `/` clair 375 (Playwright, scratchpad de la session).

Console : aucune `pageerror`, aucune erreur d'hydratation (« Angular hydrated … 0 component(s) were
skipped ») ; seules erreurs, réseau et environnementales : `GET /api/config` 404 (route absente de la
doublure), `giscus.app` 404 (discussion inexistante), statut 404 du document SSR de dev sur les deux pages de
détail (le serveur de dev n'a pas d'`API_UPSTREAM`, le client rend ensuite la page ; aucun fichier de données
ni de routage dans le diff).

Gates : `pnpm test` 228 fichiers, 4408/4408, code 0 ; `pnpm lint` 0 ; `pnpm run format:check` 0 ;
`pnpm run build --configuration production` 0 ; `pnpm a11y:typecheck` 0.

Verdict : **PASS**.

## Review code

PR 4 (`feat/033-tokens`, `e37e6c1` RED + `8f4de5e` GREEN), revue le 2026-10-22 contre `origin/master`.

**Verdict** : APPROVED
**Gates CI locaux** : tests ✅ (`pnpm test` après `pnpm exec ng cache clean` + purge `node_modules/.vite` : 225 fichiers, 4368/4368, exit 0) / lint ✅ (`pnpm lint`, exit 0) / format ✅ (`pnpm run format:check`, exit 0) / build ✅ (`pnpm run build --configuration production`, exit 0, postbuild CSP sur 3 pages)
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main (archéologie, `text-white`, `accent-primary-bg`, `bg-primary/≥9`, couleurs Tailwind par défaut, `--color-accent`, balayage de recalibration sur `src`, `e2e`, `ci`, `.github`)
**Warnings de gate** : aucun (test, lint, format, build)
**Rendu compilé** : ✅ (CSS de prod : `text-on-primary`, `accent-primary`, `bg-primary/8` et les deux `--theme-on-primary` présents ; garde `ci.yml` rejouée sur `dist/` : code 0)
**Preuve de verify runtime** : ✅ (preuve `## Verify` cohérente, rejouée : `pnpm start` + doublure, `/blog?tag=Angular` en clair, `/blog/article-temoin` en sombre, valeurs calculées conformes, console sans erreur JS ni d'hydratation)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅

Contrastes recalculés indépendamment (OKLCH → sRGB, minimum flottant / 8 bits) : tous conformes au plan à ± 0,01 ; tous les `--theme-*` OKLCH dans le gamut sRGB.

**Tests notables** :
- ⚠️ `src/app/features/blog/application/blog-tag-palette.spec.ts:15` — `accentTints` local qui duplique la regex de `@shared/testing/accent-tints`. Suggestion : un seul helper.
- ⚠️ `src/app/pages/page-not-found.spec.ts:27` et `src/app/features/auth/application/two-factor-enable-form.spec.ts:60` — même filtre de couleurs recopié à 2 sites.
- ✨ `src/app/theme-tokens.spec.ts` — golden `toEqual` sur les tokens et carte exacte de `@theme` : la dérive d'un token ou un `--color-*` orphelin casse la suite.

**Risque résiduel** (advisory, § 8) :
- réversibilité : profil absent · monitoring : Sentry (profil)
- non couvert par les gates : la règle « teinte ≤ 8 % sous texte orange » (survols) ne tient que par la revue ; les contrastes réels restent prouvés par le job `a11y` en CI.

**Points non bloquants (à statuer par la session principale)** :
1. `src/app/features/blog/application/blog-tag-palette.ts:9-19` — `solid` n'a aucun consommateur (seul `tint` est lu, par `blog-tag-link.ts:25` et `admin-tags-selector.ts:150`, et ce depuis #228). La PR y ajoute `SELECTED_TAG_CLASSES` et 6 cas de test, et `DESIGN.md:337` le décrit comme un état rendu. À remonter à `architect` : supprimer `solid` (et ses tests), ou dire dans `DESIGN.md` que l'état n'est rendu nulle part.
2. `src/app/shared/ui/toast.ts:20,23`, `src/app/features/auth/pages/login/login.ts:24`, `src/app/features/auth/pages/two-factor-verify/two-factor-verify.ts:24` restent à `bg-primary/10`. Acceptable : sous ces teintes, l'orange ne colore que des icônes (contenu non textuel : 4,50:1 ≥ 3:1) ; le texte du toast est `foreground`. Le toast est restylé en PR 6a.
3. `docs/adr/0030-*.md:3` — statut « proposé », passe à « accepté » au merge de cette PR.
4. `.claude/project-profile.md:109` cite encore `--color-accent` (supprimé) parmi les tokens-clés.

**Suites (2026-10-22, commit `81d02ab`)** : point 1, `solid` supprimé avec ses tests (aucun état sélectionné
de tag n'est affiché ; `DESIGN.md` le dit) ; point 2 laissé tel quel (icônes, PR 6a pour le toast) ; points 3
et 4 appliqués.

## Mesure Lighthouse (PR 4)

2026-10-22. Base `origin/master` `4c54e0b`, branche `8f4de5e` ; images Docker servies tour à tour derrière la
doublure, Lighthouse 12.8.2 (`chrome-headless-shell` de Playwright), mobile simulé et desktop, 5 passes
alternées, requêtes tierces bloquées ; 120 rapports.

| Page | Profil | Perf (base → branche) | A11y / BP / SEO | LCP ms | CLS | Élément LCP |
|---|---|---|---|---|---|---|
| `/` | mobile | 87 → 88 | 100 / 96 / 100 | 3251 → 3145 | 0,0029 = | `p` 5/5 → `p` 3/5, `h1` 2/5 |
| `/` | desktop | 99 → 99 | 100 / 96 / 100 | 562 → 562 | 0,0718 = | `h1`, identique |
| `/blog` | mobile | 91 → 92 | 100 / 96 / 100 | 3276 → 3271 | 0,0027 = | `p` majoritaire, identique |
| `/blog` | desktop | 100 → 100 | 100 / 96 / 100 | 735 → 731 | 0,0015 = | identique |
| `/blog/article-temoin` | mobile | 90 → 91 | 100 / 96 / 100 | 2757 → 2854 | 0,0013 = | identique |
| `/blog/article-temoin` | desktop | 100 → 100 | 100 / 96 / 100 | 642 → 643 | 0,0009 = | identique |
| `/projects` | mobile | 91 → 90 | 100 / 96 / 100 | 3282 → 3424 | 0,0053 = | identique |
| `/projects` | desktop | 100 → 100 | 100 / 96 / 100 | 644 → 643 | 0,0095 = | identique |
| `/projects/projet-temoin` | mobile | 92 → 92 | 100 / 96 / 100 | 2855 → 2854 | 0,0050 = | `h1` majoritaire, identique |
| `/projects/projet-temoin` | desktop | 100 → 100 | 100 / 96 / 100 | 644 → 645 | 0,0052 = | identique |
| `/about` | mobile | 91 → 92 | 100 / 96 / 100 | 3163 → 3164 | 0,0220 = | identique |
| `/about` | desktop | 100 → 100 | 100 / 96 / 100 | 730 → 733 | 0,0006 = | identique |

Octets de police transférés sur `/` : 92 187 en base comme en branche.

- **Non-dégradation > 2 points** : PASS (pire écart −1, Perf mobile `/projects`).
- **CLS** : identique à la base sur les 12 combinaisons, mais **jamais 0, base comprise** (max 0,0718 sur `/`
  desktop, décalage de `app-home-hero-section > div.page-container`, présent sur `master`). Le critère « CLS
  médian 0 » n'est donc pas tenable tel quel : pour les PR 4 à 6b, le critère appliqué est **CLS médian ≤ base**,
  et le décalage du hero est un suivi à part (hors spec 033).
- **Élément LCP** : identique sur 11 combinaisons ; sur `/` mobile, 2 passes retiennent le `h1` au lieu du `p`
  en fondu retardé (mêmes dimensions qu'en base) : variance liée à l'animation, pas un changement de rendu.

## Review code (PR 5)

PR 5 (`feat/033-police`, `a6b9519` RED + `2276f2a` GREEN), revue le 2026-10-22 contre `origin/master`.

**Verdict** : REJECTED
**Gates CI locaux** : tests ✅ (`pnpm test` après `pnpm install --frozen-lockfile`, `pnpm exec ng cache clean` et purge de `node_modules/.vite` : 226 fichiers, 4374/4374, exit 0) / lint ✅ (`pnpm lint`, exit 0) / format ✅ (`pnpm run format:check`, exit 0) / build ✅ (`pnpm run build --configuration production` sur `dist/` vidé, exit 0, postbuild CSP sur 3 pages)
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main (`archivo` insensible à la casse sur `src`, `public`, `ci`, `.github`, `e2e`, `dist` : 0 hors docs historiques et ADR ; `font-stretch` sur `src`, `public`, `ci`, `.github`, `e2e` hors specs et CSS compilé : 0 ; archéologie des commentaires ajoutés : 0 ; `font-src` : ligne CSP d'`index.html` hors diff)
**Warnings de gate** : aucun (test, lint, format, build)
**Rendu compilé** : ✅ (CSS de prod : face `Bricolage Grotesque` et son repli avec les valeurs du plan, aucun `font-stretch` ; `index.csr.html` et `mentions-legales/index.html` préchargent le seul nouveau fichier ; `dist/…/browser/fonts/` = six fichiers, aucun Archivo)
**Preuve de verify runtime** : ✅ (preuve `## Verify` › « PR 5 (police) » complète et cohérente avec le diff ; rejouée : `pnpm start` + doublure, `/` : `h1` en `"Bricolage Grotesque", "Bricolage Grotesque Fallback", system-ui, sans-serif`, 800, `font-stretch` 100 %, face `600 800` chargée, ressource lancée par le `link` de préchargement, `200 font/woff2 37460`, aucune ressource hors origine ; console : hydratation OK (12 composants), seuls des 404 `/api/*` de la doublure, sans rapport avec le diff)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ❌ (mesure Lighthouse de la PR 5 absente, `DESIGN.md` § 3 incohérent)

Reproductibilité : commande de la preuve rejouée dans un dossier vide (`npm pack @fontsource-variable/bricolage-grotesque@5.3.0`, fontTools 4.67.0 + brotli 1.2.0, instancer `opsz=48 wdth=100 wght=600:800 --no-recalc-timestamp`) : SHA-256 `10dd73b15fe8917443b93d9ddf0aa1cf5d66c2e665920af37b5b9a50c192b5dd`, 37 460 octets, **identique** au fichier commité ; seul axe restant `wght` 600–800, `fontRevision` 1.001, 226 points de code, `OS/2` typo 930 / −270 / 0. Licence : `public/fonts/OFL-bricolage-grotesque.txt` identique octet pour octet au `LICENSE` du paquet (OFL 1.1, copyright sans *Reserved Font Name*). Retrait des largeurs : 12 lignes dans 11 gabarits, seul `font-stretch-*` / `[font-stretch:104%]` retiré (le reste est un reformatage Prettier d'`admin-layout.ts`). ADR-0006 (statut amendé) et ADR-0031 (accepté) à jour ; `DESIGN.json` déjà à Bricolage Grotesque depuis la PR 3. Rien des PR 6a/6b. Aucun test existant modifié.

**Tests notables** :
- ✨ `src/app/display-font.spec.ts:52-71` — golden `toEqual` sur les déclarations exactes des deux faces : un `font-stretch` réintroduit ou une métrique de repli dérivée casse la suite.
- ✨ `src/app/display-font.spec.ts:143-151` — balayage `fichier:ligne` des gabarits : la régression se lit directement dans l'échec.

**Risque résiduel** (advisory, § 8) :
- réversibilité : profil absent · monitoring : Sentry (profil)
- non couvert par les gates : le job `a11y` (contrastes, clair et sombre) ne tourne qu'en CI ; l'œil optique 48 reste à valider à l'œil par le propriétaire (décision de goût 5).

**Points à corriger** :
1. `DESIGN.md:258` — « 37 460 octets, 5,2 % de moins qu'Bricolage Grotesque » : remplacement mécanique qui compare la police à elle-même. Attendu : « 5,2 % de moins qu'Archivo » (ou « que l'ancienne police de titres, Archivo »).
2. `specs/033-nouveau-visuel.md` (§ Vérifications, l. 602-608, et l. 749 « Laissé au GREEN … plus Lighthouse ») — la mesure Lighthouse avant / après de la PR 5 n'est pas faite : aucune section « Mesure Lighthouse (PR 5) ». Critères à rapporter comme pour la PR 4 : médianes non dégradées de plus de 2 points, CLS médian ≤ base, élément LCP identique, **octets de police transférés sur `/` ≤ base** (attendu : − 2 052).


**Suites (2026-10-22)** : point 1 corrigé (`DESIGN.md` : « 5,2 % de moins qu'Archivo ») ; point 2, mesure
ci-dessous.

## Mesure Lighthouse (PR 5)

2026-10-22. Base : image de la PR 4 (rendu de `master` `e094f84`), branche `2276f2a` ; même protocole que la
PR 4 (doublure, Lighthouse 12.8.2, mobile et desktop, 5 passes alternées, tiers bloqués), 120 rapports.

| Page | Profil | Perf (base → branche) | A11y / BP / SEO | LCP ms | CLS | Élément LCP |
|---|---|---|---|---|---|---|
| `/` | mobile | 88 → 91 | 100 / 96 / 100 | 3223 → 2703 | 0,0029 → 0,0028 | `p` / `h1` en fondu, même mélange |
| `/` | desktop | 99 → 100 | 100 / 96 / 100 | 562 → 562 | **0,0718 → 0,0018** | `h1`, identique |
| `/blog` | mobile | 94 → 94 | 100 / 96 / 100 | 2853 → 2852 | 0,0027 = | `p` de ligne 5/5 → 4/5 |
| `/blog` | desktop | 100 → 100 | 100 / 96 / 100 | 657 → 733 | 0,0015 → 0,0013 | `h1` / `p` en fondu, même mélange |
| `/blog/article-temoin` | mobile | 92 → 92 | 100 / 96 / 100 | 2853 → 2751 | 0,0013 → 0,0005 | identique |
| `/blog/article-temoin` | desktop | 100 → 100 | 100 / 96 / 100 | 618 → 643 | 0,0009 → 0,0008 | identique |
| `/projects` | mobile | 90 → 90 | 100 / 96 / 100 | 3427 → 3427 | 0,0053 → 0,0050 | identique |
| `/projects` | desktop | 100 → 100 | 100 / 96 / 100 | 643 → 643 | 0,0095 → 0,0078 | identique |
| `/projects/projet-temoin` | mobile | 92 → 92 | 100 / 96 / 100 | 2855 → 2855 | 0,0050 → 0,0048 | identique |
| `/projects/projet-temoin` | desktop | 100 → 100 | 100 / 96 / 100 | 644 → 645 | 0,0052 → 0,0037 | identique |
| `/about` | mobile | 92 → 91 | 100 / 96 / 100 | 3163 → 3158 | 0,0220 → 0,0222 | identique |
| `/about` | desktop | 100 → 100 | 100 / 96 / 100 | 731 → 726 | 0,0006 = | identique |

- **Non-dégradation > 2 points** : PASS (pire écart −1, Perf mobile `/about`).
- **CLS ≤ base** : PASS sur 11 combinaisons ; `/about` mobile 0,0220 → 0,0222 (bruit, sans titre en jeu sur
  l'élément qui bouge, une image). Le décalage du hero en desktop, relevé en PR 4, venait d'Archivo : il
  disparaît (0,0718 → 0,0018).
- **Élément LCP** : mêmes candidats ; sur `/`, `/blog`, `/projects`, alternance `h1` / `p` en fondu déjà
  présente en base.
- **Octets de police transférés sur `/`** : 92 187 → 90 135 (− 2 052, la différence Archivo / Bricolage de
  l'ADR-0031), à chaque passe.
- **Police de titres bloquée** (repli seul, `/`, 1 passe) : CLS 0,0082 en desktop, 0,0028 en mobile, sous la
  base dans les deux cas.

## Review code (PR 6a)

PR 6a (`feat/033-composants`, `af50ec8` RED + `0a83e5f` GREEN), revue le 2026-10-23 contre `origin/master` (`86f54ba`).

**Verdict** : REJECTED
**Gates CI locaux** : tests ✅ (`pnpm test` : 227 fichiers, 4396/4396, exit 0) / lint ✅ (`pnpm lint`, exit 0) / format ✅ (`pnpm run format:check`, exit 0) / build ✅ (`pnpm run build --configuration production`, exit 0, postbuild CSP sur 3 pages)
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main sur les lignes ajoutées (motif d'archéologie du profil : 5 hits, 4 retenus ; `export default`, `effect(`, `innerHTML`/`bypassSecurity`, `console.`, `fakeAsync`/`waitForAsync`, `@capacitor`, snapshots, `.only`/`.skip`, `fireEvent` : 0 hit ; balayage `[rounded]`, `rounded()`, `avatar.png`, « Photo de profil » sur `src`, `e2e`, `ci`, `.github` : 0 hit)
**Warnings de gate** : aucun (test, lint, format, build)
**Rendu compilé** : ✅ (CSS de prod : `--radius-part`, `.rounded-part`/`-field`/`-card`, `.bg-sticker-sage`, `forced-colors:border-[CanvasText]` → `border-color:CanvasText` présents ; garde `ci.yml` du job `verify` rejouée sur `mentions-legales/index.html` et `index.csr.html` : `og/julien-nedellec-20261022.png` existe dans `dist/…/browser/`)
**Preuve de verify runtime** : ✅ (`## Verify` › PR 6a : steps, PASS, captures, console sans erreur JS ni d'hydratation ; surfaces cohérentes avec le diff)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ❌ (archéologie, point 1 ; le reste conforme)
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅

Plan tenu : bouton en pilule dans la base, entrée `rounded` retirée (directive, `header.ts` ×2, spec), `outlined` et `outlined-danger` en `border-2`, `ghost-icon` `rounded-full`, `min-h-11`/`size-11`/`min-w-11` intacts ; `Sticker` à API fermée (`StickerTone`, `StickerTilt`), classes exactes du plan, `forced-colors`, ni rôle, ni `tabindex`, ni `aria-*` ; tampon neutre, cartouche (`cartouche-head`, `overflow-hidden`), cote 2 px et pointes 5/10 px, carte de lien `rounded-card border-2`, toast opaque sans flou ; quatre rayons `@theme`, `form-input`/`app-select` en `rounded-field` ; `DEFAULT_SHARE_IMAGE`, `seo.ts` (`summary_large_image` constant), `index.html` (+ width/height/type), PNG 1200 × 630 de 35 246 octets, une seule carte datée ; deux gardes `ci.yml`. Rien de la PR 6b (aucun consommateur de `app-sticker`, `HOME_HERO_STICKER_LABEL` absent). Aucun spec modifié entre RED et GREEN ; les specs adaptés renforcent (`link-card` passe d'`arrayContaining` à liste exacte), aucun n'affaiblit.

Écarts déclarés, jugés :
- alt écrit en dur dans `shared/seo/share-image.ts` : accepté. Le plan prescrit déjà un littéral, et `share-image.spec.ts` épingle `alt` = « Julien Nédellec. » + `STATIC_HERO.headline` : une dérive de l'accroche casse la suite.
- `.gitignore` `!/docs/og/` : accepté, nécessaire (`/docs/*` exclu, sinon la source du PNG n'est pas versionnée).
- fusion `iconClass`/`close` en `colour` (`toast.ts`) : acceptée, les deux valeurs étaient identiques après retrait du survol teinté.
- garde du job `docker` non rejouée en local : acceptée, la CI la joue. Script relu : `curl -fsS` de `/login`, extraction de l'`og:image`, test `200 image/png`.
- `e2e/a11y/forced-colors.spec.ts` reporté en 6b.2 : accepté (motif écrit au plan de test ; le contour reste porté par la classe testée).
- `DESIGN.json` non modifié : déjà à l'état cible depuis la PR 3 (`.ds-sticker`, `.ds-btn-outlined` 2 px, `.ds-card` 16 px, `.ds-input` 12 px).

Contrastes recalculés indépendamment (OKLCH → sRGB, WCAG), Sable / Nuit :
- bord `foreground` 2 px : 16,47 / 13,43 sur `surface`, 15,08 / 15,42 sur `background` ;
- bord de survol `primary` de la carte de lien : 5,69 / 6,74 sur `surface`, 5,21 / 7,74 sur `background` ;
- autocollant : sauge 8,10 / 7,57, lavande 8,44 / 7,93 ;
- toast sur `surface` (icône et bouton fermer, survol `foreground/5` entre parenthèses) : succès 6,16 (5,59) / 7,99 (6,96), alerte 6,20 (5,63) / 8,88 (7,74), erreur 6,63 (6,02) / 5,67 (4,94), info 5,69 (5,17) / 6,74 (5,87) ; titre `foreground` 16,47 / 13,43. Tout ≥ 4,5:1, au-delà de 3:1 pour les icônes.

Carte `public/og/julien-nedellec-20261022.png` regardée : conforme au plan (fond sable, carte blanche à bord sombre et grand rayon, nom en Bricolage, accroche sur deux lignes, autocollant sauge incliné, cote orange « depuis 2025 », information déjà dans `SITE_IDENTITY`, adresse du site ; ni photo ni dégradé).

`DESIGN.md` § 5 décrit les classes en place : bouton, carte de lien, cartouche, autocollant (nouveau), tampon, cote, champs, toast.

**Tests notables** :
- ✨ `src/app/shared/seo/share-image.spec.ts` : relie l'alt à l'accroche, le nom du fichier au dossier `public/og/` et l'en-tête PNG aux dimensions annoncées. Une carte renommée sans mise à jour de la constante casse la suite.
- ✨ `src/app/browser-identity.spec.ts` : parité `index.html` ↔ `DEFAULT_SHARE_IMAGE`, filet des coquilles CSR.
- ✨ `src/app/shared/ui/link-card.spec.ts:82` : passage d'`arrayContaining` à la liste exacte, une classe parasite ne passe plus.

**Risque résiduel** (advisory, § 8) :
- réversibilité : profil absent · monitoring : Sentry (profil)
- non couvert par les gates : la garde `docker` (coquille `/login` → PNG servi par nginx) n'est prouvée qu'en CI ; la carte lue par un validateur Open Graph se vérifie en production ; le contour en couleurs forcées n'est éprouvé en navigateur qu'en 6b.2.

**Points à corriger** :
1. Archéologie (§ 2bis, motif du profil `ADR-[0-9]|spec [0-9]{3}`) : retirer la référence et garder le WHY d'une ligne, sur les 4 sites du diff :
   - `src/app/shared/seo/share-image.ts:10` : « Nom daté (ADR-0007) : … » ; écrire « Nom daté : un réseau social garde la carte en cache par URL, on la renomme à chaque refonte. »
   - `.github/workflows/ci.yml:92` : « nom daté (ADR-0007) » ; retirer `(ADR-0007)`.
   - `docs/og/og-default.html:3` : « …julien-nedellec-AAAAMMJJ.png, ADR-0007) » ; retirer `, ADR-0007`. La procédure de rendu (l. 4-6) peut rester : c'est le mode d'emploi du fichier source.
   - `.gitignore:9` : la ligne est réécrite par le diff et porte `(spec 030)` ; retirer la référence (« les brouillons d'articles »).

**Suites (2026-10-23)** : les quatre références d'archéologie retirées des commentaires (`share-image.ts`,
`ci.yml`, `og-default.html`, `.gitignore`). Décision du propriétaire du 2026-10-23 : la cote de la carte de
partage porte une durée, « depuis 2025 » (règle des cotes de `DESIGN.md`), au lieu de « Angular · NestJS » ;
carte re-rendue (`8425fa5`, 34 543 octets).

## Mesure Lighthouse (PR 6a)

2026-10-23. Base : image de la PR 5 (`2276f2a`, rendu identique à `master` `86f54ba`), branche `0a83e5f`
(`8425fa5` et `d78e2c4` ne touchent ni le rendu ni le code chargé). Même protocole (doublure, Lighthouse 12.8.2,
mobile et desktop, 5 passes alternées, tiers bloqués), 120 rapports ; recontrôle de `/` et `/about` mobile sur
machine calme (20 rapports), la première série ayant tourné pendant des builds parallèles.

| Page | Profil | Perf (base → branche) | A11y / BP / SEO | LCP ms | CLS | Élément LCP |
|---|---|---|---|---|---|---|
| `/` | mobile (recontrôle) | 87 → 86 | 100 / 96 / 100 | 3263 → 3194 | 0,0028 → 0,0033 | `p` / `h1` en fondu, même mélange |
| `/` | desktop | 100 → 100 | 100 / 96 / 100 | 562 → 562 | 0,0018 → 0,0021 | `h1`, identique |
| `/blog` | mobile | 91 → 91 | 100 / 96 / 100 | 3278 → 3275 | 0,0027 → 0,0032 | même mélange |
| `/blog` | desktop | 98 → 100 | 100 / 96 / 100 | 747 → 717 | 0,0013 = | même mélange |
| `/blog/article-temoin` | mobile | 67 → 91 (bruit base) | 100 / 96 / 100 | 2897 → 2856 | 0,0003 → 0,0005 | identique |
| `/blog/article-temoin` | desktop | 88 → 92 | 100 / 96 / 100 | 619 → 628 | 0,0008 = | identique |
| `/projects` | mobile | 65 → 66 | 100 / 96 / 100 | 3666 → 3656 | 0,0049 → 0,0084 | même mélange |
| `/projects` | desktop | 98 → 100 | 100 / 96 / 100 | 692 → 643 | 0,0078 → 0,0119 | identique |
| `/projects/projet-temoin` | mobile | 81 → 87 | 100 / 96 / 100 | 2865 → 2854 | 0,0048 → 0,0052 | `h1` majoritaire |
| `/projects/projet-temoin` | desktop | 92 → 100 | 100 / 96 / 100 | 646 → 649 | 0,0037 → 0,0042 | identique |
| `/about` | mobile (recontrôle) | 91 → 91 | 100 / 96 / 100 | 3157 → 3160 | 0,0222 = | identique |
| `/about` | desktop | 100 → 100 | 100 / 96 / 100 | 725 → 699 | 0,0006 = | identique |

- **Non-dégradation > 2 points** : PASS après recontrôle (la série brute donnait `/` mobile 88 → 68 : TBT
  multiplié sur le même chunk, base touchée de la même façon ailleurs, signature d'un CPU chargé).
- **CLS ≤ base** : **non tenu**, petites hausses réelles et reproductibles sur 7 combinaisons : nouveau décalage
  `app-cartouche > dl` sur `/` (0,0032, à la place de `h1 > span` 0,0027), `section.mt-12` de `/projects`
  (0,0078 → 0,0119 desktop), lignes du blog, choix techniques de la fiche projet. Maximum 0,0119, très loin du
  seuil « bon » de 0,1. **Arbitrage du propriétaire (2026-10-23)** : accepté et noté ; correction en suivi à
  part (réserver la hauteur du cartouche et des sections à traits de 2 px avant hydratation). Pour la PR 6b, le
  critère devient **CLS médian < 0,02** par page et profil.
- **Élément LCP** : mêmes candidats (alternance `h1` / `p` d'en-tête déjà présente en base) ; aucun nouveau
  composant ni image ne devient élément LCP.
- **Octets de police sur `/`** : 90 135 des deux côtés.

## Review code (PR 6b)

PR 6b (`feat/033-pages`, `2fe94fc` RED + `ef77fde` GREEN), revue le 2026-10-23 contre `feat/033-composants` (`d78e2c4`, PR 6a non mergée).

**Verdict** : REJECTED
**Gates CI locaux** : tests ✅ (`pnpm test` : 228 fichiers, 4408/4408, exit 0 ; `tsc -p tsconfig.spec.json --noEmit` exit 0) / lint ✅ (`pnpm lint`, exit 0) / format ✅ (`pnpm run format:check`, exit 0) / build ✅ (`pnpm run build --configuration production`, exit 0, postbuild CSP sur 3 pages) / `pnpm a11y:typecheck` ✅ (exit 0)
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main sur les lignes ajoutées (motif d'archéologie du profil : 0 hit ; `export default`, `effect(`, `innerHTML`/`bypassSecurity`, `console.`, `fakeAsync`/`waitForAsync`, snapshots, `.only`/`.skip`, boucles générant des `it` : 0 hit)
**Warnings de gate** : aucun (test, lint, format, build, a11y:typecheck)
**Rendu compilé** : ✅ (CSS de prod : `.rounded-card`, `.rounded-block`, `.rounded-part`, `.bg-primary\/8`, `.bg-sticker-sage`, `.-rotate-2` présents ; `.footer-heading` = marge, `text-xs`, `font-semibold`, `muted`, sans mono ni capitales ; `nav-underline` absent. Aucun composant à sélecteur attribut touché)
**Preuve de verify runtime** : ✅ (`## Verify` › PR 6b : 8 routes × 2 thèmes × 2 largeurs, PASS, captures, aucune `pageerror` ni erreur d'hydratation ; surfaces cohérentes avec le diff)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ❌ (`DESIGN.json` contredit le code en place, point 1)

Plan tenu : 19 fichiers aux rayons nommés selon le rôle (`part` vignettes, squelettes et anneaux de focus ; `card` dialogues, toast, dropzone, grille de stack ; `block` couvertures, portrait, bloc de code, galerie ; `full` boutons faits main, puces, entrées de navigation) ; cartes `what-i-do-card` et `contact-form-card` en `rounded-card border-2 border-foreground bg-surface` ; navigation principale et tiroir en pilule `bg-primary/8 text-primary` avec `ariaCurrentWhenActive="page"` ; `@utility nav-underline` supprimé (garde « chaque `@utility` a un consommateur » verte) ; monogramme en aplat `bg-primary-bg text-on-primary rounded-full` ; lien de la 404 en `<a appButton>` primaire sans classe propre ; `footer-heading` en JN Sans `font-semibold` ; plus aucun `uppercase` public (`project-detail-nav.ts` ×2) ; garde mécanique `public-templates.spec.ts` sur les 40 fichiers (aucun `rounded-(md…3xl)`, aucun `uppercase`). Autocollant : un seul `app-sticker`, « Fait main » (`HOME_HERO_STICKER_LABEL`), sauge, `tilt="left"`, dans la colonne du cartouche après le `h1` (`app-home-hero`) dans l'ordre du DOM, hors titre, lien et bouton, aucun interactif dedans ; le domaine n'importe pas `shared/ui`. Auth via `icon-tile.ts` : disque pour `login` et `two-factor-verify`, aucune classe de rayon concurrente chez les consommateurs ; icône décorative (bouclier), teintes `primary/10` pré-existantes, gabarits auth inchangés comme le prescrit le plan.

Tests : aucun spec modifié entre RED et GREEN. Les seules lignes retirées sont les trois « (spec 029) » des titres (demandé) et les deux anciens contrats (monogramme teinté, lien de la 404 fait main), remplacés par des assertions plus fortes (liste exacte des jetons du monogramme ; classes du lien égales à celles d'un `appButton` de référence). `accentTints` garde quatre consommateurs. `e2e/a11y/forced-colors.spec.ts` suit le harnais (`./a11y-test`, fixture `visit`, `testDir: ./a11y`, thème par défaut) ; typé par `pnpm a11y:typecheck`, exécuté en CI seulement.

Contrastes recalculés indépendamment (OKLCH → sRGB, WCAG 2.x), Sable / Nuit :
- entrée de navigation active, `primary` sur `primary/8` composé sur `background` : 4,63 / 6,84 (≥ 4,5:1, texte 15 px `font-medium`) ; sur l'en-tête `background/80` posé sur `surface` : 4,71 / 6,65 ;
- monogramme `on-primary` sur `primary-bg` : 5,36 / 7,74 (valeurs du plan confirmées) ;
- liens inactifs `muted` sur `background` : 6,82 / 8,66.

`DESIGN.md` : encadré « État (2026-10-23) » à jour (direction entièrement en place) ; § 5 décrit le code en place (rayons, cartes publiques, galerie, couvertures, bloc de code, navigation et monogramme, pied de page, autocollant de l'accueil, 404, toast). `DESIGN.json` : non à jour, point 1.

**Tests notables** :
- ✨ `src/app/public-templates.spec.ts` : garde des sources publiques (rayons génériques, capitales) et des `@utility` orphelins ; une régression future d'un gabarit ou un utilitaire mort casse la suite.
- ✨ `src/app/pages/page-not-found.spec.ts` : compare au rendu réel d'un `appButton` de référence plutôt qu'à une liste figée ; suit la directive sans recalibrage.
- ✨ `src/app/layout/components/header/header.spec.ts` : navigation réelle du routeur, `aria-current` et pilule sur la seule entrée active.

**Risque résiduel** (advisory, § 8) :
- réversibilité : profil absent · monitoring : Sentry (profil)
- advisory, non bloquant : `routerLinkActive` non exact pose `aria-current="page"` sur « Blog » aussi sous `/blog/<slug>` (la section, pas la page) ; acceptable, `aria-current="true"` serait plus exact sur les sous-pages.
- advisory, non bloquant : dans le tiroir, `hover:bg-foreground/5` remplace la teinte `primary/8` de l'entrée active au survol (cosmétique).
- advisory, non bloquant : `blog-like-button.ts` reste un bouton fait main (pilule) ; le plan ne nomme que la 404 pour `appButton`.
- non couvert par les gates : `forced-colors.spec.ts` et l'axe des pages publiques ne tournent qu'en CI (pile Docker) ; mesure Lighthouse 6b pas encore inscrite dans la spec.

**Points à corriger** :
1. `DESIGN.json:272-277` (composant « Navigation Link », `nav-link`) : décrit une entrée active en « pilule pleine couleur du texte » (`background: #181f2e; color: #fcf4eb`), `min-height: 44px`, `padding: 0 12px`, alors que le code (`header.ts:43-46`) et `DESIGN.md` § 5 « Navigation » posent `rounded-full px-3.5 py-1.5`, active `bg-primary/8 text-primary`. Le miroir doit décrire le code en place (règle du plan : le document ne décrit jamais des classes absentes du code) : réécrire `description` et `css` (`.ds-nav-link[aria-current=page] { background: color-mix(in srgb, #bc3700 8%, transparent); color: #bc3700; }`, padding `6px 14px`), et trancher la hauteur : retirer `min-height: 44px` du miroir (l'entrée desktop mesure environ 34 px, au-dessus du minimum WCAG 2.5.8 de 24 px) ou ajouter `min-h-11` au lien dans `header.ts` si la règle « Cibles tactiles : 44 × 44 px » de `DESIGN.md` § 4 doit s'appliquer aux entrées de navigation.

**Suites (2026-10-23)** : `DESIGN.json` « Navigation Link » réécrit d'après le code. Hauteur tranchée en
faveur de la règle existante de `DESIGN.md` § 4 (cibles de 44 px) : liens de navigation desktop en
`inline-flex min-h-11 items-center` (`header.ts`), `DESIGN.md` § 5 aligné. Remarques non bloquantes laissées
en l'état (`aria-current` sur « Blog » sous `/blog/<slug>` : comportement voulu de la rubrique).

## Mesure Lighthouse (PR 6b)

2026-10-23. Base : image de la PR 6a (`0a83e5f`, rendu de `master` `aa3b9e2`), branche `3916e20` ; même protocole
(doublure, Lighthouse 12.8.2, mobile et desktop, 5 passes alternées, tiers bloqués, machine sans autre charge),
120 rapports.

| Page | Profil | Perf (base → branche) | A11y | LCP ms | CLS | Élément LCP |
|---|---|---|---|---|---|---|
| `/` | mobile | 87 → 82 | 100 → 100 | 3225 → 3246 | **0,0033 → 0,1652** | même mélange `h1` / `p` |
| `/` | desktop | 100 → 100 | 100 → 100 | 562 → 562 | 0,0021 → 0,0031 | `h1`, identique |
| `/blog` | mobile | 91 → 90 | 100 → 100 | 3279 → 3363 | 0,0032 = | même mélange |
| `/blog` | desktop | 98 → 97 | 100 → 100 | 897 → 909 | 0,0013 = | même mélange |
| `/blog/article-temoin` | mobile | 68 → 91 (bruit base) | 100 → 100 | 2856 → 2853 | 0,0002 → 0,0005 | identique |
| `/blog/article-temoin` | desktop | 93 → 100 | 100 → 100 | 645 → 646 | 0,0008 = | identique |
| `/projects` | mobile | 89 → 90 | 100 → 100 | 3484 → 3422 | 0,0084 = | même mélange |
| `/projects` | desktop | 100 → 100 | 100 → 100 | 619 → 644 | 0,0119 → 0,0120 | identique |
| `/projects/projet-temoin` | mobile | 89 → 88 | 100 → 100 | 2857 → 2856 | 0,0052 = | `h1` majoritaire |
| `/projects/projet-temoin` | desktop | 100 → 100 | 100 → 100 | 649 → 646 | 0,0042 = | identique |
| `/about` | mobile | 89 → 91 | 100 → 100 | 3165 → 3156 | 0,0222 = | identique |
| `/about` | desktop | 100 → 100 | 100 → 100 | 734 → 731 | 0,0006 = | identique |

**Régression trouvée et corrigée** : sur `/` mobile, l'autocollant, posé dans le flux au-dessus du cartouche,
était placé puis replacé pendant le chargement (trace : nœud déplacé de `[0, 0]` à `[329, 597]`) et déplaçait le
cartouche (CLS 0,1652, au-delà du seuil de 0,1). Correctif : autocollant hors du flux (`absolute top-0 right-0`)
dans une colonne `relative pt-10` qui lui réserve sa place ; rendu visuel inchangé. Remesure de `/` après
correctif (3 passes par profil) : mobile Perf 90 / 90 / 93, CLS 0,0121 / 0,0121 / 0,0029 ; desktop Perf 100,
CLS 0,0089 / 0,0053 / 0,0120. Les autres pages ne contiennent pas l'autocollant.

- **Non-dégradation > 2 points** : PASS après correctif (`/` mobile 87 → 90–93).
- **CLS médian < 0,02** (critère fixé à la PR 6a) : PASS sur toutes les pages après correctif.
- **Élément LCP** : mêmes candidats partout.
- **Octets de police sur `/`** : 90 135 des deux côtés.

## Suivi CLS de la PR 6a (traits de 2 px)

2026-10-23. Suivi demandé par le propriétaire à l'arbitrage de la PR 6a.

**Cause trouvée (trace, puis reproduction)** : le décalage ne vient pas des composants. Angular SSR insère à
chaque requête un CSS critique (`beasties/runtime`, plans compilés au build par `beasties/compiler`) et charge la
feuille complète en différé (`media="print"`). `beasties@0.5.4` sérialise chaque at-rule suivie d'un `;`, y compris
les règles à bloc (`compiler.mjs:520`) : le HTML servi contient `@property --tw-font-weight{…};@property
--tw-border-style{…};…`. Le navigateur lit `;@property …{…}` comme une règle qualifiée invalide et la jette : toutes
les `@property` de Tailwind sauf la première, et le bloc `@layer properties`, disparaissent. `--tw-border-style`
n'a plus de valeur, `border-style: var(--tw-border-style)` vaut `none` : **au premier rendu, aucune bordure
Tailwind n'existe**. Elles apparaissent à l'arrivée de la feuille complète et décalent tout ce qui suit.

- Trace Lighthouse de `/projects` desktop sur `master` : un seul décalage (t = 216 ms, avant les polices), colonne
  de gauche de l'en-tête 187 → 207, filtres 456 → 476, `section.mt-12` 547 → 568. Reproduit au pixel en ne
  servant que le CSS critique : légende 200 px de haut au lieu de 220 (cadre `border-2`, filet de tête, trois
  tampons `border-2`), en-tête 376 au lieu de 396 ; la grille `lg:items-end` aligne la colonne de gauche sur le bas.
- Le défaut existait avant la PR 6a (traits de 1 et 1,5 px) ; les traits de 2 px l'ont doublé. Même mécanisme pour
  `app-cartouche > dl` sur `/`, les lignes du blog et les choix techniques de la fiche projet.
- Production touchée de la même façon (58 `};@` dans le HTML de `/projects`, 2026-10-23).

**Correctif** : `beasties@0.5.5` (correctif amont : le `;` n'est plus ajouté qu'aux at-rules sans bloc), imposée par
`pnpm.overrides` (`beasties@<0.5.5` → `0.5.5`) puisque la dépendance vient d'`@angular/build` et `@angular/ssr`.
Aucun changement de code ni de rendu. **Exception à la règle des 14 jours**, décidée par le propriétaire le
2026-10-23 : la 0.5.5 est publiée depuis le 12/10 (11 jours) ; ce n'est pas un correctif de sécurité, mais c'est le
correctif amont exact d'un défaut visible en production. L'override se retire quand `@angular/build` et
`@angular/ssr` exigeront `beasties >= 0.5.5`.

**Garde** : `e2e/a11y/critical-css.spec.ts` (job `a11y`, contre l'image) bloque la feuille complète sur
`/projects` et exige des bordures déjà tracées sur le cartouche et un tampon : `0px none` sur l'image de `master`
(RED), `2px solid` avec la 0.5.5 (GREEN).

### Mesure Lighthouse

Trois images : avant la PR 6a (`lh6a-base`, rendu de la PR 5), `master` `8fefb13`, branche (0.5.5). Lighthouse
12.8.2, doublure, tiers bloqués, mobile et desktop, 5 passes à ordre tournant, machine sans autre charge ; 120
rapports, plus un recontrôle de `/blog` et `/projects` mobile en 10 passes alternées `master` / branche (40 rapports).

| Page | Profil | CLS avant 6a | CLS `master` | CLS branche | Perf `master` → branche | LCP ms `master` → branche |
|---|---|---|---|---|---|---|
| `/` | mobile | 0,0028 | 0,0121 | 0,0107 | 90 → 90 | 3220 → 3232 |
| `/` | desktop | 0,0018 | 0,0089 | 0,0040 | 100 → 100 | 562 → 563 |
| `/blog` | mobile | 0,0027 | 0,0032 | **0,0008** | 94 → 95 (recontrôle) | 2855 → 2854 (recontrôle) |
| `/blog` | desktop | 0,0013 | 0,0013 | **0,0007** | 100 → 100 | 733 → 603 |
| `/projects` | mobile | 0,0050 | 0,0084 | **0,0010** | 95 → 91 (recontrôle) | 2855 → 3279 (recontrôle) |
| `/projects` | desktop | 0,0078 | 0,0120 | **0,0007** | 100 → 100 | 645 → 645 |
| `/projects/projet-temoin` | mobile | 0,0048 | 0,0052 | **0,0008** | 92 → 92 | 2854 → 2854 |
| `/projects/projet-temoin` | desktop | 0,0037 | 0,0042 | **0,0007** | 100 → 100 | 644 → 645 |

A11y / BP / SEO : 100 / 96 / 100 partout, sur les trois images.

- **CLS** : en dessous du niveau d'avant la PR 6a sur `/blog`, `/projects` et la fiche projet (décalages restants :
  `h1` et en-tête fixe au chargement des polices). Sur `/`, le décalage du cartouche a disparu ; il reste celui de
  l'autocollant (`app-sticker.absolute`, 9 passes sur 10), apporté par la PR 6b et déjà mesuré après son correctif
  (0,0029 à 0,0121) : hors de ce suivi, sous le critère de 0,02.
- **Perf `/projects` mobile 95 → 91** : pas un effet du correctif. L'élément LCP alterne entre le `h1` (≈ 2 855 ms,
  Perf 95) et le paragraphe d'intro en fondu retardé (≈ 3 300 ms, Perf 90-91), mélange déjà relevé aux PR 4 à 6b ;
  le paragraphe gagne 12 fois sur 15 sur la branche contre 3 sur 15 sur `master`, mais l'inverse sur `/blog`
  (1 sur 10 contre 4 sur 10, Perf 94 → 95). Géométrie des deux candidats identique sur les deux images, avec ou sans
  la feuille complète (`h1` 380 × 44, `p` 380 × 51) ; FCP identique (≈ 1 729 ms). Course de timing sur l'animation,
  pas une dégradation : la question de l'élément LCP en fondu reste le suivi « perf en pause ».
- **Élément LCP** : mêmes candidats partout.

Gates locaux : `pnpm install --frozen-lockfile`, `pnpm test` (228 fichiers, 4408 tests, exit 0), `pnpm lint`,
`pnpm run format:check`, `pnpm a11y:typecheck`, `pnpm run build --configuration production` : exit 0 ; `pnpm a11y`
contre l'image de la branche : 59 tests verts (dont la garde du CSS critique), exit 0.
