import { TestBed } from '@angular/core/testing';
import { ActiveSection } from './active-section';

describe('ActiveSection', () => {
  function inject(): ActiveSection {
    TestBed.configureTestingModule({});
    return TestBed.inject(ActiveSection);
  }

  it('Given a fresh store, Then no section is active', () => {
    expect(inject().key()).toBeNull();
  });

  it('Given set is called, Then the key becomes active', () => {
    const store = inject();
    store.set('contact');
    expect(store.key()).toBe('contact');
  });

  it('Given a different active key, When clear is called, Then it is a no-op', () => {
    const store = inject();
    store.set('contact');
    store.clear('about');
    expect(store.key()).toBe('contact');
  });

  it('Given the matching active key, When clear is called, Then it resets to null', () => {
    const store = inject();
    store.set('contact');
    store.clear('contact');
    expect(store.key()).toBeNull();
  });
});
