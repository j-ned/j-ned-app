import { pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const article = pgTable('article', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  author: text('author').notNull(),
  date: text('date').notNull(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  tags: text('tags').array().notNull().default([]),
  image: text('image').notNull().default(''),
  featured: boolean('featured').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('idx_article_date').on(table.date),
  index('idx_article_slug').on(table.slug),
  index('idx_article_featured').on(table.featured),
]);
