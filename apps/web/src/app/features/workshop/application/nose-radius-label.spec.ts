import { describe, expect, it } from 'vitest';
import { noseRadiusLabel } from './nose-radius-label';

describe('noseRadiusLabel', () => {
  it.each([
    [0.4, '0,4\u00a0mm'],
    [0.8, '0,8\u00a0mm'],
    [1.2, '1,2\u00a0mm'],
    [2, '2\u00a0mm'],
    [0.05, '0,05\u00a0mm'],
  ])('Given a nose radius of %d mm When it is labelled Then it reads « %s »', (radius, label) => {
    expect(noseRadiusLabel(radius)).toBe(label);
  });
});
