import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { describe, it, expect, beforeEach } from 'vitest';
import { Seo } from './seo';

function metaContent(doc: Document, selector: string): string | null {
  return doc.head.querySelector<HTMLMetaElement>(selector)?.content ?? null;
}

describe('Seo', () => {
  let seo: Seo;
  let doc: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    seo = TestBed.inject(Seo);
    doc = TestBed.inject(DOCUMENT);
  });

  describe('og:image:alt', () => {
    it("décrit le visuel fourni avec l'alt fourni", () => {
      seo.applySeoData({
        title: 'Mon article',
        description: 'Résumé',
        image: 'https://x.test/cover.avif',
        imageAlt: "Illustration de l'article Mon article",
      });

      expect(metaContent(doc, 'meta[property="og:image:alt"]')).toBe(
        "Illustration de l'article Mon article",
      );
      expect(metaContent(doc, 'meta[name="twitter:image:alt"]')).toBe(
        "Illustration de l'article Mon article",
      );
    });

    it('retombe sur le titre quand un visuel est fourni sans alt', () => {
      seo.applySeoData({
        title: 'Mon article',
        description: 'Résumé',
        image: 'https://x.test/c.avif',
      });

      expect(metaContent(doc, 'meta[property="og:image:alt"]')).toBe('Mon article');
    });

    it("décrit l'avatar quand aucun visuel n'est fourni (image de repli)", () => {
      seo.applySeoData({ title: 'Blog', description: 'Résumé' });

      expect(metaContent(doc, 'meta[property="og:image"]')).toContain('/avatar.avif');
      expect(metaContent(doc, 'meta[property="og:image:alt"]')).toBe(
        'Photo de profil de Julien Nédellec',
      );
    });

    it("remplace l'alt d'une page précédente au lieu de l'empiler", () => {
      seo.applySeoData({
        title: 'A',
        description: 'a',
        image: 'https://x.test/a.avif',
        imageAlt: 'alt A',
      });
      seo.applySeoData({
        title: 'B',
        description: 'b',
        image: 'https://x.test/b.avif',
        imageAlt: 'alt B',
      });

      expect(doc.head.querySelectorAll('meta[property="og:image:alt"]')).toHaveLength(1);
      expect(metaContent(doc, 'meta[property="og:image:alt"]')).toBe('alt B');
    });
  });
});
