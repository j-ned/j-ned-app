import { inputBinding, outputBinding, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { ContactMessage } from '@features/contact/domain/models/contact-message.model';
import { makeContactMessage } from '@features/contact/testing/contact-message-builders';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { pressTestId } from '@shared/testing/press-test-id';
import { settle } from '@shared/testing/settle';
import { AdminMessageRow } from './admin-message-row';

const CLAIRE = makeContactMessage({
  id: 1,
  name: 'Claire Martin',
  email: 'claire@exemple.fr',
  subject: 'Site vitrine pour un atelier de menuiserie',
  message: 'Bonjour, je cherche quelqu’un pour refaire le site de notre atelier.',
  createdAt: '2026-10-07T08:00:00Z',
  read: false,
});

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const nativeControl = (element: HTMLElement | null): HTMLElement | null =>
  element instanceof HTMLButtonElement || element instanceof HTMLAnchorElement
    ? element
    : (element?.querySelector<HTMLElement>('button, a') ?? null);

const accessibleName = (element: HTMLElement | null): string =>
  element?.getAttribute('aria-label') ?? normalized(element);

type Row = {
  readonly fixture: ComponentFixture<AdminMessageRow>;
  readonly host: HTMLElement;
  readonly emitted: { toggle: number; markRead: number; deleteRequested: number };
};

async function renderRow(message: ContactMessage, expanded = false): Promise<Row> {
  const emitted = { toggle: 0, markRead: 0, deleteRequested: 0 };
  const fixture = TestBed.createComponent(AdminMessageRow, {
    bindings: [
      inputBinding('message', () => message),
      inputBinding('expanded', signal(expanded)),
      outputBinding('toggle', () => emitted.toggle++),
      outputBinding('markRead', () => emitted.markRead++),
      outputBinding('deleteRequested', () => emitted.deleteRequested++),
    ],
  });
  await settle(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement, emitted };
}

describe('AdminMessageRow', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-07T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Given an unread message When the row renders Then it shows the sender, the subject after a « Nouveau » stamp and how long ago it came', async () => {
    const { host } = await renderRow(CLAIRE);
    const time = byTestId(host, 'message-date');

    expect({
      sender: testIdText(host, 'message-sender'),
      email: testIdText(host, 'message-email'),
      stamp: testIdText(host, 'message-new'),
      stampFirst:
        byTestId(host, 'message-subject')?.firstElementChild === byTestId(host, 'message-new'),
      subject: testIdText(host, 'message-subject-text'),
      time: {
        tag: time?.tagName,
        datetime: time?.getAttribute('datetime'),
        text: normalized(time),
      },
    }).toEqual({
      sender: 'Claire Martin',
      email: 'claire@exemple.fr',
      stamp: 'Nouveau',
      stampFirst: true,
      subject: 'Site vitrine pour un atelier de menuiserie',
      time: { tag: 'TIME', datetime: '2026-10-07T08:00:00Z', text: 'il y a 2\u00a0h' },
    });
  });

  it('Given an unread message When the row renders Then each action names the sender, the reply being an e-mail link', async () => {
    const { host } = await renderRow(CLAIRE);
    const reply = nativeControl(byTestId(host, 'message-reply'));

    expect({
      reply: {
        tag: reply?.tagName,
        href: reply?.getAttribute('href'),
        name: accessibleName(reply),
      },
      markRead: accessibleName(nativeControl(byTestId(host, 'message-mark-read'))),
      delete: accessibleName(nativeControl(byTestId(host, 'message-delete'))),
    }).toEqual({
      reply: { tag: 'A', href: 'mailto:claire@exemple.fr', name: 'Répondre à Claire Martin' },
      markRead: 'Marquer comme lu\u00a0: Claire Martin',
      delete: 'Supprimer le message de Claire Martin',
    });
  });

  it('Given a read message When the row renders Then it has neither the « Nouveau » stamp nor the mark-as-read action', async () => {
    const { host } = await renderRow({ ...CLAIRE, read: true });

    expect({
      stamp: byTestId(host, 'message-new'),
      markRead: byTestId(host, 'message-mark-read'),
      subject: testIdText(host, 'message-subject-text'),
    }).toEqual({
      stamp: null,
      markRead: null,
      subject: 'Site vitrine pour un atelier de menuiserie',
    });
  });

  it.each([
    {
      expanded: false,
      button: {
        tag: 'BUTTON',
        type: 'button',
        expanded: 'false',
        controls: 'message-body-1',
        name: 'Afficher le message de Claire Martin',
      },
      bodies: [],
    },
    {
      expanded: true,
      button: {
        tag: 'BUTTON',
        type: 'button',
        expanded: 'true',
        controls: 'message-body-1',
        name: 'Masquer le message de Claire Martin',
      },
      bodies: [
        {
          id: 'message-body-1',
          text: 'Bonjour, je cherche quelqu’un pour refaire le site de notre atelier.',
        },
      ],
    },
  ])(
    'Given the row expanded=$expanded When it renders Then its native button says so and controls the body',
    async ({ expanded, button, bodies }) => {
      const { host } = await renderRow(CLAIRE, expanded);
      const control = nativeControl(byTestId(host, 'message-expand'));

      expect({
        button: {
          tag: control?.tagName,
          type: control?.getAttribute('type'),
          expanded: control?.getAttribute('aria-expanded'),
          controls: control?.getAttribute('aria-controls'),
          name: accessibleName(control),
        },
        bodies: [...host.querySelectorAll<HTMLElement>('[data-testid="message-body"]')].map(
          (body) => ({ id: body.id, text: normalized(body) }),
        ),
      }).toEqual({ button, bodies });
    },
  );

  it.each([
    { testId: 'message-expand', emitted: { toggle: 1, markRead: 0, deleteRequested: 0 } },
    { testId: 'message-mark-read', emitted: { toggle: 0, markRead: 1, deleteRequested: 0 } },
    { testId: 'message-delete', emitted: { toggle: 0, markRead: 0, deleteRequested: 1 } },
  ])(
    'Given an unread message When $testId is pressed Then the row asks for that action once',
    async ({ testId, emitted }) => {
      const row = await renderRow(CLAIRE);

      await pressTestId(row.fixture, testId);

      expect(row.emitted).toEqual(emitted);
    },
  );
});
