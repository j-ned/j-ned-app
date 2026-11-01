import { describe, expect, it } from 'vitest';
import { visitorHeaders } from './visitor-headers';

describe('visitorHeaders', () => {
  it('Given no known visitor When headers are built Then nothing is forwarded', () => {
    expect(visitorHeaders(null, 'secret')).toEqual({});
  });

  it('Given a visitor behind nginx (no shared secret) When headers are built Then only X-Forwarded-For is sent', () => {
    expect(visitorHeaders('203.0.113.7', null)).toEqual({ 'X-Forwarded-For': '203.0.113.7' });
  });

  it('Given a visitor on Vercel (shared secret) When headers are built Then the API can trust the forwarded IP', () => {
    expect(visitorHeaders('203.0.113.7', 'secret')).toEqual({
      'X-Forwarded-For': '203.0.113.7',
      'x-ssr-visitor-ip': '203.0.113.7',
      'x-ssr-secret': 'secret',
    });
  });
});
