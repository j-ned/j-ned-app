import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { asButton } from './as-button';
import { byTestId } from './by-test-id';
import { pressTestId } from './press-test-id';

@Component({
  template: `
    <button type="button" data-testid="direct" (click)="presses = presses + 1">Valider</button>
    <div data-testid="container">
      <button type="button" (click)="presses = presses + 1">Valider</button>
    </div>
  `,
})
class Host {
  presses = 0;
}

function render(): { readonly fixture: ReturnType<typeof TestBed.createComponent<Host>> } {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return { fixture };
}

describe('asButton', () => {
  it('Given a native button When it is asserted Then the same element is returned', () => {
    const { fixture } = render();
    const element = byTestId(fixture.nativeElement as HTMLElement, 'direct');

    expect(asButton(element)).toBe(element);
  });

  it.each([
    { scenario: 'a container holding a button', testId: 'container', message: /<div>/ },
    { scenario: 'a missing element', testId: 'absent', message: /nothing/ },
  ])('Given $scenario When it is asserted Then it fails explicitly', ({ testId, message }) => {
    const { fixture } = render();

    expect(() => asButton(byTestId(fixture.nativeElement as HTMLElement, testId))).toThrow(message);
  });
});

describe('pressTestId', () => {
  it('Given a test id set on a native button When it is pressed Then the button is clicked once', async () => {
    const { fixture } = render();

    await pressTestId(fixture, 'direct');

    expect(fixture.componentInstance.presses).toBe(1);
  });

  it('Given a test id set on a container When it is pressed Then it fails instead of clicking the inner button', async () => {
    const { fixture } = render();

    await expect(pressTestId(fixture, 'container')).rejects.toThrow(/<div>/);
    expect(fixture.componentInstance.presses).toBe(0);
  });
});
