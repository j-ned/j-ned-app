import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  PasswordChangeForm,
  type PasswordChangeRequest,
} from './password-change-form';

function render(): ComponentFixture<PasswordChangeForm> {
  TestBed.configureTestingModule({ imports: [PasswordChangeForm] });
  const fixture = TestBed.createComponent(PasswordChangeForm);
  fixture.detectChanges();
  return fixture;
}

function input(
  fixture: ComponentFixture<PasswordChangeForm>,
  controlName: string,
): HTMLInputElement {
  return fixture.nativeElement.querySelector(
    `input[formcontrolname="${controlName}"]`,
  ) as HTMLInputElement;
}

describe('PasswordChangeForm — a11y attributes', () => {
  it('currentPassword input has autocomplete=current-password and aria-required=true', () => {
    const fixture = render();
    const el = input(fixture, 'currentPassword');
    expect(el.autocomplete).toBe('current-password');
    expect(el.getAttribute('aria-required')).toBe('true');
  });

  it('newPassword input has autocomplete=new-password and aria-required=true', () => {
    const fixture = render();
    const el = input(fixture, 'newPassword');
    expect(el.autocomplete).toBe('new-password');
    expect(el.getAttribute('aria-required')).toBe('true');
  });

  it('confirmPassword input has autocomplete=new-password and aria-required=true', () => {
    const fixture = render();
    const el = input(fixture, 'confirmPassword');
    expect(el.autocomplete).toBe('new-password');
    expect(el.getAttribute('aria-required')).toBe('true');
  });

  it('currentPassword exposes aria-invalid + aria-describedby and a role=alert error when touched and empty', () => {
    const fixture = render();
    fixture.componentInstance.pwdForm.controls.currentPassword.markAsTouched();
    fixture.componentInstance.pwdForm.controls.currentPassword.setValue('');
    fixture.detectChanges();

    const el = input(fixture, 'currentPassword');
    expect(el.getAttribute('aria-invalid')).toBe('true');
    expect(el.getAttribute('aria-describedby')).toBe('twofa-setup-current-pw-error');

    const error = fixture.nativeElement.querySelector('#twofa-setup-current-pw-error');
    expect(error).not.toBeNull();
    expect(error!.getAttribute('role')).toBe('alert');
    expect(error!.textContent?.trim()).toBe('Champ obligatoire');
  });

  it('newPassword exposes aria-invalid + aria-describedby and a role=alert error when touched and empty', () => {
    const fixture = render();
    fixture.componentInstance.pwdForm.controls.newPassword.markAsTouched();
    fixture.componentInstance.pwdForm.controls.newPassword.setValue('');
    fixture.detectChanges();

    const el = input(fixture, 'newPassword');
    expect(el.getAttribute('aria-invalid')).toBe('true');
    expect(el.getAttribute('aria-describedby')).toBe('twofa-setup-new-pw-error');

    const error = fixture.nativeElement.querySelector('#twofa-setup-new-pw-error');
    expect(error).not.toBeNull();
    expect(error!.getAttribute('role')).toBe('alert');
  });

  it('confirmPassword exposes aria-invalid + aria-describedby and a role=alert error when touched and empty', () => {
    const fixture = render();
    fixture.componentInstance.pwdForm.controls.confirmPassword.markAsTouched();
    fixture.componentInstance.pwdForm.controls.confirmPassword.setValue('');
    fixture.detectChanges();

    const el = input(fixture, 'confirmPassword');
    expect(el.getAttribute('aria-invalid')).toBe('true');
    expect(el.getAttribute('aria-describedby')).toBe('twofa-setup-confirm-pw-error');

    const error = fixture.nativeElement.querySelector('#twofa-setup-confirm-pw-error');
    expect(error).not.toBeNull();
    expect(error!.getAttribute('role')).toBe('alert');
  });
});

describe('PasswordChangeForm — validation messages', () => {
  it('shows the minlength message when newPassword is too short', () => {
    const fixture = render();
    fixture.componentInstance.pwdForm.controls.newPassword.markAsTouched();
    fixture.componentInstance.pwdForm.controls.newPassword.setValue('Aa1!');
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('#twofa-setup-new-pw-error');
    expect(error?.textContent).toContain('8');
    expect(error?.textContent).toContain('caractères');
  });

  it('shows the pattern message when newPassword lacks complexity', () => {
    const fixture = render();
    fixture.componentInstance.pwdForm.controls.newPassword.markAsTouched();
    fixture.componentInstance.pwdForm.controls.newPassword.setValue('aaaaaaaa');
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('#twofa-setup-new-pw-error');
    expect(error?.textContent).toContain(
      'Majuscule, minuscule, chiffre et caractère spécial requis',
    );
  });

  it('flags mismatch and shows the dedicated message when passwords differ', () => {
    const fixture = render();
    fixture.componentInstance.pwdForm.controls.newPassword.setValue('Abcdef1!');
    fixture.componentInstance.pwdForm.controls.confirmPassword.setValue('Abcdef2!');
    fixture.componentInstance.pwdForm.controls.confirmPassword.markAsTouched();
    fixture.detectChanges();

    expect(fixture.componentInstance.pwdForm.hasError('mismatch')).toBe(true);
    const error = fixture.nativeElement.querySelector('#twofa-setup-confirm-pw-error');
    expect(error?.textContent).toContain('Les mots de passe ne correspondent pas');
  });
});

describe('PasswordChangeForm — feedback inputs', () => {
  it('renders the successMessage input', () => {
    const fixture = render();
    fixture.componentRef.setInput('successMessage', 'Mot de passe modifié avec succès !');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Mot de passe modifié avec succès !',
    );
  });

  it('renders the errorMessage input', () => {
    const fixture = render();
    fixture.componentRef.setInput('errorMessage', 'Mot de passe actuel incorrect');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mot de passe actuel incorrect');
  });

  it('disables the submit button while loading is true', () => {
    const fixture = render();
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const submit = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });
});

describe('PasswordChangeForm — submit output', () => {
  it('does not emit submit when the form is invalid', () => {
    const fixture = render();
    let emitted = false;
    fixture.componentInstance.submitted.subscribe(() => (emitted = true));

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(emitted).toBe(false);
  });

  it('emits submit with { currentPassword, newPassword } when the form is valid', () => {
    const fixture = render();
    let received: PasswordChangeRequest | undefined;
    fixture.componentInstance.submitted.subscribe(
      (payload: PasswordChangeRequest) => (received = payload),
    );

    fixture.componentInstance.pwdForm.controls.currentPassword.setValue('OldPass1!');
    fixture.componentInstance.pwdForm.controls.newPassword.setValue('NewPass1!');
    fixture.componentInstance.pwdForm.controls.confirmPassword.setValue('NewPass1!');
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(received).toEqual({ currentPassword: 'OldPass1!', newPassword: 'NewPass1!' });
  });
});

describe('PasswordChangeForm — reset token', () => {
  it('resets the form when the resetToken input changes', async () => {
    const fixture = render();
    fixture.componentRef.setInput('resetToken', 0);
    fixture.detectChanges();

    fixture.componentInstance.pwdForm.controls.currentPassword.setValue('OldPass1!');
    fixture.componentInstance.pwdForm.controls.newPassword.setValue('NewPass1!');
    fixture.componentInstance.pwdForm.controls.confirmPassword.setValue('NewPass1!');

    fixture.componentRef.setInput('resetToken', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.pwdForm.controls.currentPassword.value).toBe('');
    expect(fixture.componentInstance.pwdForm.controls.newPassword.value).toBe('');
    expect(fixture.componentInstance.pwdForm.controls.confirmPassword.value).toBe('');
  });
});
