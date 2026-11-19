import { describeUserAgent } from './user-agent';

describe('describeUserAgent', () => {
  it('Given a desktop browser user-agent, When described, Then browser and system carry their version', () => {
    expect(
      describeUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ),
    ).toEqual({ browser: 'Chrome 120.0.0.0', os: 'Windows 10' });
  });

  it.each([[''], ['not a browser']])(
    'Given the unrecognised user-agent "%s", When described, Then browser and system are null',
    (userAgent) => {
      expect(describeUserAgent(userAgent)).toEqual({ browser: null, os: null });
    },
  );
});
