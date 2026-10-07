import { describe, it, expect } from 'vitest';
import {
  AVAILABLE_BLOG_TAGS,
  BLOG_TAG_CATEGORIES,
  BLOG_TAGS_BY_CATEGORY,
  blogTagCategory,
  type BlogTagCategory,
} from './blog-tag.model';

describe('blogTagCategory', () => {
  it.each<[string, BlogTagCategory]>([
    ['Angular', 'stack'],
    ['Web Crypto API', 'stack'],
    ['AES-256-GCM', 'security'],
    ['RGPD', 'security'],
    ["Retour d'expérience", 'engineering'],
    ['Reconversion', 'journey'],
    ['Full-Stack', 'stack'],
    ['DashFlow', 'projects'],
  ])('given the catalogue tag "%s", returns "%s"', (tag, expected) => {
    expect(blogTagCategory(tag)).toBe(expected);
  });

  it.each(['Inconnu', 'angular', ''])('given the free tag "%s", returns null', (tag) => {
    expect(blogTagCategory(tag)).toBeNull();
  });
});

describe('BLOG_TAG_CATEGORIES', () => {
  it('lists the five categories in display order', () => {
    expect(BLOG_TAG_CATEGORIES).toEqual([
      'stack',
      'security',
      'engineering',
      'journey',
      'projects',
    ]);
  });

  it('follows the order of the catalogue, which drives the admin tag order', () => {
    expect(Object.keys(BLOG_TAGS_BY_CATEGORY)).toEqual([...BLOG_TAG_CATEGORIES]);
  });
});

describe('AVAILABLE_BLOG_TAGS', () => {
  it('flattens every category without duplicates', () => {
    const total = Object.values(BLOG_TAGS_BY_CATEGORY).reduce((n, tags) => n + tags.length, 0);
    expect(AVAILABLE_BLOG_TAGS.length).toBe(total);
    expect(new Set(AVAILABLE_BLOG_TAGS).size).toBe(total);
  });
});
