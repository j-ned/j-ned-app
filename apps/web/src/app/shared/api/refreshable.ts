import {
  catchError,
  defer,
  EMPTY,
  ReplaySubject,
  share,
  startWith,
  Subject,
  switchMap,
  tap,
  type Observable,
} from 'rxjs';

export function refreshable<T>(load: (background: boolean) => Observable<T>): {
  readonly value$: Observable<T>;
  readonly refresh: () => void;
} {
  const refresh$ = new Subject<void>();
  return {
    value$: defer(() => {
      let shown = false;
      return refresh$.pipe(
        startWith(undefined),
        // Une relecture qui échoue garde la valeur affichée : la suivante la remplacera.
        switchMap(() => (shown ? load(true).pipe(catchError(() => EMPTY)) : load(false))),
        tap(() => (shown = true)),
      );
    }).pipe(
      // Un échec n'est jamais gardé : le prochain lecteur, ou un `refresh()`, refait la requête.
      share({
        connector: () => new ReplaySubject<T>(1),
        resetOnError: true,
        resetOnComplete: false,
        resetOnRefCountZero: false,
      }),
    ),
    refresh: () => refresh$.next(),
  };
}
