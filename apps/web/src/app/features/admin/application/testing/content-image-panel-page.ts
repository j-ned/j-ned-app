import type { ComponentFixture } from '@angular/core/testing';
import { byTestId } from '@shared/testing/by-test-id';
import { settleBounded } from '@shared/testing/settle';

export const BODY_IMAGE_FILE = new File(['png'], 'schema.png', { type: 'image/png' });

const rootOf = (fixture: ComponentFixture<unknown>): HTMLElement =>
  fixture.nativeElement as HTMLElement;

export function imagePanel(root: HTMLElement): HTMLElement | null {
  return root.dataset['testid'] === 'markdown-image-panel'
    ? root
    : byTestId(root, 'markdown-image-panel');
}

export function imagePanelAlt(root: HTMLElement): HTMLInputElement | null {
  const panel = imagePanel(root);
  const input = panel && byTestId(panel, 'markdown-image-alt');
  return input instanceof HTMLInputElement ? input : null;
}

export async function openImagePanel(fixture: ComponentFixture<unknown>): Promise<void> {
  byTestId(rootOf(fixture), 'markdown-tool-image')?.click();
  await settleBounded(fixture);
}

export async function pickImageFile(
  fixture: ComponentFixture<unknown>,
  file: File = BODY_IMAGE_FILE,
): Promise<void> {
  const input = imagePanel(rootOf(fixture))?.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) return;
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new Event('change'));
  await settleBounded(fixture);
}

export async function typeImageAlt(fixture: ComponentFixture<unknown>, alt: string): Promise<void> {
  const input = imagePanelAlt(rootOf(fixture));
  if (!input) return;
  input.value = alt;
  input.dispatchEvent(new Event('input'));
  await settleBounded(fixture);
}

export async function pressImagePanel(
  fixture: ComponentFixture<unknown>,
  testId: 'markdown-image-submit' | 'markdown-image-cancel',
): Promise<void> {
  const panel = imagePanel(rootOf(fixture));
  (panel && byTestId(panel, testId))?.click();
  await settleBounded(fixture);
}

export async function pressKeyInImageAlt(
  fixture: ComponentFixture<unknown>,
  key: 'Enter' | 'Escape',
): Promise<KeyboardEvent> {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  imagePanelAlt(rootOf(fixture))?.dispatchEvent(event);
  await settleBounded(fixture);
  return event;
}

export async function insertBodyImage(
  fixture: ComponentFixture<unknown>,
  alt: string,
  file: File = BODY_IMAGE_FILE,
): Promise<void> {
  await openImagePanel(fixture);
  await pickImageFile(fixture, file);
  await typeImageAlt(fixture, alt);
  await pressImagePanel(fixture, 'markdown-image-submit');
}
