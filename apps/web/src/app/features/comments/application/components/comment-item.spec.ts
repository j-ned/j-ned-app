import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OWNER_NAME } from '@shared/seo/site-person';
import type { CommentView } from '../comment-thread-view';
import { CommentItem } from './comment-item';

const HOSTILE_BODY = '<img src=x onerror="alert(1)"><script>alert(2)</script> & <app-root>';
const HOSTILE_NAME = '<b onclick="alert(3)">Camille</b>';

function aCommentView(overrides: Partial<CommentView> = {}): CommentView {
  return {
    id: 'c-1',
    headingId: 'comment-c-1-author',
    author: 'Camille',
    ownerMention: null,
    createdAt: '2026-11-21T09:30:00.000Z',
    body: 'Merci pour cet article.',
    ...overrides,
  };
}

async function render(
  comment: CommentView,
  level: 'comment' | 'reply' = 'comment',
): Promise<HTMLElement> {
  registerLocaleData(localeFr);
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }] });
  const fixture = TestBed.createComponent(CommentItemHost);
  fixture.componentInstance.comment.set(comment);
  fixture.componentInstance.level.set(level);
  await fixture.whenStable();
  const article = (fixture.nativeElement as HTMLElement).firstElementChild;
  if (!(article instanceof HTMLElement)) throw new Error('no comment rendered');
  return article;
}

// Le composant se pose sur l'élément `<article>` de son parent : il est rendu ici comme là-bas.
@Component({
  imports: [CommentItem],
  template: `<article app-comment-item [comment]="comment()" [level]="level()"></article>`,
})
class CommentItemHost {
  readonly comment = signal(aCommentView());
  readonly level = signal<'comment' | 'reply'>('comment');
}

describe('CommentItem', () => {
  it('Given a visitor comment When it is shown Then the article is named by its author heading and carries a machine-readable date and the text', async () => {
    const host = await render(
      aCommentView({ headingId: 'comment-c-1-author', createdAt: '2026-11-21T09:30:00.000Z' }),
    );
    const heading = host.querySelector('h3');

    expect({
      tag: host.tagName,
      labelledBy: host.getAttribute('aria-labelledby'),
      headingId: heading?.id,
      author: heading?.textContent?.trim(),
      datetime: host.querySelector('time')?.getAttribute('datetime'),
      date: host.querySelector('time')?.textContent?.trim(),
      body: host.querySelector('[data-testid="comment-body"]')?.textContent,
    }).toEqual({
      tag: 'ARTICLE',
      labelledBy: 'comment-c-1-author',
      headingId: 'comment-c-1-author',
      author: 'Camille',
      datetime: '2026-11-21T09:30:00.000Z',
      date: '21 novembre 2026',
      body: 'Merci pour cet article.',
    });
  });

  it('Given a reply When it is shown Then its author heading sits one level below a comment', async () => {
    const host = await render(aCommentView(), 'reply');

    expect([host.querySelector('h3'), host.querySelector('h4')?.textContent?.trim()]).toEqual([
      null,
      'Camille',
    ]);
  });

  it('Given a reply of the owner When it is shown Then the owner is named and called the article author in words', async () => {
    const host = await render(
      aCommentView({ author: OWNER_NAME, ownerMention: 'auteur de l’article' }),
      'reply',
    );

    expect(host.querySelector('h4')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      `${OWNER_NAME}, auteur de l’article`,
    );
  });

  it('Given markup typed as the name and the text When the comment is shown Then nothing of it is interpreted: no element is created, the characters are shown as typed', async () => {
    const host = await render(aCommentView({ author: HOSTILE_NAME, body: HOSTILE_BODY }));

    expect({
      elements: host.querySelectorAll('img, script, b, app-root, a').length,
      author: host.querySelector('h3')?.textContent?.trim(),
      body: host.querySelector('[data-testid="comment-body"]')?.textContent,
    }).toEqual({ elements: 0, author: HOSTILE_NAME, body: HOSTILE_BODY });
  });

  it('Given a text holding an address When the comment is shown Then no link is made from it', async () => {
    const host = await render(
      aCommentView({ body: 'Voir https://exemple.test/doc et www.x.test' }),
    );

    expect(host.querySelectorAll('a')).toHaveLength(0);
  });

  it('Given a text over several lines When the comment is shown Then the line breaks are kept on screen', async () => {
    const host = await render(aCommentView({ body: 'ligne 1\nligne 2' }));
    const body = host.querySelector('[data-testid="comment-body"]');

    expect([body?.textContent, body?.classList.contains('whitespace-pre-line')]).toEqual([
      'ligne 1\nligne 2',
      true,
    ]);
  });
});
