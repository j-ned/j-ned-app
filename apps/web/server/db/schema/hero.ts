import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const hero = pgTable('hero', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  tagline: text('tagline').notNull(),
  availability: text('availability').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
