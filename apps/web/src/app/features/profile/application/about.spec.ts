import { DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProfileGateway } from '../domain/gateways/profile.gateway';
import { STATIC_PROFILE_BASE } from '../infra/data/profile.static-data';
import { fakeProfileGateway } from '../testing/fake-profile-gateway';
import { About } from './about';

describe('About', () => {
  it('Given le profil livré When la page est rendue Then elle n’émet aucun main et porte la mise en page sur l’host', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ProfileGateway, useFactory: fakeProfileGateway }],
      deferBlockBehavior: DeferBlockBehavior.Manual,
    });
    const fixture = TestBed.createComponent(About);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('h1')?.textContent?.trim()).toBe(STATIC_PROFILE_BASE.displayName);
    expect(host.querySelectorAll('main')).toHaveLength(0);
    expect([...host.classList].sort()).toEqual(['block', 'min-h-svh', 'pt-20']);
  });
});
