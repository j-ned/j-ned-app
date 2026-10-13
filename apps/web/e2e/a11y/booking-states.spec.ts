import { expect, test } from './a11y-test';
import { ADMIN_PENDING_OR_FAILED, FOOTER_READY, THEMES } from './scenarios';
import type { Page } from '@playwright/test';

// Les boutons radio des jours et des heures sont visuellement masqués : on clique leur étiquette.
async function chooseFirstDayAndTime(page: Page): Promise<void> {
  await page
    .locator('label', { has: page.getByTestId('booking-day-option') })
    .first()
    .click();
  await page
    .locator('label', { has: page.getByTestId('booking-time-option') })
    .first()
    .click();
  await expect(page.getByTestId('booking-summary')).toBeVisible();
}

for (const theme of THEMES) {
  test.describe(`Prise de rendez-vous · thème ${theme}`, () => {
    test.use({ theme });

    test.describe('visiteur', () => {
      test.beforeEach(async ({ page, visit }) => {
        await visit('/rendez-vous');
        await expect(page.getByTestId(FOOTER_READY)).toBeVisible();
        await expect(page.getByTestId('booking-day-picker')).toBeVisible();
      });

      test('chosen day and time has no WCAG A/AA violation', async ({
        page,
        expectNoA11yViolations,
      }) => {
        await chooseFirstDayAndTime(page);
        await expectNoA11yViolations('booking-summary', 'creneau-choisi');
      });

      test('empty details submitted has no WCAG A/AA violation', async ({
        page,
        expectNoA11yViolations,
      }) => {
        await chooseFirstDayAndTime(page);
        await page.getByTestId('booking-submit').click();
        await expect(page.getByTestId('booking-name-error')).toBeVisible();
        await expect(page.getByTestId('booking-email-error')).toBeVisible();
        await expect(page.getByTestId('booking-message-error')).toBeVisible();
        await expectNoA11yViolations('booking-name-error', 'formulaire-soumis-vide');
      });

      test('confirmation screen has no WCAG A/AA violation', async ({
        page,
        expectNoA11yViolations,
      }) => {
        await chooseFirstDayAndTime(page);
        await page.getByTestId('booking-name').fill('Claire Martin');
        await page.getByTestId('booking-email').fill('claire.martin@atelier-exemple.test');
        await page.getByTestId('booking-message').fill('Site vitrine pour notre atelier.');
        await page.getByTestId('booking-submit').click();
        await expect(page.getByTestId('booking-confirmation-heading')).toBeFocused();
        await expectNoA11yViolations('booking-confirmation', 'confirmation');
      });
    });

    test.describe('admin', () => {
      test.use({ adminSession: true });

      test('open booking cancellation dialog has no WCAG A/AA violation', async ({
        page,
        visit,
        expectNoA11yViolations,
      }) => {
        await visit('/admin/rendez-vous');
        await expect(page.getByTestId('admin-booking-row')).toHaveCount(3);
        await expect(page.locator(ADMIN_PENDING_OR_FAILED)).toHaveCount(0);
        await page.getByTestId('admin-booking-cancel').first().click();
        await expect(page.locator('dialog[open]')).toHaveCount(1);
        await expect(page.getByTestId('admin-booking-reason')).toBeVisible();
        await expectNoA11yViolations('confirm-dialog', 'dialogue-annulation-ouvert');
      });

      test('overlapping weekly ranges submitted has no WCAG A/AA violation', async ({
        page,
        visit,
        expectNoA11yViolations,
      }) => {
        await visit('/admin/disponibilites');
        await expect(page.getByTestId('admin-closure')).toHaveCount(2);
        await expect(page.locator(ADMIN_PENDING_OR_FAILED)).toHaveCount(0);
        await page.getByTestId('admin-availability-rule-start').nth(1).selectOption('10:00');
        await page.getByTestId('savebar-submit').click();
        await expect(page.getByTestId('admin-availability-rule-start-error')).toHaveText(
          'Chevauche la plage 1',
        );
        await expectNoA11yViolations('admin-availability-rule-start-error', 'chevauchement');
      });
    });
  });
}
