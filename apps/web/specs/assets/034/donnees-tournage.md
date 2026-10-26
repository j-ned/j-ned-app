# Données du tournage extérieur et intérieur (spec 034, tranches 10 et 11)

Saisie du 2026-10-26, codes par situation le même jour (décisions 14 à 16), conseils par sous-groupe
après la revue (décisions 16 corrigée et 17). Source unique de vérité :
`src/app/features/workshop/domain/` (`sources.static-data.ts`, `iso-groups.static-data.ts`,
`materials.static-data.ts`, `recommendations.static-data.ts`). Ce tableau les résume pour la revue ;
en cas d'écart, le code fait foi.

## Sources

| Id | Titre | Éditeur | URL |
|---|---|---|---|
| `sandvik-choose-insert` (S1) | Comment choisir une plaquette de tournage correcte | Sandvik Coromant | `/fr-fr/knowledge/general-turning/how-to-choose-correct-turning-insert` |
| `sandvik-external-turning` (S2) | Tournage extérieur | Sandvik Coromant | `/fr-fr/knowledge/general-turning/external-turning` |
| `sandvik-internal-turning` (S3) | Tournage intérieur | Sandvik Coromant | `/fr-fr/knowledge/general-turning/internal-turning` |
| `sandvik-turning-materials` (S4) | Tournage de différentes matières | Sandvik Coromant | `/fr-fr/knowledge/general-turning/how-to-do-turning-in-different-materials` |
| `sandvik-workpiece-materials` (S5) | Matériaux de pièce | Sandvik Coromant | `/fr-fr/knowledge/materials/workpiece-materials` |
| `mitsubishi-insert-identification` (MMC) | Turning Insert Identification | Mitsubishi Materials | `mitsubishicarbide.net/…/turning/tip_sensaku.html` |
| `kyocera-turning-inserts` (KYO) | Turning Indexable Inserts (catalogue, p. B1) | Kyocera | `asia.kyocera.com/…/B-Turning-Indexable.pdf` |
| `kyocera-aluminium-finishing` (KYO-AP) | Plaquettes positives pour la finition de l'aluminium | Kyocera | `tool-global.kyocera.com/en/prdct/tool/product/ap.php` |
| `julien-working-list` (LT) | Liste de travail de Julien — correspondances indicatives | Julien Nédellec | aucune (document sans adresse publique, titre affiché sans lien, décision 15) |

Toutes consultées le 2026-10-26. Les pages Sandvik ont été relues en `fr-fr` le jour de la saisie,
puis de nouveau après la revue (S1 à S5) : titres, intitulés de section, mots de forme, sous-groupes.
Le titre de KYO-AP décrit la page (sous-titre « Positive type for aluminum finishing ») sans le nom
du brise-copeaux qu'elle présente.

## Groupes ISO 513 (S5, section « Groupes de matières usinées », écrit)

P Acier · M Acier inoxydable · K Fonte · N Métaux non ferreux · S Super-alliages et titane ·
H Matériau dur.

## Matières → groupe → sous-groupe

Désignations : toutes écrites sur la liste de travail (LT, base écrite), affichées comme
correspondances indicatives. Groupe : S5, la section qui classe la famille de la matière (base
écrite, sauf mention). Sous-groupe : celui dont S4 traite le tournage dans une section propre, ou
« aucune section ».

| Matière (slug) | Désignations | Groupe, citation S5 | Sous-groupe (section S4) |
|---|---|---|---|
| `11smn30` | 11SMn30, 1.0715, 1215, S250 | P, « Aciers non alliés – P 1.1-1.5 » | aciers de décolletage (P1.4 chez S5) : **aucune section** |
| `11smnpb30` | 11SMnPb30, 1.0718, 12L14, S250Pb | P, « Aciers non alliés – P 1.1-1.5 » | aciers de décolletage : **aucune section** |
| `s235jr` | S235JR, 1.0038, A36, E24 | P, « Aciers non alliés – P 1.1-1.5 » | aciers non alliés (« Tournage des aciers non alliés ») |
| `s355j2` | S355J2, 1.0577, A572 Gr.50, E36 | P, « Aciers non alliés – P 1.1-1.5 » | aciers non alliés |
| `c45` | C45, 1.0503, 1045, XC48, XC45 | P, « Aciers non alliés – P 1.1-1.5 » | aciers non alliés |
| `42crmo4` | 42CrMo4, 1.7225, 4140, 42CD4 | P, « Aciers faiblement alliés – P 2.1-2.6 » | aciers faiblement alliés (« Tournage des aciers faiblement alliés ») |
| `16mncr5` | 16MnCr5, 1.7131, 5115, 16MC5 | P, « Aciers faiblement alliés – P 2.1-2.6 » | aciers faiblement alliés |
| `20nicrmo2-2` | 20NiCrMo2-2, 1.6523, 8620, 20NCD2 | P, « Aciers faiblement alliés – P 2.1-2.6 » | aciers faiblement alliés |
| `100cr6` | 100Cr6, 1.3505, 52100, 100C6 | P, « Aciers faiblement alliés – P 2.1-2.6 » | aciers faiblement alliés |
| `x20cr13-x30cr13` | X20Cr13, X30Cr13, 1.4021, 1.4028, 420, Z20C13, Z30C13 | **P**, « Aciers inoxydables ferritiques et martensitiques – P5.0-5.1 » | **inox ferritiques et martensitiques (P5)** |
| `x8crnis18-9` | X8CrNiS18-9, 1.4305, 303, Z8CNF18-09 | M, « Acier inoxydable austénitique et super-austénitique – M1.0-2.0 » | inox austénitiques |
| `x5crni18-10` | X5CrNi18-10, 1.4301, 304, Z7CN18-09 | M, idem | inox austénitiques |
| `x2crni18-9` | X2CrNi18-9, 1.4307, 304L, Z3CN18-10 | M, idem | inox austénitiques |
| `x2crnimo17-12-2` | X2CrNiMo17-12-2, 1.4404, 316L, Z3CND17-11-02 | M, idem | inox austénitiques |
| `x2crnimon22-5-3` | X2CrNiMoN22-5-3, 1.4462, 2205, Z3CND22-05Az | M, « Acier inoxydable duplex – M 3.41-3.42 » | **inox duplex** |
| `x5crnicunb16-4` | X5CrNiCuNb16-4, 1.4542, 17-4 PH, 630, Z6CNU17-04 | M, liste de travail, page 2, ISO M, ligne « Précipitation (PH) » (écrit, indicatif) | inox durcis par précipitation : **aucune section** |
| `en-gjl-250` | EN-GJL-250, GG25, FGL 250, Ft 25 | K, « Fontes malléables (MCI) K 1.1-1.2 et fontes grises K 2.1-2.3 » | fontes |
| `en-gjs-400-15` | EN-GJS-400-15, FGS 400, GGG40 | K, « Fonte nodulaire (NCI) K 3.1-3.5 » | fontes |
| `en-gjs-500-7` | EN-GJS-500-7, FGS 500, GGG50 | K, « Fonte nodulaire (NCI) K 3.1-3.5 » | fontes |
| `en-aw-2017a` | EN AW-2017A, AU4G | N, « Groupes de matières usinées », ISO N (l'aluminium) | aluminium |
| `en-aw-2024` | EN AW-2024, AU4G1 | N, idem | aluminium |
| `en-aw-2011-2030` | EN AW-2011, EN AW-2030, AU5PbBi | N, idem | aluminium |
| `titane-grade-2` | Titane Grade 2, R50400, 3.7035 | S, « Titane– S 4.1-4.4 » | superalliages et titane |
| `ta6v` | TA6V, Ti-6Al-4V, Gr.5, R56400, 3.7165 | S, « Titane– S 4.1-4.4 » | superalliages et titane |
| `inconel-718` | Inconel 718, N07718, 2.4668 | S, « Matières en superalliages réfractaires – S 1.0-3.0 » | superalliages et titane |
| `inconel-625` | Inconel 625, N06625 | S, idem | superalliages et titane |
| `hastelloy-c276` | Hastelloy C276, N10276 | S, idem | superalliages et titane |
| `haynes-25` | Haynes 25, R30605 | S, idem (base cobalt) | superalliages et titane |
| `stellite-6` | Stellite 6, R30006 | **H**, « Codification MC pour les aciers trempés », stellites | stellites : **aucune section** |
| `100cr6-trempe` | 100Cr6 trempé | H, « Groupes de matières usinées », ISO H | aciers trempés |
| `16mncr5-trempe` | 16MnCr5 trempé | H, idem | aciers trempés |
| `x153crmov12` | X153CrMoV12, 1.2379, D2, Z160CDV12 | H, idem | aciers trempés |

Exclues (passages coupés en bas de page de la liste) : la troisième ligne aluminium (EN AW-5083 /
5754, illisible) et tout ce qui la suit dans le groupe N, l'encadré « Règles d'or » du groupe P, le
tableau des vitesses (de toute façon jamais affiché, décision 13).

## Classement : Sandvik l'emporte (décision 16)

Quand la liste de travail et Sandvik divergent, le classement de S5 (« Matériaux de pièce ») fait foi :
**Stellite 6 en H** (la liste la mettait en S) et **X20Cr13 / X30Cr13 en P** (la liste les mettait en M ;
S5, section « Aciers inoxydables ferritiques et martensitiques – P5.0-5.1 » : du point de vue de
l'usinabilité, ces aciers sont classés en ISO P). Un test d'intégrité garde ces deux classements, et un
second garde que chaque sous-groupe appartient au groupe de sa matière.

**17-4 PH** : S5 range les inox durcis par précipitation selon leur structure, ferritiques ou
martensitiques en P5 (`P5.0.Z.PH`), austénitiques en M (`M1.0.Z.PH`, exemple 17/7), sans nommer le
17-4 PH. Aucune page lue ne dit sa structure, et le chrome ne départage pas M de P (les inox ferritiques
et martensitiques, à 12 % de chrome ou plus, sont en P chez S5). Il reste en M parce que la liste de
travail l'y écrit (page 2, ISO M, ligne « Précipitation (PH) », base écrite, correspondance
indicative), sans recommandation. Un test épingle cette seule exception à la règle « le groupe d'une
fiche est cité par la page qui nomme le groupe ».

**Aciers** : un sous-groupe par section de S4. Non alliés (S235JR, S355J2, C45) : « Tournage des
aciers non alliés », carbone inférieur ou égal à 0,55 %. Faiblement alliés (42CrMo4, 16MnCr5,
20NiCrMo2-2, 100Cr6) : « Tournage des aciers faiblement alliés », P2.x ; S5 : moins de 5 % d'éléments
d'alliage. Aciers de décolletage (11SMn30, 11SMnPb30) : P1.4 chez S5, aucune section S4, donc aucune
recommandation ; S5 écrit que le soufre et le plomb y améliorent la fragmentation des copeaux, ce que
le piège des non alliés contredirait. Aucune matière de la liste ne relève des fortement alliés.

## Situations

Libellés repris des pages Sandvik `fr-fr` ; la citation reprend **le mot de la page**, jamais la lettre
ISO quand la page ne l'écrit pas. La lettre vient de la table de lecture (MMC), citée sur le champ.

| Famille | Situation | Mot de la page | Lettre | Page, section |
|---|---|---|---|---|
| Extérieur | Chariotage avec épaulement | « type C (80°) » en priorité, 91–95° pour un épaulement | C | S2, « Chariotage » |
| Extérieur | Chariotage sans épaulement | « carrée » avec un angle d'attaque de 75° | S | S2, « Chariotage » |
| Extérieur | Profilage | « type D (55°) » en premier choix, 93° | D | S2, « Profilage » |
| Extérieur | Profilage à forte rampe | « type V (35°) », angle de ramping plus grand | V | S2, « Profilage » |
| Extérieur | Dressage | « trigone » avec un angle d'attaque de 95°, pour la polyvalence | W | S2, « Dressage » |
| Intérieur | Chariotage avec épaulement | « triangulaire », 91–95° pour un épaulement | T | S3, « Chariotage » |
| Intérieur | Avec épaulement, arête plus résistante | « type C (80°) » | C | S3, « Chariotage » |
| Intérieur | Chariotage sans épaulement | « carrée » avec un angle d'attaque de 75° | S | S3, « Chariotage » |
| Intérieur | Profilage | « type D (55°) » en premier choix, 93° | D | S3, « Profilage » |

La garde de test lit ces mots par une table « mot de la page → lettre » (`type C (80°)` et
`rhombique à 80°` → C, `type D (55°)` → D, `type V (35°)` → V, `carrée` → S, `trigone` → W,
`triangulaire` → T, `ronde` ou `rondes` → R). Une citation écrite qui porte « forme <lettre> » est
refusée.

## Sous-groupe × opération → situations → code

Chaque proposition cite d'abord **la forme écrite pour sa situation** (page de la famille, base
écrite), puis les principes d'où viennent la dépouille, la tolérance et la fixation (base déduite,
mention « déduit des principes du fabricant »), sauf quand une source écrit le code entier (Kyocera,
alu en finition : tout écrit, aucune mention). Quand le sous-groupe impose sa forme (austénitiques,
duplex, superalliages et titane), la proposition cite le conseil écrit du sous-groupe (« conseil du
sous-groupe »), puis la forme qu'il impose, **déduite**. Chaque champ reste cité pour son **sens** sur la
table de lecture (forme et tolérance : MMC ; dépouille et fixation : KYO p. B1 ; écrit).

| Sous-groupe | Opération | Situations → code |
|---|---|---|
| Aciers non alliés, faiblement alliés, inox ferritiques et martensitiques | Ébauche ext. | chariotage avec épaulement **CNMG** · sans épaulement **SNMG** · dressage **WNMG** |
| idem | Semi-finition ext. | chariotage avec épaulement **CNMG** · profilage **DNMG** · dressage **WNMG** |
| idem | Finition ext. | chariotage avec épaulement **CNMG** · profilage **DNMG** · profilage à forte rampe **VNMG** |
| Aciers non alliés, faiblement alliés, inox ferritiques et martensitiques, fontes | Ébauche int. | arête plus résistante **CCMT** · avec épaulement **TCMT** |
| idem | Finition int. | avec épaulement **TCMT** · profilage **DCMT** |
| Inox austénitiques | Ébauche, semi-finition, finition ext. | chariotage sans épaulement **SCMT** · profilage **RCMT** (ronde) |
| Inox austénitiques | Ébauche, finition int. | chariotage sans épaulement **SCMT** |
| Inox duplex | Ébauche, semi-finition, finition ext. | chariotage sans épaulement **SNMG** |
| Inox duplex | Ébauche, finition int. | chariotage sans épaulement **SCMT** |
| Fontes | Ébauche ext. | chariotage avec épaulement **CNMA** · sans épaulement **SNMA** |
| Fontes | Semi-finition, finition ext. | chariotage avec épaulement **CNMA** · profilage **DNMA** |
| Aluminium | Ébauche ext. | chariotage avec épaulement **CCGT** · sans épaulement **SCGT** · profilage **DCGT** |
| Aluminium | Semi-finition ext. | chariotage avec épaulement **CCGT** · profilage **DCGT** |
| Aluminium | Finition ext. | chariotage avec épaulement **CCGT** · profilage **DCGT** · profilage à forte rampe **VCGT** (écrits, KYO-AP) |
| Aluminium | Ébauche int. | arête plus résistante **CCGT** · avec épaulement **TCGT** · profilage **DCGT** |
| Aluminium | Finition int. | profilage **DCGT** · arête plus résistante **CCGT** (écrits, KYO-AP) |
| Superalliages et titane | Ébauche, semi-finition, finition ext. | profilage **RCGT** (une seule proposition) |
| Aciers trempés | Finition ext. | chariotage avec épaulement **CNGA** · dressage **WNGA** |

**Sans recommandation** (aucune section S4 pour leur sous-groupe, décision 17) : `11smn30`,
`11smnpb30` (aciers de décolletage), `x5crnicunb16-4` (17-4 PH) et `stellite-6` (Stellite 6), pour
toutes les opérations.

### D'où vient chaque lettre

| Lettres | Principe (source, section, base) |
|---|---|
| Forme, sous-groupes sans règle de forme | Page de la famille pour la situation (S2 ou S3, tableau ci-dessus), **écrit**. |
| N, G (aciers, P5, duplex ext.) ; N (fontes, trempés) | S1 « Plaquette de tournage négative » (angle de dépouille de 0°, premier choix en extérieur, réversible), déduit. |
| C, T (intérieur ; austénitiques) | S1 « Plaquette de tournage positive » (angle de dépouille de 7° par exemple, premier choix en intérieur, non réversible), déduit. |
| M (tolérance) | S1 « Ebauche », « Semi-finition » ou « Finition » selon l'étape, déduit. |
| A (fontes) | S4 « Tournage des fontes » (copeaux courts), déduit. |
| C, G (aluminium) | S4 « Tournage des alliages d'aluminium » (forme de base positive, arêtes vives, toujours), déduit ; T ← S1 positive, déduit. |
| Code entier (aluminium, finition) | KYO-AP, type positif pour la finition de l'aluminium, plaquettes CCGT, DCGT, TPGT et VCGT, **écrit**. |
| Forme S (austénitiques) | S4 austénitiques « plaquettes rondes ou angles d'attaque faibles », **écrit**, conseil du sous-groupe ; d'où la carrée à 75° sans épaulement plutôt qu'un outil à 91–95°, **déduit**. |
| Forme R (austénitiques) | Même conseil écrit ; la ronde pour le profilage, à la place de la plaquette de la situation, **déduit**. |
| C (dépouille, austénitiques ext.) | S4 austénitiques (« arêtes vives et/ou géométries avec une face de dépouille positive »), la plaquette positive en est **déduite** ; la lettre C vient de S1 positive (angle de dépouille de 7° par exemple), déduit. |
| Forme S (duplex) | S4 duplex « petits angles d'attaque », **écrit**, conseil du sous-groupe ; d'où la carrée à 75° sans épaulement, **déduit**. |
| Forme R (superalliages et titane) | S4 superalliages « angle d'attaque de moins de 45° », **écrit**, conseil du sous-groupe ; la ronde, seule à le tenir en profilage, **déduit**. |
| C, G (superalliages et titane) | S4 superalliages (arêtes vives), déduit ; T ← S1 positive, déduit. |
| G, A (trempés) | S4 « Tournage des aciers trempés » (CBN, profondeurs de coupe aussi petites que possible, arêtes wiper), déduit. |

## Situations omises (contrainte de sous-groupe)

| Sous-groupe | Situations omises | Raison |
|---|---|---|
| Austénitiques, extérieur | chariotage avec épaulement, profilage D, profilage à forte rampe, dressage | 91 à 95° (ou 93°) : angle d'attaque grand, contraire à « plaquettes rondes ou angles d'attaque faibles » ; la ronde ne fait pas d'épaulement. |
| Austénitiques, intérieur | avec épaulement, arête plus résistante, profilage | Même raison ; la ronde est exclue aussi, car son angle d'attaque descend sous 75°, alors que S3 le veut « toujours supérieur à 75° ». Reste la carrée à 75°. |
| Duplex | toutes sauf la carrée à 75° | « petits angles d'attaque » : aucune autre situation ne les tient ; la ronde n'est pas écrite pour le duplex. |
| Superalliages et titane, extérieur | toutes sauf le profilage à la ronde | « angle d'attaque de moins de 45° » : seule la ronde le tient. Une seule proposition, sans citation de la carrée au-dessus d'une ronde. |

### Géométrie, nuance, pièges

- Géométrie : (1) S1, section de l'étape + « Rayon de bec des plaquettes de tournage », écrit (géométrie
  de l'étape ; grand rayon pour les grandes profondeurs de coupe et une grande sécurité d'arête, petit
  rayon idéal pour les petites profondeurs, rayon égal à la profondeur de passe ou un peu plus petit ;
  la page ne relie pas le rayon à l'étape, le texte juxtapose les deux sans l'affirmer) ; (2) à
  l'intérieur, S3 « Chariotage », écrit (angle de pointe faible, petit rayon, porte-à-faux le plus petit
  possible) ; (3) la section du sous-groupe dans S4, écrit, « conseil du sous-groupe ».
- Nuance : S4, section du sous-groupe, écrit, « conseil du sous-groupe ». En mots (CVD, PVD, CBN, PCD,
  céramique, carbure non revêtu), aucun nom commercial. Exception : la section des aciers non alliés
  n'écrit aucune nuance ; la leur vient de S5, « Aciers non alliés – P 1.1-1.5 », « Usinabilité »
  (nuances à revêtement mince contre le collage des aciers bas carbone), écrit.
- Pièges : S4, section du sous-groupe, « conseil du sous-groupe » ; à l'intérieur, en plus, S3
  (introduction, copeau mal évacué). Aucun piège pour les fontes : S4 n'en écrit aucun.
- Comportement à la coupe (fiche matière) : S5, chaque phrase citée à la section qui l'écrit
  (« Groupes de matières usinées » pour le paragraphe du groupe, sinon la section du groupe : « Aciers
  ISO P », « ISO M aciers inoxydables », « ISO K fontes », « ISO N - Matières non ferreuses », « ISO S,
  superalliages réfractaires et titane », « Titane– S 4.1-4.4 », « ISO H aciers trempés », avec
  l'intertitre) ; « conseil du groupe », ou « conseil du sous-groupe » pour X20Cr13 (section P5) et les
  aciers de décolletage (« Aciers ISO P », « Eléments d'alliage », « Effet positif »).
- Vitesse de coupe : jamais renseignée (décision 13).

## Cases laissées vides, et pourquoi

| Cases | Raison |
|---|---|
| Aciers de décolletage, 17-4 PH, Stellite 6 : toutes | Aucune section S4 pour leur sous-groupe (décision 17). |
| Aciers trempés : ébauche et semi-finition ext. | S4 : tournage dur aux profondeurs de coupe aussi petites que possible ; S5 : groupe surtout usiné en finition. Aucune étape d'ébauche applicable. |
| Aciers trempés : ébauche et finition int. | Aucune page lue ne traite le tournage dur intérieur. |
| Superalliages et titane : ébauche et finition int. | Principes contradictoires : S4 veut un angle d'attaque de moins de 45°, S3 un angle « toujours supérieur à 75° » à l'intérieur. Aucune forme ne satisfait les deux. |
