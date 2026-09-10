import { describe, it, expect } from 'vitest';
import {
  AVAILABLE_BLOG_TAGS,
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
    ['DashFlow', 'projects'],
  ])('given the catalogue tag "%s", returns "%s"', (tag, expected) => {
    expect(blogTagCategory(tag)).toBe(expected);
  });

  it.each(['Inconnu', 'angular', ''])('given the free tag "%s", returns null', (tag) => {
    expect(blogTagCategory(tag)).toBeNull();
  });
});

describe('AVAILABLE_BLOG_TAGS', () => {
  it('flattens every category without duplicates', () => {
    const total = Object.values(BLOG_TAGS_BY_CATEGORY).reduce((n, tags) => n + tags.length, 0);
    expect(AVAILABLE_BLOG_TAGS.length).toBe(total);
    expect(new Set(AVAILABLE_BLOG_TAGS).size).toBe(total);
  });
});
