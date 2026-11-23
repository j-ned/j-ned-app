import { testApp } from '../testing/test-app';
import { contactRoutes } from './contact.routes';
import type { ContactService } from './contact.service';
import { denyAll, passThrough } from '../testing/require-auth';

const MESSAGE = {
  name: 'Ada',
  email: 'ada@example.test',
  subject: 'Bonjour',
  message: 'Un message',
};

describe('contact routes', () => {
  const contact = {
    create: jest.fn().mockResolvedValue(undefined),
    unreadCount: jest.fn().mockResolvedValue({ count: 0 }),
  };
  const app = testApp(
    '/api/contact',
    contactRoutes(contact as unknown as ContactService, passThrough),
  );

  const send = (ip: string) =>
    app.request('/api/contact/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(MESSAGE),
    });

  it('Given a valid message, When it is sent, Then it is saved with the visitor address and answered 201 without body', async () => {
    const res = await send('203.0.113.1');

    expect(res.status).toBe(201);
    expect(await res.text()).toBe('');
    expect(contact.create).toHaveBeenCalledWith(
      expect.objectContaining(MESSAGE),
      { ip: '203.0.113.1', userAgent: '' },
    );
  });

  it('Given a visitor, When it sends a 4th message within the hour, Then it gets 429', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 4; i += 1)
      statuses.push((await send('203.0.113.2')).status);

    expect(statuses).toEqual([201, 201, 201, 429]);
  });

  const unreadCount = (routes: typeof app, ip: string) =>
    routes.request('/api/contact/messages/unread-count', {
      headers: { 'x-forwarded-for': ip },
    });

  async function statusesOf(
    count: number,
    call: () => Response | Promise<Response>,
  ) {
    const result = new Set<number>();
    for (let i = 0; i < count; i += 1) result.add((await call()).status);
    return result;
  }

  it('Given a signed-in admin, When it reads the unread count 30 times within a minute from one address, Then it is never throttled', async () => {
    expect(await statusesOf(30, () => unreadCount(app, '203.0.113.3'))).toEqual(
      new Set([200]),
    );
  });

  it('Given an anonymous visitor, When it reads the unread count an 11th time within a minute, Then it gets 429', async () => {
    const anonymous = testApp(
      '/api/contact',
      contactRoutes(contact as unknown as ContactService, denyAll),
    );

    expect(
      await statusesOf(10, () => unreadCount(anonymous, '203.0.113.4')),
    ).toEqual(new Set([401]));
    expect((await unreadCount(anonymous, '203.0.113.4')).status).toBe(429);
  });
});
