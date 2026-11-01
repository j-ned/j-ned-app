import { makeCvInfo } from '@features/cv/testing/cv-builders';
import { toCvRows } from './admin-cv-view';

describe('toCvRows', () => {
  it.each([
    {
      case: 'a 76 Ko PDF never downloaded',
      uploadedAt: '2026-09-19T10:00:00.000Z',
      fileSize: 77_824,
      downloads: 0,
      rows: [
        { label: 'Mis en ligne', value: '19 sept. 2026' },
        { label: 'Taille', value: '76 Ko' },
        { label: 'Téléchargé', value: '0 fois en 30\u00a0j' },
      ],
    },
    {
      case: 'a PDF uploaded on the first of the month, downloaded once',
      uploadedAt: '2026-10-01T10:00:00.000Z',
      fileSize: 1_258_291,
      downloads: 1,
      rows: [
        { label: 'Mis en ligne', value: '1er oct. 2026' },
        { label: 'Taille', value: '1,2 Mo' },
        { label: 'Téléchargé', value: '1 fois en 30\u00a0j' },
      ],
    },
    {
      case: 'a small PDF downloaded more than a thousand times',
      uploadedAt: '2026-03-05T10:00:00.000Z',
      fileSize: 512,
      downloads: 1234,
      rows: [
        { label: 'Mis en ligne', value: '5 mars 2026' },
        { label: 'Taille', value: '512 o' },
        { label: 'Téléchargé', value: '1\u202f234 fois en 30\u00a0j' },
      ],
    },
    {
      case: 'a PDF whose download count is unavailable',
      uploadedAt: '2026-09-19T10:00:00.000Z',
      fileSize: 77_824,
      downloads: null,
      rows: [
        { label: 'Mis en ligne', value: '19 sept. 2026' },
        { label: 'Taille', value: '76 Ko' },
        { label: 'Téléchargé', value: 'indisponible' },
      ],
    },
  ])(
    'Given $case When the cartouche rows are built Then they read upload day, size and downloads',
    ({ uploadedAt, fileSize, downloads, rows }) => {
      expect(toCvRows(makeCvInfo({ uploadedAt, fileSize }), downloads)).toEqual(rows);
    },
  );
});
