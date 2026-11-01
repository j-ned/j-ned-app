const ACCENT_TINT = /^(?:[\w-]+:)*bg-primary\/\d+$/;

export function accentTints(element: Element | null): readonly string[] | null {
  return element ? [...element.classList].filter((token) => ACCENT_TINT.test(token)).sort() : null;
}
