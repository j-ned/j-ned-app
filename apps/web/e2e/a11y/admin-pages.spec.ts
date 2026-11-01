import { expect, test } from './a11y-test';
import { ADMIN_PAGES, ADMIN_PENDING_OR_FAILED, THEMES } from './scenarios';

for (const theme of THEMES) {
  test.describe(`Pages admin · thème ${theme}`, () => {
    test.use({ theme, adminSession: true });

    for (const scenario of ADMIN_PAGES) {
      test(`${scenario.path} with data has no WCAG A/AA violation`, async ({
        page,
        visit,
        expectNoA11yViolations,
      }) => {
        await visit(scenario.path);
        await expect(page.getByTestId(scenario.ready).first()).toBeVisible();
        await expect(page.locator(ADMIN_PENDING_OR_FAILED)).toHaveCount(0);
        await expectNoA11yViolations(scenario.ready);
      });
    }
  });
}
