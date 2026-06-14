import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, type Observable } from 'rxjs';
import { Login } from './login';
import { AuthStore } from '@core/auth/auth-store';
import { ToastStore } from '@shared/ui/toast-store';

describe('Login a11y', () => {
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { login: (): Observable<string> => of('success') } },
        { provide: ToastStore, useValue: { add: (): void => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
  });

  it('email input has type=email, autocomplete=email, aria-required=true', () => {
    const email = fixture.nativeElement.querySelector('input#email') as HTMLInputElement;
    expect(email.type).toBe('email');
    expect(email.autocomplete).toBe('email');
    expect(email.getAttribute('aria-required')).toBe('true');
  });

  it('password input has autocomplete=current-password, aria-required=true', () => {
    const password = fixture.nativeElement.querySelector('input#password') as HTMLInputElement;
    expect(password.autocomplete).toBe('current-password');
    expect(password.getAttribute('aria-required')).toBe('true');
  });

  it('email shows aria-invalid + aria-describedby when touched and invalid', () => {
    fixture.componentInstance.form.controls.email.markAsTouched();
    fixture.componentInstance.form.controls.email.setValue('');
    fixture.detectChanges();

    const email = fixture.nativeElement.querySelector('input#email') as HTMLInputElement;
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toBe('login-email-error');

    const errorMsg = fixture.nativeElement.querySelector('#login-email-error');
    expect(errorMsg).not.toBeNull();
    expect(errorMsg!.getAttribute('role')).toBe('alert');
  });

  it('password shows aria-invalid + aria-describedby when touched and invalid', () => {
    fixture.componentInstance.form.controls.password.markAsTouched();
    fixture.componentInstance.form.controls.password.setValue('');
    fixture.detectChanges();

    const password = fixture.nativeElement.querySelector('input#password') as HTMLInputElement;
    expect(password.getAttribute('aria-invalid')).toBe('true');
    expect(password.getAttribute('aria-describedby')).toBe('login-password-error');

    const errorMsg = fixture.nativeElement.querySelector('#login-password-error');
    expect(errorMsg).not.toBeNull();
    expect(errorMsg!.getAttribute('role')).toBe('alert');
  });
});
