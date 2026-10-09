import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Button } from '@shared/ui/button';
import type { Motivation } from '../domain/models/what-i-do.model';
import { STATIC_MOTIVATION } from '../infra/data/profile.static-data';
import { AboutMotivation } from './about-motivation';

@Component({
  imports: [Button],
  template: `<button appButton type="button">Référence</button>`,
})
class DefaultButtonHost {}

const sortedClasses = (element: Element | null | undefined): readonly string[] =>
  [...(element?.classList ?? [])].sort();

describe('AboutMotivation', () => {
  let fixture: ComponentFixture<AboutMotivation>;
  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const click = (testId: string): void =>
    host().querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`)?.click();

  const render = async (motivation: Motivation | undefined): Promise<void> => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(AboutMotivation);
    fixture.componentRef.setInput('motivation', motivation);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  afterEach(() => vi.restoreAllMocks());

  it('Given la motivation livrée When la section est rendue Then l’énoncé est affiché', async () => {
    await render(STATIC_MOTIVATION);

    expect(host().querySelector('[data-testid="motivation-statement"]')?.textContent?.trim()).toBe(
      STATIC_MOTIVATION.statement,
    );
  });

  it('Given la motivation pas encore chargée When la section est rendue Then aucune section ni bouton n’est rendu', async () => {
    await render(undefined);

    expect(host().querySelectorAll('section')).toHaveLength(0);
    expect(host().querySelector('[data-testid="about-cta-projects"]')).toBeNull();
    expect(host().querySelector('[data-testid="about-cta-contact"]')).toBeNull();
  });

  describe('Given la motivation livrée', () => {
    const contactRequested = vi.fn();

    beforeEach(async () => {
      contactRequested.mockClear();
      await render(STATIC_MOTIVATION);
      fixture.componentInstance.contactRequested.subscribe(contactRequested);
    });

    it('When la section est rendue Then « Voir les projets » est un lien vers /projects, à l’apparence du bouton principal', () => {
      const reference = TestBed.createComponent(DefaultButtonHost);
      reference.detectChanges();
      const link = host().querySelector('[data-testid="about-cta-projects"]');

      expect(link?.tagName).toBe('A');
      expect(link?.getAttribute('href')).toBe('/projects');
      expect(sortedClasses(link)).toEqual(
        sortedClasses((reference.nativeElement as HTMLElement).querySelector('button')),
      );
    });

    it('When le visiteur clique le bouton contact Then la section demande le contact une fois, sans naviguer elle-même', () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      const navigateByUrl = vi
        .spyOn(TestBed.inject(Router), 'navigateByUrl')
        .mockResolvedValue(true);

      click('about-cta-contact');

      expect(contactRequested).toHaveBeenCalledOnce();
      expect(navigate).not.toHaveBeenCalled();
      expect(navigateByUrl).not.toHaveBeenCalled();
    });
  });
});
