import { pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const contactMessage = pgTable('contact_message', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('idx_contact_message_read').on(table.read),
  index('idx_contact_message_created').on(table.createdAt),
  index('idx_contact_message_read_created').on(table.read, table.createdAt),
]);
