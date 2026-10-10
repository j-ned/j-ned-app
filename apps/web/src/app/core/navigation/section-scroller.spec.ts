import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi, type Mock } from 'vitest';
import { OFFER_REQUEST_FRAGMENT } from '@features/offer/domain/offer-path';
import { REQUEST_ANCHOR_DATA_KEY, SectionScroller } from './section-scroller';

type FakeElement = {
  offsetHeight: number;
  scrollIntoView: Mock;
  focus: Mock;
  getBoundingClientRect: () => { top: number };
  hasAttribute: (name: string) => boolean;
  setAttribute: (name: string, value: string) => void;
};

function makeElement(opts: { offsetHeight?: number; top?: number } = {}): FakeElement {
  const attrs = new Map<string, string>();
  return {
    offsetHeight: opts.offsetHeight ?? 400,
    scrollIntoView: vi.fn(),
    focus: vi.fn(),
    getBoundingClientRect: () => ({ top: opts.top ?? 1000 }),
    hasAttribute: (name) => attrs.has(name),
    setAttribute: (name, value) => void attrs.set(name, value),
  };
}

type FakeDocument = {
  getElementById: Mock;
  documentElement: { scrollHeight: number };
  defaultView: {
    innerHeight: number;
    scrollY: number;
    scrollTo: Mock;
    matchMedia: Mock;
    requestAnimationFrame: (cb: FrameRequestCallback) => number;
  };
};

function makeDocument(opts: {
  element?: FakeElement | null;
  reduced?: boolean;
  innerHeight?: number;
}): FakeDocument {
  return {
    getElementById: vi.fn().mockReturnValue(opts.element ?? null),
    documentElement: { scrollHeight: 2000 },
    defaultView: {
      innerHeight: opts.innerHeight ?? 800,
      scrollY: 0,
      scrollTo: vi.fn(),
      matchMedia: vi.fn().mockReturnValue({ matches: !!opts.reduced }),
      requestAnimationFrame: (cb: FrameRequestCallback): number => {
        cb(0);
        return 0;
      },
    },
  };
}

type FakeRouteSnapshot = {
  readonly data: Readonly<Record<string, unknown>>;
  readonly firstChild: FakeRouteSnapshot | null;
};

type FakeRouter = {
  url: string;
  navigateByUrl: Mock;
  routerState: { snapshot: { root: FakeRouteSnapshot } };
};

const routeChain = (...levels: readonly Readonly<Record<string, unknown>>[]): FakeRouteSnapshot =>
  levels.reduceRight<FakeRouteSnapshot | null>(
    (child, data) => ({ data, firstChild: child }),
    null,
  ) ?? { data: {}, firstChild: null };

function makeRouter(url: string, root: FakeRouteSnapshot = routeChain({})): FakeRouter {
  return {
    url,
    navigateByUrl: vi.fn().mockResolvedValue(true),
    routerState: { snapshot: { root } },
  };
}

function setup(opts: {
  platform?: 'browser' | 'server';
  router: FakeRouter;
  document: FakeDocument;
}): SectionScroller {
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: opts.platform ?? 'browser' },
      { provide: Router, useValue: opts.router },
      { provide: DOCUMENT, useValue: opts.document },
    ],
  });
  return TestBed.inject(SectionScroller);
}

describe('SectionScroller', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  describe('scrollTo', () => {
    it('Given the server platform, When called, Then it is a no-op', () => {
      const router = makeRouter('/');
      const document = makeDocument({ element: makeElement() });
      const scroller = setup({ platform: 'server', router, document });

      scroller.scrollTo('contact');

      expect(document.getElementById).not.toHaveBeenCalled();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(scroller.eager()).toBe(false);
    });

    it('Given the first scroll, When called, Then it forces deferred sections to render', () => {
      const router = makeRouter('/');
      const document = makeDocument({ element: makeElement() });
      const scroller = setup({ router, document });

      scroller.scrollTo('contact');

      expect(scroller.eager()).toBe(true);
    });

    it('Given a section that fits below the header, When called, Then it scrolls it centered', () => {
      // innerHeight 800, header 80 -> available 720 ; element 400 fits.
      // offset = 80 + (720 - 400) / 2 = 240 ; top = (0 + 1000) - 240 = 760.
      const element = makeElement({ offsetHeight: 400, top: 1000 });
      const router = makeRouter('/');
      const document = makeDocument({ element });
      const scroller = setup({ router, document });

      scroller.scrollTo('contact');

      expect(document.defaultView.scrollTo).toHaveBeenCalledWith({ top: 760, behavior: 'smooth' });
    });

    it('Given a section taller than the viewport, When called, Then it aligns it under the header', () => {
      // element 1200 > available 720 -> offset = 80 ; top = 1000 - 80 = 920.
      const element = makeElement({ offsetHeight: 1200, top: 1000 });
      const router = makeRouter('/');
      const document = makeDocument({ element });
      const scroller = setup({ router, document });

      scroller.scrollTo('contact');

      expect(document.defaultView.scrollTo).toHaveBeenCalledWith({ top: 920, behavior: 'smooth' });
    });

    it('Given it runs, When the section is found, Then it moves focus to it', () => {
      const element = makeElement();
      const router = makeRouter('/');
      const document = makeDocument({ element });
      const scroller = setup({ router, document });

      scroller.scrollTo('contact');

      expect(element.focus).toHaveBeenCalledWith({ preventScroll: true });
    });

    it('Given reduced-motion is preferred, When called, Then it jumps instantly', () => {
      const element = makeElement({ offsetHeight: 400, top: 1000 });
      const router = makeRouter('/');
      const document = makeDocument({ element, reduced: true });
      const scroller = setup({ router, document });

      scroller.scrollTo('contact');

      expect(document.defaultView.scrollTo).toHaveBeenCalledWith({ top: 760, behavior: 'auto' });
    });

    it('Given another route, When called, Then it navigates home then scrolls', async () => {
      const element = makeElement();
      const router = makeRouter('/projects');
      const document = makeDocument({ element });
      const scroller = setup({ router, document });

      scroller.scrollTo('contact');

      expect(router.navigateByUrl).toHaveBeenCalledWith('/');
      await Promise.resolve();
      await Promise.resolve();
      expect(document.defaultView.scrollTo).toHaveBeenCalled();
    });

    it('Given a missing section, When called, Then it does not throw', () => {
      const router = makeRouter('/');
      const document = makeDocument({ element: null });
      const scroller = setup({ router, document });

      expect(() => scroller.scrollTo('contact')).not.toThrow();
    });
  });

  describe('scrollToRequestForm', () => {
    it('Given an offer page whose deepest route declares the request anchor, When called, Then it stays on the page and scrolls to the local form', () => {
      const element = makeElement({ offsetHeight: 400, top: 1000 });
      const router = makeRouter(
        '/offres/site-vitrine',
        routeChain({}, { preload: true }, { [REQUEST_ANCHOR_DATA_KEY]: OFFER_REQUEST_FRAGMENT }),
      );
      const document = makeDocument({ element });
      const scroller = setup({ router, document });

      scroller.scrollToRequestForm();

      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(document.getElementById).toHaveBeenCalledWith(OFFER_REQUEST_FRAGMENT);
      expect(document.defaultView.scrollTo).toHaveBeenCalledWith({ top: 760, behavior: 'smooth' });
    });

    it('Given an offer page with its request anchor, When called, Then it moves the focus to the local form', () => {
      const element = makeElement();
      const router = makeRouter(
        '/offres/site-vitrine',
        routeChain({}, { [REQUEST_ANCHOR_DATA_KEY]: OFFER_REQUEST_FRAGMENT }),
      );
      const document = makeDocument({ element });
      const scroller = setup({ router, document });

      scroller.scrollToRequestForm();

      expect(element.focus).toHaveBeenCalledWith({ preventScroll: true });
    });

    it('Given a page without request anchor, When called, Then it navigates home then scrolls to the contact section', async () => {
      const element = makeElement();
      const router = makeRouter('/projects', routeChain({}, { preload: true }));
      const document = makeDocument({ element });
      const scroller = setup({ router, document });

      scroller.scrollToRequestForm();

      expect(router.navigateByUrl).toHaveBeenCalledExactlyOnceWith('/');
      await Promise.resolve();
      await Promise.resolve();
      expect(document.getElementById).toHaveBeenCalledWith('contact');
      expect(document.defaultView.scrollTo).toHaveBeenCalled();
    });

    it('Given the home page, When called, Then it scrolls to the contact section without navigating', () => {
      const element = makeElement();
      const router = makeRouter('/');
      const document = makeDocument({ element });
      const scroller = setup({ router, document });

      scroller.scrollToRequestForm();

      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(document.getElementById).toHaveBeenCalledWith('contact');
      expect(element.focus).toHaveBeenCalledWith({ preventScroll: true });
    });
  });

  describe('scrollToTop', () => {
    it('Given the home route, When called, Then it scrolls the window to the top', () => {
      const router = makeRouter('/');
      const document = makeDocument({ element: makeElement() });
      const scroller = setup({ router, document });

      scroller.scrollToTop();

      expect(document.defaultView.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('Given another route, When called, Then it does nothing (router handles it)', () => {
      const router = makeRouter('/projects');
      const document = makeDocument({ element: makeElement() });
      const scroller = setup({ router, document });

      scroller.scrollToTop();

      expect(document.defaultView.scrollTo).not.toHaveBeenCalled();
    });
  });
});
