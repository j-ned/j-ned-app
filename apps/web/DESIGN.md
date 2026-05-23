---
name: J-Ned Portfolio
description: Production-console aesthetic for a senior full-stack TypeScript portfolio.
colors:
  signal-indigo: "#4f46e5"
  signal-indigo-lifted: "#818cf8"
  signal-indigo-deep: "#4338ca"
  signal-violet-accent: "#a78bfa"
  signal-violet-deep: "#6d28d9"
  console-black: "#0a0a0a"
  console-text: "#fafafa"
  console-surface-1: "rgba(255,255,255,0.03)"
  console-surface-2: "rgba(255,255,255,0.06)"
  console-divider: "rgba(255,255,255,0.06)"
  console-muted: "#a1a1aa"
  ivoire-paper: "#faf7f2"
  ivoire-card: "#ffffff"
  ivoire-card-elevated: "#fefdfb"
  ivoire-ink: "#292524"
  ivoire-muted: "#57534e"
  ivoire-divider: "rgba(41,37,36,0.08)"
  status-success: "#16a34a"
  status-warn: "#d97706"
  status-error: "#dc2626"
typography:
  display:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(2.75rem, 7vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  body-large:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.06em"
  mono:
    fontFamily: "ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  none: "0"
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
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
    backgroundColor: "{colors.signal-indigo}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.signal-indigo-deep}"
    textColor: "#ffffff"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.console-text}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-outline-hover:
    backgroundColor: "{colors.console-surface-2}"
    textColor: "{colors.console-text}"
  tag-info:
    backgroundColor: "{colors.signal-indigo}"
    textColor: "{colors.signal-indigo-lifted}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  input-default:
    backgroundColor: "{colors.console-surface-1}"
    textColor: "{colors.console-text}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  card-surface:
    backgroundColor: "{colors.console-surface-1}"
    textColor: "{colors.console-text}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: J-Ned Portfolio

## 1. Overview

**Creative North Star: "The Production Console"**

Ce système visuel se comporte comme un panneau d'instrumentation de production : dark par défaut comme un terminal d'observabilité à 2h du matin, indigo comme accent de status, hiérarchie typographique nette comme un dashboard SRE. Le portfolio ne se présente pas, il s'inspecte. Le recruteur senior y lit la même précision instrumentale qu'il attend du code en production.

Le mode clair ivoire n'est pas un mode "alternatif accessibilité" — c'est l'équivalent du briefing du matin sur papier mat : même information, même hiérarchie, même indigo de signature, juste sur un support différent. Les deux modes sont des registres égaux, pas un théme et son fallback. La cohérence vient de Signal Indigo qui traverse les deux comme une encre signature, pas d'un mimétisme de tons.

Ce que ce système refuse explicitement : le gradient violet/bleu de SaaS marketing, les glassmorphisms décoratifs partout (ils existent ponctuellement, jamais en signature), le portfolio designer où la typo éditoriale étouffe le code, et le template Bootstrap junior à hero centré + cards icône-titre-paragraphe répétées.

**Key Characteristics:**
- Dark par défaut, ivoire chaud en alternative — jamais un "thème" et son inverse, deux registres équivalents.
- Signal Indigo unique : un seul indigo signature traverse les deux modes (#4f46e5 base), décliné en variantes lifted/deep selon le contexte.
- Densité d'instrumentation : la hiérarchie typographique est nette comme un dashboard, jamais aérée comme un poster.
- Focus visible non négociable : `:focus-visible` à 2px outline indigo sur tout interactif. C'est un signal de séniorité technique.
- Zéro motion gratuite : `prefers-reduced-motion` respecté, animations utilitaires (fade-up) plutôt que choréographies.

## 2. Colors: The Signal Indigo Palette

Palette à deux registres (Console / Ivoire), unifiés par un seul indigo signature décliné en trois intensités. Aucun gradient utilisé comme décoration ; le seul gradient toléré est `name-gradient` sur le `<h1>` du hero, et il est sur le banc d'essai (voir Do's and Don'ts).

### Primary

- **Signal Indigo** (`#4f46e5`, canonical `oklch(54% 0.22 277)`): l'encre signature. Boutons primaires, liens, rings de focus, mots-clés techniques (Angular, NestJS) en `<span class="kw">`, bordures actives. Présent dans les deux registres exactement à la même valeur. C'est l'élément qui dit "ce portfolio appartient à J-Ned".

- **Signal Indigo Lifted** (`#818cf8`, canonical `oklch(72% 0.16 277)`): le statut "actif" en dark, le texte indigo cliquable sur fond Console-Black. Utilisé pour `--theme-primary-text` en dark mode (la couleur du texte du nom, des kw, des liens).

- **Signal Indigo Deep** (`#4338ca`, canonical `oklch(45% 0.21 278)`): le statut "actif" en ivoire, le texte indigo lisible sur fond Ivoire-Paper. `--theme-primary-text` en light mode. Plus dense, moins flash, lisible sur paper.

### Secondary

- **Signal Violet Accent** (`#a78bfa`, canonical `oklch(72% 0.16 295)`): accent secondaire en dark. Utilisé sparingement pour différencier une action complémentaire d'une action primaire indigo. Jamais en gradient avec indigo (anti-pattern SaaS).

- **Signal Violet Deep** (`#6d28d9`, canonical `oklch(46% 0.24 295)`): version ivoire du violet accent. Mêmes règles : usage rare, jamais associé en gradient.

### Neutral — Console Register (dark)

- **Console Black** (`#0a0a0a`, canonical `oklch(15% 0.003 286)`): fond principal en dark. Neutre tinté de zinc, pas bleu pur. Évite l'effet "ChatGPT navy" et l'effet "noir absolu fatiguant".
- **Console Text** (`#fafafa`, canonical `oklch(98% 0.003 286)`): texte principal en dark. Crémeux pour réduire le contraste agressif d'un blanc pur sur noir pur.
- **Console Muted** (`#a1a1aa`, canonical `oklch(70% 0.005 286)`): texte secondaire, labels, hints. Contraste 4.5:1+ vérifié sur Console Black.
- **Console Surface 1** (`rgba(255,255,255,0.03)`): cards et conteneurs en dark. Translucide léger pour suggérer la profondeur sans alourdir.
- **Console Surface 2** (`rgba(255,255,255,0.06)`): hover/elevated state des surfaces. Différentiel de 3% qui suffit en dark.
- **Console Divider** (`rgba(255,255,255,0.06)`): séparateurs, bordures nav. Discret.

### Neutral — Ivoire Register (light)

- **Ivoire Paper** (`#faf7f2`, canonical `oklch(97% 0.008 75)`): fond principal en light. Chaud (stone), pas bleu-gris. Évite le clinique "white-paper SaaS".
- **Ivoire Card** (`#ffffff`): cards en light. Blanc pur comme le papier propre par-dessus le paper texturé.
- **Ivoire Card Elevated** (`#fefdfb`): hover/elevated des cards en light. Subtilement crème.
- **Ivoire Ink** (`#292524`, canonical `oklch(25% 0.008 50)`): texte principal en light. Stone-800 chaud, jamais slate-900 (qui serait froid et tirerait vers le SaaS).
- **Ivoire Muted** (`#57534e`, canonical `oklch(45% 0.012 75)`): texte secondaire en light. Stone-600.
- **Ivoire Divider** (`rgba(41,37,36,0.08)`): séparateurs et bordures en light.

### Status

- **Status Success** (`#16a34a`): badges success, états validés.
- **Status Warn** (`#d97706`): badges avertissement.
- **Status Error** (`#dc2626`): erreurs de form, messages destructifs.

### Named Rules

**The One Indigo Rule.** Il n'y a qu'un Signal Indigo. Pas de teal qui s'invite, pas de blue-500 Tailwind par accident, pas de "second accent pour différencier". Si tu veux différencier, tu changes l'intensité (lifted / deep) ou le style (outline vs solid), jamais la teinte.

**The Two Registers Rule.** Console (dark) et Ivoire (light) sont **égaux**. Ils ne sont pas "thème par défaut et alternative". Toute décision de design doit fonctionner aussi bien dans les deux registres ou n'est pas valide. Tester chaque composant en `.app-dark` ET sans `.app-dark` est non négociable.

**The Glassmorphism Containment Rule.** Les `rgba` sur Console Surfaces sont des dividers de profondeur subtils, **pas** un effet glassmorphic. Aucun `backdrop-filter: blur` n'est légitime en dehors du nav fixe (s'il est ajouté plus tard, justifier). Si tu ajoutes du blur à une card, c'est un anti-pattern.

## 3. Typography

**Display Font:** `system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`  
**Body Font:** identique au display (single-stack)  
**Label/Mono Font:** `ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace`

**Character:** stack système 100% — aucun Google Font chargé, CSP `font-src 'self'`. Choix assumé : performance maximale (zéro flash de texte invisible, zéro coût réseau), rendu natif OS sur chaque plateforme. Le portfolio dit "je connais le coût d'une font externe" plutôt que "j'ai trouvé une typo cool sur Google Fonts". Le mono est réservé aux labels de status, code snippets éventuels, métriques admin.

### Hierarchy

- **Display** (800, `clamp(2.75rem, 7vw, 5.5rem)`, line-height 1.05, tracking -0.02em): nom du hero (`<h1>` sur la home). Un seul par page, jamais réutilisé.
- **Headline** (700, `clamp(1.75rem, 3.5vw, 2.5rem)`, line-height 1.15, tracking -0.01em): titres de section (`<h2>` About, Projects, Contact).
- **Title** (600, `1.25rem`, line-height 1.3): titres de card, titres de projet dans la grille.
- **Body Large** (400, `1.125rem`, line-height 1.65): tagline du hero, intros de section. Max 65–75ch.
- **Body** (400, `1rem`, line-height 1.6): paragraphes courants. Max 65–75ch.
- **Label** (600, `0.75rem`, tracking 0.06em, **UPPERCASE**): admin table headers (`admin-th`), metadata, badges status.
- **Mono** (500, `0.875rem`, line-height 1.5): code inline, chiffres techniques (KPI admin), labels Sentry/observability.

### Named Rules

**The System-Stack Rule.** Aucune font externe ne sera chargée. Pas de Google Fonts, pas de @font-face local. Le portfolio démontre la maîtrise des contraintes perf en assumant le rendu OS. Si une font custom devient nécessaire, elle exige une justification produit écrite (pas "ça serait plus beau").

**The Single-Display Rule.** Un seul `<h1>` par page, en Display, jamais réutilisé pour décorer une autre section. La hiérarchie `<h1>` → `<h2>` → `<h3>` ne saute jamais un niveau.

**The Indigo Keyword Rule.** Dans la tagline du hero, les keywords techniques (`Angular`, `NestJS`) sont en Signal Indigo Lifted (dark) ou Signal Indigo Deep (light) avec `font-weight: 600`. Pattern réutilisable : `[innerHTML]` qui wrappe les keywords dans `<span class="kw">`. C'est le signal "ce profil revendique sa stack".

## 4. Elevation

Système **plat par défaut, layered par exception**. Pas de shadow décorative, pas d'effet flottant gratuit. La profondeur vient :

- En **Console (dark)**, par la translucidité des surfaces (`rgba(255,255,255,0.03)` puis `0.06` au hover). Aucune shadow.
- En **Ivoire (light)**, par les surfaces opaques blanches sur Paper crème + une shadow légère sur la nav fixe uniquement.

Aucun composant ne porte de shadow autre que les valeurs ci-dessous. Si un composant a besoin de "ressortir", on travaille la taille, la couleur ou le contraste typographique avant d'ajouter une shadow.

### Shadow Vocabulary

- **Nav shadow (Ivoire)** (`box-shadow: 0 1px 2px rgba(41,37,36,0.04), 0 4px 12px rgba(41,37,36,0.04)`): nav fixe en light, signale la séparation avec le contenu qui scrolle dessous.
- **Nav shadow (Console)** (`box-shadow: 0 1px 0 rgba(255,255,255,0.04)`): hairline lumineux en dark, équivalent fonctionnel de la shadow ivoire sans alourdir le terminal.
- **Button shadow primary** (`shadow-sm` Tailwind, ~`0 1px 2px rgba(0,0,0,0.05)`): subtil rappel d'élévation sur les CTA primaires uniquement.

### Named Rules

**The Flat-By-Default Rule.** Toute card, tout container, toute section commence sans shadow. Une shadow ne peut être ajoutée qu'avec une justification fonctionnelle (sticky nav, modal/drawer, dropdown flottant). Décorer = refuser.

**The No-Glass Rule.** Aucun `backdrop-filter: blur()` n'est légitime dans ce système. La translucidité des Console Surfaces est purement compositionnelle (rgba alpha), pas un effet glass.

## 5. Components

### Buttons (`shared/ui/button.ts`)

- **Shape:** `rounded-lg` (8px) par défaut, `rounded-full` (pill) sur demande.
- **Primary (solid):** `bg-primary-bg text-white border border-primary-bg` → hover `bg-primary-bg/90`. Padding `px-4 py-2` (default) / `px-6 py-3` (large).
- **Primary (outlined):** `border-primary/40 text-primary` → hover `bg-primary/10 border-primary/60`. Transparent au repos.
- **Primary (text):** `bg-transparent text-primary` → hover `bg-primary/10`. Aucun border.
- **Secondary (solid):** `bg-foreground/10 text-foreground border border-foreground/15` → hover `bg-foreground/15`. Pour actions complémentaires.
- **Focus:** outline 2px Signal Indigo, offset 2px, sur `:focus-visible` uniquement (pas au clic souris).
- **Active:** `translateY(1px)` (`scale: none`). Subtil feedback tactile, jamais bounce.
- **Disabled:** opacity 0.5, cursor not-allowed.
- **Loading state:** non implémenté actuellement → à ajouter (voir Do's and Don'ts).

### Tags / Badges (`shared/ui/tag.ts`)

- **Shape:** `rounded-md` (6px), padding `px-2 py-1`.
- **Severities:** info (blue-100/blue-700, dark: blue-900/30 + blue-300), success (green), warn (amber), error (red), secondary (slate).
- **⚠️ Drift:** les tags utilisent actuellement la palette Tailwind par défaut (blue, slate, etc.) au lieu de Signal Indigo. C'est cohérent pour status (success/warn/error) mais incohérent pour `info` et `secondary` qui devraient utiliser le système Signal/Console/Ivoire. À aligner.

### Cards / Containers

- **Console (dark):** background `bg-foreground/2` ou `bg-surface` (`rgba(255,255,255,0.03)`), border `border-foreground/8`, rounded `rounded-xl` (12px), padding `p-6` (24px).
- **Ivoire (light):** background `bg-surface` (white), border `border-foreground/8` (stone-800 à 8%), même radius et padding.
- **Hover:** background switch vers `surface-elevated` (`rgba(255,255,255,0.06)` ou `#fefdfb`).
- **Shadow:** aucune au repos. Hover = changement de surface, pas d'ajout de shadow.
- **Internal padding:** `p-6` (24px) standard, `p-8` (32px) pour cards principales du hero.

### Inputs / Forms (utility `form-input`)

- **Shape:** `rounded-lg` (8px), padding `px-3.5 py-2.5` (~14px / 10px).
- **Background:** `bg-surface` (Console Surface 1 en dark, white en light).
- **Border:** `border border-muted/30` (zinc-400 à 30% dark, stone-600 à 30% light) au repos.
- **Focus:** `focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary`. Pas d'outline supplémentaire.
- **Invalid:** `aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-500/30`.
- **Disabled:** opacity 0.5, cursor not-allowed.
- **Autofill override:** custom `-webkit-box-shadow` inset pour préserver la couleur de fond du thème (bug Chrome jaune par défaut neutralisé).
- **Textarea:** hérite de `form-input` + `min-h-[8rem] resize-y leading-relaxed`.
- **Label:** utility `form-label` → `text-sm font-medium mb-1.5`.
- **Error:** utility `form-error` → `text-xs text-red-400 mt-1`.

### Navigation

- **Header layout:** sticky en haut, background `var(--theme-background)`, border-bottom `var(--theme-nav-border)`, shadow `var(--theme-nav-shadow)`.
- **Liens:** sans soulignement par défaut, hover = `text-primary`, active = `text-primary` + indicateur (à clarifier dans Layout).
- **Mobile:** drawer (`shared/ui/drawer.ts`) via icon hamburger.
- **Focus visible:** outline 2px Signal Indigo cohérent avec les boutons.

### Admin Table (`admin-table*` utilities)

- **Shell:** `overflow-hidden rounded-xl border border-foreground/8 bg-foreground/2`.
- **TH:** `px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted border-b border-foreground/8`. Label style.
- **TD:** `px-4 py-3.5 text-foreground/90 border-b border-foreground/5`.
- **Row hover:** `bg-foreground/3` transition-colors.
- **Sortable header:** cursor pointer + hover text-foreground.
- **Empty state:** même shell, `px-6 py-16 text-center text-muted text-sm`.
- **Icon button:** `h-9 w-9 rounded-lg`, hover bg-surface-elevated. Variante danger : hover bg-red-500/10 + text-red-400.
- **Pagination:** `h-9 min-w-9 rounded-lg`, active = `bg-primary-bg/15 text-primary`.

### Toast (`shared/ui/toast.ts`)

À documenter — variantes info/success/warn/error, position, durée, dismiss.

### Drawer (`shared/ui/drawer.ts`)

À documenter — overlay, scroll-lock, focus trap, escape-to-close.

### Chart (`shared/ui/chart.ts`)

Wrapper Chart.js pour les KPI admin. Le seul endroit où des couleurs additionnelles (au-delà de Signal Indigo + status) sont tolérées pour différencier les séries — mais elles doivent rester dans la famille des dérivées indigo/violet (pas de teal/coral aléatoire).

## 6. Do's and Don'ts

### Do:

- **Do** utiliser `var(--color-primary)` ou `bg-primary` partout où on a besoin de Signal Indigo. Jamais `#4f46e5` ou `indigo-600` en dur (sauf dans le frontmatter et styles.css).
- **Do** tester chaque composant en `.app-dark` ET sans `.app-dark` avant de merger. La règle Two Registers est non négociable.
- **Do** utiliser `:focus-visible` sur tout interactif avec un ring 2px Signal Indigo. C'est un signal de séniorité (a11y AA strict).
- **Do** respecter `prefers-reduced-motion: reduce` — désactiver fade-up, view-transitions, scroll animations.
- **Do** réserver le mono à du contenu vraiment technique (code, chiffres, status).
- **Do** garder body line-length à 65–75ch maximum (`max-w-prose` ou équivalent).
- **Do** utiliser les utilities `form-*`, `admin-*`, `btn-*` plutôt que de redéclarer les classes Tailwind. Si tu dupliques 10+ classes, crée une utility.
- **Do** documenter toute exception aux Named Rules dans un commentaire au point d'usage (`/* exception: ... */`).

### Don't:

- **Don't** introduire un second accent color. Pas de teal, pas de coral, pas de "blue-500 par accident". One Indigo Rule.
- **Don't** utiliser `background-clip: text` + gradient comme style décoratif. **Le hero actuel (`name-gradient` sur `<h1>`) viole cette règle et est à reprendre.** Privilégier un Signal Indigo solide en `<span class="kw">` ou un weight contrast.
- **Don't** ajouter `backdrop-filter: blur()` à une card "pour faire glass". No-Glass Rule.
- **Don't** ajouter de shadow à une card "pour qu'elle ressorte". Flat-By-Default Rule — travaille la hiérarchie typographique ou la taille avant.
- **Don't** charger une Google Font. System-Stack Rule.
- **Don't** utiliser `border-left` ou `border-right` > 1px comme accent coloré (callout, alerte). Banned absolu impeccable.
- **Don't** utiliser `*ngIf` / `*ngFor` — control flow `@if` / `@for` uniquement (rappel CLAUDE.md).
- **Don't** styliser un input avec `outline: none` sans `:focus-visible` de remplacement. C'est la violation a11y la plus rapide à repérer dans un audit.
- **Don't** mettre une animation décorative au-dessus de 400ms ou avec un easing bouncy/elastic. Ease-out exponential uniquement (`cubic-bezier(0.16, 1, 0.3, 1)` ou équivalent).
- **Don't** utiliser le slate Tailwind (slate-50 → slate-900) dans le portfolio. Le système est tinté zinc/neutral (Console) ou stone (Ivoire) — jamais slate (froid bleuté). Les tags `secondary` actuels font cette violation.
- **Don't** réutiliser le Display (800, clamp size) pour un autre élément que le `<h1>` du hero.
- **Don't** introduire une 2e police custom "pour donner du caractère". La hiérarchie vient du weight + size + tracking.
