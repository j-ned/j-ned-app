import { describe, it, expect } from 'vitest';
import { slugifyHeading } from './heading-slug';

describe('slugifyHeading', () => {
  it.each([
    [
      'retire les accents',
      "L'architecture : une double enveloppe de clés",
      'l-architecture-une-double-enveloppe-de-cles',
    ],
    ['garde les chiffres', 'AES-256-GCM : un IV unique', 'aes-256-gcm-un-iv-unique'],
    [
      'ne laisse pas de tiret en bordure',
      '  Valider ce qu’on déchiffre ?  ',
      'valider-ce-qu-on-dechiffre',
    ],
    [
      'fusionne les séparateurs',
      'Ce que ça change   dans le code NestJS',
      'ce-que-ca-change-dans-le-code-nestjs',
    ],
  ])('%s', (_label, text, expected) => {
    expect(slugifyHeading(text)).toBe(expected);
  });
});
