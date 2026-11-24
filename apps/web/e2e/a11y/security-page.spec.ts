import type { Page } from '@playwright/test';
import { expect, test } from './a11y-test';
import { ADMIN_PENDING_OR_FAILED, THEMES } from './scenarios';

const SECURITY = '/admin/settings/security';

// La doublure de l'API rend un QR factice puis dix codes de secours, sans vérifier la saisie.
async function showQrCode(page: Page): Promise<void> {
  await page.getByTestId('twofa-generate').click();
  await expect(page.getByTestId('twofa-setup-code')).toBeVisible();
}

// La doublure ne retient pas l'activation : c'est la page, après ce parcours, qui tient la 2FA pour active.
async function activate(page: Page): Promise<void> {
  await showQrCode(page);
  await page.getByTestId('twofa-setup-password').fill('a-long-password');
  await page.getByTestId('twofa-setup-code').fill('123456');
  await page.getByTestId('twofa-submit').click();
  await expect(page.getByTestId('twofa-backup-code')).toHaveCount(10);
}

async function startReconfiguration(page: Page): Promise<void> {
  await activate(page);
  await page.getByTestId('twofa-backup-codes-done').click();
  await page.getByTestId('twofa-reconfigure').click();
  await expect(page.getByTestId('twofa-reconfigure-cancel')).toBeVisible();
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
      await activate(page);

      await expectNoA11yViolations('twofa-backup-codes-done', 'codes-de-secours');
    });

    test('reconfiguration with field errors has no WCAG A/AA violation', async ({
      page,
      expectNoA11yViolations,
    }) => {
      await startReconfiguration(page);
      await page.getByTestId('twofa-submit').click();
      await expect(page.locator('#twofa-setup-password-error')).toBeVisible();

      await expectNoA11yViolations('twofa-reconfigure-cancel', 'reconfiguration-et-erreurs');
    });

    test('confirmed reconfiguration has no WCAG A/AA violation', async ({
      page,
      expectNoA11yViolations,
    }) => {
      await startReconfiguration(page);
      await page.getByTestId('twofa-setup-password').fill('a-long-password');
      await page.getByTestId('twofa-setup-code').fill('123456');
      await page.getByTestId('twofa-submit').click();
      await expect(page.getByTestId('twofa-backup-code')).toHaveCount(10);
      await expect(page.getByText('Authentification à deux facteurs reconfigurée.')).toBeVisible();

      await expectNoA11yViolations('twofa-backup-codes-done', 'reconfiguration-confirmee');
    });
  });
}
