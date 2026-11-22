export type InputAvailability = { readonly accepting: number; readonly total: number };

// happy-dom n'applique pas `:disabled` aux descendants d'un fieldset désactivé : lu sur l'ancêtre.
export function inputAvailability(host: ParentNode): InputAvailability {
  const controls = [...host.querySelectorAll('input, textarea, select, button')];
  const accepting = controls.filter(
    (control) => !control.hasAttribute('disabled') && !control.closest('fieldset[disabled]'),
  );
  return { accepting: accepting.length, total: controls.length };
}
