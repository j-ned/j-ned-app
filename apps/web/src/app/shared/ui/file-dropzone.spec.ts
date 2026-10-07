import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FileDropzone } from './file-dropzone';

describe('FileDropzone accessibility', () => {
  let fixture: ComponentFixture<FileDropzone>;

  const trigger = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('[data-testid="file-dropzone-trigger"]');
  const fileInput = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('input[type="file"]');

  beforeEach(() => {
    fixture = TestBed.createComponent(FileDropzone);
    fixture.componentRef.setInput('label', 'Choisir un fichier');
    fixture.componentRef.setInput('helperText', 'PDF uniquement');
    fixture.detectChanges();
  });

  it('renders a native <button> as the dropzone trigger (not a div with role)', () => {
    expect(trigger().tagName).toBe('BUTTON');
    expect(trigger().getAttribute('type')).toBe('button');
    expect(trigger().getAttribute('role')).toBeNull();
    expect(trigger().getAttribute('tabindex')).toBeNull();
  });

  it('opens the file picker when the button is clicked', () => {
    const clickSpy = vi.spyOn(fileInput(), 'click');

    trigger().click();

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('given the hidden file input, then it is out of the tab order and of the accessibility tree', () => {
    expect(fileInput().getAttribute('tabindex')).toBe('-1');
    expect(fileInput().getAttribute('aria-hidden')).toBe('true');
  });

  it('given a visible label, then the button name comes from its content and starts with that label', () => {
    expect(trigger().hasAttribute('aria-label')).toBe(false);
    expect(trigger().hasAttribute('aria-labelledby')).toBe(false);
    const name = (trigger().textContent ?? '').replace(/\s+/g, ' ').trim();
    expect(name.startsWith('Choisir un fichier')).toBe(true);
    expect(name).toContain('PDF uniquement');
  });

  describe('focus after the picker', () => {
    const chooseFile = async (): Promise<void> => {
      const file = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });
      Object.defineProperty(fileInput(), 'files', { value: [file], configurable: true });
      fileInput().dispatchEvent(new Event('change'));
      fixture.detectChanges();
      await fixture.whenStable();
    };
    const byTestId = (testId: string): HTMLElement | null =>
      fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);

    it('given a file chosen from the picker, then focus lands on « Remplacer » instead of the page body', async () => {
      trigger().focus();

      await chooseFile();

      expect(document.activeElement).toBe(byTestId('file-dropzone-replace'));
    });

    it('given a chosen file, when it is removed, then focus returns to the dropzone button', async () => {
      await chooseFile();

      byTestId('file-dropzone-clear')?.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(document.activeElement).toBe(trigger());
    });
  });
});
