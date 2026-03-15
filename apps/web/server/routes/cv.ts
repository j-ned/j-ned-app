import { Hono } from 'hono';
import { desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { cvFile } from '../db/schema';
import { authMiddleware } from '../middleware/auth.js';
import { uploadFile, deleteFile, getFile, buckets } from '../services/storage-client.js';

const cv = new Hono();

// POST /cv/upload
cv.post('/upload', authMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const file = body['file'];

  if (!(file instanceof File)) {
    return c.json({ error: 'No file provided' }, 400);
  }

  if (file.size > 10 * 1024 * 1024) {
    return c.json({ error: 'File too large (max 10MB)' }, 400);
  }

  if (file.type !== 'application/pdf') {
    return c.json({ error: 'Only PDF files are allowed' }, 400);
  }

  const key = `cv-${Date.now()}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await uploadFile({
    bucket: buckets.cv.bucket,
    key,
    body: buffer,
    contentType: file.type,
  });

  // Delete previous CV entries
  const existing = await db.select().from(cvFile);
  for (const entry of existing) {
    try {
      await deleteFile(buckets.cv.bucket, entry.fileKey);
    } catch { /* ignore */ }
  }
  if (existing.length > 0) {
    await db.delete(cvFile);
  }

  const [created] = await db.insert(cvFile).values({
    fileName: file.name,
    fileKey: key,
    fileSize: file.size,
    mimeType: file.type,
  }).returning();

  return c.json({
    fileName: created.fileName,
    mimeType: created.mimeType,
    url: `${buckets.cv.publicUrl}/${key}`,
  }, 201);
});

// GET /cv
cv.get('/', authMiddleware, async (c) => {
  const [latest] = await db.select().from(cvFile).orderBy(desc(cvFile.uploadedAt)).limit(1);

  if (!latest) {
    return c.json({ error: 'No CV uploaded' }, 404);
  }

  return c.json({
    id: latest.id,
    fileName: latest.fileName,
    mimeType: latest.mimeType,
    uploadedAt: latest.uploadedAt,
  });
});

// GET /cv/download
cv.get('/download', async (c) => {
  const [latest] = await db.select().from(cvFile).orderBy(desc(cvFile.uploadedAt)).limit(1);

  if (!latest) {
    return c.json({ error: 'No CV uploaded' }, 404);
  }

  const response = await getFile(buckets.cv.bucket, latest.fileKey);

  if (!response.Body) {
    return c.json({ error: 'File not found in storage' }, 404);
  }

  const bodyBytes = await response.Body.transformToByteArray();
  const buffer = Buffer.from(bodyBytes);

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': latest.mimeType,
      'Content-Disposition': `attachment; filename="${latest.fileName}"`,
      'Content-Length': String(bodyBytes.length),
    },
  });
});

// DELETE /cv
cv.delete('/', authMiddleware, async (c) => {
  const [latest] = await db.select().from(cvFile).orderBy(desc(cvFile.uploadedAt)).limit(1);

  if (!latest) {
    return c.json({ error: 'No CV uploaded' }, 404);
  }

  try {
    await deleteFile(buckets.cv.bucket, latest.fileKey);
  } catch { /* ignore */ }

  await db.delete(cvFile);

  return c.json({ message: 'CV deleted' });
});

export default cv;
