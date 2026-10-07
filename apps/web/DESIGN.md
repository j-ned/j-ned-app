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
  status-error: "#c10007"
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
- **Field** (`--color-field` : Console `foreground` à 38 %, Ivoire à 50 %) : bord des champs (`form-input`, `app-select`). Trait **porteur d'information** (il délimite un contrôle) : 3,41:1 fond / 3,47:1 surface en Console, 3,04:1 / 3,11:1 en Ivoire (WCAG 1.4.11).

Contrastes calculés (composition sRGB, WCAG 2.x) : `line` 1,22:1 (Console, fond) à 1,26:1 (Ivoire) ; `line-strong` 1,77:1 (Ivoire, fond) à 1,94:1 (Console, carte). Ces deux traits sont **décoratifs** : sous 3:1, ils ne portent jamais seuls une information et ne délimitent jamais un composant interactif (WCAG 1.4.11). Le trait de cote est dessiné en `currentColor` = `text-primary` (6,33:1 à 7,90:1 selon registre et surface).

### Status

- **Status Success** (`#016630`, green-800 en Ivoire): badges success, états validés.
- **Status Warn** (`#973c00`, amber-800 en Ivoire): badges avertissement.
- **Status Error** (`#c10007`, red-700 en Ivoire ; red-400 en Console): erreurs de form, messages destructifs. En Ivoire, le texte d'erreur reste ≥ 4,5:1 sur le fond et sur une carte blanche.

### Named Rules

**The One Indigo Rule.** Il n'y a qu'un Signal Indigo. Pas de teal qui s'invite, pas de blue-500 Tailwind par accident, pas de "second accent pour différencier". Si tu veux différencier, tu changes l'intensité (lifted / deep) ou le style (outline vs solid), jamais la teinte.

**The Two Registers Rule.** Console (dark) et Ivoire (light) sont **égaux**. Ils ne sont pas "thème par défaut et alternative". Toute décision de design doit fonctionner aussi bien dans les deux registres ou n'est pas valide. Tester chaque composant en `.app-dark` ET sans `.app-dark` est non négociable. La classe a un seul écrivain à l'exécution, `ThemeStore` (`core/theme/`), partagé par le site et l'admin ; le script en tête d'`index.html` la pose avant la première peinture selon la même règle (choix enregistré, sinon préférence système).

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

### Tags / Badges

- **Pas de composant de pastille générique** (`shared/ui/tag.ts` retiré avec la page Audience, son dernier consommateur). Un statut (« Publié », « Brouillon », « Mis en avant ») n'est pas une pastille colorée : c'est un tampon (`app-stamp`), `status-*` sur `status-*/15` restant sous 4,5:1 en Ivoire.
- **Tags du blog** (`blog-tag-palette.ts`) : tout le catalogue en `bg-primary/10 text-primary`, quelle que soit la catégorie ; tags libres neutres (`text-muted`) ; sélection en `bg-primary-bg`. Pas de couleur par catégorie (One Indigo Rule). Les pastilles de tags ne vivent que sur la page article (`BlogTagLink`, lien vers `/blog?tag=`) et dans le sélecteur de l'admin : la liste du blog n'en affiche plus, ses lignes disent leurs sujets en repère (« Ligne d'article », ci-dessous).

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
- **Usage:** au plus un cartouche **décoratif** par écran (cadre de travail, fiche technique). Il sert aussi de carte de données : la carte d'offre et la carte de démo (ci-dessous) en sont, répétées par élément, et ne comptent pas dans cette limite.

### Carte d'offre (`features/offer/application/components/offer-card.ts`)

L'offre d'une famille présentée en cartouche : réservée aux **Sites** du catalogue (`/offres`), où deux ou trois offres se comparent côte à côte.

- **Entrée:** `summary: OfferSummary`.
- **Structure:** `Cartouche` titré du nom de l'offre, référence = public visé ; corps projeté : la promesse (texte courant `font-medium`), puis un pied séparé par un trait `line` avec le `priceTeaser` (Archivo gras 105 %, `tabular-nums`) et le lien « Détail de l'offre → » (`text-primary`, nom de l'offre en `sr-only` pour que chaque lien reste distinct à la lecture d'écran, flèche `aria-hidden`).
- **Cible:** le lien est étiré sur toute la carte (`after:absolute after:inset-0`, cartouche en `relative`) : toute la carte est cliquable, sans lien imbriqué ni second lien. Lien `min-h-11` (44 px).
- **Survol:** cadre en `accent` (`hover:` est déjà sous `@media (hover: hover)` en Tailwind 4).
- **Grille:** une colonne en mobile, deux à partir de `sm` ; cartes à hauteur égale (cartouche `flex flex-col h-full`, corps `flex-1`) pour aligner les pieds.

### Carte de démo (`features/offer/application/components/offer-demo-card.ts`)

Un site de démonstration présenté sur une page d'offre, dans la section « Exemples » (`offer-examples.ts`), pour montrer le résultat livré. Une démo n'est jamais une référence client.

- **Entrée:** `demo: OfferDemo` (nom fictif, secteur, phrase « ce que la démo illustre », URL HTTPS, visuel).
- **Section:** `SplitSection` dont le résumé (`lead`) dit que les entreprises sont fictives ; cartes en une colonne à toutes les largeurs (deux colonnes rendraient les captures illisibles).
- **Structure:** `Cartouche` titré du nom fictif, référence = secteur ; corps projeté : le visuel (`<picture>` AVIF puis WebP autour de `NgOptimizedImage`, chargement différé, jamais `priority`, ADR-0007), puis un pied séparé par un trait `line` avec la phrase (texte courant) et le lien.
- **Badge « Démo »:** dans le gabarit, jamais dans la donnée. Posé sur le coin haut gauche du visuel, comme un tampon de plan : mono majuscule `text-xs`, `bg-background text-foreground` (opaque dans les deux registres, contraste du texte courant), trait `line-strong`. Pas d'indigo : c'est une mention, pas un accent (One Indigo Rule).
- **Lien:** « Voir la démo » en `link-btn-outline` (44 px), icône `external-link` `aria-hidden`, nouvel onglet avec `rel="noopener"` ; nom de la démo et « nouvel onglet » en `sr-only` après le libellé visible. Seul interactif de la carte : ni le visuel ni la carte ne sont cliquables.
- **Honnêteté:** une démo n'apparaît dans les Réalisations qu'avec le tampon « Démo » (ADR-0008) ; jamais sur la home ni dans des données structurées d'avis ou de référence client ; aucun chiffre, avis ou logo inventé autour.

### Tampon (`shared/ui/stamp.ts`)

La mention portée sur un plan, reprise pour dire la nature d'une chose : « Démo » sur la carte de démo, « En production », « Démo » ou « Script » sur un projet (`ProjectKindStamp`, ADR-0008).

- **API:** `dashed` (défaut `false`) ; le texte est projeté.
- **Pointillé:** `dashed` ajoute `border-dashed` à l'hôte et rien d'autre : un état provisoire (« Brouillon » de la liste des articles admin), jamais une nature.
- **Apparence unique:** classes sur l'hôte, sans élément enveloppant : mono majuscule `text-xs`, interlettrage 0,06 em, `bg-background text-foreground` (opaque dans les deux registres, contraste du texte courant), trait `line-strong`, `rounded-sm`, marges `px-2 py-1`. Une seule apparence pour toutes les natures : c'est le **texte** qui les distingue, jamais une couleur.
- **Placement:** le consommateur le positionne : coin haut gauche du visuel sur la carte de démo, sur la carte de projet de la home et sur la couverture de projet (`ProjectCover`, ci-dessous), au-dessus du `h1` dans l'en-tête du détail. Posé sur un visuel couvert par un lien étiré, il laisse passer le clic (`pointer-events-none`).
- **Accessibilité:** texte lu tel quel, sans rôle ni `aria-*` ; la nature est dite par le texte, pas par une couleur ni par la seule position.
- **Don't:** pas d'indigo ni de couleur de statut (One Indigo Rule : c'est une mention, pas un accent) ; jamais un `h*` ni à l'intérieur d'un titre ; jamais interactif ; pas de variante par nature.

### Galerie de projet (`features/projects/application/components/project-gallery.ts`)

Les captures d'écran d'une réalisation, sur sa page détail, quand le projet en a (ADR-0009).

- **Entrée:** `images: readonly ProjectImage[]`, déjà triées par l'adapter ; rien n'est rendu pour une galerie vide (`@if` côté page).
- **Section:** `SplitSection` `headingId="gallery-title"`, titre « Captures », résumé court ; placée après la couverture et avant les choix techniques. Jamais sous `@defer` : la galerie est dans le HTML prérendu.
- **Grille:** `ul role="list"`, une colonne en mobile, deux à partir de `md`, `items-start` (une capture portrait garde son ratio sans étirer sa voisine).
- **Miniature:** un `button` natif par capture, qui porte l'image (`NgOptimizedImage`, `width`/`height` intrinsèques, `h-auto w-full`, chargement différé, **jamais** `priority`, ni `fill` ni `ngSrcset`) ; nom accessible « Agrandir : » en `sr-only` suivi de l'`alt`. Curseur `zoom-in`.
- **Agrandissement:** `dialog` natif ouvert par `showModal()` (fond inerte, Échap natif), nommé « Capture agrandie : <alt> » ; bouton « Fermer » en premier, focus posé dessus à l'ouverture ; à la fermeture (bouton ou Échap), le focus revient à la miniature d'origine. `::backdrop` en `background/90`, dialog cerné de `line-strong`, image contenue dans le viewport (`object-contain`).
- **Don't:** pas de carrousel ni de défilement automatique ; pas de lien ni de `div` cliquable à la place du `button` ; pas de dialog maison ni de bibliothèque de lightbox ; pas d'`alt` vide (une capture est un contenu, jamais une décoration).

### Étude de cas (`features/projects/application/components/project-case-study.ts`)

Un projet en production présenté en détail dans les Réalisations (`/projects`, section « En production », ADR-0010).

- **Entrée:** `caseStudy: CaseStudyView`, `priority` (défaut `false`), `reversed` (défaut `false`) ; sortie `liveLinkClicked` (suivi du lien externe par la page).
- **Couverture (`ProjectCover`):** `figure` à ratio fixe `aspect-[16/10]` (zéro CLS), `rounded-md`, trait `line-strong`, `bg-surface` ; image `NgOptimizedImage` en `fill` + `object-cover`, sans `ngSrcset` ni `sizes` (aucun `IMAGE_LOADER` : une seule variante servie) ; repli `div aria-hidden` de même ratio sans image. Tampon de nature en haut à gauche, qui laisse passer le clic. Une seule couverture `priority` par page : la première étude de cas.
- **Structure:** hôte `@container` (requête de conteneur, ADR-0013) ; `article` en grille `@min-[60rem]:grid-cols-12`, couverture `@min-[60rem]:col-span-7` puis texte `@min-[60rem]:col-span-5` ; empilés sous un conteneur de 60rem, couverture au-dessus. Sur `/projects`, la bascule tombe à 1 008 px de viewport (conteneur de 960 px) ; dans la colonne de 25rem de l'aperçu admin, l'étude de cas reste empilée. Aucune classe de point de rupture de viewport dans le composant. L'alternance gauche/droite passe par `@min-[60rem]:order-last` sur la couverture (`reversed`, la page passe `$even`, liée par `[class]` : un nom à crochets ne se lie pas en `[class.x]`) : seul l'ordre visuel change, jamais le DOM ni l'ordre du focus.
- **Texte:** overline mono `text-muted` (« 01 · catégorie »), `h3` du nom, accroche `text-muted max-w-[46ch]`, puis les repères (Stack, Point fort, Périmètre) en `FactList` (« Liste de repères », ci-dessous).
- **Actions:** « Voir la fiche » en `link-btn-primary`, nom du projet en `sr-only`, flèche `aria-hidden` ; « Ouvrir l'application » en `link-btn-outline` si le projet a une URL, nouvel onglet `rel="noopener noreferrer"`, nom et « nouvel onglet » en `sr-only`, icône `external-link`.

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
- **Option inactive** (`disabled: true`, thème sans article) : `aria-disabled="true"`, **jamais** l'attribut `disabled` natif, pour qu'elle reste dans l'ordre de tabulation, garde son focus visible et soit annoncée « indisponible » avec son compte 0. Le clic ne change rien et le focus reste sur le bouton. Apparence de l'état désactivé des boutons : `opacity-50` posé sur le libellé et le compte seulement (`aria-disabled:*:opacity-50`), pour que le contour de focus garde son contraste, `cursor-not-allowed`, survol neutralisé (`aria-disabled:hover:text-muted`). L'opacité n'est pas le seul porteur : le compte « 0 » le dit aussi. « Tous » n'est jamais inactif.
- **Statut:** la page annonce le résultat d'un choix par un `p role="status"` `sr-only` (« N article(s) affiché(s) », « N réalisation(s) affichée(s) »), hors du groupe ; le focus ne bouge pas.

### Liste de repères (`shared/ui/fact-list.ts`)

Les repères d'un plan : un libellé court, une valeur. Étude de cas (Stack, Point fort, Périmètre), carte de projet de la home, ligne d'article (Sujets).

- **API:** `facts: readonly Fact[]` (`{ label, value }`). Le consommateur ne la rend pas sans repère (`@if (facts.length)`) : jamais de `dl` vide.
- **Structure:** `dl` en grille à deux colonnes (`6.5rem` puis le reste, `subgrid` par ligne) ; `dt` mono `text-xs text-muted`, `dd` en texte courant `text-sm`. Traits `line` au-dessus de la liste et sous chaque ligne (décoratifs, Decorative Line Rule).

### Liste du blog (`features/blog/application/blog-list.ts`)

La page `/blog` reprend le gabarit des Réalisations : en-tête à cartouche, filtre local, liste.

- **En-tête:** même grille que `/projects` (texte à gauche, cartouche à droite à partir de `lg`, empilé dessous en mobile). Sur-titre mono `text-primary` « N article(s) », `h1` « Blog » sans animation, introduction fixe, lien RSS `min-h-11`.
- **Cartouche « Thèmes »:** `Cartouche` titré « Thèmes », référence « Articles par thème », `rows` = les cinq thèmes dans l'ordre du catalogue (Stack, Sécurité, Ingénierie, Parcours, Projets), valeur « N article(s) » avec son unité en clair. Les comptes portent sur tous les articles, quel que soit le filtre. Cartouche de données, hors de la limite d'un cartouche décoratif par écran.
- **Filtre:** sous l'en-tête, hors du `header`, un seul des deux : le groupe « Filtrer par thème » (« Tous » puis les cinq thèmes, un thème vide en option inactive), ou, quand la page article a envoyé `?tag=`, le bandeau « Filtré par X » avec son lien de retrait. Absent pendant le chargement, en erreur et sans article. Un thème actif est toujours un thème non vide.
- **États:** erreur en `role="alert"` avec « Réessayer » (comme `/projects`) ; « Aucun article pour le moment. » sans article ; « Aucun article avec ce tag. » sous un tag sans résultat.
- **Liste:** `ul role="list"` sous un trait, une ligne d'article par `li`, tous les articles sur une seule page (pas de pagination). Une seule couverture `priority` : celle du premier article de la liste complète, sous tout filtre.

### Ligne d'article (`features/blog/application/components/blog-post-row.ts`)

Un article de la liste du blog, lu comme une étude de cas.

- **Entrée:** `post: BlogPostRowView` (vue calculée par `toBlogPostRowView`, appliquée par `toBlogListView` à chaque article et par l'aperçu admin), aucun calcul dans le composant.
- **Structure:** hôte `@container` (ADR-0013) ; `article relative` en grille, texte puis couverture à droite (`20rem`) à partir d'un conteneur de 60rem (`@min-[60rem]:`), couverture au-dessus en dessous ; aucune classe de point de rupture de viewport. Sur `/blog`, la bascule tombe à 1 008 px de viewport (conteneur de 960 px) ; dans la colonne de 25rem de l'aperçu admin, la ligne reste empilée ; séparée de la suivante par un trait `line`. Texte : surtitre mono `text-xs text-muted` (« 9 sept. 2026 · 13 min de lecture », date omise si absente), `h2` du titre (texte simple), extrait `text-muted max-w-[62ch]`, repère « Sujets » (trois premiers tags, `FactList`), lien « Lire l'article ».
- **Couverture:** `figure` à ratio `aspect-[1200/630]`, `rounded-md`, trait `line-strong`, `bg-surface`, image `NgOptimizedImage` en `fill` + `object-cover`, `alt=""` (décorative : le titre et le lien nomment l'article), qui laisse passer le clic (`pointer-events-none`). Pas de zoom au survol.
- **Cible:** un seul interactif, le lien « Lire l'article » `text-primary` `min-h-11`, titre de l'article en `sr-only` pour un nom distinct par ligne, étiré sur toute la ligne (`after:absolute after:inset-0`). Pas de pastille ni de lien par tag.
- **Survol:** le titre passe en `primary` (`group-hover`).

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
- **Border:** `border border-field` au repos (token Field, ≥ 3:1 dans les deux registres), commun à `form-input` et `app-select`.
- **Placeholder:** `placeholder:text-muted` (7,86:1 Ivoire, 7,14:1 Console). Jamais atténué : un texte de substitution reste du texte.
- **Contrôles natifs:** `color-scheme: dark` sur `:root`, `light` sur `:root:not(.app-dark)` : case à cocher, liste d'un `select` et barres de défilement suivent le registre. Case à cocher en `accent-primary-bg size-5`, focus par le `:focus-visible` global.
- **Focus:** `focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary`. Pas d'outline supplémentaire.
- **Invalid:** `aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-500/30`.
- **Disabled:** opacity 0.5, cursor not-allowed.
- **Autofill override:** custom `-webkit-box-shadow` inset pour préserver la couleur de fond du thème (bug Chrome jaune par défaut neutralisé).
- **Textarea:** hérite de `form-input` + `min-h-[8rem] resize-y leading-relaxed`.
- **Label:** utility `form-label` → `text-sm font-medium mb-1.5`.
- **Error:** utility `form-error` → `block text-xs text-status-error mt-1`.
- **Libellé d'éditeur:** utility `field-label` → `flex justify-between items-baseline gap-3 text-sm font-semibold mb-1.5` ; mention à droite (« obligatoire ») en mono 12 px `text-muted`, dans le `label`.
- **Indication d'éditeur:** utility `field-hint` → `flex justify-between gap-3 mt-1.5 text-[0.78125rem] text-muted` ; à gauche le texte lié par `aria-describedby`, à droite un compteur mono 12 px `tabular-nums` « 137 / 160 » hors de la description accessible.

### Navigation

- **Header layout:** sticky en haut, background `var(--theme-background)`, border-bottom `var(--theme-nav-border)`, shadow `var(--theme-nav-shadow)`.
- **Liens:** sans soulignement par défaut, hover = `text-primary`, active = `text-primary` + indicateur (à clarifier dans Layout).
- **Mobile:** drawer (`shared/ui/drawer.ts`) via icon hamburger.
- **Focus visible:** outline 2px Signal Indigo cohérent avec les boutons.

### Coque admin (`features/admin/application/admin-layout.ts`, `components/admin-nav.ts`)

- **Landmarks:** `App` garde le seul `<main>` ; la coque n'émet ni `main`, ni `aside`, ni titre. Header et Footer publics absents sous `/admin` dès le premier rendu (l'adresse demandée suffit, sans attendre la navigation).
- **Barre latérale (à partir de `lg`, 1 024 px):** colonne de `15.75rem`, `sticky top-0 h-svh`, filet droit `line`. En tête, monogramme « JN » (carré 40 px, `rounded-[0.625rem]`, `border-primary/30`, `bg-primary/12`, `text-primary`) et « Julien Nédellec / Administration » (mono 12 px). Contenu de page : `max-w-[72.5rem]`, `px-14 pt-11`, corps 15 px.
- **Navigation:** un seul `<nav aria-label="Administration">`. « Vue d'ensemble » hors groupe, puis trois groupes `role="group"` nommés par `aria-labelledby` : Contenu (Projets, Articles, CV), Audience (Audience, Messages), Compte (Paramètres). Libellé de groupe en mono 12 px capitales, `tracking-[0.06em]`, `text-muted`. Lien de 44 px, `text-muted`, survol `bg-surface-elevated`. Page courante : `aria-current="page"` (via `routerLinkActive`), texte `foreground` semi-gras, libellé souligné d'un trait intérieur de 2 px `primary` (même grammaire que le groupe de filtres), icône `primary`. Comptes en mono 12 px à droite (projets, articles, non-lus, ce dernier en `primary` dès qu'il y en a un), suffixe « non lu(s) » en `sr-only`.
- **Pied:** « Voir le site » (nouvel onglet, annoncé en `sr-only`), bascule de thème (« Passer en mode clair / sombre »), « Se déconnecter », e-mail du compte en mono 12 px.
- **Mobile (sous `lg`):** barre `sticky` (monogramme 34 px, libellé de la page courante en display 16 px, bouton menu 44 px `aria-expanded` + `aria-controls="admin-drawer"`), tiroir `Drawer` à gauche avec la même navigation ; un lien ou « Se déconnecter » le ferme.

### En-tête de page admin (`features/admin/application/components/admin-page-header.ts`)

- Grammaire des pages publiques, plus dense : sur-titre mono 13 px `text-primary` (compte ou période, `admin-page-copy.ts`), `h1` unique `font-extrabold leading-none tracking-[-0.04em]` (`2.5rem` en mobile, `clamp(2.25rem, 3.4vw, 3.25rem)` à partir de `lg`), `tabindex="-1"` pour recevoir le focus après une suppression, introduction `max-w-[60ch]` `text-muted` 17 px.
- Action principale ou cartouche projetées par `[adminPageAside]` dans une seconde colonne de `22rem` alignée en bas (à partir de `lg`, seulement si un aside est projeté).
- Dates des sur-titres en français, « 1er » pour le premier jour du mois.

### Vue d'ensemble admin (`features/admin/application/admin-overview.ts`)

- **En-tête:** sur-titre « Mercredi 7 octobre 2026 · 30 derniers jours » (date lue à l'ouverture de la page), `h1` « Vue d'ensemble », introduction = phrase de synthèse (`overview-copy.ts`) ; cartouche « En ligne » (`nedellec-julien.fr`, une rangée par nature puis « Articles ») en aside.
- **Grille:** deux rangées de deux colonnes `minmax(0,1.65fr) / minmax(0,1fr)`, gouttière 56 px, à partir de `lg` ; une colonne en dessous. Audience et Contacts, puis Contenu en ligne et Actions rapides.
- **Titres de section:** `AdminSectionHead` (`h2` Archivo gras 22 px élargi 106 %, filet bas `line-strong` 1,5 px, lien « … → » `text-primary` 44 px à droite).
- **Audience:** grand chiffre des visiteurs (Archivo extra-gras 64 px, 52 px en mobile), sessions en `text-muted`, courbe des visiteurs seule (trait `primary` 2 px, aire `primary` 12 %, traits droits, sans axes), légende textuelle en `figcaption` `sr-only` ; relevé en dessous.
- **Contacts:** deux chiffres liés (non-lus, CV sur 30 jours), puis les trois derniers messages ou l'état vide « Boîte vide » avec « Ouvrir la page Contact » (nouvel onglet).
- **Contenu en ligne:** cinq rangées (articles publiés récents, puis projets dans l'ordre public), vignette 16/10 (projet) ou 1200/630 (article) décorative, titre en lien étiré, méta mono 12 px, tampon (« Publié » ou nature) ; état vide « Rien en ligne ».
- **Actions rapides:** liens en `link-btn-primary` (« Nouveau projet ») puis `link-btn-outline`.
- **Indisponible ≠ zéro:** une source en chargement montre un squelette (`role="status"`), une source en erreur affiche « indisponible » (ou « — » `aria-hidden` + `sr-only`) là où elle compte et une seule `LoadError` par section, jamais un « 0 ».

### Relevé (`features/admin/application/components/admin-readout.ts`)

- **API:** `items: readonly ReadoutItem[]` (`{ label, value, unit, detail }`).
- **Structure:** un seul `dl`, une entrée par `div` : `dt` mono 12 px capitales `text-muted`, `dd` = valeur Archivo gras 34 px `tabular-nums` suivie de l'unité à 0,55 em, puis détail 13 px `text-muted`.
- **Traits:** filet haut `line-strong` 1,5 px, filet bas et séparateurs verticaux `line` ; colonnes égales à partir de `sm`, deux colonnes en dessous.

### État vide (`features/admin/application/components/admin-empty-state.ts`)

- **API:** `stamp` (requis) ; phrase et action projetées.
- **Apparence:** cadre tireté `line-strong` 1 px, `rounded-sm`, tampon en premier, texte 14 px `text-muted` limité à 42 caractères. Un état vide dessiné, pas un texte centré gris.

### Liste éditoriale des projets (`features/admin/application/components/admin-project-row.ts`)

- **Filtre:** `FilterGroup` « Filtrer par nature » (Tous + trois natures, comptes, nature vide désactivée) au-dessus de la liste.
- **Ligne:** hôte `li` (liste `ul role="list"`), filet bas `line`, `py-6.5`. À partir de `lg`, grille `2.25rem / 13.5rem / minmax(0,1fr) / auto`, `gap-7` : rang mono 13 px `text-muted` (décoratif, `aria-hidden`), `ProjectCover` 16/10 avec son tampon, corps, actions. Entre `sm` et `lg` : couverture `10rem` à gauche, actions sous le corps ; sous `sm`, tout empilé.
- **Corps:** sur-titre mono 12 px « 01 · Catégorie » (rang dans la liste complète, stable sous un filtre), `h2` Archivo extra-gras 22 px élargi 106 % `tracking-[-0.03em]`, accroche 14,5 px `text-muted` `line-clamp-2` limitée à 62 caractères, ou mention « Accroche vide : … » 13 px précédée d'un point `primary` 6 px ; `FactList` (Stack : 4 outils + « +N », Accueil : Mis en avant) limitée à `40rem`.
- **Actions:** trois cibles de 44 px nommées « Voir la fiche publique : X (nouvel onglet) », « Modifier : X » (liens, `text-foreground`, survol `surface-elevated`) et « Supprimer : X » (`Button` danger texte).

### Éditeur de projet (`features/admin/application/admin-project-editor.ts`, `components/admin-project-form.ts`)

- **En-tête:** fil d'Ariane `nav aria-label="Fil d'Ariane"` mono 13 px (« Projets » `text-primary` 44 px, `/` décoratif, page courante `aria-current="page"`), `h1` de l'en-tête admin (titre **enregistré**, il ne suit pas la saisie), phrase sur le déploiement ; actions à droite : « Voir l'aperçu » `link-btn-outline` (icône `eye`, `routerLink="." fragment="apercu"`, masqué à partir de `lg`) et « Voir la fiche » `link-btn-outline` pour un projet existant.
- **Colonnes:** à partir de `2xl` (1 536 px), grille `minmax(0,1fr) / 25rem`, `gap-14` ; la seconde colonne (`id="apercu"`, `scroll-mt-6`) suit le formulaire dans le DOM, `2xl:sticky 2xl:top-6`, et empile l'aperçu public puis le sommaire, `gap-3.5`. Sous `2xl`, elle passe sous le formulaire (`gap-10`) et le lien « Voir l'aperçu » y mène : avec la barre latérale, une colonne de 25rem plus tôt laisserait moins de 560 px au formulaire (204 px à 1 024, 460 à 1 280, mesurés).
- **Couverture:** groupe « Couverture » (`role="group"`) ; avec une image enregistrée, `ProjectCover` (tampon de nature, `alt` « Couverture actuelle de X ») et zone de dépôt côte à côte à partir de `sm` (`15rem / minmax(0,1fr)`, `gap-4.5`), empilées dessous ; sans image, la zone seule. La zone ne montre plus l'image enregistrée, seulement le fichier choisi. Retirer le fichier (×) annule la couverture en attente ; un fichier qui n'est pas une image vide la zone avec le toast « Seules les images sont acceptées. » (même règle sur l'éditeur d'article).
- **Sections:** `fieldset[app-admin-form-section]`, légende flottante pleine largeur : numéro mono 13 px `text-primary` « 01 · », titre Archivo gras 21 px élargi 106 %, description 14 px `text-muted`, filet bas `line-strong` 1,5 px. 34 px entre deux sections. La section Galerie est hors du `<form>` (formulaires imbriqués interdits).
- **Nature:** trois cartes-radios (`label` bord `field` `rounded-md` `p-3.5`, radio natif invisible, pastille 18 px dessinée, tampon, définition 13 px `text-muted`) ; cochée : bord et trait intérieur `primary` ; focus clavier : contour 2 px `primary` décalé de 2 px sur la carte.
- **Lignes répétées:** colonnes `2rem / 11rem / 1fr / 2.75rem` (N°, champ, champ, suppression), en-tête mono 12 px capitales décoratif, libellés numérotés en `sr-only` ; sous `sm`, le second champ passe sous le premier.
- **Galerie:** légende de section seul titre ; liste `ul role="list"` en grille de requête de conteneur (hôte `@container`) : 1 colonne, 2 à partir de 26rem, 3 à partir de 36rem, `gap-4.5` ; la zone d'ajout reste sous la liste. Chaque capture est un seul `form` (texte alternatif) en pile : vignette 16/10 `rounded-md` trait `line-strong`, libellé `field-label`, champ puis « Enregistrer » `outlined`, et une barre position mono 12 px « 2 / 5 » + actions icônes 44 px (`arrow-up`, `arrow-down`, `trash` danger), noms accessibles « Monter / Descendre / Supprimer la capture n ». « Monter » absent sur la première, « Descendre » sur la dernière ; la suppression se confirme en ligne.
- **Barre d'enregistrement (`components/admin-save-bar.ts`):** hôte `sticky bottom-0 z-10`, filet haut `line-strong` 1,5 px, fond `background`, `py-3.5`, `mt-10` sous le formulaire. À gauche l'état `role="status"` 14 px précédé d'un point 6 px (`primary` s'il y a des modifications, `line-strong` sinon) : « Aucune modification », « 1 modification non enregistrée », « n modifications non enregistrées » (brouillon, ensemble de tags et couverture choisie comptés champ par champ). À droite « Annuler » `link-btn-outline` (lien vers la liste, passe par la garde) et « Enregistrer » `link-btn-primary` `type="submit" form="project-form"`, désactivé **seulement** pendant l'envoi (`disabled:opacity-60 disabled:cursor-wait`), jamais par une erreur ni à zéro modification.
- **Aperçu public (`components/admin-project-preview.ts`):** `section` nommée par son `h2` « Aperçu public », cadre `rounded-sm` trait `line-strong` 1,5 px ; tête `bg-surface` `p-3.5` (titre Archivo gras élargi 110 %, référence mono 12 px « Réalisations · <nature> », « en direct » mono 12 px à droite), filet `line-strong` 1,5 px ; mention « Nouvelle couverture : visible ici après l'enregistrement. » 13 px quand un fichier attend (`NgOptimizedImage` refuse `blob:`) ; corps `inert` `bg-background` `p-4.5` : la vraie `ProjectCaseStudy` (production, rang `max(order, 1) − 1`) ou la vraie `ProjectGridCard` (démo, script), hors focus et hors arbre accessible ; sans nature, « Choisissez une nature pour voir la carte. » centré 14 px `text-muted`.
- **Sommaire (`components/admin-form-toc.ts`):** `nav aria-label="Sections du formulaire"`, filet haut `line` ; cinq liens 44 px, filet bas `line`, 14 px `text-muted` (survol `foreground`) : libellé court « 02 · Présentation » à gauche, état mono 12 px `text-primary` « modifié » à droite. `routerLink="." [fragment]` (un `href="#id"` sous `<base href="/">` ouvrirait `/#id`) ; le défilement passe par `anchorScrolling`.
- **Quitter:** garde `unsavedChangesGuard` sur `projects/new` et `projects/:id` ; avec des modifications, `ConfirmDialog` « Quitter sans enregistrer ? » / « Quitter sans enregistrer » (danger) / « Continuer l'édition » (focus initial) ; fermeture d'onglet ou rechargement : boîte native `beforeunload`.

### Liste des articles (`features/admin/application/admin-blog.ts`, `components/admin-post-row.ts`)

- **Filtre:** `FilterGroup` « Filtrer par statut » (Tous, Publiés, Brouillons ; comptes de la liste entière, statut vide désactivé) au-dessus du tableau.
- **Tableau:** `table` pleine largeur, `caption` `sr-only` qui dit l'ordre (« Articles, du plus récent au plus ancien » ou l'inverse) ; six `th scope="col"` mono 12 px capitales `text-muted`, filet bas `line-strong` 1,5 px : Article, Statut, Publié le, Lecture, J'aime, actions (`sr-only`). Seul « Publié le » est triable : `aria-sort` sur le `th`, `button` natif 44 px avec flèche `arrow-down` / `arrow-up` décorative ; les brouillons restent en fin dans les deux sens.
- **Ligne (`tr[app-admin-post-row]`):** filet bas `line`, `py-3.5`. Cellule Article : vignette 1200/630 de `8rem` (`rounded-sm`, trait `line-strong`, `bg-surface`, `alt=""`, « sans couverture » mono décoratif sans image), titre Archivo gras 17 px, sujets mono 12 px `text-muted` (trois premiers, « A · B · C ») ; statut en `Stamp` (« Publié », « Brouillon » pointillé) ; date mono 14 px (« — » décoratif et « non publié » `sr-only` pour un brouillon) ; lecture mono « 13 min » ; j'aime mono aligné à droite `tabular-nums`.
- **Actions:** cibles de 44 px sur une ligne à partir de `sm` : « Lire en ligne : X (nouvel onglet) » (publiés seulement, `/blog/<slug>`, `noopener`), « Modifier : X » (lien vers l'éditeur), « Supprimer : X » (`Button` danger, confirmation).
- **Petit écran:** sous `md`, Publié le, Lecture et J'aime (`th` et `td`) passent en `hidden md:table-cell` et la cellule Article les reprend en méta mono 12 px (« 9 sept. 2026 · 13 min · 0 j'aime », « Non publié · … ») ; sous `sm`, la vignette disparaît et les actions s'empilent dans leur cellule. Aucun défilement horizontal à 375 px.

### Éditeur d'article (`features/admin/application/admin-post-editor.ts`, `components/admin-post-form.ts`)

Même grammaire que l'éditeur de projet (en-tête, colonnes, sections, barre, sommaire, garde), à ces différences près :

- **En-tête:** fil d'Ariane « Articles », `h1` = titre enregistré ou « Nouvel article » ; seule action, « Voir l'aperçu » sous `lg`.
- **États:** squelette `role="status"` ; `LoadError` avec « Réessayer » ; article absent de la liste : « Cet article n'existe pas ou a été supprimé. » centré `text-muted` ; les deux derniers suivis du lien « Retour aux articles ».
- **Sections:** `01 · Article` (titre, extrait, sujets), `02 · Contenu` (Markdown en mono 14 px sur 20 lignes, puis son rendu `prose` sous le champ, groupe nommé « Rendu », 32rem de haut au plus avec défilement), `03 · Couverture` (image enregistrée 1200/630 `15rem` et zone de dépôt côte à côte à partir de `sm`), `04 · Publication` (deux cartes-radios « Brouillon » / « Publié », bord `field`, cochée en `primary`, et la mention « Publier l'article redéploie le site : il est en ligne quelques minutes plus tard. » en `field-hint` si « Publié »).
- **Aperçu public (`components/admin-post-preview.ts`):** même cadre que celui des projets, référence « Blog · Liste des articles » ; corps `inert` : la vraie `BlogPostRow` (jamais prioritaire), empilée dans la colonne de 25rem, temps de lecture en direct.

### Audience (`features/admin/application/admin-audience.ts`, facade `audience-report.ts`)

- **En-tête:** `AdminPageHeader` (sur-titre de période, `h1` « Audience », introduction `audienceLead` : « 42 visiteurs, dont 18 venus de google.com. 9 sur 10 repartent après une page. »). Aside aligné à droite à partir de `lg` : « N visiteur(s) en ce moment » (point `status-success` décoratif, nombre en mono gras, texte simple sans région live : relevé toutes les 30 s), puis deux boutons contour 44 px, « Exclure cet appareil » / « Cet appareil est exclu » (`button` natif, `aria-pressed`, bord `primary` une fois pressé) et « Exporter en CSV ».
- **Période:** `FilterGroup` « Période » sans compte (7 jours, 30 jours, 90 jours, Depuis le début).
- **Relevé:** `AdminReadout` à quatre repères (Visiteurs, Pages vues, Rebond, Durée moyenne). Chargement : un squelette `role="status"` à la place du relevé et des sections ; une source en échec : une seule `LoadError` dont « Réessayer » ne relance que les sources en échec.
- **Visites par jour:** `AdminSectionHead` avec légende décorative (`aria-hidden`, trait plein `primary` « Visiteurs », tireté `foreground` 55 % « Pages vues ») ; `AudienceChart` : `figure` (courbe Chart.js de 15rem, `figcaption` `sr-only` = résumé de la période) puis `details` « Voir les données en tableau » (`summary` `text-primary` semi-gras 44 px, table jour / visiteurs / pages vues, jour en `th scope="row"`, nombres groupés, défilement vertical au-delà de 24rem dans une région focalisable).
- **Pages les plus vues, Provenance (`components/audience-share-table.ts`):** deux colonnes à partir de `lg`. `section` nommée par son `h2`, `table` à `caption` `sr-only`, en-têtes `table-head` (mono 12 px capitales `text-muted`, filet bas `line-strong` 1,5 px) ; une ligne par entrée (cinq au plus, le reste en « Autres ») : libellé (mono pour un chemin), barre décorative `h-1 bg-primary` sur piste `bg-line` rapportée à la plus grande ligne, nombre mono semi-gras, part mono `text-muted` (« 43 % »). Sans donnée : « Aucune donnée sur la période. »
- **Ce que les visiteurs font (`components/audience-tally.ts`):** grille 1 / 2 / 4 colonnes de listes `dl` titrées en `h3` mono capitales : Totaux, Projets cliqués, Articles ouverts, Articles lus jusqu'au bout, CTA cliqués, Navigateurs, Systèmes, Pays ; nom à gauche, nombre mono à droite, filets `line`. Liste vide : « Rien sur la période. » Plus de donuts.

### Messages (`features/admin/application/admin-messages.ts`, `components/admin-message-row.ts`)

- **En-tête:** sur-titre « N non lu(s) · N au total » ; aside « Tout marquer comme lu » (bouton contour natif, icône `check`), `aria-disabled="true"` sans effet quand rien n'est non lu (reste focalisable et annoncé, `opacity-55`), jamais `disabled`.
- **Filtre:** `FilterGroup` « Filtrer par lecture » (Tous, Non lus, Lus ; comptes de la boîte entière, filtre à 0 inactif).
- **Liste:** `ul role="list"`, plus récent d'abord, sans pagination. Ligne `li[app-admin-message-row]` à filet bas `line` : grille 44 px / expéditeur (`14rem`, nom semi-gras, e-mail 13 px `text-muted`) / sujet (tronqué, précédé du tampon « Nouveau » si non lu) / date relative mono 12 px dans un `<time datetime>` (`8rem`) / actions (`8.25rem`, alignées à droite) ; sous `md`, actions sur la première ligne, sujet et date dessous. Bouton de dépliage natif 44 px (chevron qui pivote, `aria-expanded`, `aria-controls`, nom « Afficher / Masquer le message de X ») ; corps `text-muted` `max-w-[70ch]` décalé sous l'expéditeur.
- **Actions:** cibles de 44 px : « Répondre à X » (lien `mailto:`), « Marquer comme lu : X » (non lus seulement), « Supprimer le message de X » (`Button` danger texte, confirmation).
- **Vide:** `AdminEmptyState` centré, tampon « Boîte vide ».
- **Échec:** un seul signalement, celui de la page : toast pour une écriture (état restauré), `LoadError` pour la lecture de la boîte. La lecture et les écritures de `HttpContactGateway` utilisées par l'admin portent `SKIP_ERROR_TOAST`.

### CV (`features/admin/application/admin-cv.ts`, `admin-cv-view.ts`)

- **En-tête:** sur-titre « PDF · 76 Ko · mis en ligne le 19 sept. 2026 » (taille par `formatFileSize`, source unique avec le cartouche et la zone de dépôt), `h1` « CV », phrase sur le bouton du site ; aside : `Cartouche` « CV en ligne », référence = nom du fichier, lignes Mis en ligne / Taille / Téléchargé (« 0 fois en 30 j », espace insécable, « indisponible » si le compte échoue, sans alerte ni toast). Aucun cartouche sans CV.
- **Actions:** « Ouvrir le PDF » `link-btn-outline` (icône `external-link`, « (nouvel onglet) » `sr-only`, `noopener noreferrer`) puis « Retirer le CV du site… » (`Button` danger texte, confirmation).
- **Téléversement:** `AdminSectionHead` « Remplacer le fichier » (ou « Mettre un CV en ligne » sans CV), `mt-12`, puis `FileDropzone` ; « Mettre en ligne » / « Annuler » sous la zone dès qu'un PDF est choisi. Un envoi réussi vide la zone (`resetToken`) ; un fichier qui n'est pas un PDF aussi, avec le toast « Seuls les fichiers PDF sont acceptés. ». Un échec d'envoi ou de retrait : un seul toast, celui de la page (`SKIP_ERROR_TOAST` sur les deux écritures).
- **Vide:** `AdminEmptyState` tampon « Aucun CV », phrase sur le bouton du site absent.

### Paramètres (`features/admin/application/admin-settings.ts`, `components/admin-setting-row.ts`)

- **Sections:** `AdminSectionHead` « Sécurité » puis « Apparence » (`mt-12`).
- **Ligne de réglage (`div[app-admin-setting-row]`, `fieldset[app-admin-setting-row]`):** filet bas `line`, `py-4.5` ; titre (`h3`, ou `legend` flottante pour un `fieldset`) Archivo gras 16,5 px élargi 104 %, explication 14 px `text-muted` limitée à 60 caractères, réglage à droite à partir de `sm` (deuxième colonne sur deux rangées), dessous sinon.
- **Sécurité:** « Double authentification » → « Configurer » (`link-btn-outline` vers `/admin/settings/security`) ; « Session » « Connecté en tant que <e-mail>. » → « Se déconnecter » (bouton natif `link-btn-outline`, icône `sign-out`).
- **Apparence:** `fieldset` « Thème de l'administration », trois radios natives Système / Clair / Sombre (même `name`, appliquées au changement, sans soumission) dessinées en onglets comme `FilterGroup` : `label` 44 px `text-muted`, cochée = trait bas `primary` 2 px et texte `foreground` semi-gras, focus clavier = contour 2 px `primary` intérieur, piste `line` en trait intérieur bas. Même stockage que la bascule de la coque et du site.

### Sécurité (`features/auth/application/two-factor-setup.ts`)

- `h1` « Sécurité » en tête de colonne (style de l'en-tête admin, sans l'importer : `features/auth` ne dépend pas de `features/admin`) ; statut « 2FA activé » en `Stamp` (`twofa-status`), plus en vert sur fond vert.

### Zone de dépôt (`shared/ui/file-dropzone.ts`)

- **API:** `accept`, `label`, `helperText`, `previewUrl`, `resetToken` (tout changement efface le fichier affiché, sans émettre `cleared`) ; sorties `fileSelected`, `cleared`. Le parent incrémente `resetToken` après un envoi réussi et au refus d'un fichier (CV, couvertures des éditeurs), et relaie `cleared` jusqu'à l'état qu'il envoie : un fichier retiré ou refusé n'est jamais envoyé.
- **Fichier choisi:** nom, puis taille par `formatFileSize` (`shared/ui/format-file-size.ts`, « 1,2 Mo », la même que le cartouche du CV). Après le choix, le focus va sur « Remplacer », ou sur le bouton de la zone si le parent l'a remise à zéro ; après un retrait, sur le bouton de la zone.

### Toast (`shared/ui/toast.ts`)

À documenter — variantes info/success/warn/error, position, durée, dismiss.

### Drawer (`shared/ui/drawer.ts`)

Overlay, verrouillage du défilement, piège de focus (Tab et Maj+Tab restent dans le panneau), Échap ferme et rend le focus à l'élément qui l'a ouvert. Dans la coque admin, le bouton qui l'ouvre porte `aria-expanded` et `aria-controls` vers l'hôte du tiroir.

### Chart (`shared/ui/chart.ts`)

Wrapper Chart.js pour les KPI admin. Le seul endroit où des couleurs additionnelles (au-delà de Signal Indigo + status) sont tolérées pour différencier les séries — mais elles doivent rester dans la famille des dérivées indigo/violet (pas de teal/coral aléatoire).

Courbe des visiteurs (`buildVisitorsChartData`) : une seule teinte, « Visiteurs » trait `primary` plein, « Pages vues » `foreground` 55 % tireté (4/4), traits droits (`tension: 0`). Couleurs lues sur les jetons du registre courant (`readChartPalette`) et relues à chaque bascule de thème ; repli couleur système `CanvasText`, jamais une couleur en dur.

## 6. Do's and Don'ts

### Do:

- **Do** utiliser `var(--color-primary)` ou `bg-primary` partout où on a besoin de Signal Indigo. Jamais `#4f46e5` ou `indigo-600` en dur (sauf dans le frontmatter et styles.css).
- **Do** tester chaque composant en `.app-dark` ET sans `.app-dark` avant de merger. La règle Two Registers est non négociable.
- **Do** utiliser `:focus-visible` sur tout interactif avec un ring 2px Signal Indigo. C'est un signal de séniorité (a11y AA strict).
- **Do** respecter `prefers-reduced-motion: reduce` — désactiver fade-up, view-transitions, scroll animations.
- **Do** réserver le mono à du contenu vraiment technique (code, chiffres, status).
- **Do** garder body line-length à 65–75ch maximum (`max-w-prose` ou équivalent).
- **Do** utiliser les utilities `form-*`, `field-*`, `table-head`, `link-btn-*` plutôt que de redéclarer les classes Tailwind. Si tu dupliques 10+ classes, crée une utility.
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
- **Don't** présenter un site de démonstration comme une référence client : badge « Démo » dans le gabarit sur toute démo des Réalisations, aucune démo sur la home (qui ne montre que des projets en production) ni dans les données structurées d'avis ou de référence client.
