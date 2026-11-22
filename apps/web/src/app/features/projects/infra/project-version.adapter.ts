import type { HttpHeaders } from '@angular/common/http';

const STRONG_VERSION_TAG = /^"([1-9][0-9]{0,9})"$/;

// `ETag` fort d'une écriture de galerie : la version du projet. Absent ou d'une autre forme : `null`,
// jamais une valeur devinée.
export function projectVersionOf(headers: HttpHeaders): number | null {
  const match = STRONG_VERSION_TAG.exec(headers.get('ETag') ?? '');
  return match?.[1] === undefined ? null : Number(match[1]);
}
