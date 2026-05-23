import { TestBed } from '@angular/core/testing';
import { ThemeWatcher } from './theme-watcher';

describe('ThemeWatcher', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('app-dark');
  });

  afterEach(() => {
    document.documentElement.classList.remove('app-dark');
  });

  it('reads initial value from documentElement class', () => {
    document.documentElement.classList.add('app-dark');
    TestBed.configureTestingModule({});
    const watcher = TestBed.inject(ThemeWatcher);
    expect(watcher.isDark()).toBe(true);
  });

  it('reads false when app-dark class is absent', () => {
    TestBed.configureTestingModule({});
    const watcher = TestBed.inject(ThemeWatcher);
    expect(watcher.isDark()).toBe(false);
  });

  it('updates the signal when the class is added at runtime', async () => {
    TestBed.configureTestingModule({});
    const watcher = TestBed.inject(ThemeWatcher);
    expect(watcher.isDark()).toBe(false);

    document.documentElement.classList.add('app-dark');
    // MutationObserver fires asynchronously, wait for microtask flush.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(watcher.isDark()).toBe(true);
  });

  it('updates the signal when the class is removed at runtime', async () => {
    document.documentElement.classList.add('app-dark');
    TestBed.configureTestingModule({});
    const watcher = TestBed.inject(ThemeWatcher);
    expect(watcher.isDark()).toBe(true);

    document.documentElement.classList.remove('app-dark');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(watcher.isDark()).toBe(false);
  });
});
