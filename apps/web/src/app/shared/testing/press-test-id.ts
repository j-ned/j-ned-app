import type { ComponentFixture } from '@angular/core/testing';
import { byTestId } from './by-test-id';
import { settleBounded } from './settle';

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
