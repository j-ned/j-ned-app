import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const siteSettings = pgTable('site_settings', {
  id: text('id').primaryKey().$defaultFn(() => 'default'),
  blogEnabled: boolean('blog_enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
