import { RESPONSE_INIT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { injectMarkNotFound, injectMarkUnavailable } from './response-status';

describe('injectMarkNotFound', () => {
  it('Given a server render When the page marks itself not found after its data arrived Then the response status is 404', () => {
    const responseInit: ResponseInit = { status: 200, headers: new Headers() };
    TestBed.configureTestingModule({
      providers: [{ provide: RESPONSE_INIT, useValue: responseInit }],
    });
    const markNotFound = TestBed.runInInjectionContext(injectMarkNotFound);

    markNotFound();

    expect(responseInit.status).toBe(404);
  });

  it('Given the browser When the page marks itself not found Then nothing happens', () => {
    TestBed.configureTestingModule({});
    const markNotFound = TestBed.runInInjectionContext(injectMarkNotFound);

    expect(() => markNotFound()).not.toThrow();
  });
});

describe('injectMarkUnavailable', () => {
  it('Given a server render When the page marks itself unavailable after a failed read Then the response status is 503', () => {
    const responseInit: ResponseInit = { status: 200, headers: new Headers() };
    TestBed.configureTestingModule({
      providers: [{ provide: RESPONSE_INIT, useValue: responseInit }],
    });
    const markUnavailable = TestBed.runInInjectionContext(injectMarkUnavailable);

    markUnavailable();

    expect(responseInit.status).toBe(503);
  });

  it('Given the browser When the page marks itself unavailable Then nothing happens', () => {
    TestBed.configureTestingModule({});
    const markUnavailable = TestBed.runInInjectionContext(injectMarkUnavailable);

    expect(() => markUnavailable()).not.toThrow();
  });
});
