import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { vi } from 'vitest';
import { ActiveSection } from './active-section';
import { SectionVisibility } from './section-visibility';
import { defined } from '@shared/testing/defined';
import { FakeIntersectionObserver } from '@shared/testing/fake-intersection-observer';

@Component({
  imports: [SectionVisibility],
  template: `<div appSectionVisibility="contact"></div>`,
})
class Host {}

describe('SectionVisibility', () => {
  let fixture: ComponentFixture<Host>;
  let active: ActiveSection;
  const original = globalThis.IntersectionObserver;

  beforeEach(async () => {
    FakeIntersectionObserver.instances = [];
    globalThis.IntersectionObserver = FakeIntersectionObserver;

    TestBed.configureTestingModule({ imports: [Host] });
    active = TestBed.inject(ActiveSection);
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    globalThis.IntersectionObserver = original;
    vi.restoreAllMocks();
  });

  it('observes the host element after render', () => {
    expect(FakeIntersectionObserver.instances.length).toBe(1);
    const host = fixture.nativeElement.querySelector('div') as HTMLElement;
    expect(defined(FakeIntersectionObserver.instances[0]).observed).toContain(host);
  });

  it('Given the section enters the viewport, Then it becomes the active section', () => {
    defined(FakeIntersectionObserver.instances[0]).emit(true);
    expect(active.key()).toBe('contact');
  });

  it('Given the section leaves the viewport, Then it clears the active section', () => {
    defined(FakeIntersectionObserver.instances[0]).emit(true);
    defined(FakeIntersectionObserver.instances[0]).emit(false);
    expect(active.key()).toBeNull();
  });

  it('Given the host is destroyed while active, Then it clears the active section', () => {
    defined(FakeIntersectionObserver.instances[0]).emit(true);
    expect(active.key()).toBe('contact');

    fixture.destroy();

    expect(active.key()).toBeNull();
  });
});
