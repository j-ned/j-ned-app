import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { AdminAnalyticsHeader } from './admin-analytics-header';
import type { DateRangeKey } from '@features/analytics/domain/analytics-presenter';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { pressTestId } from '@shared/testing/press-test-id';
import { settle } from '@shared/testing/settle';

describe('AdminAnalyticsHeader', () => {
  function render(deviceExcluded: boolean): {
    toggle: HTMLButtonElement;
    toggled: () => number;
  } {
    TestBed.configureTestingModule({ imports: [AdminAnalyticsHeader] });
    const fixture = TestBed.createComponent(AdminAnalyticsHeader);
    fixture.componentRef.setInput('deviceExcluded', deviceExcluded);
    let count = 0;
    fixture.componentInstance.deviceExclusionToggled.subscribe(() => count++);
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector(
      '[data-testid="device-exclusion-toggle"]',
    ) as HTMLButtonElement;
    return { toggle, toggled: () => count };
  }

  it('offers to exclude the device when it is tracked', () => {
    const { toggle } = render(false);
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(toggle.textContent).toContain('Exclure cet appareil');
  });

  it('shows the device as excluded when it is', () => {
    const { toggle } = render(true);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.textContent).toContain('Appareil exclu');
  });

  it('emits deviceExclusionToggled on click', () => {
    const { toggle, toggled } = render(false);
    toggle.click();
    expect(toggled()).toBe(1);
  });
});

describe('AdminAnalyticsHeader: période affichée', () => {
  async function renderPeriod(dateRange: DateRangeKey): Promise<{
    fixture: ComponentFixture<AdminAnalyticsHeader>;
    select: HTMLSelectElement | null;
  }> {
    const fixture = TestBed.createComponent(AdminAnalyticsHeader);
    fixture.componentRef.setInput('dateRange', dateRange);
    await settle(fixture);
    const select = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>(
      '[data-testid="analytics-date-range"]',
    );
    return { fixture, select };
  }

  const shown = (select: HTMLSelectElement | null): { value: string; label: string } => ({
    value: select?.value ?? '',
    label: select?.selectedOptions[0]?.textContent?.trim() ?? '',
  });

  it.each<{ range: DateRangeKey; label: string }>([
    { range: '7d', label: '7 derniers jours' },
    { range: '30d', label: '30 derniers jours' },
    { range: '90d', label: '90 derniers jours' },
    { range: 'all', label: 'Tout le temps' },
  ])(
    'Given the $range period When the header first renders Then the select shows « $label »',
    async ({ range, label }) => {
      const { select } = await renderPeriod(range);

      expect(shown(select)).toEqual({ value: range, label });
    },
  );

  it('Given the 30d period When the period becomes 90d Then the select follows', async () => {
    const { fixture, select } = await renderPeriod('30d');

    fixture.componentRef.setInput('dateRange', '90d');
    await settle(fixture);

    expect(shown(select)).toEqual({ value: '90d', label: '90 derniers jours' });
  });

  it('Given the select When the user picks Tout le temps Then dateRangeChanged emits all', async () => {
    const { fixture, select } = await renderPeriod('30d');
    const emitted: DateRangeKey[] = [];
    fixture.componentInstance.dateRangeChanged.subscribe((range) => emitted.push(range));

    if (select) {
      select.value = 'all';
      select.dispatchEvent(new Event('change'));
    }

    expect(emitted).toEqual(['all']);
  });
});

describe('AdminAnalyticsHeader: libellés en français', () => {
  it('Given the header When it renders Then the page is titled « Audience » and the export says « Exporter en CSV »', async () => {
    const fixture = TestBed.createComponent(AdminAnalyticsHeader);
    await settle(fixture);
    const host = fixture.nativeElement as HTMLElement;
    const title = byTestId(host, 'admin-page-title');

    expect({
      tag: title?.tagName,
      title: testIdText(host, 'admin-page-title'),
      exportLabel: testIdText(host, 'analytics-export-csv'),
    }).toEqual({ tag: 'H1', title: 'Audience', exportLabel: 'Exporter en CSV' });
  });

  it('Given the header When « Exporter en CSV » is pressed Then the export is requested once', async () => {
    const fixture = TestBed.createComponent(AdminAnalyticsHeader);
    let exports = 0;
    fixture.componentInstance.exportCsvClicked.subscribe(() => exports++);
    await settle(fixture);

    await pressTestId(fixture, 'analytics-export-csv');

    expect(exports).toBe(1);
  });
});
