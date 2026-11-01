import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import {
  HOME_HERO_CTA_LABELS,
  HOME_HERO_STICKER_LABEL,
  HOME_WORK_FRAME,
} from '../domain/home-hero.static-data';
import type { HeroData } from '../domain/models/hero.model';
import { STATIC_HERO } from '../infra/data/home.static-data';
import { HomeHeroSection } from './home-hero-section';

@Component({ template: '' })
class BlankPage {}

describe('HomeHeroSection', () => {
  let fixture: ComponentFixture<HomeHeroSection>;
  const blogOpened = vi.fn();
  const projectsOpened = vi.fn();

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = (id: string, root: ParentNode = host()): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const allByTestId = (id: string, root: ParentNode = host()): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
  const text = (el: Element | null | undefined): string =>
    (el?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();

  const render = async (hero: HeroData | null): Promise<void> => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'blog', component: BlankPage },
          { path: 'projects', component: BlankPage },
        ]),
      ],
    });
    fixture = TestBed.createComponent(HomeHeroSection);
    fixture.componentRef.setInput('hero', hero);
    fixture.componentInstance.blogOpened.subscribe(blogOpened);
    fixture.componentInstance.projectsOpened.subscribe(projectsOpened);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    blogOpened.mockClear();
    projectsOpened.mockClear();
    await render(STATIC_HERO);
  });

  describe.each([
    {
      testId: 'hero-cta-blog',
      path: '/blog',
      label: HOME_HERO_CTA_LABELS.blog,
      emitted: blogOpened,
    },
    {
      testId: 'hero-cta-projects',
      path: '/projects',
      label: HOME_HERO_CTA_LABELS.projects,
      emitted: projectsOpened,
    },
  ])('$testId call to action', ({ testId, path, label, emitted }) => {
    it(`is a link to ${path}, usable without JavaScript`, () => {
      const link = byTestId(testId);
      expect([link?.tagName, link?.getAttribute('href'), text(link)]).toEqual(['A', path, label]);
    });

    it(`leads to ${path} when clicked`, async () => {
      byTestId(testId)?.click();
      await fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe(path);
    });

    it('tells the page it was opened, once, without the other call to action', () => {
      byTestId(testId)?.click();
      expect([blogOpened.mock.calls.length, projectsOpened.mock.calls.length]).toEqual(
        emitted === blogOpened ? [1, 0] : [0, 1],
      );
    });
  });

  it('offers the blog then the projects, and nothing else to follow: no contact, offer nor booking', () => {
    expect(
      Array.from(host().querySelectorAll('a, button'), (el) => el.getAttribute('data-testid')),
    ).toEqual(['hero-cta-blog', 'hero-cta-projects']);
  });

  it('styles the blog as the primary call to action and the projects as the secondary one', () => {
    expect(
      Array.from(host().querySelectorAll('[appbutton]'), (el) => [
        el.getAttribute('data-testid'),
        el.getAttribute('variant'),
      ]),
    ).toEqual([
      ['hero-cta-blog', null],
      ['hero-cta-projects', 'outlined'],
    ]);
  });

  it('states no availability any more', () => {
    expect(byTestId('hero-availability')).toBeNull();
  });

  describe('work frame', () => {
    const frame = (): HTMLElement | null => byTestId('hero-work-frame');

    it('is a group named after the frame title', () => {
      expect(frame()?.getAttribute('role')).toBe('group');
      expect(frame()?.getAttribute('aria-label')).toBe(HOME_WORK_FRAME.title);
    });

    it('shows the frame title and its reference', () => {
      expect(frame()).not.toBeNull();
      expect(text(byTestId('cartouche-title', frame() ?? host()))).toBe(HOME_WORK_FRAME.title);
      expect(text(byTestId('cartouche-reference', frame() ?? host()))).toBe(
        HOME_WORK_FRAME.reference,
      );
    });

    it('lists every row of the frame as a term and its value, in order', () => {
      expect(frame()).not.toBeNull();
      const rows = allByTestId('cartouche-row', frame() ?? host()).map((row) => ({
        label: text(byTestId('cartouche-label', row)),
        value: text(byTestId('cartouche-value', row)),
      }));
      expect(rows).toEqual(HOME_WORK_FRAME.rows);
    });

    it('is the only description list of the first screen', () => {
      const lists = Array.from(host().querySelectorAll('dl'));
      expect(lists).toHaveLength(1);
      expect(frame()?.contains(lists[0])).toBe(true);
    });

    it('draws a decorative dimension line hidden from assistive technologies', () => {
      const dimension = byTestId('hero-work-frame-dimension');
      expect(dimension?.getAttribute('aria-hidden')).toBe('true');
      expect(text(byTestId('dimension-line-label', dimension ?? host()))).toBe(
        HOME_WORK_FRAME.dimension,
      );
    });
  });

  describe('sticker', () => {
    const sticker = (): HTMLElement | null => byTestId('hero-sticker');

    it('is the only sticker of the first screen and reads the hero sticker label', () => {
      expect({
        stickers: host().querySelectorAll('app-sticker').length,
        tag: sticker()?.tagName,
        label: text(sticker()),
      }).toEqual({ stickers: 1, tag: 'APP-STICKER', label: HOME_HERO_STICKER_LABEL });
    });

    it('is sage and tilted to the left', () => {
      expect(
        [...(sticker()?.classList ?? [])]
          .filter((token) => /^(?:bg-sticker|text-on-sticker|-?rotate)-/.test(token))
          .sort(),
      ).toEqual(['-rotate-2', 'bg-sticker-sage', 'text-on-sticker-sage']);
    });

    it('comes after the headline in reading order, outside any heading, link or button', () => {
      const headline = byTestId('hero-headline');
      const found = sticker();

      expect({
        afterHeadline:
          headline && found
            ? headline.compareDocumentPosition(found) & Node.DOCUMENT_POSITION_FOLLOWING
            : 0,
        enclosedBy: found?.parentElement?.closest('h1, h2, h3, a, button')?.tagName ?? null,
        interactiveInside: found?.querySelectorAll('a, button, [tabindex]').length ?? null,
      }).toEqual({
        afterHeadline: Node.DOCUMENT_POSITION_FOLLOWING,
        enclosedBy: null,
        interactiveInside: 0,
      });
    });
  });
});
