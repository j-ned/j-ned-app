import type { ComponentFixture } from '@angular/core/testing';
import { settle } from '@shared/testing/settle';
import { expect } from 'vitest';

const collapsed = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();

export class InsertGuidePage {
  constructor(readonly fixture: ComponentFixture<unknown>) {}

  get host(): HTMLElement {
    return this.fixture.nativeElement as HTMLElement;
  }

  get materialInput(): HTMLInputElement {
    const input = this.one('material-input');
    expect(input, 'the material field').toBeInstanceOf(HTMLInputElement);
    return input as HTMLInputElement;
  }

  one(testId: string): HTMLElement | null {
    return this.host.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  }

  all(testId: string, root: ParentNode | null = this.host): HTMLElement[] {
    return [...(root?.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`) ?? [])];
  }

  text(testId: string): string {
    return collapsed(this.one(testId));
  }

  texts(testId: string, root: ParentNode | null = this.host): string[] {
    return this.all(testId, root).map(collapsed);
  }

  optionNames(): string[] {
    return this.texts('material-option-name');
  }

  options(): HTMLElement[] {
    return this.all('material-option');
  }

  materialStatus(): string {
    return this.text('material-status');
  }

  expanded(): string | null {
    return this.materialInput.getAttribute('aria-expanded');
  }

  activeOptionName(): string | null {
    const id = this.materialInput.getAttribute('aria-activedescendant');
    if (id === null) return null;
    return collapsed(
      this.host
        .querySelector(`[id="${id}"]`)
        ?.querySelector('[data-testid="material-option-name"]'),
    );
  }

  sheetName(): string {
    return this.text('material-sheet-name');
  }

  operationRadios(): HTMLInputElement[] {
    return this.all('operation-radio').filter(
      (element): element is HTMLInputElement => element instanceof HTMLInputElement,
    );
  }

  checkedOperations(): string[] {
    return this.operationRadios()
      .filter((radio) => radio.checked)
      .map((radio) => radio.value);
  }

  async chooseOperation(slug: string): Promise<void> {
    const radio = this.operationRadios().find((element) => element.value === slug);
    expect(radio, `the operation radio ${slug}`).toBeInstanceOf(HTMLInputElement);
    radio?.click();
    await settle(this.fixture);
  }

  async typeMaterial(value: string): Promise<void> {
    const input = this.materialInput;
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle(this.fixture);
  }

  async press(key: string): Promise<KeyboardEvent> {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    this.materialInput.dispatchEvent(event);
    await settle(this.fixture);
    return event;
  }

  async leaveMaterial(): Promise<void> {
    this.materialInput.dispatchEvent(new FocusEvent('blur'));
    await settle(this.fixture);
  }

  async pickOption(name: string): Promise<boolean> {
    const option = this.options().find(
      (element) =>
        collapsed(element.querySelector('[data-testid="material-option-name"]')) === name,
    );
    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    option?.dispatchEvent(mousedown);
    option?.click();
    await settle(this.fixture);
    return mousedown.defaultPrevented;
  }
}
