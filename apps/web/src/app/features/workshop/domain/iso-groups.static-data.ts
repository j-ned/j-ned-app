import type { IsoGroup, IsoGroupLetter } from './models/material.model';
import type { SourceCitation } from './models/source.model';

const GROUP_LIST: SourceCitation = {
  source: 'sandvik-workpiece-materials',
  locator: 'section «\u00a0Groupes de matières usinées\u00a0»',
  basis: 'stated',
};

export const ISO_513_GROUPS: Readonly<Record<IsoGroupLetter, IsoGroup>> = {
  P: { letter: 'P', name: { value: 'Acier', cite: GROUP_LIST } },
  M: { letter: 'M', name: { value: 'Acier inoxydable', cite: GROUP_LIST } },
  K: { letter: 'K', name: { value: 'Fonte', cite: GROUP_LIST } },
  N: { letter: 'N', name: { value: 'Métaux non ferreux', cite: GROUP_LIST } },
  S: { letter: 'S', name: { value: 'Super-alliages et titane', cite: GROUP_LIST } },
  H: { letter: 'H', name: { value: 'Matériau dur', cite: GROUP_LIST } },
};
