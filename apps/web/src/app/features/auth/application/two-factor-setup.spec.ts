import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { defer, of, throwError, type Observable } from 'rxjs';
import { TwoFactorSetup } from './two-factor-setup';
import { PasswordChangeForm } from './password-change-form';
import { TwoFactorEnableForm } from './two-factor-enable-form';
import { TwoFactorDisableForm } from './two-factor-disable-form';
import { AuthStore } from '@core/auth/auth-store';
import type { TwoFactorSecretResponse } from '@features/auth/domain/models/auth.types';

type AuthStoreMock = {
  currentUser: ReturnType<typeof signal<{ isTwoFactorEnabled: boolean } | null>>;
  changePassword: (current: string, next: string) => Observable<boolean>;
  generateTwoFactorSecret: () => Observable<TwoFactorSecretResponse>;
  enableTwoFactor: (code: string) => Observable<boolean>;
  disableTwoFactor: (password: string) => Observable<boolean>;
};

function makeAuthStore(overrides: Partial<AuthStoreMock> = {}): AuthStoreMock {
  return {
    currentUser: signal<{ isTwoFactorEnabled: boolean } | null>({
      isTwoFactorEnabled: false,
    }),
    changePassword: () => of(true),
    generateTwoFactorSecret: () =>
      of({ qrCodeDataUrl: 'data:image/png;base64,abc', secret: 'SECRETXYZ' }),
    enableTwoFactor: () => of(true),
    disableTwoFactor: () => of(true),
    ...overrides,
  };
}

async function setup(
  authStore: AuthStoreMock,
): Promise<ComponentFixture<TwoFactorSetup>> {
  await TestBed.configureTestingModule({
    imports: [TwoFactorSetup],
    providers: [{ provide: AuthStore, useValue: authStore }],
  }).compileComponents();

  const fixture = TestBed.createComponent(TwoFactorSetup);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

function passwordChild(
  fixture: ComponentFixture<TwoFactorSetup>,
): PasswordChangeForm | null {
  return (
    fixture.debugElement.query(By.directive(PasswordChangeForm))?.componentInstance ??
    null
  );
}

function enableChild(
  fixture: ComponentFixture<TwoFactorSetup>,
): TwoFactorEnableForm | null {
  return (
    fixture.debugElement.query(By.directive(TwoFactorEnableForm))?.componentInstance ??
    null
  );
}

function disableChild(
  fixture: ComponentFixture<TwoFactorSetup>,
): TwoFactorDisableForm | null {
  return (
    fixture.debugElement.query(By.directive(TwoFactorDisableForm))?.componentInstance ??
    null
  );
}

describe('TwoFactorSetup — child selection follows 2FA state', () => {
  it('renders the password change form in all states', async () => {
    const fixture = await setup(makeAuthStore());
    expect(passwordChild(fixture)).not.toBeNull();
  });

  it('renders the enable form (not the disable form) when 2FA is disabled', async () => {
    const fixture = await setup(makeAuthStore());
    expect(enableChild(fixture)).not.toBeNull();
    expect(disableChild(fixture)).toBeNull();
  });

  it('renders the disable form (not the enable form) when 2FA is enabled', async () => {
    const store = makeAuthStore();
    store.currentUser.set({ isTwoFactorEnabled: true });
    const fixture = await setup(store);

    expect(disableChild(fixture)).not.toBeNull();
    expect(enableChild(fixture)).toBeNull();
  });
});

describe('TwoFactorSetup — password change orchestration', () => {
  it('calls AuthStore.changePassword when the child submits', async () => {
    const store = makeAuthStore();
    const spy = vi.spyOn(store, 'changePassword');
    const fixture = await setup(store);

    passwordChild(fixture)!.submitted.emit({
      currentPassword: 'Old1!aaa',
      newPassword: 'New1!aaa',
    });
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith('Old1!aaa', 'New1!aaa');
  });

  it('pushes a success message to the password child on success', async () => {
    const store = makeAuthStore({ changePassword: () => of(true) });
    const fixture = await setup(store);

    passwordChild(fixture)!.submitted.emit({
      currentPassword: 'Old1!aaa',
      newPassword: 'New1!aaa',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(passwordChild(fixture)!.successMessage()).toContain('succès');
    expect(passwordChild(fixture)!.errorMessage()).toBe('');
  });

  it('pushes an error message to the password child when the command resolves false', async () => {
    const store = makeAuthStore({ changePassword: () => of(false) });
    const fixture = await setup(store);

    passwordChild(fixture)!.submitted.emit({
      currentPassword: 'Old1!aaa',
      newPassword: 'New1!aaa',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(passwordChild(fixture)!.errorMessage()).toContain('incorrect');
    expect(passwordChild(fixture)!.successMessage()).toBe('');
  });

  it('pushes an error message to the password child when the command errors', async () => {
    const store = makeAuthStore({
      changePassword: () => throwError(() => new Error('network')),
    });
    const fixture = await setup(store);

    passwordChild(fixture)!.submitted.emit({
      currentPassword: 'Old1!aaa',
      newPassword: 'New1!aaa',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(passwordChild(fixture)!.errorMessage()).toContain('Erreur');
  });
});

describe('TwoFactorSetup — 2FA enable orchestration', () => {
  it('calls AuthStore.generateTwoFactorSecret when the child emits generate', async () => {
    const store = makeAuthStore();
    const spy = vi.spyOn(store, 'generateTwoFactorSecret');
    const fixture = await setup(store);

    enableChild(fixture)!.generate.emit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('pushes the generated qrCodeUrl and secret to the enable child', async () => {
    const store = makeAuthStore({
      generateTwoFactorSecret: () =>
        of({ qrCodeDataUrl: 'data:image/png;base64,zzz', secret: 'TOTPSECRET' }),
    });
    const fixture = await setup(store);

    enableChild(fixture)!.generate.emit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(enableChild(fixture)!.qrCodeUrl()).toBe('data:image/png;base64,zzz');
    expect(enableChild(fixture)!.secret()).toBe('TOTPSECRET');
  });

  it('calls AuthStore.enableTwoFactor with the code when the child emits verify', async () => {
    const store = makeAuthStore();
    const spy = vi.spyOn(store, 'enableTwoFactor');
    const fixture = await setup(store);

    enableChild(fixture)!.generate.emit();
    fixture.detectChanges();
    await fixture.whenStable();

    enableChild(fixture)!.verify.emit('123456');
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith('123456');
  });

  it('pushes a success message to the enable child after a successful verification', async () => {
    const store = makeAuthStore({ enableTwoFactor: () => of(true) });
    const fixture = await setup(store);

    enableChild(fixture)!.generate.emit();
    fixture.detectChanges();
    await fixture.whenStable();

    enableChild(fixture)!.verify.emit('123456');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(enableChild(fixture)!.successMessage()).toContain('succès');
  });

  it('pushes an error message to the enable child when the code is invalid', async () => {
    const store = makeAuthStore({ enableTwoFactor: () => of(false) });
    const fixture = await setup(store);

    enableChild(fixture)!.generate.emit();
    fixture.detectChanges();
    await fixture.whenStable();

    enableChild(fixture)!.verify.emit('000000');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(enableChild(fixture)!.errorMessage()).toContain('invalide');
  });

  it('pushes an error message to the enable child when generation errors', async () => {
    const store = makeAuthStore({
      generateTwoFactorSecret: () => throwError(() => new Error('network')),
    });
    const fixture = await setup(store);

    enableChild(fixture)!.generate.emit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(enableChild(fixture)!.errorMessage()).toContain('Erreur');
  });
});

describe('TwoFactorSetup — 2FA disable orchestration', () => {
  it('calls AuthStore.disableTwoFactor with the password when the child emits disable', async () => {
    const store = makeAuthStore();
    store.currentUser.set({ isTwoFactorEnabled: true });
    const spy = vi.spyOn(store, 'disableTwoFactor');
    const fixture = await setup(store);

    disableChild(fixture)!.disable.emit('MyPass1!');
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith('MyPass1!');
  });

  it('pushes a success message to the disable child on success', async () => {
    const store = makeAuthStore({ disableTwoFactor: () => of(true) });
    store.currentUser.set({ isTwoFactorEnabled: true });
    const fixture = await setup(store);

    disableChild(fixture)!.disable.emit('MyPass1!');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(disableChild(fixture)!.successMessage()).toContain('désactivée');
  });

  it('pushes an error message to the disable child when the password is wrong', async () => {
    const store = makeAuthStore({ disableTwoFactor: () => of(false) });
    store.currentUser.set({ isTwoFactorEnabled: true });
    const fixture = await setup(store);

    disableChild(fixture)!.disable.emit('wrong');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(disableChild(fixture)!.errorMessage()).toContain('incorrect');
  });

  it('calls generateTwoFactorSecret when the disable child emits reconfigure', async () => {
    const store = makeAuthStore();
    store.currentUser.set({ isTwoFactorEnabled: true });
    const spy = vi.spyOn(store, 'generateTwoFactorSecret');
    const fixture = await setup(store);

    disableChild(fixture)!.reconfigure.emit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('TwoFactorSetup — deferred command keeps the child loading until resolution', () => {
  it('reflects the loading state on the password child while the command is in flight', async () => {
    const store = makeAuthStore({
      changePassword: () => defer(() => of(true)),
    });
    const fixture = await setup(store);

    passwordChild(fixture)!.submitted.emit({
      currentPassword: 'Old1!aaa',
      newPassword: 'New1!aaa',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(passwordChild(fixture)!.loading()).toBe(false);
  });
});
