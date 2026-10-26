import { describe, expect, it } from 'vitest';
import { INSERT_GUIDE_COPY } from './insert-guide-copy';

describe('INSERT_GUIDE_COPY', () => {
  it('Given the guide copy When it is read Then every interface text is the proposed one', () => {
    expect(INSERT_GUIDE_COPY).toEqual({
      heading: 'Guide des plaquettes',
      lead: "Choisis ta matière et ton opération : le guide t'indique le type de plaquette à prendre.",
      disclaimer:
        'Recommandation indicative : elle ne remplace ni le catalogue de ton outil ni ton expérience.',
      materialHeading: 'La matière',
      materialLabel: 'Matière',
      materialHint:
        'Tape une désignation : EN, numéro matière, AISI, UNS, ancienne AFNOR ou nom courant.',
      materialListLabel: 'Matières suggérées',
      materialFound: 'matière trouvée',
      materialsFound: 'matières trouvées',
      noMaterialFound: 'Aucune matière trouvée',
      materialNotInGuide: "Cette matière n'est pas encore dans le guide.",
      isoGroup: 'Groupe ISO',
      source: 'Source :',
      newTab: '(nouvel onglet)',
      operationHeading: "L'opération",
      operationLegend: 'Opération',
      recommendationHeading: 'La plaquette',
      incomplete: 'Choisis une matière et une opération.',
      unavailable: 'Pas encore de recommandation pour ce cas.',
      deduced: 'déduit des principes du fabricant',
      groupAdvice: 'conseil du groupe',
      subgroupAdvice: 'conseil du sous-groupe',
      designationsHeading: 'Correspondances indicatives',
      insertHeading: 'Plaquette',
      geometryHeading: 'Géométrie',
      gradeHeading: 'Nuance',
      pitfallsHeading: 'Pièges',
      proposedInsert: 'Plaquette proposée\u00a0:',
      proposedInserts: 'Plaquettes proposées\u00a0:',
      situations: {
        'external-shoulder': 'Chariotage avec épaulement',
        'external-no-shoulder': 'Chariotage sans épaulement',
        'external-profiling': 'Profilage',
        'external-steep-profiling': 'Profilage à forte rampe',
        'external-facing': 'Dressage',
        'internal-shoulder': 'Chariotage avec épaulement',
        'internal-stronger-edge': 'Avec épaulement, arête plus résistante',
        'internal-no-shoulder': 'Chariotage sans épaulement',
        'internal-profiling': 'Profilage',
      },
      designationSystems: {
        'en-symbol': 'Symbole EN',
        'material-number': 'Numéro matière',
        aisi: 'AISI',
        uns: 'UNS',
        'afnor-legacy': 'Ancienne AFNOR',
        'common-name': 'Nom courant',
      },
    });
  });
});
