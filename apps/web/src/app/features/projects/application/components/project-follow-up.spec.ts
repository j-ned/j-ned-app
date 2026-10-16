import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ProjectFollowUp } from './project-follow-up';

@Component({ template: '' })
class BlankPage {}

const EVOLUTION_OFFER = {
  label: "Voir l'offre «\u00a0Évolution d'application existante\u00a0»",
  path: '/offres/evolution-application',
} as const;

type FollowUpOutput = 'offerOpened';

describe('ProjectFollowUp', () => {
  let fixture: ComponentFixture<ProjectFollowUp>;
  const emitted: FollowUpOutput[] = [];

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = (testId: string): HTMLElement | null =>
    host().querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  const text = (el: Element | null): string =>
    (el?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();

  beforeEach(async () => {
    emitted.length = 0;
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', component: BlankPage }])],
    });
    fixture = TestBed.createComponent(ProjectFollowUp);
    fixture.componentRef.setInput('offer', EVOLUTION_OFFER);
    fixture.componentInstance.offerOpened.subscribe(() => emitted.push('offerOpened'));
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('Given the block When it is rendered Then it is a section labelled by its h2 « Un besoin similaire ? »', () => {
    const section = byTestId('project-follow-up');
    const heading = section?.querySelector('h2') ?? null;

    expect(section?.tagName).toBe('SECTION');
    expect(text(heading)).toBe('Un besoin similaire\u202f?');
    expect(heading?.id).not.toBe('');
    expect(section?.getAttribute('aria-labelledby')).toBe(heading?.id);
  });

  it('Given the block When it is rendered Then it promises an answer within 48 hours, in the evening', () => {
    expect(text(byTestId('project-follow-up-text'))).toBe(
      'Décrivez-le, je vous réponds sous 48\u00a0h, le soir.',
    );
  });

  it('Given the related offer When the block is rendered Then its link carries the offer label and path', () => {
    const link = byTestId('project-follow-up-offer');

    expect([link?.tagName, link?.getAttribute('href'), text(link)]).toEqual([
      'A',
      EVOLUTION_OFFER.path,
      EVOLUTION_OFFER.label,
    ]);
  });

  it('Given the block When it is rendered Then its only link leads to the related offer', () => {
    expect(Array.from(host().querySelectorAll('a'), (link) => link.getAttribute('href'))).toEqual([
      EVOLUTION_OFFER.path,
    ]);
  });

  it.each<{ testId: string; url: string; output: FollowUpOutput }>([
    { testId: 'project-follow-up-offer', url: EVOLUTION_OFFER.path, output: 'offerOpened' },
  ])(
    'Given the block When $testId is clicked Then the router lands on $url and the block reports $output once',
    async ({ testId, url, output }) => {
      byTestId(testId)?.click();
      await fixture.whenStable();

      expect(TestBed.inject(Router).url).toBe(url);
      expect(emitted).toEqual([output]);
    },
  );

  it('Given the block When it is rendered Then it emits no page landmark', () => {
    expect(byTestId('project-follow-up')).not.toBeNull();
    expect(host().querySelectorAll('main, header, footer')).toHaveLength(0);
  });
});
