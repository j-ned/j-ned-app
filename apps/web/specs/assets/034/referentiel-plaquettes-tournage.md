# Les fabricants recommandent des formes, rarement des codes

Les sources publiques lues ne fournissent **presque aucune désignation ISO 1832 partielle recommandée explicitement pour un couple groupe ISO 513 × opération**. Sandvik Coromant, la seule source fabricant lue en entier sur ce sujet, raisonne en **forme (lettre ISO et angle de pointe), en caractère négatif ou positif et en angle d'attaque**, et ses règles de forme sont classées par *type* d'opération (chariotage, copiage, dressage, intérieur), pas par *étape* (ébauche, semi-finition, finition). Sur les 30 cellules de la matrice demandée (6 groupes × 5 opérations), **deux seulement reçoivent un code explicite d'un fabricant** : la finition de l'aluminium (groupe N), en extérieur et en intérieur, avec les familles positives CCGT, DCGT, TPGT et VCGT données par Kyocera. Une troisième, l'ébauche et la finition en profilage des superalliages (groupe S), reçoit une forme explicite (plaquette ronde, code RCGX nommé sur la même page), mais via un manuel Sandvik lu sur un site miroir. Tout le reste des codes complets courants (CNMG, WNMG, DNMG, VBMT, TCMT, CNMA…) n'apparaît que sur des fiches de distributeurs, des blogs ou par déduction. En revanche, la **table de lecture du code ISO 1832 (positions 1 à 7) est solide** : Mitsubishi Materials et Kyocera concordent sur toutes les valeurs courantes, sans que le texte de la norme, payant, ait été consulté. Conséquence pour le guide : il peut afficher sans risque la table de lecture du code et des règles de forme par type d'opération, mais une matrice « matière → code de plaquette » remplie en entier serait, pour l'essentiel, une construction éditoriale qu'il faut présenter comme telle.

## Deux fabricants japonais s'accordent sur les sept positions du code

Le texte de l'ISO 1832:2017 (*Indexable inserts for cutting tools — Designation*, qui remplace l'édition de 2012) n'a pas été lu : il est payant et iso.org a renvoyé une erreur 403 ([EVS, fiche ISO 1832:2017](https://www.evs.ee/en/iso-1832-2017)). La table ci-dessous repose donc sur deux reproductions fabricant **indépendantes et concordantes** : les pages d'identification de **Mitsubishi Materials** ([MMC, Turning Insert Identification](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/tip_sensaku.html)) et la page B1 du catalogue **Kyocera** *Turning Indexable Inserts* ([Kyocera, p. B1](https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf)). Une page personnelle (Easthope, en pouces, proche de l'ANSI) et le catalogue Sumitomo servent de recoupement partiel ([Easthope](https://easthope.ca/CuttingToolInserts.html) ; [Sumitomo, catalogue 2025-2026, p. 50](https://online.flippingbook.com/view/410142785/50/)). Exemple pris par les deux fabricants : **CNMG 120408** = losange 80°, dépouille 0°, tolérance M, trou cylindrique avec brise-copeaux deux faces, arête de 12 mm (cercle inscrit 12,70 mm), épaisseur 4,76 mm, rayon de bec 0,8 mm.

**Position 1, forme** ([MMC keijou](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/keijou.html) ; [Kyocera p. B1](https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf)). L'angle indiqué est l'angle aigu pour les losanges et parallélogrammes.

| Lettre | Forme | Accord |
|---|---|---|
| C | Losange 80° | MMC, KYO, EAS, SUMI |
| D | Losange 55° | MMC, KYO, EAS, SUMI |
| E | Losange 75° | MMC, KYO, EAS, SUMI |
| F | Losange 50° | MMC, KYO (absent d'EAS) |
| M | Losange 86° | MMC, KYO, EAS |
| V | Losange 35° | MMC, KYO, EAS, SUMI |
| S | Carré (90°) | MMC, KYO, EAS, SUMI |
| T | Triangle (60°) | MMC, KYO, EAS, SUMI |
| W | Trigone ; 80° selon EAS et SUMI (KYO écrit « Hexagon » dans l'extraction texte) | angle non écrit par MMC ni KYO |
| H / O / P | Hexagone / octogone / pentagone | MMC, KYO, EAS |
| L | Rectangle | MMC, KYO, EAS |
| A / B / K | Parallélogramme 85° / 82° / 55° | MMC, KYO, EAS |
| R | Rond | MMC, KYO, EAS |
| X | Forme spéciale | MMC seul |

**Position 2, dépouille normale** ([MMC nigekaku](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/nigekaku.html) ; [Kyocera p. B1](https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf)) : **A 3°, B 5°, C 7°, D 15°, E 20°, F 25°, G 30°, N 0°, P 11°**, identiques chez MMC, Kyocera et Easthope. N (0°) désigne une plaquette négative, toute autre lettre une plaquette positive ; en tournage, P, C et N sont les plus courants ([MMC, cours « Insert turning identification code »](https://www.mmc-carbide.com/permanent/courses/85/insert-turning-identification-code.html)). Chez MMC, les angles ne figurent que dans des images dont le nom suit l'ordre des lettres. O (« autre dépouille ») n'existe que chez MMC, et les codes à deux angles (H, J, K, L, M, R, S) que chez Easthope : ils ne doivent pas entrer dans le référentiel.

**Position 3, classe de tolérance** (m = hauteur de bec, d = cercle inscrit, s = épaisseur, en mm ; [MMC seido](https://mitsubishicarbide.net/contents/mhg/ru/html/product/product_guide/information/turning/seido.html), mêmes valeurs chez Kyocera) :

| Classe | m | d | s |
|---|---|---|---|
| A | ±0,005 | ±0,025 | ±0,025 |
| F | ±0,005 | ±0,013 | ±0,025 |
| C | ±0,013 | ±0,025 | ±0,025 |
| H | ±0,013 | ±0,013 | ±0,025 |
| E | ±0,025 | ±0,025 | ±0,025 |
| G | ±0,025 | ±0,025 | ±0,13 |
| J | ±0,005 | ±0,05 à ±0,15 | ±0,025 |
| K | ±0,013 | ±0,05 à ±0,15 | ±0,025 |
| L | ±0,025 | ±0,05 à ±0,15 | ±0,025 |
| M | ±0,08 à ±0,18 | ±0,05 à ±0,15 | ±0,13 |
| N | ±0,08 à ±0,18 | ±0,05 à ±0,15 | ±0,025 |
| U | ±0,13 à ±0,38 | ±0,08 à ±0,25 | ±0,13 |

Pour les classes K à U, la périphérie reste **brute de frittage** ; seules les faces sont rectifiées. MMC regroupe A à J sous l'appellation « classe G » (périphérie rectifiée) et K à U sous « classe M », et précise qu'en tournage on utilise surtout G (parfois J) ou M ([MMC, cours](https://www.mmc-carbide.com/permanent/courses/85/insert-turning-identification-code.html)). En classe M, l'écart réel dépend du cercle inscrit et de la forme (par exemple m = ±0,08 pour un losange 80° de 9,525 mm, ±0,13 pour 12,70 mm).

**Position 4, fixation et brise-copeaux** ([MMC mizo](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/mizo.html) ; [Kyocera p. B1](https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf)) :

| Lettre | Trou | Brise-copeaux |
|---|---|---|
| N / R / F | sans trou | aucun / une face / deux faces |
| A / M / G | cylindrique | aucun / une face / deux faces |
| W / T | cylindrique + 1 fraisure 40 à 60° | aucun / une face |
| Q / U | cylindrique + 2 fraisures 40 à 60° | aucun / deux faces |
| B / H | cylindrique + 1 fraisure 70 à 90° | aucun / une face |
| C / J | cylindrique + 2 fraisures 70 à 90° | aucun / deux faces |
| X | conception spéciale | — |

Chez MMC, la colonne « forme du trou » de T, U, H et J est vide en HTML ; les fraisures viennent de Kyocera. Un brise-copeaux double face n'existe que sur plaquette négative ([MMC, cours](https://www.mmc-carbide.com/permanent/courses/85/insert-turning-identification-code.html)).

**Position 5, taille** : en métrique, c'est la longueur d'arête en mm sur deux chiffres, tronquée ; le même cercle inscrit donne donc un code différent selon la forme ([MMC, cours](https://www.mmc-carbide.com/permanent/courses/85/insert-turning-identification-code.html) ; [MMC naisetsu](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/naisetsu.html)). En pouces (ANSI), c'est le cercle inscrit en 1/8″.

| IC (mm) | C | D | S | T | V | W |
|---|---|---|---|---|---|---|
| 6,35 | 06 | 07 | 06 | 11 | 11 | 04 |
| 9,525 | 09 | 11 | 09 | 16 | 16 | 06 |
| 12,70 | 12 | 15 | 12 | 22 | 22 | 08 |
| 15,875 | 16 | 19 | 15 | 27 | 27 | 10 |
| 19,05 | 19 | 23 | 19 | 33 | 33 | 13 |
| 25,40 | 25 | 31 | 25 | 44 | 44 | 17 |

La ligne 7,94 mm et la colonne R (diamètre des plaquettes rondes) sont **mal extraites** du PDF Kyocera et doivent être vérifiées sur l'image avant publication.

**Position 6, épaisseur** ([MMC tip_atsusa](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/swindow/tip_atsusa.html) ; [Kyocera p. B1](https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf)) : **01 = 1,59 ; 02 = 2,38 ; T2 = 2,78 ; 03 = 3,18 ; T3 = 3,97 ; 04 = 4,76 ; 06 = 6,35 ; 07 = 7,94 ; 09 = 9,52 mm**, communs aux deux. S1 (1,39) et T0 (1,79) sont propres à MMC, T1 (1,98) et 05 (5,56) propres à Kyocera.

**Position 7, rayon de bec** ([MMC tip_corner](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/swindow/tip_corner.html) ; [Kyocera p. B1](https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf)) : code = rayon × 10 sur deux chiffres, **01 = 0,1 ; 02 = 0,2 ; 04 = 0,4 ; 08 = 0,8 ; 12 = 1,2 ; 16 = 1,6 ; 20 = 2,0 ; 24 = 2,4 ; 28 = 2,8 ; 32 = 3,2 mm**, 00 = bec vif, M0 = plaquette ronde métrique. Les micro-rayons divergent : MMC écrit V3 / V5, Kyocera 003 / 005 pour 0,03 / 0,05 mm. En pouces, le code est le rayon en 1/64″.

**Positions 8 à 10, facultatives ou propres au fabricant.** MMC numérote l'état d'arête (F vive, E arrondie, T chanfreinée, S chanfreinée et arrondie), le sens de coupe (R, L, N) puis le brise-copeaux maison, et précise que Mitsubishi omet l'état d'arête ([MMC tip_hasaki](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/swindow/tip_hasaki.html) ; [MMC katte](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/katte.html) ; [MMC breaker](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/breaker.html)). Kyocera range tout ce qui suit le rayon sous « Manufacturer's Option ». Le référentiel doit donc traiter les positions 1 à 7 comme normalisées et stocker le reste comme une chaîne propre au fabricant. Piège à signaler : le guide Silent Tools de Sandvik emploie « **E = Ground insert for closer tolerances and sharp edge** » ([Sandvik, Silent Tools turning application guide](https://www.sandvik.coromant.com/en-us/tools/silent-tools/what-is-silent-tools/application-guide-silent-tools/turning-appl-guide)), alors que chez MMC, E en position 8 signifie arête *arrondie*. La lettre E a donc deux sens selon l'éditeur.

## Sandvik classe les formes par type d'opération, pas par étape

Les règles de forme explicites viennent presque toutes de trois pages Knowledge de **Sandvik Coromant**. Elles valent pour toutes les matières : Sandvik ne les rattache à aucun groupe ISO 513. Deux règles cadrent tout le reste : la plaquette **négative est le « First choice for external turning »** et convient aux conditions lourdes, tandis que la plaquette **positive est le « First choice for internal turning and for external turning of slender components »** ([Sandvik, How to choose correct turning insert](https://www.sandvik.coromant.com/en-gb/knowledge/general-turning/how-to-choose-correct-turning-insert)). S'y ajoutent le plus grand angle de pointe possible pour la résistance et un rayon de bec égal ou inférieur à la profondeur de passe. Ces deux règles de base sont confirmées par des sources secondaires indépendantes : McMaster-Carr (« Negative-rake inserts are the first choice for most turning applications ») et Hoffmann Group, vus seulement en extrait de recherche ([McMaster-Carr](https://www.mcmaster.com/trigon-inserts) ; [Hoffmann Group](https://www.hoffmann-group.com/IE/en/brownlo/online-ratgeber/zerspanung/laengs-und-plandrehen/e/1448799/)), ainsi que le manuel de Schneider pour l'angle de pointe ([American Machinist, ch. 4](https://www.americanmachinist.com/cutting-tools/chapter-4-turning-tools-and-operations)).

| Type d'opération | Forme explicitement nommée par Sandvik | Source |
|---|---|---|
| Chariotage extérieur avec épaulement | **C (80°) en premier choix** ; D permet copiage et dégagements | [External turning](https://www.sandvik.coromant.com/en-gb/knowledge/general-turning/external-turning) |
| Chariotage extérieur sans épaulement | **S (carrée)**, angle d'attaque 75°, pour la productivité | idem |
| Copiage extérieur | **D (55°) à 93° en premier choix** ; **V (35°)** pour une rampe plus forte | idem |
| Dressage | **S à 75°** pour la productivité ; **losange 80° ou trigone à 95°** pour la polyvalence | idem |
| Chariotage intérieur | **forme de base positive** ; petit angle de pointe et petit rayon | [Internal turning](https://www.sandvik.coromant.com/en-us/knowledge/general-turning/internal-turning) |
| Intérieur avec épaulement (91 à 95°) | **T ou D (55°)** ; **C (80°)** pour un bec plus fort | idem |
| Intérieur sans épaulement, conditions stables | **S à 75°** | idem |
| Copiage intérieur | **D à 93° en premier choix**, **V** pour une rampe plus forte ; 107 à 117° en dressage | idem |
| Intérieur, angle d'attaque | « close to 90° … and never less than 75° » | idem |

Sandvik ne distingue l'ébauche de la finition que par la **géométrie de l'arête** (« Roughing : High depth of cut and feed rate combinations », « Finishing : Operations at light depths of cut and low feed rates ») et par la **taille** : au-dessus de 25 mm de cercle inscrit en usinage lourd, plus petite en finition ([Sandvik, How to choose](https://www.sandvik.coromant.com/en-gb/knowledge/general-turning/how-to-choose-correct-turning-insert)). La page intérieure ne sépare pas l'ébauche de la finition. **Aucune valeur numérique de rayon par étape** n'est publiée : seulement « le plus grand rayon possible pour la résistance », « plus petit en cas de vibration », RE ≤ ap, et en alésage un rayon inférieur à la profondeur de passe ([Sandvik, How to achieve good component quality](https://www.sandvik.coromant.com/en-gb/knowledge/general-turning/how-to-achieve-good-component-quality-in-turning)). Le guide Silent Tools ajoute pour l'intérieur « always choose the smallest possible nose radius » et « the most positive geometry you can » ([Sandvik, Silent Tools](https://www.sandvik.coromant.com/en-us/tools/silent-tools/what-is-silent-tools/application-guide-silent-tools/turning-appl-guide)). La règle wiper (« Two times the feed-rate, same surface finish ») vaut pour le chariotage rectiligne et le dressage, pas pour le copiage.

L'accord entre sources porte sur la logique, pas sur le rôle de chaque forme. Le **triangle T** est « the most popular » pour Schneider (2010), alors que Sandvik ne le cite qu'en intérieur avec épaulement ([American Machinist, ch. 4](https://www.americanmachinist.com/cutting-tools/chapter-4-turning-tools-and-operations)). Le **trigone W** est rangé en ébauche par Cutwel mais en « balanced cutting and finishing » par AIMS Industrial, deux extraits non vérifiés en page complète ([Cutwel](https://www.cutwel.co.uk/blog/how-to-select-the-best-turning-insert-grade-for-your-job) ; [AIMS Industrial](https://www.aimsindustrial.com.au/machining/indexable-inserts/turning-inserts)). Pour les **valeurs de rayon courantes** (0,2 à 0,4 mm en finition, 0,8 à 1,2 mm en ébauche, 1,6 mm en ébauche dure ou interrompue), le consensus vient uniquement de distributeurs et de blogs ([Cutwel](https://www.cutwel.co.uk/blog/how-to-select-the-best-turning-insert-grade-for-your-job) ; [Machally](https://machally.com/us/blog/insert-nose-radius-selection/) ; [Industrial Monitor Direct](https://industrialmonitordirect.com/blogs/knowledgebase/selecting-carbide-inserts-and-holders-for-lathe-work)).

## La matrice groupe × opération reste presque vide

La matrice ne retient que ce qu'une source écrit **pour le groupe concerné**. Une règle transverse de la section précédente n'est pas recopiée dans les cases d'un groupe, car ce serait une déduction. La dernière colonne recueille les consignes explicites d'un groupe qui ne précisent aucune étape. Les noms commerciaux sont retirés des cases et listés à part. « — » signifie qu'aucune source explicite n'a été trouvée.

**Codes en désignation ISO partielle explicitement recommandés**

| Groupe | Ext. ébauche | Ext. semi-finition | Ext. finition | Int. ébauche | Int. finition |
|---|---|---|---|---|---|
| P | — | — | — | — | — |
| M | — | — | — | — | — |
| K | — | — | — | — | — |
| N | — | — | **CCGT, DCGT, TPGT, VCGT** (Kyocera) | — | **CCGT, DCGT, TPGT, VCGT** (Kyocera) |
| S | **RC (ronde)** en profilage ; RCGX nommé (Sandvik, miroir) | — | **RC (ronde)** en profilage ; RCGX nommé (Sandvik, miroir) | — | — |
| H | — | — | — | — | — |

**Formes, caractère positif ou négatif, angle d'attaque et rayon explicitement rattachés au groupe**

| Groupe | Par étape (explicite) | Sans étape précisée (explicite) |
|---|---|---|
| P | — | Plaquette **wiper « highly recommended »** sur acier non allié ; **arêtes vives et géométries légères** contre le collage ([Sandvik, materials](https://www.sandvik.coromant.com/en-gb/knowledge/general-turning/how-to-do-turning-in-different-materials)) |
| M | — | Austénitique : **plaquettes rondes ou faible angle d'attaque** contre l'usure en entaille, **plus grand rayon possible**, **arêtes vives et/ou face de coupe positive** ; duplex : faible angle d'attaque ([Sandvik, materials](https://www.sandvik.coromant.com/en-us/knowledge/general-turning/how-to-do-turning-in-different-materials)) |
| K | — | — (seulement des matériaux de coupe, voir plus bas) |
| N | Finition ext. et int. : **positive** ([Kyocera](https://tool-global.kyocera.com/en/prdct/tool/product/ap.php)) | **Forme de base positive et arêtes vives, « always »** ([Sandvik, materials](https://www.sandvik.coromant.com/en-us/knowledge/general-turning/how-to-do-turning-in-different-materials)) |
| S | Profilage d'ébauche : **rayon programmé = diamètre de la plaquette ronde** ; profilage de finition : **diamètre ≤ 1,75 × rayon programmé** ([Sandvik HRSA, p. 22, miroir](https://www.manualsdir.com/manuals/407504/sandvik-coromant-heat-resistant-super-alloys.html)) | **Angle d'attaque < 45°** ; **ronde = plaquette la plus forte**, ap ≈ 0,15 × iC (max 0,25 × iC), **carrée à 45°** au-delà ([Sandvik, materials](https://www.sandvik.coromant.com/en-us/knowledge/general-turning/how-to-do-turning-in-different-materials) ; [Sandvik HRSA, p. 20, miroir](https://www.manualsdir.com/manuals/407504/sandvik-coromant-heat-resistant-super-alloys.html)) ; arêtes vives ; ap > 0,25 mm en rampe ou en passes multiples |
| H | Finition ext. : **CBN** au-dessus de 45 HRC, **wiper** pour le meilleur état de surface, profondeur de passe la plus faible possible ([Sandvik, materials](https://www.sandvik.coromant.com/en-gb/knowledge/general-turning/how-to-do-turning-in-different-materials)) | CBN **brasé sur support carbure**, y compris sur plaquettes **négatives** ([Sandvik, cutting tool materials](https://www.sandvik.coromant.com/en-us/knowledge/materials/cutting-tool-materials)) |

Lecture groupe par groupe :

- **Acier (P).** Sandvik ne nomme aucune forme. Les seules consignes propres au groupe sont la plaquette wiper et les arêtes vives sur acier non allié, le cermet pour la finition des « low carbon steels » et des cas de collage, et des nuances plus dures au-dessus de 450 HB ([Sandvik, cutting tool materials](https://www.sandvik.coromant.com/en-us/knowledge/materials/cutting-tool-materials)). Le cermet est un matériau de coupe, pas une désignation.
- **Fonte (K).** Les sources parlent de matériau, pas de forme : « ceramic and CBN grades for grey cast iron at higher cutting speed », nitrure de silicium « successful in grey cast iron », CBN pour l'« high speed roughing of grey cast irons » ([Sandvik, materials](https://www.sandvik.coromant.com/en-gb/knowledge/general-turning/how-to-do-turning-in-different-materials) ; [Sandvik, cutting tool materials](https://www.sandvik.coromant.com/en-us/knowledge/materials/cutting-tool-materials)). **Aucune source primaire ne recommande la plaquette sans brise-copeaux « A » (CNMA, SNMA)** : on ne la voit que sur des fiches produit.
- **Aciers trempés (H).** C'est le groupe où l'accord entre fabricants est le plus fort. Sandvik, Tungaloy, Walter et Seco convergent sur le CBN et le wiper en finition. Tungaloy chiffre la préparation d'arête standard : **chanfrein négatif de 0,13 mm à 25° plus un rodage**, avec la règle « plus l'angle du chanfrein est petit, plus l'arête résiste à l'usure en coupe continue ; plus il est grand, plus elle résiste à la rupture en coupe interrompue » ([Tungaloy, CBN Technical information, p. 12-14](https://tungaloy.com/wpdata/wp-content/uploads/Tungaloy_CBN_Technical_information.pdf)). Le code d'état d'arête utilisé par Tungaloy est maison. Aucune source primaire ne nomme de forme (CNGA, DNGA…).
- **Inox et superalliages (M et S).** Ce sont les seuls groupes où une forme est rattachée à la matière : la ronde, contre l'usure en entaille. Le manuel HRSA lu via un miroir non officiel (code documentaire C-2920-034 non confirmé) classe les plaquettes **rondes du côté « least notch » et les C/DNMG à 95° du côté « most notch »** ([Sandvik HRSA, p. 13, miroir](https://www.manualsdir.com/manuals/407504/sandvik-coromant-heat-resistant-super-alloys.html)). Il donne aussi, pour l'étape intermédiaire (ISM), une plaquette carré-losange codée CNMX 1204A1 et A2. « A1 » n'est pas un rayon ISO et X signifie conception spéciale : ce code ne peut pas entrer dans le référentiel. L'article MSC attribué à Sandvik recommande lui aussi des rondes, mais parle de « large entering angle » au sens ANSI de l'angle de direction, ce qui inverse le vocabulaire de Sandvik sans changer le conseil ([MSC / Sandvik](https://www.mscdirect.com/knowledge-center/articles/selecting-right-turning-insert-hrsa-materials)). Iscar confirme seulement des géométries à coupe positive pour le titane et les inox, sans code ISO ni rayon ([Iscar, 2026](https://www.iscar.com/en-hq/technical-articles/year-2026/right_iscar_insert_geometry_for_difficult_to_cut_materials)).
- **Non-ferreux (N).** C'est le seul groupe avec des codes primaires. Kyocera présente ses CCGT, DCGT, TPGT et VCGT comme « Positive type for aluminum finishing », en extérieur et en intérieur ([Kyocera, page produit](https://tool-global.kyocera.com/en/prdct/tool/product/ap.php)). Il s'agit d'une page produit, pas d'un guide de choix. Sandvik ajoute le **PCD obligatoire au-delà de 13 % de silicium**. Pour le cuivre, le laiton et le bronze, **aucun fabricant de premier rang** n'a été trouvé ; seul McMaster-Carr, revendeur, liste des TPHH, CDHH et TPG ([McMaster-Carr](https://www.mcmaster.com/products/lathe-tool-inserts/insert-designation~tphh)).

**Noms commerciaux rencontrés, à ne jamais afficher comme recommandation** : nuances GC1105, GC2015, S05F, H13A, H10, CC6060, CC6065, CC6160, CC670, CB7015, 3205, 3210, PDL010, PDL025, KYK10, KYK25, KS6015, KS6050, KA30, BXA10, BXA20, BXM10, WBH30, CH0550, IC806, IC907, IC908, MP3025, K10, YG10 ; brise-copeaux et géométries -AL, -KM, -KR, -WMX, -WL, -WF, -WR, -SM, -SGF, -RO, AP, AH, A3, FL, -HP, -LF, -L, -LC, -H, MW, FH, LP, LM, MA, GM ; systèmes et technologies CoroTurn 107/111, T-Max P, CoroCut, Xcel, Safe-Lok, Silent Tools, Kenloc, Kendex, Top Notch, MD220, LOGIQ…TURN, HELI TURN.

## Conclusion

L'enquête renverse la prémisse d'un guide « matière → code » : les fabricants publient une logique de choix **géométrique** (négative ou positive, angle de pointe, angle d'attaque, rayon ≤ ap) indépendante de la matière, puis une logique **matière** qui porte surtout sur le matériau de coupe et l'état d'arête. Trois exceptions seulement : la ronde pour l'inox austénitique et les superalliages, le positif à arête vive pour l'aluminium, le CBN brasé avec wiper pour l'acier trempé. Le guide le plus honnête croise donc deux axes publiés séparément : une fiche « opération → forme » (Sandvik) et une fiche « matière → contraintes » (Sandvik, Tungaloy, Kyocera). Il signale clairement que la combinaison des deux en un code complet (par exemple CNMG pour l'ébauche d'acier) est une **lecture d'usage**, que les distributeurs écrivent mais que les fabricants ne publient pas.

Deux chantiers ouvriraient les cellules vides. D'abord la lecture des catalogues PDF complets (Sandvik Turning Handbook, Mitsubishi « Optimum grades and chip breakers », Iscar, Walter), aujourd'hui inaccessibles (403, lien signé expiré). Ensuite une vérification en navigateur des pages Sandvik rendues en JavaScript : inox (« cut under the work-hardened layer »), plaquettes rondes, original du manuel HRSA. Tant que ce travail n'est pas fait, aucune cellule d'ébauche ou d'intérieur hors aluminium ne repose sur une source.

## Ce que le guide peut afficher sans relecture de Julien

**(a) Affirmations explicites d'une source primaire fabricant, utilisables telles quelles** (sans nom commercial) :

| Affirmation | Source |
|---|---|
| Table de lecture ISO 1832, positions 1 à 7, pour les valeurs communes à MMC et Kyocera (formes C D E F M V S T H O P L A B K R ; dépouilles A B C D E F G N P ; classes de tolérance A à U ; lettres de fixation N R F A M G W T Q U B H C J X ; épaisseurs 01 02 T2 03 T3 04 06 07 09 ; rayons 00 à 32 et M0 ; tailles de la table IC × forme, hors ligne 7,94 et colonne R) | [MMC](https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/tip_sensaku.html), [Kyocera p. B1](https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf) |
| N = négative, autre lettre de dépouille = positive ; double face seulement en négative ; classes A-J rectifiées en périphérie, K-U brutes de frittage ; positions 8 et suivantes facultatives ou propres au fabricant | [MMC, cours](https://www.mmc-carbide.com/permanent/courses/85/insert-turning-identification-code.html) |
| Négative = premier choix en extérieur et en conditions lourdes ; positive = premier choix en intérieur et sur pièces élancées ; plus grand angle de pointe possible ; rayon ≤ profondeur de passe, plus petit en cas de vibration | [Sandvik, How to choose](https://www.sandvik.coromant.com/en-gb/knowledge/general-turning/how-to-choose-correct-turning-insert) |
| Formes par type d'opération : C en chariotage avec épaulement, S à 75° sans épaulement, D puis V en copiage, S à 75° ou C/trigone à 95° en dressage | [Sandvik, External turning](https://www.sandvik.coromant.com/en-gb/knowledge/general-turning/external-turning) |
| Intérieur : positive, T ou D avec épaulement, C pour un bec plus fort, S à 75° en conditions stables, angle d'attaque jamais sous 75°, petit angle de pointe et petit rayon | [Sandvik, Internal turning](https://www.sandvik.coromant.com/en-us/knowledge/general-turning/internal-turning) |
| N : positive à arêtes vives toujours, PCD au-delà de 13 % de Si | [Sandvik, materials](https://www.sandvik.coromant.com/en-us/knowledge/general-turning/how-to-do-turning-in-different-materials) |
| N : CCGT, DCGT, TPGT, VCGT en finition, extérieur et intérieur (formulation : « proposées par Kyocera pour la finition de l'aluminium ») | [Kyocera](https://tool-global.kyocera.com/en/prdct/tool/product/ap.php) |
| M austénitique : ronde ou faible angle d'attaque contre l'entaille, plus grand rayon possible, arête vive ou face de coupe positive ; duplex : faible angle d'attaque | [Sandvik, materials](https://www.sandvik.coromant.com/en-us/knowledge/general-turning/how-to-do-turning-in-different-materials) |
| S : angle d'attaque < 45°, arêtes vives, ap > 0,25 mm en rampe ou en passes multiples | idem |
| H : CBN en finition au-dessus de 45 HRC, seul substitut à la rectification au-dessus de 55 HRC, céramique ou carbure en dessous ; wiper pour le meilleur état de surface ; CBN brasé, y compris sur négatives | idem ; [Sandvik, cutting tool materials](https://www.sandvik.coromant.com/en-us/knowledge/materials/cutting-tool-materials) |
| H : chanfrein négatif plus rodage ; petit angle de chanfrein pour la coupe continue, grand angle pour la coupe interrompue (valeurs chiffrées attribuées à Tungaloy) | [Tungaloy, p. 12-14](https://tungaloy.com/wpdata/wp-content/uploads/Tungaloy_CBN_Technical_information.pdf) |

**Primaires mais à relire avant affichage**, car lues via un miroir ou un outil de synthèse :

- les règles HRSA du manuel Sandvik lu sur manualsdir (ronde la plus forte, ap 0,15 à 0,25 × iC, carrée à 45° au-delà, règles de profilage, RCGX) ;
- les phrases Sandvik sur la couche écrouie des inox, jamais retrouvées en page ;
- la table des tailles des plaquettes rondes ;
- le double sens de la lettre E (Sandvik Silent Tools contre MMC).

**(b) Codes présents seulement sur des fiches de distributeurs ou des blogs**, à ne pas présenter comme recommandation fabricant :

- CNMG, DNMG et WNMG comme plaquettes d'ébauche (Cutwel) ;
- WNMG en finition (AIMS) ;
- VBMT en copiage et TNMG comme choix économique (Industrial Monitor Direct) ;
- CNMA, CNGA et CNMG à brise-copeaux fonte pour le groupe K (Mars Supply, Butler Bros, Cromwell) ;
- CCGX et TCGX pour l'aluminium (Source Atlantic, Cromwell) ;
- VCGW en PCD (page Mitsubishi en 403, vue en extrait de recherche) ;
- TCMT 06T102 et DPMT sur barres d'alésage (eezee, Steiner) ;
- TPHH, CDHH et TPG pour le cuivre et le laiton (McMaster-Carr) ;
- CCMT09T304 pour le titane (agrégateur) ;
- les rayons 0,2 à 0,4 mm en finition, 0,8 à 1,2 mm en ébauche et 1,6 mm en ébauche dure (Cutwel, Machally, IMD) ;
- les rayons 0,2-0,4 et 0,8-1,2 mm du guide Sandvik de tournage dur, lu seulement via une copie secondaire ;
- la gradation de chanfreins d'Iscar (page en 404).

**(c) Déductions, à étiqueter « déduit » si affichées** :

- la famille CNMG/CNMA en ébauche extérieure de P ou K (négative + C en premier choix) ;
- CCMT, DCMT, TCMT et VBMT en intérieur (positive + forme T/D/C/V) ;
- des positives C/D/V à 7° ou des CNGG en finition M et S ;
- CNGA, DNGA, TNGA et VNGA à pointe CBN brasée pour le groupe H ;
- des céramiques G-A chanfreinées pour la fonte ;
- la hiérarchie ronde > carrée 45° > losange à 95° pour l'ébauche des superalliages ;
- l'assimilation de l'étape ISM de Sandvik à la semi-finition ;
- le lien « tolérance G ⇒ arête vive » ;
- l'identification du « trigon » de Sandvik à la lettre W ;
- le rayon maximal calculé depuis la profondeur de passe ;
- la lecture des épaisseurs T comme fractions de pouce ;
- toute case de semi-finition ou d'ébauche intérieure, aujourd'hui vide pour les six groupes.
