import type { BookingFeedSubscription } from '@features/booking/domain/models/booking-admin.model';
import { aBookingFeedSubscription } from '@features/booking/testing/booking-builders';
import { toBookingFeedView, toWebcalUrl, type BookingFeedView } from './booking-feed-view';

const FEED_URL =
  'https://api.example.test/api/booking/feed/stubFeedToken000000000000000000000000000000.ics';

describe('toBookingFeedView', () => {
  it.each<{ subscription: BookingFeedSubscription; view: BookingFeedView }>([
    { subscription: { kind: 'unconfigured' }, view: { kind: 'unconfigured' } },
    {
      subscription: { kind: 'none' },
      view: { kind: 'none', actionLabel: "Créer le lien d'abonnement" },
    },
  ])(
    'Given a $subscription.kind subscription When its view is built Then it is $view',
    ({ subscription, view }) => {
      expect(toBookingFeedView(subscription)).toEqual(view);
    },
  );

  it('Given an active subscription When its view is built Then it carries the https link, its webcal twin, the Paris creation time and the regenerate label', () => {
    expect(
      toBookingFeedView(
        aBookingFeedSubscription({ url: FEED_URL, createdAt: '2026-10-15T08:32:00.000Z' }),
      ),
    ).toEqual({
      kind: 'active',
      since: 'jeudi 15 octobre 2026 à 10:32',
      url: FEED_URL,
      webcalUrl:
        'webcal://api.example.test/api/booking/feed/stubFeedToken000000000000000000000000000000.ics',
      actionLabel: 'Régénérer le lien',
    });
  });

  it.each([
    { createdAt: '2026-09-30T22:30:00.000Z', since: 'jeudi 1er octobre 2026 à 00:30' },
    { createdAt: '2026-12-01T08:00:00.000Z', since: 'mardi 1er décembre 2026 à 09:00' },
  ])(
    'Given a link created at $createdAt When its view is built Then it reads « $since » in Paris time',
    ({ createdAt, since }) => {
      const view = toBookingFeedView(aBookingFeedSubscription({ createdAt }));

      expect(view.kind === 'active' ? view.since : null).toBe(since);
    },
  );
});

describe('toWebcalUrl', () => {
  it.each([
    { url: 'https://x.test/a.ics', webcal: 'webcal://x.test/a.ics' },
    {
      url: 'http://localhost:3000/api/booking/feed/t.ics',
      webcal: 'webcal://localhost:3000/api/booking/feed/t.ics',
    },
    { url: 'webcal://x.test/a.ics', webcal: 'webcal://x.test/a.ics' },
    { url: 'https://x.test/https://y.test', webcal: 'webcal://x.test/https://y.test' },
  ])(
    'Given $url When it is turned into a subscription link Then it is $webcal',
    ({ url, webcal }) => {
      expect(toWebcalUrl(url)).toBe(webcal);
    },
  );
});
