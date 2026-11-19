import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const LOGIN_EVENT_KINDS = [
  'password_accepted',
  'password_rejected',
  'two_factor_accepted',
  'two_factor_rejected',
] as const;

export type LoginEventKind = (typeof LOGIN_EVENT_KINDS)[number];

/**
 * Journal des tentatives de connexion à l'admin. Ni adresse IP ni e-mail saisi : le pays et le
 * navigateur suffisent à reconnaître ses propres connexions (politique de confidentialité du site).
 */
export const loginEvent = pgTable(
  'login_event',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    kind: text('kind', { enum: LOGIN_EVENT_KINDS }).notNull(),
    // `null` : compte inconnu, ou jeton de challenge illisible.
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    browser: text('browser'),
    os: text('os'),
    country: text('country'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    createdAtIdx: index('login_event_created_at_idx').on(t.createdAt),
    // La base refuse une étape inconnue, même écrite hors de l'application.
    kindCheck: check(
      'login_event_kind_check',
      sql`${t.kind} IN ('password_accepted', 'password_rejected', 'two_factor_accepted', 'two_factor_rejected')`,
    ),
  }),
);

export type LoginEvent = typeof loginEvent.$inferSelect;
