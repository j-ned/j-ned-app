# ADR-0031 : Police de titres Bricolage Grotesque, œil optique et largeur fixés

- **Statut** : accepté (2026-10-22, PR 5 de la spec 033)
- **Date** : 2026-10-21
- **Contexte spec** : `specs/033-nouveau-visuel.md` (arbitrage 4, exigences 8 et 12)
- **Amende** : ADR-0006 (Archivo remplacée par Bricolage Grotesque ; JN Sans et JN Mono, la procédure,
  l'auto-hébergement, le nom versionné et le préchargement de la seule police du `h1` restent en vigueur)

## Context

La direction C « Copeaux vifs » remplace Archivo (titres élargis, voix « plan d'atelier ») par
**Bricolage Grotesque**, une grotesque à œil optique, plus ronde et plus ludique. JN Sans et JN Mono
restent. L'exigence 8 impose : trois familles au plus, auto-hébergées, sous-ensemble latin, axes réduits
aux valeurs employées (largeur et œil optique fixés), nom versionné, repli métriquement ajusté, seule la
police du `h1` préchargée, CSP inchangée. L'exigence 12 : poids préchargé égal ou inférieur à
aujourd'hui (Archivo : **39 512 octets**).

Faits vérifiés le 2026-10-21 :

- **Source officielle** : `google/fonts`, `ofl/bricolagegrotesque/METADATA.pb` : designer Mathieu
  Triay, licence OFL, axes `opsz` 12–96, `wdth` 75–100, `wght` 200–800, source
  `github.com/ateliertriay/bricolage` au commit `84745e5b96`, qui est aussi le dernier commit du dépôt
  amont (2023-07-19). Version de la police : **1.001** (`head.fontRevision`, table `name` ID 5).
- **Licence** : `OFL.txt` amont et `google/fonts` : « Copyright 2022 The Bricolage Grotesque Project
  Authors », **sans Reserved Font Name**. Une version modifiée (sous-ensemble, axes réduits) peut
  garder le nom « Bricolage Grotesque » (condition 3 de l'OFL : seuls les noms réservés sont interdits).
- **Paquet** : `@fontsource-variable/bricolage-grotesque@5.3.0` (dernière version, 2026-07-19), fichier
  `files/bricolage-grotesque-latin-standard-normal.woff2` : 131 548 octets, trois axes, 226 points de
  code (sous-ensemble `latin` de Fontsource). Le sous-ensemble couvre le français sauf `Ÿ`, et, comme
  Archivo, ni U+202F ni U+2192 (pris dans le repli).
- **Poids mesurés** (`fontTools.varLib.instancer` 4.67.0, brotli 1.2.0) :

  | Réduction | Octets |
  |---|---|
  | `opsz` 48, `wdth` 100, `wght` 600–800 (retenue) | **37 460** |
  | `opsz` 96 (défaut de la police), `wdth` 100, `wght` 600–800 | 37 436 |
  | `opsz` 24–96 (borné), `wdth` 100, `wght` 600–800 | 65 936 |
  | `opsz` 12–96 (complet), `wdth` 100, `wght` 600–800 | 68 952 |

  Garder une plage d'œil optique double le fichier : hors budget.
- **Reproductibilité** : sans `--no-recalc-timestamp`, l'horodatage `head.modified` change à chaque
  exécution et la compression woff2 varie de ± 100 octets ; avec l'option, deux exécutions donnent le
  même binaire (SHA-256 identiques).
- Les classes `font-stretch-1xx%` (12 sites, dont 11 dans l'admin) et la largeur des `h1`–`h3` posée par
  la base n'ont plus d'effet : `wdth` est fixé à 100 et la police ne monte pas au-delà.

## Decision

1. **Bricolage Grotesque 1.001** remplace Archivo pour `--font-display` (titres `h1`–`h3`, marque de
   l'en-tête, titre du cartouche, autocollants). Toujours trois familles.
2. **Axes** : `opsz` **fixé à 48**, `wdth` **fixé à 100**, `wght` **600–800** (graisses des titres :
   600 pour les titres de carte, 700 et 800 pour `h2` et `h1`).
   - `opsz` 48 : les titres vont de 20 px (`h3`) à 70 px (`h1` du hero) ; 48 se tient entre les `h2`
     (28–40 px) et le `h1`, garde le dessin serré et les pièges à encre de la grotesque aux grandes
     tailles, et reste lisible à 20 px. La plage complète coûterait 31 476 octets de plus.
   - `wdth` 100 : aucune maquette ne demande de largeur condensée ; la largeur de la police est sa
     largeur normale.
3. **Fichier** : `public/fonts/bricolage-grotesque-1.001-latin-opsz48-wdth100-wght600-800.woff2`,
   37 460 octets. Licence jointe : `public/fonts/OFL-bricolage-grotesque.txt` (copie de `OFL.txt` de
   `google/fonts`). `archivo-2.001-…woff2` et `OFL-archivo.txt` sont supprimés dans la même PR.
   Commande de reproduction (hors repo, répertoire temporaire) :

   ```sh
   npm pack @fontsource-variable/bricolage-grotesque@5.3.0
   tar xzf fontsource-variable-bricolage-grotesque-5.3.0.tgz
   pip install --target .ft fonttools==4.67.0 brotli==1.2.0
   PYTHONPATH=.ft python3 -m fontTools.varLib.instancer \
     package/files/bricolage-grotesque-latin-standard-normal.woff2 \
     opsz=48 wdth=100 wght=600:800 --no-recalc-timestamp \
     -o bricolage-grotesque-1.001-latin-opsz48-wdth100-wght600-800.woff2
   ```

4. **`@font-face`** : `font-family: 'Bricolage Grotesque'`, `font-weight: 600 800`, pas de
   `font-stretch`, `font-display: swap`. **Préchargement** : ce fichier remplace celui d'Archivo dans
   le `<link rel="preload">` d'`index.html` (seule police préchargée).
5. **Face de repli** `'Bricolage Grotesque Fallback'`, mêmes sources `local()` que celle d'Archivo
   (Arial Bold, Liberation Sans Bold, métriquement identiques), `font-weight: 600 800`, calibrée à
   `wght` 760 comme Archivo : `size-adjust: 97.56%`, `ascent-override: 95.32%`,
   `descent-override: 27.67%`, `line-gap-override: 0%`. Méthode d'ADR-0006 (chasse moyenne d'un
   échantillon de titres français contre Liberation Sans Bold, métriques `OS/2` typo divisées par
   `size-adjust`) ; rejouée sur Archivo, elle redonne les valeurs en place à 0,15 point près.
6. **Suppression des largeurs** : les règles `font-stretch` des `h1`–`h3` de `@layer base` et toutes
   les classes `font-stretch-*` des gabarits sont retirées (code sans effet).

## Consequences

- Poids préchargé : 37 460 octets au lieu de 39 512 (**− 2 052, − 5,2 %**). Poids des polices d'une
  page sans italique : 88 248 octets au lieu de 90 300.
- `ci.yml` vérifie aujourd'hui le type et le cache de `archivo-2.001-…woff2` par son nom : la PR 5
  remplace ce nom. La garde générique « chaque `preload` du HTML prérendu existe dans `dist/` » reste.
- ADR-0006 reçoit, dans la PR 5, la mention « amendé par ADR-0031 » sur sa ligne de statut.
- Le titre du cartouche, élargi à 110 % aujourd'hui, prend la largeur normale.
- `Ÿ` (absent du sous-ensemble) est pris dans le repli, comme U+202F et `→`.

## Alternatives considered

- **Plage d'œil optique 24–96 avec `font-optical-sizing: auto`** : le dessin suivrait chaque taille,
  mais 65 936 octets (+ 67 % sur Archivo) violent le budget de l'exigence 12. Écarté.
- **`opsz` 96** (défaut de la police, dessin le plus expressif) : même poids ; espacement 6 % plus
  serré, fragile pour les titres de 20 px et les autocollants. Écarté au profit de 48 (question de goût
  laissée au propriétaire dans la spec).
- **Fichier Google Fonts `BricolageGrotesque[opsz,wdth,wght].ttf` sous-ensemblé par `pyftsubset`** :
  même dessin, mais redécoupage du latin à refaire à la main ; le sous-ensemble `latin` de Fontsource
  est celui déjà employé pour JN Sans et JN Mono. Écarté.
- **Renommer la famille** (comme JN Sans) : inutile, pas de *Reserved Font Name*. Écarté.
- **Garder Archivo** : écarté par l'arbitrage du propriétaire (2026-10-21).
