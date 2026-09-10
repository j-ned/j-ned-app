import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { AdminAnalyticsHeader } from './admin-analytics-header';

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
