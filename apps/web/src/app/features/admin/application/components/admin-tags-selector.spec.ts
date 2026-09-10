import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { AdminTagsSelector } from './admin-tags-selector';

describe('AdminTagsSelector', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AdminTagsSelector] });
  });

  type Harness = { fixture: ComponentFixture<AdminTagsSelector>; chips: () => HTMLButtonElement[] };

  function render(available: readonly string[], selected: readonly string[] = []): Harness {
    const fixture = TestBed.createComponent(AdminTagsSelector);
    fixture.componentRef.setInput('availableTags', available);
    fixture.componentRef.setInput('selectedTags', new Set(selected));
    fixture.detectChanges();
    const chips = (): HTMLButtonElement[] =>
      Array.from(
        fixture.nativeElement.querySelectorAll('[data-testid="tag-chip"]') as NodeListOf<HTMLButtonElement>,
      );
    return { fixture, chips };
  }

  it('renders one pressed button per available tag', () => {
    const { chips } = render(['Angular', 'PBKDF2'], ['Angular']);
    expect(chips().map((c) => c.textContent?.trim())).toEqual(['Angular', 'PBKDF2']);
    expect(chips().map((c) => c.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
  });

  it('toggles a tag in and out of the selection', () => {
    const { fixture, chips } = render(['Angular', 'PBKDF2'], ['Angular']);
    chips()[1].click();
    expect([...fixture.componentInstance.selectedTags()]).toEqual(['Angular', 'PBKDF2']);
    chips()[0].click();
    expect([...fixture.componentInstance.selectedTags()]).toEqual(['PBKDF2']);
  });

  it.each<[string, string, string]>([
    ['Angular', 'text-primary', 'bg-primary-bg'],
    ['PBKDF2', 'text-rose-700', 'bg-rose-700'],
    ['Tests', 'text-emerald-700', 'bg-emerald-700'],
    ['Carrière', 'text-amber-700', 'bg-amber-700'],
    ['CI/CD', 'text-sky-700', 'bg-sky-700'],
    ['Tag projet', 'text-muted', 'bg-primary-bg'],
  ])('colours "%s" by category: %s when idle, %s when selected', (tag, tint, solid) => {
    const { fixture, chips } = render([tag]);
    expect(chips()[0].className).toContain(tint);
    chips()[0].click();
    fixture.detectChanges();
    expect(chips()[0].className).toContain(solid);
    expect(chips()[0].className).not.toContain(tint);
  });
});
