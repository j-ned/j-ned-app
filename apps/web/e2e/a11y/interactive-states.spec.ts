import type { Locator, Page, TestInfo } from '@playwright/test';
import { expect, test } from './a11y-test';
import { ADMIN_PENDING_OR_FAILED, FOOTER_READY, THEMES } from './scenarios';

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const PROFILE_API = 'https://nedellec-julien.fr/api/profile';

// Un autre onglet enregistre le parcours : la requête part de la page et la doublure la reçoit.
async function saveProfileElsewhere(page: Page): Promise<void> {
  const status = await page.evaluate(async (url) => {
    const current = (await (await fetch(url)).json()) as Record<string, unknown>;
    const saved = await fetch(url, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(current),
    });
    return saved.status;
  }, PROFILE_API);
  expect(status).toBe(200);
}

async function capture(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  const path = testInfo.outputPath(name);
  await page.screenshot({ path });
  await testInfo.attach(name, { path, contentType: 'image/png' });
}

// Chromium sans fenêtre ne change jamais `visibilityState` : la page le reçoit comme au retour.
async function returnToTab(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const state of ['hidden', 'visible']) {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
      document.dispatchEvent(new Event('visibilitychange'));
    }
  });
}

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

    test.describe('commentaires', () => {
      const mainForm = (page: Page): Locator =>
        page.getByRole('group', { name: 'Laisser un commentaire' });

      const fillComment = async (page: Page, name: string): Promise<void> => {
        const form = mainForm(page);
        await form.getByLabel('Nom ou pseudo').fill(name);
        await form.getByLabel('E-mail').fill('lou@example.test');
        await form.getByLabel('Message').fill('Bel article, merci.');
        await form.getByRole('button', { name: 'Envoyer' }).click();
      };

      // happy-dom lit `textContent` : seul un navigateur calcule le nom accessible réel d'un titre.
      test('comment headings keep their exact accessible names', async ({ page, visit }) => {
        await visit('/blog/article-temoin');
        await expect(
          page.getByRole('heading', { name: 'Commentaires (4)', exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole('region', { name: 'Commentaires (4)', exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole('heading', { name: 'Julien Nédellec, auteur de l’article', exact: true }),
        ).toBeVisible();
      });

      test('comment form with errors has no WCAG A/AA violation', async ({
        page,
        visit,
        expectNoA11yViolations,
      }) => {
        await visit('/blog/article-temoin');
        const form = mainForm(page);
        await form.getByRole('button', { name: 'Envoyer' }).click();
        await expect(form.getByRole('alert')).toHaveCount(3);
        await expectNoA11yViolations('comment-main-form', 'commentaire-erreurs');
      });

      test('accepted comment confirmation has no WCAG A/AA violation', async ({
        page,
        visit,
        expectNoA11yViolations,
      }) => {
        await visit('/blog/article-temoin');
        await fillComment(page, 'Lou');
        await expect(page.getByRole('status').filter({ hasText: 'après relecture' })).toBeFocused();
        await expect(
          page.getByRole('article', { name: 'Lou En attente de relecture' }),
        ).toBeVisible();
        await expectNoA11yViolations('comment-main-form', 'commentaire-envoye');
      });

      test('open reply form has no WCAG A/AA violation', async ({
        page,
        visit,
        expectNoA11yViolations,
      }) => {
        await visit('/blog/article-temoin');
        await page.getByRole('button', { name: 'Répondre à Camille' }).click();
        await expect(
          page.getByRole('group', { name: 'Répondre à Camille' }).getByLabel('Nom ou pseudo'),
        ).toBeFocused();
        await expectNoA11yViolations('comment-reply-form', 'reponse-ouverte');
      });

      test('refused comment alert has no WCAG A/AA violation', async ({
        page,
        visit,
        expectNoA11yViolations,
      }) => {
        await visit('/blog/article-temoin');
        await fillComment(page, 'stub-429');
        await expect(page.getByRole('alert').filter({ hasText: 'Trop d’envois' })).toBeVisible();
        await expectNoA11yViolations('comment-main-form', 'commentaire-refuse');
      });
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

      test('newer version saved elsewhere, then its reload dialog, have no WCAG A/AA violation', async ({
        page,
        visit,
        expectNoA11yViolations,
      }, testInfo) => {
        await visit('/admin/profile');
        const title = page.getByTestId('admin-profile-biography-title');
        const saved = await title.inputValue();
        await title.fill('Brouillon de cet onglet');
        await saveProfileElsewhere(page);

        await returnToTab(page);

        const notice = page.getByTestId('admin-profile-newer-version');
        await expect(notice).toHaveAttribute('role', 'status');
        await expect(notice).toContainText(
          'Une version plus récente du parcours a été enregistrée ailleurs.',
        );
        await expect(title).toBeFocused();
        await expect(title).toHaveValue('Brouillon de cet onglet');
        await capture(page, testInfo, 'version-plus-recente.png');
        await expectNoA11yViolations('admin-profile-newer-version', 'version-plus-recente');

        await page.getByRole('button', { name: 'Recharger la dernière version' }).click();
        await expect(page.getByRole('dialog')).toContainText('1 modification non enregistrée');
        await capture(page, testInfo, 'recharger-confirmation.png');
        await expectNoA11yViolations('admin-profile-newer-version', 'recharger-confirmation');

        await page.getByRole('dialog').getByRole('button', { name: 'Recharger' }).click();
        await expect(notice).toHaveText('Dernière version chargée.');
        await expect(notice).toBeFocused();
        await expect(title).toHaveValue(saved);
        await capture(page, testInfo, 'version-rechargee.png');
      });
    });
  });
}
