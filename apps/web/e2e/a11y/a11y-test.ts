import AxeBuilder from '@axe-core/playwright';
import { test as base, expect, type Request, type Route } from '@playwright/test';
import { WCAG_TAGS } from './axe-policy';
import { formatViolations, type AxeResults } from './format-violations';
import type { Theme } from './scenarios';

const PRODUCTION_API_HOST = 'api.nedellec-julien.fr';
const STUB_URL = process.env['A11Y_STUB_URL'] ?? 'http://127.0.0.1:3001';
const THEME_STORAGE_KEY = 'j-ned:theme';
const SESSION_HINT_KEY = 'auth:session';

type A11yOptions = { readonly theme: Theme; readonly adminSession: boolean };

export type A11yAudit = { readonly results: AxeResults; readonly message: string };

type A11yFixtures = {
  readonly visit: (path: string) => Promise<void>;
  readonly analyzeA11y: (ready: string, state?: string) => Promise<A11yAudit>;
  readonly expectNoA11yViolations: (ready: string, state?: string) => Promise<void>;
};

type NetworkLog = { readonly rerouted: string[]; readonly blocked: string[] };

function corsHeaders(request: Request, origin: string): Record<string, string> {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers': request.headers()['access-control-request-headers'] ?? '*',
  };
}

async function replayOnStub(route: Route, url: URL, origin: string): Promise<void> {
  const request = route.request();
  const cors = corsHeaders(request, origin);
  if (request.method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: cors });
    return;
  }
  const response = await route.fetch({ url: new URL(url.pathname + url.search, STUB_URL).href });
  await route.fulfill({ response, headers: { ...response.headers(), ...cors } });
}

export const test = base.extend<A11yOptions & A11yFixtures>({
  theme: ['light', { option: true }],
  adminSession: [false, { option: true }],

  colorScheme: async ({ theme }, use) => {
    await use(theme);
  },

  context: async ({ context, theme, adminSession, baseURL }, use, testInfo) => {
    const network: NetworkLog = { rerouted: [], blocked: [] };
    const origin = new URL(baseURL ?? 'http://127.0.0.1:3000').origin;
    await context.addInitScript(
      ([themeKey, themeValue, sessionKey, withSession]) => {
        localStorage.setItem(themeKey, themeValue);
        if (withSession) localStorage.setItem(sessionKey, '1');
      },
      [THEME_STORAGE_KEY, theme, SESSION_HINT_KEY, adminSession] as const,
    );
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.origin === origin) {
        await route.continue();
        return;
      }
      if (url.hostname === PRODUCTION_API_HOST) {
        network.rerouted.push(`${route.request().method()} ${url.pathname}${url.search}`);
        await replayOnStub(route, url, origin);
        return;
      }
      network.blocked.push(url.href);
      await route.abort('blockedbyclient');
    });
    await use(context);
    await testInfo.attach('network.json', {
      body: JSON.stringify(network, null, 2),
      contentType: 'application/json',
    });
  },

  visit: async ({ page, theme }, use) => {
    await use(async (path) => {
      await page.goto(path);
      const html = page.locator('html');
      if (theme === 'dark') await expect(html).toHaveClass(/\bapp-dark\b/);
      else await expect(html).not.toHaveClass(/\bapp-dark\b/);
      // Les blocs `@defer (on viewport)` ne se rendent qu'une fois traversés par le défilement.
      await page.evaluate(async () => {
        const nextFrame = (): Promise<void> =>
          new Promise((resolve) => requestAnimationFrame(() => resolve()));
        let previous = -1;
        while (window.scrollY !== previous) {
          previous = window.scrollY;
          window.scrollBy({ top: window.innerHeight / 2, behavior: 'instant' });
          await nextFrame();
          await nextFrame();
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
    });
  },

  analyzeA11y: async ({ page, theme }, use, testInfo) => {
    await use(async (ready, state = 'page') => {
      await expect(page.getByTestId(ready).first()).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags([...WCAG_TAGS]).analyze();
      const pagePath = new URL(page.url()).pathname;
      await testInfo.attach(`axe-${state}.json`, {
        body: JSON.stringify({ page: pagePath, theme, state, ...results }, null, 2),
        contentType: 'application/json',
      });
      if (results.incomplete.length > 0) {
        testInfo.annotations.push({
          type: 'axe incomplete (revue humaine)',
          description: results.incomplete.map((rule) => rule.id).join(', '),
        });
      }
      return {
        results,
        message: formatViolations(results.violations, { page: pagePath, theme, state }),
      };
    });
  },

  expectNoA11yViolations: async ({ analyzeA11y }, use) => {
    await use(async (ready, state) => {
      const { results, message } = await analyzeA11y(ready, state);
      expect(
        results.violations.map((violation) => violation.id),
        message,
      ).toEqual([]);
    });
  },
});

export { expect };
