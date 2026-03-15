import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, sql, and, gte, lt } from 'drizzle-orm';
import { db } from '../db/client.js';
import { booking, disabledDate } from '../db/schema';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rate-limit.js';
import { createBookingSchema, createDisabledDateSchema } from '../schemas/booking.js';
import { parsePagination } from '../lib/pagination.js';
import { sendBookingNotification, sendBookingConfirmation } from '../services/mailer.js';

const bookings = new Hono();

// POST /bookings
bookings.post('/',
  rateLimiter({ windowMs: 60_000, max: 3 }),
  zValidator('json', createBookingSchema),
  async (c) => {
    const data = c.req.valid('json');

    const [created] = await db.insert(booking).values(data).returning();

    // Send emails (non-blocking)
    const emailData = {
      ...data,
      duration: String(data.duration),
    };
    Promise.all([
      sendBookingNotification(emailData),
      sendBookingConfirmation(emailData),
    ]).catch(console.error);

    return c.json(created, 201);
  },
);

// GET /bookings
bookings.get('/', authMiddleware, async (c) => {
  const query = c.req.query();
  const { page, limit } = parsePagination(query);
  const offset = (page - 1) * limit;

  const [data, countResult] = await Promise.all([
    db.select().from(booking).orderBy(desc(booking.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(booking),
  ]);

  return c.json({
    data,
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  });
});

// GET /bookings/slots
bookings.get('/slots', async (c) => {
  const month = c.req.query('month');
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return c.json({ error: 'month parameter required (YYYY-MM format)' }, 400);
  }

  const startDate = `${month}-01`;
  const [year, monthNum] = month.split('-').map(Number);
  const nextMonth = monthNum === 12 ? `${year! + 1}-01-01` : `${year}-${String(monthNum! + 1).padStart(2, '0')}-01`;

  const booked = await db.select({
    date: booking.date,
    startTime: booking.startTime,
  }).from(booking)
    .where(and(gte(booking.date, startDate), lt(booking.date, nextMonth)));

  const slotsMap = new Map<string, string[]>();
  for (const b of booked) {
    const times = slotsMap.get(b.date) ?? [];
    times.push(b.startTime);
    slotsMap.set(b.date, times);
  }

  const result = Array.from(slotsMap.entries()).map(([date, times]) => ({ date, times }));
  return c.json(result);
});

// DELETE /bookings/:id
bookings.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const [deleted] = await db.delete(booking).where(eq(booking.id, id)).returning();

  if (!deleted) {
    return c.json({ error: 'Booking not found' }, 404);
  }

  return c.json({ message: 'Booking deleted' });
});

// GET /bookings/disabled-dates
bookings.get('/disabled-dates', async (c) => {
  const data = await db.select().from(disabledDate);
  return c.json(data);
});

// POST /bookings/disabled-dates
bookings.post('/disabled-dates',
  authMiddleware,
  zValidator('json', createDisabledDateSchema),
  async (c) => {
    const data = c.req.valid('json');
    const [created] = await db.insert(disabledDate).values(data).returning();
    return c.json(created, 201);
  },
);

// DELETE /bookings/disabled-dates/:id
bookings.delete('/disabled-dates/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const [deleted] = await db.delete(disabledDate).where(eq(disabledDate.id, id)).returning();

  if (!deleted) {
    return c.json({ error: 'Disabled date not found' }, 404);
  }

  return c.json({ message: 'Disabled date deleted' });
});

export default bookings;
