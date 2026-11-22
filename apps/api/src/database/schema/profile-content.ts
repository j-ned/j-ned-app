import {
  check,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { ProfileContent } from '../../profile/profile-content';

// Seule ligne autorisée : le parcours est un document unique.
export const PROFILE_ROW_ID = 'main';

// Remplacé d'un bloc sous version (409 si elle a changé) ; le portrait est hors version pour ne pas
// invalider un brouillon ouvert. `previous_portrait_key` : clé qu'une page déjà servie cite encore.
export const profileContent = pgTable(
  'profile_content',
  {
    id: text('id').primaryKey().default(PROFILE_ROW_ID),
    content: jsonb('content').$type<ProfileContent>().notNull(),
    version: integer('version').notNull().default(1),
    portraitKey: text('portrait_key'),
    previousPortraitKey: text('previous_portrait_key'),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    singleRow: check('profile_content_single_row', sql`${t.id} = 'main'`),
  }),
);

export type ProfileContentRow = typeof profileContent.$inferSelect;
