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

describe('FileDropzone: remise à zéro par le parent', () => {
  let fixture: ComponentFixture<FileDropzone>;

  const byTestId = (testId: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);

  const chooseFile = async (): Promise<void> => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
    const file = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(FileDropzone);
    fixture.componentRef.setInput('resetToken', 0);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('Given a chosen file When the parent changes the reset token Then the dropzone offers the picker again', async () => {
    await chooseFile();
    const chosen = byTestId('file-dropzone-replace') !== null;

    fixture.componentRef.setInput('resetToken', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect({
      chosen,
      replace: byTestId('file-dropzone-replace'),
      trigger: byTestId('file-dropzone-trigger')?.tagName,
      name: fixture.nativeElement.textContent.includes('cv.pdf'),
    }).toEqual({ chosen: true, replace: null, trigger: 'BUTTON', name: false });
  });

  it('Given a chosen file When the parent resets it Then no « cleared » is emitted back to the parent', async () => {
    const cleared = vi.fn();
    fixture.componentInstance.cleared.subscribe(cleared);
    await chooseFile();

    fixture.componentRef.setInput('resetToken', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(cleared).not.toHaveBeenCalled();
  });

  it('Given a reset already done When a file is chosen afterwards Then it is shown', async () => {
    fixture.componentRef.setInput('resetToken', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    await chooseFile();

    expect(byTestId('file-dropzone-replace')).not.toBeNull();
  });
});

describe('FileDropzone: fichier refusé par le parent', () => {
  let fixture: ComponentFixture<FileDropzone>;

  const byTestId = (testId: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);

  beforeEach(async () => {
    fixture = TestBed.createComponent(FileDropzone);
    fixture.componentRef.setInput('resetToken', 0);
    fixture.componentInstance.fileSelected.subscribe(() =>
      fixture.componentRef.setInput('resetToken', 1),
    );
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('Given the parent resets the zone as soon as a file is chosen When the picker closes Then the picker is offered again and holds the focus', async () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
    const file = new File(['PK'], 'lettre.docx', { type: 'application/msword' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect({
      replace: byTestId('file-dropzone-replace'),
      name: fixture.nativeElement.textContent.includes('lettre.docx'),
      focused: document.activeElement === byTestId('file-dropzone-trigger'),
    }).toEqual({ replace: null, name: false, focused: true });
  });
});

describe('FileDropzone: taille du fichier choisi', () => {
  it.each([
    { bytes: 1_258_291, size: '1,2 Mo' },
    { bytes: 1_048_064, size: '1 Mo' },
    { bytes: 77_824, size: '76 Ko' },
  ])(
    'Given a chosen file of $bytes bytes When it is shown Then its size reads « $size »',
    async ({ bytes, size }) => {
      const fixture = TestBed.createComponent(FileDropzone);
      fixture.detectChanges();
      const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
      const file = new File([new Uint8Array(bytes)], 'cv.pdf', { type: 'application/pdf' });
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(
        fixture.nativeElement
          .querySelector('[data-testid="file-dropzone-size"]')
          ?.textContent?.trim(),
      ).toBe(size);
    },
  );
});
