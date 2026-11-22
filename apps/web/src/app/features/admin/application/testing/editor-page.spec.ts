import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { settleUntil } from './editor-page';

@Component({ selector: 'app-blank', template: '' })
class Blank {}

function blankEditor(): { fixture: ReturnType<typeof TestBed.createComponent>; host: HTMLElement } {
  const fixture = TestBed.createComponent(Blank);
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

describe('settleUntil', () => {
  it('Given a condition met after a few passes When it is awaited Then it resolves', async () => {
    let passes = 0;

    await settleUntil(blankEditor(), () => ++passes >= 3);

    expect(passes).toBe(3);
  });

  it('Given a condition never met When it is awaited Then it fails explicitly once the bound is reached', async () => {
    await expect(settleUntil(blankEditor(), () => false)).rejects.toThrow(
      'settleUntil : condition non atteinte après 10 passes de rendu',
    );
  });
});
