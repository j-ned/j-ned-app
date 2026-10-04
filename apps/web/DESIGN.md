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
  console-line: "color-mix(in srgb, #fafafa 9%, transparent)"
  console-line-strong: "color-mix(in srgb, #fafafa 22%, transparent)"
  ivoire-line: "color-mix(in srgb, #292524 12%, transparent)"
  ivoire-line-strong: "color-mix(in srgb, #292524 28%, transparent)"
  status-success: "#16a34a"
  status-warn: "#d97706"
  status-error: "#dc2626"
typography:
  display:
    fontFamily: "'Archivo', 'Archivo Fallback', system-ui, sans-serif"
    fontStretch: "108%"
    fontSize: "clamp(2.75rem, 7vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Archivo', 'Archivo Fallback', system-ui, sans-serif"
    fontStretch: "106%"
    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Archivo', 'Archivo Fallback', system-ui, sans-serif"
    fontStretch: "104%"
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
    letterSpacing: "0.06em"
  mono:
    fontFamily: "'JN Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
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
    rounded: "6px"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.signal-indigo-deep}"
    textColor: "#ffffff"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.console-text}"
    rounded: "6px"
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

Palette à deux registres (Console / Ivoire), unifiés par un seul indigo signature décliné en trois intensités. Aucun gradient utilisé comme décoration, titres compris : le `<h1>` du hero est en texte plein, son accent unique en Signal Indigo.

### Primary

- **Signal Indigo** (`#4f46e5`, canonical `oklch(54% 0.22 277)`): l'encre signature. Boutons primaires, liens, rings de focus, accent du `<h1>` du hero, bordures actives. Présent dans les deux registres exactement à la même valeur. C'est l'élément qui dit "ce portfolio appartient à J-Ned".

- **Signal Indigo Lifted** (`#818cf8`, canonical `oklch(72% 0.16 277)`): le statut "actif" en dark, le texte indigo cliquable sur fond Console-Black. Utilisé pour `--theme-primary-text` en dark mode (la couleur du texte du nom, de l'accent du `<h1>` du hero, des liens).

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

### Lines — traits du dessin technique

- **Line** (`--color-line` : Console `foreground` à 9 %, Ivoire `foreground` à 12 %) : séparateurs internes du cartouche.
- **Line Strong** (`--color-line-strong` : Console 22 %, Ivoire 28 %) : cadre et barre de titre du cartouche.

Contrastes calculés (composition sRGB, WCAG 2.x) : `line` 1,22:1 (Console, fond) à 1,26:1 (Ivoire) ; `line-strong` 1,77:1 (Ivoire, fond) à 1,94:1 (Console, carte). Ces deux traits sont **décoratifs** : sous 3:1, ils ne portent jamais seuls une information et ne délimitent jamais un composant interactif (WCAG 1.4.11). Le trait de cote est dessiné en `currentColor` = `text-primary` (6,33:1 à 7,90:1 selon registre et surface).

### Status

- **Status Success** (`#016630`, green-800 en Ivoire): badges success, états validés.
- **Status Warn** (`#973c00`, amber-800 en Ivoire): badges avertissement.
- **Status Error** (`#9f0712`, red-800 en Ivoire): erreurs de form, messages destructifs.

### Named Rules

**The One Indigo Rule.** Il n'y a qu'un Signal Indigo. Pas de teal qui s'invite, pas de blue-500 Tailwind par accident, pas de "second accent pour différencier". Si tu veux différencier, tu changes l'intensité (lifted / deep) ou le style (outline vs solid), jamais la teinte.

**The Two Registers Rule.** Console (dark) et Ivoire (light) sont **égaux**. Ils ne sont pas "thème par défaut et alternative". Toute décision de design doit fonctionner aussi bien dans les deux registres ou n'est pas valide. Tester chaque composant en `.app-dark` ET sans `.app-dark` est non négociable.

**The Decorative Line Rule.** `line` et `line-strong` sont des traits d'ornement : le texte qu'ils encadrent porte l'information. Un trait **porteur d'information** (état, séparation d'un contrôle, graphique) utilise `text-primary` ou `foreground` à **≥ 50 % en Ivoire** (3,04:1 sur fond) et **≥ 35 % en Console** (3,05:1 sur fond) : seuils calculés pour atteindre 3:1.

**The Glassmorphism Containment Rule.** Les `rgba` sur Console Surfaces sont des dividers de profondeur subtils, **pas** un effet glassmorphic. Aucun `backdrop-filter: blur` n'est légitime en dehors du nav fixe (s'il est ajouté plus tard, justifier). Si tu ajoutes du blur à une card, c'est un anti-pattern.

## 3. Typography

**Display Font:** Archivo (variable, `wdth` 100–110, `wght` 600–800 : les seules largeurs et graisses employées) — `--font-display` : `'Archivo', 'Archivo Fallback', system-ui, sans-serif`  
**Body Font:** JN Sans (IBM Plex Sans 3.201 modifiée : sous-ensemble latin, axes réduits, famille renommée car « Plex » est un *Reserved Font Name* de l'OFL ; variable, `wght` 400–700, romain et vraie italique) — `--font-sans`, appliquée à tout le site par le preflight (pages publiques, blog, admin)  
**Label/Mono Font:** JN Mono 500 (IBM Plex Mono 2.3 renommée, même raison ; statique) — `--font-mono` : `'JN Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace`

**Character:** la voix « plan d'atelier » du dessin technique. Archivo élargi donne aux titres la carrure d'un cartouche, JN Sans tient le texte courant sans fatigue, JN Mono pose les données (cotes, références, montants). Les trois familles sont **auto-hébergées** (`public/fonts/`, ADR-0006) : aucune requête tierce, CSP `font-src 'self'` inchangée, `font-display: swap` et faces de repli métriquement ajustées sur Arial pour ne pas décaler la mise en page. Seule Archivo (police du `<h1>`, élément LCP) est préchargée ; l'italique n'est téléchargée que sur les pages qui en affichent.

- **Titres `h1` à `h3`** : Archivo, élargis par la base (`h1` 108 %, `h2` 106 %, `h3` 104 %). Tailles, graisses et interlettrages viennent des classes du template.
- **Graisses** : Archivo 600–800 (largeurs 100–110 % : marque du header à 100 %, titres 104–108 %, titre du cartouche 110 %), JN Sans 400–700, JN Mono 500 seulement. `font-synthesis-weight: none` sur `html` : une graisse hors plage prend la plus proche disponible, jamais un faux gras (un `font-mono font-semibold` s'affiche en 500).
- **Données chiffrées** : `font-mono tabular-nums` dans le template (deux classes, pas d'abstraction).
- **Glyphes hors sous-ensemble latin** : U+202F (séparateur de milliers fr-FR) et `→` sont pris dans la police de repli.

### Hierarchy

- **Display** (800, `clamp(2.75rem, 7vw, 5.5rem)`, line-height 1.05, tracking -0.02em): nom du hero (`<h1>` sur la home). Un seul par page, jamais réutilisé.
- **Headline** (700, `clamp(1.75rem, 3.5vw, 2.5rem)`, line-height 1.15, tracking -0.01em): titres de section (`<h2>` About, Projects, Contact).
- **Title** (600, `1.25rem`, line-height 1.3): titres de card, titres de projet dans la grille.
- **Body Large** (400, `1.125rem`, line-height 1.65): tagline du hero, intros de section. Max 65–75ch.
- **Body** (400, `1rem`, line-height 1.6): paragraphes courants. Max 65–75ch.
- **Label** (600, `0.75rem`, tracking 0.06em, **UPPERCASE**): admin table headers (`admin-th`), metadata, badges status.
- **Mono** (500, `0.875rem`, line-height 1.5): code inline, chiffres techniques (KPI admin), labels Sentry/observability.

### Named Rules

**The Three Families Rule.** Trois familles, pas une de plus : Archivo pour les titres, JN Sans (IBM Plex Sans renommée) pour le texte, JN Mono (IBM Plex Mono renommée) pour les données. Une version modifiée d'IBM Plex ne porte jamais le nom « Plex » (*Reserved Font Name*, ADR-0006). Toutes auto-hébergées depuis l'origine du site (ADR-0006) : jamais de Google Fonts ni d'autre CDN de polices. Tout changement de binaire change le nom de fichier versionné (cache nginx `immutable`), dans `styles.css` **et** dans le `preload` d'`index.html`.

**The Single-Display Rule.** Un seul `<h1>` par page, en Display, jamais réutilisé pour décorer une autre section. La hiérarchie `<h1>` → `<h2>` → `<h3>` ne saute jamais un niveau.

**The Indigo Accent Rule.** Le `<h1>` du hero porte un seul accent, un segment de la promesse (« livrés en production ») en `em` `not-italic text-primary`. Le segment est une donnée (`HeroData.headlineAccent`), jamais un littéral de template : `HomeHero` découpe le titre autour de lui.

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

- **Shape:** `rounded-md` (6px) par défaut, `rounded-full` (pill) sur demande. Les liens stylés en bouton (`@utility link-btn`) suivent le même rayon.
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
- **Severities:** tokens du thème uniquement, identiques dans les deux registres : info `bg-primary/10 text-primary`, success/warn/error `bg-status-*/15 text-status-*`, secondary `bg-foreground/8 text-muted`. Aucune couleur de la palette Tailwind par défaut (test de garde dans `tag.spec.ts`).
- **Tags du blog** (`blog-tag-palette.ts`) : tout le catalogue en `bg-primary/10 text-primary`, quelle que soit la catégorie ; tags libres neutres (`text-muted`) ; sélection en `bg-primary-bg`. Pas de couleur par catégorie (One Indigo Rule).

### Cards / Containers

- **Console (dark):** background `bg-foreground/2` ou `bg-surface` (`rgba(255,255,255,0.03)`), border `border-foreground/8`, rounded `rounded-xl` (12px), padding `p-6` (24px).
- **Ivoire (light):** background `bg-surface` (white), border `border-foreground/8` (stone-800 à 8%), même radius et padding.
- **Hover:** background switch vers `surface-elevated` (`rgba(255,255,255,0.06)` ou `#fefdfb`).
- **Shadow:** aucune au repos. Hover = changement de surface, pas d'ajout de shadow.
- **Internal padding:** `p-6` (24px) standard, `p-8` (32px) pour cards principales du hero.

### Cartouche (`shared/ui/cartouche.ts`)

Le bloc-titre d'un plan technique, repris comme cadre de données.

- **API:** `title` (requis), `reference` (optionnelle, défaut `''`), `rows: readonly CartoucheRow[]` (`{ label, value }`), contenu projeté après les lignes.
- **Structure:** hôte `role="group"` nommé par le titre ; barre de titre empilée (titre en `p` Archivo gras élargi 110 %, puis référence en mono `text-muted` sous le titre, à toutes les largeurs, sans troncature) ; lignes en `dl > div > dt + dd` (libellé mono majuscule `text-muted`, valeur `font-medium tabular-nums`). Aucun `dl` sans ligne.
- **Traits:** cadre et barre en `line-strong` 1,5px, séparateurs en `line` (décoratifs, Decorative Line Rule). Rayon `rounded-sm`.
- **Titre:** jamais un `h*` : son niveau dépend du contexte, un consommateur qui a besoin d'un titre le projette.
- **Usage:** au plus un cartouche **décoratif** par écran (cadre de travail, fiche technique). Il sert aussi de carte de données : la carte d'offre (ci-dessous) en est une, répétée par offre, et ne compte pas dans cette limite.

### Carte d'offre (`features/offer/application/components/offer-card.ts`)

L'offre d'une famille présentée en cartouche : réservée aux **Sites** du catalogue (`/offres`), où deux ou trois offres se comparent côte à côte.

- **Entrée:** `summary: OfferSummary`.
- **Structure:** `Cartouche` titré du nom de l'offre, référence = public visé ; corps projeté : la promesse (texte courant `font-medium`), puis un pied séparé par un trait `line` avec le `priceTeaser` (Archivo gras 105 %, `tabular-nums`) et le lien « Détail de l'offre → » (`text-primary`, nom de l'offre en `sr-only` pour que chaque lien reste distinct à la lecture d'écran, flèche `aria-hidden`).
- **Cible:** le lien est étiré sur toute la carte (`after:absolute after:inset-0`, cartouche en `relative`) : toute la carte est cliquable, sans lien imbriqué ni second lien. Lien `min-h-11` (44 px).
- **Survol:** cadre en `accent` (`hover:` est déjà sous `@media (hover: hover)` en Tailwind 4).
- **Grille:** une colonne en mobile, deux à partir de `sm` ; cartes à hauteur égale (cartouche `flex flex-col h-full`, corps `flex-1`) pour aligner les pieds.

### Ligne d'offre (`features/offer/application/components/offer-row.ts`)

L'offre d'une famille présentée en ligne de nomenclature : réservée aux **Applications** du catalogue, dont les prix ne se comparent pas (projet, audit, régie) et se lisent mieux en liste.

- **Entrée:** `summary: OfferSummary`.
- **Structure:** un **unique** lien couvre toute la ligne : nom (Archivo gras 104 %), promesse (`text-muted`), `priceTeaser` (Archivo gras 105 %, `tabular-nums`) et flèche `text-primary` `aria-hidden`. Aucun autre élément interactif dans la ligne.
- **Liste:** `ul role="list"` encadrée en haut et en bas d'un trait `line-strong` 1,5px, lignes séparées par un trait `line` (Decorative Line Rule).
- **Mise en page:** en mobile, nom et promesse puis prix sur deux rangs, flèche à droite sur toute la hauteur ; à partir de `md`, trois colonnes (texte 1,5 fr, prix 1 fr, flèche).
- **Survol:** nom en `text-primary`, flèche décalée de 4 px (`motion-reduce:transition-none`).

### Cote (`shared/ui/dimension-line.ts`)

La cote d'un dessin technique : deux traits de rappel, deux pointes, une ligne interrompue autour d'un libellé.

- **API:** `label` (requis).
- **Rendu:** traits en bordures `currentColor` = `text-primary` (visibles en `forced-colors`), libellé mono `text-xs`. La ligne s'interrompt autour du libellé au lieu d'être masquée par un fond : la cote se pose sur toute surface.
- **Accessibilité:** hôte `aria-hidden="true"`, aucun élément focalisable ni rôle à l'intérieur.
- **Règle d'usage:** la cote est **décorative** : son libellé répète une information écrite ailleurs dans le texte lisible. Cotes réservées aux délais et durées.

### FAQ (`shared/ui/faq-list.ts`)

Questions fréquentes de la home et des pages d'offre : un seul gabarit, des divulgations natives.

- **API:** `heading`, `headingId` (requis, unique dans la page), `items: readonly { id, question, answer }[]`, `lead` (optionnel, défaut `''`, non rendu vide).
- **Structure:** `section` nommée par son `h2` ; en-tête titre puis accroche (deux colonnes alignées en bas à partir de `lg`, comme les autres en-têtes de section de la home) ; chaque entrée est un `details` fermé au rendu, `summary` enfant direct, réponse en `text-muted` (34 rem max).
- **Aucun script:** ni `button` ni état Angular, la réponse s'ouvre sans JavaScript (prérendu compris). Marqueur natif masqué, remplacé par un `+` mono `text-primary` en pseudo-élément au texte alternatif vide, tourné de 45° à l'ouverture (`motion-reduce` : sans transition).
- **Mise en page:** une colonne, deux à partir de `lg`. Les deux colonnes sont **indépendantes** (moitié des entrées chacune, ordre de lecture conservé) : une réponse ouverte n'étire pas la ligne voisine. Entrées séparées par un trait `line` (décoratif).

### Points clés (`shared/ui/key-point-list.ts`)

Arguments courts, un intitulé puis son développement : « Pourquoi moi » de la home, raisons d'une page d'offre.

- **API:** `points: readonly { id, lead, detail }[]`.
- **Structure:** `ul role="list"`, une ligne par point : intitulé `font-semibold`, développement `text-muted` ; deux colonnes (11 rem puis le reste) à partir de `sm`, empilés en dessous.
- **Traits:** lignes séparées et encadrées par un trait `line` (décoratif). Le titre de la section appartient au consommateur (`SplitSection` sur les pages d'offre, section « Pourquoi moi » sur la home).

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
- **Don't** utiliser `background-clip: text` + gradient comme style décoratif. Privilégier l'accent unique en Signal Indigo solide (`em` `not-italic text-primary`, The Indigo Accent Rule) ou un weight contrast.
- **Don't** ajouter `backdrop-filter: blur()` à une card "pour faire glass". No-Glass Rule.
- **Don't** ajouter de shadow à une card "pour qu'elle ressorte". Flat-By-Default Rule — travaille la hiérarchie typographique ou la taille avant.
- **Don't** charger une Google Font ni une police depuis un CDN. Three Families Rule : les polices sont auto-hébergées (ADR-0006).
- **Don't** utiliser `border-left` ou `border-right` > 1px comme accent coloré (callout, alerte). Banned absolu impeccable.
- **Don't** utiliser `*ngIf` / `*ngFor` — control flow `@if` / `@for` uniquement (rappel CLAUDE.md).
- **Don't** styliser un input avec `outline: none` sans `:focus-visible` de remplacement. C'est la violation a11y la plus rapide à repérer dans un audit.
- **Don't** mettre une animation décorative au-dessus de 400ms ou avec un easing bouncy/elastic. Ease-out exponential uniquement (`cubic-bezier(0.16, 1, 0.3, 1)` ou équivalent).
- **Don't** utiliser le slate Tailwind (slate-50 → slate-900) dans le portfolio. Le système est tinté zinc/neutral (Console) ou stone (Ivoire) — jamais slate (froid bleuté).
- **Don't** réutiliser le Display (800, clamp size) pour un autre élément que le `<h1>` du hero.
- **Don't** introduire une 4e famille "pour donner du caractère". La hiérarchie vient de la famille (display / texte / données), du weight, de la size et de la largeur.
- **Don't** confier une information à un trait `line` / `line-strong` seul (Decorative Line Rule).
