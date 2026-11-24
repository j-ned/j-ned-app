import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { PaginationParams } from '../common/pagination';
import { publishedSlugFilter } from '../blog/published-post';
import { insertedRow } from '../common/rows';
import { isForeignKeyViolation } from '../common/utils';
import type { Database } from '../database/drizzle.types';
import {
  blogComments,
  blogPosts,
  type BlogComment,
  type CommentStatus,
} from '../database/schema';
import type {
  AdminCommentPage,
  AdminCommentRow,
  CommentStore,
  NewOwnerReply,
  NewVisitorComment,
  PendingCaps,
  PendingInsert,
  PostRef,
  PublishedThreads,
} from './comment-store';

const count = sql<number>`count(*)::int`;

// Liste fermée : ni `author_email` ni `sender_hash` ne sont lus pour le public.
const PUBLIC_COLUMNS = {
  id: blogComments.id,
  parentId: blogComments.parentId,
  authorKind: blogComments.authorKind,
  authorName: blogComments.authorName,
  body: blogComments.body,
  createdAt: blogComments.createdAt,
};

const parentComment = alias(blogComments, 'parent');

const OLDEST_FIRST = [asc(blogComments.createdAt), asc(blogComments.id)];

export class DrizzleCommentStore implements CommentStore {
  constructor(private readonly db: Database) {}

  // Commentaire, article, parent et nombre de réponses en une requête : pas de N+1 sur la liste.
  private adminRows() {
    return this.db
      .select({
        comment: blogComments,
        post: {
          id: blogPosts.id,
          slug: blogPosts.slug,
          title: blogPosts.title,
        },
        parent: parentComment,
        replyCount: sql<number>`(select count(*)::int from blog_comment reply where reply.parent_id = ${blogComments.id})`,
      })
      .from(blogComments)
      .innerJoin(blogPosts, eq(blogPosts.id, blogComments.postId))
      .leftJoin(parentComment, eq(parentComment.id, blogComments.parentId))
      .$dynamic();
  }

  async findPublishedPost(slug: string): Promise<PostRef | undefined> {
    const [post] = await this.db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
      })
      .from(blogPosts)
      .where(publishedSlugFilter(slug))
      .limit(1);
    return post;
  }

  async findById(id: string): Promise<BlogComment | undefined> {
    const [row] = await this.db
      .select()
      .from(blogComments)
      .where(eq(blogComments.id, id))
      .limit(1);
    return row;
  }

  async insertPending(
    comment: NewVisitorComment,
    caps: PendingCaps,
  ): Promise<PendingInsert> {
    try {
      return await this.db.transaction(async (tx) => {
        // Verrou de transaction : les envois se comptent et s'insèrent l'un après l'autre.
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext('blog_comment:pending'))`,
        );
        const pending = eq(blogComments.status, 'pending');
        const [total] = await tx
          .select({ count })
          .from(blogComments)
          .where(pending);
        if ((total?.count ?? 0) >= caps.total) return { kind: 'total-cap' };
        const [fromSender] = await tx
          .select({ count })
          .from(blogComments)
          .where(and(pending, eq(blogComments.senderHash, comment.senderHash)));
        if ((fromSender?.count ?? 0) >= caps.perSender) {
          return { kind: 'sender-cap' };
        }
        const [fromNetwork] = await tx
          .select({ count })
          .from(blogComments)
          .where(
            and(
              pending,
              eq(blogComments.senderNetworkHash, comment.senderNetworkHash),
            ),
          );
        if ((fromNetwork?.count ?? 0) >= caps.perNetwork) {
          return { kind: 'sender-cap' };
        }
        const rows = await tx
          .insert(blogComments)
          .values({
            postId: comment.postId,
            parentId: comment.parentId,
            depth: comment.parentId === null ? 0 : 1,
            parentDepth: comment.parentId === null ? null : 0,
            authorKind: 'visitor',
            authorName: comment.name,
            authorEmail: comment.email,
            senderHash: comment.senderHash,
            senderNetworkHash: comment.senderNetworkHash,
            body: comment.body,
          })
          .returning();
        return { kind: 'inserted', row: insertedRow(rows) };
      });
    } catch (error) {
      if (isForeignKeyViolation(error)) return { kind: 'target-gone' };
      throw error;
    }
  }

  async insertOwnerReply(
    reply: NewOwnerReply,
  ): Promise<BlogComment | undefined> {
    try {
      const rows = await this.db
        .insert(blogComments)
        .values({
          postId: reply.postId,
          parentId: reply.parentId,
          depth: 1,
          parentDepth: 0,
          status: 'published',
          moderatedAt: reply.publishedAt,
          authorKind: 'owner',
          body: reply.body,
        })
        .returning();
      return insertedRow(rows);
    } catch (error) {
      if (isForeignKeyViolation(error)) return undefined;
      throw error;
    }
  }

  async findPublishedThreads(
    postId: string,
    page: PaginationParams,
  ): Promise<PublishedThreads> {
    const roots = and(
      eq(blogComments.postId, postId),
      eq(blogComments.status, 'published'),
      isNull(blogComments.parentId),
    );
    const [totalRow, comments] = await Promise.all([
      this.db.select({ count }).from(blogComments).where(roots),
      this.db
        .select(PUBLIC_COLUMNS)
        .from(blogComments)
        .where(roots)
        .orderBy(...OLDEST_FIRST)
        .limit(page.limit)
        .offset(page.offset),
    ]);
    // Seules les réponses des commentaires de la page : un parent non publié n'y est jamais.
    const replies =
      comments.length === 0
        ? []
        : await this.db
            .select(PUBLIC_COLUMNS)
            .from(blogComments)
            .where(
              and(
                inArray(
                  blogComments.parentId,
                  comments.map((comment) => comment.id),
                ),
                eq(blogComments.status, 'published'),
              ),
            )
            .orderBy(...OLDEST_FIRST);
    return { comments, replies, total: totalRow[0]?.count ?? 0 };
  }

  async findAdminPage(
    status: CommentStatus | undefined,
    page: PaginationParams,
  ): Promise<AdminCommentPage> {
    const filter =
      status === undefined ? undefined : eq(blogComments.status, status);
    const [totalRow, rows] = await Promise.all([
      this.db.select({ count }).from(blogComments).where(filter),
      this.adminRows()
        .where(filter)
        .orderBy(desc(blogComments.createdAt), desc(blogComments.id))
        .limit(page.limit)
        .offset(page.offset),
    ]);
    return { rows, total: totalRow[0]?.count ?? 0 };
  }

  async findAdminById(id: string): Promise<AdminCommentRow | undefined> {
    const [row] = await this.adminRows()
      .where(eq(blogComments.id, id))
      .limit(1);
    return row;
  }

  async countPending(): Promise<number> {
    const [row] = await this.db
      .select({ count })
      .from(blogComments)
      .where(eq(blogComments.status, 'pending'));
    return row?.count ?? 0;
  }

  async publish(id: string, at: Date): Promise<boolean> {
    // Le statut de départ est dans le WHERE : deux publications simultanées ne s'écrasent pas.
    // Les empreintes ne servent qu'aux plafonds des envois en attente : effacées dès la publication.
    const rows = await this.db
      .update(blogComments)
      .set({
        status: 'published',
        moderatedAt: at,
        senderHash: null,
        senderNetworkHash: null,
      })
      .where(and(eq(blogComments.id, id), eq(blogComments.status, 'pending')))
      .returning({ id: blogComments.id });
    return rows.length > 0;
  }

  async remove(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(blogComments)
      .where(eq(blogComments.id, id))
      .returning({ id: blogComments.id });
    return rows.length > 0;
  }
}
