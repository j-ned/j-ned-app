import type { ComponentFixture } from '@angular/core/testing';

export async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

export function byTestId(root: ParentNode, testId: string, index = 0): HTMLElement | null {
  return root.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`)[index] ?? null;
}

export function testIdText(root: ParentNode, testId: string): string {
  return (byTestId(root, testId)?.textContent ?? '').replace(/^[ \t\n\r]+|[ \t\n\r]+$/g, '');
}

export async function pressTestId(
  fixture: ComponentFixture<unknown>,
  testId: string,
  index = 0,
): Promise<void> {
  const element = byTestId(fixture.nativeElement as HTMLElement, testId, index);
  const button = element?.tagName === 'BUTTON' ? element : element?.querySelector('button');
  button?.click();
  await settleBounded(fixture);
}

export async function settleBounded(fixture: ComponentFixture<unknown>): Promise<void> {
  for (let pass = 0; pass < 2; pass++) {
    fixture.detectChanges();
    await Promise.race([
      fixture.whenStable(),
      new Promise<void>((resolve) => setTimeout(resolve, 0)),
    ]);
  }
  fixture.detectChanges();
}

export async function captureCrash(action: () => Promise<void>): Promise<unknown> {
  try {
    await action();
    return null;
  } catch (error: unknown) {
    return error;
  }
}
