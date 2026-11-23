import { describedError } from '@shared/testing/described-error';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordChangeForm, type PasswordChangeRequest } from './password-change-form';

function render(): ComponentFixture<PasswordChangeForm> {
  TestBed.configureTestingModule({ imports: [PasswordChangeForm] });
  const fixture = TestBed.createComponent(PasswordChangeForm);
  fixture.detectChanges();
  return fixture;
}

function input(
  fixture: ComponentFixture<PasswordChangeForm>,
  controlName: 'currentPassword' | 'newPassword' | 'confirmPassword',
): HTMLInputElement {
  const testIds = {
    currentPassword: 'password-current',
    newPassword: 'password-new',
    confirmPassword: 'password-confirm',
  };
  return byTestId(fixture.nativeElement, testIds[controlName]) as HTMLInputElement;
}

describe('PasswordChangeForm: a11y attributes', () => {
  it('currentPassword input has autocomplete=current-password and aria-required=true', () => {
    const fixture = render();
    const el = input(fixture, 'currentPassword');
    expect(el.autocomplete).toBe('current-password');
    expect(el.getAttribute('aria-required')).toBe('true');
  });

  it('currentPassword exposes aria-invalid + aria-describedby and a role=alert error when touched and empty', () => {
    const fixture = render();
    fixture.componentInstance.pwdForm.currentPassword().markAsTouched();
    fixture.componentInstance.pwdForm.currentPassword().value.set('');
    fixture.detectChanges();

    const el = input(fixture, 'currentPassword');
    expect(el.getAttribute('aria-invalid')).toBe('true');
    expect(el.getAttribute('aria-describedby')).toBe('twofa-setup-current-pw-error');

    const error = describedError(fixture.nativeElement, 'password-current');
    expect(error).not.toBeNull();
    expect(error!.getAttribute('role')).toBe('alert');
    expect(error!.textContent?.trim()).toBe('Champ obligatoire');
  });
});

describe('PasswordChangeForm: validation messages', () => {
  it('Given the form When it is rendered Then the stated rule gives the length the validation enforces', () => {
    const fixture = render();

    expect(testIdText(fixture.nativeElement as HTMLElement, 'password-rules')).toContain(
      'au moins 12 caractères',
    );
  });

  it('shows the minlength message when newPassword is too short', () => {
    const fixture = render();
    fixture.componentInstance.pwdForm.newPassword().markAsTouched();
    fixture.componentInstance.pwdForm.newPassword().value.set('Aa1!');
    fixture.detectChanges();

    const error = describedError(fixture.nativeElement, 'password-new');
    expect(error?.textContent).toContain('12');
    expect(error?.textContent).toContain('caractères');
  });

  it.each([
    { field: 'currentPassword', control: 'password-current' },
    { field: 'newPassword', control: 'password-new' },
  ] as const)(
    'Given an 11-character $field When the field is touched Then the 12-character minimum is shown',
    ({ field, control }) => {
      const fixture = render();
      fixture.componentInstance.pwdForm[field]().value.set('Abcdefgh1!x');
      fixture.componentInstance.pwdForm[field]().markAsTouched();
      fixture.detectChanges();

      const error = describedError(fixture.nativeElement, control);
      expect(error?.textContent?.trim()).toBe('Minimum 12 caractères requis');
    },
  );

  it('shows the pattern message when newPassword lacks complexity', () => {
    const fixture = render();
    fixture.componentInstance.pwdForm.newPassword().markAsTouched();
    fixture.componentInstance.pwdForm.newPassword().value.set('aaaaaaaaaaaa');
    fixture.detectChanges();

    const error = describedError(fixture.nativeElement, 'password-new');
    expect(error?.textContent).toContain(
      'Majuscule, minuscule, chiffre et caractère spécial requis',
    );
  });

  it('flags mismatch and shows the dedicated message when passwords differ', () => {
    const fixture = render();
    fixture.componentInstance.pwdForm.newPassword().value.set('Abcdef1!');
    fixture.componentInstance.pwdForm.confirmPassword().value.set('Abcdef2!');
    fixture.componentInstance.pwdForm.confirmPassword().markAsTouched();
    fixture.detectChanges();

    expect(
      fixture.componentInstance.pwdForm
        .confirmPassword()
        .errors()
        .some((e) => e.kind === 'mismatch'),
    ).toBe(true);
    const error = describedError(fixture.nativeElement, 'password-confirm');
    expect(error?.textContent).toContain('Les mots de passe ne correspondent pas');
  });
});

describe('PasswordChangeForm: feedback inputs', () => {
  it('renders the successMessage input', () => {
    const fixture = render();
    fixture.componentRef.setInput('successMessage', 'Mot de passe modifié avec succès !');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mot de passe modifié avec succès !');
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

describe('PasswordChangeForm: submit output', () => {
  it('does not emit submit when the form is invalid', async () => {
    const fixture = render();
    let emitted = false;
    fixture.componentInstance.submitted.subscribe(() => (emitted = true));

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(emitted).toBe(false);
  });

  it('emits submit with { currentPassword, newPassword } when the form is valid', async () => {
    const fixture = render();
    let received: PasswordChangeRequest | undefined;
    fixture.componentInstance.submitted.subscribe(
      (payload: PasswordChangeRequest) => (received = payload),
    );

    fixture.componentInstance.pwdForm.currentPassword().value.set('OldPassword1!');
    fixture.componentInstance.pwdForm.newPassword().value.set('NewPassword1!');
    fixture.componentInstance.pwdForm.confirmPassword().value.set('NewPassword1!');
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(received).toEqual({
      currentPassword: 'OldPassword1!',
      newPassword: 'NewPassword1!',
    });
  });
});

describe('PasswordChangeForm: reset token', () => {
  it('resets the form when the resetToken input changes', async () => {
    const fixture = render();
    fixture.componentRef.setInput('resetToken', 0);
    fixture.detectChanges();

    fixture.componentInstance.pwdForm.currentPassword().value.set('OldPass1!');
    fixture.componentInstance.pwdForm.newPassword().value.set('NewPass1!');
    fixture.componentInstance.pwdForm.confirmPassword().value.set('NewPass1!');

    fixture.componentRef.setInput('resetToken', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.pwdForm.currentPassword().value()).toBe('');
    expect(fixture.componentInstance.pwdForm.newPassword().value()).toBe('');
    expect(fixture.componentInstance.pwdForm.confirmPassword().value()).toBe('');
  });
});

describe('PasswordChangeForm: feedback announced', () => {
  it.each([
    { feedback: 'successMessage', role: 'status' },
    { feedback: 'errorMessage', role: 'alert' },
  ])('Given a $feedback When it renders Then it is announced as $role', ({ feedback, role }) => {
    const fixture = render();
    fixture.componentRef.setInput(feedback, 'Message reçu');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect({
      role: byTestId(host, 'status-message')?.getAttribute('role'),
      text: testIdText(host, 'status-message'),
    }).toEqual({ role, text: 'Message reçu' });
  });
});
