import { describe, it, expect } from 'vitest';
import { toShareImageUrl } from './share-image';

describe('toShareImageUrl', () => {
  it("demande la variante de partage au proxy storage de l'API", () => {
    expect(toShareImageUrl('https://api.test/api/storage/portfolio-storage/blog/1.avif')).toBe(
      'https://api.test/api/storage/portfolio-storage/blog/1.avif?variant=share',
    );
  });

  it("reste vide sans image (le SEO retombe alors sur l'avatar)", () => {
    expect(toShareImageUrl('')).toBe('');
  });
});
