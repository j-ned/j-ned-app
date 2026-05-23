import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FileDropzone } from './file-dropzone';

describe('FileDropzone accessibility', () => {
  let fixture: ComponentFixture<FileDropzone>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FileDropzone);
    fixture.componentRef.setInput('label', 'Choisir un fichier');
    fixture.detectChanges();
  });

  it('renders a native <button> as the dropzone trigger (not a div with role)', () => {
    const trigger = fixture.nativeElement.querySelector(
      '[aria-label="Choisir un fichier"]',
    ) as HTMLElement;
    expect(trigger).not.toBeNull();
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger.getAttribute('type')).toBe('button');
    expect(trigger.getAttribute('role')).toBeNull();
    expect(trigger.getAttribute('tabindex')).toBeNull();
  });

  it('opens the file picker when the button is clicked', () => {
    const fileInput = fixture.nativeElement.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    const trigger = fixture.nativeElement.querySelector(
      'button[aria-label="Choisir un fichier"]',
    ) as HTMLButtonElement;
    trigger.click();

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
