import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastService } from '@shared/ui';
import { App } from './app';
import { AUTH_GATEWAY } from '@features/auth/domain';
import { HttpAuthGateway } from '@features/auth/infrastructure';
import { API_BASE_URL } from '@shared/api';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ToastService,
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: AUTH_GATEWAY, useClass: HttpAuthGateway },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
