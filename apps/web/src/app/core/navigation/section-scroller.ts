import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export const REQUEST_ANCHOR_DATA_KEY = 'requestAnchor';

/** Hauteur du header fixe (`h-20` = 5rem). Réserve sous lequel rien ne se cale. */
const HEADER_OFFSET_PX = 80;

/** Frames max attendues pour que la mise en page se stabilise avant de défiler. */
const STABLE_FRAME_LIMIT = 30;

// Force le rendu des `@defer` (via `eager`) puis attend la stabilisation de la page avant de scroller.
@Injectable({ providedIn: 'root' })
export class SectionScroller {
  private readonly _router = inject(Router);
  private readonly _document = inject(DOCUMENT);
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _eager = signal(false);
  // Consommé par les `@defer` de la home (`when eager()`) pour les rendre avant le scroll.
  readonly eager = this._eager.asReadonly();

  scrollTo(sectionId: string): void {
    if (!this._isBrowser) return;

    this._eager.set(true);

    if (this._onHome()) {
      this._scrollWhenStable(sectionId);
      return;
    }

    void this._router.navigateByUrl('/').then(() => this._scrollWhenStable(sectionId));
  }

  scrollToRequestForm(): void {
    const anchor = this._deepestRouteData()[REQUEST_ANCHOR_DATA_KEY];
    if (typeof anchor !== 'string') {
      this.scrollTo('contact');
      return;
    }
    if (!this._isBrowser) return;
    this._scrollWhenStable(anchor);
  }

  // Pour le logo quand on est déjà sur la home (où `routerLink="/"` serait un no-op).
  scrollToTop(): void {
    if (!this._isBrowser || !this._onHome()) return;
    this._document.defaultView?.scrollTo?.({ top: 0, behavior: this._scrollBehavior() });
  }

  private _deepestRouteData(): Readonly<Record<string, unknown>> {
    let route = this._router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.data;
  }

  private _onHome(): boolean {
    return this._router.url.split(/[?#]/)[0] === '/';
  }

  private _scrollWhenStable(sectionId: string, attempt = 0, lastHeight = -1): void {
    const view = this._document.defaultView;
    const element = this._document.getElementById(sectionId);
    if (!view || !element) {
      if (attempt < STABLE_FRAME_LIMIT) {
        this._nextFrame(() => this._scrollWhenStable(sectionId, attempt + 1, lastHeight));
      }
      return;
    }

    const height = this._document.documentElement.scrollHeight;
    if (height !== lastHeight && attempt < STABLE_FRAME_LIMIT) {
      this._nextFrame(() => this._scrollWhenStable(sectionId, attempt + 1, height));
      return;
    }

    view.scrollTo({ top: this._centeredTop(view, element), behavior: this._scrollBehavior() });
    this._focusSection(element);
  }

  /** Position de scroll qui centre la section sous le header, sinon l'aligne. */
  private _centeredTop(view: Window, element: HTMLElement): number {
    const elementTop = view.scrollY + element.getBoundingClientRect().top;
    const available = view.innerHeight - HEADER_OFFSET_PX;
    const elementHeight = element.offsetHeight;
    const offset =
      elementHeight <= available
        ? HEADER_OFFSET_PX + (available - elementHeight) / 2
        : HEADER_OFFSET_PX;
    return Math.max(0, elementTop - offset);
  }

  private _scrollBehavior(): ScrollBehavior {
    const prefersReduced = this._document.defaultView?.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    return prefersReduced ? 'auto' : 'smooth';
  }

  private _focusSection(element: HTMLElement): void {
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1');
    }
    element.focus({ preventScroll: true });
  }

  private _nextFrame(callback: () => void): void {
    const raf = this._document.defaultView?.requestAnimationFrame;
    if (raf) {
      raf(() => callback());
    } else {
      callback();
    }
  }
}
