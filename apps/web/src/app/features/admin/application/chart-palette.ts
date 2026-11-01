import type { LinePalette } from '@features/analytics/domain/analytics-presenter';

// Couleur système valide dans un canvas : aucune teinte en dur si le jeton n'est pas résolu.
export function readThemeColor(document: Document, token: string, fallback = 'CanvasText'): string {
  const style = document.defaultView?.getComputedStyle(document.documentElement);
  return style?.getPropertyValue(token).trim() || fallback;
}

export function readChartPalette(document: Document): LinePalette {
  return {
    primary: readThemeColor(document, '--theme-primary-text'),
    foreground: readThemeColor(document, '--theme-foreground'),
  };
}
