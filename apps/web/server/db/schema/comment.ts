import { pgTable, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { article } from './article';

export const comment = pgTable('comment', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  articleId: text('article_id').notNull().references(() => article.id, { onDelete: 'cascade' }),
  author: text('author').notNull(),
  content: text('content').notNull(),
  date: text('date').notNull(),
  email: text('email').notNull().default(''),
  rating: integer('rating').notNull().default(0),
  status: text('status').notNull().default('pending'),
  featured: boolean('featured').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('idx_comment_article_id').on(table.articleId),
  index('idx_comment_status').on(table.status),
  index('idx_comment_status_featured').on(table.status, table.featured),
]);
