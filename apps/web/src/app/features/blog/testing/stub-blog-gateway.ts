import { of } from 'rxjs';
import type { BlogGateway } from '../domain/gateways/blog.gateway';
import { makeBlogPost } from './blog-post-builders';

export function stubBlogGateway(overrides: Partial<BlogGateway> = {}): BlogGateway {
  return {
    getPublishedPosts: () => of([]),
    getAllPostsForAdmin: () => of([]),
    invalidateAdminPosts: () => undefined,
    getPostBySlug: () => of(makeBlogPost()),
    createPost: () => of(makeBlogPost()),
    updatePost: () => of(makeBlogPost()),
    deletePost: () => of(undefined),
    uploadCoverImage: () => of('uploaded-key'),
    likePost: () => of({ likesCount: 1 }),
    ...overrides,
  } as BlogGateway;
}
