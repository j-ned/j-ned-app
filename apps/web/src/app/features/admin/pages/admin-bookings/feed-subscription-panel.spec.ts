import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NEVER, Subject, defer, of, throwError, type Observable } from 'rxjs';
import type { Mock } from 'vitest';
import { ToastStore } from '@core/notifications/toast-store';
import { BookingGateway } from '@features/booking/domain/gateways/booking.gateway';
import type {
  BookingAdminFailure,
  BookingAdminResult,
  BookingFeedSubscription,
} from '@features/booking/domain/models/booking-admin.model';
import { aBookingFeedSubscription } from '@features/booking/testing/booking-builders';
import { stubBookingGateway } from '@features/booking/testing/stub-booking-gateway';
import type { ToastMessage } from '@shared/ui/toast.types';
import { FeedSubscriptionPanel } from './feed-subscription-panel';

const CURRENT_URL =
  'https://api.example.test/api/booking/feed/stubFeedToken000000000000000000000000000000.ics';
const NEW_URL =
  'https://api.example.test/api/booking/feed/newFeedToken0000000000000000000000000000000.ics';

const CURRENT = aBookingFeedSubscription({
  url: CURRENT_URL,
  createdAt: '2026-10-15T08:32:00.000Z',
});
const RENEWED = aBookingFeedSubscription({ url: NEW_URL, createdAt: '2026-10-15T10:05:00.000Z' });

const CURRENT_VIEW = {
  kind: 'active',
  since: 'jeudi 15 octobre 2026 à 10:32',
  url: CURRENT_URL,
  webcalUrl:
    'webcal://api.example.test/api/booking/feed/stubFeedToken000000000000000000000000000000.ics',
  actionLabel: 'Régénérer le lien',
} as const;

const RENEWED_VIEW = {
  kind: 'active',
  since: 'jeudi 15 octobre 2026 à 12:05',
  url: NEW_URL,
  webcalUrl:
    'webcal://api.example.test/api/booking/feed/newFeedToken0000000000000000000000000000000.ics',
  actionLabel: 'Régénérer le lien',
} as const;

type Read = () => Observable<BookingFeedSubscription>;
type Regenerate = () => Observable<BookingAdminResult<BookingFeedSubscription>>;

type Panel = {
  readonly panel: FeedSubscriptionPanel;
  readonly read: Mock<Read>;
  readonly regenerate: Mock<Regenerate>;
  readonly toasts: () => readonly ToastMessage[];
};

const answered =
  (result: BookingAdminResult<BookingFeedSubscription>): Regenerate =>
  () =>
    defer(() => of(result));

async function flush(): Promise<void> {
  for (let pass = 0; pass < 2; pass++) {
    TestBed.tick();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  TestBed.tick();
}

async function openPanel(
  read: Read = () => defer(() => of(CURRENT)),
  regenerate: Regenerate = answered({ success: true, data: RENEWED }),
): Promise<Panel> {
  const readSpy = vi.fn<Read>(read);
  const regenerateSpy = vi.fn<Regenerate>(regenerate);
  const add = vi.fn<(message: ToastMessage) => void>();
  TestBed.configureTestingModule({
    providers: [
      FeedSubscriptionPanel,
      {
        provide: BookingGateway,
        useValue: stubBookingGateway({
          getFeedSubscription: readSpy,
          regenerateFeedSubscription: regenerateSpy,
        }),
      },
      { provide: ToastStore, useValue: { add } },
    ],
  });
  const panel = TestBed.inject(FeedSubscriptionPanel);
  await flush();
  return {
    panel,
    read: readSpy,
    regenerate: regenerateSpy,
    toasts: () => add.mock.calls.map(([message]) => message),
  };
}

describe('FeedSubscriptionPanel: lecture', () => {
  it('Given an active link on the server When the panel opens Then it reads it once and shows it ready', async () => {
    const { panel, read } = await openPanel();

    expect({ reads: read.mock.calls.length, state: panel.state(), view: panel.view() }).toEqual({
      reads: 1,
      state: 'ready',
      view: CURRENT_VIEW,
    });
  });

  it.each<{ subscription: BookingFeedSubscription; view: unknown }>([
    { subscription: { kind: 'unconfigured' }, view: { kind: 'unconfigured' } },
    {
      subscription: { kind: 'none' },
      view: { kind: 'none', actionLabel: "Créer le lien d'abonnement" },
    },
  ])(
    'Given a $subscription.kind subscription When the panel opens Then its view is $view',
    async ({ subscription, view }) => {
      const { panel, read } = await openPanel(() => defer(() => of(subscription)));

      expect({ reads: read.mock.calls.length, state: panel.state(), view: panel.view() }).toEqual({
        reads: 1,
        state: 'ready',
        view,
      });
    },
  );

  it('Given the subscription still on its way When the panel opens Then it is loading with nothing to show', async () => {
    const { panel, read } = await openPanel(() => NEVER);

    expect({ reads: read.mock.calls.length, state: panel.state(), view: panel.view() }).toEqual({
      reads: 1,
      state: 'loading',
      view: null,
    });
  });

  it('Given the read fails When it is reloaded Then the subscription is read again and shown', async () => {
    let attempts = 0;
    const opened = await openPanel(() =>
      defer(() => {
        attempts += 1;
        return attempts === 1 ? throwError(() => new Error('offline')) : of(CURRENT);
      }),
    );
    const failed = { state: opened.panel.state(), view: opened.panel.view() };

    opened.panel.reload();
    await flush();

    expect({
      failed,
      reads: opened.read.mock.calls.length,
      state: opened.panel.state(),
      view: opened.panel.view(),
    }).toEqual({
      failed: { state: 'error', view: null },
      reads: 2,
      state: 'ready',
      view: CURRENT_VIEW,
    });
  });
});

describe('FeedSubscriptionPanel: création et régénération', () => {
  it('Given no link yet When it is created Then one request is sent, the new link is shown and its creation is told', async () => {
    const opened = await openPanel(() =>
      defer(() => of<BookingFeedSubscription>({ kind: 'none' })),
    );

    opened.panel.regenerate();
    await flush();

    expect({
      requests: opened.regenerate.mock.calls.length,
      view: opened.panel.view(),
      regenerating: opened.panel.regenerating(),
      toasts: opened.toasts(),
    }).toEqual({
      requests: 1,
      view: RENEWED_VIEW,
      regenerating: false,
      toasts: [
        { severity: 'success', detail: "Lien d'abonnement créé : ajoutez-le à vos agendas." },
      ],
    });
  });

  it('Given an active link When it is regenerated Then the new link replaces it and the owner is told the old one no longer works', async () => {
    const opened = await openPanel();

    opened.panel.regenerate();
    await flush();

    expect({
      requests: opened.regenerate.mock.calls.length,
      reads: opened.read.mock.calls.length,
      view: opened.panel.view(),
      toasts: opened.toasts(),
    }).toEqual({
      requests: 1,
      reads: 1,
      view: RENEWED_VIEW,
      toasts: [
        {
          severity: 'success',
          detail: "Nouveau lien créé : l'ancien ne fonctionne plus. Remplacez-le dans vos agendas.",
        },
      ],
    });
  });

  it('Given a regeneration in flight When it is asked again Then no second request is sent until the answer arrives', async () => {
    const answer = new Subject<BookingAdminResult<BookingFeedSubscription>>();
    const opened = await openPanel(undefined, () => answer);

    opened.panel.regenerate();
    await flush();
    opened.panel.regenerate();
    await flush();
    const meanwhile = {
      requests: opened.regenerate.mock.calls.length,
      regenerating: opened.panel.regenerating(),
      view: opened.panel.view(),
    };
    answer.next({ success: true, data: RENEWED });
    answer.complete();
    await flush();

    expect({
      meanwhile,
      regenerating: opened.panel.regenerating(),
      view: opened.panel.view(),
    }).toEqual({
      meanwhile: { requests: 1, regenerating: true, view: CURRENT_VIEW },
      regenerating: false,
      view: RENEWED_VIEW,
    });
  });

  it.each<{ reason: BookingAdminFailure; detail: string }>([
    {
      reason: 'network',
      detail: 'Création impossible : vérifiez votre connexion, puis réessayez.',
    },
    {
      reason: 'server',
      detail: "Création impossible : le serveur n'a pas répondu. Réessayez dans un instant.",
    },
    {
      reason: 'invalid',
      detail: "Création impossible : le serveur n'a pas répondu. Réessayez dans un instant.",
    },
  ])(
    'Given the API answers $reason When the link is regenerated Then « $detail » is told and the current link stays, without reading it again',
    async ({ reason, detail }) => {
      const opened = await openPanel(undefined, answered({ success: false, reason }));

      opened.panel.regenerate();
      await flush();

      expect({
        requests: opened.regenerate.mock.calls.length,
        reads: opened.read.mock.calls.length,
        view: opened.panel.view(),
        regenerating: opened.panel.regenerating(),
        toasts: opened.toasts(),
      }).toEqual({
        requests: 1,
        reads: 1,
        view: CURRENT_VIEW,
        regenerating: false,
        toasts: [{ severity: 'error', detail }],
      });
    },
  );

  it('Given the secret removed from the API When the link is regenerated Then the owner is told to configure it and the subscription is read again as unconfigured', async () => {
    let reads = 0;
    const opened = await openPanel(
      () =>
        defer(() => {
          reads += 1;
          return of<BookingFeedSubscription>(reads === 1 ? CURRENT : { kind: 'unconfigured' });
        }),
      answered({ success: false, reason: 'not-configured' }),
    );

    opened.panel.regenerate();
    await flush();

    expect({
      reads: opened.read.mock.calls.length,
      view: opened.panel.view(),
      toasts: opened.toasts(),
    }).toEqual({
      reads: 2,
      view: { kind: 'unconfigured' },
      toasts: [
        {
          severity: 'error',
          detail: "Abonnement non configuré : ajoutez BOOKING_FEED_SECRET à l'API.",
        },
      ],
    });
  });
});

const COPIED = 'Lien copié dans le presse-papiers';
const COPY_FAILED = 'Copie impossible\u00a0: sélectionnez le lien et copiez-le à la main.';

async function copied(panel: FeedSubscriptionPanel): Promise<void> {
  panel.copyLink();
  await TestBed.inject(ApplicationRef).whenStable();
}

describe('FeedSubscriptionPanel: copie du lien', () => {
  beforeEach(async () => {
    await navigator.clipboard.writeText('avant');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Given an active link When it is copied Then its https address, not the webcal one, reaches the clipboard and the copy is told', async () => {
    const { panel, toasts } = await openPanel();

    await copied(panel);

    expect({ clipboard: await navigator.clipboard.readText(), toasts: toasts() }).toEqual({
      clipboard: CURRENT_URL,
      toasts: [{ severity: 'success', detail: COPIED }],
    });
  });

  it('Given a link just regenerated When it is copied Then the new address reaches the clipboard', async () => {
    const { panel } = await openPanel();
    panel.regenerate();
    await flush();

    await copied(panel);

    expect(await navigator.clipboard.readText()).toBe(NEW_URL);
  });

  it('Given an active link copied once When it is copied again Then the copy is told twice', async () => {
    const { panel, toasts } = await openPanel();

    await copied(panel);
    await copied(panel);

    expect(toasts()).toEqual([
      { severity: 'success', detail: COPIED },
      { severity: 'success', detail: COPIED },
    ]);
  });

  it('Given a clipboard that refuses the text When the link is copied Then the owner is told to select it and copy it by hand', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new DOMException('The request is not allowed', 'NotAllowedError'),
    );
    const { panel, toasts } = await openPanel();

    await copied(panel);

    expect({ clipboard: await navigator.clipboard.readText(), toasts: toasts() }).toEqual({
      clipboard: 'avant',
      toasts: [{ severity: 'error', detail: COPY_FAILED }],
    });
  });

  it('Given no link yet When it is copied Then nothing is written nor told, until a link is created and copied', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const opened = await openPanel(() =>
      defer(() => of<BookingFeedSubscription>({ kind: 'none' })),
    );

    opened.panel.copyLink();
    await flush();
    const before = { writes: writeText.mock.calls.length, toasts: opened.toasts().length };
    opened.panel.regenerate();
    await flush();
    await copied(opened.panel);

    expect({ before, written: writeText.mock.calls.map(([text]) => text) }).toEqual({
      before: { writes: 0, toasts: 0 },
      written: [NEW_URL],
    });
  });

  it('Given the subscription still on its way When it is copied Then nothing is written, until the link arrives and is copied', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const arrival = new Subject<BookingFeedSubscription>();
    const { panel, toasts } = await openPanel(() => arrival);

    panel.copyLink();
    await flush();
    const before = { writes: writeText.mock.calls.length, toasts: toasts().length };
    arrival.next(CURRENT);
    arrival.complete();
    await flush();
    await copied(panel);

    expect({ before, written: writeText.mock.calls.map(([text]) => text) }).toEqual({
      before: { writes: 0, toasts: 0 },
      written: [CURRENT_URL],
    });
  });

  it('Given the read failed When it is copied Then nothing is written, until the link is read again and copied', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    let attempts = 0;
    const { panel, toasts } = await openPanel(() =>
      defer(() => {
        attempts += 1;
        return attempts === 1 ? throwError(() => new Error('offline')) : of(CURRENT);
      }),
    );

    panel.copyLink();
    await flush();
    const before = { writes: writeText.mock.calls.length, toasts: toasts().length };
    panel.reload();
    await flush();
    await copied(panel);

    expect({ before, written: writeText.mock.calls.map(([text]) => text) }).toEqual({
      before: { writes: 0, toasts: 0 },
      written: [CURRENT_URL],
    });
  });
});
