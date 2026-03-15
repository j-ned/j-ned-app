import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const appUser = pgTable('app_user', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  twoFactorSecret: text('two_factor_secret'),
  isTwoFactorEnabled: boolean('is_two_factor_enabled').notNull().default(false),
  refreshToken: text('refresh_token'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
