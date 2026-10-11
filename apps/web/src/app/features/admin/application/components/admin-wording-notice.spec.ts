import { inputBinding, signal, type WritableSignal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import type { WordingWarning } from '../profile-wording-warnings';
import { AdminWordingNotice } from './admin-wording-notice';

const PARAGRAPH: WordingWarning = {
  fieldId: 'profile-paragraph-text-2',
  fieldLabel: 'Paragraphe 2',
  wording: 'métallurgie',
};
const SUMMARY: WordingWarning = {
  fieldId: 'profile-biography-summary',
  fieldLabel: 'Résumé du parcours',
  wording: '20 ans',
};

async function renderNotice(initial: readonly WordingWarning[]): Promise<{
  readonly fixture: ComponentFixture<AdminWordingNotice>;
  readonly host: HTMLElement;
  readonly warnings: WritableSignal<readonly WordingWarning[]>;
}> {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const warnings = signal<readonly WordingWarning[]>(initial);
  const fixture = TestBed.createComponent(AdminWordingNotice, {
    bindings: [inputBinding('warnings', warnings)],
  });
  await settle(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement, warnings };
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

describe('AdminWordingNotice', () => {
  it('Given two warnings When the notice renders Then it asks for a reread and lists each wording with the field it lives in, linked to that field', async () => {
    const { host } = await renderNotice([PARAGRAPH, SUMMARY]);
    const items = [...host.querySelectorAll('[data-testid="admin-wording-notice-item"]')];

    expect({
      title: testIdText(host, 'admin-wording-notice-title'),
      items: items.map((item) => normalized(item)),
      anchors: items.map((item) => item.querySelector('a')?.getAttribute('href')?.split('#')[1]),
    }).toEqual({
      title: 'À relire avant de publier',
      items: [
        '«\u00a0métallurgie\u00a0» dans Paragraphe 2',
        '«\u00a020 ans\u00a0» dans Résumé du parcours',
      ],
      anchors: ['profile-paragraph-text-2', 'profile-biography-summary'],
    });
  });

  it('Given warnings When the notice renders Then it is not a live region: typing does not trigger an announcement', async () => {
    const { host } = await renderNotice([PARAGRAPH]);
    const notice = byTestId(host, 'admin-wording-notice');
    const live = notice
      ? [notice, ...notice.querySelectorAll('*')].filter(
          (element) =>
            element.hasAttribute('aria-live') ||
            ['alert', 'status', 'log'].includes(element.getAttribute('role') ?? ''),
        ).length
      : null;

    expect(live).toBe(0);
  });

  it('Given no warning, then one, then none When the notice renders Then it shows only while there is something to reread', async () => {
    const { fixture, host, warnings } = await renderNotice([]);
    const before = byTestId(host, 'admin-wording-notice');

    warnings.set([SUMMARY]);
    await settle(fixture);
    const during = byTestId(host, 'admin-wording-notice') !== null;
    warnings.set([]);
    await settle(fixture);

    expect({ before, during, after: byTestId(host, 'admin-wording-notice') }).toEqual({
      before: null,
      during: true,
      after: null,
    });
  });
});
