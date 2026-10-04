import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DeferBlockBehavior, TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { CvGateway } from '@features/cv/domain/gateways/cv.gateway';
import { HttpCvGateway } from '@features/cv/infra/gateways/http-cv.gateway';
import { API_BASE_URL } from '@shared/api/api-config';
import { ProfileGateway } from '../domain/gateways/profile.gateway';
import { STATIC_PROFILE_BASE } from '../infra/data/profile.static-data';
import { fakeProfileGateway } from '../testing/fake-profile-gateway';
import { About } from './about';

const API = '/api';

describe('About', () => {
  let http: HttpTestingController;

  const render = async (): Promise<ComponentFixture<About>> => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API },
        { provide: CvGateway, useClass: HttpCvGateway },
        {
          provide: AnalyticsGateway,
          useValue: { trackCvDownload: vi.fn() } as unknown as AnalyticsGateway,
        },
        { provide: ProfileGateway, useFactory: fakeProfileGateway },
      ],
      deferBlockBehavior: DeferBlockBehavior.Manual,
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(About);
    fixture.detectChanges();
    await fixture.whenStable();
    http.match(`${API}/cv`).forEach((request) => request.flush(null));
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  afterEach(() => http.verify());

  it('Given le profil livré When la page est rendue Then elle n’émet aucun main et porte la mise en page sur l’host', async () => {
    const fixture = await render();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('h1')?.textContent?.trim()).toBe(STATIC_PROFILE_BASE.displayName);
    expect(host.querySelectorAll('main')).toHaveLength(0);
    expect([...host.classList].sort()).toEqual(['block', 'min-h-svh', 'pt-20']);
  });

  it('Given les sections différées non déclenchées When la page est rendue Then le bloc recrutement est déjà présent sous un h1 unique', async () => {
    const fixture = await render();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="about-hiring"]')?.id).toBe('recrutement');
    expect(host.querySelectorAll('h1')).toHaveLength(1);
  });
});
