import { map, of, switchMap, type Observable } from 'rxjs';
import { pager } from './pager';

// Une suppression ou une purge faite entre deux clics peut retirer la page demandée : on retombe
// alors sur la nouvelle dernière page plutôt que d'afficher une page vide.
export function loadWithinLastPage<T extends { readonly total: number }>(
  page: number,
  pageSize: number,
  load: (page: number) => Observable<T>,
): Observable<T & { readonly page: number }> {
  return load(page).pipe(
    switchMap((loaded) => {
      const lastPage = pager(loaded.total, page, pageSize).pageCount;
      return page <= lastPage
        ? of({ ...loaded, page })
        : load(lastPage).pipe(map((fallback) => ({ ...fallback, page: lastPage })));
    }),
  );
}
