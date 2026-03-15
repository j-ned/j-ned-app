import { pgTable, text, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core';

// profile_info now includes biography data (merged)
export const profileInfo = pgTable('profile_info', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  displayName: text('display_name').notNull(),
  location: text('location').notNull(),
  avatarUrl: text('avatar_url').notNull().default(''),
  isAvailable: boolean('is_available').notNull().default(true),
  availabilityMessage: text('availability_message').notNull().default(''),
  bioTitle: text('bio_title').notNull().default(''),
  bioParagraphs: text('bio_paragraphs').array().notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const diploma = pgTable('diploma', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  provider: text('provider').notNull(),
  shortDescription: text('short_description').notNull(),
  skills: text('skills').array().notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const technology = pgTable('technology', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  category: text('category').notNull(),
  icon: text('icon').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// highlight: merged Highlight + HomeHighlight with section discriminator
export const highlight = pgTable('highlight', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  section: text('section').notNull().default('profile'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('idx_highlight_section').on(table.section),
  index('idx_highlight_order').on(table.order),
]);
