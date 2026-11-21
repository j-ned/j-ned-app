import { ReplaySubject, share, startWith, Subject, switchMap, type Observable } from 'rxjs';

export function refreshable<T>(load: () => Observable<T>): {
  readonly value$: Observable<T>;
  readonly refresh: () => void;
} {
  const refresh$ = new Subject<void>();
  return {
    value$: refresh$.pipe(
      startWith(undefined),
      switchMap(load),
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
