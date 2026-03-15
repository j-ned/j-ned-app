import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';

// expertise: merged Expertise + Aspiration with type discriminator
// type = 'offer' (ex WhatIDo) | 'seek' (ex WhatISeek)
export const expertise = pgTable('expertise', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull().default('offer'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('idx_expertise_type').on(table.type),
]);
