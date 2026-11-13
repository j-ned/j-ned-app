import { resolveDeployment } from './deployment';

describe('resolveDeployment', () => {
  it.each([
    [{}, 'local'],
    [{ APP_ENV: 'production' }, 'production'],
    [{ APP_ENV: 'preview' }, 'preview'],
  ] as const)('Given %o, Then %s', (env, expected) => {
    expect(resolveDeployment(env)).toBe(expected);
  });

  it('Given only a variable left over from the former host, Then the run is local', () => {
    const leftover: Record<string, string> = { VERCEL_ENV: 'production' };

    expect(resolveDeployment(leftover)).toBe('local');
  });
});
