import { test, expect } from '@playwright/test';

test.describe('Home page — navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('affiche le titre de la page', async ({ page }) => {
    await expect(page).toHaveTitle(/Julien Nédellec/);
  });

  test('affiche le header avec les liens principaux', async ({ page }) => {
    const nav = page.getByRole('navigation').first();
    await expect(nav.getByRole('link', { name: /Projets/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /À propos/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Contact/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Réservation/ })).toBeVisible();
  });

  test('CTA "Voir mes réalisations" mène à /projects', async ({ page }) => {
    await page.getByRole('button', { name: /Voir mes réalisations/ }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole('heading', { name: /Mes Projets/ })).toBeVisible();
  });

  test('CTA "Me contacter" mène à /contact', async ({ page }) => {
    await page.getByRole('button', { name: /Me contacter/ }).click();
    await expect(page).toHaveURL(/\/contact$/);
  });

  test('CTA final "Réserver un appel découverte" mène à /booking', async ({ page }) => {
    // La section contact CTA est lazy-loaded via @defer (on viewport).
    // On scrolle au bas de la page pour la déclencher, puis on cherche le bouton.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const cta = page.getByRole('button', { name: /Réserver un appel découverte/ });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/booking$/);
  });

  test('footer affiche le copyright et les réseaux sociaux', async ({ page }) => {
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/©/)).toBeVisible();
    await expect(footer.getByLabel('GitHub')).toBeVisible();
    await expect(footer.getByLabel('LinkedIn')).toBeVisible();
  });

  test('navigation via header: Projets', async ({ page }) => {
    await page.getByRole('link', { name: /Projets/ }).first().click();
    await expect(page).toHaveURL(/\/projects$/);
  });

  test('logo "j-ned.dev" renvoie à la home', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('link', { name: /j-ned/ }).first().click();
    await expect(page).toHaveURL(/\/$/);
  });
});
