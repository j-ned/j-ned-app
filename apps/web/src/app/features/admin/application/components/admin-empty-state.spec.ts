import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import { AdminEmptyState } from './admin-empty-state';

@Component({
  imports: [AdminEmptyState],
  template: `
    <app-admin-empty-state [stamp]="stamp()">
      <p data-testid="host-text">Aucun message reçu sur la période.</p>
      <a data-testid="host-action" href="/#contact">Ouvrir la page Contact</a>
    </app-admin-empty-state>
  `,
})
class EmptyStateHost {
  readonly stamp = signal('Boîte vide');
}

async function renderHost(): Promise<{
  host: HTMLElement;
  setStamp: (stamp: string) => Promise<void>;
}> {
  const fixture = TestBed.createComponent(EmptyStateHost);
  await settle(fixture);
  return {
    host: fixture.nativeElement as HTMLElement,
    setStamp: async (stamp: string): Promise<void> => {
      fixture.componentInstance.stamp.set(stamp);
      await settle(fixture);
    },
  };
}

describe('AdminEmptyState', () => {
  it('Given a stamp, a sentence and an action When rendered Then the empty state holds all three, the stamp first', async () => {
    const { host } = await renderHost();
    const state = byTestId(host, 'empty-state');
    const stamp = byTestId(host, 'empty-state-stamp');
    const text = byTestId(host, 'host-text');
    const action = byTestId(host, 'host-action');

    expect({
      stamp: testIdText(host, 'empty-state-stamp'),
      holdsAll: [stamp, text, action].every((node) => node !== null && state?.contains(node)),
      stampFirst:
        stamp !== null &&
        text !== null &&
        (stamp.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
    }).toEqual({ stamp: 'Boîte vide', holdsAll: true, stampFirst: true });
  });

  it('Given another stamp When the input changes Then the stamp follows', async () => {
    const { host, setStamp } = await renderHost();

    await setStamp('Rien en ligne');

    expect(testIdText(host, 'empty-state-stamp')).toBe('Rien en ligne');
  });
});
