import { resolveDeployment } from './deployment';

describe('resolveDeployment', () => {
  it.each([
    [{}, 'local'],
    [{ APP_ENV: 'production' }, 'production'],
    [{ APP_ENV: 'preview' }, 'preview'],
    [{ VERCEL_ENV: 'production' }, 'production'],
    [{ VERCEL_ENV: 'preview' }, 'preview'],
    [{ VERCEL_ENV: 'development' }, 'preview'],
  ] as const)('Given %o, Then %s', (env, expected) => {
    expect(resolveDeployment(env)).toBe(expected);
  });

  it('Given a Vercel preview that also carries APP_ENV=production, Then it stays a preview', () => {
    expect(
      resolveDeployment({ VERCEL_ENV: 'preview', APP_ENV: 'production' }),
    ).toBe('preview');
  });

  it('Given Vercel production that also carries APP_ENV=preview, Then it stays production', () => {
    expect(
      resolveDeployment({ VERCEL_ENV: 'production', APP_ENV: 'preview' }),
    ).toBe('production');
  });
});
