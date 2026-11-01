export type SystemColorScheme = {
  readonly set: (prefersDark: boolean) => void;
  readonly restore: () => void;
};

type Listener = (event: MediaQueryListEvent) => void;

export function installSystemColorScheme(prefersDark: boolean): SystemColorScheme {
  const view = window;
  const original = view.matchMedia;
  const listeners = new Map<string, Set<Listener>>();
  let dark = prefersDark;

  const matchesFor = (query: string): boolean => {
    if (query.includes('prefers-color-scheme: dark')) return dark;
    if (query.includes('prefers-color-scheme: light')) return !dark;
    return false;
  };

  const listenersOf = (query: string): Set<Listener> => {
    const existing = listeners.get(query);
    if (existing) return existing;
    const created = new Set<Listener>();
    listeners.set(query, created);
    return created;
  };

  view.matchMedia = (query: string): MediaQueryList => {
    const queryListeners = listenersOf(query);
    return {
      media: query,
      get matches(): boolean {
        return matchesFor(query);
      },
      onchange: null,
      addEventListener: (_type: string, listener: Listener): void => {
        queryListeners.add(listener);
      },
      removeEventListener: (_type: string, listener: Listener): void => {
        queryListeners.delete(listener);
      },
      addListener: (listener: Listener): void => {
        queryListeners.add(listener);
      },
      removeListener: (listener: Listener): void => {
        queryListeners.delete(listener);
      },
      dispatchEvent: (): boolean => true,
    } as unknown as MediaQueryList;
  };

  return {
    set: (next: boolean): void => {
      dark = next;
      for (const [query, queryListeners] of listeners) {
        const event = { matches: matchesFor(query), media: query } as MediaQueryListEvent;
        queryListeners.forEach((listener) => listener(event));
      }
    },
    restore: (): void => {
      view.matchMedia = original;
    },
  };
}
