# ADR-0006 — Polices de marque auto-hébergées (Archivo, IBM Plex Sans et Mono renommées JN Sans et JN Mono)

- **Statut** : accepté (2026-10-04, avec la Tranche V)
- **Date** : 2026-10-04
- **Contexte spec** : `specs/009-plateforme-acquisition.md`, « Tranche V — plan détaillé »
- **Remplace** : la règle « System-Stack » de `DESIGN.md` § 3 (et son miroir dans `DESIGN.json`)

## Context

Depuis l'origine, le site n'emploie que la pile système (`system-ui`, `ui-monospace`) : aucune
police chargée, CSP `font-src 'self'`, règle nommée « System-Stack Rule » dans `DESIGN.md`
(« si une font custom devient nécessaire, elle exige une justification produit écrite »).

La spec 009 repositionne le site en plateforme d'acquisition client. `PRODUCT.md` (principe 3)
fixe une signature unique, le dessin technique (cartouche, cotes), et Julien a validé le
2026-10-04 une maquette qui la porte par la typographie : Archivo (axe de largeur `wdth`) en
titres, IBM Plex Sans en texte, IBM Plex Mono pour les données. La pile système ne fournit ni
l'axe de largeur ni la voix « plan d'atelier » du duo Archivo / Plex : c'est la justification
produit écrite que la règle exigeait.

Contraintes :

- **CSP** : la `<meta>` de chaque page (`src/index.html`, durcie au build par
  `scripts/apply-csp-hashes.mjs`) déclare `font-src 'self'` et `style-src 'self' 'unsafe-inline'
  https://giscus.app` (l'`unsafe-inline` est remplacé par des hachages en prod).
- **Performance** : Lighthouse ≥ 95 (perf, a11y, SEO) sur les pages publiques
  (`PRODUCT.md`, principe 1). Le site est servi statiquement par nginx (prérendu).
- **RGPD** : servir Google Fonts depuis `fonts.googleapis.com` / `fonts.gstatic.com` transmet
  l'adresse IP du visiteur à Google sans consentement ; le LG München (20 janvier 2022,
  3 O 17493/20) l'a jugé illicite. Le site n'a pas de bandeau de consentement et n'en veut pas.
- **Cache nginx** : `location ~* \.(js|css|woff2?|…)$` pose
  `Cache-Control: public, max-age=31536000, immutable`, y compris sur les fichiers de `public/`
  dont le nom n'est **pas** haché par le build.

## Decision

1. **Auto-hébergement** de quatre fichiers woff2 dans `public/fonts/`, servis depuis l'origine du
   site. Aucune requête tierce, **aucune modification de CSP** (`font-src 'self'` les couvre ;
   la feuille `@font-face` vit dans `src/styles.css`, donc sous `style-src 'self'`).
2. **Source** : paquets npm Fontsource 5.3.0 (fichiers dérivés des binaires Google Fonts,
   sous-ensemble `latin` déjà découpé) récupérés une fois par `npm pack`, puis **réduits aux
   plages d'axes utilisées** par `fontTools.varLib.instancer`. Les binaires produits sont
   commités ; aucune dépendance npm ni Python n'entre dans le repo.

   | Fichier publié | Source | Axes conservés | Taille |
   |---|---|---|---|
   | `archivo-2.001-latin-wdth100-110-wght600-800.woff2` | `@fontsource-variable/archivo@5.3.0` `files/archivo-latin-wdth-normal.woff2` (Archivo v2.001, Omnibus-Type) | `wdth` 100–110, `wght` 600–800 (seules plages employées) | 39 512 o (source : 90 104 o) |
   | `jn-sans-3.201-latin-wght.woff2` | `@fontsource-variable/ibm-plex-sans@5.3.0` `files/ibm-plex-sans-latin-wght-normal.woff2` (IBM Plex Sans v3.201) | `wght` 400–700, famille renommée | 35 864 o (source : 45 712 o) |
   | `jn-sans-3.201-latin-wght-italic.woff2` | `@fontsource-variable/ibm-plex-sans@5.3.0` `files/ibm-plex-sans-latin-wght-italic.woff2` (IBM Plex Sans Italic v3.201) | `wght` 400–700, famille renommée | 38 840 o (source : 50 184 o) |
   | `jn-mono-2.3-latin-500.woff2` | `@fontsource/ibm-plex-mono@5.3.0` `files/ibm-plex-mono-latin-500-normal.woff2` (IBM Plex Mono v2.3) | statique 500, famille renommée | 14 924 o (source : 14 888 o) |

   L'italique garde la même plage de graisses que le romain : la prose du blog combine `em` et
   `strong` (600), et `font-synthesis-weight: none` interdit le faux gras ; mesuré, la plage
   400–600 ne pèse que 832 o de moins (38 112 o), et une italique statique 400 (23 472 o)
   rendrait `em strong` en 400. Gain négligeable sur un fichier jamais préchargé.

   Total : **129 140 octets** (mesuré), dont 90 300 pour les trois faces romanes.
   Commande de reproduction (hors repo, répertoire temporaire) :

   ```sh
   npm pack @fontsource-variable/archivo@5.3.0 @fontsource-variable/ibm-plex-sans@5.3.0 @fontsource/ibm-plex-mono@5.3.0
   pip install --target .ft fonttools brotli
   PYTHONPATH=.ft python3 -m fontTools.varLib.instancer archivo-latin-wdth-normal.woff2 wdth=100:110 wght=600:800 -o archivo-2.001-latin-wdth100-110-wght600-800.woff2
   PYTHONPATH=.ft python3 -m fontTools.varLib.instancer ibm-plex-sans-latin-wght-normal.woff2 wght=400:700 -o ibm-plex-sans-3.201-latin-wght.woff2
   PYTHONPATH=.ft python3 -m fontTools.varLib.instancer ibm-plex-sans-latin-wght-italic.woff2 wght=400:700 -o ibm-plex-sans-3.201-latin-wght-italic.woff2
   # Plex Mono : fichier statique 500, aucune instanciation
   cp ibm-plex-mono-latin-500-normal.woff2 ibm-plex-mono-2.3-latin-500.woff2
   # Renommage de la famille (Reserved Font Name « Plex », cf. point 6) : table `name` seule,
   # glyphes et axes intacts, horodatage `head` conservé
   cat > rename.py <<'PY'
   import sys
   from fontTools.ttLib import TTFont
   REPL = [('IBM Plex Sans', 'JN Sans'), ('IBMPlexSans', 'JNSans'), ('IBM Plex Mono', 'JN Mono'),
           ('IBMPlexMono', 'JNMono'), (';IBM ;', ';JN;'), (';IBM;', ';JN;')]
   t = TTFont(sys.argv[1], recalcTimestamp=False)
   for r in t['name'].names:
       s = r.toUnicode()
       for a, b in REPL:
           s = s.replace(a, b)
       assert 'plex' not in s.lower(), (r.nameID, s)
       r.string = s
   t.flavor = 'woff2'
   t.save(sys.argv[2])
   PY
   PYTHONPATH=.ft python3 rename.py ibm-plex-sans-3.201-latin-wght.woff2 jn-sans-3.201-latin-wght.woff2
   PYTHONPATH=.ft python3 rename.py ibm-plex-sans-3.201-latin-wght-italic.woff2 jn-sans-3.201-latin-wght-italic.woff2
   PYTHONPATH=.ft python3 rename.py ibm-plex-mono-2.3-latin-500.woff2 jn-mono-2.3-latin-500.woff2
   ```

   Seuls les trois fichiers `jn-*` (et Archivo) sont publiés ; les fichiers intermédiaires
   `ibm-plex-*` ne quittent pas le répertoire temporaire.

   Les fichiers `.woff2` sources sont dans `package/files/` de chaque archive dépaquetée. Les
   tailles ci-dessus sont celles produites avec fontTools 4.66.1 : une autre version peut varier de
   quelques dizaines d'octets.

3. **Version dans le nom de fichier**. Le cache nginx est `immutable` sur un an et le nom n'est
   pas haché : tout changement de binaire (version amont, plage d'axes, sous-ensemble) **change le
   nom**. Les fichiers ne passent pas par `url()` relatif dans `styles.css` (qui les ferait hacher
   dans `media/`) parce que le préchargement exige un chemin stable connu à l'écriture de
   `index.html`.
4. **`font-display: swap`** sur les quatre faces, **préchargement de la seule police du LCP**
   (Archivo : le `h1` de chaque page publique) par `<link rel="preload" as="font"
   type="font/woff2" crossorigin>` dans `src/index.html`. L'italique n'est **jamais** préchargée :
   le navigateur ne télécharge une face déclarée que si un texte rendu l'utilise, donc elle n'est
   demandée que sur les pages qui contiennent de l'italique (articles du blog).
5. **Faces de repli métriquement ajustées** (`size-adjust`, `ascent-override`,
   `descent-override`, `line-gap-override`), pour que le `swap` ne décale
   pas la mise en page (CLS). Valeurs calculées depuis les tables `hhea`/`OS/2` et la chasse
   moyenne d'un échantillon de texte français, contre Liberation Sans (métriquement identique à
   Arial) :
   - Archivo (instance `wdth` 108, `wght` 760, contre Arial Bold) : `size-adjust: 109.59%`,
     `ascent-override: 80.11%`, `descent-override: 19.16%`, `line-gap-override: 0%`. La face de
     repli pointe donc vers la **graisse grasse** (`local('Arial Bold')`, `local('Arial-BoldMT')`,
     puis `local('Liberation Sans Bold')`, `local('LiberationSans-Bold')`, métriquement identiques),
     avec `font-weight: 600 800` : `font-synthesis-weight: none` interdisant le faux gras, une face
     regular afficherait les titres en Arial maigre, ~10 % plus étroit que la référence de calibrage.
   - JN Sans (`wght` 400, contre Arial regular, `local('Arial')`) : `size-adjust: 101.88%`,
     `ascent-override: 100.60%`, `descent-override: 26.99%`, `line-gap-override: 0%`.
   - JN Sans Italic : pas de face de repli dédiée (texte ponctuel, chargé tard ; le repli
     romain ajusté s'applique en oblique le temps du chargement).
   - JN Mono : pas de face de repli (libellés courts, impact CLS négligeable), pile
     `ui-monospace` après elle.
6. **Licences** : les trois familles sont sous **SIL Open Font License 1.1**.
   - **Archivo** : pas de *Reserved Font Name* (vérifié dans `google/fonts`) ; la réduction d'axes
     est une modification permise sans renommage. Licence jointe : `public/fonts/OFL-archivo.txt`
     (copie du `LICENSE` du paquet).
   - **IBM Plex** : la licence amont (`IBM/plex` `LICENSE.txt`, `google/fonts`
     `ofl/ibmplexsans/OFL.txt`) déclare `Copyright © 2017 IBM Corp. with Reserved Font Name "Plex"`.
     Les en-têtes des paquets Fontsource, reconstruits depuis la table `name`, ont perdu cette
     mention. Le sous-ensemble latin et la réduction d'axes font des fichiers servis des *Modified
     Versions* (condition 3 de l'OFL) : ils **ne peuvent pas porter le nom « Plex »**. On renomme
     donc la famille dans la table `name` de **tous** les fichiers Plex servis, Plex Mono compris
     (le sous-ensemble latin est déjà une modification ; on ne parie pas sur l'interprétation) :
     « JN Sans » / « JN Mono », PostScript `JNSans-…` / `JNMono-…`, sans toucher aux glyphes ni aux
     axes. Les `font-family` CSS reprennent ces noms ; aucun ne prétend être « IBM Plex ».
     `public/fonts/OFL-ibm-plex.txt` porte l'en-tête amont avec la mention du *Reserved Font Name*,
     une note décrivant les modifications et le renommage, puis le texte OFL 1.1.

## Consequences

- `DESIGN.md` § 3 et `DESIGN.json` abandonnent la « System-Stack Rule » au profit d'une règle
  « trois familles, pas une de plus » (Archivo titres, JN Sans texte, JN Mono données).
- Une page sans italique télécharge au plus 90 300 octets de polices (puis cache un an) ; une
  page qui en contient, 38 840 de plus. Seul Archivo est préchargé ; JN Sans, son italique et
  JN Mono sont découverts avec la feuille de styles, à l'usage.
- `<em>` et `<i>` sont rendus dans la vraie italique JN Sans (IBM Plex Sans Italic renommée). La graisse n'est jamais
  synthétisée (`font-synthesis-weight: none`) : une graisse hors plage prend la plus proche
  disponible. Archivo et JN Mono n'ont pas d'italique livrée : une italique dans un titre ou un
  libellé mono reste une oblique synthétisée (cas non prévu par le design).
- Le sous-ensemble `latin` ne contient ni U+202F (espace fine insécable, séparateur de milliers
  d'`Intl.NumberFormat('fr-FR')`) ni U+2192 (`→`) : ces glyphes sont pris dans la police de repli.
  Pour une espace, l'écart est invisible ; pour la flèche, à contrôler visuellement.
- Toute mise à jour de police est une opération manuelle documentée ici (commande ci-dessus), et
  un nouveau nom de fichier dans `styles.css` et `index.html`.

## Alternatives considered

- **Google Fonts (CSS `fonts.googleapis.com`)**, comme la maquette. Écarté : transfert d'IP à un
  tiers sans consentement (RGPD) ; CSP à élargir (`style-src https://fonts.googleapis.com`,
  `font-src https://fonts.gstatic.com`) ; feuille externe bloquante et deux origines de plus à
  résoudre avant le premier rendu du texte, au détriment du LCP mobile.
- **Dépendance npm `@fontsource*` importée dans `styles.css`**. Écarté : noms de fichiers hachés
  par le build (préchargement impossible sans post-traitement), fichiers complets non réduits
  (90 Ko pour Archivo seul), et trois dépendances runtime pour des binaires figés.
- **Garder la pile système.** Écarté par la direction visuelle validée : pas d'axe de largeur,
  pas de distinction titres / texte / données.
- **Préchargement des trois polices.** Écarté : les préchargements entrent en concurrence avec le
  CSS critique et le JS initial ; seule la police du `h1` (élément LCP) le justifie.
