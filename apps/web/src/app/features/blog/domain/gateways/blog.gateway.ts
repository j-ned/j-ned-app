import type { Observable } from 'rxjs';
import type { Article, Comment } from '../models';

export type BlogGateway = {
  getAllArticles(): Observable<readonly Article[]>;
  getArticleById(id: number): Observable<Article>;
  getAllComments(): Observable<readonly Comment[]>;
  getCommentsByArticle(articleId: number): Observable<readonly Comment[]>;
  createArticle(article: Omit<Article, 'id'>): Observable<Article>;
  updateArticle(id: number, article: Partial<Article>): Observable<Article>;
  deleteArticle(id: number): Observable<void>;
  createComment(comment: Omit<Comment, 'id'>): Observable<Comment>;
  updateComment(id: number, data: Partial<Comment>): Observable<Comment>;
  deleteComment(id: number): Observable<void>;
  getFeaturedComments(): Observable<readonly Comment[]>;
  getArticleCount(): Observable<number>;
  getCommentCount(): Observable<number>;
  getPendingCommentCount(): Observable<number>;
  uploadImage(file: File, articleSlug: string): Observable<string>;
};

export { BLOG_GATEWAY } from './blog.gateway.token';
