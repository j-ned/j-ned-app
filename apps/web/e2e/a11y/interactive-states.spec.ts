import { expect, test } from './a11y-test';
import { ADMIN_PENDING_OR_FAILED, FOOTER_READY, THEMES } from './scenarios';

const MOBILE_VIEWPORT = { width: 390, height: 844 };

for (const theme of THEMES) {
  test.describe(`États interactifs · thème ${theme}`, () => {
    test.use({ theme });

    test.describe('mobile', () => {
      test.use({ viewport: MOBILE_VIEWPORT });

      test('open mobile menu has no WCAG A/AA violation', async ({
        page,
        visit,
        expectNoA11yViolations,
      }) => {
        await visit('/');
        await expect(page.getByTestId(FOOTER_READY)).toBeVisible();
        await page.getByTestId('header-menu-toggle').click();
        await expectNoA11yViolations('mobile-nav', 'menu-mobile-ouvert');
      });

      test.describe('admin', () => {
        test.use({ adminSession: true });

        test('open admin mobile menu has no WCAG A/AA violation', async ({
          page,
          visit,
          expectNoA11yViolations,
        }) => {
          await visit('/admin');
          await expect(page.getByTestId('overview-message').first()).toBeVisible();
          await expect(page.locator(ADMIN_PENDING_OR_FAILED)).toHaveCount(0);
          await page.getByTestId('admin-menu-button').click();
          await expectNoA11yViolations('drawer-panel', 'menu-admin-ouvert');
        });
      });
    });

    test('atelier: guide-plaquettes material field with open suggestions has no WCAG A/AA violation', async ({
      page,
      visit,
      expectNoA11yViolations,
    }) => {
      await visit('/atelier/plaquettes');
      const field = page.getByRole('combobox', { name: 'Matière' });
      await field.fill('tém');
      await expect(page.getByRole('listbox', { name: 'Matières du guide' })).toBeVisible();
      await field.press('ArrowDown');
      await expectNoA11yViolations('suggest-listbox', 'matieres-suggerees');
    });

    test.describe('admin', () => {
      test.use({ adminSession: true });

      test('open delete confirmation dialog has no WCAG A/AA violation', async ({
        page,
        visit,
        expectNoA11yViolations,
      }) => {
        await visit('/admin/projects');
        await expect(page.getByTestId('admin-projects-list')).toBeVisible();
        await expect(page.locator(ADMIN_PENDING_OR_FAILED)).toHaveCount(0);
        await page.getByTestId('admin-project-delete').first().click();
        await expect(page.locator('dialog[open]')).toHaveCount(1);
        await expectNoA11yViolations('confirm-dialog', 'dialogue-confirmation-ouvert');
      });

      test('tags field with a free tag, a refusal and open suggestions has no WCAG A/AA violation', async ({
        page,
        visit,
        expectNoA11yViolations,
      }) => {
        await visit('/admin/blog/b-temoin');
        const field = page.getByRole('combobox', { name: 'Tags' });
        await expect(field).toBeVisible();
        await field.fill('Playwright');
        await field.press('Enter');
        await expect(page.getByRole('button', { name: 'Retirer le tag Playwright' })).toBeVisible();
        await field.fill('angular');
        await field.press('Enter');
        await expect(page.getByTestId('tags-error')).toBeVisible();
        await field.fill('secu');
        await field.press('ArrowDown');
        await expect(page.getByRole('listbox', { name: 'Tags suggérés' })).toBeVisible();
        await expectNoA11yViolations('admin-post-tags', 'champ-tags-ouvert');
      });

      test('tags suggested from the article content have no WCAG A/AA violation', async ({
        page,
        visit,
        expectNoA11yViolations,
      }) => {
        await visit('/admin/blog/b-temoin');
        await page.getByTestId('admin-post-content').fill('Un module NestJS en TypeScript.');
        const hints = page.getByRole('group', { name: "Suggérés d'après l'article" });
        await expect(hints.getByRole('button', { name: 'Ajouter le tag NestJS' })).toBeVisible();
        await expectNoA11yViolations('admin-post-tags', 'tags-suggeres-article');
      });
    });
  });
}
