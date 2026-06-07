import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  inject,
  input,
} from '@angular/core';
import { ActiveSection } from './active-section';

/** La section est "active" quand elle occupe la bande centrale du viewport. */
const CENTER_BAND_MARGIN = '-45% 0px -45% 0px';

/**
 * Scroll-spy minimal : marque sa section comme active dans ActiveSection quand
 * elle entre dans la bande centrale du viewport, et la libère quand elle en
 * sort. Sert l'indicateur d'état actif du header sans coupler le contenu au
 * header. SSR-safe (no-op côté serveur et sans IntersectionObserver), nettoyé
 * automatiquement à la destruction.
 */
@Directive({
  selector: '[appSectionVisibility]',
})
export class SectionVisibility {
  private readonly _element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _active = inject(ActiveSection);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly sectionId = input.required<string>({ alias: 'appSectionVisibility' });

  constructor() {
    afterNextRender(() => this._observe());
    // Quitter la home (destruction) libère l'état actif : sinon la section
    // resterait "active" sur une autre route et deux liens seraient surlignés.
    this._destroyRef.onDestroy(() => this._active.clear(this.sectionId()));
  }

  private _observe(): void {
    if (!this._isBrowser || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this._active.set(this.sectionId());
          } else {
            this._active.clear(this.sectionId());
          }
        }
      },
      { rootMargin: CENTER_BAND_MARGIN },
    );

    observer.observe(this._element.nativeElement);
    this._destroyRef.onDestroy(() => observer.disconnect());
  }
}
