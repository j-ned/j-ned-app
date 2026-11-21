import { randomUUID } from 'node:crypto';
import type { CommentStore, PostRef } from '../blog-comments/comment-store';
import type { BlogComment, CommentStatus } from '../database/schema';
import { MemoryCommentStore } from './memory-comment-store';

export type SeedPost = {
  readonly slug: string;
  readonly title?: string;
  readonly status?: 'draft' | 'published';
};

export type SeedComment = {
  readonly postId: string;
  readonly parentId?: string;
  readonly status?: CommentStatus;
  readonly owner?: boolean;
  readonly name?: string;
  readonly email?: string;
  readonly senderHash?: string;
  readonly body?: string;
  readonly createdAt?: Date;
  readonly moderatedAt?: Date;
};

// Ce dont les scénarios de routes ont besoin, que la base soit en mémoire ou un vrai Postgres.
export type CommentHarness = {
  readonly store: CommentStore;
  seedPost(seed: SeedPost): Promise<PostRef>;
  seedComment(seed: SeedComment): Promise<BlogComment>;
  comments(): Promise<BlogComment[]>;
  reset(): Promise<void>;
};

const FIRST_SEED_AT = Date.parse('2026-11-01T10:00:00.000Z');
let seeded = 0;

// Ligne complète d'un commentaire semé : publié par défaut, daté une minute après le précédent.
export function seedCommentRow(seed: SeedComment): BlogComment {
  seeded += 1;
  const status = seed.status ?? 'published';
  const createdAt = seed.createdAt ?? new Date(FIRST_SEED_AT + seeded * 60_000);
  const owner = seed.owner === true;
  return {
    id: randomUUID(),
    postId: seed.postId,
    parentId: seed.parentId ?? null,
    depth: seed.parentId === undefined ? 0 : 1,
    parentDepth: seed.parentId === undefined ? null : 0,
    status,
    moderatedAt: status === 'pending' ? null : (seed.moderatedAt ?? createdAt),
    authorKind: owner ? 'owner' : 'visitor',
    authorName: owner ? null : (seed.name ?? 'Camille'),
    authorEmail: owner ? null : (seed.email ?? 'camille@example.test'),
    senderHash: owner ? null : (seed.senderHash ?? 'a'.repeat(64)),
    body: seed.body ?? 'Un commentaire',
    createdAt,
  };
}

export function seedPostRow(seed: SeedPost) {
  return {
    id: randomUUID(),
    slug: seed.slug,
    title: seed.title ?? `Titre de ${seed.slug}`,
    status: seed.status ?? 'published',
  } as const;
}

export function memoryHarness(
  store: MemoryCommentStore = new MemoryCommentStore(),
): CommentHarness {
  return {
    store,
    seedPost(seed) {
      const post = seedPostRow(seed);
      store.posts.push(post);
      return Promise.resolve({
        id: post.id,
        slug: post.slug,
        title: post.title,
      });
    },
    seedComment(seed) {
      const row = seedCommentRow(seed);
      store.comments.push(row);
      return Promise.resolve(row);
    },
    comments: () => Promise.resolve([...store.comments]),
    reset() {
      store.posts.length = 0;
      store.comments = [];
      return Promise.resolve();
    },
  };
}
