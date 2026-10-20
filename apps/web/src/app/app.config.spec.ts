import { Component, EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ROUTER_CONFIGURATION, Router } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthStore } from '@core/auth/auth-store';
import { ProfileGateway } from '@features/profile/domain/gateways/profile.gateway';
import { HttpProfileGateway } from '@features/profile/infra/gateways/http-profile.gateway';
import { appConfig } from './app.config';

describe('appConfig: routeur', () => {
  it('Given the application config When the router options are read Then a canceled back navigation restores the history position it left', () => {
    const injector = createEnvironmentInjector(
      [...appConfig.providers],
      TestBed.inject(EnvironmentInjector),
    );

    expect(injector.get(ROUTER_CONFIGURATION).canceledNavigationResolution).toBe('computed');
    injector.destroy();
  });
});

describe('appConfig: parcours', () => {
  it('Given the application config When the profile port is resolved Then /about reads the API document', () => {
    const injector = createEnvironmentInjector(
      [...appConfig.providers],
      TestBed.inject(EnvironmentInjector),
    );

    expect(injector.get(ProfileGateway)).toBeInstanceOf(HttpProfileGateway);
    injector.destroy();
  });
});

@Component({ template: '' })
class BlankRoute {}

describe('appConfig: transitions de vue', () => {
  afterEach(() => {
    Reflect.deleteProperty(document, 'startViewTransition');
  });

  it('Given a page already rendered by the server When the router runs its initial navigation Then no view transition is started, and the next navigation starts one', async () => {
    const startViewTransition = vi.fn((update: () => unknown) => {
      void update();
      const settled = Promise.resolve();
      return {
        ready: settled,
        finished: settled,
        updateCallbackDone: settled,
        skipTransition: vi.fn(),
      };
    });
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: startViewTransition,
    });
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting(),
        {
          provide: AuthStore,
          useValue: {
            restoreSession: vi.fn(),
            ready: Promise.resolve(),
            isLoggedIn: (): boolean => true,
          },
        },
      ],
    });
    const router = TestBed.inject(Router);
    router.resetConfig([
      { path: '', component: BlankRoute },
      { path: 'next', component: BlankRoute },
    ]);

    await router.navigateByUrl('/');
    expect(startViewTransition).not.toHaveBeenCalled();

    await router.navigateByUrl('/next');
    expect(startViewTransition).toHaveBeenCalledTimes(1);
  });
});
