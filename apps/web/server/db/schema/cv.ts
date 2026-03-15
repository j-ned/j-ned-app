import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const cvFile = pgTable('cv_file', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  fileName: text('file_name').notNull(),
  fileKey: text('file_key').notNull().unique(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull().default('application/pdf'),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
