import { pgTable, text, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const servicePricing = pgTable('service_pricing', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: text('price').notNull(),
  features: text('features').array().notNull().default([]),
  highlighted: boolean('highlighted').notNull().default(false),
  enabled: boolean('enabled').notNull().default(true),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('idx_service_pricing_order').on(table.order),
]);
