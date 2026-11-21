import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { injectIsBrowser } from './inject-is-browser';

describe('injectIsBrowser', () => {
  it.each([
    { platform: 'browser', expected: true },
    { platform: 'server', expected: false },
  ])(
    'Given the $platform platform When asked in an injection context Then it answers $expected',
    ({ platform, expected }) => {
      TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });

      expect(TestBed.runInInjectionContext(injectIsBrowser)).toBe(expected);
    },
  );
});
