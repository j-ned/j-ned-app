import { TestBed } from '@angular/core/testing';
import { aTechnology, aWhatIDo } from '../testing/profile-builders';
import { AboutWhatIDo } from './about-what-i-do';

describe('AboutWhatIDo', () => {
  it('Given a summary input When the section is rendered Then its header shows that summary', async () => {
    const fixture = TestBed.createComponent(AboutWhatIDo);
    fixture.componentRef.setInput('whatIDo', [aWhatIDo()]);
    fixture.componentRef.setInput('technologies', [aTechnology()]);
    fixture.componentRef.setInput('summary', 'Résumé des activités témoin.');
    fixture.detectChanges();
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="split-section-summary"]')?.textContent?.trim()).toBe(
      'Résumé des activités témoin.',
    );
  });
});
