import { test, expect } from '@playwright/test';

test.describe('Mobile drawer (menu hamburger)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('le menu desktop est caché sur mobile', async ({ page }) => {
    const desktopNav = page.locator('header nav.hidden.md\\:flex').first();
    await expect(desktopNav).not.toBeVisible();
  });

  test('le bouton hamburger ouvre le drawer', async ({ page }) => {
    const hamburger = page.getByRole('button', { name: /Ouvrir le menu/ });
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    // PrimeNG p-drawer rend un element avec role="dialog" quand ouvert
    const drawer = page.locator('.p-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText(/^Menu$/)).toBeVisible();
  });

  test('le drawer affiche les liens de navigation', async ({ page }) => {
    await page.getByRole('button', { name: /Ouvrir le menu/ }).click();

    const drawer = page.locator('.p-drawer');
    await expect(drawer.getByRole('link', { name: /Projets/ })).toBeVisible();
    await expect(drawer.getByRole('link', { name: /À propos/ })).toBeVisible();
    await expect(drawer.getByRole('link', { name: /Contact/ })).toBeVisible();
  });

  test('les liens du drawer ont des hrefs corrects', async ({ page }) => {
    await page.getByRole('button', { name: /Ouvrir le menu/ }).click();

    const drawer = page.locator('.p-drawer');
    await expect(drawer).toBeVisible();

    // Vérifier les liens cibles sans cliquer (évite les flakes d'animation)
    await expect(drawer.getByRole('link', { name: /Contact/ })).toHaveAttribute('href', '/contact');
    await expect(drawer.getByRole('link', { name: /Projets/ })).toHaveAttribute('href', '/projects');
    await expect(drawer.getByRole('link', { name: /À propos/ })).toHaveAttribute('href', '/about');
  });
});
