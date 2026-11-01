# ISO 1832 : code de désignation des plaquettes amovibles de tournage (ex. CNMG 120408)

Recherche du 2026-10-26. Le texte de la norme ISO 1832 est payant et n'a pas été consulté. Les valeurs viennent donc de pages techniques de fabricants qui reproduisent le système ISO :
- **[MMC]** Mitsubishi Materials, *Product Guide > Turning Tools > Turning Insert Identification*, pages popup 1 à 10 : https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/tip_sensaku.html (sous-pages `keijou.html`, `nigekaku.html`, `seido.html`, `mizo.html`, `naisetsu.html`, `swindow/tip_atsusa.html`, `swindow/tip_corner.html`, `swindow/tip_hasaki.html`, `katte.html`, `breaker.html`, toutes dans le même dossier). Les angles de dépouille de `nigekaku.html` ne sont donnés que par des images, nommées `id_angle_3.gif`, etc. (voir plus bas).
- **[KYO]** Kyocera, catalogue *Turning Indexable Inserts* (PDF, 95 p., créé en octobre 2015), p. B1 « Turning Indexable Inserts Identification System » : https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf (texte extrait avec pdftotext, mise en page en colonnes parfois imbriquée).
- **[EAS]** P. L. Easthope, *ISO 1832:2004 – Indexable inserts for cutting tools*, page personnelle (© 2011) : https://easthope.ca/CuttingToolInserts.html. Source secondaire non officielle, en unités **pouces** et proche de la norme ANSI (elle renvoie à ANSI B94.25). Utile surtout pour les lettres.
- **[MMC-course]** Mitsubishi Materials, cours *Insert turning identification code* : https://www.mmc-carbide.com/permanent/courses/85/insert-turning-identification-code.html
- **[SUMI]** Sumitomo Electric, *General Catalog 2025-2026*, p. 50, « IGETALLOY Indexable Insert Identification Table » : https://online.flippingbook.com/view/410142785/50/ (extraction illisible en partie, utilisée seulement comme recoupement partiel).

## Que signifie exactement chaque lettre et chaque chiffre ? (au moins deux sources indépendantes)

### Takeaway
Les sept premières positions (forme, dépouille, classe de tolérance, fixation/brise-copeaux, longueur d'arête, épaisseur, rayon de bec) concordent entre Mitsubishi et Kyocera pour toutes les valeurs courantes. Dans CNMG 120408 : losange 80°, dépouille 0°, tolérance M, trou cylindrique avec brise-copeaux double face, arête de 12 mm, épaisseur de 4,76 mm, rayon de 0,8 mm.

### Cited Findings

**Norme de référence**
- ISO 1832:2017, *Indexable inserts for cutting tools — Designation*, valide depuis le 27-02-2017, remplace ISO 1832:2012, ICS 25.100.01. Champ d'application : code de désignation des types usuels de plaquettes amovibles en matériaux de coupe durs ou autres, ainsi que des plaquettes CBN (BL, BH, BC) brasées ou massives et PCD (DP) brasées. — [EVS, fiche ISO 1832:2017](https://www.evs.ee/en/iso-1832-2017)
- Selon le résultat de recherche (la page iso.org a renvoyé une erreur 403 et n'a pas pu être ouverte), le catalogue ISO indique l'édition 6, révisée et confirmée en 2022. — [ISO 69202](https://www.iso.org/standard/69202.html) **(non vérifié directement)**
- L'édition de 1991 a ajouté les lettres K et P à l'état d'arête (paragraphe 5.1). — [ISO 1832:1991, iso.org/standard/6482](https://www.iso.org/standard/6482.html) (d'après l'extrait du moteur de recherche, page non ouverte)

**Position 1 : forme (angle de pointe)**
| Lettre | MMC (keijou.html) | KYO (p. B1) | EAS |
|---|---|---|---|
| H | Hexagone | Hexagone | Hexagone |
| O | Octogone | Octogone | Octogone |
| P | Pentagone | Pentagone | Pentagone |
| S | Carré | Carré | Carré |
| T | Triangle | Triangle | Triangle |
| C | Losange 80° | Losange 80° | Losange 80° |
| D | Losange 55° | Losange 55° | Losange 55° |
| E | Losange 75° | Losange 75° | Losange 75° |
| F | Losange 50° | Losange 50° | absent |
| M | Losange 86° | Losange 86° | Losange 86° |
| V | Losange 35° | Losange 35° | Losange 35° |
| W | Trigone | « Hexagon » (sic) | Trigone 80° |
| L | Rectangle | Rectangle | Rectangle |
| A | Parallélogramme 85° | Parallélogramme 85° | Parallélogramme 85° |
| B | Parallélogramme 82° | Parallélogramme 82° | Parallélogramme 82° |
| K | Parallélogramme 55° | Parallélogramme 55° | Parallélogramme 55° |
| R | Rond | Rond | Rond |
| X | Forme spéciale | absent | absent |
- KYO : « Shown angle stands for acute angle for rhombic and parallelogram inserts » (l'angle indiqué est l'angle aigu). — [KYO p. B1](https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf)
- SUMI recoupe C 80°, D 55°, E 75°, V 35°, S 90°, T 60° et W trigone 80°. — [SUMI p. 50](https://online.flippingbook.com/view/410142785/50/)
- Angle du trigone W = 80° : donné par EAS et SUMI, pas en clair par MMC ni KYO.

**Position 2 : dépouille normale (angle de dépouille)**
| Lettre | MMC | KYO | EAS |
|---|---|---|---|
| A | 3° | 3° | 3° |
| B | 5° | 5° | 5° |
| C | 7° | 7° | 7° |
| D | 15° | 15° | 15° |
| E | 20° | 20° | 20° |
| F | 25° | 25° | 25° |
| G | 30° | 30° | 30° |
| N | 0° | 0° | 0° |
| P | 11° | 11° | 11° |
| O | « Other » (autre angle, à préciser) | absent | absent |
- MMC : la table HTML liste les symboles A B C D E F G N P O. Les angles sont dans des images dont les noms suivent le même ordre : `id_angle_3.gif`, `_5`, `_7`, `_15`, `_20`, `_25`, `_30`, `_0`, `_11`. O est décrit comme « Other Normal Clearance ». — [MMC nigekaku.html](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/nigekaku.html)
- KYO : A 3°, B 5°, C 7°, D 15°, E 20°, F 25°, G 30°, N 0°, P 11°. — [KYO p. B1](https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf)
- EAS ajoute des codes à deux angles (dépouille primaire / dépouille de facette) : H 0/11°, J 0/14°, K 0/17°, L 0/20°, M 11/14°, R 11/17°, S 11/20°. — [EAS](https://easthope.ca/CuttingToolInserts.html) **(source unique, probablement issue de l'ANSI ou d'une ancienne édition ; non retrouvé chez les fabricants)**
- Plaquette N (0°) = plaquette négative. Tout autre angle = plaquette positive. En tournage, les symboles les plus courants sont P, C et N. — [MMC-course](https://www.mmc-carbide.com/permanent/courses/85/insert-turning-identification-code.html)

**Position 3 : classe de tolérance** (m = hauteur de bec, d = cercle inscrit, s = épaisseur, en mm)
| Classe | m | d | s |
|---|---|---|---|
| A | ±0,005 | ±0,025 | ±0,025 |
| F | ±0,005 | ±0,013 | ±0,025 |
| C | ±0,013 | ±0,025 | ±0,025 |
| H | ±0,013 | ±0,013 | ±0,025 |
| E | ±0,025 | ±0,025 | ±0,025 |
| G | ±0,025 | ±0,025 | ±0,13 |
| J | ±0,005 | ±0,05 à ±0,15 | ±0,025 |
| K* | ±0,013 | ±0,05 à ±0,15 | ±0,025 |
| L* | ±0,025 | ±0,05 à ±0,15 | ±0,025 |
| M* | ±0,08 à ±0,18 | ±0,05 à ±0,15 | ±0,13 |
| N* | ±0,08 à ±0,18 | ±0,05 à ±0,15 | ±0,025 |
| U* | ±0,13 à ±0,38 | ±0,08 à ±0,25 | ±0,13 |
- Source : [MMC seido.html](https://mitsubishicarbide.net/contents/mhg/ru/html/product/product_guide/information/turning/seido.html), « * The insert surface is sintered » (périphérie brute de frittage). KYO p. B1 donne la même table, avec les mêmes valeurs lisibles (A, F, C, H, E, G, J, K, L, M, N, U, « *Insert's periphery is as fired », « Tolerance difference is depending on insert size »). — [KYO](https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf)
- Classe M, détail selon le cercle inscrit (MMC). Pour m : triangle, carré et losange 80° à ±0,08 (IC 6,35 et 9,525), ±0,13 (12,70), ±0,15 (15,875 et 19,05). Losange 55° : ±0,11, ±0,11, ±0,15, ±0,18. Losange 35° : ±0,16 (6,35 et 9,525). Pour d : ±0,05 (6,35 et 9,525), ±0,08 (12,70), ±0,10 (15,875 et 19,05), ±0,13 (25,40), ±0,15 (31,75). — [MMC seido.html](https://mitsubishicarbide.net/contents/mhg/ru/html/product/product_guide/information/turning/seido.html)
- Différence M / G : les classes A à J sont rectifiées sur la périphérie, tolérances serrées, appelées « classe G ». Les classes K à U n'ont que les faces supérieure et inférieure rectifiées, appelées « classe M ». En tournage, on utilise surtout G (parfois J) ou M. — [MMC-course](https://www.mmc-carbide.com/permanent/courses/85/insert-turning-identification-code.html)
- Les tolérances en pouces d'EAS (par ex. M : 0,002 à 0,004″ sur l'IC) relèvent du système ANSI et ne se comparent pas directement aux valeurs métriques. — [EAS](https://easthope.ca/CuttingToolInserts.html)

**Position 4 : fixation et/ou brise-copeaux**
| Lettre | Trou | Forme du trou | Brise-copeaux (MMC / KYO) |
|---|---|---|---|
| N | non | – | aucun |
| R | non | – | une face |
| F | non | – | deux faces |
| A | oui | cylindrique | aucun |
| M | oui | cylindrique | une face |
| G | oui | cylindrique | deux faces |
| W | oui | cylindrique + 1 fraisure 40 à 60° | aucun |
| T | oui | cylindrique + 1 fraisure 40 à 60° | une face |
| Q | oui | cylindrique + 2 fraisures 40 à 60° | aucun |
| U | oui | cylindrique + 2 fraisures 40 à 60° | deux faces |
| B | oui | cylindrique + 1 fraisure 70 à 90° | aucun |
| H | oui | cylindrique + 1 fraisure 70 à 90° | une face |
| C | oui | cylindrique + 2 fraisures 70 à 90° | aucun |
| J | oui | cylindrique + 2 fraisures 70 à 90° | deux faces |
| X | – | – | conception spéciale |
- MMC donne ces 15 lettres : [MMC mizo.html](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/mizo.html). Pour T, U, H et J, la colonne « Hole Configuration » est vide dans le HTML (l'info est dans l'image). Les fraisures de T, U, H et J sont tirées de KYO.
- KYO p. B1 donne la même table : W, T avec fraisure 40 à 60° (une face pour T), Q, U avec deux fraisures 40 à 60°, B, H avec une fraisure 70 à 90°, C, J avec deux fraisures 70 à 90°, X spécial. — [KYO](https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf)
- EAS donne des lettres compatibles (trou, nombre de fraisures, brise-copeaux) sous forme de codes chiffrés, mais sa notation de G et M diffère légèrement (deux colonnes « chip groove »). — [EAS](https://easthope.ca/CuttingToolInserts.html)
- Un brise-copeaux double face n'existe que sur plaquette négative. Une plaquette positive n'a qu'une face de coupe. — [MMC-course](https://www.mmc-carbide.com/permanent/courses/85/insert-turning-identification-code.html)

**Position 5 : taille, c'est-à-dire longueur d'arête en mm (métrique)**
- En métrique, le code est la longueur d'arête sur deux chiffres, en mm, tronquée. Le même cercle inscrit (IC) donne donc des codes différents selon la forme. En pouces (ANSI), le code est l'IC en 1/8″. — [MMC-course](https://www.mmc-carbide.com/permanent/courses/85/insert-turning-identification-code.html) ; KYO : « Expressed as edge length for ISO. ANSI expresses the inscribed circle diameter in inches. »
- Correspondances IC / code (KYO p. B1, colonnes C D R S T V W, recoupées avec [MMC naisetsu.html](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/naisetsu.html)) :

| IC (mm) | C | D | S | T | V | W | R (diamètre) |
|---|---|---|---|---|---|---|---|
| 6,35 | 06 | 07 | 06 | 11 | 11 | 04 | 06 |
| 7,94 | 08 | 09 | 07 | 13 | – | 05 | 08 (MMC) |
| 9,525 | 09 | 11 | 09 | 16 | 16 | 06 | 09 |
| 12,70 | 12 | 15 | 12 | 22 | 22 | 08 | 12 |
| 15,875 | 16 | 19 | 15 | 27 | 27 | 10 | 15 / 16 selon la source |
| 19,05 | 19 | 23 | 19 | 33 | 33 | 13 | 19 |
| 25,40 | 25 | 31 | 25 | 44 | 44 | 17 | 25 |
| 31,75 | 32 | 38 | 31 | 54 | 54 | 21 | 31 / 32 selon la source |
- Pour les plaquettes rondes, les deux sources ajoutent des diamètres métriques ronds (06, 08, 10, 12, 16, 20, 25, 32 mm). L'extraction textuelle mélange les colonnes : **à vérifier sur le PDF ou l'image**.

**Position 6 : épaisseur s** (mesurée de la face d'appui au point le plus haut de l'arête, selon MMC et KYO)
| Code | MMC (mm) | KYO (mm) |
|---|---|---|
| S1 | 1,39 | absent |
| 01 | 1,59 | 1,59 |
| T0 | 1,79 | absent |
| T1 | absent | 1,98 |
| 02 | 2,38 | 2,38 |
| T2 | 2,78 | 2,78 |
| 03 | 3,18 | 3,18 |
| T3 | 3,97 | 3,97 |
| 04 | 4,76 | 4,76 |
| 05 | absent | 5,56 |
| 06 | 6,35 | 6,35 |
| 07 | 7,94 | 7,94 |
| 09 | 9,52 | 9,525 |
- Sources : [MMC swindow/tip_atsusa.html](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/swindow/tip_atsusa.html) et [KYO p. B1](https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf)
- Logique : le code numérique est l'épaisseur en mm tronquée. Le préfixe T marque une valeur intermédiaire (T3 = 3,97, entre 03 = 3,18 et 04 = 4,76). Ces valeurs correspondent à des fractions de pouce : T3 = 5/32″, 04 = 3/16″ (colonne ANSI de KYO). Cette lecture est une **inférence** tirée des deux tables.

**Position 7 : rayon de bec rε (ou configuration du bec)**
| Code | MMC | KYO |
|---|---|---|
| 00 | bec vif (MMC : « 00 : Inch ») | bec vif (« Sharp Corner ») |
| V3 / 003 | V3 = 0,03 | 003 = 0,03 |
| V5 / 005 | V5 = 0,05 | 005 = 0,05 |
| 01 | 0,1 | 0,1 |
| 02 | 0,2 | 0,2 |
| 04 | 0,4 | 0,4 |
| 08 | 0,8 | 0,8 |
| 12 | 1,2 | 1,2 |
| 16 | 1,6 | 1,6 |
| 20 | 2,0 | 2,0 |
| 24 | 2,4 | 2,4 |
| 28 | 2,8 | 2,8 |
| 32 | 3,2 | 3,2 |
| M0 | plaquette ronde, métrique | « MO » plaquette ronde, métrique |
- Sources : [MMC swindow/tip_corner.html](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/swindow/tip_corner.html) et [KYO p. B1](https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf). Règle : code = rayon × 10, sur deux chiffres.
- Les rayons sont normalisés par pas de 0,4 mm jusqu'à 4,0 mm, puis de 0,8 mm au-delà. — [MMC-course](https://www.mmc-carbide.com/permanent/courses/85/insert-turning-identification-code.html) **(source unique)**
- KYO cite des désignations comme CCGT060201**M**ER-U, où le M qui suit le rayon indique une tolérance négative sur le rayon (« Minus tolerance for Corner-R »). C'est une option propre au fabricant. — [KYO p. B1](https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf)
- En pouces (ANSI), le code est le rayon en 1/64″ (EAS, KYO). Ne pas confondre avec le métrique.

**Décodage de CNMG 120408** (MMC et KYO prennent tous deux CNMG comme exemple, KYO le développe en CNMG 120408 PG) : C losange 80°, N dépouille 0°, M classe M, G trou cylindrique avec brise-copeaux deux faces, 12 = arête d'environ 12,9 mm (IC 12,70), 04 = épaisseur de 4,76 mm, 08 = rε de 0,8 mm.

### Inferences
- Pour un référentiel, les positions 1 à 4 se modélisent comme des listes fermées de lettres. Les positions 5 à 7 sont des codes dont la valeur physique dépend de la forme (position 5) ou d'une table de correspondance (positions 6 et 7).
- Le code de taille dépend de la forme : une table IC × forme est nécessaire (C09 et T16 correspondent tous deux à IC 9,525).

### Gaps
- Le texte d'ISO 1832:2017 n'a pas été consulté (payant, iso.org en 403). Aucune valeur n'est vérifiée contre la norme elle-même.
- Sandvik Coromant, Iscar, Seco, Walter, Kennametal, Tungaloy et Ceratizit n'ont pas fourni de page de décodage exploitable. Les recherches n'ont donné que des fiches produit. Les deux sources fabricants principales sont japonaises (Mitsubishi et Kyocera) : elles sont indépendantes, mais de la même culture de catalogue.
- La correspondance diamètre / code des plaquettes rondes R est mal extraite : à vérifier.

## Où les sources divergent-elles ?

### Takeaway
Pas de désaccord sur les angles de dépouille A à G, N et P. Les divergences portent sur des codes rares : O et les codes à deux angles en position 2, S1, T0 et T1 en épaisseur, V3/V5 contre 003/005 pour les micro-rayons, et le nom de la forme W.

### Cited Findings
- Dépouille : D 15°, E 20° et P 11° sont identiques chez MMC, KYO et EAS. Le prompt ne contenait donc pas d'erreur. — [MMC](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/nigekaku.html) ; [KYO](https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf) ; [EAS](https://easthope.ca/CuttingToolInserts.html)
- O (« autre dépouille ») n'apparaît que chez MMC. Ni KYO ni EAS ne le listent. — [MMC](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/nigekaku.html)
- Selon le résultat de recherche (PDF non ouvert), le catalogue YG-1 *[YU-IT26] Indexable Insert Inch Turning* note O « special ». — https://yg1usa.com/downloads/[YU-IT26] INDEXABLE INSERT_Inch_Turning [2].pdf **(non vérifié)**
- Les codes à deux angles H, J, K, L, M, R et S en position 2 n'apparaissent que chez EAS. — [EAS](https://easthope.ca/CuttingToolInserts.html) **(source unique)**
- Épaisseur : MMC liste S1 = 1,39 et T0 = 1,79 sans T1, tandis que KYO liste T1 = 1,98 et 05 = 5,56 sans S1 ni T0. Les valeurs communes sont identiques. — [MMC](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/swindow/tip_atsusa.html) ; [KYO](https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf)
- Un forum amateur donne T3 « 4 mm ». C'est un arrondi : MMC et KYO disent 3,97 mm. — [hobby-machinist](https://www.hobby-machinist.com/threads/carbide-turning-inserts.4428/)
- Micro-rayons : MMC code V3 / V5, KYO code 003 / 005 pour 0,03 / 0,05 mm. — sources ci-dessus
- 00 : KYO l'appelle « Sharp Corner ». MMC écrit « 00 Sharp Nose » mais aussi « 00 : Inch », pour l'équivalent rond en pouces. — sources ci-dessus
- Forme W : MMC dit « Trigon », EAS « 80° trigon », KYO « Hexagon » dans l'extraction texte, mais l'angle de 80° est le même chez EAS et SUMI. — sources ci-dessus
- Forme F (losange 50°) : présente chez MMC et KYO, absente chez EAS. X (spécial) n'apparaît que chez MMC.
- Tolérance : un blog marchand évoque une classe « P » à ±0,025 mm qui contredit le schéma par lettres. Écartée. — [industrialmonitordirect](https://industrialmonitordirect.com/blogs/knowledgebase/decoding-kennametal-insert-codes-to-match-toolholders) (cité par le moteur de recherche, non ouvert)

### Inferences
- Les codes rares (S1, T0, T1, 05, V3/V5) sont sans doute des extensions ou des choix de présentation propres à chaque catalogue. Sans la norme, il vaut mieux ne mettre dans un référentiel que les codes communs aux deux sources et marquer les autres comme spécifiques à un fabricant.

### Gaps
- Pas d'accès à la norme pour trancher sur O, sur les codes à deux angles et sur S1, T0 et T1.

## Quelles positions sont normalisées, lesquelles sont propres au fabricant ?

### Takeaway
Les positions 1 à 7 sont obligatoires et normalisées. Les positions 8 (état d'arête) et 9 (sens de coupe) figurent dans le système ISO mais sont facultatives et souvent omises. Le brise-copeaux (position 10, et toute marque après le tiret) est propre au fabricant.

### Cited Findings
- MMC numérote dix positions : 1 forme, 2 dépouille, 3 tolérance, 4 fixation/brise-copeaux, 5 taille, 6 épaisseur, 7 bec, 8 état d'arête, 9 sens de coupe, 10 brise-copeaux. — [MMC tip_sensaku.html](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/tip_sensaku.html)
- Position 8 chez MMC : F arête vive, E arête arrondie (acérée), T arête chanfreinée, S chanfreinée et arrondie. « Mitsubishi Materials omit the honing symbol. » — [MMC tip_hasaki.html](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/swindow/tip_hasaki.html)
- K (double chanfrein) et P (double chanfrein arrondi) : ajoutés à l'état d'arête par ISO 1832:1991 selon le résumé ISO. Leur sens vient d'un document du BIS (Inde), vu seulement en extrait de recherche, le PDF étant introuvable (404). — [ISO 6482](https://www.iso.org/standard/6482.html) ; [BIS](https://services.bis.gov.in/tmp/DDPPGD16923079_30072024_1.pdf) **(sens de K et P non vérifié)**
- Position 9 chez MMC : R droite, L gauche, N neutre. — [MMC katte.html](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/katte.html)
- Position 10 chez MMC : brise-copeaux maison (LP, MP, RP, LM, MM, RM, FP, MA, SW, MW, HZ, etc.), donc propre au fabricant. — [MMC breaker.html](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/breaker.html)
- KYO regroupe tout ce qui suit le rayon sous « (8) Manufacturer's Option : Hand Symbol, Chipbreaker Symbol, etc. ». Exemples : CCGT060201M**E R-U** (tolérance négative du rayon, arête arrondie, à droite, brise-copeaux U) et CCGT060201M**F P-GF** (arête vive, polie, brise-copeaux GF). — [KYO p. B1](https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf)
- L'arrondi d'arête est en général omis du code, et les fabricants utilisent leurs propres géométries. Le sens de coupe est omis pour les plaquettes neutres. Le brise-copeaux est facultatif, car chaque fabricant a les siens. — [MMC-course](https://www.mmc-carbide.com/permanent/courses/85/insert-turning-identification-code.html)
- EAS indique pour les positions finales des conditions d'arête en pouces (A, B, C arrondis, J poli, T chanfrein « per manufacturer's standard land ») et un sens L ou R. C'est le système ANSI, pas l'ISO métrique. — [EAS](https://easthope.ca/CuttingToolInserts.html)

### Inferences
- Le brief demandait de confirmer que les positions 8 à 10 sont propres au fabricant. C'est **partiellement vrai**. Les lettres d'état d'arête (F, E, T, S, puis K, P) et de sens (R, L, N) sont définies par l'ISO mais facultatives. Leur emploi, leur ordre et le brise-copeaux varient selon le fabricant : Kyocera classe tout en « Manufacturer's Option », Mitsubishi omet l'état d'arête. Pour un référentiel, il est plus sûr de traiter les positions 1 à 7 comme normalisées et de stocker le suffixe (souvent après un tiret) comme une chaîne propre au fabricant.

### Gaps
- Le sens exact de K et P n'est pas vérifié sur une source ouverte. Le document BIS est introuvable (404).
- Le libellé exact d'ISO 1832:2017 (nombre de positions, tiret « manufacturer's symbol ») n'a pas pu être lu.
