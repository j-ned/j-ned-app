import type { RequireAuth } from '../auth/require-auth';
import { testApp } from '../common/test-app';
import { contactRoutes } from './contact.routes';
import type { ContactService } from './contact.service';

const MESSAGE = {
  name: 'Ada',
  email: 'ada@example.test',
  subject: 'Bonjour',
  message: 'Un message',
};

describe('contact routes', () => {
  const contact = { create: jest.fn().mockResolvedValue(undefined) };
  const passThrough: RequireAuth = async (_c, next) => {
    await next();
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
});
