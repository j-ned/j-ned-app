import type { Source, SourceId } from './models/source.model';

const SANDVIK_COROMANT = 'Sandvik Coromant';
const CONSULTED_ON = '2026-10-26';

export const SOURCES: Readonly<Record<SourceId, Source>> = {
  'sandvik-choose-insert': {
    title: 'Comment choisir une plaquette de tournage correcte',
    publisher: SANDVIK_COROMANT,
    url: 'https://www.sandvik.coromant.com/fr-fr/knowledge/general-turning/how-to-choose-correct-turning-insert',
    consultedOn: CONSULTED_ON,
  },
  'sandvik-external-turning': {
    title: 'Tournage extérieur',
    publisher: SANDVIK_COROMANT,
    url: 'https://www.sandvik.coromant.com/fr-fr/knowledge/general-turning/external-turning',
    consultedOn: CONSULTED_ON,
  },
  'sandvik-internal-turning': {
    title: 'Tournage intérieur',
    publisher: SANDVIK_COROMANT,
    url: 'https://www.sandvik.coromant.com/fr-fr/knowledge/general-turning/internal-turning',
    consultedOn: CONSULTED_ON,
  },
  'sandvik-turning-materials': {
    title: 'Tournage de différentes matières',
    publisher: SANDVIK_COROMANT,
    url: 'https://www.sandvik.coromant.com/fr-fr/knowledge/general-turning/how-to-do-turning-in-different-materials',
    consultedOn: CONSULTED_ON,
  },
  'sandvik-workpiece-materials': {
    title: 'Matériaux de pièce',
    publisher: SANDVIK_COROMANT,
    url: 'https://www.sandvik.coromant.com/fr-fr/knowledge/materials/workpiece-materials',
    consultedOn: CONSULTED_ON,
  },
  'mitsubishi-insert-identification': {
    title: 'Turning Insert Identification',
    publisher: 'Mitsubishi Materials',
    url: 'https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning/tip_sensaku.html',
    consultedOn: CONSULTED_ON,
  },
  'kyocera-turning-inserts': {
    title: 'Turning Indexable Inserts',
    publisher: 'Kyocera',
    url: 'https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf',
    consultedOn: CONSULTED_ON,
  },
  'kyocera-aluminium-finishing': {
    title: "Plaquettes positives pour la finition de l'aluminium",
    publisher: 'Kyocera',
    url: 'https://tool-global.kyocera.com/en/prdct/tool/product/ap.php',
    consultedOn: CONSULTED_ON,
  },
  'julien-working-list': {
    title: 'Liste de travail de Julien — correspondances indicatives',
    publisher: 'Julien Nédellec',
    consultedOn: CONSULTED_ON,
  },
};
