import type { ComponentFixture } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import type { ToastMessage } from '@shared/ui/toast.types';
import { byTestId } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { normalized } from '@shared/testing/normalized-text';
import { pressTestId } from '@shared/testing/press-test-id';
import { settle, settleBounded } from '@shared/testing/settle';

type EditorView = {
  readonly fixture: ComponentFixture<unknown>;
  readonly host: HTMLElement;
};

type EditableControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

type ToastCalls = { readonly mock: { readonly calls: readonly (readonly [ToastMessage])[] } };

export async function openEditorRoute(
  url: string,
): Promise<EditorView & { readonly harness: RouterTestingHarness; readonly crash: unknown }> {
  const harness = await RouterTestingHarness.create();
  const crash = await captureCrash(async () => {
    await harness.navigateByUrl(url);
    await settleBounded(harness.fixture);
  });
  return {
    harness,
    fixture: harness.fixture,
    host: harness.fixture.nativeElement as HTMLElement,
    crash,
  };
}

export const fieldValue = (host: HTMLElement, testId: string): string | undefined =>
  (byTestId(host, testId) as EditableControl | null)?.value;

export async function typeIn(editor: EditorView, testId: string, text: string): Promise<void> {
  const control = byTestId(editor.host, testId) as EditableControl | null;
  if (!control) throw new Error(`No editable control with data-testid "${testId}"`);
  control.value = text;
  control.dispatchEvent(new Event('input'));
  control.dispatchEvent(new Event('change'));
  await settle(editor.fixture);
}

export async function save(editor: EditorView): Promise<void> {
  await pressTestId(editor.fixture, 'savebar-submit');
  await settleBounded(editor.fixture);
}

export async function followBreadcrumb(editor: EditorView): Promise<void> {
  const parent = byTestId(editor.host, 'admin-breadcrumb-parent');
  if (!parent) throw new Error('No parent link in the admin breadcrumb');
  parent.click();
  await settleBounded(editor.fixture);
}

export const saveBarState = (editor: EditorView): string =>
  normalized(byTestId(editor.host, 'savebar-state'));

export const tocStates = (editor: EditorView): readonly string[] =>
  [...editor.host.querySelectorAll('[data-testid="form-toc-link"]')].map((link) =>
    normalized(byTestId(link, 'form-toc-state')),
  );

export const toasts = (toast: ToastCalls): readonly ToastMessage[] =>
  toast.mock.calls.map(([message]) => message);

export async function pickInZone(
  editor: EditorView,
  zoneTestId: string,
  file: File,
): Promise<void> {
  const input = editor.host.querySelector<HTMLInputElement>(
    `[data-testid="${zoneTestId}"] input[type="file"]`,
  );
  if (!input) throw new Error(`No file input in the zone "${zoneTestId}"`);
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new Event('change'));
  await settle(editor.fixture);
}

export const inZone = (
  editor: EditorView,
  zoneTestId: string,
  testId: string,
): HTMLElement | null =>
  editor.host.querySelector(`[data-testid="${zoneTestId}"] [data-testid="${testId}"]`);

type NewerVersionView = {
  readonly role: string | null;
  readonly text: string;
  readonly focused: boolean;
};

export function readNewerVersion(editor: EditorView, prefix: string): NewerVersionView {
  const region = byTestId(editor.host, `${prefix}-newer-version`);
  return {
    role: region?.getAttribute('role') ?? null,
    text: normalized(region),
    focused: region !== null && region.ownerDocument.activeElement === region,
  };
}

const SETTLE_PASSES_MAX = 10;

// L'écrasement confirmé relit la dernière version avant d'écrire : le rendu est rejoué jusqu'à la
// condition (fin de l'enregistrement), borné pour un cas où elle n'arrive jamais (annulation).
export async function settleUntil(editor: EditorView, done: () => boolean): Promise<void> {
  for (let pass = 0; pass < SETTLE_PASSES_MAX && !done(); pass++) {
    await settleBounded(editor.fixture);
  }
}

export async function reloadLatest(editor: EditorView, prefix: string): Promise<void> {
  await pressTestId(editor.fixture, `${prefix}-reload-latest`);
  await settleBounded(editor.fixture);
}

export function reloadDialog(editor: EditorView, prefix: string): HTMLElement {
  const root = byTestId(editor.host, `${prefix}-reload-dialog`);
  if (!root) throw new Error(`No reload dialog for "${prefix}"`);
  return root;
}

export function overwriteDialog(editor: EditorView, prefix: string): HTMLElement {
  const root = byTestId(editor.host, `${prefix}-overwrite-dialog`);
  if (!root) throw new Error(`No overwrite dialog for "${prefix}"`);
  return root;
}
