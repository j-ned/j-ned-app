import { TestBed } from '@angular/core/testing';
import { ToastStore } from './toast-store';
import type { ToastSeverity } from './toast.types';

describe('ToastStore', () => {
  let store: ToastStore;

  const titles = (): readonly { severity: ToastSeverity; summary: string }[] =>
    store.messages().map((entry) => ({ severity: entry.severity, summary: entry.summary }));

  beforeEach(() => {
    store = TestBed.inject(ToastStore);
  });

  it.each<[ToastSeverity, string]>([
    ['success', 'Succès'],
    ['info', 'Information'],
    ['warn', 'Attention'],
    ['error', 'Erreur'],
  ])(
    'Given a %s toast without a title When it is added Then it is titled « %s »',
    (severity, summary) => {
      store.add({ severity, detail: 'Détail', life: 0 });

      expect(titles()).toEqual([{ severity, summary }]);
    },
  );

  it('Given a toast without severity nor title When it is added Then it is an info titled « Information »', () => {
    store.add({ detail: 'Détail', life: 0 });

    expect(titles()).toEqual([{ severity: 'info', summary: 'Information' }]);
  });

  it('Given a toast with its own title When it is added Then that title is kept', () => {
    store.add({ severity: 'success', summary: 'Message envoyé', detail: 'Détail', life: 0 });

    expect(titles()).toEqual([{ severity: 'success', summary: 'Message envoyé' }]);
  });
});
