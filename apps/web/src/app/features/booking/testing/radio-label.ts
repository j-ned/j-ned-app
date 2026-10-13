// happy-dom ne calcule pas le nom accessible : texte du <label> associé, hors contenu aria-hidden.
export function radioLabel(radio: HTMLInputElement): string {
  const label =
    radio.closest('label') ??
    (radio.id === '' ? null : radio.ownerDocument.querySelector(`label[for="${radio.id}"]`));
  if (label === null) return '';
  const visibleToAssistiveTech = label.cloneNode(true) as Element;
  visibleToAssistiveTech.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());
  return (visibleToAssistiveTech.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function radiosOf(root: ParentNode, testId: string): readonly HTMLInputElement[] {
  return [
    ...root.querySelectorAll<HTMLInputElement>(`input[type="radio"][data-testid="${testId}"]`),
  ];
}
