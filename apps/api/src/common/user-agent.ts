import { UAParser } from 'ua-parser-js';

export type UserAgentSummary = {
  readonly browser: string | null;
  readonly os: string | null;
};

/** Navigateur et système avec leur version ; `null` dès que le nom ou la version manque. */
export function describeUserAgent(userAgent: string): UserAgentSummary {
  const { browser, os } = new UAParser(userAgent).getResult();
  return {
    browser:
      browser.name && browser.version
        ? `${browser.name} ${browser.version}`
        : null,
    os: os.name && os.version ? `${os.name} ${os.version}` : null,
  };
}
