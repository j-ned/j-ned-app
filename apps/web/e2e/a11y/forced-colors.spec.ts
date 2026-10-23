import { expect, test } from './a11y-test';

test.describe('Couleurs forcées', () => {
  test('the home sticker keeps a visible outline when the browser forces its colours', async ({
    page,
    visit,
  }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await visit('/');
    const sticker = page.getByTestId('hero-sticker');
    await expect(sticker).toBeVisible();

    const outline = await sticker.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        forced: matchMedia('(forced-colors: active)').matches,
        width: style.borderTopWidth,
        style: style.borderTopStyle,
        transparent: /^(?:transparent|rgba\(0, 0, 0, 0\))$/.test(style.borderTopColor),
      };
    });

    await expect(page.locator('app-sticker')).toHaveCount(1);
    expect(outline).toEqual({ forced: true, width: '2px', style: 'solid', transparent: false });
  });
});
