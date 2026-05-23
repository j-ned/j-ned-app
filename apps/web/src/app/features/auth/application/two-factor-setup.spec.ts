import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, type Observable } from 'rxjs';
import { TwoFactorSetup } from './two-factor-setup';
import { AuthStore } from '../infra';

type AuthStoreMock = {
  currentUser: ReturnType<typeof signal<{ isTwoFactorEnabled: boolean } | null>>;
  changePassword: () => Observable<boolean>;
  generateTwoFactorSecret: () => Observable<{ qrCodeDataUrl: string; secret: string }>;
  enableTwoFactor: () => Observable<boolean>;
  disableTwoFactor: () => Observable<boolean>;
};

function makeAuthStore(initialEnabled = false): AuthStoreMock {
  return {
    currentUser: signal<{ isTwoFactorEnabled: boolean } | null>({
      isTwoFactorEnabled: initialEnabled,
    }),
    changePassword: () => of(true),
    generateTwoFactorSecret: () => of({ qrCodeDataUrl: 'data:image/png;base64,abc', secret: 'SECRETXYZ' }),
    enableTwoFactor: () => of(true),
    disableTwoFactor: () => of(true),
  };
}

async function setup(authStore: AuthStoreMock): Promise<ComponentFixture<TwoFactorSetup>> {
  await TestBed.configureTestingModule({
    imports: [TwoFactorSetup],
    providers: [{ provide: AuthStore, useValue: authStore }],
  }).compileComponents();

  const fixture = TestBed.createComponent(TwoFactorSetup);
  fixture.detectChanges();
  return fixture;
}

describe('TwoFactorSetup a11y — change password form', () => {
  let fixture: ComponentFixture<TwoFactorSetup>;

  beforeEach(async () => {
    fixture = await setup(makeAuthStore(false));
  });

  it('currentPassword input has autocomplete=current-password, aria-required=true', () => {
    const input = fixture.nativeElement.querySelector(
      'input[formcontrolname="currentPassword"]',
    ) as HTMLInputElement;
    expect(input.autocomplete).toBe('current-password');
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('newPassword input has autocomplete=new-password, aria-required=true', () => {
    const input = fixture.nativeElement.querySelector(
      'input[formcontrolname="newPassword"]',
    ) as HTMLInputElement;
    expect(input.autocomplete).toBe('new-password');
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('confirmPassword input has autocomplete=new-password, aria-required=true', () => {
    const input = fixture.nativeElement.querySelector(
      'input[formcontrolname="confirmPassword"]',
    ) as HTMLInputElement;
    expect(input.autocomplete).toBe('new-password');
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('currentPassword shows aria-invalid + aria-describedby when touched and invalid', () => {
    fixture.componentInstance.pwdForm.controls.currentPassword.markAsTouched();
    fixture.componentInstance.pwdForm.controls.currentPassword.setValue('');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input[formcontrolname="currentPassword"]',
    ) as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('twofa-setup-current-pw-error');

    const errorMsg = fixture.nativeElement.querySelector('#twofa-setup-current-pw-error');
    expect(errorMsg).not.toBeNull();
    expect(errorMsg!.getAttribute('role')).toBe('alert');
  });

  it('newPassword shows aria-invalid + aria-describedby when touched and invalid', () => {
    fixture.componentInstance.pwdForm.controls.newPassword.markAsTouched();
    fixture.componentInstance.pwdForm.controls.newPassword.setValue('');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input[formcontrolname="newPassword"]',
    ) as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('twofa-setup-new-pw-error');

    const errorMsg = fixture.nativeElement.querySelector('#twofa-setup-new-pw-error');
    expect(errorMsg).not.toBeNull();
    expect(errorMsg!.getAttribute('role')).toBe('alert');
  });

  it('confirmPassword shows aria-invalid + aria-describedby when touched and invalid', () => {
    fixture.componentInstance.pwdForm.controls.confirmPassword.markAsTouched();
    fixture.componentInstance.pwdForm.controls.confirmPassword.setValue('');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input[formcontrolname="confirmPassword"]',
    ) as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('twofa-setup-confirm-pw-error');

    const errorMsg = fixture.nativeElement.querySelector('#twofa-setup-confirm-pw-error');
    expect(errorMsg).not.toBeNull();
    expect(errorMsg!.getAttribute('role')).toBe('alert');
  });
});

describe('TwoFactorSetup a11y — TOTP code form (after generating QR)', () => {
  let fixture: ComponentFixture<TwoFactorSetup>;

  beforeEach(async () => {
    fixture = await setup(makeAuthStore(false));
    // Drive component into the "QR generated" state by calling generate()
    fixture.componentInstance.generate();
    fixture.detectChanges();
  });

  it('code input has autocomplete=one-time-code, inputmode=numeric, aria-required=true', () => {
    const code = fixture.nativeElement.querySelector(
      'input[formcontrolname="code"]',
    ) as HTMLInputElement;
    expect(code).not.toBeNull();
    expect(code.autocomplete).toBe('one-time-code');
    expect(code.inputMode).toBe('numeric');
    expect(code.getAttribute('aria-required')).toBe('true');
  });

  it('code shows aria-invalid + aria-describedby when touched and invalid', () => {
    fixture.componentInstance.tfaForm.controls.code.markAsTouched();
    fixture.componentInstance.tfaForm.controls.code.setValue('');
    fixture.detectChanges();

    const code = fixture.nativeElement.querySelector(
      'input[formcontrolname="code"]',
    ) as HTMLInputElement;
    expect(code.getAttribute('aria-invalid')).toBe('true');
    expect(code.getAttribute('aria-describedby')).toBe('twofa-setup-code-error');

    const errorMsg = fixture.nativeElement.querySelector('#twofa-setup-code-error');
    expect(errorMsg).not.toBeNull();
    expect(errorMsg!.getAttribute('role')).toBe('alert');
  });
});

describe('TwoFactorSetup a11y — disable password form (2FA already enabled)', () => {
  let fixture: ComponentFixture<TwoFactorSetup>;

  beforeEach(async () => {
    fixture = await setup(makeAuthStore(true));
    // Reveal the disable form
    fixture.componentInstance.showDisableForm.set(true);
    fixture.detectChanges();
  });

  it('disable password input has autocomplete=current-password, aria-required=true', () => {
    const input = fixture.nativeElement.querySelector(
      'input[formcontrolname="password"]',
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.autocomplete).toBe('current-password');
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('disable password shows aria-invalid + aria-describedby when touched and invalid', () => {
    fixture.componentInstance.disableForm.controls.password.markAsTouched();
    fixture.componentInstance.disableForm.controls.password.setValue('');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input[formcontrolname="password"]',
    ) as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('twofa-setup-disable-pw-error');

    const errorMsg = fixture.nativeElement.querySelector('#twofa-setup-disable-pw-error');
    expect(errorMsg).not.toBeNull();
    expect(errorMsg!.getAttribute('role')).toBe('alert');
  });
});
