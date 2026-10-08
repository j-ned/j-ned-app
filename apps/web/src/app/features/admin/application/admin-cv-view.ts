import type { CvInfo } from '@features/cv/domain/models/cv.model';
import { formatFileSize } from '@shared/format/format-file-size';
import { groupedNumber } from '@shared/format/grouped-number';
import type { CartoucheRow } from '@shared/ui/cartouche';
import { withFirstOfMonth } from './with-first-of-month';

const DAY_MONTH_YEAR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatUploadDay(cv: CvInfo): string {
  return withFirstOfMonth(DAY_MONTH_YEAR, new Date(cv.uploadedAt));
}

export function toCvRows(cv: CvInfo, downloads: number | null): readonly CartoucheRow[] {
  return [
    { label: 'Mis en ligne', value: formatUploadDay(cv) },
    { label: 'Taille', value: formatFileSize(cv.fileSize) },
    {
      label: 'Téléchargé',
      value: downloads === null ? 'indisponible' : `${groupedNumber(downloads)} fois en 30\u00a0j`,
    },
  ];
}
