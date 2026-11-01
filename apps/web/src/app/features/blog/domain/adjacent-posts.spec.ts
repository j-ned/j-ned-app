import type { BlogPost } from './models/blog-post.model';
import { adjacentPosts } from './adjacent-posts';

const post = (slug: string, publishedAt: string | null): BlogPost => ({
  id: slug,
  title: slug,
  slug,
  excerpt: '',
  contentMarkdown: '',
  coverImage: '',
  tags: [],
  status: publishedAt ? 'published' : 'draft',
  likesCount: 0,
  publishedAt,
  updatedAt: publishedAt ?? '2026-01-01T00:00:00Z',
});

// Ordre d'arrivée volontairement mélangé : la fonction trie elle-même par date.
const POSTS = [
  post('b', '2026-09-05T00:00:00Z'),
  post('a', '2026-09-01T00:00:00Z'),
  post('draft', null),
  post('c', '2026-09-09T00:00:00Z'),
];

describe('adjacentPosts', () => {
  it.each([
    { slug: 'a', older: null, newer: 'b' },
    { slug: 'b', older: 'a', newer: 'c' },
    { slug: 'c', older: 'b', newer: null },
  ])(
    'Given l’article $slug When on cherche ses voisins Then plus ancien $older, plus récent $newer',
    ({ slug, older, newer }) => {
      const result = adjacentPosts(POSTS, slug);
      expect(result.older?.slug ?? null).toBe(older);
      expect(result.newer?.slug ?? null).toBe(newer);
    },
  );

  it.each(['inconnu', 'draft'])(
    'Given le slug « %s » absent des publiés Then aucun voisin',
    (slug) => {
      expect(adjacentPosts(POSTS, slug)).toEqual({ older: null, newer: null });
    },
  );

  it('Given un seul article publié Then aucun voisin', () => {
    expect(adjacentPosts([post('seul', '2026-09-01T00:00:00Z')], 'seul')).toEqual({
      older: null,
      newer: null,
    });
  });
});
