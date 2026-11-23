export type SystemColorScheme = {
  readonly set: (prefersDark: boolean) => void;
  readonly restore: () => void;
};

type ChangeListener = (this: MediaQueryList, event: MediaQueryListEvent) => unknown;

// lib.dom ne fournit pas de `MediaQueryListEvent` constructible dans tous les environnements : un
// `Event` réel complété de ses deux membres propres.
function mediaQueryListEvent(media: string, matches: boolean): MediaQueryListEvent {
  return Object.assign(new Event('change'), { matches, media });
}

// Vrai `EventTarget` : `addEventListener`, `removeEventListener` et `dispatchEvent` sont ceux du DOM,
// seul l'état propre à `MediaQueryList` est simulé. `addListener` (API dépréciée) écoute `change`,
// comme dans un navigateur.
class FakeMediaQueryList extends EventTarget implements MediaQueryList {
  onchange: ChangeListener | null = null;
  private readonly _legacyRelays = new Map<ChangeListener, EventListener>();

  constructor(
    readonly media: string,
    private readonly _matchesNow: () => boolean,
  ) {
    super();
  }

  get matches(): boolean {
    return this._matchesNow();
  }

  addListener(listener: ChangeListener | null): void {
    if (!listener || this._legacyRelays.has(listener)) return;
    const relay = (): void => {
      listener.call(this, mediaQueryListEvent(this.media, this.matches));
    };
    this._legacyRelays.set(listener, relay);
    this.addEventListener('change', relay);
  }

  removeListener(listener: ChangeListener | null): void {
    const relay = listener ? this._legacyRelays.get(listener) : undefined;
    if (!listener || !relay) return;
    this._legacyRelays.delete(listener);
    this.removeEventListener('change', relay);
  }

  notifyChange(): void {
    this.dispatchEvent(mediaQueryListEvent(this.media, this.matches));
  }
}

export function installSystemColorScheme(prefersDark: boolean): SystemColorScheme {
  const view = window;
  const original = view.matchMedia;
  const lists = new Set<FakeMediaQueryList>();
  let dark = prefersDark;

  const matchesFor = (query: string): boolean => {
    if (query.includes('prefers-color-scheme: dark')) return dark;
    if (query.includes('prefers-color-scheme: light')) return !dark;
    return false;
  };

  view.matchMedia = (query: string): MediaQueryList => {
    const list = new FakeMediaQueryList(query, () => matchesFor(query));
    lists.add(list);
    return list;
  };

  return {
    set: (next: boolean): void => {
      dark = next;
      lists.forEach((list) => list.notifyChange());
    },
    restore: (): void => {
      view.matchMedia = original;
    },
  };
}
