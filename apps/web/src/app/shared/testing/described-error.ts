import { byTestId } from './by-test-id';

// Le message se lit par la description du champ, comme un lecteur d'écran, jamais par un id en dur.
export function describedError(root: ParentNode, controlTestId: string): HTMLElement | null {
  const control = byTestId(root, controlTestId);
  const [errorId] = control?.getAttribute('aria-describedby')?.split(' ') ?? [];
  return errorId ? (control?.ownerDocument.getElementById(errorId) ?? null) : null;
}
