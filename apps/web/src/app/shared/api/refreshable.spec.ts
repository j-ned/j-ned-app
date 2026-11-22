import { Subject, type Observable } from 'rxjs';
import { refreshable } from './refreshable';

type Load = { readonly next: (value: number) => void; readonly fail: () => void };

// Chaque lecture est une source pilotée à la main : le test décide quand elle répond.
function controlledLoads(): { readonly load: () => Observable<number>; readonly loads: Load[] } {
  const loads: Load[] = [];
  return {
    loads,
    load: (): Observable<number> => {
      const source = new Subject<number>();
      loads.push({
        next: (value) => {
          source.next(value);
          source.complete();
        },
        fail: () => source.error(new Error('lecture en échec')),
      });
      return source;
    },
  };
}

function lastLoad(loads: readonly Load[]): Load {
  const load = loads.at(-1);
  if (!load) throw new Error('aucune lecture lancée');
  return load;
}

describe('refreshable', () => {
  it('Given a value shown When a refresh fails Then the reader keeps the value and receives no error', () => {
    const { load, loads } = controlledLoads();
    const cache = refreshable(load);
    const seen: number[] = [];
    const errors: unknown[] = [];
    const sub = cache.value$.subscribe({ next: (v) => seen.push(v), error: (e) => errors.push(e) });
    lastLoad(loads).next(1);

    cache.refresh();
    lastLoad(loads).fail();

    expect({ seen, errors }).toEqual({ seen: [1], errors: [] });
    sub.unsubscribe();
  });

  it('Given a refresh that failed When the next refresh succeeds Then the reader receives the new value', () => {
    const { load, loads } = controlledLoads();
    const cache = refreshable(load);
    const seen: number[] = [];
    const sub = cache.value$.subscribe((v) => seen.push(v));
    lastLoad(loads).next(1);
    cache.refresh();
    lastLoad(loads).fail();

    cache.refresh();
    lastLoad(loads).next(2);

    expect(seen).toEqual([1, 2]);
    sub.unsubscribe();
  });

  it('Given no value yet When the first read fails Then the reader receives the error', () => {
    const { load, loads } = controlledLoads();
    const cache = refreshable(load);
    const errors: unknown[] = [];
    cache.value$.subscribe({ error: (e) => errors.push(e) });

    lastLoad(loads).fail();

    expect(errors).toHaveLength(1);
  });

  it('Given the first read still pending When a refresh replaces it and fails Then the reader receives the error instead of waiting forever', () => {
    const { load, loads } = controlledLoads();
    const cache = refreshable(load);
    const errors: unknown[] = [];
    cache.value$.subscribe({ error: (e) => errors.push(e) });

    cache.refresh();
    lastLoad(loads).fail();

    expect(errors).toHaveLength(1);
  });
});
