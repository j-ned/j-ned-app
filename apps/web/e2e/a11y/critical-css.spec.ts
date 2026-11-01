import { expect, test } from './a11y-test';

// Le serveur inline un CSS critique et charge la feuille complète en différé : tout ce qui dimensionne
// la page doit déjà y être, sinon le contenu se décale à l'arrivée de la feuille (CLS).
test.describe('CSS critique', () => {
  test('draws the Tailwind borders before the full stylesheet arrives', async ({ page }) => {
    await page.route('**/styles-*.css', (route) => route.abort('blockedbyclient'));
    await page.goto('/projects');

    const legend = page.locator('app-project-kind-legend app-cartouche');
    await expect(legend).toBeVisible();
    const borders = await legend.evaluate((element) => {
      const border = (target: Element): string => {
        const style = getComputedStyle(target);
        return `${style.borderTopWidth} ${style.borderTopStyle}`;
      };
      return {
        cartouche: border(element),
        stamp: border(element.querySelector('app-stamp') ?? element),
      };
    });

    expect(borders).toEqual({ cartouche: '2px solid', stamp: '2px solid' });
  });
});
