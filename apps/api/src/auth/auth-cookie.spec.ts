import { AUTH_COOKIE_NAME, authCookieOptions } from './auth-cookie';

describe('auth cookie', () => {
  it('Given the cookie name, When read, Then it carries the __Host- prefix', () => {
    expect(AUTH_COOKIE_NAME.startsWith('__Host-')).toBe(true);
  });

  it.each([undefined, 60_000])(
    'Given a max age of %s, When options are built, Then they meet the __Host- rules and are strict',
    (maxAge) => {
      const options = authCookieOptions(maxAge);

      expect(options).toMatchObject({
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        path: '/',
      });
      expect(options).not.toHaveProperty('domain');
    },
  );

  it('Given a max age, When options are built, Then the cookie expires with the JWT', () => {
    expect(authCookieOptions(60_000, () => 1_000)).toMatchObject({
      maxAge: 60,
      expires: new Date(61_000),
    });
  });

  it('Given no max age (logout), When options are built, Then the cookie is already expired', () => {
    const options = authCookieOptions();

    expect(options).not.toHaveProperty('maxAge');
    expect(options.expires).toEqual(new Date(0));
  });
});
