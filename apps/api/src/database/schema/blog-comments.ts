import {
  check,
  foreignKey,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { blogPosts } from './blog-posts';

export const COMMENT_STATUSES = ['pending', 'published', 'refused'] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export const COMMENT_AUTHOR_KINDS = ['visitor', 'owner'] as const;
export type CommentAuthorKind = (typeof COMMENT_AUTHOR_KINDS)[number];

export const blogComments = pgTable(
  'blog_comment',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    postId: uuid('post_id')
      .notNull()
      .references(() => blogPosts.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),
    depth: smallint('depth').notNull().default(0),
    // Toujours 0 pour une réponse : la clé composite impose alors un parent de profondeur 0.
    parentDepth: smallint('parent_depth'),
    status: text('status', { enum: COMMENT_STATUSES })
      .notNull()
      .default('pending'),
    moderatedAt: timestamp('moderated_at', { withTimezone: true }),
    authorKind: text('author_kind', { enum: COMMENT_AUTHOR_KINDS }).notNull(),
    authorName: text('author_name'),
    // En clair : le propriétaire doit pouvoir écrire au commentateur. Jamais lu par le public.
    authorEmail: text('author_email'),
    // Empreinte HMAC de l'IP : relie les envois d'un même expéditeur sans conserver l'IP.
    senderHash: text('sender_hash'),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    threadKey: unique('blog_comment_thread_key').on(t.id, t.postId, t.depth),
    // Un seul niveau de réponse, sur le même article, quel que soit le code qui écrit.
    parentFk: foreignKey({
      name: 'blog_comment_parent_fk',
      columns: [t.parentId, t.postId, t.parentDepth],
      foreignColumns: [t.id, t.postId, t.depth],
    }).onDelete('cascade'),
    depthCheck: check('blog_comment_depth_check', sql`${t.depth} IN (0, 1)`),
    depthParentCheck: check(
      'blog_comment_depth_parent_check',
      sql`(${t.parentId} IS NULL) = (${t.depth} = 0)`,
    ),
    parentDepthCheck: check(
      'blog_comment_parent_depth_check',
      sql`${t.parentDepth} = 0`,
    ),
    parentDepthParentCheck: check(
      'blog_comment_parent_depth_parent_check',
      sql`(${t.parentId} IS NULL) = (${t.parentDepth} IS NULL)`,
    ),
    statusCheck: check(
      'blog_comment_status_check',
      sql`${t.status} IN ('pending', 'published', 'refused')`,
    ),
    moderatedCheck: check(
      'blog_comment_moderated_check',
      sql`(${t.status} = 'pending') = (${t.moderatedAt} IS NULL)`,
    ),
    authorKindCheck: check(
      'blog_comment_author_kind_check',
      sql`${t.authorKind} IN ('visitor', 'owner')`,
    ),
    authorIdentityCheck: check(
      'blog_comment_author_identity_check',
      sql`(${t.authorKind} = 'visitor') = (${t.authorName} IS NOT NULL AND ${t.authorEmail} IS NOT NULL)`,
    ),
    ownerAnonymousCheck: check(
      'blog_comment_owner_anonymous_check',
      sql`${t.authorKind} = 'visitor' OR (${t.authorName} IS NULL AND ${t.authorEmail} IS NULL AND ${t.senderHash} IS NULL)`,
    ),
    ownerPublishedCheck: check(
      'blog_comment_owner_published_check',
      sql`${t.authorKind} = 'visitor' OR ${t.status} <> 'pending'`,
    ),
    authorNameCheck: check(
      'blog_comment_author_name_check',
      sql`char_length(${t.authorName}) BETWEEN 2 AND 80`,
    ),
    authorEmailCheck: check(
      'blog_comment_author_email_check',
      sql`char_length(${t.authorEmail}) BETWEEN 3 AND 320`,
    ),
    bodyCheck: check(
      'blog_comment_body_check',
      sql`char_length(${t.body}) BETWEEN 2 AND 2000`,
    ),
    postStatusCreatedIdx: index('blog_comment_post_status_created_idx').on(
      t.postId,
      t.status,
      t.createdAt,
    ),
    parentIdx: index('blog_comment_parent_idx').on(t.parentId),
    statusCreatedIdx: index('blog_comment_status_created_idx').on(
      t.status,
      t.createdAt,
    ),
  }),
);

export type BlogComment = typeof blogComments.$inferSelect;
export type NewBlogComment = typeof blogComments.$inferInsert;
