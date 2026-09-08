import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { ThemeWatcher } from '@shared/theme/theme-watcher';
import { BlogComments } from './blog-comments';

const GISCUS_SCRIPT = 'script[src="https://giscus.app/client.js"]';

describe('BlogComments', () => {
  const isDark = signal(true);

  beforeEach(() => {
    isDark.set(true);
    TestBed.configureTestingModule({
      providers: [{ provide: ThemeWatcher, useValue: { isDark: isDark.asReadonly() } }],
    });
  });

  afterEach(() => {
    document.querySelectorAll(GISCUS_SCRIPT).forEach((s) => s.remove());
    document.querySelectorAll('iframe.giscus-frame').forEach((f) => f.remove());
  });

  const mount = (): ComponentFixture<BlogComments> => {
    const fixture = TestBed.createComponent(BlogComments);
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.detectChanges();
    return fixture;
  };

  const script = (): HTMLScriptElement | null =>
    document.querySelector<HTMLScriptElement>(GISCUS_SCRIPT);

  it('injecte le script Giscus avec le bon mapping pathname', () => {
    mount();
    expect(script()).toBeTruthy();
    expect(script()?.getAttribute('data-mapping')).toBe('pathname');
  });

  it('charge le widget paresseusement : les commentaires sont en bas de page', () => {
    mount();
    expect(script()?.getAttribute('data-loading')).toBe('lazy');
  });

  // Le site a son propre toggle (.app-dark) : le widget doit le suivre, pas le schéma OS.
  it.each([
    [true, 'dark'],
    [false, 'light'],
  ])('démarre avec le thème du site (isDark=%s → %s)', (dark, theme) => {
    isDark.set(dark);
    mount();
    expect(script()?.getAttribute('data-theme')).toBe(theme);
  });

  it('propage un changement de thème au widget déjà chargé via postMessage', () => {
    const fixture = mount();
    const iframe = document.createElement('iframe');
    iframe.className = 'giscus-frame';
    document.body.appendChild(iframe);
    // happy-dom vérifie l'origine cible contre celle de l'iframe (about:blank) : on neutralise l'implémentation.
    const postMessage = vi
      .spyOn(iframe.contentWindow as Window, 'postMessage')
      .mockImplementation(() => undefined);

    isDark.set(false);
    fixture.detectChanges();

    expect(postMessage).toHaveBeenCalledWith(
      { giscus: { setConfig: { theme: 'light' } } },
      'https://giscus.app',
    );
  });
});
