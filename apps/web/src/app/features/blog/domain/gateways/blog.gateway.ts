import type { Observable } from 'rxjs';
import type { BlogPost, BlogPostInput } from '../models/blog-post.model';

export abstract class BlogGateway {
  abstract getPublishedPosts(): Observable<readonly BlogPost[]>;
  abstract getAllPostsForAdmin(): Observable<readonly BlogPost[]>;
  abstract getPostBySlug(slug: string): Observable<BlogPost>;
  abstract createPost(post: BlogPostInput): Observable<BlogPost>;
  abstract updatePost(id: string, post: Partial<BlogPostInput>): Observable<BlogPost>;
  abstract deletePost(id: string): Observable<void>;
  abstract uploadCoverImage(file: File, id: string): Observable<string>;
  abstract likePost(slug: string): Observable<{ likesCount: number }>;
}
