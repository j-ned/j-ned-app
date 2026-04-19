import { test, expect } from '@playwright/test';

test.describe('Contact form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('affiche le formulaire de contact', async ({ page }) => {
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#subject')).toBeVisible();
    await expect(page.locator('#message')).toBeVisible();
    await expect(page.getByRole('button', { name: /Envoyer le message/ })).toBeVisible();
  });

  test('le bouton submit est désactivé quand le formulaire est vide', async ({ page }) => {
    const submit = page.getByRole('button', { name: /Envoyer le message/ });
    await expect(submit).toBeDisabled();
  });

  test('affiche une erreur si email invalide', async ({ page }) => {
    const emailInput = page.locator('#email');
    await emailInput.fill('not-an-email');
    await emailInput.blur();
    await expect(page.getByText(/format de l'email est invalide/)).toBeVisible();
  });

  test('affiche une erreur si message trop court', async ({ page }) => {
    const textarea = page.locator('#message');
    await textarea.fill('court');
    await textarea.blur();
    await expect(page.getByText(/Le message doit contenir au moins 10 caractères/)).toBeVisible();
  });

  test('intercepte la soumission et valide les données envoyées', async ({ page }) => {
    // Intercept API call to avoid spamming the real backend
    let requestBody: Record<string, unknown> | undefined;
    await page.route('**/api/contact/messages', async (route) => {
      requestBody = route.request().postDataJSON();
      await route.fulfill({ status: 201, json: { success: true, message: 'Envoyé' } });
    });

    await page.locator('#name').fill('Alice Martin');
    await page.locator('#email').fill('alice@example.com');
    await page.locator('#subject').fill('Projet Angular');
    await page.locator('#message').fill('Bonjour, je souhaiterais discuter d\'un projet.');

    await page.getByRole('button', { name: /Envoyer le message/ }).click();

    // Attendre que la requête ait été capturée
    await expect.poll(() => requestBody).toBeDefined();
    expect(requestBody).toMatchObject({
      name: 'Alice Martin',
      email: 'alice@example.com',
      subject: 'Projet Angular',
    });
  });
});
