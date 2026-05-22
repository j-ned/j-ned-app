import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastStore } from '@shared/ui';
import { App } from './app';
import { AuthGateway } from '@features/auth/domain';
import { HttpAuthGateway } from '@features/auth/infra';
import { API_BASE_URL } from '@shared/api';

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
