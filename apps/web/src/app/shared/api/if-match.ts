import { HttpHeaders } from '@angular/common/http';

// ETag fort de l'API : la version entre guillemets. Sans version, l'écriture reste inconditionnelle.
export function ifMatch(version: number | undefined): HttpHeaders {
  return version === undefined
    ? new HttpHeaders()
    : new HttpHeaders({ 'If-Match': `"${version}"` });
}
