// happy-dom ne calcule aucune géométrie : le test décide lui-même quand une cible entre dans le viewport.
export class FakeIntersectionObserver implements IntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];

  readonly root: Element | Document | null;
  readonly rootMargin: string;
  readonly scrollMargin: string;
  readonly thresholds: readonly number[];
  readonly observed: Element[] = [];
  disconnected = false;

  constructor(
    private readonly _callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    this.root = options?.root ?? null;
    this.rootMargin = options?.rootMargin ?? '0px';
    this.scrollMargin = options?.scrollMargin ?? '0px';
    const threshold = options?.threshold ?? 0;
    this.thresholds = typeof threshold === 'number' ? [threshold] : threshold;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.observed.push(element);
  }

  // Appelé par Angular à la destruction d'un bloc `@defer (on viewport)`.
  unobserve(element: Element): void {
    const index = this.observed.indexOf(element);
    if (index !== -1) this.observed.splice(index, 1);
  }

  disconnect(): void {
    this.disconnected = true;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  emit(isIntersecting: boolean): void {
    const target = this.observed[0];
    if (target === undefined) {
      throw new Error('FakeIntersectionObserver.emit: aucune cible observée');
    }
    this._callback([intersectionEntry(target, isIntersecting)], this);
  }
}

function intersectionEntry(target: Element, isIntersecting: boolean): IntersectionObserverEntry {
  const rect = new DOMRectReadOnly();
  return {
    target,
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    boundingClientRect: rect,
    intersectionRect: rect,
    rootBounds: null,
    time: 0,
  };
}
