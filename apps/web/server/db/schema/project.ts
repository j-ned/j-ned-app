import { pgTable, text, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const project = pgTable('project', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  category: text('category').notNull(),
  tags: text('tags').array().notNull().default([]),
  description: text('description').notNull(),
  image: text('image').notNull().default(''),
  liveUrl: text('live_url'),
  repoUrl: text('repo_url'),
  repoUrlFront: text('repo_url_front'),
  repoUrlBack: text('repo_url_back'),
  featured: boolean('featured').notNull().default(false),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('idx_project_category').on(table.category),
  index('idx_project_featured').on(table.featured),
  index('idx_project_order').on(table.order),
]);
