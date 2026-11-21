export function asButton(element: Element | null | undefined): HTMLButtonElement {
  if (element instanceof HTMLButtonElement) return element;
  const found = element ? `<${element.tagName.toLowerCase()}>` : 'nothing';
  throw new Error(`Expected a native <button>, found ${found}`);
}
