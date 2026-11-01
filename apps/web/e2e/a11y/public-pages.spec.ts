import { expect, test } from './a11y-test';
import { FOOTER_READY, PUBLIC_PAGES, THEMES } from './scenarios';

for (const theme of THEMES) {
  test.describe(`Pages publiques · thème ${theme}`, () => {
    test.use({ theme });

    for (const scenario of PUBLIC_PAGES) {
      test(`${scenario.path} has no WCAG A/AA violation`, async ({
        page,
        visit,
        expectNoA11yViolations,
      }) => {
        await visit(scenario.path);
        await expect(page.getByTestId(FOOTER_READY)).toBeVisible();
        await expectNoA11yViolations(scenario.ready);
      });
    }
  });
}
