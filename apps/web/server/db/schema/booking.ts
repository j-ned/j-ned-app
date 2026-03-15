import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const booking = pgTable('booking', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: text('date').notNull(),
  startTime: text('start_time').notNull(),
  duration: integer('duration').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('idx_booking_date').on(table.date),
  index('idx_booking_created').on(table.createdAt),
]);

export const disabledDate = pgTable('disabled_date', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: text('date').notNull().unique(),
  reason: text('reason'),
});
