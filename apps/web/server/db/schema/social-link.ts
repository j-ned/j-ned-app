import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const socialLink = pgTable('social_link', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  icon: text('icon').notNull(),
  label: text('label').notNull(),
  href: text('href').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
