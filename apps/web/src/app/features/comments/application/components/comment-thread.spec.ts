import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { asButton } from '@shared/testing/as-button';
import { byTestId } from '@shared/testing/by-test-id';
import { settleBounded } from '@shared/testing/settle';
import { provideRouter } from '@angular/router';
import { OWNER_NAME } from '@shared/seo/site-person';
import {
  makePublishedComment,
  makePublishedReply,
  makePublishedThread,
} from '../../testing/comment-builders';
import type { PublishedThread } from '../../domain/models/comment.model';
import {
  toCommentThreadView,
  type CommentSent,
  type CommentSubmissionState,
  type CommentThreadContent,
} from '../comment-thread-view';
import { CommentThread } from './comment-thread';

const NARROW_NBSP = ' ';

const ready = (thread: PublishedThread): CommentThreadContent => ({
  status: 'ready',
  view: toCommentThreadView(thread),
});

// La section se pose sur l'élément `<section>` de la page : elle est rendue ici comme là-bas.
@Component({
  imports: [CommentThread],
  template: `<section
    app-comment-thread
    [content]="content()"
    [submission]="submission()"
    [resetToken]="resetToken()"
    [replyTarget]="replyTarget()"
    (submitted)="sent.push($event)"
    (replyOpened)="replyTarget.set($event)"
    (replyClosed)="replyTarget.set(null)"
  ></section>`,
})
class CommentThreadHost {
  readonly content = signal<CommentThreadContent>({ status: 'loading' });
  readonly submission = signal<CommentSubmissionState>({ kind: 'idle' });
  readonly resetToken = signal(0);
  readonly replyTarget = signal<string | null>(null);
  readonly sent: CommentSent[] = [];
}

async function renderHost(
  content: CommentThreadContent,
): Promise<ComponentFixture<CommentThreadHost>> {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(CommentThreadHost);
  fixture.componentInstance.content.set(content);
  document.body.append(fixture.nativeElement as HTMLElement);
  await settleBounded(fixture);
  return fixture;
}

async function render(content: CommentThreadContent): Promise<HTMLElement> {
  return (await renderHost(content)).nativeElement as HTMLElement;
}

const text = (element: Element | null | undefined): string | undefined =>
  element?.textContent?.replace(/\s+/g, ' ').trim();

describe('CommentThread: lecture', () => {
  afterEach(() => document.body.replaceChildren());

  it('Given two comments, one answered by a visitor and by the owner When the section is shown Then it is labelled by a heading with the count, and lists comments with their replies nested under them', async () => {
    const host = await render(
      ready(
        makePublishedThread({
          comments: [
            makePublishedComment({
              id: 'c-1',
              author: { kind: 'visitor', name: 'Camille' },
              replies: [
                makePublishedReply({ id: 'r-1', author: { kind: 'owner' } }),
                makePublishedReply({ id: 'r-2', author: { kind: 'visitor', name: 'Lou' } }),
              ],
            }),
            makePublishedComment({ id: 'c-2', author: { kind: 'visitor', name: 'Inès' } }),
          ],
        }),
      ),
    );
    const section = host.querySelector('section');
    const heading = section?.querySelector('h2');
    const list = section?.querySelector('ol[data-testid="comment-list"]');
    const topLevel = [...(list?.children ?? [])];
    const replies = topLevel[0]?.querySelector('ol');

    expect({
      labelledBy: section?.getAttribute('aria-labelledby') === heading?.id && !!heading?.id,
      heading: text(heading),
      items: topLevel.map((li) => [li.tagName, text(li.querySelector(':scope > article h3'))]),
      repliesLabel: replies?.getAttribute('aria-label'),
      replies: [...(replies?.children ?? [])].map((li) => text(li.querySelector('article h4'))),
      secondHasReplies: topLevel[1]?.querySelector('ol') ?? null,
    }).toEqual({
      labelledBy: true,
      heading: 'Commentaires (4)',
      items: [
        ['LI', 'Camille'],
        ['LI', 'Inès'],
      ],
      repliesLabel: 'Réponses à Camille',
      replies: [`${OWNER_NAME}, auteur de l’article`, 'Lou'],
      secondHasReplies: null,
    });
  });

  it('Given no comment When the section is shown Then it invites the reader to write the first one, without an empty list', async () => {
    const host = await render(ready(makePublishedThread({ comments: [] })));

    expect({
      heading: text(host.querySelector('h2')),
      empty: host.querySelector('[data-testid="comments-empty"]')?.textContent?.trim(),
      list: host.querySelector('[data-testid="comment-list"]'),
    }).toEqual({
      heading: 'Commentaires',
      empty: `Aucun commentaire pour l’instant. Écris le premier${NARROW_NBSP}!`,
      list: null,
    });
  });

  it('Given the comments could not be read When the section is shown Then it says so, without a list nor an empty state', async () => {
    const host = await render({ status: 'failed' });

    expect({
      error: host.querySelector('[data-testid="comments-load-error"]')?.textContent?.trim(),
      list: host.querySelector('[data-testid="comment-list"]'),
      empty: host.querySelector('[data-testid="comments-empty"]'),
    }).toEqual({
      error: 'Les commentaires n’ont pas pu être chargés.',
      list: null,
      empty: null,
    });
  });

  it('Given the comments are being read When the section is shown Then it is already titled, and neither the list nor the empty state shows', async () => {
    const host = await render({ status: 'loading' });

    expect({
      heading: text(host.querySelector('h2')),
      list: host.querySelector('[data-testid="comment-list"]'),
      empty: host.querySelector('[data-testid="comments-empty"]'),
    }).toEqual({ heading: 'Commentaires', list: null, empty: null });
  });

  it('Given more published comments than shown When the section is shown Then a sentence says only the first ones are listed', async () => {
    const comments = Array.from({ length: 100 }, (_, index) =>
      makePublishedComment({ id: `c-${index}` }),
    );
    const host = await render(ready(makePublishedThread({ comments, total: 120 })));

    expect(text(host.querySelector('[data-testid="comments-truncated"]'))).toBe(
      'Seuls les 100 premiers commentaires sont affichés.',
    );
  });
});

describe('CommentThread: écriture', () => {
  afterEach(() => document.body.replaceChildren());

  const mainForm = (host: HTMLElement): HTMLElement | null =>
    host.querySelector('[data-testid="comment-main-form"]');

  async function typeInto(
    fixture: ComponentFixture<CommentThreadHost>,
    field: 'name' | 'email' | 'body',
    text: string,
  ): Promise<void> {
    const element = mainForm(fixture.nativeElement as HTMLElement)?.querySelector<
      HTMLInputElement | HTMLTextAreaElement
    >(`[data-testid="comment-${field}"]`);
    if (!element) throw new Error(`no ${field} field in the main form`);
    element.value = text;
    element.dispatchEvent(new Event('input'));
    await settleBounded(fixture);
  }

  it.each([
    { state: 'a list', content: ready(makePublishedThread()) },
    { state: 'no comment', content: ready(makePublishedThread({ comments: [] })) },
    { state: 'a reading failure', content: { status: 'failed' } as const },
  ])(
    'Given $state When the section shows Then the reader can still write, in a form after the list',
    async ({ content }) => {
      const host = await render(content);
      const form = mainForm(host);
      const list = byTestId(host, 'comment-list');

      expect({
        legend: form?.querySelector('legend')?.textContent?.trim(),
        afterList:
          list && form ? list.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING : 4,
      }).toEqual({ legend: 'Laisser un commentaire', afterList: Node.DOCUMENT_POSITION_FOLLOWING });
    },
  );

  it('Given a filled form When the reader sends it Then the section hands over the comment, as a comment and not a reply', async () => {
    const fixture = await renderHost(ready(makePublishedThread()));
    await typeInto(fixture, 'name', 'Lou');
    await typeInto(fixture, 'email', 'lou@example.test');
    await typeInto(fixture, 'body', 'Bel article.');

    asButton(
      mainForm(fixture.nativeElement as HTMLElement)?.querySelector(
        '[data-testid="comment-submit"]',
      ),
    ).click();
    await settleBounded(fixture);

    expect(fixture.componentInstance.sent).toEqual([
      {
        draft: { name: 'Lou', email: 'lou@example.test', body: 'Bel article.', website: '' },
        parentId: null,
      },
    ]);
  });

  it('Given the comment was accepted When the section shows Then a status says it awaits review, takes the focus, and the list is unchanged', async () => {
    const fixture = await renderHost(ready(makePublishedThread()));
    fixture.componentInstance.submission.set({ kind: 'sent', parentId: null });
    await settleBounded(fixture);
    const host = fixture.nativeElement as HTMLElement;
    const status = byTestId(host, 'status-message');

    expect({
      role: status?.getAttribute('role'),
      text: status?.textContent?.trim(),
      focused: document.activeElement === status,
      items: host.querySelectorAll('[data-testid="comment-item"]').length,
    }).toEqual({
      role: 'status',
      text: `Merci${NARROW_NBSP}! Ton commentaire sera publié après relecture.`,
      focused: true,
      items: 1,
    });
  });

  it.each([
    {
      reason: 'rate-limited',
      message:
        'Trop d’envois en peu de temps, ou plusieurs de tes commentaires attendent encore leur relecture. Réessaie plus tard.',
    },
    {
      reason: 'closed',
      message: 'Les commentaires sont momentanément fermés. Réessaie plus tard.',
    },
    { reason: 'not-found', message: 'Cet article ou ce commentaire n’accepte plus de réponse.' },
    { reason: 'invalid', message: 'Certains champs ne vont pas. Vérifie ta saisie et réessaie.' },
    {
      reason: 'network',
      message: 'Connexion impossible. Vérifie ton réseau, puis réessaie dans un instant.',
    },
    {
      reason: 'unavailable',
      message: 'Le serveur a un souci passager. Réessaie dans quelques minutes.',
    },
  ] as const)(
    'Given the comment was refused as « $reason » When the section shows Then an alert says « $message » once, and the focus stays where it was',
    async ({ reason, message }) => {
      const fixture = await renderHost(ready(makePublishedThread()));
      fixture.componentInstance.submission.set({ kind: 'failed', parentId: null, reason });
      await settleBounded(fixture);
      const host = fixture.nativeElement as HTMLElement;
      const alerts = [...host.querySelectorAll('[data-testid="status-message"]')];

      expect({
        alerts: alerts.map((alert) => [alert.getAttribute('role'), alert.textContent?.trim()]),
        focused: alerts.includes(document.activeElement as Element),
      }).toEqual({ alerts: [['alert', message]], focused: false });
    },
  );

  it('Given a comment being sent When the section shows Then the send button of the main form says it is unavailable', async () => {
    const fixture = await renderHost(ready(makePublishedThread()));
    fixture.componentInstance.submission.set({ kind: 'sending', parentId: null });
    await settleBounded(fixture);

    expect(
      asButton(
        mainForm(fixture.nativeElement as HTMLElement)?.querySelector(
          '[data-testid="comment-submit"]',
        ),
      ).getAttribute('aria-disabled'),
    ).toBe('true');
  });
});

describe('CommentThread: répondre', () => {
  afterEach(() => document.body.replaceChildren());

  const thread = (): PublishedThread =>
    makePublishedThread({
      comments: [
        makePublishedComment({ id: 'c-1', replies: [makePublishedReply({ id: 'r-1' })] }),
        makePublishedComment({ id: 'c-2', author: { kind: 'visitor', name: 'Inès' } }),
      ],
    });

  const itemOf = (host: HTMLElement, id: string): HTMLElement | null =>
    host.querySelector(`article[aria-labelledby="comment-${id}-author"]`)?.closest('li') ?? null;

  const replyButtonOf = (host: HTMLElement, id: string): HTMLButtonElement | null =>
    itemOf(host, id)?.querySelector(':scope > article [data-testid="comment-reply"]') ?? null;

  async function openReply(
    fixture: ComponentFixture<CommentThreadHost>,
    id: string,
  ): Promise<HTMLElement> {
    const host = fixture.nativeElement as HTMLElement;
    replyButtonOf(host, id)?.click();
    await settleBounded(fixture);
    return host;
  }

  it('Given comments and their replies When the section shows Then each comment can be answered, a reply cannot', async () => {
    const host = await render(ready(thread()));

    expect({
      comments: ['c-1', 'c-2'].map((id) => replyButtonOf(host, id) !== null),
      buttons: host.querySelectorAll('[data-testid="comment-reply"]').length,
    }).toEqual({ comments: [true, true], buttons: 2 });
  });

  it('Given a comment When the reader presses « Répondre » Then a form named after its author opens under it, and its first field takes the focus', async () => {
    const fixture = await renderHost(ready(thread()));

    const host = await openReply(fixture, 'c-1');
    const form = itemOf(host, 'c-1')?.querySelector('[data-testid="comment-reply-form"]');
    const name = form?.querySelector('[data-testid="comment-name"]');

    expect({
      legend: form?.querySelector('legend')?.textContent?.trim(),
      id: form?.id,
      nameId: name?.id,
      focused: document.activeElement === name,
      expanded: replyButtonOf(host, 'c-1')?.getAttribute('aria-expanded'),
    }).toEqual({
      legend: 'Répondre à Camille',
      id: 'reply-c-1-form',
      nameId: 'reply-c-1-name',
      focused: true,
      expanded: 'true',
    });
  });

  it('Given a reply form open under one comment When the reader answers another one Then only one reply form stays open, under the new comment', async () => {
    const fixture = await renderHost(ready(thread()));
    await openReply(fixture, 'c-1');

    const host = await openReply(fixture, 'c-2');

    expect({
      forms: host.querySelectorAll('[data-testid="comment-reply-form"]').length,
      under: itemOf(host, 'c-2')?.querySelector('[data-testid="comment-reply-form"]') !== null,
    }).toEqual({ forms: 1, under: true });
  });

  it.each(['Annuler', 'Échap'])(
    'Given an open reply form When the reader leaves it with %s Then it closes and the focus goes back to « Répondre »',
    async (way) => {
      const fixture = await renderHost(ready(thread()));
      const host = await openReply(fixture, 'c-1');
      const form = itemOf(host, 'c-1')?.querySelector('[data-testid="comment-reply-form"]');

      if (way === 'Annuler') {
        form?.querySelector<HTMLButtonElement>('[data-testid="comment-cancel"]')?.click();
      } else {
        form
          ?.querySelector('[data-testid="comment-name"]')
          ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }
      await settleBounded(fixture);

      expect({
        forms: host.querySelectorAll('[data-testid="comment-reply-form"]').length,
        focused: document.activeElement === replyButtonOf(host, 'c-1'),
      }).toEqual({ forms: 0, focused: true });
    },
  );

  it('Given the main form When the reader presses Escape in it Then nothing closes', async () => {
    const fixture = await renderHost(ready(thread()));
    const host = fixture.nativeElement as HTMLElement;

    host
      .querySelector('[data-testid="comment-main-form"] [data-testid="comment-name"]')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settleBounded(fixture);

    expect(byTestId(host, 'comment-main-form')?.querySelector('form')).not.toBeNull();
  });

  it('Given a filled reply form When the reader sends it Then the section hands over a reply to that comment', async () => {
    const fixture = await renderHost(ready(thread()));
    const host = await openReply(fixture, 'c-1');
    const form = itemOf(host, 'c-1')?.querySelector('[data-testid="comment-reply-form"]');
    const fields = { name: 'Lou', email: 'lou@example.test', body: 'Pareil pour moi.' };
    for (const [field, text] of Object.entries(fields)) {
      const element = form?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `[data-testid="comment-${field}"]`,
      );
      if (!element) throw new Error(`no ${field} field in the reply form`);
      element.value = text;
      element.dispatchEvent(new Event('input'));
    }
    await settleBounded(fixture);

    asButton(form?.querySelector('[data-testid="comment-submit"]')).click();
    await settleBounded(fixture);

    expect(fixture.componentInstance.sent).toEqual([
      { draft: { ...fields, website: '' }, parentId: 'c-1' },
    ]);
  });

  it('Given a reply refused for a comment When the section shows Then the alert sits with that comment, not under the main form', async () => {
    const fixture = await renderHost(ready(thread()));
    await openReply(fixture, 'c-1');
    fixture.componentInstance.submission.set({
      kind: 'failed',
      parentId: 'c-1',
      reason: 'not-found',
    });
    await settleBounded(fixture);
    const host = fixture.nativeElement as HTMLElement;

    expect({
      inItem: itemOf(host, 'c-1')
        ?.querySelector('[data-testid="status-message"]')
        ?.textContent?.trim(),
      inMain:
        byTestId(host, 'comment-main-form')?.querySelector('[data-testid="status-message"]') ??
        null,
    }).toEqual({
      inItem: 'Cet article ou ce commentaire n’accepte plus de réponse.',
      inMain: null,
    });
  });

  it('Given a reply accepted and its form closed When the section shows Then the confirmation sits with that comment and takes the focus', async () => {
    const fixture = await renderHost(ready(thread()));
    fixture.componentInstance.submission.set({ kind: 'sent', parentId: 'c-1' });
    await settleBounded(fixture);
    const host = fixture.nativeElement as HTMLElement;
    const status = itemOf(host, 'c-1')?.querySelector('[data-testid="status-message"]');

    expect({
      text: status?.textContent?.trim(),
      focused: document.activeElement === status,
    }).toEqual({
      text: `Merci${NARROW_NBSP}! Ton commentaire sera publié après relecture.`,
      focused: true,
    });
  });
});
