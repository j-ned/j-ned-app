import { DOCUMENT } from '@angular/common';
import { computed, inject, type Signal } from '@angular/core';
import { ThemeStore } from '@core/theme/theme-store';
import type { LinePalette } from '@features/analytics/domain/analytics-presenter';

type ChartTheme = { readonly line: LinePalette; readonly background: string };

// Couleur système valide dans un canvas : aucune teinte en dur si le jeton n'est pas résolu.
function readThemeColor(document: Document, token: string, fallback = 'CanvasText'): string {
  const style = document.defaultView?.getComputedStyle(document.documentElement);
  return style?.getPropertyValue(token).trim() || fallback;
}

export function readChartPalette(document: Document): LinePalette {
  return {
    primary: readThemeColor(document, '--theme-primary-text'),
    foreground: readThemeColor(document, '--theme-foreground'),
  };
}

// Les couleurs viennent des variables CSS du registre courant : relues à chaque bascule de thème.
export function injectChartTheme(): Signal<ChartTheme> {
  const document = inject(DOCUMENT);
  const isDark = inject(ThemeStore).isDark;
  return computed(() => {
    isDark();
    return {
      line: readChartPalette(document),
      background: readThemeColor(document, '--theme-background', 'Canvas'),
    };
  });
}
