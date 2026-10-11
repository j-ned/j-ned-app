import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ROUTER_CONFIGURATION } from '@angular/router';
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
