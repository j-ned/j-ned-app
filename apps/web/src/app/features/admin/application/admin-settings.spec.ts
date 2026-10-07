import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminSettings } from './admin-settings';
import { AuthStore } from '@core/auth/auth-store';
import { makeUser } from '@features/auth/testing/user-builders';
import { testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';

describe('AdminSettings: en-tête de page', () => {
  it('Given a signed-in user When the page renders Then its single h1 is « Paramètres » under the account email', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: {
            currentUser: () => makeUser({ email: 'julien@example.fr' }),
          } as unknown as AuthStore,
        },
      ],
    });
    const fixture = TestBed.createComponent(AdminSettings);
    await settle(fixture);
    const host = fixture.nativeElement as HTMLElement;

    expect({
      overline: testIdText(host, 'admin-page-overline'),
      title: testIdText(host, 'admin-page-title'),
      headings: host.querySelectorAll('h1').length,
    }).toEqual({ overline: 'julien@example.fr', title: 'Paramètres', headings: 1 });
  });
});
