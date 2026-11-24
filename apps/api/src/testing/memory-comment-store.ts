import { randomUUID } from 'node:crypto';
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
} from '../blog-comments/comment-store';
import type { PaginationParams } from '../common/pagination';
import type { BlogComment, CommentStatus } from '../database/schema';

export type MemoryPost = PostRef & { readonly status: 'draft' | 'published' };

const byCreation = (a: BlogComment, b: BlogComment) =>
  a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id);

const pageOf = <T>(rows: readonly T[], page: PaginationParams): T[] =>
  rows.slice(page.offset, page.offset + page.limit);

// Doublure en mémoire du stockage des commentaires, tenue fidèle par les scénarios de routes rejoués
// sur Postgres. Elle rend des lignes entières, e-mail compris : aux couches du dessus de le retirer.
export class MemoryCommentStore implements CommentStore {
  readonly posts: MemoryPost[] = [];
  comments: BlogComment[] = [];

  constructor(private readonly now: () => Date = () => new Date()) {}

  findPublishedPost(slug: string): Promise<PostRef | undefined> {
    const post = this.posts.find(
      (p) => p.slug === slug && p.status === 'published',
    );
    return Promise.resolve(
      post && { id: post.id, slug: post.slug, title: post.title },
    );
  }

  findById(id: string): Promise<BlogComment | undefined> {
    return Promise.resolve(this.comments.find((c) => c.id === id));
  }

  insertPending(
    comment: NewVisitorComment,
    caps: PendingCaps,
  ): Promise<PendingInsert> {
    if (!this.targetExists(comment.postId, comment.parentId)) {
      return Promise.resolve({ kind: 'target-gone' });
    }
    const pending = this.comments.filter((c) => c.status === 'pending');
    if (pending.length >= caps.total) {
      return Promise.resolve({ kind: 'total-cap' });
    }
    const fromSender = pending.filter(
      (c) => c.senderHash === comment.senderHash,
    );
    if (fromSender.length >= caps.perSender) {
      return Promise.resolve({ kind: 'sender-cap' });
    }
    const fromNetwork = pending.filter(
      (c) => c.senderNetworkHash === comment.senderNetworkHash,
    );
    if (fromNetwork.length >= caps.perNetwork) {
      return Promise.resolve({ kind: 'sender-cap' });
    }
    const row: BlogComment = {
      id: randomUUID(),
      postId: comment.postId,
      parentId: comment.parentId,
      depth: comment.parentId === null ? 0 : 1,
      parentDepth: comment.parentId === null ? null : 0,
      status: 'pending',
      moderatedAt: null,
      authorKind: 'visitor',
      authorName: comment.name,
      authorEmail: comment.email,
      senderHash: comment.senderHash,
      senderNetworkHash: comment.senderNetworkHash,
      body: comment.body,
      createdAt: this.now(),
    };
    this.comments.push(row);
    return Promise.resolve({ kind: 'inserted', row });
  }

  insertOwnerReply(reply: NewOwnerReply): Promise<BlogComment | undefined> {
    if (!this.targetExists(reply.postId, reply.parentId)) {
      return Promise.resolve(undefined);
    }
    const row: BlogComment = {
      id: randomUUID(),
      postId: reply.postId,
      parentId: reply.parentId,
      depth: 1,
      parentDepth: 0,
      status: 'published',
      moderatedAt: reply.publishedAt,
      authorKind: 'owner',
      authorName: null,
      authorEmail: null,
      senderHash: null,
      senderNetworkHash: null,
      body: reply.body,
      createdAt: this.now(),
    };
    this.comments.push(row);
    return Promise.resolve(row);
  }

  findPublishedThreads(
    postId: string,
    page: PaginationParams,
  ): Promise<PublishedThreads> {
    const published = this.comments
      .filter((c) => c.postId === postId && c.status === 'published')
      .sort(byCreation);
    const roots = published.filter((c) => c.parentId === null);
    const comments = pageOf(roots, page);
    const ids = new Set(comments.map((c) => c.id));
    return Promise.resolve({
      comments,
      replies: published.filter(
        (c) => c.parentId !== null && ids.has(c.parentId),
      ),
      total: roots.length,
    });
  }

  findAdminPage(
    status: CommentStatus | undefined,
    page: PaginationParams,
  ): Promise<AdminCommentPage> {
    const matching = this.comments
      .filter((c) => status === undefined || c.status === status)
      .sort((a, b) => byCreation(b, a));
    return Promise.resolve({
      rows: pageOf(matching, page).map((c) => this.toAdminRow(c)),
      total: matching.length,
    });
  }

  findAdminById(id: string): Promise<AdminCommentRow | undefined> {
    const comment = this.comments.find((c) => c.id === id);
    return Promise.resolve(comment && this.toAdminRow(comment));
  }

  countPending(): Promise<number> {
    return Promise.resolve(
      this.comments.filter((c) => c.status === 'pending').length,
    );
  }

  publish(id: string, at: Date): Promise<boolean> {
    const index = this.comments.findIndex(
      (c) => c.id === id && c.status === 'pending',
    );
    const current = this.comments[index];
    if (current === undefined) return Promise.resolve(false);
    this.comments[index] = {
      ...current,
      status: 'published',
      moderatedAt: at,
      senderHash: null,
      senderNetworkHash: null,
    };
    return Promise.resolve(true);
  }

  remove(id: string): Promise<boolean> {
    const before = this.comments.length;
    this.comments = this.comments.filter(
      (c) => c.id !== id && c.parentId !== id,
    );
    return Promise.resolve(this.comments.length < before);
  }

  // Ce que vérifie la clé étrangère composite de Postgres : article existant, parent de profondeur 0
  // sur le même article.
  private targetExists(postId: string, parentId: string | null): boolean {
    if (!this.posts.some((p) => p.id === postId)) return false;
    if (parentId === null) return true;
    return this.comments.some(
      (c) => c.id === parentId && c.postId === postId && c.depth === 0,
    );
  }

  private toAdminRow(comment: BlogComment): AdminCommentRow {
    const post = this.posts.find((p) => p.id === comment.postId);
    if (post === undefined) throw new Error('Comment without post');
    return {
      comment,
      post: { id: post.id, slug: post.slug, title: post.title },
      parent: this.comments.find((c) => c.id === comment.parentId) ?? null,
      replyCount: this.comments.filter((c) => c.parentId === comment.id).length,
    };
  }
}
