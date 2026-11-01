---
name: J-Ned Portfolio
description: Copeaux vifs, l'atelier coloré et accueillant d'un tourneur CN qui code pour le plaisir.
colors:
  copeau-orange-text-sable: "#bc3700"
  copeau-orange-fill-sable: "#ed6e12"
  copeau-orange-nuit: "#f99549"
  sable-background: "#fcf4eb"
  sable-surface: "#ffffff"
  sable-surface-elevated: "#fff9f3"
  sable-foreground: "#181f2e"
  sable-muted: "#4d5566"
  nuit-background: "#141a29"
  nuit-surface: "#1e2638"
  nuit-surface-elevated: "#263045"
  nuit-foreground: "#f6f1eb"
  nuit-muted: "#b1b7c5"
  sable-line: "color-mix(in srgb, #181f2e 12%, transparent)"
  sable-line-strong: "color-mix(in srgb, #181f2e 28%, transparent)"
  sable-field: "color-mix(in srgb, #181f2e 50%, transparent)"
  nuit-line: "color-mix(in srgb, #f6f1eb 12%, transparent)"
  nuit-line-strong: "color-mix(in srgb, #f6f1eb 28%, transparent)"
  nuit-field: "color-mix(in srgb, #f6f1eb 38%, transparent)"
  sticker-sage-sable: "#b9eec2"
  on-sticker-sage-sable: "#174825"
  sticker-lavender-sable: "#d1e2ff"
  on-sticker-lavender-sable: "#233971"
  sticker-sage-nuit: "#235430"
  on-sticker-sage-nuit: "#d5f5da"
  sticker-lavender-nuit: "#2d416d"
  on-sticker-lavender-nuit: "#d8e5ff"
  status-success-sable: "#067132"
  status-warn-sable: "#974e02"
  status-error-sable: "#b71824"
  status-success-nuit: "#67d283"
  status-warn-nuit: "#eec05b"
  status-error-nuit: "#f97676"
  sable-code-keyword: "#af3c03"
  sable-code-function: "#5857b9"
  sable-code-string: "#1b7138"
  sable-code-number: "#825d0d"
  sable-code-tag: "#b32c70"
  sable-code-comment: "#4d5566"
  nuit-code-keyword: "#f99549"
  nuit-code-function: "#a2a8f4"
  nuit-code-string: "#67c07d"
  nuit-code-number: "#cbaa4b"
  nuit-code-tag: "#f78bb7"
  nuit-code-comment: "#b1b7c5"
typography:
  display:
    fontFamily: "'Bricolage Grotesque', 'Bricolage Grotesque Fallback', system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 7vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Bricolage Grotesque', 'Bricolage Grotesque Fallback', system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Bricolage Grotesque', 'Bricolage Grotesque Fallback', system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "'JN Sans', 'JN Sans Fallback', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  body-large:
    fontFamily: "'JN Sans', 'JN Sans Fallback', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "'JN Sans', 'JN Sans Fallback', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  mono:
    fontFamily: "'JN Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  none: "0"
  part: "8px"
  field: "12px"
  card: "16px"
  block: "22px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "80px"
components:
  button-primary:
    backgroundColor: "{colors.copeau-orange-fill-sable}"
    textColor: "{colors.sable-foreground}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  button-outlined:
    backgroundColor: "transparent"
    textColor: "{colors.sable-foreground}"
    borderColor: "{colors.sable-foreground}"
    borderWidth: "2px"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  sticker-sage:
    backgroundColor: "{colors.sticker-sage-sable}"
    textColor: "{colors.on-sticker-sage-sable}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  stamp:
    backgroundColor: "{colors.sable-surface}"
    textColor: "{colors.sable-foreground}"
    borderColor: "{colors.sable-foreground}"
    borderWidth: "2px"
    rounded: "{rounded.part}"
    padding: "4px 10px"
  input-default:
    backgroundColor: "{colors.sable-surface}"
    textColor: "{colors.sable-foreground}"
    borderColor: "{colors.sable-field}"
    rounded: "{rounded.field}"
    padding: "10px 14px"
  card-surface:
    backgroundColor: "{colors.sable-surface}"
    textColor: "{colors.sable-foreground}"
    borderColor: "{colors.sable-foreground}"
    borderWidth: "2px"
    rounded: "{rounded.card}"
    padding: "24px"
---

# Design System: J-Ned Portfolio

## 1. Overview

**Creative North Star: "Copeaux vifs"**

Le site est l'atelier de Julien : un tourneur CN de l'aéronautique qui code pour le plaisir et tutoie son lecteur. Le visuel en a l'humeur : des couleurs franches comme un copeau d'acier qui sort chaud du tour, des formes rondes et accueillantes, quelques autocollants posés sur l'établi. Ce n'est plus une salle de supervision qu'on inspecte, c'est un atelier où l'on entre, où l'on lit un article, où l'on regarde ce qui a été fabriqué.

L'envie de jouer ne passe jamais devant la lecture. Le lecteur arrive le plus souvent par une recherche, sur un article : le texte, le code et la hiérarchie des titres restent prioritaires, la couleur et les autocollants accompagnent. Le dessin technique reste présent par clin d'œil (cartouche, cotes, tampon) : c'est le métier d'origine, pas un décor.

Deux registres égaux : **Sable** (clair, papier chaud) et **Nuit** (sombre, bleu nuit). Le site suit la préférence du système au premier chargement, le visiteur choisit ensuite (ADR-0012). L'orange copeau traverse les deux.

Ce que ce système refuse : le template portfolio générique (hero centré « Hi, I'm », barres de compétences, nuage de logos de technologies, même déguisé en autocollants), l'over-design (curseur custom, scroll-jacking, intro animée, autocollants partout), le dégradé décoratif, le glassmorphism, l'ombre qui « fait ressortir ».

> **État (2026-10-23) :** la direction de la spec 033 (`specs/033-nouveau-visuel.md`, ADR-0030, ADR-0031) est entièrement en place : couleurs des deux registres, Bricolage Grotesque, composants partagés et gabarits publics. Le § 5 décrit les classes exactes du code en place et suit chaque changement de composant.

**Key Characteristics:**
- Deux registres égaux, Sable et Nuit, qui suivent le système au premier chargement.
- Un seul accent, l'orange copeau (One Orange Rule), avec deux exceptions bornées : la coloration du code et les deux couleurs d'autocollant.
- Formes rondes : boutons et autocollants en pilule, cartes à 16 px, grands blocs à 22 px ; la pièce technique (cartouche, tampon) garde 8 px.
- Bords francs : cartes et boutons secondaires à trait plein de 2 px couleur du texte, plutôt que des surfaces translucides.
- Un autocollant décoratif par écran, au plus (Sticker Rule).
- Focus visible non négociable : anneau 2 px `primary` sur `:focus-visible`, qui suit le rayon de l'élément.
- Zéro motion gratuite : `prefers-reduced-motion` respecté, aucune animation d'intro, inclinaison des autocollants statique.

## 2. Colors: The Copeaux Palette

Deux registres (Sable / Nuit), un accent orange, deux couleurs d'autocollant, des statuts et six teintes de code. Toutes les valeurs sont dans le gamut sRGB (ADR-0030) ; les hex sont le rendu 8 bits. Aucun dégradé, titres compris : l'accent du `<h1>` du hero est en texte plein.

### Primary : l'orange copeau

- **Orange texte Sable** (`#bc3700`, `oklch(53.2% 0.178 37)`) : `--theme-primary-text` en clair. Liens, anneau de focus, accent du `<h1>`, cotes, bordures actives. 5,21:1 sur le fond, 5,69:1 sur une carte.
- **Orange aplat Sable** (`#ed6e12`, `oklch(68% 0.18 48)`) : `--theme-primary-bg` en clair. Fond du bouton primaire, **toujours avec un texte sombre** (`on-primary` = `foreground`, 5,36:1). Jamais un texte orange sur cet aplat, jamais un texte blanc.
- **Orange Nuit** (`#f99549`, `oklch(76% 0.15 55)`) : `--theme-primary-text` **et** `--theme-primary-bg` en sombre. 7,74:1 sur le fond, 6,74:1 sur une carte ; sur l'aplat, le texte prend la couleur du fond (`on-primary` = `background`, 7,74:1).

### Stickers : sauge et lavande

Deux couleurs, pas une de plus (arbitrage 2026-10-21). Réservées aux autocollants (`shared/ui/sticker.ts`) : ni lien, ni bouton, ni état, ni catégorie de contenu.

| Token | Sable (fond / texte) | Nuit (fond / texte) | Contraste du texte |
|---|---|---|---|
| `sticker-sage` / `on-sticker-sage` | `#b9eec2` / `#174825` | `#235430` / `#d5f5da` | 8,08 (Sable) · 7,51 (Nuit) |
| `sticker-lavender` / `on-sticker-lavender` | `#d1e2ff` / `#233971` | `#2d416d` / `#d8e5ff` | 8,44 (Sable) · 7,93 (Nuit) |

Le fond d'un autocollant contre la page reste décoratif (1,20 à 1,95:1) : c'est son texte qui porte l'information, et en `forced-colors` son bord transparent devient `CanvasText`.

### Neutral : Sable (clair)

- **Fond** (`#fcf4eb`, `oklch(97% 0.015 70)`) : sable chaud, jamais un blanc clinique ni un gris bleuté.
- **Surface** (`#ffffff`) : cartes, champs, tampon. **Surface elevated** (`#fff9f3`, `oklch(98.5% 0.01 70)`) : survol et état ouvert.
- **Texte** (`#181f2e`, `oklch(24% 0.03 265)`) : bleu nuit très sombre. 15,08:1 sur le fond, 16,47:1 sur une carte.
- **Texte secondaire** (`#4d5566`, `oklch(45% 0.03 265)`) : 6,82:1 sur le fond, 7,45:1 sur une carte, 7,13:1 sur `surface-elevated`.

### Neutral : Nuit (sombre)

- **Fond** (`#141a29`, `oklch(22% 0.03 265)`) : bleu nuit, jamais un noir pur.
- **Surface** (`#1e2638`, `oklch(27% 0.035 265)`) : opaque, plus de `rgba` translucide. **Surface elevated** (`#263045`, `oklch(31% 0.04 265)`).
- **Texte** (`#f6f1eb`, `oklch(96% 0.01 70)`) : crème. 15,42:1 sur le fond, 13,43:1 sur une carte.
- **Texte secondaire** (`#b1b7c5`, `oklch(78% 0.02 265)`) : 8,64:1 sur le fond, 7,52:1 sur une carte, 6,57:1 sur `surface-elevated`.

### Lines : traits

Mélanges `foreground` / transparent en `color-mix(in srgb, …)`, mêmes proportions dans les deux registres sauf le champ.

- **Line** (`--color-line`, 12 %) : séparateurs internes. 1,27:1 (Sable), 1,39:1 (Nuit). Décoratif.
- **Line Strong** (`--color-line-strong`, 28 %) : séparateurs du cartouche, cadres secondaires. 1,80:1 (Sable), 2,37:1 (Nuit). Décoratif.
- **Field** (`--color-field`, 50 % Sable, 38 % Nuit) : bord des champs, **porteur d'information** (WCAG 1.4.11) : 3,17:1 fond / 3,24:1 surface (Sable), 3,30:1 / 3,19:1 (Nuit).
- **Bord franc** (`foreground` plein, 2 px) : cartes, boutons `outlined`, tampon, cadre du cartouche. Très au-delà de 3:1.

### Status

| Token | Sable | Nuit | Ratios fond / surface |
|---|---|---|---|
| `status-success` | `#067132` | `#67d283` | 5,64 / 6,15 · 9,17 / 7,99 |
| `status-warn` | `#974e02` | `#eec05b` | 5,66 / 6,16 · 10,19 / 8,87 |
| `status-error` | `#b71824` | `#f97676` | 6,07 / 6,63 · 6,51 / 5,67 |

Texte sur aplat de statut : `on-status-success` (blanc en Sable, 6,15:1 ; fond en Nuit, 9,17:1) et `on-status-error` (blanc en Sable, 6,63:1 ; fond en Nuit, 6,51:1). L'orange et le rouge d'erreur sont proches en teinte : une erreur est toujours dite par une icône et un texte, jamais par la seule couleur, et l'orange ne sert jamais à un état.

### Code

Six teintes `--color-code-*`, réservées aux blocs de code (`code.code-syntax`). Fond réel du bloc : `foreground` à 4 %, posé sur la page ou sur une carte ; chaque teinte vise ≥ 5,0:1 en Sable et ≥ 6,0:1 en Nuit sur le pire des deux.

| Rôle | Sable | Ratios bloc page · bloc carte | Nuit | Ratios bloc page · bloc carte |
|---|---|---|---|---|
| `keyword` (orange) | `#af3c03` | 5,13 · 5,60 | `#f99549` | 7,03 · 6,05 |
| `function` (lavande) | `#5857b9` | 5,11 · 5,58 | `#a2a8f4` | 7,05 · 6,07 |
| `string` (sauge) | `#1b7138` | 5,13 · 5,60 | `#67c07d` | 7,05 · 6,07 |
| `number` (ocre) | `#825d0d` | 5,05 · 5,51 | `#cbaa4b` | 7,03 · 6,06 |
| `tag` (rose) | `#b32c70` | 5,06 · 5,52 | `#f78bb7` | 6,99 · 6,01 |
| `comment` (= `muted`) | `#4d5566` | 6,32 · 6,89 | `#b1b7c5` | 7,83 · 6,75 |

### Named Rules

**The One Orange Rule.** Un seul accent : l'orange copeau (`primary-text` pour le texte et les traits, `primary-bg` pour les aplats). Pas de bleu qui s'invite, pas de « second accent pour différencier ». Pour différencier, change le style (aplat, contour, texte) ou l'intensité de la teinte, jamais la couleur. Deux exceptions bornées, et seulement elles : la coloration syntaxique (dans un bloc de code, nulle part ailleurs) et les deux couleurs d'autocollant (dans `app-sticker`, nulle part ailleurs). Ni l'une ni l'autre ne sert de lien, de bouton, d'état ou de catégorie.

**The Accent Tint Rule.** Une teinte d'orange posée **sous un texte orange** reste à **8 % au plus** (`bg-primary/5`, survol `bg-primary/8`) : à 10 % le texte orange Sable tombe à 4,50:1, à 20 % à 3,86:1. Un aplat orange plein porte un texte `on-primary`, jamais un texte orange ni blanc. Aucune vérification automatique ne tient cette règle (axe ne teste pas les survols) : elle se relit.

**The Two Registers Rule.** Sable et Nuit sont **égaux**. Toute décision de design fonctionne dans les deux ou n'est pas valide : chaque composant se teste en `.app-dark` et sans. La classe a un seul écrivain à l'exécution, `ThemeStore` (`core/theme/`), partagé par le site et l'admin ; le script en tête d'`index.html` la pose avant la première peinture (choix enregistré, sinon préférence système).

**The Decorative Line Rule.** `line` et `line-strong` sont des traits d'ornement : le texte qu'ils encadrent porte l'information. Un trait **porteur d'information** (bord de champ, état, séparation d'un contrôle, graphique) utilise `field`, `foreground` plein ou `primary-text`, jamais `line` ni `line-strong` : seuils calculés pour 3:1, 50 % en Sable, 38 % en Nuit.

**The Selected State Rule.** L'aplat orange Sable n'a que 2,81:1 contre le fond : un état sélectionné (tag, filtre) porte en plus un contour `foreground`, et `aria-pressed` ou `aria-selected` le dit aux technologies d'assistance. Un bouton primaire qui ne porte qu'une icône est interdit sans trait ≥ 3:1. Les cases à cocher prennent `accent-primary` (5,21:1), jamais `accent-primary-bg`.

## 3. Typography

**Display Font:** Bricolage Grotesque 1.001 (variable, OFL 1.1 sans Reserved Font Name ; instance `opsz` 48, `wdth` 100, `wght` 600–800, ADR-0031) : `--font-display` : `'Bricolage Grotesque', 'Bricolage Grotesque Fallback', system-ui, sans-serif`
**Body Font:** JN Sans (IBM Plex Sans 3.201 modifiée et renommée, « Plex » étant un *Reserved Font Name* ; variable, `wght` 400–700, romain et vraie italique) : `--font-sans`, appliquée à tout le site par le preflight
**Data Font:** JN Mono 500 (IBM Plex Mono 2.3 renommée, même raison ; statique) : `--font-mono` : `'JN Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace`

**Character:** Bricolage Grotesque donne aux titres une voix ronde, un peu bricolée, chaleureuse sans être enfantine ; JN Sans tient le texte courant sans fatigue ; JN Mono pose les données (cotes, références, code). Les trois familles sont **auto-hébergées** (`public/fonts/`, ADR-0006) : aucune requête tierce, CSP `font-src 'self'` inchangée, `font-display: swap`, faces de repli métriquement ajustées sur Arial pour ne pas décaler la mise en page (Bricolage : `size-adjust` 97,56 %, `ascent-override` 95,32 %, `descent-override` 27,67 %, `line-gap-override` 0 %, sur Arial Bold). Seule la police du `<h1>` (élément LCP) est préchargée : 37 460 octets, 5,2 % de moins qu'Archivo, la police de titres précédente ; l'italique n'est téléchargée que sur les pages qui en affichent.

- **Titres `h1` à `h3`** : Bricolage Grotesque, sans `font-stretch` (largeur fixée dans l'instance). Tailles, graisses et interlettrages viennent des classes du template.
- **Graisses** : Bricolage 600–800, JN Sans 400–700, JN Mono 500 seulement. `font-synthesis-weight: none` sur `html` : une graisse hors plage prend la plus proche disponible, jamais un faux gras.
- **Données chiffrées** : `font-mono tabular-nums` dans le template.
- **Moins de majuscules mono** : dans les pages publiques, libellés et sur-titres passent en JN Sans `text-xs font-semibold`, sans capitales ; le mono reste aux données, aux cotes, aux références et au code.
- **Glyphes hors sous-ensemble latin** : U+202F (séparateur de milliers fr-FR) et `→` sont pris dans la police de repli.

### Hierarchy

- **Display** (800, `clamp(2.75rem, 7vw, 5.5rem)`, line-height 1.05, tracking -0.02em) : `<h1>` du hero de l'accueil. Un seul par page, jamais réutilisé.
- **Headline** (700, `clamp(1.75rem, 3.5vw, 2.5rem)`, line-height 1.15, tracking -0.01em) : titres de section (`<h2>`).
- **Title** (600, `1.25rem`, line-height 1.3) : titres de carte, titres de projet dans la grille.
- **Body Large** (400, `1.125rem`, line-height 1.65) : accroche du hero, intros de section. 65–75ch au plus.
- **Body** (400, `1rem`, line-height 1.6) : paragraphes courants. 65–75ch au plus.
- **Label** (600, `0.75rem`, line-height 1.4) : métadonnées, en-têtes de tableau de l'admin, autocollants (`text-sm`).
- **Mono** (500, `0.875rem`, line-height 1.5) : code en ligne, cotes, références, chiffres techniques.

### Named Rules

**The Three Families Rule.** Trois familles, pas une de plus : Bricolage Grotesque pour les titres, JN Sans pour le texte, JN Mono pour les données. Pas de police manuscrite, même pour un autocollant. Toutes auto-hébergées depuis l'origine du site (ADR-0006) : jamais de Google Fonts ni d'autre CDN de polices. Tout changement de binaire change le nom de fichier versionné (cache nginx `immutable`), dans `styles.css` **et** dans le `preload` d'`index.html`.

**The Single-Display Rule.** Un seul `<h1>` par page, en Display, jamais réutilisé pour décorer une autre section. La hiérarchie `<h1>` → `<h2>` → `<h3>` ne saute jamais un niveau.

**The Orange Accent Rule.** Le `<h1>` du hero porte un seul accent, un segment de la promesse (« développeur web ») en `em` `not-italic text-primary`. Le segment est une donnée (`HeroData.headlineAccent`), jamais un littéral de template : `HomeHero` découpe le titre autour de lui.

## 4. Elevation & Shapes

Système **plat**. La profondeur vient des bords francs et des aplats, pas des ombres ni de la transparence.

- Une carte se détache par son **bord de 2 px** `foreground` et sa surface opaque (blanche en Sable, `#1e2638` en Nuit).
- Le survol change le bord (`hover:border-primary`) ou la surface (`surface-elevated`), jamais une ombre.

### Shapes

| Rayon | Token (`@theme`, PR 6a) | Usage |
|---|---|---|
| 8 px | `rounded-part` | cartouche, tampon, vignettes de couverture, anneaux de focus des liens : la pièce technique reste nette |
| 12 px | `rounded-field` | champs de formulaire |
| 16 px | `rounded-card` | cartes, cartes de lien |
| 22 px | `rounded-block` | grands blocs (couvertures et portrait, bloc de code, galerie, carte de partage) |
| pilule | `rounded-full` | boutons, entrées de navigation actives, autocollants |

Cibles tactiles : 44 × 44 px au moins malgré la pilule (`min-h-11`, `size-11`).

### Shadow Vocabulary

- **Nav shadow (Sable)** (formule à deux couches, teinte `foreground` à 4 %) : nav fixe, sépare du contenu qui défile dessous.
- **Nav shadow (Nuit)** (`0 1px 0`, `foreground` à 6 %) : filet lumineux, équivalent sans alourdir.

Aucune autre ombre, boutons compris.

### Named Rules

**The Flat-By-Default Rule.** Toute carte, tout conteneur, toute section commence sans ombre. Une ombre ne s'ajoute qu'avec une justification fonctionnelle (nav fixe, modale, menu flottant). Décorer = refuser : pour faire ressortir, travaille le bord, la taille ou le contraste typographique.

**The No-Glass Rule.** Aucun `backdrop-filter: blur()` et aucune surface translucide comme effet : les surfaces Nuit sont opaques, le toast aussi.

**The Sticker Rule.** Un autocollant (`app-sticker`) est une pastille pilule, sauge ou lavande, de **4 mots au plus**, éventuellement inclinée de **2°** (statique, sans transition). **Un autocollant décoratif par écran, au plus** : celui de l'accueil (« Fait main », sauge, incliné à gauche). Jamais un lien, un bouton, un titre, ni le parent d'un élément interactif ; jamais un logo de technologie. Le tampon (« En production », « Démo », « Script ») a la forme d'un autocollant mais reste **neutre** (surface, bord `foreground` 2 px, rayon 8 px) : il y en a un par carte de réalisation.

## 5. Components

> **Code en place.** Ce § décrit les classes **exactes** des composants tels qu'ils sont dans le code aujourd'hui : il est mis à jour par chaque PR de la spec 033 qui change un composant (PR 4 tokens, PR 5 police, PR 6a composants partagés, PR 6b gabarits), pour ne jamais décrire des classes absentes du code. « Nuit » y désigne le registre sombre, « Sable » le clair ; les ratios cités sont ceux des tokens en place.

### Buttons (`shared/ui/button.ts`)

- **Directive d'attribut `appButton`** sur un `<button>` ou un `<a>` natif (`button[appButton], a[appButton]`, ADR-0017) : aucun élément enveloppant, `type`, `disabled`, `aria-*`, `routerLink` et `href` restent natifs. Un `<button appButton>` écrit toujours son `type` (`@angular-eslint/template/button-has-type`). Jamais de `@utility` pour un bouton.
- **Gabarit unique (appel):** `inline-flex min-h-11 items-center gap-2`, 15 px (`text-[0.9375rem]`), graisse 600, `transition-colors`, `rounded-full` (pilule, pour toutes les variantes). Hauteur 44 px garantie par `min-h-11` (WCAG 2.5.5).
- **Variantes:** `primary` (défaut) `bg-primary-bg text-on-primary` → hover `bg-primary-bg/90` (5,36:1 Sable, 7,74:1 Nuit ; jamais `text-white`) ; `outlined` `border-2 border-foreground text-foreground` → hover `border-primary text-primary` (bord franc, assorti aux cartes) ; `danger` `bg-status-error text-on-status-error` → hover `bg-status-error/90` ; `outlined-danger` `border-2 border-status-error/40 text-status-error` → hover `border-status-error/60 bg-status-error/10` ; `text` `text-primary` → hover `bg-primary/8` (Accent Tint Rule) ; `text-muted` `text-muted` → hover `bg-foreground/5 text-foreground` ; `text-danger` `text-status-error` → hover `bg-status-error/10`. Pleins sans bordure ni ombre.
- **`ghost-icon`:** lien icône des listes de l'admin, chaîne propre (`size-11`, centré, `rounded-full`, `text-foreground`, hover `bg-surface-elevated`) ; `size` et `block` sans effet.
- **Tailles:** `default` (`px-5`) / `icon` (`min-w-11`, centré, cercle de 44 px). `[block]="true"` : pleine largeur, libellé centré.
- **États propres à un site** (`aria-pressed:border-primary`, `aria-disabled:*`, `disabled:cursor-wait disabled:opacity-60`) : en classes sur l'élément, à côté de la directive.
- **Focus:** anneau global 2px couleur `primary` (orange texte : 5,21:1 Sable, 7,74:1 Nuit), offset 2px, sur `:focus-visible` uniquement (pas au clic souris) ; il suit le rayon de l'élément (un bouton rond reste rond).
- **Disabled:** opacity 0.5, cursor not-allowed.
- **Loading state:** non implémenté actuellement → à ajouter (voir Do's and Don'ts).

### Tags / Badges

- **Pas de composant de pastille générique** (`shared/ui/tag.ts` retiré avec la page Audience, son dernier consommateur). Un statut (« Publié », « Brouillon », « Mis en avant ») n'est pas une pastille colorée : c'est un tampon (`app-stamp`), `status-*` sur `status-*/15` frôlant 4,5:1 en Sable (4,52:1 pour le succès).
- **Tags du blog** (`blog-tag-palette.ts`) : tout le catalogue en `bg-primary/5 text-primary border-primary/30`, survol `bg-primary/8`, quelle que soit la catégorie ; tags libres neutres (`bg-foreground/8 text-muted border-foreground/20`, survol `bg-foreground/15`) ; aucun état sélectionné affiché (le filtre actif se dit par la puce ci-après). Puce du filtre actif de la liste du blog (`tag-filter-clear`) : mêmes teintes, `bg-primary/5`, survol `bg-primary/8`. Pas de couleur par catégorie (One Orange Rule). Les pastilles de tags ne vivent que sur la page article (`BlogTagLink`, lien vers `/blog?tag=`) et dans le sélecteur de l'admin : la liste du blog n'en affiche plus, ses lignes disent leurs sujets en repère (« Ligne d'article », ci-dessous).

### Cards / Containers

- **Carte publique** (activité du parcours `what-i-do-card`, panneau du formulaire de contact `contact-form-card`) : `rounded-card border-2 border-foreground bg-surface`, padding `p-7` (`md:p-9` pour le formulaire). Surface opaque (`#ffffff` Sable, `#1e2638` Nuit).
- **Grille de stack du parcours** : `rounded-card`, filets `foreground/8` entre les cases (traits décoratifs, Decorative Line Rule).
- **Dialogues et toasts** (`confirm-dialog`, `toast`) : `rounded-card`, bouton secondaire ou de fermeture en `rounded-full`.
- **Hover:** changement de bord (`hover:border-primary`) ou de surface (`surface-elevated`), jamais une ombre.

### Carte de lien (`shared/ui/link-card.ts`)

Un lien de navigation interne présenté en carte : « article précédent / suivant » et « Pour aller plus loin » (fiche du projet, articles proches) sur la page article, « Articles sur ce projet » sur la fiche projet.

- **API:** composant à sélecteur d'attribut `a[app-link-card]`, posé sur le lien de l'appelant ; entrées `overline` et `heading` (requises), `summary` (optionnelle : une phrase en `text-muted` sous le titre, comprise dans le nom du lien ; « Les outils » de l'atelier), `align` (`'start'` par défaut, `'end'` aligne le texte à droite). `routerLink`, `data-testid` et le placement dans la grille (`sm:col-start-2`) restent sur l'`<a>`.
- **Apparence:** carte portée par l'hôte (`rounded-card border-2 border-foreground bg-surface p-6`, bord franc 2 px, rayon 16 px), sans élément enveloppant ; sur-titre mono `text-xs text-muted`, puis titre `text-[1.1875rem] font-semibold tracking-tight`.
- **Survol:** la bordure passe en `primary` (5,21:1 Sable, au-delà de 3:1 dans les deux registres) et le titre en `primary` (`group-hover`) ; pas d'ombre.
- **Focus:** anneau global `:focus-visible` de `styles.css` (2 px `primary`).
- **Cible:** une seule par carte, toute la carte ; le nom du lien est le sur-titre suivi du titre.
- **Don't:** pas de second interactif dans la carte ; pas de lien externe (la carte n'annonce pas de nouvel onglet).

### Cartouche (`shared/ui/cartouche.ts`)

Le bloc-titre d'un plan technique, repris comme cadre de données.

- **API:** `title` (requis), `reference` (optionnelle, défaut `''`), `rows: readonly CartoucheRow[]` (`{ label, value }`), contenu projeté après les lignes.
- **Structure:** hôte `role="group"` nommé par le titre ; barre de titre empilée (titre en `p` Bricolage Grotesque gras, puis référence en mono `text-muted` sous le titre, à toutes les largeurs, sans troncature) ; lignes en `dl > div > dt + dd` (libellé JN Sans `text-xs font-semibold text-muted`, sans majuscules ; valeur `font-medium tabular-nums`). Aucun `dl` sans ligne.
- **Traits:** cadre et barre de titre (`data-testid="cartouche-head"`) en bord franc `border-2 border-foreground`, séparateurs internes en `line-strong` 1 px (décoratifs, Decorative Line Rule). Rayon `rounded-part` (8 px), `overflow-hidden` pour que les séparateurs suivent le coin. La référence reste en mono (donnée).
- **Titre:** jamais un `h*` : son niveau dépend du contexte, un consommateur qui a besoin d'un titre le projette.
- **Usage:** au plus un cartouche **décoratif** par écran (cadre de travail, fiche technique). Il sert aussi de carte de données (légende des natures, thèmes du blog, CV de l'admin) : ces cartouches-là ne comptent pas dans cette limite.

### Autocollant (`shared/ui/sticker.ts`)

La pastille décorative de la Sticker Rule.

- **API:** `tone: StickerTone` (`'sage'` par défaut, ou `'lavender'`), `tilt: StickerTilt` (`'none'` par défaut, `'left'`, `'right'`) ; unions fermées, aucune couleur ni angle libre. Texte projeté.
- **Apparence:** classes sur l'hôte (même mécanique que `appButton`) : `inline-flex w-fit items-center rounded-full border-2 border-transparent px-3 py-1 font-display text-sm font-bold leading-tight forced-colors:border-[CanvasText]`, ton `bg-sticker-sage text-on-sticker-sage` ou `bg-sticker-lavender text-on-sticker-lavender`, inclinaison `-rotate-2` / `rotate-2` (statique, sans transition).
- **Couleurs forcées:** le fond est neutralisé par le navigateur, le bord transparent devient `CanvasText` : la pastille garde son contour.
- **Accessibilité:** ni rôle, ni `tabindex`, ni `aria-*` : texte lu tel quel. Jamais un lien, un bouton, un titre, ni le parent d'un interactif.

### Tampon (`shared/ui/stamp.ts`)

La mention portée sur un plan, reprise pour dire la nature d'une chose : « En production », « Démo » ou « Script » sur un projet (`ProjectKindStamp`, ADR-0008).

- **API:** `dashed` (défaut `false`) ; le texte est projeté.
- **Pointillé:** `dashed` ajoute `border-dashed` à l'hôte et rien d'autre : un état provisoire (« Brouillon » de la liste des articles admin), jamais une nature.
- **Apparence unique:** classes sur l'hôte, sans élément enveloppant : forme d'autocollant neutre, `rounded-part border-2 border-foreground bg-surface px-2.5 py-1 text-xs font-semibold text-foreground` (JN Sans, sans majuscules ; 16,47:1 Sable, 13,43:1 Nuit). Une seule apparence pour toutes les natures : c'est le **texte** qui les distingue, jamais une couleur.
- **Placement:** le consommateur le positionne : coin haut gauche du visuel sur la couverture de projet (`ProjectCover`, ci-dessous), au-dessus du `h1` dans l'en-tête du détail. Posé sur un visuel couvert par un lien étiré, il laisse passer le clic (`pointer-events-none`).
- **Accessibilité:** texte lu tel quel, sans rôle ni `aria-*` ; la nature est dite par le texte, pas par une couleur ni par la seule position.
- **Don't:** pas d'orange ni de couleur de statut (One Orange Rule : c'est une mention, pas un accent) ; jamais un `h*` ni à l'intérieur d'un titre ; jamais interactif ; pas de variante par nature.

### Galerie de projet (`features/projects/application/components/project-gallery.ts`)

Les captures d'écran d'une réalisation, sur sa page détail, quand le projet en a (ADR-0009).

- **Entrée:** `images: readonly ProjectImage[]`, déjà triées par l'adapter ; rien n'est rendu pour une galerie vide (`@if` côté page).
- **Section:** `SplitSection` `headingId="gallery-title"`, titre « Captures », résumé court ; placée après la couverture et avant les choix techniques. Jamais sous `@defer` : la galerie est dans le HTML prérendu.
- **Grille:** `ul role="list"`, une colonne en mobile, deux à partir de `md`, `items-start` (une capture portrait garde son ratio sans étirer sa voisine).
- **Miniature:** un `button` natif par capture, `rounded-block`, qui porte l'image (`NgOptimizedImage`, `width`/`height` intrinsèques, `h-auto w-full`, chargement différé, **jamais** `priority`, ni `fill` ni `ngSrcset`) ; nom accessible « Agrandir : » en `sr-only` suivi de l'`alt`. Curseur `zoom-in`.
- **Agrandissement:** `dialog` natif ouvert par `showModal()` (fond inerte, Échap natif), `rounded-block`, nommé « Capture agrandie : <alt> » ; bouton « Fermer » en premier, focus posé dessus à l'ouverture ; à la fermeture (bouton ou Échap), le focus revient à la miniature d'origine. `::backdrop` en `background/90`, dialog cerné de `line-strong`, image contenue dans le viewport (`object-contain`).
- **Don't:** pas de carrousel ni de défilement automatique ; pas de lien ni de `div` cliquable à la place du `button` ; pas de dialog maison ni de bibliothèque de lightbox ; pas d'`alt` vide (une capture est un contenu, jamais une décoration).

### Articles d'un projet (`features/projects/application/components/project-articles.ts`)

Les articles du blog qui parlent d'un projet, sur sa fiche, calculés par `postsAboutProject` (articles publiés portant le tag du projet dans `PROJECT_TAGS`, ADR-0029).

- **Entrée:** `posts` (déjà filtrés et triés du plus récent au plus ancien) ; sortie `articleFollowed`, la page mesure le clic (`trackCtaClick('project_article', …)`, libellé constant).
- **Section:** `SplitSection` `headingId="project-articles-title"`, titre « Articles sur ce projet », résumé court, comme « Choix techniques » et « Décisions d'architecture » ; placée après les décisions d'architecture et avant la navigation entre projets. Non rendue sans article (`@if` côté page). Jamais sous `@defer` : les liens sont dans le HTML servi.
- **Chargement:** la liste du blog n'est lue que pour un projet présent dans `PROJECT_TAGS` ; une lecture en échec retire la section sans état d'erreur (la fiche reste lisible).
- **Liste:** `ul role="list"` en grille, une colonne en mobile, deux à partir de `sm` ; une carte de lien par article (vers `/blog/<slug>`, sur-titre = date de publication `d MMM y`, titre = titre de l'article).

### Étude de cas (`features/projects/application/components/project-case-study.ts`)

Un projet en production présenté en détail dans les Réalisations (`/projects`, section « En production », ADR-0010).

- **Entrée:** `caseStudy: CaseStudyView`, `priority` (défaut `false`), `reversed` (défaut `false`) ; sortie `liveLinkClicked` (suivi du lien externe par la page).
- **Couverture (`ProjectCover`):** `figure` à ratio fixe `aspect-[16/10]` (zéro CLS), `rounded-part`, trait `line-strong`, `bg-surface` ; image `NgOptimizedImage` en `fill` + `object-cover`, sans `ngSrcset` ni `sizes` (aucun `IMAGE_LOADER` : une seule variante servie) ; repli `div aria-hidden` de même ratio sans image. Tampon de nature en haut à gauche, qui laisse passer le clic. Une seule couverture `priority` par page : la première étude de cas.
- **Structure:** hôte `@container` (requête de conteneur, ADR-0013) ; `article` en grille `@min-[60rem]:grid-cols-12`, couverture `@min-[60rem]:col-span-7` puis texte `@min-[60rem]:col-span-5` ; empilés sous un conteneur de 60rem, couverture au-dessus. Sur `/projects`, la bascule tombe à 1 008 px de viewport (conteneur de 960 px) ; dans la colonne de 25rem de l'aperçu admin, l'étude de cas reste empilée. Aucune classe de point de rupture de viewport dans le composant. L'alternance gauche/droite passe par `@min-[60rem]:order-last` sur la couverture (`reversed`, la page passe `$even`, liée par `[class]` : un nom à crochets ne se lie pas en `[class.x]`) : seul l'ordre visuel change, jamais le DOM ni l'ordre du focus.
- **Texte:** overline mono `text-muted` (« 01 · catégorie »), `h3` du nom, accroche `text-muted max-w-[46ch]`, puis les repères (Stack, Point fort, Périmètre) en `FactList` (« Liste de repères », ci-dessous).
- **Actions:** « Voir la fiche » en `appButton`, nom du projet en `sr-only`, flèche `aria-hidden` ; « Ouvrir l'application » en `appButton variant="outlined"` si le projet a une URL, nouvel onglet `rel="noopener noreferrer"`, nom et « nouvel onglet » en `sr-only`, icône `external-link`.

### Carte de projet (grille) (`features/projects/application/components/project-grid-card.ts`)

Une démo ou un script dans les Réalisations (section « Démos et outils »).

- **Entrée:** `card: ProjectCardView`.
- **Structure:** `article relative` : couverture (`ProjectCover`, tampon « Démo » ou « Script », jamais `priority`, chargement différé), puis une ligne `h3` + stack mono `text-muted` (deux outils, empilés en mobile, `sm:justify-between`), puis l'accroche `text-muted`.
- **Cible:** un seul interactif, le lien « Voir la fiche » `text-primary` `min-h-11` (44 px), nom du projet en `sr-only`, étiré sur toute la carte (`after:absolute after:inset-0`) : toute la carte est cliquable, tampon compris (`pointer-events-none`). Pas de lien externe sur la carte : il est sur la fiche.
- **Survol:** le titre passe en `primary` (`group-hover`).
- **Grille:** `ul role="list"`, une colonne en mobile, deux à partir de `md`.

### Légende par nature (`features/projects/application/components/project-kind-legend.ts`)

L'en-tête des Réalisations dit de quelles natures sont les projets et combien il y en a de chaque.

- **Entrée:** `rows: readonly LegendRow[]` (nature, définition, compte).
- **Structure:** `Cartouche` titré « Légende », référence « Nature du projet », sans `rows` ; `dl` projeté en grille à trois colonnes : `dt` = tampon de nature, `dd` = définition, `dd` = compte en mono `tabular-nums` suivi de son unité (« projet(s) ») en `sr-only`, pour que le nombre soit lu avec ce qu'il compte. Lignes séparées par des traits `line`.
- **Usage:** cartouche de données, hors de la limite d'un cartouche décoratif par écran ; à droite de l'introduction sur grand écran, empilé dessous en mobile.

### Groupe de filtres (`shared/ui/filter-group.ts`)

Un filtre local à une liste, une seule valeur active : les natures des Réalisations (« Filtrer par nature »), les thèmes du blog (« Filtrer par thème »).

- **API:** `label` (requis, nom du groupe), `options: readonly FilterOption<T>[]` (`{ value, label, count?, disabled? }`), `active = model.required<T>()` lié en `[(active)]` au `linkedSignal` de la page. Générique sur la valeur.
- **Structure:** hôte `block overflow-x-auto` (défile horizontalement en mobile plutôt que de passer à la ligne) ; `div role="group"` nommé par `label` ; un `button type="button"` par option, libellé puis compte en mono `text-xs tabular-nums`, rendu seulement s'il est défini (0 compris) : la période d'Audience n'a pas de compte. Pas de `nav` : le filtre ne navigue pas, l'URL ne change pas.
- **États:** au repos `text-muted`, trait bas transparent ; survol `text-foreground` ; pressé (`aria-pressed="true"`, une seule option à la fois) trait bas `primary` 2px, `font-semibold`, `text-foreground` ; focus `outline-primary` 2px rentré (`-outline-offset-2`), sur `:focus-visible` seulement. Trait de base du groupe en `line` (ombre interne de 1px). Cible `min-h-11` (44 px).
- **Option inactive** (`disabled: true`, option sans élément dans les filtres de l'admin ; le blog n'en produit plus, ADR-0020) : `aria-disabled="true"`, **jamais** l'attribut `disabled` natif, pour qu'elle reste dans l'ordre de tabulation, garde son focus visible et soit annoncée « indisponible » avec son compte 0. Le clic ne change rien et le focus reste sur le bouton. Apparence de l'état désactivé des boutons : `opacity-50` posé sur le libellé et le compte seulement (`aria-disabled:*:opacity-50`), pour que le contour de focus garde son contraste, `cursor-not-allowed`, survol neutralisé (`aria-disabled:hover:text-muted`). L'opacité n'est pas le seul porteur : le compte « 0 » le dit aussi. « Tous » n'est jamais inactif.
- **Statut:** la page annonce le résultat d'un choix par un `p role="status"` `sr-only` (« N article(s) affiché(s) », « N réalisation(s) affichée(s) »), hors du groupe ; le focus ne bouge pas.

### Liste de repères (`shared/ui/fact-list.ts`)

Les repères d'un plan : un libellé court, une valeur. Étude de cas (Stack, Point fort, Périmètre), carte de projet de la home, ligne d'article (Sujets).

- **API:** `facts: readonly Fact[]` (`{ label, value }`). Le consommateur ne la rend pas sans repère (`@if (facts.length)`) : jamais de `dl` vide.
- **Structure:** `dl` en grille à deux colonnes (`6.5rem` puis le reste, `subgrid` par ligne) ; `dt` mono `text-xs text-muted`, `dd` en texte courant `text-sm`. Traits `line` au-dessus de la liste et sous chaque ligne (décoratifs, Decorative Line Rule).

### Liste du blog (`features/blog/pages/blog-list/blog-list.ts`)

La page `/blog` reprend le gabarit des Réalisations : en-tête à cartouche, filtre local, liste.

- **En-tête:** même grille que `/projects` (texte à gauche, cartouche à droite à partir de `lg`, empilé dessous en mobile). Sur-titre mono `text-primary` « N article(s) », `h1` « Blog » sans animation, introduction fixe, lien RSS `min-h-11`.
- **Cartouche « Thèmes »:** `Cartouche` titré « Thèmes », référence « Articles par thème », `rows` = les seuls thèmes qui ont au moins un article, dans l'ordre du catalogue (Stack, Sécurité, Ingénierie, Parcours, Projets), valeur « N article(s) » avec son unité en clair ; jamais une ligne « 0 article » (ADR-0020). Sans aucune ligne, le cartouche n'est pas rendu. Les comptes portent sur tous les articles, quel que soit le filtre. Cartouche de données, hors de la limite d'un cartouche décoratif par écran.
- **Filtre:** sous l'en-tête, hors du `header`, un seul des deux : le groupe « Filtrer par thème » (« Tous » puis les seuls thèmes couverts, dans l'ordre du catalogue, aucune option inactive), ou, quand la page article a envoyé `?tag=`, le bandeau « Filtré par X » avec son lien de retrait. Absent pendant le chargement, en erreur et sans article. Un thème actif est toujours un thème non vide.
- **États:** erreur en `role="alert"` avec « Réessayer » (comme `/projects`) ; « Aucun article pour le moment. » sans article ; « Aucun article avec ce tag. » sous un tag sans résultat.
- **Liste:** `ul role="list"` sous un trait, une ligne d'article par `li`, tous les articles sur une seule page (pas de pagination). Une seule couverture `priority` : celle du premier article de la liste complète, sous tout filtre.

### Ligne d'article (`features/blog/application/components/blog-post-row.ts`)

Un article de la liste du blog, lu comme une étude de cas.

- **Entrée:** `post: BlogPostRowView` (vue calculée par `toBlogPostRowView`, appliquée par `toBlogListView` à chaque article et par l'aperçu admin), aucun calcul dans le composant.
- **Structure:** hôte `@container` (ADR-0013) ; `article relative` en grille, texte puis couverture à droite (`20rem`) à partir d'un conteneur de 60rem (`@min-[60rem]:`), couverture au-dessus en dessous ; aucune classe de point de rupture de viewport. Sur `/blog`, la bascule tombe à 1 008 px de viewport (conteneur de 960 px) ; dans la colonne de 25rem de l'aperçu admin, la ligne reste empilée ; séparée de la suivante par un trait `line`. Texte : surtitre mono `text-xs text-muted` (« 9 sept. 2026 · 13 min de lecture », date omise si absente), `h2` du titre (texte simple), extrait `text-muted max-w-[62ch]`, repère « Sujets » (trois premiers tags, `FactList`), lien « Lire l'article ».
- **Couverture:** `figure` à ratio `aspect-[1200/630]`, `rounded-part`, trait `line-strong`, `bg-surface`, image `NgOptimizedImage` en `fill` + `object-cover`, `alt=""` (décorative : le titre et le lien nomment l'article), qui laisse passer le clic (`pointer-events-none`). Pas de zoom au survol.
- **Cible:** un seul interactif, le lien « Lire l'article » `text-primary` `min-h-11`, titre de l'article en `sr-only` pour un nom distinct par ligne, étiré sur toute la ligne (`after:absolute after:inset-0`). Pas de pastille ni de lien par tag.
- **Survol:** le titre passe en `primary` (`group-hover`).

### Pour aller plus loin (`features/blog/application/components/blog-further-reading.ts`)

La fiche du projet dont parle l'article, puis jusqu'à trois articles proches de l'article lu, calculés par `relatedPosts` sur la liste publiée déjà chargée par la page (ADR-0029).

- **Entrées:** `projects` (projets déclarés par un tag de `PROJECT_TAGS`, `linkedProjects`, sans appel à l'API des projets) et `posts` (déjà triés et limités) ; sorties `projectFollowed` et `postFollowed`, la page mesure le clic (`trackCtaClick('blog_project_link', …)` ou `trackCtaClick('blog_related_post', …)`, libellés constants).
- **Section:** `section` nommée par son `h2` « Pour aller plus loin », hors de l'`article`, sous la barre « J'aime / Flux RSS » et avant la navigation « Autres articles ». Aucun `nav` ajouté. Non rendue sans projet ni article proche (`@if` côté page). Jamais sous `@defer` : les liens sont dans le HTML servi.
- **Liste:** `ul role="list"` en grille, une colonne en mobile, deux à partir de `sm` ; d'abord une carte de lien par projet (vers `/projects/<slug>`, sur-titre « Fiche du projet », titre = tag du projet), puis une par article (sur-titre = date de publication `d MMM y`, comme la ligne d'article, titre = titre de l'article).
- **Doublons:** un article proche peut aussi être le voisin chronologique ; il apparaît alors dans les deux blocs.

### Corps d'article et blocs de code (`features/blog/application/components/blog-article-body.ts`, `infra/render-code-block.ts`)

Le Markdown d'un article, rendu par `parseMarkdown` (seul assainissement, ADR-0002) et posé en `innerHTML`. Même composant sur la page article et dans l'aperçu de l'éditeur (ADR-0013, ADR-0014).

- **Corps:** `prose prose-lg` du plugin typographique, `dark:prose-invert`, titres `foreground`, paragraphes et listes `foreground/85`, liens `text-primary`, tableaux défilants. Sur la page article, le corps est sous `@defer (on immediate; hydrate never)` : servi dans le HTML prérendu, jamais hydraté ; en navigation interne, un squelette (trois barres `foreground/6`) le précède et un chunk introuvable affiche « Le texte de l'article n'a pas pu être chargé. » avec un lien de rechargement complet.
- **Bloc de code:** `div[data-code-block]` `not-prose`, `rounded-block`, trait `foreground/8`, fond `foreground/4` (sur la page : `#1d2330` Nuit, `#f3ebe3` Sable ; sur une carte, aperçu de l'éditeur : `#272e3f`, `#f6f6f7`), `my-8`. Si le langage est connu, une barre d'étiquette (hauteur 40 px, mono `text-xs text-muted`, filet bas `foreground/8`) porte son libellé (« TypeScript », « Dockerfile »…). Puis `pre tabindex="0"` (défilement horizontal au clavier, anneau `primary` en `focus-visible`), mono 14 px, `leading-relaxed`, `p-4`. Langage inconnu ou absent : texte échappé, sans barre ni couleur.
- **Couleurs du code:** `@utility code-syntax` sur le `code` : texte `foreground`, puis une couleur par rôle. Ratios sur le fond du bloc, posé sur la page · sur une carte (composition sRGB, WCAG 2.x ; ≥ 5,0:1 en Sable, ≥ 6,0:1 en Nuit sur le pire des deux) :

  | Rôle (`--color-code-*`) | Jetons `hljs-*` | Nuit | Sable |
  |---|---|---|---|
  | `keyword` (orange) | `keyword`, `literal`, `doctag`, `meta` | `oklch(76% 0.15 55)` 7,03 · 6,05 | `oklch(51.5% 0.16 40)` 5,13 · 5,60 |
  | `function` (lavande) | `title`, `section`, `built_in`, `type` | `oklch(75.5% 0.11 280)` 7,05 · 6,07 | `oklch(51% 0.15 280)` 5,11 · 5,58 |
  | `string` (sauge) | `string`, `regexp`, `addition`, `template-tag` | `oklch(73.5% 0.13 150)` 7,05 · 6,07 | `oklch(48.5% 0.12 150)` 5,13 · 5,60 |
  | `number` (ocre) | `number`, `symbol`, `bullet`, `variable`, `template-variable`, `attr` | `oklch(75% 0.12 90)` 7,03 · 6,06 | `oklch(50.5% 0.1 80)` 5,05 · 5,51 |
  | `tag` (rose) | `name`, `selector-*`, `attribute`, `deletion` | `oklch(76.5% 0.14 355)` 6,99 · 6,01 | `oklch(52.5% 0.18 355)` 5,06 · 5,52 |
  | `comment` (= `muted`) | `comment`, `quote` | `oklch(78% 0.02 265)` 7,83 · 6,75 | `oklch(45% 0.03 265)` 6,32 · 6,89 |
  | texte | le reste (`property`, `params`, `punctuation`…) | `foreground` 14,00 · 12,04 | `foreground` 13,97 · 15,25 |

  Étiquette `text-muted` : 7,83 · 6,75 (Nuit), 6,32 · 6,89 (Sable).
- **Copier:** sur le site et dans l'aperçu, chaque bloc porte un `button[data-code-copy]` à droite de la barre (barre présente même sans langage connu) : mono `text-xs text-muted`, survol `foreground`, 32 px de haut dans la barre de 40 px pour que l'anneau `focus-visible` global (2 px, décalé de 2 px) ne soit pas rogné. Cet anneau vient de la règle globale `:where(a, button, …):focus-visible` de `styles.css`, non stratifiée : elle l'emporte sur les classes `focus-visible:outline-*` du bouton, qui restent inertes (même anneau, doublon assumé et figé par un test de `parse-markdown`). Libellé visible « Copier », nom « Copier le bloc de code N » (texte `sr-only`), « Copié » pendant 2 s après le dernier clic, « Échec » pendant 2 s si le presse-papiers refuse. Deux copies rapprochées sont annoncées toutes les deux (la région est vidée puis réécrite au rendu suivant). La directive `appCodeCopy` écoute le clic sur un ancêtre hydraté (rejoué avant hydratation par `withEventReplay`) et une région `role="status"` `sr-only`, hors du `@defer`, annonce « Code copié dans le presse-papiers » ou « Copie impossible : sélectionnez le code. ». Absent du flux RSS.
- **Code en ligne:** `text-primary` sur fond `foreground/6`, `rounded-sm`, `px-1.5 py-0.5`, graisse 500 (la seule de JN Mono), sans les accents graves du plugin typographique. Le fond, la chasse fixe et l'absence de soulignement le distinguent d'un lien, qui partage l'orange (4,64:1 Sable, 6,66:1 Nuit sur le fond `foreground/6` posé sur la page).
- **Souligné (`<u>`):** couleur du texte, trait `foreground/40` de 2 px décalé de `0.3em` ; jamais en `primary`, pour ne pas passer pour un lien.
- **Images du corps:** `loading="lazy"`, `decoding="async"` ; `width`/`height` lus dans la clé `blog-content/<uuid>-<empreinte>-<l>x<h>.avif` (ADR-0015) réservent la place avant l'arrivée de l'image, `h-auto max-w-full` garde le ratio.
- **Don't:** pas d'italique sur les commentaires (JN Mono n'a ni italique ni autre graisse que 500 : on obtiendrait un oblique synthétique) ; jamais de `style` inline (DOMPurify le retire, la CSP le refuserait) ; aucune de ces six teintes hors d'un bloc de code.

### Cote (`shared/ui/dimension-line.ts`)

La cote d'un dessin technique : deux traits de rappel, deux pointes, une ligne interrompue autour d'un libellé.

- **API:** `label` (requis).
- **Rendu:** traits de 2 px (`border-l-2` pour les rappels, `border-t-2` pour la ligne) et pointes proportionnelles (`border-y-[5px]`, `border-r-10` / `border-l-10`), en bordures `currentColor` = `text-primary` (visibles en `forced-colors`), libellé mono `text-xs`. La ligne s'interrompt autour du libellé au lieu d'être masquée par un fond : la cote se pose sur toute surface.
- **Accessibilité:** hôte `aria-hidden="true"`, aucun élément focalisable ni rôle à l'intérieur.
- **Règle d'usage:** la cote est **décorative** : son libellé répète une information écrite ailleurs dans le texte lisible. Cotes réservées aux délais et durées.

### Inputs / Forms (utility `form-input`)

- **Shape:** `rounded-field` (12 px, commun à `form-input` et `app-select`), padding `px-3.5 py-2.5` (~14px / 10px).
- **Background:** `bg-surface` (`#1e2638` en Nuit, `#ffffff` en Sable).
- **Border:** `border border-field` au repos (token Field, ≥ 3:1 dans les deux registres), commun à `form-input` et `app-select`.
- **Placeholder:** `placeholder:text-muted` (7,45:1 Sable, 7,52:1 Nuit). Jamais atténué : un texte de substitution reste du texte.
- **Contrôles natifs:** `color-scheme: dark` sur `:root`, `light` sur `:root:not(.app-dark)` : case à cocher, liste d'un `select` et barres de défilement suivent le registre. Cases à cocher et boutons radio en `accent-primary` (5,21:1 Sable), jamais `accent-primary-bg` (2,81:1) ; `size-5` sur la case « Mettre en avant », focus par le `:focus-visible` global.
- **Focus:** `focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary`. Pas d'outline supplémentaire.
- **Invalid:** `aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-500/30`.
- **Disabled:** opacity 0.5, cursor not-allowed.
- **Autofill override:** custom `-webkit-box-shadow` inset pour préserver la couleur de fond du thème (bug Chrome jaune par défaut neutralisé).
- **Textarea:** hérite de `form-input` + `min-h-[8rem] resize-y leading-relaxed`.
- **Label:** utility `form-label` → `text-sm font-medium mb-1.5`.
- **Error:** utility `form-error` → `block text-xs text-status-error mt-1`.
- **Libellé d'éditeur:** utility `field-label` → `flex justify-between items-baseline gap-3 text-sm font-semibold mb-1.5` ; mention à droite (« obligatoire ») en mono 12 px `text-muted`, dans le `label`.
- **Indication d'éditeur:** utility `field-hint` → `flex justify-between gap-3 mt-1.5 text-[0.78125rem] text-muted` ; à gauche le texte lié par `aria-describedby`, à droite un compteur mono 12 px `tabular-nums` « 137 / 160 » hors de la description accessible.

### Champ à suggestions (`shared/ui/suggest-input.ts`)

- Combobox ARIA 1.2 en liste (`role="combobox"`, `aria-autocomplete="list"`, option active par `aria-activedescendant`), sur un `form-input` ; le libellé reste chez l'appelant (`label for`).
- **Liste :** `absolute` sous le champ, `mt-1 max-h-60 overflow-y-auto rounded-field border border-line-strong bg-background shadow-lg` ; option `px-3.5 py-2 text-sm`, survol `bg-foreground/5`, active `bg-primary/8 text-primary`.
- **Modes :** `restricted`, seule une suggestion devient la valeur, « Aucune … » visible et annoncé sans correspondance ; `free`, le texte est la valeur. Nombre de propositions annoncé par un `role="status"` `sr-only`.

### Navigation

- **Header layout:** sticky en haut, background `var(--theme-background)`, border-bottom `var(--theme-nav-border)`, shadow `var(--theme-nav-shadow)`.
- **Monogramme « JN »** (`app-icon-tile`, `header-monogram`) : disque en aplat `rounded-full bg-primary-bg text-on-primary`, sans bord ni teinte (5,36 Sable / 7,74 Nuit). `app-icon-tile` est rond pour tous ses usages (connexion, double authentification).
- **Liens:** pilules `inline-flex min-h-11 items-center rounded-full px-3.5` (cible de 44 px, § 4), 15 px, `text-muted`, survol `text-primary` ; entrée active `bg-primary/8 text-primary` avec `aria-current="page"` (`ariaCurrentWhenActive`). Pas de barre soulignée.
- **Mobile:** drawer (`shared/ui/drawer.ts`) via icon hamburger ; entrées en pilule, active `bg-primary/8 text-primary` et `aria-current="page"` ; bascule de thème en pilule bordée.
- **Focus visible:** outline 2px `primary`, cohérent avec les boutons.

### Pied de page (`layout/components/footer/footer.ts`)

- **Titre de colonne** (`@utility footer-heading`) : `mb-3 text-xs font-semibold text-muted`, en JN Sans, sans capitales ni mono.

### Accueil : autocollant du premier écran (`features/home/application/home-hero-section.ts`)

- Le seul `app-sticker` du site (Sticker Rule) : « Fait main » (`HOME_HERO_STICKER_LABEL`), ton `sage`, `tilt="left"`, `data-testid="hero-sticker"`. Dans la colonne du cartouche, au-dessus de lui, aligné à droite, hors du flux (`absolute top-0 right-0` dans une colonne `relative pt-10` qui lui réserve sa place : posé dans le flux, il déplaçait la fiche au chargement, CLS 0,165 en mobile) : après le `h1` dans l'ordre du DOM, dans le flux (il ne recouvre aucun texte, à 375 px comme en large), hors de tout titre, lien ou bouton.

### Accueil de l'atelier (`features/workshop/pages/workshop/workshop.ts`)

- Même tête que la liste du blog : `h1` en `font-extrabold` (`clamp(2.75rem, 6vw, 5.25rem)`, `tracking-[-0.04em]`), puis l'intro en `text-muted`, `max-w-[56ch]`, un `<p>` par paragraphe, entrée en `animate-fade-up`. Aucun autocollant, aucun cartouche.
- **Les outils :** `<section aria-labelledby>` nommée par son `h2` (`section-title`, « Les outils »), `mt-14` sous l'intro ; liste `role="list"` en grille `gap-3`, une colonne en mobile, deux à partir de `sm`, trois à partir de `lg` ; un `a[app-link-card]` par outil, avec sur-titre, titre et résumé (`summary`).

### Guide des plaquettes (`features/workshop/pages/insert-guide/insert-guide.ts`)

- Même tête que l'accueil de l'atelier : `h1` en `font-extrabold`, chapô en `text-muted`, `max-w-[56ch]`, puis l'avertissement en `text-sm text-muted`, `max-w-prose`, toujours visible (les choix de Julien, à adapter).
- **Champ des matières :** `label` en `field-label` (« Matière ») lié au champ à suggestions (`app-suggest-input`, liste fermée), `max-w-sm`, `mt-12` sous l'avertissement, indication en `field-hint`. Il propose les matières saisies, sans doublon. Un choix remplace l'adresse (`?matiere=`) sans déplacer le focus.
- **Tableau :** sous la liste (`mt-10`), seulement quand une matière connue est choisie, dans une région `role="region"` nommée par le `caption`, focalisable (`tabindex="0"`, contour `primary` au focus clavier) qui défile horizontalement sur un écran étroit : la page, elle, ne défile jamais de côté. `caption` visible « Plaquettes pour <matière> » en `text-xl font-bold`, aligné à gauche ; en-têtes de colonne `table-head` (Opération, Plaquette, Rayon de bec, Remarque), filet bas `line-strong` de 1,5 px ; une ligne par entrée, filet `line`, dans l'ordre de la liste fermée des opérations. L'opération est l'en-tête de ligne (`th scope="row"`, `font-semibold`), la plaquette en `font-mono`, le rayon en mm (« 0,8 mm », insécable, `tabular-nums`), la remarque en `text-muted`.
- **Guide en cours de remplissage :** activé sans aucune ligne, une phrase en `font-medium` à la place de la liste.
- **Guide éteint :** la page rend la page 404 (`app-page-not-found`), en vraie 404 serveur ; la carte disparaît de l'accueil de l'atelier, la section « Les outils » aussi quand elle n'a plus de carte.

### Page 404 (`pages/page-not-found.ts`)

- Le retour à l'accueil est un `<a appButton routerLink="/">` primaire, sans classe propre.

### Coque admin (`features/admin/pages/admin-layout/admin-layout.ts`, `application/components/admin-nav.ts`)

- **Landmarks:** `App` garde le seul `<main>` ; la coque n'émet ni `main`, ni `aside`, ni titre. Header et Footer publics absents sous `/admin` dès le premier rendu (l'adresse demandée suffit, sans attendre la navigation).
- **Barre latérale (à partir de `lg`, 1 024 px):** colonne de `15.75rem`, `sticky top-0 h-svh`, filet droit `line`. En tête, monogramme « JN » (carré 40 px, `rounded-[0.625rem]`, `border-primary/30`, `bg-primary/5`, `text-primary`) et « Julien Nédellec / Administration » (mono 12 px). Contenu de page : `max-w-[72.5rem]`, `px-14 pt-11`, corps 15 px.
- **Navigation:** un seul `<nav aria-label="Administration">`. « Vue d'ensemble » hors groupe, puis trois groupes `role="group"` nommés par `aria-labelledby` : Contenu (Projets, Articles, Parcours, CV), Audience (Audience, Messages), Compte (Paramètres). Libellé de groupe en mono 12 px capitales, `tracking-[0.06em]`, `text-muted`. Lien de 44 px, `text-muted`, survol `bg-surface-elevated`. Page courante : `aria-current="page"` (via `routerLinkActive`), texte `foreground` semi-gras, libellé souligné d'un trait intérieur de 2 px `primary` (même grammaire que le groupe de filtres), icône `primary`. Comptes en mono 12 px à droite (projets, articles, non-lus, ce dernier en `primary` dès qu'il y en a un), suffixe « non lu(s) » en `sr-only`.
- **Pied:** « Voir le site » (nouvel onglet, annoncé en `sr-only`), bascule de thème (« Passer en mode clair / sombre »), « Se déconnecter », e-mail du compte en mono 12 px.
- **Mobile (sous `lg`):** barre `sticky` (monogramme 34 px, libellé de la page courante en display 16 px, bouton menu 44 px `aria-expanded` + `aria-controls="admin-drawer"`), tiroir `Drawer` à gauche avec la même navigation ; un lien ou « Se déconnecter » le ferme.

### En-tête de page admin (`features/admin/application/components/admin-page-header.ts`)

- Grammaire des pages publiques, plus dense : sur-titre mono 13 px `text-primary` (compte ou période, `admin-page-copy.ts`), `h1` unique `font-extrabold leading-none tracking-[-0.04em]` (`2.5rem` en mobile, `clamp(2.25rem, 3.4vw, 3.25rem)` à partir de `lg`), `tabindex="-1"` pour recevoir le focus après une suppression, introduction `max-w-[60ch]` `text-muted` 17 px.
- Action principale ou cartouche projetées par `[adminPageAside]` dans une seconde colonne de `22rem` alignée en bas (à partir de `lg`, seulement si un aside est projeté).
- Dates des sur-titres en français, « 1er » pour le premier jour du mois.

### Vue d'ensemble admin (`features/admin/pages/admin-overview/admin-overview.ts`)

- **En-tête:** sur-titre « Mercredi 7 octobre 2026 · 30 derniers jours » (date lue à l'ouverture de la page), `h1` « Vue d'ensemble », introduction = phrase de synthèse (`overview-copy.ts`) ; cartouche « En ligne » (`nedellec-julien.fr`, une rangée par nature puis « Articles ») en aside.
- **Grille:** deux rangées de deux colonnes `minmax(0,1.65fr) / minmax(0,1fr)`, gouttière 56 px, à partir de `lg` ; une colonne en dessous. Audience et Contacts, puis Contenu en ligne et Actions rapides.
- **Titres de section:** `AdminSectionHead` (`h2` Bricolage Grotesque gras 22 px, filet bas `line-strong` 1,5 px, lien « … → » `text-primary` 44 px à droite).
- **Audience:** grand chiffre des visiteurs (Bricolage Grotesque extra-gras 64 px, 52 px en mobile), sessions en `text-muted`, courbe des visiteurs seule (trait `primary` 2 px, aire `primary` 12 %, traits droits, sans axes), légende textuelle en `figcaption` `sr-only` ; relevé en dessous.
- **Contacts:** deux chiffres liés (non-lus, CV sur 30 jours), puis les trois derniers messages ou l'état vide « Boîte vide » avec « Ouvrir la page Contact » (nouvel onglet).
- **Contenu en ligne:** cinq rangées (articles publiés récents, puis projets dans l'ordre public), vignette 16/10 (projet) ou 1200/630 (article) décorative, titre en lien étiré, méta mono 12 px, tampon (« Publié » ou nature) ; état vide « Rien en ligne ».
- **Actions rapides:** liens `appButton` (« Nouveau projet ») puis `appButton variant="outlined"`.
- **Indisponible ≠ zéro:** une source en chargement montre un squelette (`role="status"`), une source en erreur affiche « indisponible » (ou « — » `aria-hidden` + `sr-only`) là où elle compte et une seule `LoadError` par section, jamais un « 0 ».

### Relevé (`features/admin/application/components/admin-readout.ts`)

- **API:** `items: readonly ReadoutItem[]` (`{ label, value, unit, detail }`).
- **Structure:** un seul `dl`, une entrée par `div` : `dt` mono 12 px capitales `text-muted`, `dd` = valeur Bricolage Grotesque gras 34 px `tabular-nums` suivie de l'unité à 0,55 em, puis détail 13 px `text-muted`.
- **Traits:** filet haut `line-strong` 1,5 px, filet bas et séparateurs verticaux `line` ; colonnes égales à partir de `sm`, deux colonnes en dessous.

### État vide (`features/admin/application/components/admin-empty-state.ts`)

- **API:** `stamp` (requis) ; phrase et action projetées.
- **Apparence:** cadre tireté `line-strong` 1 px, `rounded-sm`, tampon en premier, texte 14 px `text-muted` limité à 42 caractères. Un état vide dessiné, pas un texte centré gris.

### Liste éditoriale des projets (`features/admin/application/components/admin-project-row.ts`)

- **Filtre:** `FilterGroup` « Filtrer par nature » (Tous + trois natures, comptes, nature vide désactivée) au-dessus de la liste.
- **Ligne:** hôte `li` (liste `ul role="list"`), filet bas `line`, `py-6.5`. À partir de `lg`, grille `2.25rem / 13.5rem / minmax(0,1fr) / auto`, `gap-7` : rang mono 13 px `text-muted` (décoratif, `aria-hidden`), `ProjectCover` 16/10 avec son tampon, corps, actions. Entre `sm` et `lg` : couverture `10rem` à gauche, actions sous le corps ; sous `sm`, tout empilé.
- **Corps:** sur-titre mono 12 px « 01 · Catégorie » (rang dans la liste complète, stable sous un filtre), `h2` Bricolage Grotesque extra-gras 22 px `tracking-[-0.03em]`, accroche 14,5 px `text-muted` `line-clamp-2` limitée à 62 caractères, ou mention « Accroche vide : … » 13 px précédée d'un point `primary` 6 px ; `FactList` (Stack : 4 outils + « +N », Accueil : Mis en avant) limitée à `40rem`.
- **Actions:** trois cibles de 44 px nommées « Voir la fiche publique : X (nouvel onglet) », « Modifier : X » (liens `appButton variant="ghost-icon"`) et « Supprimer : X » (`appButton variant="text-danger"`).

### Éditeur de projet (`features/admin/pages/admin-project-editor/admin-project-editor.ts`, `application/components/admin-project-form.ts`)

- **En-tête:** fil d'Ariane `nav aria-label="Fil d'Ariane"` mono 13 px (« Projets » `text-primary` 44 px, `/` décoratif, page courante `aria-current="page"`), `h1` de l'en-tête admin (titre **enregistré**, il ne suit pas la saisie), phrase sur le déploiement ; actions à droite : « Voir l'aperçu » `appButton variant="outlined"` (icône `eye`, `routerLink="." fragment="apercu"`, masqué à partir de `lg`) et « Voir la fiche » `appButton variant="outlined"` pour un projet existant.
- **Colonnes:** à partir de `2xl` (1 536 px), grille `minmax(0,1fr) / 25rem`, `gap-14` ; la seconde colonne (`id="apercu"`, `scroll-mt-6`) suit le formulaire dans le DOM, `2xl:sticky 2xl:top-6`, et empile l'aperçu public puis le sommaire, `gap-3.5`. Sous `2xl`, elle passe sous le formulaire (`gap-10`) et le lien « Voir l'aperçu » y mène : avec la barre latérale, une colonne de 25rem plus tôt laisserait moins de 560 px au formulaire (204 px à 1 024, 460 à 1 280, mesurés).
- **Couverture:** groupe « Couverture » (`role="group"`) ; avec une image enregistrée, `ProjectCover` (tampon de nature, `alt` « Couverture actuelle de X ») et zone de dépôt côte à côte à partir de `sm` (`15rem / minmax(0,1fr)`, `gap-4.5`), empilées dessous ; sans image, la zone seule. La zone ne montre plus l'image enregistrée, seulement le fichier choisi. Retirer le fichier (×) annule la couverture en attente ; un fichier qui n'est pas une image vide la zone avec le toast « Seules les images sont acceptées. » (même règle sur l'éditeur d'article).
- **Sections:** `fieldset[app-admin-form-section]`, légende flottante pleine largeur : numéro mono 13 px `text-primary` « 01 · », titre Bricolage Grotesque gras 21 px, description 14 px `text-muted`, filet bas `line-strong` 1,5 px. 34 px entre deux sections. La section Galerie est hors du `<form>` (formulaires imbriqués interdits).
- **Nature:** trois cartes-radios (`label` bord `field` `rounded-md` `p-3.5`, radio natif invisible, pastille 18 px dessinée, tampon, définition 13 px `text-muted`) ; cochée : bord et trait intérieur `primary` ; focus clavier : contour 2 px `primary` décalé de 2 px sur la carte.
- **Lignes répétées:** colonnes `2rem / 11rem / 1fr / 2.75rem` (N°, champ, champ, suppression), en-tête mono 12 px capitales décoratif, libellés numérotés en `sr-only` ; sous `sm`, le second champ passe sous le premier.
- **Galerie:** légende de section seul titre ; liste `ul role="list"` en grille de requête de conteneur (hôte `@container`) : 1 colonne, 2 à partir de 26rem, 3 à partir de 36rem, `gap-4.5` ; la zone d'ajout reste sous la liste. Chaque capture est un seul `form` (texte alternatif) en pile : vignette 16/10 `rounded-md` trait `line-strong`, libellé `field-label`, champ puis « Enregistrer » `outlined`, et une barre position mono 12 px « 2 / 5 » + actions icônes 44 px (`arrow-up`, `arrow-down`, `trash` danger), noms accessibles « Monter / Descendre / Supprimer la capture n ». « Monter » absent sur la première, « Descendre » sur la dernière ; la suppression se confirme en ligne.
- **Barre d'enregistrement (`components/admin-save-bar.ts`):** hôte `sticky bottom-0 z-10`, filet haut `line-strong` 1,5 px, fond `background`, `py-3.5`, `mt-10` sous le formulaire. À gauche l'état `role="status"` 14 px précédé d'un point 6 px (`primary` s'il y a des modifications, `line-strong` sinon) : « Aucune modification », « 1 modification non enregistrée », « n modifications non enregistrées » (brouillon, ensemble de tags et couverture choisie comptés champ par champ). À droite « Annuler » `appButton variant="outlined"` (lien vers la liste, passe par la garde) et « Enregistrer » `appButton` `type="submit" form="project-form"`, désactivé **seulement** pendant l'envoi (`disabled:opacity-60 disabled:cursor-wait`), jamais par une erreur ni à zéro modification.
- **Aperçu public (`components/admin-project-preview.ts`):** `section` nommée par son `h2` « Aperçu public », cadre `rounded-sm` trait `line-strong` 1,5 px ; tête `bg-surface` `p-3.5` (titre Bricolage Grotesque gras, référence mono 12 px « Réalisations · <nature> », « en direct » mono 12 px à droite), filet `line-strong` 1,5 px ; mention « Nouvelle couverture : visible ici après l'enregistrement. » 13 px quand un fichier attend (`NgOptimizedImage` refuse `blob:`) ; corps `inert` `bg-background` `p-4.5` : la vraie `ProjectCaseStudy` (production, rang `max(order, 1) − 1`) ou la vraie `ProjectGridCard` (démo, script), hors focus et hors arbre accessible ; sans nature, « Choisissez une nature pour voir la carte. » centré 14 px `text-muted`.
- **Sommaire (`components/admin-form-toc.ts`):** `nav aria-label="Sections du formulaire"`, filet haut `line` ; cinq liens 44 px, filet bas `line`, 14 px `text-muted` (survol `foreground`) : libellé court « 02 · Présentation » à gauche, état mono 12 px `text-primary` « modifié » à droite. `routerLink="." [fragment]` (un `href="#id"` sous `<base href="/">` ouvrirait `/#id`) ; le défilement passe par `anchorScrolling`.
- **Quitter:** garde `unsavedChangesGuard` sur `projects/new` et `projects/:id` ; avec des modifications, `ConfirmDialog` « Quitter sans enregistrer ? » / « Quitter sans enregistrer » (danger) / « Continuer l'édition » (focus initial) ; fermeture d'onglet ou rechargement : boîte native `beforeunload`.

### Liste des articles (`features/admin/pages/admin-blog/admin-blog.ts`, `components/admin-post-row.ts`)

- **Filtre:** `FilterGroup` « Filtrer par statut » (Tous, Publiés, Brouillons ; comptes de la liste entière, statut vide désactivé) au-dessus du tableau.
- **Tableau:** `table` pleine largeur, `caption` `sr-only` qui dit l'ordre (« Articles, du plus récent au plus ancien » ou l'inverse) ; six `th scope="col"` mono 12 px capitales `text-muted`, filet bas `line-strong` 1,5 px : Article, Statut, Publié le, Lecture, J'aime, actions (`sr-only`). Seul « Publié le » est triable : `aria-sort` sur le `th`, `button` natif 44 px avec flèche `arrow-down` / `arrow-up` décorative ; les brouillons restent en fin dans les deux sens.
- **Ligne (`tr[app-admin-post-row]`):** filet bas `line`, `py-3.5`. Cellule Article : vignette 1200/630 de `8rem` (`rounded-sm`, trait `line-strong`, `bg-surface`, `alt=""`, « sans couverture » mono décoratif sans image), titre Bricolage Grotesque gras 17 px, sujets mono 12 px `text-muted` (trois premiers, « A · B · C ») ; statut en `Stamp` (« Publié », « Brouillon » pointillé) ; date mono 14 px (« — » décoratif et « non publié » `sr-only` pour un brouillon) ; lecture mono « 13 min » ; j'aime mono aligné à droite `tabular-nums`.
- **Actions:** cibles de 44 px sur une ligne à partir de `sm` : « Lire en ligne : X (nouvel onglet) » (publiés seulement, `/blog/<slug>`, `noopener`), « Modifier : X » (lien vers l'éditeur), « Supprimer : X » (`appButton variant="text-danger"`, confirmation).
- **Petit écran:** sous `md`, Publié le, Lecture et J'aime (`th` et `td`) passent en `hidden md:table-cell` et la cellule Article les reprend en méta mono 12 px (« 9 sept. 2026 · 13 min · 0 j'aime », « Non publié · … ») ; sous `sm`, la vignette disparaît et les actions s'empilent dans leur cellule. Aucun défilement horizontal à 375 px.

### Éditeur d'article (`features/admin/pages/admin-post-editor/admin-post-editor.ts`, `application/components/admin-post-form.ts`)

Même grammaire que l'éditeur de projet (en-tête, colonnes, sections, barre, sommaire, garde), à ces différences près :

- **En-tête:** fil d'Ariane « Articles », `h1` = titre enregistré ou « Nouvel article » ; seule action, « Voir l'aperçu » sous `lg`.
- **États:** squelette `role="status"` ; `LoadError` avec « Réessayer » ; article absent de la liste : « Cet article n'existe pas ou a été supprimé. » centré `text-muted` ; les deux derniers suivis du lien « Retour aux articles ».
- **Sections:** `01 · Article` (titre, extrait, sujets), `02 · Contenu` (Markdown en mono 14 px sur 20 lignes, puis son rendu sous le champ par le corps d'article du site (`BlogArticleBody`, titres abaissés d'un niveau, code coloré), groupe nommé « Rendu », 32rem de haut au plus avec défilement), `03 · Couverture` (image enregistrée 1200/630 `15rem` et zone de dépôt côte à côte à partir de `sm`), `04 · Publication` (deux cartes-radios « Brouillon » / « Publié », bord `field`, cochée en `primary`, et la mention « Publier l'article redéploie le site : il est en ligne quelques minutes plus tard. » en `field-hint` si « Publié »).
- **Barre de mise en forme (`components/admin-markdown-toolbar.ts`, directive `markdown-editor.ts`):** entre le libellé « Contenu (Markdown) » et la zone, une seule rangée `flex-wrap`, `gap-1`, posée sur un filet bas `line` (`pb-1.5`, `mb-2`). `role="toolbar"` « Mise en forme du contenu », `aria-controls` vers la zone. Dans l'ordre : le `select` « Niveau du texte » (`app-select`, Paragraphe, Titre 2, Titre 3, Titre 4, et « Autre titre » désactivé pour `#`, `#####`, `######`), qui suit la ligne du curseur ; un séparateur décoratif (`h-6 w-px bg-line`, `aria-hidden`) ; douze boutons icônes de 44 px (`size-11`, `rounded-md`, `text-foreground`, survol `surface-elevated`, icône 16 px du sprite) : Gras, Italique, Souligné, Barré, Code en ligne, Lien, Image, Liste à puces, Liste numérotée, Citation, Bloc de code, Séparateur. Nom par `aria-label`, raccourci par `aria-keyshortcuts` (Ctrl/⌘ + B, I, U, E, K), aucun `aria-pressed` (la source est du Markdown). Listes et citation basculent les lignes touchées (une liste remplace l'autre, numérotation depuis 1) ; lien `[texte](https://)` avec l'adresse sélectionnée ; bloc de code ```` ```ts ```` avec `ts` sélectionné, séparateur `---` et image posés dans leur propre paragraphe. Focus itinérant : un seul contrôle tabulable, flèches gauche/droite avec retour aux bords, Début, Fin ; Haut/Bas restent au `select`. Anneau de focus global (2 px `primary`, décalé de 2 px) sur les boutons, anneau `ring-primary` d'`app-select` sur le menu ; pas de `transition-colors` sur les boutons (la couleur de l'anneau partirait de `currentColor`). Les boutons écrivent dans la zone par `execCommand('insertText')` (Ctrl+Z / Ctrl+Maj+Z natifs), jamais dans le modèle : aperçu, compteur et garde suivent comme à la frappe. Région `role="status"` `sr-only` sous la barre : « Gras appliqué » / « Gras retiré », « Liste à puces appliquée » / « retirée », « Lien inséré », « Image insérée »…, pour un clic comme pour un raccourci, réannoncée si la même phrase revient. À 375 px, la rangée passe sur trois lignes, sans défilement horizontal. Sous la zone, l'indication `field-hint` (`aria-describedby`) liste en `code` les identifiants courts des langages du catalogue (`ts`, `js`… `py`).
- **Panneau « Insérer une image » (`components/admin-content-image-upload.ts`):** bouton Image en disclosure (`aria-expanded`, fond `surface-elevated` ouvert, `aria-controls` vers le panneau). Panneau sous la barre, hors du `role="toolbar"`, `div role="group"` (pas de `<form>`, il vit dans celui de l'article) : carte `bg-surface`, bord `line`, `rounded-md`, `p-4`, une colonne `gap-4`. Titre « Insérer une image » en `field-label`, zone de dépôt partagée (AVIF, WebP, PNG, JPEG, 5 Mo), champ « Texte alternatif » (`form-input`, `aria-required`, 300 caractères), message d'envoi `form-error` `role="alert"` (413, 422, autre), boutons `appButton` « Insérer l'image » (désactivé pendant l'envoi, il reprend le focus après) et `appButton variant="outlined"` « Annuler ». Le focus entre sur la zone de dépôt à l'ouverture ; Entrée dans le champ envoie sans enregistrer l'article ; Échap et « Annuler » rendent le focus au bouton Image ; après l'insertion, focus dans la zone et annonce « Image insérée ».
- **Aperçu public (`components/admin-post-preview.ts`):** même cadre que celui des projets, référence « Blog · Liste des articles » ; corps `inert` : la vraie `BlogPostRow` (jamais prioritaire), empilée dans la colonne de 25rem, temps de lecture en direct.

### Audience (`features/admin/pages/admin-audience/admin-audience.ts`, facade `audience-report.ts`)

- **En-tête:** `AdminPageHeader` (sur-titre de période, `h1` « Audience », introduction `audienceLead` : « 42 visiteurs, dont 18 venus de google.com. 9 sur 10 repartent après une page. »). Aside aligné à droite à partir de `lg` : « N visiteur(s) en ce moment » (point `status-success` décoratif, nombre en mono gras, texte simple sans région live : relevé toutes les 30 s), puis deux boutons contour 44 px, « Exclure cet appareil » / « Cet appareil est exclu » (`button` natif, `aria-pressed`, bord `primary` une fois pressé) et « Exporter en CSV ».
- **Période:** `FilterGroup` « Période » sans compte (7 jours, 30 jours, 90 jours, Depuis le début).
- **Relevé:** `AdminReadout` à quatre repères (Visiteurs, Pages vues, Rebond, Durée moyenne). Chargement : un squelette `role="status"` à la place du relevé et des sections ; une source en échec : une seule `LoadError` dont « Réessayer » ne relance que les sources en échec.
- **Visites par jour:** `AdminSectionHead` avec légende décorative (`aria-hidden`, trait plein `primary` « Visiteurs », tireté `foreground` 55 % « Pages vues ») ; `AudienceChart` : `figure` (courbe Chart.js de 15rem, `figcaption` `sr-only` = résumé de la période) puis `details` « Voir les données en tableau » (`summary` `text-primary` semi-gras 44 px, table jour / visiteurs / pages vues, jour en `th scope="row"`, nombres groupés, défilement vertical au-delà de 24rem dans une région focalisable).
- **Pages les plus vues, Provenance (`components/audience-share-table.ts`):** deux colonnes à partir de `lg`. `section` nommée par son `h2`, `table` à `caption` `sr-only`, en-têtes `table-head` (mono 12 px capitales `text-muted`, filet bas `line-strong` 1,5 px) ; une ligne par entrée (cinq au plus, le reste en « Autres ») : libellé (mono pour un chemin), barre décorative `h-1 bg-primary` sur piste `bg-line` rapportée à la plus grande ligne, nombre mono semi-gras, part mono `text-muted` (« 43 % »). Sans donnée : « Aucune donnée sur la période. »
- **Ce que les visiteurs font (`components/audience-tally.ts`):** grille 1 / 2 / 4 colonnes de listes `dl` titrées en `h3` mono capitales : Totaux, Projets cliqués, Articles ouverts, Articles lus jusqu'au bout, CTA cliqués, Navigateurs, Systèmes, Pays ; nom à gauche, nombre mono à droite, filets `line`. Liste vide : « Rien sur la période. » Plus de donuts.

### Messages (`features/admin/pages/admin-messages/admin-messages.ts`, `application/components/admin-message-row.ts`)

- **En-tête:** sur-titre « N non lu(s) · N au total » ; aside « Tout marquer comme lu » (bouton contour natif, icône `check`), `aria-disabled="true"` sans effet quand rien n'est non lu (reste focalisable et annoncé, `opacity-55`), jamais `disabled`.
- **Filtre:** `FilterGroup` « Filtrer par lecture » (Tous, Non lus, Lus ; comptes de la boîte entière, filtre à 0 inactif).
- **Liste:** `ul role="list"`, plus récent d'abord, sans pagination. Ligne `li[app-admin-message-row]` à filet bas `line` : grille 44 px / expéditeur (`14rem`, nom semi-gras, e-mail 13 px `text-muted`) / sujet (tronqué, précédé du tampon « Nouveau » si non lu) / date relative mono 12 px dans un `<time datetime>` (`8rem`) / actions (`8.25rem`, alignées à droite) ; sous `md`, actions sur la première ligne, sujet et date dessous. Bouton de dépliage natif 44 px (chevron qui pivote, `aria-expanded`, `aria-controls`, nom « Afficher / Masquer le message de X ») ; corps `text-muted` `max-w-[70ch]` décalé sous l'expéditeur.
- **Actions:** cibles de 44 px : « Répondre à X » (lien `mailto:`), « Marquer comme lu : X » (non lus seulement), « Supprimer le message de X » (`appButton variant="text-danger"`, confirmation).
- **Vide:** `AdminEmptyState` centré, tampon « Boîte vide ».
- **Échec:** un seul signalement, celui de la page : toast pour une écriture (état restauré), `LoadError` pour la lecture de la boîte. La lecture et les écritures de `HttpContactGateway` utilisées par l'admin portent `SKIP_ERROR_TOAST`.

### Éditeur de parcours (`features/admin/pages/admin-profile/admin-profile.ts`, `application/components/admin-profile-form.ts`)

Même grammaire que l'éditeur d'article (colonnes, sections, barre, sommaire, garde), pour un document unique : ni création, ni suppression, ni couverture.

- **En-tête:** pas de fil d'Ariane (lien « Parcours » de la navigation, icône `user`, entre Articles et CV) ; `h1` « Parcours », introduction « Les changements sont visibles sur le site au plus une seconde après l'enregistrement, au rechargement de la page. » `/admin/about` redirige ici.
- **États:** squelette `role="status"` « Chargement du parcours… » ; `LoadError` avec « Réessayer », suivi du lien « Retour à la vue d'ensemble ».
- **Sections:** `01 · Parcours` (titre, résumé, puis le début de l'accroche affiché en texte, jamais en champ, avec la mention `field-hint` « Commune à l'accueil et au parcours : se modifie dans le code. », puis « Suite de l'accroche »), `02 · Traits`, `03 · Ce que je fais` (résumé), `04 · Formations` (résumé), `05 · Motivation` (titre, énoncé, description). Ids préfixés `profile-`. Champ texte partagé (`components/admin-profile-text-field.ts`) : `field-label` avec « obligatoire », `form-input` (titres) ou `form-textarea` (prose), `aria-required`, erreur `form-error` `role="alert"` liée par `aria-describedby`. Un texte de blancs seuls est vide ; la borne (`PROFILE_LIMITS`, recopiée de l'API) se compte sur le texte coupé : « Le titre ne doit pas dépasser 80 caractères ».
- **Listes ordonnables (`components/admin-ordered-list.ts`):** paragraphes (01), traits (02), activités et stack (03), formations (04). `ol` de cartes (bord `line`, `rounded-md`, `p-4`), champs de la ligne à gauche, actions icônes de 44 px à droite : « Monter », « Descendre » (absents aux bords), « Supprimer » (`text-danger`), nommées « Monter le trait 2 » (mêmes verbes que la galerie). Champs de ligne libellés par leur rang (« Titre du trait 2 »), sans la mention « obligatoire ». « Ajouter un trait » (`appButton variant="text"`, icône `plus`) sous la liste, `aria-disabled` au maximum (8 paragraphes, 6 traits, 6 activités, 18 technologies, 8 formations), focusable, clic sans effet. Région `role="status"` `sr-only` : « Trait déplacé en position 1 », « … ajouté en position N », « … supprimé ». Focus : bouton du même sens sur la ligne déplacée (l'opposé au bord), premier champ d'une ligne ajoutée, « Supprimer » de la ligne qui prend la place ou le bouton d'ajout. Liste vidée : « Ajoutez au moins un trait. » en `form-error` `role="alert"`. Icône de techno : `select` (`app-select`) sur la liste fermée des six fichiers `public/icons/`, invite désactivée « Choisir une icône » ; une icône stockée hors liste est à rechoisir. Compétences : une par ligne (indication `field-hint`), lignes vides ignorées, 80 caractères et 12 compétences au plus.
- **Portrait (`components/admin-profile-portrait.ts`):** `fieldset` « 06 · Portrait » après le formulaire, hors de lui (au sommaire, jamais marqué) : vignette 4:5 de 10rem (`NgOptimizedImage` `fill`, sans `priority`), alt « Portrait de Julien Nédellec », `/avatar.avif` et la mention « Portrait par défaut » sans portrait ; zone de dépôt (AVIF, WebP, PNG ou JPEG, 5 Mo au plus) qui envoie dès le dépôt, remise à zéro ensuite, statut `role="status"` « Envoi du portrait… » ; « Revenir au portrait par défaut » (`text-danger`) derrière `ConfirmDialog`. Hors du brouillon : un envoi ne compte jamais comme modification. Toasts « Portrait remplacé », « Portrait par défaut rétabli », refus de type, échecs avec détail sur 422 et « Réessayez dans quelques secondes. » sur 503.
- **Barre:** « Annuler » mène à `/admin`. Succès : toast « Parcours enregistré », compte à zéro, champs repartis du document renvoyé. Version périmée (409) : toast « Le parcours a été modifié depuis une autre fenêtre. Rechargez la page… », saisie conservée. 400/422 : « Le parcours n'a pas pu être enregistré. Détail : … ».
- **Garde:** dialogue « Les modifications non enregistrées du parcours seront perdues. ».

### Éditeur du guide des plaquettes (`features/admin/pages/admin-insert-guide/admin-insert-guide.ts`, `application/components/admin-insert-guide-form.ts`, `admin-insert-guide-group.ts`, `admin-insert-guide-tool.ts`)

Même cadre que l'éditeur de parcours (document unique, version, garde), sans sommaire : la colonne de droite porte un encadré « Avant d'enregistrer » (bord `line`, rappel de confidentialité, lien « Voir la page publique »).

- **En-tête:** lien « Guide des plaquettes » de la navigation (icône `wrench`, après CV) ; `h1` « Guide des plaquettes ».
- **Interrupteurs:** deux cases à cocher (`size-5 accent-primary`) dans leur `label`, l'une sous l'autre (`grid gap-4`) : « Guide des plaquettes visible sur le site », puis « Décodeur de plaquette visible sur le site ». Chacune est décrite (`aria-describedby`) par une phrase d'aide en `field-hint` sous son `label`, qui dit ce qu'elle met en ligne : la page et sa carte sur l'accueil de l'atelier, et pour le décodeur, les liens des codes du guide vers leur décodage.
- **Blocs par matière (motif « bloc repliable et lignes compactes ») :** un `details` natif par matière (sélecteur d'attribut `details[app-admin-insert-guide-group]`, bord `line`, `rounded-md`), replié par défaut ; son `summary` (44 px, chevron `chevron-right` tourné d'un quart à l'ouverture sous `motion-safe`) porte le nom de la matière (« Nouvelle matière » tant qu'il est vide) et son compte en texte (« 1 outil », « 12 outils », `counted`). Ordre : première apparition dans le document, bloc « Toutes matières » en dernier. L'état ouvert est un signal du formulaire (clés ouvertes), resynchronisé par l'évènement `toggle` : un bloc ajouté s'ouvre, un bloc en erreur s'ouvre à l'enregistrement avant que le focus n'aille au premier champ invalide, l'état tient après un enregistrement réussi. Une fois ouvert : « Nom de la matière » (`app-suggest-input`, « Matières déjà saisies », vaut pour tous les outils du bloc ; le bloc générique affiche à la place « Ces outils s'affichent sous chaque matière du guide. »), puis les outils, puis « Ajouter un outil » (`variant="text"`, nom « Ajouter un outil à X ») et « Retirer la matière » / « Retirer le bloc » (`text-danger`). Sous les blocs : « Ajouter une matière » (inséré avant le bloc générique) et « Ajouter le bloc Toutes matières » tant qu'il n'existe pas.
- **Ligne d'outil compacte :** `div[app-admin-insert-guide-tool]` `role="group"` (« Outil 2 de X »), filet haut `line`, colonnes Opération, Plaquette, Rayon, Remarque, Retirer partagées avec l'en-tête de colonnes (`@utility tool-row-grid`, en-tête `aria-hidden`, affiché dès `lg`). Dès `lg`, une rangée par outil (Opération 16rem au plus, Rayon 4,75rem, Retirer icône seule de 44 px) ; en dessous, deux rangées sur quatre colonnes : Opération et Plaquette, puis Rayon, Remarque et Retirer, chaque champ coiffé de son libellé court en `text-xs text-muted`. Chaque champ a un `label` dont la partie visible est le libellé court (masqué dès `lg`) et la suite `sr-only`, d'où un nom complet : « Plaquette, outil 2 de 1.8522 (33CrMoV12) », « … du bloc 3 » pour un bloc sans nom, « … de Toutes matières ». Rayon décrit par une phrase unique sous le titre de la section (« Rayon de bec facultatif… »). Focus : opération de l'outil ajouté, nom de la matière ajoutée, opération du bloc générique ajouté, « Ajouter un outil » du bloc après un retrait, « Ajouter une matière » quand le bloc disparaît (dernier outil retiré ou « Retirer la matière »).
- **Confidentialité:** une référence repérée par `findConfidentialReferences` dans un outil (plaquette, remarque) ou dans le nom d'une matière ajoute sous lui un encadré `border-status-warn/40 bg-status-warn/10` « Référence repérée : « … ». Vérifiez qu'elle ne désigne ni une pièce, ni un plan, ni un ordre de fabrication. », sans bloquer l'enregistrement.
- **Validation:** bornes de l'API (matière 80, plaquette 40, remarque 200 caractères ; rayon supérieur à 0, au plus 10 mm, deux décimales ; 300 outils au plus en tout), matière exigée une fois par bloc (sauf le bloc générique), deux blocs du même nom refusés sur le second (« Le bloc « X » existe déjà : déplacez-y ces outils et retirez ce bloc »), première erreur sous le champ touché, `role="alert"`, reliée par `aria-describedby`.
- **Barre:** toast « Guide des plaquettes enregistré » ; 409 : « Le guide des plaquettes a été modifié depuis une autre fenêtre. Rechargez la page… », saisie conservée.

### CV (`features/admin/pages/admin-cv/admin-cv.ts`, `application/admin-cv-view.ts`)

- **En-tête:** sur-titre « PDF · 76 Ko · mis en ligne le 19 sept. 2026 » (taille par `formatFileSize`, source unique avec le cartouche et la zone de dépôt), `h1` « CV », phrase sur le bouton du site ; aside : `Cartouche` « CV en ligne », référence = nom du fichier, lignes Mis en ligne / Taille / Téléchargé (« 0 fois en 30 j », espace insécable, « indisponible » si le compte échoue, sans alerte ni toast). Aucun cartouche sans CV.
- **Actions:** « Ouvrir le PDF » `appButton variant="outlined"` (icône `external-link`, « (nouvel onglet) » `sr-only`, `noopener noreferrer`) puis « Retirer le CV du site… » (`appButton variant="text-danger"`, confirmation).
- **Téléversement:** `AdminSectionHead` « Remplacer le fichier » (ou « Mettre un CV en ligne » sans CV), `mt-12`, puis `FileDropzone` ; « Mettre en ligne » / « Annuler » sous la zone dès qu'un PDF est choisi. Un envoi réussi vide la zone (`resetToken`) ; un fichier qui n'est pas un PDF aussi, avec le toast « Seuls les fichiers PDF sont acceptés. ». Un échec d'envoi ou de retrait : un seul toast, celui de la page (`SKIP_ERROR_TOAST` sur les deux écritures).
- **Vide:** `AdminEmptyState` tampon « Aucun CV », phrase sur le bouton du site absent.

### Paramètres (`features/admin/pages/admin-settings/admin-settings.ts`, `application/components/admin-setting-row.ts`)

- **Sections:** `AdminSectionHead` « Sécurité » puis « Apparence » (`mt-12`).
- **Ligne de réglage (`div[app-admin-setting-row]`, `fieldset[app-admin-setting-row]`):** filet bas `line`, `py-4.5` ; titre (`h3`, ou `legend` flottante pour un `fieldset`) Bricolage Grotesque gras 16,5 px, explication 14 px `text-muted` limitée à 60 caractères, réglage à droite à partir de `sm` (deuxième colonne sur deux rangées), dessous sinon.
- **Sécurité:** « Double authentification » → « Configurer » (`appButton variant="outlined"` vers `/admin/settings/security`) ; « Session » « Connecté en tant que <e-mail>. » → « Se déconnecter » (`appButton variant="outlined"`, icône `sign-out`).
- **Apparence:** `fieldset` « Thème de l'administration », trois radios natives Système / Clair / Sombre (même `name`, appliquées au changement, sans soumission) dessinées en onglets comme `FilterGroup` : `label` 44 px `text-muted`, cochée = trait bas `primary` 2 px et texte `foreground` semi-gras, focus clavier = contour 2 px `primary` intérieur, piste `line` en trait intérieur bas. Même stockage que la bascule de la coque et du site.

### Sécurité (`features/auth/pages/two-factor-setup/two-factor-setup.ts`)

- `h1` « Sécurité » en tête de colonne (style de l'en-tête admin, sans l'importer : `features/auth` ne dépend pas de `features/admin`) ; statut « 2FA activé » en `Stamp` (`twofa-status`), plus en vert sur fond vert.

### Zone de dépôt (`shared/ui/file-dropzone.ts`)

- **API:** `accept`, `label`, `helperText`, `previewUrl`, `resetToken` (tout changement efface le fichier affiché, sans émettre `cleared`) ; sorties `fileSelected`, `cleared`. Le parent incrémente `resetToken` après un envoi réussi et au refus d'un fichier (CV, couvertures des éditeurs), et relaie `cleared` jusqu'à l'état qu'il envoie : un fichier retiré ou refusé n'est jamais envoyé.
- **Fichier choisi:** nom, puis taille par `formatFileSize` (`shared/format/format-file-size.ts`, « 1,2 Mo », la même que le cartouche du CV). Après le choix, le focus va sur « Remplacer », ou sur le bouton de la zone si le parent l'a remise à zéro ; après un retrait, sur le bouton de la zone.

### Toast (`shared/ui/toast.ts`)

Variantes info/success/warn/error, position haut droite, dismiss par le bouton fermer. Fond opaque `bg-surface` (No-Glass Rule : ni teinte translucide, ni `backdrop-blur`), `rounded-card`, ombre `shadow-lg`. Couleur : le titre est en `foreground` quelle que soit la sévérité ; la sévérité est portée par l'icône, la barre gauche `border-l-4` et le texte du bouton fermer, au token plein. Survol du bouton fermer neutre, `bg-foreground/5`. Sous `prefers-reduced-motion: reduce`, il apparaît sans glisser ni fondu.

### Drawer (`shared/ui/drawer.ts`)

Overlay, verrouillage du défilement, piège de focus (Tab et Maj+Tab restent dans le panneau), Échap ferme et rend le focus à l'élément qui l'a ouvert. Dans la coque admin, le bouton qui l'ouvre porte `aria-expanded` et `aria-controls` vers l'hôte du tiroir. Sous `prefers-reduced-motion: reduce`, le panneau apparaît sans glisser (le fond garde son fondu).

### Chart (`shared/ui/chart.ts`)

Wrapper Chart.js pour les KPI admin. Le seul endroit où des couleurs additionnelles (au-delà de l'accent `primary` + status) sont tolérées pour différencier les séries — mais elles doivent rester des dérivées de l'accent orange ou du texte du registre (pas de teal/coral aléatoire).

Courbe des visiteurs (`buildVisitorsChartData`) : une seule teinte, « Visiteurs » trait `primary` plein, « Pages vues » `foreground` 55 % tireté (4/4), traits droits (`tension: 0`). Couleurs lues sur les jetons du registre courant (`readChartPalette`) et relues à chaque bascule de thème ; repli couleur système `CanvasText`, jamais une couleur en dur.

## 6. Do's and Don'ts

### Do:

- **Do** passer par les tokens (`text-primary`, `bg-primary-bg`, `text-on-primary`, `bg-sticker-sage`…), jamais un hex ni une couleur de palette Tailwind en dur (sauf dans le front matter et `styles.css`).
- **Do** tester chaque composant en `.app-dark` ET sans `.app-dark` avant de merger (Two Registers Rule).
- **Do** poser un texte `on-primary` sur tout aplat orange, et un contour `foreground` sur un état sélectionné (Selected State Rule).
- **Do** utiliser `:focus-visible` sur tout interactif, anneau 2 px `primary` qui suit le rayon de l'élément.
- **Do** respecter `prefers-reduced-motion: reduce` : désactiver fade-up, view-transitions, animations au défilement.
- **Do** réserver le mono aux données (code, cotes, références, chiffres) ; libellés et sur-titres des pages publiques en JN Sans, sans capitales.
- **Do** garder la longueur de ligne du texte courant à 65–75ch (`max-w-prose` ou équivalent).
- **Do** utiliser les utilities `form-*`, `field-*`, `table-head` plutôt que de redéclarer les classes Tailwind, la directive `appButton` pour tout bouton ou lien stylé en bouton (ADR-0017) et `app-sticker` pour tout autocollant. Si tu dupliques 10+ classes sur un élément natif, crée une utility.
- **Do** documenter toute exception aux Named Rules au point d'usage (`/* exception: ... */`).
- **Do** recalculer et noter le contraste de toute nouvelle paire de couleurs, dans les deux registres, sur le fond et sur la surface.

### Don't:

- **Don't** introduire un second accent. Pas de bleu, de vert ou de rose hors du code et des autocollants (One Orange Rule).
- **Don't** poser un texte orange sur une teinte d'orange au-delà de 8 %, ni un texte blanc ou orange sur l'aplat orange (Accent Tint Rule).
- **Don't** ajouter un deuxième autocollant décoratif à un écran, un autocollant cliquable, un autocollant de plus de 4 mots, ni un « nuage » d'autocollants de technologies (Sticker Rule).
- **Don't** incliner un lien, un bouton, un titre ou un paragraphe ; seule une pastille courte peut l'être, de 2° au plus, sans animation.
- **Don't** utiliser `background-clip: text` + dégradé, ni aucun dégradé décoratif (favicon compris).
- **Don't** ajouter `backdrop-filter: blur()` ni une surface translucide « pour faire glass » (No-Glass Rule).
- **Don't** ajouter d'ombre à une carte « pour qu'elle ressorte » (Flat-By-Default Rule) : travaille le bord, la taille ou la typographie.
- **Don't** charger une police depuis Google Fonts ou un CDN, ni introduire une 4e famille, manuscrite comprise (Three Families Rule).
- **Don't** utiliser `border-left` ou `border-right` > 1px comme accent coloré (callout, alerte), sauf la barre de statut du toast.
- **Don't** utiliser `*ngIf` / `*ngFor` : control flow `@if` / `@for` uniquement (rappel CLAUDE.md).
- **Don't** styliser un champ avec `outline: none` sans `:focus-visible` de remplacement.
- **Don't** mettre une animation décorative au-dessus de 400ms ou avec un easing bouncy/elastic. Ease-out uniquement (`cubic-bezier(0.16, 1, 0.3, 1)` ou équivalent).
- **Don't** réutiliser le Display (800, taille `clamp`) pour un autre élément que le `<h1>` du hero.
- **Don't** confier une information à un trait `line` / `line-strong` seul, ni à la seule couleur (Decorative Line Rule).
- **Don't** présenter un site de démonstration comme une référence : tampon « Démo » dans le gabarit sur toute démo des Réalisations, aucune démo sur la home (qui ne montre que des projets en production) ni dans des données structurées de référence.
