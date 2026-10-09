import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MOCK_PLATFORM_LOCATION_CONFIG } from '@angular/common/testing';
import { ToastStore } from '@core/notifications/toast-store';
import { App } from './app';
import { Header } from '@layout/components/header/header';
import { Footer } from '@layout/components/footer/footer';
import { settle } from '@shared/testing/settle';
import { byTestId } from '@shared/testing/by-test-id';
import { AuthGateway } from '@features/auth/domain/gateways/auth.gateway';
import { HttpAuthGateway } from '@features/auth/infra/gateways/http-auth.gateway';
import { API_BASE_URL } from '@shared/api/api-config';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ToastStore,
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: AuthGateway, useClass: HttpAuthGateway },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});

@Component({ selector: 'app-header', template: '' })
class HeaderStub {}

@Component({ selector: 'app-footer', template: '' })
class FooterStub {}

@Component({ template: '' })
class BlankPage {}

describe('App: thème au chargement direct de /admin', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('app-dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('app-dark');
  });

  it('Given a stored dark preference When the app opens on /admin without the public header Then the page is in the dark register', async () => {
    localStorage.setItem('j-ned:theme', 'dark');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'admin', component: BlankPage }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: AuthGateway, useClass: HttpAuthGateway },
      ],
    });
    TestBed.overrideComponent(App, {
      remove: { imports: [Header, Footer] },
      add: { imports: [HeaderStub, FooterStub] },
    });
    const fixture = TestBed.createComponent(App);

    await TestBed.inject(Router).navigateByUrl('/admin');
    await settle(fixture);
    TestBed.tick();

    expect(document.documentElement.classList.contains('app-dark')).toBe(true);
  });
});

@Component({ selector: 'app-header', host: { 'data-testid': 'public-header' }, template: '' })
class PublicHeaderStub {}

describe('App: en-tête public dès le premier rendu', () => {
  it.each([
    { url: '/admin', header: false },
    { url: '/admin/projects?filter=demo', header: false },
    { url: '/administration', header: true },
    { url: '/projects', header: true },
  ])(
    'Given the page opened on $url When the app renders before any navigation has ended Then the public header is shown: $header',
    ({ url, header }) => {
      TestBed.configureTestingModule({
        providers: [
          {
            provide: MOCK_PLATFORM_LOCATION_CONFIG,
            useValue: { startUrl: `http://localhost${url}` },
          },
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: API_BASE_URL, useValue: '/api' },
          { provide: AuthGateway, useClass: HttpAuthGateway },
        ],
      });
      TestBed.overrideComponent(App, {
        remove: { imports: [Header, Footer] },
        add: { imports: [PublicHeaderStub, FooterStub] },
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      expect(byTestId(fixture.nativeElement as HTMLElement, 'public-header') !== null).toBe(header);
    },
  );
});
