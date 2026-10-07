export function byTestId(root: ParentNode, testId: string, index = 0): HTMLElement | null {
  return root.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`)[index] ?? null;
}

export function testIdText(root: ParentNode, testId: string): string {
  return (byTestId(root, testId)?.textContent ?? '').replace(/^[ \t\n\r]+|[ \t\n\r]+$/g, '');
}
