import { authCookieOptions } from './auth-cookie';

describe('auth cookie', () => {
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
