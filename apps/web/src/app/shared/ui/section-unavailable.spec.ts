import { TestBed } from '@angular/core/testing';
import { SectionUnavailable } from './section-unavailable';
import { settle } from '@shared/testing/settle';

describe('SectionUnavailable', () => {
  it('Given a section that failed to load When the notice renders Then it is a status saying how to get it back', async () => {
    const fixture = TestBed.createComponent(SectionUnavailable);

    await settle(fixture);
    const host = fixture.nativeElement as HTMLElement;

    expect({
      role: host.getAttribute('role'),
      testId: host.getAttribute('data-testid'),
      text: host.textContent?.replace(/[ \t\n\r]+/g, ' ').trim(),
    }).toEqual({
      role: 'status',
      testId: 'section-unavailable',
      text: "Cette section n'a pas pu être chargée. Recharge la page pour la retrouver.",
    });
  });
});
