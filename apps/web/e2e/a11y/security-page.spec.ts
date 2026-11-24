import type { Page } from '@playwright/test';
import { expect, test } from './a11y-test';
import { ADMIN_PENDING_OR_FAILED, THEMES } from './scenarios';

const SECURITY = '/admin/settings/security';

// La doublure de l'API rend un QR factice puis dix codes de secours, sans vérifier la saisie.
async function showQrCode(page: Page): Promise<void> {
  await page.getByTestId('twofa-generate').click();
  await expect(page.getByTestId('twofa-setup-code')).toBeVisible();
}

for (const theme of THEMES) {
  test.describe(`Page Sécurité · thème ${theme}`, () => {
    test.use({ theme, adminSession: true });

    test.beforeEach(async ({ page, visit }) => {
      await visit(SECURITY);
      await expect(page.getByTestId('twofa-generate')).toBeVisible();
      await expect(page.locator(ADMIN_PENDING_OR_FAILED)).toHaveCount(0);
    });

    test('2FA not configured has no WCAG A/AA violation', async ({ expectNoA11yViolations }) => {
      await expectNoA11yViolations('twofa-generate', '2fa-inactive');
    });

    test('QR code with field errors has no WCAG A/AA violation', async ({
      page,
      expectNoA11yViolations,
    }) => {
      await showQrCode(page);
      await page.getByTestId('twofa-submit').click();
      await expect(page.locator('#twofa-setup-password-error')).toBeVisible();

      await expectNoA11yViolations('twofa-setup-code', 'qr-et-erreurs');
    });

    test('backup codes after activation have no WCAG A/AA violation', async ({
      page,
      expectNoA11yViolations,
    }) => {
      await showQrCode(page);
      await page.getByTestId('twofa-setup-password').fill('a-long-password');
      await page.getByTestId('twofa-setup-code').fill('123456');
      await page.getByTestId('twofa-submit').click();
      await expect(page.getByTestId('twofa-backup-code')).toHaveCount(10);

      await expectNoA11yViolations('twofa-backup-codes-done', 'codes-de-secours');
    });
  });
}
