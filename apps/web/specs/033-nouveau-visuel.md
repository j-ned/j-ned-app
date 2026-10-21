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
  22 px, « Julien Nédellec » en Bricolage 800, « Tourneur CN et développeur web » en JN Sans 600, un
  autocollant sauge incliné, une cote orange, l'adresse du site. Aucune photo, aucun dégradé.
  Source : `docs/og/og-default.html` (hors sources Tailwind, `@source not '../docs'`), qui charge les
  woff2 de `public/fonts/` ; rendu par `pnpm exec playwright screenshot --viewport-size "1200, 630"
  file://$PWD/docs/og/og-default.html public/og/julien-nedellec-AAAAMMJJ.png` (Playwright est déjà une
  dépendance de dev, aucune nouvelle dépendance).
- **Câblage** : `shared/seo/share-image.ts` gagne `DEFAULT_SHARE_IMAGE = { url, width: 1200, height: 630,
  type: 'image/png', alt: 'Julien Nédellec, tourneur CN et développeur web' } as const`. `seo.ts`
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
3. **Carte de partage** : texte seul, sans portrait. Le sous-titre (« Tourneur CN et développeur web »
   proposé) est calé sur les textes de la spec 031 dans la PR 6a.
4. **Boutons `outlined`** : contour 2 px `foreground`, assorti aux cartes.
5. **Œil optique** : 48 retenu par défaut ; validé à l'œil par le propriétaire sur le rendu réel dans la
   PR 5 (alternative : 96, même poids, dessin plus expressif).
