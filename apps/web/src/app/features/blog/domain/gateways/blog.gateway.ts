import type { Observable } from 'rxjs';
import type { BlogPost, BlogPostInput, BlogPostSummary } from '../models/blog-post.model';
import type { ContentImage } from '../models/content-image.model';

export abstract class BlogGateway {
  abstract getPublishedPosts(options?: {
    readonly background?: boolean;
  }): Observable<readonly BlogPostSummary[]>;
  abstract getAllPostsForAdmin(): Observable<readonly BlogPost[]>;
  abstract invalidateAdminPosts(): void;
  abstract getLatestAdminPost(id: string): Observable<BlogPost | null>;
  abstract getPostBySlug(slug: string): Observable<BlogPost>;
  abstract createPost(post: BlogPostInput): Observable<BlogPost>;
  // `version` : écriture refusée en 409 si l'article a changé depuis.
  abstract updatePost(
    id: string,
    post: Partial<BlogPostInput>,
    version?: number,
  ): Observable<BlogPost>;
  abstract deletePost(id: string): Observable<void>;
  abstract uploadCoverImage(file: File, id: string, version?: number): Observable<string>;
  abstract uploadContentImage(file: File): Observable<ContentImage>;
  abstract likePost(slug: string): Observable<{ likesCount: number }>;
}
