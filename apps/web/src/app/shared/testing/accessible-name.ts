// happy-dom ne calcule pas le nom accessible : ordre simplifié aria-labelledby, aria-label, texte.
export function accessibleName(element: Element, root: ParentNode): string {
  const labelledBy = element.getAttribute('aria-labelledby');
  const raw = labelledBy
    ? labelledBy
        .split(/\s+/)
        .map((id) => root.querySelector(`[id="${id}"]`)?.textContent ?? '')
        .join(' ')
    : (element.getAttribute('aria-label') ?? element.textContent ?? '');
  return raw.replace(/\s+/g, ' ').trim();
}
