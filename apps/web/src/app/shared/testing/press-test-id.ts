import type { ComponentFixture } from '@angular/core/testing';
import { asButton } from './as-button';
import { byTestId } from './by-test-id';
import { settleBounded } from './settle';

export async function pressTestId(
  fixture: ComponentFixture<unknown>,
  testId: string,
  index = 0,
): Promise<void> {
  asButton(byTestId(fixture.nativeElement as HTMLElement, testId, index)).click();
  await settleBounded(fixture);
}
