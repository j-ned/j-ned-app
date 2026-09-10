import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsDeviceExclusion, DEVICE_EXCLUSION_STORAGE_KEY } from './analytics-device-exclusion';

function configure(platform: 'browser' | 'server'): AnalyticsDeviceExclusion {
  TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });
  return TestBed.inject(AnalyticsDeviceExclusion);
}

describe('AnalyticsDeviceExclusion', () => {
  beforeEach(() => {
    localStorage.removeItem(DEVICE_EXCLUSION_STORAGE_KEY);
  });

  it('is not excluded by default', () => {
    expect(configure('browser').excluded()).toBe(false);
  });

  it('restores the exclusion persisted in localStorage', () => {
    localStorage.setItem(DEVICE_EXCLUSION_STORAGE_KEY, '1');
    expect(configure('browser').excluded()).toBe(true);
  });

  it('toggle persists the exclusion, a second toggle clears it', () => {
    const exclusion = configure('browser');
    exclusion.toggle();
    expect(exclusion.excluded()).toBe(true);
    expect(localStorage.getItem(DEVICE_EXCLUSION_STORAGE_KEY)).toBe('1');
    exclusion.toggle();
    expect(exclusion.excluded()).toBe(false);
    expect(localStorage.getItem(DEVICE_EXCLUSION_STORAGE_KEY)).toBeNull();
  });

  it('never reads storage on the server', () => {
    localStorage.setItem(DEVICE_EXCLUSION_STORAGE_KEY, '1');
    expect(configure('server').excluded()).toBe(false);
  });
});
