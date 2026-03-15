import type { Observable } from 'rxjs';
import type { Article, Comment } from '../models';

export type BlogGateway = {
  getAllArticles(): Observable<readonly Article[]>;
  getArticleById(id: string): Observable<Article>;
  getAllComments(): Observable<readonly Comment[]>;
  getCommentsByArticle(articleId: string): Observable<readonly Comment[]>;
  createArticle(article: Omit<Article, 'id'>): Observable<Article>;
  updateArticle(id: string, article: Partial<Article>): Observable<Article>;
  deleteArticle(id: string): Observable<void>;
  createComment(comment: Omit<Comment, 'id'>): Observable<Comment>;
  updateComment(id: string, data: Partial<Comment>): Observable<Comment>;
  deleteComment(id: string): Observable<void>;
  getFeaturedArticles(): Observable<readonly Article[]>;
  getFeaturedComments(): Observable<readonly Comment[]>;
  getArticleCount(): Observable<number>;
  getCommentCount(): Observable<number>;
  getPendingCommentCount(): Observable<number>;
  uploadImage(file: File, articleSlug: string): Observable<string>;
};
