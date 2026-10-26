import type { OperationId } from './models/operation.model';
import type {
  ExternalSituation,
  InsertSituation,
  InternalSituation,
  IsoInsertDesignation,
  IsoInsertProposal,
  RecommendationEntry,
} from './models/recommendation.model';
import type { SourceCitation, SourceId, Sourced } from './models/source.model';

type ExternalOperation = Extract<OperationId, `external-${string}`>;
type InternalOperation = Extract<OperationId, `internal-${string}`>;
type TurningOperation = ExternalOperation | InternalOperation;
type Field = IsoInsertProposal['fields'][number];

const cite = (
  source: SourceId,
  locator: string,
  basis: SourceCitation['basis'],
): SourceCitation => ({
  source,
  locator,
  basis,
});

const section = (name: string, detail?: string): string =>
  `section «\u00a0${name}\u00a0»${detail === undefined ? '' : ` (${detail})`}`;

const field = (name: string, code: string, meaning: string, where: SourceCitation): Field => ({
  value: { field: name, code, meaning },
  cite: where,
});

const SHAPE_TABLE = cite('mitsubishi-insert-identification', 'position 1, forme', 'stated');
const CLEARANCE_TABLE = cite('kyocera-turning-inserts', 'page B1, position 2, dépouille', 'stated');
const TOLERANCE_TABLE = cite(
  'mitsubishi-insert-identification',
  'position 3, classe de tolérance',
  'stated',
);
const FIXING_TABLE = cite(
  'kyocera-turning-inserts',
  'page B1, position 4, fixation et brise-copeaux',
  'stated',
);

const SHAPE = {
  C: field('Forme', 'C', 'Losange à 80°', SHAPE_TABLE),
  D: field('Forme', 'D', 'Losange à 55°', SHAPE_TABLE),
  R: field('Forme', 'R', 'Ronde', SHAPE_TABLE),
  S: field('Forme', 'S', 'Carrée', SHAPE_TABLE),
  T: field('Forme', 'T', 'Triangle', SHAPE_TABLE),
  V: field('Forme', 'V', 'Losange à 35°', SHAPE_TABLE),
  W: field('Forme', 'W', 'Trigone', SHAPE_TABLE),
};
type ShapeLetter = keyof typeof SHAPE;
const CLEARANCE = {
  N: field('Dépouille', 'N', 'Dépouille de 0°', CLEARANCE_TABLE),
  C: field('Dépouille', 'C', 'Dépouille de 7°', CLEARANCE_TABLE),
};
const TOLERANCE = {
  M: field('Tolérance', 'M', 'Classe M, tolérance large', TOLERANCE_TABLE),
  G: field('Tolérance', 'G', 'Classe G, tolérance serrée', TOLERANCE_TABLE),
};
const FIXING = {
  G: field(
    'Fixation et brise-copeaux',
    'G',
    'Trou cylindrique, brise-copeaux sur les deux faces',
    FIXING_TABLE,
  ),
  T: field(
    'Fixation et brise-copeaux',
    'T',
    'Trou fraisé, brise-copeaux sur une face',
    FIXING_TABLE,
  ),
  A: field('Fixation et brise-copeaux', 'A', 'Trou cylindrique, sans brise-copeaux', FIXING_TABLE),
};

const deduced = (source: SourceId, locator: string): SourceCitation =>
  cite(source, locator, 'deduced');

const written = (source: SourceId, name: string, detail: string): SourceCitation =>
  cite(source, section(name, detail), 'stated');

type Placed<S extends InsertSituation> = { readonly situation: S; readonly shape: SourceCitation };

const EXTERNAL = {
  shoulder: {
    situation: 'external-shoulder',
    shape: written(
      'sandvik-external-turning',
      'Chariotage',
      "plaquette type C (80°) en priorité, angle d'attaque de 91–95° pour un épaulement",
    ),
  },
  noShoulder: {
    situation: 'external-no-shoulder',
    shape: written(
      'sandvik-external-turning',
      'Chariotage',
      "plaquette carrée avec un angle d'attaque de 75°, sans épaulement",
    ),
  },
  profiling: {
    situation: 'external-profiling',
    shape: written(
      'sandvik-external-turning',
      'Profilage',
      "plaquette type D (55°) en premier choix, angle d'attaque de 93°",
    ),
  },
  steepProfiling: {
    situation: 'external-steep-profiling',
    shape: written(
      'sandvik-external-turning',
      'Profilage',
      'plaquette type V (35°) pour un angle de ramping plus grand',
    ),
  },
  facing: {
    situation: 'external-facing',
    shape: written(
      'sandvik-external-turning',
      'Dressage',
      "plaquette trigone avec un angle d'attaque de 95°, pour la polyvalence",
    ),
  },
} as const satisfies Readonly<Record<string, Placed<ExternalSituation>>>;

const INTERNAL = {
  shoulder: {
    situation: 'internal-shoulder',
    shape: written(
      'sandvik-internal-turning',
      'Chariotage',
      "plaquette triangulaire, angle d'attaque de 91–95° pour un épaulement",
    ),
  },
  strongerEdge: {
    situation: 'internal-stronger-edge',
    shape: written(
      'sandvik-internal-turning',
      'Chariotage',
      'plaquette type C (80°) pour une arête plus résistante',
    ),
  },
  noShoulder: {
    situation: 'internal-no-shoulder',
    shape: written(
      'sandvik-internal-turning',
      'Chariotage',
      "plaquette carrée avec un angle d'attaque de 75°, sans épaulement et si les conditions sont stables",
    ),
  },
  profiling: {
    situation: 'internal-profiling',
    shape: written(
      'sandvik-internal-turning',
      'Profilage',
      "plaquette type D (55°) en premier choix, angle d'attaque de 93°",
    ),
  },
} as const satisfies Readonly<Record<string, Placed<InternalSituation>>>;

const NEGATIVE = deduced(
  'sandvik-choose-insert',
  section(
    'Plaquette de tournage négative',
    'angle de dépouille de 0°, premier choix en extérieur, réversible : dépouille N, brise-copeaux sur les deux faces G',
  ),
);
const NEGATIVE_CLEARANCE = deduced(
  'sandvik-choose-insert',
  section(
    'Plaquette de tournage négative',
    'angle de dépouille de 0°, premier choix en extérieur : dépouille N',
  ),
);
const POSITIVE = deduced(
  'sandvik-choose-insert',
  section(
    'Plaquette de tournage positive',
    'angle de dépouille de 7° par exemple, premier choix en intérieur, non réversible : dépouille C, brise-copeaux sur une face T',
  ),
);
const ONE_SIDED = deduced(
  'sandvik-choose-insert',
  section('Plaquette de tournage positive', 'non réversible : brise-copeaux sur une face T'),
);
const ROUGHING_TOLERANCE = deduced('sandvik-choose-insert', section('Ebauche', 'classe M'));
const SEMI_FINISHING_TOLERANCE = deduced(
  'sandvik-choose-insert',
  section('Semi-finition', 'classe M'),
);
const FINISHING_TOLERANCE = deduced('sandvik-choose-insert', section('Finition', 'classe M'));

const NON_ALLOYED_SECTION = 'Tournage des aciers non alliés';
const LOW_ALLOYED_SECTION = 'Tournage des aciers faiblement alliés';
const FERRITIC_MARTENSITIC_SECTION =
  'Tournage des aciers inoxydables ferritiques et martensitiques';
const AUSTENITIC_SECTION = 'Tournage des aciers inoxydables austénitiques';
const DUPLEX_SECTION = 'Tournage des aciers inoxydables duplex (austénitiques/ferritiques)';
const CAST_IRON_SECTION = 'Tournage des fontes';
const ALUMINIUM_SECTION = "Tournage des alliages d'aluminium";
const HEAT_RESISTANT_SECTION = 'Tournage des superalliages réfractaires';
const HARDENED_SECTION = 'Tournage des aciers trempés';

const subgroupRule = (name: string, detail: string): SourceCitation => ({
  source: 'sandvik-turning-materials',
  locator: section(name, detail),
  basis: 'stated',
  scope: 'subgroup',
});

const fromSubgroup = (name: string, detail: string): SourceCitation =>
  deduced('sandvik-turning-materials', section(name, detail));

const CAST_IRON_FIXING = fromSubgroup(CAST_IRON_SECTION, 'copeaux courts : sans brise-copeaux A');

const AUSTENITIC_ANGLE = subgroupRule(
  AUSTENITIC_SECTION,
  "plaquettes rondes ou angles d'attaque faibles, contre l'usure en entaille",
);
const AUSTENITIC_SQUARE = fromSubgroup(
  AUSTENITIC_SECTION,
  "angle d'attaque faible : plaquette carrée à 75° sans épaulement, plutôt qu'un outil à 91–95°",
);
const AUSTENITIC_ROUND = fromSubgroup(
  AUSTENITIC_SECTION,
  'plaquette ronde pour le profilage, à la place de la plaquette de la situation',
);
const AUSTENITIC_POSITIVE = fromSubgroup(
  AUSTENITIC_SECTION,
  'arêtes vives et géométries avec une face de dépouille positive : plaquette positive',
);

const DUPLEX_ANGLE = subgroupRule(
  DUPLEX_SECTION,
  "petits angles d'attaque, contre l'usure en entaille et les bavures",
);
const DUPLEX_SQUARE = fromSubgroup(
  DUPLEX_SECTION,
  "petit angle d'attaque : plaquette carrée à 75° sans épaulement, plutôt qu'un outil à 91–95°",
);

const ALUMINIUM_EDGE = fromSubgroup(
  ALUMINIUM_SECTION,
  'forme de base positive et arêtes vives, toujours : dépouille C, classe G',
);
const ALUMINIUM_FINISHING = cite(
  'kyocera-aluminium-finishing',
  "type positif pour la finition de l'aluminium, plaquettes CCGT, DCGT, TPGT et VCGT",
  'stated',
);

const HEAT_RESISTANT_ANGLE = subgroupRule(
  HEAT_RESISTANT_SECTION,
  "angle d'attaque de moins de 45°, contre l'usure en entaille",
);
const HEAT_RESISTANT_ROUND = fromSubgroup(
  HEAT_RESISTANT_SECTION,
  "plaquette ronde, seule à garder l'angle d'attaque sous 45° en profilage",
);
const HEAT_RESISTANT_EDGE = fromSubgroup(
  HEAT_RESISTANT_SECTION,
  'arêtes vives : plaquette positive, dépouille C et classe G',
);
const HARD_TURNING_EDGE = fromSubgroup(
  HARDENED_SECTION,
  'CBN, profondeurs de coupe aussi petites que possible et arêtes wiper : classe G, sans brise-copeaux A',
);

const stated = (source: SourceId, locator: string, value: string): Sourced<string> => ({
  value,
  cite: cite(source, locator, 'stated'),
});

const RADIUS = 'Rayon de bec des plaquettes de tournage';

const STAGE_GEOMETRY = {
  roughing: stated(
    'sandvik-choose-insert',
    `${section('Ebauche')} et ${section(RADIUS)}`,
    "Géométrie d'ébauche, pour les fortes profondeurs de passe et avances et une arête très sûre ; un grand rayon de bec va avec les grandes profondeurs de coupe et une grande sécurité d'arête, égal à la profondeur de passe ou un peu plus petit.",
  ),
  semiFinishing: stated(
    'sandvik-choose-insert',
    `${section('Semi-finition')} et ${section(RADIUS)}`,
    "Géométrie de semi-finition, pour une ébauche moyenne à légère sur une large plage de profondeurs de passe et d'avances ; rayon de bec égal à la profondeur de passe ou un peu plus petit.",
  ),
  finishing: stated(
    'sandvik-choose-insert',
    `${section('Finition')} et ${section(RADIUS)}`,
    'Géométrie de finition, pour les faibles profondeurs de passe et avances et des efforts de coupe faibles ; un petit rayon de bec est idéal pour les petites profondeurs de coupe, égal à la profondeur de passe ou un peu plus petit.',
  ),
};

const INTERNAL_GEOMETRY = stated(
  'sandvik-internal-turning',
  `${section('Chariotage')}, type de plaquette et porte-outil`,
  "À l'intérieur, un angle de pointe faible et un petit rayon de bec réduisent aussi les efforts de coupe ; garde le porte-à-faux le plus petit possible.",
);

const INTERNAL_PITFALL = stated(
  'sandvik-internal-turning',
  `introduction, avant la ${section('Chariotage')}`,
  "Un copeau mal évacué peut casser la plaquette ou abîmer l'état de surface.",
);

const subgroupAdvice = (name: string, value: string): Sourced<string> => ({
  value,
  cite: {
    source: 'sandvik-turning-materials',
    locator: section(name),
    basis: 'stated',
    scope: 'subgroup',
  },
});

type SubgroupAdvice = Pick<RecommendationEntry, 'materials' | 'grade' | 'pitfalls'> & {
  readonly geometry: Sourced<string>;
};

const NON_ALLOYED_STEEL: SubgroupAdvice = {
  materials: ['s235jr', 's355j2', 'c45'],
  geometry: subgroupAdvice(
    NON_ALLOYED_SECTION,
    "Sur l'acier non allié, arêtes vives et géométries légères limitent l'adhérence de la matière, et une plaquette wiper est conseillée.",
  ),
  grade: {
    value:
      'Sur les aciers bas carbone (moins de 0,25\u00a0%), des nuances à revêtement mince réduisent la tendance au collage.',
    cite: {
      source: 'sandvik-workpiece-materials',
      locator: `${section('Aciers non alliés – P 1.1-1.5')}, «\u00a0Usinabilité\u00a0»`,
      basis: 'stated',
      scope: 'subgroup',
    },
  },
  pitfalls: [
    subgroupAdvice(
      NON_ALLOYED_SECTION,
      "Sous 0,25 % de carbone, le copeau se fragmente mal et l'arête rapportée guette : vise une avance et une vitesse élevées.",
    ),
  ],
};

const LOW_ALLOYED_STEEL: SubgroupAdvice = {
  materials: ['42crmo4', '16mncr5', '20nicrmo2-2', '100cr6'],
  geometry: subgroupAdvice(
    LOW_ALLOYED_SECTION,
    'Sur matière non trempée, la série de géométries pour aciers en premier choix.',
  ),
  grade: subgroupAdvice(
    LOW_ALLOYED_SECTION,
    'Nuances pour aciers en premier choix ; sur acier trempé, une nuance plus dure (céramique, CBN ou nuance pour fonte).',
  ),
  pitfalls: [
    subgroupAdvice(
      LOW_ALLOYED_SECTION,
      "L'usure en cratère et l'usure en dépouille sont les plus courantes ; sur matière trempée, la chaleur entraîne une déformation plastique de l'arête.",
    ),
  ],
};

const FERRITIC_MARTENSITIC: SubgroupAdvice = {
  materials: ['x20cr13-x30cr13'],
  geometry: subgroupAdvice(FERRITIC_MARTENSITIC_SECTION, 'Géométries pour aciers inoxydables.'),
  grade: subgroupAdvice(
    FERRITIC_MARTENSITIC_SECTION,
    "Nuances pour aciers inoxydables ; à l'état trempé, nuances CBN.",
  ),
  pitfalls: [
    subgroupAdvice(
      FERRITIC_MARTENSITIC_SECTION,
      "Usiné à l'état trempé, le martensitique demande une plaquette très résistante à la déformation plastique.",
    ),
  ],
};

const AUSTENITIC: SubgroupAdvice = {
  materials: ['x8crnis18-9', 'x5crni18-10', 'x2crni18-9', 'x2crnimo17-12-2'],
  geometry: subgroupAdvice(
    AUSTENITIC_SECTION,
    'Arêtes vives ou géométries avec une face de dépouille positive ; rayon de bec aussi grand que possible.',
  ),
  grade: subgroupAdvice(
    AUSTENITIC_SECTION,
    'Nuances CVD ou PVD pour inox ; PVD en coupe interrompue, ou quand le copeau martèle ou bourre.',
  ),
  pitfalls: [
    subgroupAdvice(
      AUSTENITIC_SECTION,
      "Contre l'usure en entaille, prends une plaquette ronde ou un faible angle d'attaque.",
    ),
    subgroupAdvice(
      AUSTENITIC_SECTION,
      "Arrose toujours, contre l'usure en cratère et la déformation plastique.",
    ),
  ],
};

const DUPLEX: SubgroupAdvice = {
  materials: ['x2crnimon22-5-3'],
  geometry: subgroupAdvice(
    DUPLEX_SECTION,
    "Petits angles d'attaque, contre l'usure en entaille et les bavures.",
  ),
  grade: subgroupAdvice(DUPLEX_SECTION, 'Nuances CVD et PVD pour inox.'),
  pitfalls: [
    subgroupAdvice(
      DUPLEX_SECTION,
      'Les super duplex et hyper duplex, plus alliés, sont plus difficiles à usiner : chaleur, efforts de coupe et contrôle des copeaux.',
    ),
    subgroupAdvice(
      DUPLEX_SECTION,
      "Arrose pour évacuer les copeaux et éviter la déformation plastique, de préférence par l'intérieur de l'outil, en arrosage de précision.",
    ),
  ],
};

const CAST_IRON: SubgroupAdvice = {
  materials: ['en-gjl-250', 'en-gjs-400-15', 'en-gjs-500-7'],
  geometry: subgroupAdvice(
    CAST_IRON_SECTION,
    'Prends les géométries prévues pour la fonte : le copeau est court et se contrôle bien.',
  ),
  grade: subgroupAdvice(
    CAST_IRON_SECTION,
    'Nuances pour fontes ; céramique ou CBN sur fonte grise à grande vitesse de coupe.',
  ),
  pitfalls: [],
};

const ALUMINIUM: SubgroupAdvice = {
  materials: ['en-aw-2017a', 'en-aw-2024', 'en-aw-2011-2030'],
  geometry: subgroupAdvice(
    ALUMINIUM_SECTION,
    'Toujours une plaquette à forme de base positive et à arêtes vives.',
  ),
  grade: subgroupAdvice(ALUMINIUM_SECTION, 'Carbure non revêtu ou PCD en premier choix.'),
  pitfalls: [
    subgroupAdvice(
      ALUMINIUM_SECTION,
      'Au-delà de 13 % de silicium, le carbure dure très peu : passe au PCD.',
    ),
    subgroupAdvice(ALUMINIUM_SECTION, "L'arrosage sert surtout à évacuer les copeaux."),
  ],
};

const HEAT_RESISTANT: SubgroupAdvice = {
  materials: [
    'titane-grade-2',
    'ta6v',
    'inconel-718',
    'inconel-625',
    'hastelloy-c276',
    'haynes-25',
  ],
  geometry: subgroupAdvice(
    HEAT_RESISTANT_SECTION,
    'Des arêtes vives, contre les couches blanches ; diamètre de plaquette ou rayon de bec choisi selon la profondeur de passe.',
  ),
  grade: subgroupAdvice(
    HEAT_RESISTANT_SECTION,
    'Superalliages : nuances PVD ou céramique. Titane : surtout non revêtu ou PVD.',
  ),
  pitfalls: [
    subgroupAdvice(
      HEAT_RESISTANT_SECTION,
      "L'usure en entaille est fréquente : garde un angle d'attaque de moins de 45°.",
    ),
    subgroupAdvice(
      HEAT_RESISTANT_SECTION,
      'En ramping ou en passes multiples, prends au moins 0,25 mm de profondeur de passe.',
    ),
    subgroupAdvice(HEAT_RESISTANT_SECTION, 'Arrosage obligatoire, à fort débit et bien dirigé.'),
  ],
};

const HARDENED: SubgroupAdvice = {
  materials: ['100cr6-trempe', '16mncr5-trempe', 'x153crmov12'],
  geometry: subgroupAdvice(
    HARDENED_SECTION,
    "Une préparation d'arête correcte allonge la durée de vie, et des arêtes wiper améliorent l'état de surface.",
  ),
  grade: subgroupAdvice(
    HARDENED_SECTION,
    'CBN, le meilleur matériau pour le tournage dur ; sous 55 HRC environ, céramique ou carbure.',
  ),
  pitfalls: [
    subgroupAdvice(HARDENED_SECTION, 'Il faut une machine stable et un bridage solide.'),
    subgroupAdvice(
      HARDENED_SECTION,
      "Garde des profondeurs de coupe aussi petites que possible, pour un faible angle d'attaque.",
    ),
  ],
};

const STAGE_OF: Readonly<Record<TurningOperation, Sourced<string>>> = {
  'external-roughing': STAGE_GEOMETRY.roughing,
  'external-semi-finishing': STAGE_GEOMETRY.semiFinishing,
  'external-finishing': STAGE_GEOMETRY.finishing,
  'internal-roughing': STAGE_GEOMETRY.roughing,
  'internal-finishing': STAGE_GEOMETRY.finishing,
};

const external = (
  advice: SubgroupAdvice,
  operation: ExternalOperation,
  insert: IsoInsertDesignation<ExternalSituation>,
): RecommendationEntry => ({
  operation,
  materials: advice.materials,
  insert,
  geometry: [STAGE_OF[operation], advice.geometry],
  grade: advice.grade,
  pitfalls: advice.pitfalls,
});

const internal = (
  advice: SubgroupAdvice,
  operation: InternalOperation,
  insert: IsoInsertDesignation<InternalSituation>,
): RecommendationEntry => ({
  operation,
  materials: advice.materials,
  insert,
  geometry: [STAGE_OF[operation], INTERNAL_GEOMETRY, advice.geometry],
  grade: advice.grade,
  pitfalls: [...advice.pitfalls, INTERNAL_PITFALL],
});

const propose = <S extends InsertSituation>(
  { situation, shape }: Placed<S>,
  letter: ShapeLetter,
  rest: readonly [Field, Field, Field],
  ...principles: readonly SourceCitation[]
): IsoInsertProposal<S> => ({
  situation,
  choice: [shape, ...principles],
  fields: [SHAPE[letter], ...rest],
});

const imposed = <S extends InsertSituation>(
  situation: S,
  letter: ShapeLetter,
  rest: readonly [Field, Field, Field],
  rule: SourceCitation,
  ...principles: readonly SourceCitation[]
): IsoInsertProposal<S> => ({
  situation,
  choice: [rule, ...principles],
  fields: [SHAPE[letter], ...rest],
});

const iso = <S extends InsertSituation>(
  ...proposals: readonly [IsoInsertProposal<S>, ...IsoInsertProposal<S>[]]
): IsoInsertDesignation<S> => ({ kind: 'iso-1832', proposals });

const NMG = [CLEARANCE.N, TOLERANCE.M, FIXING.G] as const;
const NMA = [CLEARANCE.N, TOLERANCE.M, FIXING.A] as const;
const CMT = [CLEARANCE.C, TOLERANCE.M, FIXING.T] as const;
const CGT = [CLEARANCE.C, TOLERANCE.G, FIXING.T] as const;
const NGA = [CLEARANCE.N, TOLERANCE.G, FIXING.A] as const;

const steel = (stage: SourceCitation) =>
  ({
    shoulder: propose(EXTERNAL.shoulder, 'C', NMG, NEGATIVE, stage),
    noShoulder: propose(EXTERNAL.noShoulder, 'S', NMG, NEGATIVE, stage),
    profiling: propose(EXTERNAL.profiling, 'D', NMG, NEGATIVE, stage),
    steepProfiling: propose(EXTERNAL.steepProfiling, 'V', NMG, NEGATIVE, stage),
    facing: propose(EXTERNAL.facing, 'W', NMG, NEGATIVE, stage),
  }) as const;

const castIron = (stage: SourceCitation) =>
  ({
    shoulder: propose(EXTERNAL.shoulder, 'C', NMA, NEGATIVE_CLEARANCE, stage, CAST_IRON_FIXING),
    noShoulder: propose(EXTERNAL.noShoulder, 'S', NMA, NEGATIVE_CLEARANCE, stage, CAST_IRON_FIXING),
    profiling: propose(EXTERNAL.profiling, 'D', NMA, NEGATIVE_CLEARANCE, stage, CAST_IRON_FIXING),
  }) as const;

const positiveInside = (stage: SourceCitation) =>
  ({
    shoulder: propose(INTERNAL.shoulder, 'T', CMT, POSITIVE, stage),
    strongerEdge: propose(INTERNAL.strongerEdge, 'C', CMT, POSITIVE, stage),
    profiling: propose(INTERNAL.profiling, 'D', CMT, POSITIVE, stage),
  }) as const;

const austeniticOutside = (stage: SourceCitation): IsoInsertDesignation<ExternalSituation> =>
  iso<ExternalSituation>(
    propose(
      EXTERNAL.noShoulder,
      'S',
      CMT,
      AUSTENITIC_ANGLE,
      AUSTENITIC_SQUARE,
      AUSTENITIC_POSITIVE,
      POSITIVE,
      stage,
    ),
    imposed(
      'external-profiling',
      'R',
      CMT,
      AUSTENITIC_ANGLE,
      AUSTENITIC_ROUND,
      AUSTENITIC_POSITIVE,
      POSITIVE,
      stage,
    ),
  );

const austeniticInside = (stage: SourceCitation): IsoInsertDesignation<InternalSituation> =>
  iso<InternalSituation>(
    propose(INTERNAL.noShoulder, 'S', CMT, AUSTENITIC_ANGLE, AUSTENITIC_SQUARE, POSITIVE, stage),
  );

const duplexOutside = (stage: SourceCitation): IsoInsertDesignation<ExternalSituation> =>
  iso<ExternalSituation>(
    propose(EXTERNAL.noShoulder, 'S', NMG, DUPLEX_ANGLE, DUPLEX_SQUARE, NEGATIVE, stage),
  );

const duplexInside = (stage: SourceCitation): IsoInsertDesignation<InternalSituation> =>
  iso<InternalSituation>(
    propose(INTERNAL.noShoulder, 'S', CMT, DUPLEX_ANGLE, DUPLEX_SQUARE, POSITIVE, stage),
  );

const aluminiumOutside = {
  shoulder: propose(EXTERNAL.shoulder, 'C', CGT, ALUMINIUM_EDGE, ONE_SIDED),
  noShoulder: propose(EXTERNAL.noShoulder, 'S', CGT, ALUMINIUM_EDGE, ONE_SIDED),
  profiling: propose(EXTERNAL.profiling, 'D', CGT, ALUMINIUM_EDGE, ONE_SIDED),
} as const;

const aluminiumFinishingOutside = iso<ExternalSituation>(
  propose(EXTERNAL.shoulder, 'C', CGT, ALUMINIUM_FINISHING),
  propose(EXTERNAL.profiling, 'D', CGT, ALUMINIUM_FINISHING),
  propose(EXTERNAL.steepProfiling, 'V', CGT, ALUMINIUM_FINISHING),
);

const heatResistantOutside = iso<ExternalSituation>(
  imposed(
    'external-profiling',
    'R',
    CGT,
    HEAT_RESISTANT_ANGLE,
    HEAT_RESISTANT_ROUND,
    HEAT_RESISTANT_EDGE,
    ONE_SIDED,
  ),
);

const hardFinishing = iso<ExternalSituation>(
  propose(EXTERNAL.shoulder, 'C', NGA, NEGATIVE_CLEARANCE, HARD_TURNING_EDGE),
  propose(EXTERNAL.facing, 'W', NGA, NEGATIVE_CLEARANCE, HARD_TURNING_EDGE),
);

const steelRoughing = steel(ROUGHING_TOLERANCE);
const steelSemiFinishing = steel(SEMI_FINISHING_TOLERANCE);
const steelFinishing = steel(FINISHING_TOLERANCE);
const castIronRoughing = castIron(ROUGHING_TOLERANCE);
const castIronSemiFinishing = castIron(SEMI_FINISHING_TOLERANCE);
const castIronFinishing = castIron(FINISHING_TOLERANCE);
const insideRoughing = positiveInside(ROUGHING_TOLERANCE);
const insideFinishing = positiveInside(FINISHING_TOLERANCE);

const STEEL_ROUGHING = iso<ExternalSituation>(
  steelRoughing.shoulder,
  steelRoughing.noShoulder,
  steelRoughing.facing,
);
const STEEL_SEMI_FINISHING = iso<ExternalSituation>(
  steelSemiFinishing.shoulder,
  steelSemiFinishing.profiling,
  steelSemiFinishing.facing,
);
const STEEL_FINISHING = iso<ExternalSituation>(
  steelFinishing.shoulder,
  steelFinishing.profiling,
  steelFinishing.steepProfiling,
);
const STEEL_INSIDE_ROUGHING = iso<InternalSituation>(
  insideRoughing.strongerEdge,
  insideRoughing.shoulder,
);
const STEEL_INSIDE_FINISHING = iso<InternalSituation>(
  insideFinishing.shoulder,
  insideFinishing.profiling,
);

export const RECOMMENDATIONS: readonly RecommendationEntry[] = [
  ...[NON_ALLOYED_STEEL, LOW_ALLOYED_STEEL, FERRITIC_MARTENSITIC].flatMap((advice) => [
    external(advice, 'external-roughing', STEEL_ROUGHING),
    external(advice, 'external-semi-finishing', STEEL_SEMI_FINISHING),
    external(advice, 'external-finishing', STEEL_FINISHING),
    internal(advice, 'internal-roughing', STEEL_INSIDE_ROUGHING),
    internal(advice, 'internal-finishing', STEEL_INSIDE_FINISHING),
  ]),
  external(AUSTENITIC, 'external-roughing', austeniticOutside(ROUGHING_TOLERANCE)),
  external(AUSTENITIC, 'external-semi-finishing', austeniticOutside(SEMI_FINISHING_TOLERANCE)),
  external(AUSTENITIC, 'external-finishing', austeniticOutside(FINISHING_TOLERANCE)),
  internal(AUSTENITIC, 'internal-roughing', austeniticInside(ROUGHING_TOLERANCE)),
  internal(AUSTENITIC, 'internal-finishing', austeniticInside(FINISHING_TOLERANCE)),
  external(DUPLEX, 'external-roughing', duplexOutside(ROUGHING_TOLERANCE)),
  external(DUPLEX, 'external-semi-finishing', duplexOutside(SEMI_FINISHING_TOLERANCE)),
  external(DUPLEX, 'external-finishing', duplexOutside(FINISHING_TOLERANCE)),
  internal(DUPLEX, 'internal-roughing', duplexInside(ROUGHING_TOLERANCE)),
  internal(DUPLEX, 'internal-finishing', duplexInside(FINISHING_TOLERANCE)),
  external(
    CAST_IRON,
    'external-roughing',
    iso<ExternalSituation>(castIronRoughing.shoulder, castIronRoughing.noShoulder),
  ),
  external(
    CAST_IRON,
    'external-semi-finishing',
    iso<ExternalSituation>(castIronSemiFinishing.shoulder, castIronSemiFinishing.profiling),
  ),
  external(
    CAST_IRON,
    'external-finishing',
    iso<ExternalSituation>(castIronFinishing.shoulder, castIronFinishing.profiling),
  ),
  internal(CAST_IRON, 'internal-roughing', STEEL_INSIDE_ROUGHING),
  internal(CAST_IRON, 'internal-finishing', STEEL_INSIDE_FINISHING),
  external(
    ALUMINIUM,
    'external-roughing',
    iso<ExternalSituation>(
      aluminiumOutside.shoulder,
      aluminiumOutside.noShoulder,
      aluminiumOutside.profiling,
    ),
  ),
  external(
    ALUMINIUM,
    'external-semi-finishing',
    iso<ExternalSituation>(aluminiumOutside.shoulder, aluminiumOutside.profiling),
  ),
  external(ALUMINIUM, 'external-finishing', aluminiumFinishingOutside),
  internal(
    ALUMINIUM,
    'internal-roughing',
    iso<InternalSituation>(
      propose(INTERNAL.strongerEdge, 'C', CGT, ALUMINIUM_EDGE, ONE_SIDED),
      propose(INTERNAL.shoulder, 'T', CGT, ALUMINIUM_EDGE, ONE_SIDED),
      propose(INTERNAL.profiling, 'D', CGT, ALUMINIUM_EDGE, ONE_SIDED),
    ),
  ),
  internal(
    ALUMINIUM,
    'internal-finishing',
    iso<InternalSituation>(
      propose(INTERNAL.profiling, 'D', CGT, ALUMINIUM_FINISHING),
      propose(INTERNAL.strongerEdge, 'C', CGT, ALUMINIUM_FINISHING),
    ),
  ),
  external(HEAT_RESISTANT, 'external-roughing', heatResistantOutside),
  external(HEAT_RESISTANT, 'external-semi-finishing', heatResistantOutside),
  external(HEAT_RESISTANT, 'external-finishing', heatResistantOutside),
  external(HARDENED, 'external-finishing', hardFinishing),
];
