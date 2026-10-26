import type {
  Designation,
  DesignationSystem,
  IsoGroupLetter,
  Material,
} from './models/material.model';
import type { SourceCitation, Sourced } from './models/source.model';

type Row = { readonly page: number; readonly group: IsoGroupLetter; readonly line: string };

const onWorkingList = ({ page, group, line }: Row): SourceCitation => ({
  source: 'julien-working-list',
  locator: `page ${page}, ISO ${group}, ligne «\u00a0${line}\u00a0»`,
  basis: 'stated',
});

const listed =
  (row: Row) =>
  (system: DesignationSystem, value: string): Designation => ({
    value,
    system,
    cite: onWorkingList(row),
  });

const section = (name: string): string => `section «\u00a0${name}\u00a0»`;

const GROUP_LIST = (letter: IsoGroupLetter): string =>
  `${section('Groupes de matières usinées')}, ISO ${letter}`;

const classedIn = (letter: IsoGroupLetter, locator: string): Sourced<IsoGroupLetter> => ({
  value: letter,
  cite: { source: 'sandvik-workpiece-materials', locator, basis: 'stated' },
});

const advice = (
  locator: string,
  scope: NonNullable<SourceCitation['scope']>,
  value: string,
): Sourced<string> => ({
  value,
  cite: { source: 'sandvik-workpiece-materials', locator, basis: 'stated', scope },
});

const groupAdvice = (letter: IsoGroupLetter, value: string): Sourced<string> =>
  advice(GROUP_LIST(letter), 'group', value);

const heading = (name: string, ...headings: readonly string[]): string =>
  [section(name), ...headings.map((title) => `«\u00a0${title}\u00a0»`)].join(', ');

const NON_ALLOYED = classedIn('P', section('Aciers non alliés – P 1.1-1.5'));
const LOW_ALLOYED = classedIn('P', section('Aciers faiblement alliés – P 2.1-2.6'));
const FERRITIC_MARTENSITIC_SECTION = 'Aciers inoxydables ferritiques et martensitiques – P5.0-5.1';
const FERRITIC_MARTENSITIC = classedIn('P', section(FERRITIC_MARTENSITIC_SECTION));
const AUSTENITIC = classedIn(
  'M',
  section('Acier inoxydable austénitique et super-austénitique – M1.0-2.0'),
);
const DUPLEX_GROUP = classedIn('M', section('Acier inoxydable duplex – M 3.41-3.42'));
const GREY = classedIn(
  'K',
  section('Fontes malléables (MCI) K 1.1-1.2 et fontes grises K 2.1-2.3'),
);
const NODULAR = classedIn('K', section('Fonte nodulaire (NCI) K 3.1-3.5'));
const ALUMINIUM = classedIn('N', `${GROUP_LIST('N')} (l'aluminium)`);
const TITANIUM = classedIn('S', section('Titane– S 4.1-4.4'));
const HEAT_RESISTANT = classedIn(
  'S',
  section('Matières en superalliages réfractaires – S 1.0-3.0'),
);
const STELLITES = classedIn(
  'H',
  `${section('Codification MC pour les aciers trempés')}, stellites`,
);
const HARDENED = classedIn('H', GROUP_LIST('H'));

const STEEL_GROUP = groupAdvice(
  'P',
  'Usinabilité en général bonne, mais elle varie beaucoup avec la dureté et la teneur en carbone.',
);

const STEEL_BEHAVIOUR: Material['behaviour'] = [
  STEEL_GROUP,
  advice(
    heading('Aciers ISO P', 'Usinabilité en général'),
    'group',
    'Les aciers bas carbone produisent des copeaux plus longs et collants, qui demandent des arêtes vives.',
  ),
];

const FREE_CUTTING_BEHAVIOUR: Material['behaviour'] = [
  STEEL_GROUP,
  advice(
    heading('Aciers ISO P', "Eléments d'alliage", 'Effet positif'),
    'subgroup',
    'Dans les aciers de décolletage, le soufre et le plomb réduisent le frottement entre le copeau et la plaquette et améliorent la fragmentation des copeaux.',
  ),
];

const STAINLESS_MACHINABILITY = heading('ISO M aciers inoxydables', 'Usinabilité en général');

const STAINLESS_BEHAVIOUR: Material['behaviour'] = [
  groupAdvice(
    'M',
    "Les arêtes de coupe subissent beaucoup de chaleur, de l'usure en entaille et des arêtes rapportées.",
  ),
  advice(
    STAINLESS_MACHINABILITY,
    'group',
    "L'usinage génère des efforts de coupe élevés et des surfaces écrouies en coupe.",
  ),
  advice(
    STAINLESS_MACHINABILITY,
    'group',
    'Le contrôle des copeaux est correct dans les ferritiques et les martensitiques, plus complexe dans les austénitiques et les duplex.',
  ),
];

const FERRITIC_MARTENSITIC_BEHAVIOUR: Material['behaviour'] = [
  advice(
    section(FERRITIC_MARTENSITIC_SECTION),
    'subgroup',
    'Usinabilité en général bonne, très proche de celle des aciers faiblement alliés.',
  ),
  advice(
    section(FERRITIC_MARTENSITIC_SECTION),
    'subgroup',
    "Au-delà de 0,2\u00a0% de carbone, la matière peut être durcie\u202f; l'usinage crée de l'usure en dépouille et en cratère, avec des arêtes rapportées.",
  ),
];

const CAST_IRON_BEHAVIOUR: Material['behaviour'] = [
  advice(
    heading('ISO K fontes', 'Usinabilité en général'),
    'group',
    'Matière à copeaux courts, avec un bon contrôle des copeaux dans la plupart des conditions.',
  ),
  groupAdvice(
    'K',
    'Les fontes grises et malléables sont assez faciles à usiner\u202f; les nodulaires, compactes et bainitiques sont plus difficiles.',
  ),
  groupAdvice('K', 'Toutes les fontes contiennent du SiC, très abrasif pour les arêtes de coupe.'),
];

const NON_FERROUS_BEHAVIOUR: Material['behaviour'] = [
  advice(
    heading('ISO N - Matières non ferreuses', "Usinabilité de l'aluminium"),
    'group',
    'Matière à copeaux longs, dont le contrôle des copeaux est relativement facile si elle est alliée.',
  ),
  groupAdvice(
    'N',
    'Métal tendre\u202f; les plaquettes à arêtes vives y ont en général une longue durée de vie.',
  ),
  groupAdvice('N', "L'aluminium est très abrasif quand sa teneur en silicium atteint 13\u00a0%."),
];

const SUPERALLOY_BEHAVIOUR: Material['behaviour'] = [
  groupAdvice(
    'S',
    "Collants, ils créent des arêtes rapportées, s'écrouissent en coupe et génèrent de la chaleur\u202f; beaucoup plus difficiles à couper que les aciers inoxydables.",
  ),
  advice(
    heading('ISO S, superalliages réfractaires et titane', 'Usinabilité en général'),
    'group',
    'Contrôle des copeaux difficile, efforts de coupe et puissance requise relativement élevés.',
  ),
  advice(
    heading('Titane– S 4.1-4.4', 'Usinabilité'),
    'group',
    'Le titane conduit mal la chaleur\u202f; une vitesse de coupe trop élevée provoque une réaction chimique entre le copeau et la plaquette.',
  ),
];

const HARD_MACHINABILITY = heading('ISO H aciers trempés', 'Usinabilité');

const HARD_BEHAVIOUR: Material['behaviour'] = [
  advice(
    HARD_MACHINABILITY,
    'group',
    "Le plus petit groupe du point de vue de l'usinage\u202f; la finition est l'opération la plus courante.",
  ),
  advice(
    HARD_MACHINABILITY,
    'group',
    'Les efforts de coupe et la puissance requise sont relativement élevés.',
  ),
  groupAdvice(
    'H',
    "Ces matières génèrent de la chaleur à la coupe et sont très abrasives pour l'arête.",
  ),
];

const FREE_CUTTING = listed({ page: 1, group: 'P', line: 'Décolletage' });
const STRUCTURAL = listed({ page: 1, group: 'P', line: 'Construction' });
const MEDIUM_CARBON = listed({ page: 1, group: 'P', line: 'Mi-durs au carbone' });
const CR_MO = listed({ page: 1, group: 'P', line: 'Alliés Cr-Mo' });
const CASE_HARDENING = listed({ page: 1, group: 'P', line: 'Cémentation' });
const BEARING = listed({ page: 1, group: 'P', line: 'Roulement & Outils' });
const AUSTENITIC_FREE_CUTTING = listed({ page: 2, group: 'M', line: 'Austénitique (Décolletage)' });
const AUSTENITIC_STANDARD = listed({ page: 2, group: 'M', line: 'Austénitique (Standard)' });
const AUSTENITIC_MOLYBDENUM = listed({ page: 2, group: 'M', line: 'Austénitique (Molybdène)' });
const MARTENSITIC = listed({ page: 2, group: 'M', line: 'Martensitique' });
const PRECIPITATION_ROW: Row = { page: 2, group: 'M', line: 'Précipitation (PH)' };
const PRECIPITATION = listed(PRECIPITATION_ROW);
const DUPLEX = listed({ page: 2, group: 'M', line: 'Duplex (Austéno-ferritique)' });
const ALU_COPPER = listed({ page: 2, group: 'N', line: 'Alu Cuivre (2000)' });
const ALU_FREE_CUTTING = listed({ page: 2, group: 'N', line: 'Alu Décolletage' });
const PURE_TITANIUM = listed({ page: 3, group: 'S', line: 'Titane pur' });
const ALPHA_BETA_TITANIUM = listed({ page: 3, group: 'S', line: 'Titane Alpha-Bêta' });
const NICKEL_PH = listed({ page: 3, group: 'S', line: 'Base Nickel (PH)' });
const NICKEL_SOLUTION = listed({ page: 3, group: 'S', line: 'Base Nickel (Sol.)' });
const COBALT = listed({ page: 3, group: 'S', line: 'Base Cobalt' });
const GREY_IRON = listed({ page: 3, group: 'K', line: 'EN-GJL-250 (GG25)' });
const DUCTILE_IRON = listed({ page: 3, group: 'K', line: 'EN-GJS-400-15 / 500-7' });
const HARDENED_BEARING = listed({ page: 3, group: 'H', line: '100Cr6 / 16MnCr5 trempé' });
const COLD_WORK_TOOL = listed({ page: 3, group: 'H', line: 'X153CrMoV12' });

export const MATERIALS: readonly Material[] = [
  {
    slug: '11smn30',
    designations: [
      FREE_CUTTING('en-symbol', '11SMn30'),
      FREE_CUTTING('material-number', '1.0715'),
      FREE_CUTTING('aisi', '1215'),
      FREE_CUTTING('afnor-legacy', 'S250'),
    ],
    isoGroup: NON_ALLOYED,
    subgroup: 'free-cutting-steel',
    behaviour: FREE_CUTTING_BEHAVIOUR,
  },
  {
    slug: '11smnpb30',
    designations: [
      FREE_CUTTING('en-symbol', '11SMnPb30'),
      FREE_CUTTING('material-number', '1.0718'),
      FREE_CUTTING('aisi', '12L14'),
      FREE_CUTTING('afnor-legacy', 'S250Pb'),
    ],
    isoGroup: NON_ALLOYED,
    subgroup: 'free-cutting-steel',
    behaviour: FREE_CUTTING_BEHAVIOUR,
  },
  {
    slug: 's235jr',
    designations: [
      STRUCTURAL('en-symbol', 'S235JR'),
      STRUCTURAL('material-number', '1.0038'),
      STRUCTURAL('aisi', 'A36'),
      STRUCTURAL('afnor-legacy', 'E24'),
    ],
    isoGroup: NON_ALLOYED,
    subgroup: 'non-alloyed-steel',
    behaviour: STEEL_BEHAVIOUR,
  },
  {
    slug: 's355j2',
    designations: [
      STRUCTURAL('en-symbol', 'S355J2'),
      STRUCTURAL('material-number', '1.0577'),
      STRUCTURAL('aisi', 'A572 Gr.50'),
      STRUCTURAL('afnor-legacy', 'E36'),
    ],
    isoGroup: NON_ALLOYED,
    subgroup: 'non-alloyed-steel',
    behaviour: STEEL_BEHAVIOUR,
  },
  {
    slug: 'c45',
    designations: [
      MEDIUM_CARBON('en-symbol', 'C45'),
      MEDIUM_CARBON('material-number', '1.0503'),
      MEDIUM_CARBON('aisi', '1045'),
      MEDIUM_CARBON('afnor-legacy', 'XC48'),
      MEDIUM_CARBON('afnor-legacy', 'XC45'),
    ],
    isoGroup: NON_ALLOYED,
    subgroup: 'non-alloyed-steel',
    behaviour: STEEL_BEHAVIOUR,
  },
  {
    slug: '42crmo4',
    designations: [
      CR_MO('en-symbol', '42CrMo4'),
      CR_MO('material-number', '1.7225'),
      CR_MO('aisi', '4140'),
      CR_MO('afnor-legacy', '42CD4'),
    ],
    isoGroup: LOW_ALLOYED,
    subgroup: 'low-alloyed-steel',
    behaviour: STEEL_BEHAVIOUR,
  },
  {
    slug: '16mncr5',
    designations: [
      CASE_HARDENING('en-symbol', '16MnCr5'),
      CASE_HARDENING('material-number', '1.7131'),
      CASE_HARDENING('aisi', '5115'),
      CASE_HARDENING('afnor-legacy', '16MC5'),
    ],
    isoGroup: LOW_ALLOYED,
    subgroup: 'low-alloyed-steel',
    behaviour: STEEL_BEHAVIOUR,
  },
  {
    slug: '20nicrmo2-2',
    designations: [
      CASE_HARDENING('en-symbol', '20NiCrMo2-2'),
      CASE_HARDENING('material-number', '1.6523'),
      CASE_HARDENING('aisi', '8620'),
      CASE_HARDENING('afnor-legacy', '20NCD2'),
    ],
    isoGroup: LOW_ALLOYED,
    subgroup: 'low-alloyed-steel',
    behaviour: STEEL_BEHAVIOUR,
  },
  {
    slug: '100cr6',
    designations: [
      BEARING('en-symbol', '100Cr6'),
      BEARING('material-number', '1.3505'),
      BEARING('aisi', '52100'),
      BEARING('afnor-legacy', '100C6'),
    ],
    isoGroup: LOW_ALLOYED,
    subgroup: 'low-alloyed-steel',
    behaviour: STEEL_BEHAVIOUR,
  },
  {
    slug: 'x8crnis18-9',
    designations: [
      AUSTENITIC_FREE_CUTTING('en-symbol', 'X8CrNiS18-9'),
      AUSTENITIC_FREE_CUTTING('material-number', '1.4305'),
      AUSTENITIC_FREE_CUTTING('aisi', '303'),
      AUSTENITIC_FREE_CUTTING('afnor-legacy', 'Z8CNF18-09'),
    ],
    isoGroup: AUSTENITIC,
    subgroup: 'austenitic-stainless',
    behaviour: STAINLESS_BEHAVIOUR,
  },
  {
    slug: 'x5crni18-10',
    designations: [
      AUSTENITIC_STANDARD('en-symbol', 'X5CrNi18-10'),
      AUSTENITIC_STANDARD('material-number', '1.4301'),
      AUSTENITIC_STANDARD('aisi', '304'),
      AUSTENITIC_STANDARD('afnor-legacy', 'Z7CN18-09'),
    ],
    isoGroup: AUSTENITIC,
    subgroup: 'austenitic-stainless',
    behaviour: STAINLESS_BEHAVIOUR,
  },
  {
    slug: 'x2crni18-9',
    designations: [
      AUSTENITIC_STANDARD('en-symbol', 'X2CrNi18-9'),
      AUSTENITIC_STANDARD('material-number', '1.4307'),
      AUSTENITIC_STANDARD('aisi', '304L'),
      AUSTENITIC_STANDARD('afnor-legacy', 'Z3CN18-10'),
    ],
    isoGroup: AUSTENITIC,
    subgroup: 'austenitic-stainless',
    behaviour: STAINLESS_BEHAVIOUR,
  },
  {
    slug: 'x2crnimo17-12-2',
    designations: [
      AUSTENITIC_MOLYBDENUM('en-symbol', 'X2CrNiMo17-12-2'),
      AUSTENITIC_MOLYBDENUM('material-number', '1.4404'),
      AUSTENITIC_MOLYBDENUM('aisi', '316L'),
      AUSTENITIC_MOLYBDENUM('afnor-legacy', 'Z3CND17-11-02'),
    ],
    isoGroup: AUSTENITIC,
    subgroup: 'austenitic-stainless',
    behaviour: STAINLESS_BEHAVIOUR,
  },
  {
    slug: 'x20cr13-x30cr13',
    designations: [
      MARTENSITIC('en-symbol', 'X20Cr13'),
      MARTENSITIC('en-symbol', 'X30Cr13'),
      MARTENSITIC('material-number', '1.4021'),
      MARTENSITIC('material-number', '1.4028'),
      MARTENSITIC('aisi', '420'),
      MARTENSITIC('afnor-legacy', 'Z20C13'),
      MARTENSITIC('afnor-legacy', 'Z30C13'),
    ],
    isoGroup: FERRITIC_MARTENSITIC,
    subgroup: 'ferritic-martensitic-stainless',
    behaviour: FERRITIC_MARTENSITIC_BEHAVIOUR,
  },
  {
    slug: 'x5crnicunb16-4',
    designations: [
      PRECIPITATION('en-symbol', 'X5CrNiCuNb16-4'),
      PRECIPITATION('material-number', '1.4542'),
      PRECIPITATION('common-name', '17-4 PH'),
      PRECIPITATION('aisi', '630'),
      PRECIPITATION('afnor-legacy', 'Z6CNU17-04'),
    ],
    isoGroup: { value: 'M', cite: onWorkingList(PRECIPITATION_ROW) },
    subgroup: 'precipitation-hardening-stainless',
    behaviour: STAINLESS_BEHAVIOUR,
  },
  {
    slug: 'x2crnimon22-5-3',
    designations: [
      DUPLEX('en-symbol', 'X2CrNiMoN22-5-3'),
      DUPLEX('material-number', '1.4462'),
      DUPLEX('aisi', '2205'),
      DUPLEX('afnor-legacy', 'Z3CND22-05Az'),
    ],
    isoGroup: DUPLEX_GROUP,
    subgroup: 'duplex-stainless',
    behaviour: STAINLESS_BEHAVIOUR,
  },
  {
    slug: 'en-gjl-250',
    designations: [
      GREY_IRON('en-symbol', 'EN-GJL-250'),
      GREY_IRON('common-name', 'GG25'),
      GREY_IRON('afnor-legacy', 'FGL 250'),
      GREY_IRON('afnor-legacy', 'Ft 25'),
    ],
    isoGroup: GREY,
    subgroup: 'cast-iron',
    behaviour: CAST_IRON_BEHAVIOUR,
  },
  {
    slug: 'en-gjs-400-15',
    designations: [
      DUCTILE_IRON('en-symbol', 'EN-GJS-400-15'),
      DUCTILE_IRON('afnor-legacy', 'FGS 400'),
      DUCTILE_IRON('common-name', 'GGG40'),
    ],
    isoGroup: NODULAR,
    subgroup: 'cast-iron',
    behaviour: CAST_IRON_BEHAVIOUR,
  },
  {
    slug: 'en-gjs-500-7',
    designations: [
      DUCTILE_IRON('en-symbol', 'EN-GJS-500-7'),
      DUCTILE_IRON('afnor-legacy', 'FGS 500'),
      DUCTILE_IRON('common-name', 'GGG50'),
    ],
    isoGroup: NODULAR,
    subgroup: 'cast-iron',
    behaviour: CAST_IRON_BEHAVIOUR,
  },
  {
    slug: 'en-aw-2017a',
    designations: [ALU_COPPER('en-symbol', 'EN AW-2017A'), ALU_COPPER('common-name', 'AU4G')],
    isoGroup: ALUMINIUM,
    subgroup: 'aluminium',
    behaviour: NON_FERROUS_BEHAVIOUR,
  },
  {
    slug: 'en-aw-2024',
    designations: [ALU_COPPER('en-symbol', 'EN AW-2024'), ALU_COPPER('common-name', 'AU4G1')],
    isoGroup: ALUMINIUM,
    subgroup: 'aluminium',
    behaviour: NON_FERROUS_BEHAVIOUR,
  },
  {
    slug: 'en-aw-2011-2030',
    designations: [
      ALU_FREE_CUTTING('en-symbol', 'EN AW-2011'),
      ALU_FREE_CUTTING('en-symbol', 'EN AW-2030'),
      ALU_FREE_CUTTING('common-name', 'AU5PbBi'),
    ],
    isoGroup: ALUMINIUM,
    subgroup: 'aluminium',
    behaviour: NON_FERROUS_BEHAVIOUR,
  },
  {
    slug: 'titane-grade-2',
    designations: [
      PURE_TITANIUM('common-name', 'Titane Grade 2'),
      PURE_TITANIUM('uns', 'R50400'),
      PURE_TITANIUM('material-number', '3.7035'),
    ],
    isoGroup: TITANIUM,
    subgroup: 'heat-resistant-and-titanium',
    behaviour: SUPERALLOY_BEHAVIOUR,
  },
  {
    slug: 'ta6v',
    designations: [
      ALPHA_BETA_TITANIUM('common-name', 'TA6V'),
      ALPHA_BETA_TITANIUM('common-name', 'Ti-6Al-4V'),
      ALPHA_BETA_TITANIUM('common-name', 'Gr.5'),
      ALPHA_BETA_TITANIUM('uns', 'R56400'),
      ALPHA_BETA_TITANIUM('material-number', '3.7165'),
    ],
    isoGroup: TITANIUM,
    subgroup: 'heat-resistant-and-titanium',
    behaviour: SUPERALLOY_BEHAVIOUR,
  },
  {
    slug: 'inconel-718',
    designations: [
      NICKEL_PH('common-name', 'Inconel 718'),
      NICKEL_PH('uns', 'N07718'),
      NICKEL_PH('material-number', '2.4668'),
    ],
    isoGroup: HEAT_RESISTANT,
    subgroup: 'heat-resistant-and-titanium',
    behaviour: SUPERALLOY_BEHAVIOUR,
  },
  {
    slug: 'inconel-625',
    designations: [NICKEL_SOLUTION('common-name', 'Inconel 625'), NICKEL_SOLUTION('uns', 'N06625')],
    isoGroup: HEAT_RESISTANT,
    subgroup: 'heat-resistant-and-titanium',
    behaviour: SUPERALLOY_BEHAVIOUR,
  },
  {
    slug: 'hastelloy-c276',
    designations: [
      NICKEL_SOLUTION('common-name', 'Hastelloy C276'),
      NICKEL_SOLUTION('uns', 'N10276'),
    ],
    isoGroup: HEAT_RESISTANT,
    subgroup: 'heat-resistant-and-titanium',
    behaviour: SUPERALLOY_BEHAVIOUR,
  },
  {
    slug: 'haynes-25',
    designations: [COBALT('common-name', 'Haynes 25'), COBALT('uns', 'R30605')],
    isoGroup: HEAT_RESISTANT,
    subgroup: 'heat-resistant-and-titanium',
    behaviour: SUPERALLOY_BEHAVIOUR,
  },
  {
    slug: 'stellite-6',
    designations: [COBALT('common-name', 'Stellite 6'), COBALT('uns', 'R30006')],
    isoGroup: STELLITES,
    subgroup: 'stellite',
    behaviour: HARD_BEHAVIOUR,
  },
  {
    slug: '100cr6-trempe',
    designations: [HARDENED_BEARING('common-name', '100Cr6 trempé')],
    isoGroup: HARDENED,
    subgroup: 'hardened-steel',
    behaviour: HARD_BEHAVIOUR,
  },
  {
    slug: '16mncr5-trempe',
    designations: [HARDENED_BEARING('common-name', '16MnCr5 trempé')],
    isoGroup: HARDENED,
    subgroup: 'hardened-steel',
    behaviour: HARD_BEHAVIOUR,
  },
  {
    slug: 'x153crmov12',
    designations: [
      COLD_WORK_TOOL('en-symbol', 'X153CrMoV12'),
      COLD_WORK_TOOL('material-number', '1.2379'),
      COLD_WORK_TOOL('aisi', 'D2'),
      COLD_WORK_TOOL('afnor-legacy', 'Z160CDV12'),
    ],
    isoGroup: HARDENED,
    subgroup: 'hardened-steel',
    behaviour: HARD_BEHAVIOUR,
  },
];
