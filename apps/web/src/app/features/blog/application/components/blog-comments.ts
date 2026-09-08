import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { GISCUS_CONFIG } from '@shared/api/giscus-config';
import { ThemeWatcher } from '@shared/theme/theme-watcher';

// Origine unique de Giscus : script, iframe et cible du postMessage. Toute autre origine est
// refusée par la CSP d'index.html (script-src / frame-src).
const GISCUS_ORIGIN = 'https://giscus.app';
const GISCUS_FRAME_SELECTOR = 'iframe.giscus-frame';

type GiscusTheme = 'light' | 'dark';

@Component({
  selector: 'app-blog-comments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block mt-12' },
  template: `<div #container></div>`,
})
export class BlogComments {
  private readonly _host = inject(ElementRef<HTMLElement>);
  private readonly _document = inject(DOCUMENT);
  private readonly _config = inject(GISCUS_CONFIG);
  private readonly _isDark = inject(ThemeWatcher).isDark;

  readonly slug = input.required<string>();

  // Le site a son propre toggle (.app-dark) : le widget le suit, pas le schéma OS.
  private readonly _theme = computed<GiscusTheme>(() => (this._isDark() ? 'dark' : 'light'));

  constructor() {
    afterNextRender(() => this._injectScript(this._theme()));

    // Une fois l'iframe chargée, seul postMessage peut la re-thémer (l'attribut du script est
    // lu une seule fois). Avant son chargement, l'appel est un no-op.
    effect(() => this._postTheme(this._theme()));
  }

  private _injectScript(theme: GiscusTheme): void {
    const script = this._document.createElement('script');
    script.src = `${GISCUS_ORIGIN}/client.js`;
    script.setAttribute('data-repo', this._config.repo);
    script.setAttribute('data-repo-id', this._config.repoId);
    script.setAttribute('data-category', this._config.category);
    script.setAttribute('data-category-id', this._config.categoryId);
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-reactions-enabled', '0');
    script.setAttribute('data-theme', theme);
    // Les commentaires sont en bas de page : l'iframe ne se charge qu'à l'approche du viewport.
    script.setAttribute('data-loading', 'lazy');
    script.crossOrigin = 'anonymous';
    script.async = true;
    this._host.nativeElement.appendChild(script);
  }

  private _postTheme(theme: GiscusTheme): void {
    const frame = this._document.querySelector<HTMLIFrameElement>(GISCUS_FRAME_SELECTOR);
    frame?.contentWindow?.postMessage({ giscus: { setConfig: { theme } } }, GISCUS_ORIGIN);
  }
}
