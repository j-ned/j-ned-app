import { escapeHtml, maskEmail } from './mailer.utils';

describe('escapeHtml (valeurs issues du formulaire public)', () => {
  it.each([
    [
      '<a href="https://evil">Voir</a>',
      '&lt;a href=&quot;https://evil&quot;&gt;Voir&lt;/a&gt;',
    ],
    ['<img src=x onerror=alert(1)>', '&lt;img src=x onerror=alert(1)&gt;'],
    ['" onmouseover="alert(1)', '&quot; onmouseover=&quot;alert(1)'],
    ["it's & co", 'it&#39;s &amp; co'],
    ['$&', '$&amp;'],
    ['Julien', 'Julien'],
  ])('%s → %s', (raw, expected) => {
    expect(escapeHtml(raw)).toBe(expected);
  });

  it('laisse les caractères ordinaires intacts', () => {
    expect(escapeHtml('Bonjour, ça va ?')).toBe('Bonjour, ça va ?');
  });
});

describe('maskEmail', () => {
  it.each([
    ['camille@example.com', 'c***@example.com'],
    ['c@example.com', 'c***@example.com'],
    ['pas-une-adresse', '***'],
    ['@example.com', '***@example.com'],
  ])('masque %p en %p', (address, masked) => {
    expect(maskEmail(address)).toBe(masked);
  });
});
