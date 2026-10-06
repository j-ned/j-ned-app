import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Stamp } from './stamp';

const STAMP_CLASSES = [
  'bg-background',
  'border',
  'border-line-strong',
  'font-mono',
  'inline-block',
  'px-2',
  'py-1',
  'rounded-sm',
  'text-foreground',
  'text-xs',
  'tracking-[0.06em]',
  'uppercase',
];

@Component({
  imports: [Stamp],
  template: `
    <app-stamp data-testid="plain-stamp">Démo</app-stamp>
    <app-stamp data-testid="placed-stamp" class="absolute left-3 top-3">Script</app-stamp>
  `,
})
class Host {}

describe('Stamp', () => {
  const render = (): HTMLElement => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const byTestId = (root: HTMLElement, id: string): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-testid="${id}"]`);

  it('Given a label When the stamp renders Then the label is its only text', () => {
    expect(byTestId(render(), 'plain-stamp')?.textContent?.trim()).toBe('Démo');
  });

  it('Given no placement When the stamp renders Then its host carries exactly the stamp look', () => {
    expect([...(byTestId(render(), 'plain-stamp')?.classList ?? [])].sort()).toEqual(STAMP_CLASSES);
  });

  it('Given a placement from the consumer When the stamp renders Then the placement is added to the stamp look', () => {
    expect([...(byTestId(render(), 'placed-stamp')?.classList ?? [])].sort()).toEqual(
      [...STAMP_CLASSES, 'absolute', 'left-3', 'top-3'].sort(),
    );
  });
});
