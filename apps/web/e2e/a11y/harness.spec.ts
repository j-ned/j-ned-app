import { expect, test } from './a11y-test';

test.describe('Gate axe : témoin', () => {
  test('Given a low-contrast text and an unnamed button injected in main, When the page is analysed, Then both violations are reported with page, theme, rule and target', async ({
    page,
    visit,
    analyzeA11y,
  }) => {
    await visit('/');
    await expect(page.getByTestId('home-contact-form')).toBeVisible();
    await page.locator('main').evaluate((main) => {
      const text = document.createElement('p');
      text.textContent = 'Texte témoin peu contrasté';
      text.style.color = '#ccc';
      text.style.backgroundColor = '#fff';
      text.dataset['testid'] = 'harness-low-contrast';
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset['testid'] = 'harness-unnamed-button';
      main.prepend(text, button);
    });

    const { results, message } = await analyzeA11y('harness-low-contrast', 'injection');

    const targetsOf = (ruleId: string): string[] =>
      results.violations
        .filter((violation) => violation.id === ruleId)
        .flatMap((violation) => violation.nodes.map((node) => node.target.join(' ')));
    const unnamed = targetsOf('button-name').filter((target) =>
      target.includes('harness-unnamed-button'),
    );
    const lowContrast = targetsOf('color-contrast').filter((target) =>
      target.includes('harness-low-contrast'),
    );
    expect({ unnamed: unnamed.length, lowContrast: lowContrast.length }).toEqual({
      unnamed: 1,
      lowContrast: 1,
    });
    expect(message).toContain('/ · light · injection');
    for (const target of [...unnamed, ...lowContrast]) expect(message).toContain(target);
  });
});
