import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { RouterLink, provideRouter } from '@angular/router';
import { LinkCard } from './link-card';

const CARD = [
  'group',
  'grid',
  'gap-1',
  'rounded-card',
  'border-2',
  'border-foreground',
  'bg-surface',
  'p-6',
  'transition-colors',
  'hover:border-primary',
];

@Component({
  imports: [LinkCard, RouterLink],
  template: `<a
    app-link-card
    data-testid="card"
    [routerLink]="['/blog', 'voisin']"
    [overline]="overline()"
    [heading]="heading()"
    [align]="align()"
  ></a>`,
})
class AlignedHost {
  readonly overline = signal('article précédent');
  readonly heading = signal('Un article voisin');
  readonly align = signal<'start' | 'end'>('end');
}

@Component({
  imports: [LinkCard, RouterLink],
  template: `<a
    app-link-card
    data-testid="card"
    routerLink="/projects/dashflow"
    overline="Fiche du projet"
    heading="DashFlow"
  ></a>`,
})
class DefaultHost {}

@Component({
  imports: [LinkCard, RouterLink],
  template: `<a
    app-link-card
    data-testid="card"
    routerLink="/atelier/plaquettes"
    overline="Outil"
    heading="Guide des plaquettes"
    summary="Choisis ta matière et ton opération."
  ></a>`,
})
class SummaryHost {}

const render = async <T>(host: new () => T): Promise<ComponentFixture<T>> => {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
};

const cardOf = (fixture: ComponentFixture<unknown>): HTMLAnchorElement =>
  (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('[data-testid="card"]')!;

const linesOf = (card: HTMLElement): readonly (string | undefined)[] =>
  Array.from(card.children, (line) => line.textContent?.trim());

describe('LinkCard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('Given an overline and a heading When the card renders Then the link reads the overline, then the heading, and keeps its own target', async () => {
    const card = cardOf(await render(DefaultHost));

    expect({
      tag: card.tagName,
      href: card.getAttribute('href'),
      lines: linesOf(card),
    }).toEqual({
      tag: 'A',
      href: '/projects/dashflow',
      lines: ['Fiche du projet', 'DashFlow'],
    });
  });

  it('Given a summary When the card renders Then the link reads the overline, the heading, then the summary in muted text', async () => {
    const card = cardOf(await render(SummaryHost));

    expect({
      lines: linesOf(card),
      summaryMuted: card.children[2]?.classList.contains('text-muted'),
    }).toEqual({
      lines: ['Outil', 'Guide des plaquettes', 'Choisis ta matière et ton opération.'],
      summaryMuted: true,
    });
  });

  it('Given no alignment When the card renders Then the host carries the card look, aligned to the start', async () => {
    const card = cardOf(await render(DefaultHost));

    expect([...card.classList].sort()).toEqual([...CARD].sort());
  });

  it('Given the end alignment When the card renders Then the host keeps the card look and aligns its text to the right', async () => {
    const card = cardOf(await render(AlignedHost));

    expect([...card.classList].sort()).toEqual([...CARD, 'text-right'].sort());
  });

  it('Given a rendered card When its inputs change Then the card follows them', async () => {
    const fixture = await render(AlignedHost);

    fixture.componentInstance.overline.set('article suivant');
    fixture.componentInstance.heading.set('Un autre article');
    fixture.componentInstance.align.set('start');
    fixture.detectChanges();
    await fixture.whenStable();
    const card = cardOf(fixture);

    expect({
      lines: linesOf(card),
      endAligned: card.classList.contains('text-right'),
    }).toEqual({ lines: ['article suivant', 'Un autre article'], endAligned: false });
  });
});
