import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StatusMessage } from './status-message';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';

@Component({
  imports: [StatusMessage],
  template: `<app-status-message [tone]="tone()">Code invalide. Réessayez.</app-status-message>`,
})
class StatusHost {
  readonly tone = signal<'success' | 'error'>('success');
}

describe('StatusMessage', () => {
  it.each([
    { tone: 'success' as const, role: 'status' },
    { tone: 'error' as const, role: 'alert' },
  ])(
    'Given the $tone tone When the message renders Then it is announced as $role with the projected text',
    async ({ tone, role }) => {
      const fixture = TestBed.createComponent(StatusHost);
      fixture.componentInstance.tone.set(tone);

      await settle(fixture);
      const host = fixture.nativeElement as HTMLElement;

      expect({
        role: byTestId(host, 'status-message')?.getAttribute('role'),
        text: testIdText(host, 'status-message'),
      }).toEqual({ role, text: 'Code invalide. Réessayez.' });
    },
  );

  it('Given a success turning into an error When the tone changes Then the role follows it', async () => {
    const fixture = TestBed.createComponent(StatusHost);
    await settle(fixture);

    fixture.componentInstance.tone.set('error');
    await settle(fixture);

    expect(
      byTestId(fixture.nativeElement as HTMLElement, 'status-message')?.getAttribute('role'),
    ).toBe('alert');
  });
});
