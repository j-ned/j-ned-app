import type {
  InsertClearanceCode,
  InsertFixingCode,
  InsertNoseRadiusCode,
  InsertShapeCode,
  InsertThicknessCode,
  InsertToleranceCode,
  Iso1832LetterTable,
  Iso1832SizeTable,
  Iso1832Source,
} from './models/insert-code.model';

// Seules les valeurs écrites à l'identique par Mitsubishi Materials et Kyocera : la norme ISO 1832, payante, n'a pas été lue.
const MMC_TURNING =
  'https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning';

const mitsubishi = (title: string, url: string): Iso1832Source => ({
  publisher: 'Mitsubishi Materials',
  title: `Turning Insert Identification, ${title}`,
  url,
});

const KYOCERA_B1: Iso1832Source = {
  publisher: 'Kyocera',
  title: 'Turning Indexable Inserts, p. B1, Identification System',
  url: 'https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf',
};

const SINTERED = ', périphérie brute de frittage';

const tolerance = (
  code: InsertToleranceCode,
  noseHeight: string,
  inscribedCircle: string,
  thickness: string,
  periphery = '',
): string =>
  `Classe ${code}\u00a0: hauteur de bec ±${noseHeight}\u00a0mm, cercle inscrit ±${inscribedCircle}\u00a0mm, épaisseur ±${thickness}\u00a0mm${periphery}`;

export const ISO_1832_SHAPES: Iso1832LetterTable<InsertShapeCode> = {
  position: 1,
  label: 'Forme',
  sources: [mitsubishi('Insert Shape', `${MMC_TURNING}/keijou.html`), KYOCERA_B1],
  entries: {
    A: 'Parallélogramme 85°',
    B: 'Parallélogramme 82°',
    C: 'Losange 80°',
    D: 'Losange 55°',
    E: 'Losange 75°',
    F: 'Losange 50°',
    H: 'Hexagone',
    K: 'Parallélogramme 55°',
    L: 'Rectangle',
    M: 'Losange 86°',
    O: 'Octogone',
    P: 'Pentagone',
    R: 'Rond',
    S: 'Carré (90°)',
    T: 'Triangle (60°)',
    V: 'Losange 35°',
    W: 'Trigone',
  },
};

export const ISO_1832_CLEARANCES: Iso1832LetterTable<InsertClearanceCode> = {
  position: 2,
  label: 'Dépouille',
  sources: [mitsubishi('Normal Clearance', `${MMC_TURNING}/nigekaku.html`), KYOCERA_B1],
  entries: {
    A: 'Dépouille 3°',
    B: 'Dépouille 5°',
    C: 'Dépouille 7°',
    D: 'Dépouille 15°',
    E: 'Dépouille 20°',
    F: 'Dépouille 25°',
    G: 'Dépouille 30°',
    N: 'Dépouille 0°',
    P: 'Dépouille 11°',
  },
};

export const ISO_1832_TOLERANCES: Iso1832LetterTable<InsertToleranceCode> = {
  position: 3,
  label: 'Tolérance',
  sources: [
    mitsubishi(
      'Tolerance Class',
      'https://mitsubishicarbide.net/contents/mhg/ru/html/product/product_guide/information/turning/seido.html',
    ),
    KYOCERA_B1,
  ],
  entries: {
    A: tolerance('A', '0,005', '0,025', '0,025'),
    F: tolerance('F', '0,005', '0,013', '0,025'),
    C: tolerance('C', '0,013', '0,025', '0,025'),
    H: tolerance('H', '0,013', '0,013', '0,025'),
    E: tolerance('E', '0,025', '0,025', '0,025'),
    G: tolerance('G', '0,025', '0,025', '0,13'),
    J: tolerance('J', '0,005', '0,05 à ±0,15', '0,025'),
    K: tolerance('K', '0,013', '0,05 à ±0,15', '0,025', SINTERED),
    L: tolerance('L', '0,025', '0,05 à ±0,15', '0,025', SINTERED),
    M: tolerance('M', '0,08 à ±0,18', '0,05 à ±0,15', '0,13', SINTERED),
    N: tolerance('N', '0,08 à ±0,18', '0,05 à ±0,15', '0,025', SINTERED),
    U: tolerance('U', '0,13 à ±0,38', '0,08 à ±0,25', '0,13', SINTERED),
  },
};

// Mitsubishi laisse vide la forme du trou de T, U, H et J : leurs fraisures, écrites par Kyocera seul, sont tues.
export const ISO_1832_FIXINGS: Iso1832LetterTable<InsertFixingCode> = {
  position: 4,
  label: 'Fixation et brise-copeaux',
  sources: [mitsubishi('Hole and Chip Breaker', `${MMC_TURNING}/mizo.html`), KYOCERA_B1],
  entries: {
    N: 'Sans trou, sans brise-copeaux',
    R: 'Sans trou, brise-copeaux une face',
    F: 'Sans trou, brise-copeaux deux faces',
    A: 'Trou cylindrique, sans brise-copeaux',
    M: 'Trou cylindrique, brise-copeaux une face',
    G: 'Trou cylindrique, brise-copeaux deux faces',
    W: 'Trou cylindrique avec une fraisure de 40 à 60°, sans brise-copeaux',
    T: 'Trou de fixation, brise-copeaux une face',
    Q: 'Trou cylindrique avec deux fraisures de 40 à 60°, sans brise-copeaux',
    U: 'Trou de fixation, brise-copeaux deux faces',
    B: 'Trou cylindrique avec une fraisure de 70 à 90°, sans brise-copeaux',
    H: 'Trou de fixation, brise-copeaux une face',
    C: 'Trou cylindrique avec deux fraisures de 70 à 90°, sans brise-copeaux',
    J: 'Trou de fixation, brise-copeaux deux faces',
    X: 'Conception spéciale',
  },
};

// Ligne 7,94 mm et diamètres des plaquettes rondes mal extraits chez Kyocera : non reconnus.
export const ISO_1832_SIZES: Iso1832SizeTable = {
  position: 5,
  label: 'Taille',
  sources: [
    mitsubishi('Inscribed Circle', `${MMC_TURNING}/naisetsu.html`),
    {
      publisher: 'Mitsubishi Materials',
      title: 'Insert turning identification code (cours)',
      url: 'https://www.mmc-carbide.com/permanent/courses/85/insert-turning-identification-code.html',
    },
    KYOCERA_B1,
  ],
  inscribedCircles: {
    C: { '06': '6,35', '09': '9,525', '12': '12,70', '16': '15,875', '19': '19,05', '25': '25,40' },
    D: { '07': '6,35', '11': '9,525', '15': '12,70', '19': '15,875', '23': '19,05', '31': '25,40' },
    S: { '06': '6,35', '09': '9,525', '12': '12,70', '15': '15,875', '19': '19,05', '25': '25,40' },
    T: { '11': '6,35', '16': '9,525', '22': '12,70', '27': '15,875', '33': '19,05', '44': '25,40' },
    V: { '11': '6,35', '16': '9,525', '22': '12,70', '27': '15,875', '33': '19,05', '44': '25,40' },
    W: { '04': '6,35', '06': '9,525', '08': '12,70', '10': '15,875', '13': '19,05', '17': '25,40' },
  },
};

export const ISO_1832_THICKNESSES: Iso1832LetterTable<InsertThicknessCode> = {
  position: 6,
  label: 'Épaisseur',
  sources: [mitsubishi('Thickness', `${MMC_TURNING}/swindow/tip_atsusa.html`), KYOCERA_B1],
  entries: {
    '01': 'Épaisseur 1,59\u00a0mm',
    '02': 'Épaisseur 2,38\u00a0mm',
    T2: 'Épaisseur 2,78\u00a0mm',
    '03': 'Épaisseur 3,18\u00a0mm',
    T3: 'Épaisseur 3,97\u00a0mm',
    '04': 'Épaisseur 4,76\u00a0mm',
    '06': 'Épaisseur 6,35\u00a0mm',
    '07': 'Épaisseur 7,94\u00a0mm',
    '09': 'Épaisseur 9,52\u00a0mm',
  },
};

export const ISO_1832_NOSE_RADII: Iso1832LetterTable<InsertNoseRadiusCode> = {
  position: 7,
  label: 'Rayon de bec',
  sources: [mitsubishi('Corner Radius', `${MMC_TURNING}/swindow/tip_corner.html`), KYOCERA_B1],
  entries: {
    '00': 'Bec vif',
    '01': 'Rayon de bec 0,1\u00a0mm',
    '02': 'Rayon de bec 0,2\u00a0mm',
    '04': 'Rayon de bec 0,4\u00a0mm',
    '08': 'Rayon de bec 0,8\u00a0mm',
    '12': 'Rayon de bec 1,2\u00a0mm',
    '16': 'Rayon de bec 1,6\u00a0mm',
    '20': 'Rayon de bec 2\u00a0mm',
    '24': 'Rayon de bec 2,4\u00a0mm',
    '28': 'Rayon de bec 2,8\u00a0mm',
    '32': 'Rayon de bec 3,2\u00a0mm',
  },
};
