import { test, expect } from '@playwright/test';

test.describe('Theme toggle', () => {
  // Force dark mode OS-level pour que le fallback prefers-color-scheme donne 'dark'
  test.use({ colorScheme: 'dark' });

  test.beforeEach(async ({ page }) => {
    // Première visite : vider localStorage puis recharger pour un état frais.
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('j-ned:theme'));
    await page.reload();
  });

  test('thème sombre par défaut (pas de préférence stockée)', async ({ page }) => {
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('app-dark')))
      .toBe(true);
  });

  test('toggle passe en mode clair et persiste au reload', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /Passer en mode clair/ });
    await toggle.click();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('app-dark')))
      .toBe(false);

    // Reload (sans reset du localStorage) et vérifier persistance
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('app-dark')))
      .toBe(false);

    const stored = await page.evaluate(() => localStorage.getItem('j-ned:theme'));
    expect(stored).toBe('light');
  });

  test('re-toggle revient en mode sombre', async ({ page }) => {
    await page.getByRole('button', { name: /Passer en mode clair/ }).click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('app-dark')))
      .toBe(false);

    await page.getByRole('button', { name: /Passer en mode sombre/ }).click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('app-dark')))
      .toBe(true);

    const stored = await page.evaluate(() => localStorage.getItem('j-ned:theme'));
    expect(stored).toBe('dark');
  });
});
