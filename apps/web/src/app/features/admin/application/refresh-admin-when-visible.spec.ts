import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { forgetTabVisibility, showTab } from '@shared/testing/tab-visibility';
import {
  ADMIN_REFRESH_MIN_INTERVAL_MS,
  refreshAdminWhenVisible,
} from './refresh-admin-when-visible';

const START = Date.parse('2026-11-22T12:00:00.000Z');

describe('refreshAdminWhenVisible', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(START);
  });

  afterEach(() => {
    vi.useRealTimers();
    forgetTabVisibility();
  });

  it('Given an admin screen just reread When the tab comes back within 2 s Then nothing is reread; at 2 s, it is', () => {
    const refresh = vi.fn();
    const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    injector.runInContext(() => refreshAdminWhenVisible(refresh));
    showTab('visible');

    vi.setSystemTime(START + 1_999);
    showTab('visible');
    const within = refresh.mock.calls.length;
    vi.setSystemTime(START + 2_000);
    showTab('visible');

    expect({
      interval: ADMIN_REFRESH_MIN_INTERVAL_MS,
      calls: [within, refresh.mock.calls.length],
    }).toEqual({ interval: 2_000, calls: [1, 2] });
    injector.destroy();
  });
});
