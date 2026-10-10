import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { HomeRecruiterBand } from './home-recruiter-band';

@Component({ template: '' })
class BlankPage {}

const CV_DOWNLOAD_URL = '/api/cv/download';

type BandOutput = 'hiringOpened' | 'cvDownloaded' | 'linkedinOpened' | 'githubOpened';

describe('HomeRecruiterBand', () => {
  let fixture: ComponentFixture<HomeRecruiterBand>;
  const emitted: BandOutput[] = [];

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = <T extends HTMLElement = HTMLElement>(testId: string): T | null =>
    host().querySelector<T>(`[data-testid="${testId}"]`);
  const text = (el: Element | null): string =>
    (el?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();

  const render = async (cvUrl: string | null): Promise<void> => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'about', component: BlankPage }])],
    });
    fixture = TestBed.createComponent(HomeRecruiterBand);
    fixture.componentRef.setInput('cvUrl', cvUrl);
    const band = fixture.componentInstance;
    band.hiringOpened.subscribe(() => emitted.push('hiringOpened'));
    band.cvDownloaded.subscribe(() => emitted.push('cvDownloaded'));
    band.linkedinOpened.subscribe(() => emitted.push('linkedinOpened'));
    band.githubOpened.subscribe(() => emitted.push('githubOpened'));
    fixture.detectChanges();
    await fixture.whenStable();
  };

  const clickWithoutLeaving = (testId: string): void => {
    const link = byTestId<HTMLAnchorElement>(testId);
    link?.addEventListener('click', (event) => event.preventDefault());
    link?.click();
  };

  beforeEach(() => {
    emitted.length = 0;
  });

  describe('Given the CV url', () => {
    beforeEach(async () => {
      await render(CV_DOWNLOAD_URL);
    });

    it('When the band is rendered Then it offers, in order, the hiring entry, the CV, LinkedIn and GitHub', () => {
      expect(
        [
          'home-recruiter-about',
          'home-recruiter-cv',
          'home-recruiter-linkedin',
          'home-recruiter-github',
        ].map((testId) => text(byTestId(testId))),
      ).toEqual(['Vous recrutez\u202f?', 'CV (PDF)', 'LinkedIn', 'GitHub']);
    });

    it('When the band is rendered Then « Vous recrutez ? » points to the hiring block of the Parcours page', () => {
      expect(byTestId('home-recruiter-about')?.getAttribute('href')).toBe('/about#recrutement');
    });

    it('When « Vous recrutez ? » is clicked Then the router lands on the hiring anchor and the band reports it once', async () => {
      byTestId('home-recruiter-about')?.click();
      await fixture.whenStable();

      expect(TestBed.inject(Router).url).toBe('/about#recrutement');
      expect(emitted).toEqual(['hiringOpened']);
    });

    it('When the band is rendered Then the CV link points to the download', () => {
      const link = byTestId<HTMLAnchorElement>('home-recruiter-cv');

      expect(link?.tagName).toBe('A');
      expect(link?.getAttribute('href')).toBe(CV_DOWNLOAD_URL);
    });

    it.each([
      { testId: 'home-recruiter-linkedin', href: SITE_IDENTITY.socials.linkedin },
      { testId: 'home-recruiter-github', href: SITE_IDENTITY.socials.github },
    ])(
      'When the band is rendered Then $testId opens the profile in a new tab, without opener',
      ({ testId, href }) => {
        const link = byTestId<HTMLAnchorElement>(testId);

        expect([
          link?.getAttribute('href'),
          link?.getAttribute('target'),
          link?.getAttribute('rel'),
        ]).toEqual([href, '_blank', 'noopener noreferrer']);
      },
    );

    it.each<{ testId: string; output: BandOutput }>([
      { testId: 'home-recruiter-cv', output: 'cvDownloaded' },
      { testId: 'home-recruiter-linkedin', output: 'linkedinOpened' },
      { testId: 'home-recruiter-github', output: 'githubOpened' },
    ])('When $testId is clicked Then the band reports $output once', ({ testId, output }) => {
      clickWithoutLeaving(testId);

      expect(emitted).toEqual([output]);
    });

    it('When the band is rendered Then it is a line of links, not a landmark nor a section', () => {
      expect(byTestId('home-recruiter-about')).not.toBeNull();
      expect(host().querySelectorAll('section, aside, nav, header, footer, main')).toHaveLength(0);
    });
  });

  describe('Given no CV url', () => {
    beforeEach(async () => {
      await render(null);
    });

    it('When the band is rendered Then the CV link is absent, the other entries stay', () => {
      expect(byTestId('home-recruiter-cv')).toBeNull();
      expect(
        ['home-recruiter-about', 'home-recruiter-linkedin', 'home-recruiter-github'].map(
          (testId) => byTestId(testId) !== null,
        ),
      ).toEqual([true, true, true]);
    });
  });

  describe.each<{ label: string; cvUrl: string | null }>([
    { label: 'the CV url', cvUrl: CV_DOWNLOAD_URL },
    { label: 'no CV url', cvUrl: null },
  ])('Given $label', ({ cvUrl }) => {
    beforeEach(async () => {
      await render(cvUrl);
    });

    it('When the band is rendered Then every separator travels with the link it introduces, so no line ends or starts on it', () => {
      const separators = Array.from(
        host().querySelectorAll<HTMLElement>('[aria-hidden="true"]'),
      ).filter((el) => text(el) === '·');
      const firstExternal = byTestId(cvUrl ? 'home-recruiter-cv' : 'home-recruiter-linkedin');

      expect(separators.length).toBe(cvUrl ? 2 : 1);
      expect(
        separators.map((separator) => ({
          next: separator.nextElementSibling?.tagName,
          lastOfItsElement: separator.parentElement?.lastElementChild === separator,
          pairOnly: separator.parentElement?.children.length === 2,
          sharesElementWithLink: separator.parentElement?.contains(separator.nextElementSibling),
        })),
      ).toEqual(
        separators.map(() => ({
          next: 'A',
          lastOfItsElement: false,
          pairOnly: true,
          sharesElementWithLink: true,
        })),
      );
      expect(firstExternal?.previousElementSibling).toBeNull();
    });

    it('When the band is rendered Then each link opening a new tab says so in its accessible name, the hiring entry does not', () => {
      const externals = cvUrl
        ? [
            ['home-recruiter-cv', 'CV (PDF) (nouvel onglet)'],
            ['home-recruiter-linkedin', 'LinkedIn (nouvel onglet)'],
            ['home-recruiter-github', 'GitHub (nouvel onglet)'],
          ]
        : [
            ['home-recruiter-linkedin', 'LinkedIn (nouvel onglet)'],
            ['home-recruiter-github', 'GitHub (nouvel onglet)'],
          ];

      expect(externals.map(([testId]) => byTestId(testId)?.getAttribute('aria-label'))).toEqual(
        externals.map(([, name]) => name),
      );
      expect(byTestId('home-recruiter-about')?.hasAttribute('aria-label')).toBe(false);
    });
  });
});
