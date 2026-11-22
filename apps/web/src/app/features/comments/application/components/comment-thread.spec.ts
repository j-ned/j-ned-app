import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OWNER_NAME } from '@shared/seo/site-person';
import {
  makePublishedComment,
  makePublishedReply,
  makePublishedThread,
} from '../../testing/comment-builders';
import type { PublishedThread } from '../../domain/models/comment.model';
import { toCommentThreadView, type CommentThreadContent } from '../comment-thread-view';
import { CommentThread } from './comment-thread';

const NARROW_NBSP = ' ';

const ready = (thread: PublishedThread): CommentThreadContent => ({
  status: 'ready',
  view: toCommentThreadView(thread),
});

// La section se pose sur l'élément `<section>` de la page : elle est rendue ici comme là-bas.
@Component({
  imports: [CommentThread],
  template: `<section app-comment-thread [content]="content()"></section>`,
})
class CommentThreadHost {
  readonly content = signal<CommentThreadContent>({ status: 'loading' });
}

async function render(content: CommentThreadContent): Promise<HTMLElement> {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(CommentThreadHost);
  fixture.componentInstance.content.set(content);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

const text = (element: Element | null | undefined): string | undefined =>
  element?.textContent?.replace(/\s+/g, ' ').trim();

describe('CommentThread: lecture', () => {
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
