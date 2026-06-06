import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { TwoFactorVerify } from './two-factor-verify';
import { AuthStore } from '@core/auth/auth-store';

describe('TwoFactorVerify a11y', () => {
  let fixture: ComponentFixture<TwoFactorVerify>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TwoFactorVerify],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: {
            pendingChallengeToken: signal('challenge-token-test'),
            verifyTwoFactor: () => of(true),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TwoFactorVerify);
    fixture.detectChanges();
  });

  it('code input has autocomplete=one-time-code, inputmode=numeric, aria-required=true', () => {
    const code = fixture.nativeElement.querySelector(
      'input[formcontrolname="code"]',
    ) as HTMLInputElement;
    expect(code.autocomplete).toBe('one-time-code');
    expect(code.inputMode).toBe('numeric');
    expect(code.getAttribute('aria-required')).toBe('true');
  });

  it('code shows aria-invalid + aria-describedby when touched and invalid', () => {
    fixture.componentInstance.form.controls.code.markAsTouched();
    fixture.componentInstance.form.controls.code.setValue('');
    fixture.detectChanges();

    const code = fixture.nativeElement.querySelector(
      'input[formcontrolname="code"]',
    ) as HTMLInputElement;
    expect(code.getAttribute('aria-invalid')).toBe('true');
    expect(code.getAttribute('aria-describedby')).toBe('twofa-code-error');

    const errorMsg = fixture.nativeElement.querySelector('#twofa-code-error');
    expect(errorMsg).not.toBeNull();
    expect(errorMsg!.getAttribute('role')).toBe('alert');
  });
});
