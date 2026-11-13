import { describe, expect, it } from 'vitest';
import { visitorIpFromProxy } from './visitor-ip';

describe('visitorIpFromProxy', () => {
  it('Given Vercel, Then the address comes from x-real-ip', () => {
    expect(visitorIpFromProxy({ 'x-real-ip': '203.0.113.7' }, { VERCEL: '1' })).toBe('203.0.113.7');
  });

  it('Given no trusted proxy declared, Then a client-sent x-real-ip is ignored', () => {
    expect(visitorIpFromProxy({ 'x-real-ip': '203.0.113.7' }, {})).toBeNull();
  });

  it('Given a proxy header declared by VISITOR_IP_HEADER, Then the address comes from it', () => {
    expect(
      visitorIpFromProxy({ 'x-real-ip': '203.0.113.7' }, { VISITOR_IP_HEADER: 'X-Real-IP' }),
    ).toBe('203.0.113.7');
  });

  it('Given a declared header other than x-real-ip, Then x-real-ip is ignored', () => {
    expect(
      visitorIpFromProxy(
        { 'x-real-ip': '198.51.100.1', 'x-visitor-ip': '203.0.113.7' },
        { VISITOR_IP_HEADER: 'x-visitor-ip' },
      ),
    ).toBe('203.0.113.7');
  });

  it.each([
    ['absent', {}],
    ['empty', { 'x-real-ip': '' }],
    ['repeated', { 'x-real-ip': ['203.0.113.7', '198.51.100.1'] }],
  ])('Given a declared header that is %s, Then there is no address', (_, headers) => {
    expect(visitorIpFromProxy(headers, { VISITOR_IP_HEADER: 'x-real-ip' })).toBeNull();
  });

  it('Given an empty VISITOR_IP_HEADER off Vercel, Then nothing is trusted', () => {
    expect(
      visitorIpFromProxy({ 'x-real-ip': '203.0.113.7' }, { VISITOR_IP_HEADER: '' }),
    ).toBeNull();
  });
});
