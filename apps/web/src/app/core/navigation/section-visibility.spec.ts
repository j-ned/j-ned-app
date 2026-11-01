import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { vi } from 'vitest';
import { ActiveSection } from './active-section';
import { SectionVisibility } from './section-visibility';

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly observed: Element[] = [];
  disconnected = false;

  constructor(
    private readonly _callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    MockIntersectionObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.observed.push(element);
  }

  disconnect(): void {
    this.disconnected = true;
  }

  unobserve(element: Element): void {
    const index = this.observed.indexOf(element);
    if (index !== -1) this.observed.splice(index, 1);
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  emit(isIntersecting: boolean): void {
    this._callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

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
    MockIntersectionObserver.instances = [];
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

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
    expect(MockIntersectionObserver.instances.length).toBe(1);
    const host = fixture.nativeElement.querySelector('div') as HTMLElement;
    expect(MockIntersectionObserver.instances[0].observed).toContain(host);
  });

  it('Given the section enters the viewport, Then it becomes the active section', () => {
    MockIntersectionObserver.instances[0].emit(true);
    expect(active.key()).toBe('contact');
  });

  it('Given the section leaves the viewport, Then it clears the active section', () => {
    MockIntersectionObserver.instances[0].emit(true);
    MockIntersectionObserver.instances[0].emit(false);
    expect(active.key()).toBeNull();
  });

  it('Given the host is destroyed while active, Then it clears the active section', () => {
    MockIntersectionObserver.instances[0].emit(true);
    expect(active.key()).toBe('contact');

    fixture.destroy();

    expect(active.key()).toBeNull();
  });
});
