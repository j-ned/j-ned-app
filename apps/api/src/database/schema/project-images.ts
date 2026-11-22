import { pgTable, uuid, text, integer, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timestamps } from '../../common/utils';
import { projects } from './projects';

// Une ligne par capture, clé S3 `project-images/<id>-<sha8>.avif` ; dimensions intrinsèques mesurées
// à l'upload, pour que le front réserve le ratio (pas de CLS).
export const projectImages = pgTable(
  'project_image',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    key: text('key').notNull().unique(),
    alt: text('alt').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    order: integer('order').notNull().default(0),
    ...timestamps(),
  },
  (t) => ({
    projectOrderIdx: index('project_image_project_order_idx').on(
      t.projectId,
      t.order,
    ),
  }),
);

export type ProjectImage = typeof projectImages.$inferSelect;
export type NewProjectImage = typeof projectImages.$inferInsert;
