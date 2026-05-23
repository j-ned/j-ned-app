import { Component, signal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Drawer } from './drawer';

@Component({
  imports: [Drawer],
  template: `
    <button type="button" id="trigger" (click)="open()">Open</button>
    <app-drawer [(visible)]="visible" heading="Test">
      <button type="button" id="first">First</button>
      <button type="button" id="middle">Middle</button>
      <button type="button" id="last">Last</button>
    </app-drawer>
  `,
})
class Host {
  visible = signal(false);
  open(): void {
    this.visible.set(true);
  }
}

describe('Drawer focus trap', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('restores focus to the trigger when closed', async () => {
    const trigger = fixture.nativeElement.querySelector('#trigger') as HTMLButtonElement;
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    host.visible.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    host.visible.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(trigger);
  });

  it('cycles focus with Tab from last focusable back to first (forward trap)', async () => {
    host.visible.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const last = fixture.nativeElement.querySelector('#last') as HTMLButtonElement;
    const closeBtn = fixture.nativeElement.querySelector('[aria-label="Fermer"]') as HTMLButtonElement;
    last.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    last.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(closeBtn);
  });

  it('cycles focus with Shift+Tab from first focusable back to last (backward trap)', async () => {
    host.visible.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const closeBtn = fixture.nativeElement.querySelector('[aria-label="Fermer"]') as HTMLButtonElement;
    const last = fixture.nativeElement.querySelector('#last') as HTMLButtonElement;
    closeBtn.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    closeBtn.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
  });

  it('keeps focus on the panel when no focusables are present (no heading, empty slot)', async () => {
    @Component({
      imports: [Drawer],
      template: `
        <button type="button" id="trigger" (click)="open()">Open</button>
        <app-drawer [(visible)]="visible"></app-drawer>
      `,
    })
    class EmptyHost {
      visible = signal(false);
      open(): void {
        this.visible.set(true);
      }
    }

    const emptyFixture = TestBed.createComponent(EmptyHost);
    emptyFixture.detectChanges();

    emptyFixture.componentInstance.visible.set(true);
    emptyFixture.detectChanges();
    await emptyFixture.whenStable();

    const panel = emptyFixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    panel.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    panel.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});
