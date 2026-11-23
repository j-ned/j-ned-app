import { describedError } from '@shared/testing/described-error';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TwoFactorDisableForm } from './two-factor-disable-form';

function render(showForm = false): ComponentFixture<TwoFactorDisableForm> {
  TestBed.configureTestingModule({ imports: [TwoFactorDisableForm] });
  const fixture = TestBed.createComponent(TwoFactorDisableForm);
  fixture.componentRef.setInput('showForm', showForm);
  fixture.detectChanges();
  return fixture;
}

describe('TwoFactorDisableForm: enabled status (showForm=false)', () => {
  it('announces that 2FA is enabled', () => {
    const fixture = render(false);
    expect(fixture.nativeElement.textContent).toContain('2FA activé');
  });

  it('does not render the password form while showForm is false', () => {
    const fixture = render(false);
    const input = byTestId(fixture.nativeElement, 'twofa-disable-password');
    expect(input).toBeNull();
  });

  it('emits reconfigure when the reconfigure button is clicked', () => {
    const fixture = render(false);
    let emitted = 0;
    fixture.componentInstance.reconfigure.subscribe(() => (emitted += 1));

    const button = fixture.nativeElement.querySelector(
      '[data-testid="twofa-reconfigure"]',
    ) as HTMLButtonElement;
    expect(button).not.toBeNull();
    button.click();
    fixture.detectChanges();

    expect(emitted).toBe(1);
  });

  it('disables the reconfigure action while loading is true', () => {
    const fixture = render(false);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '[data-testid="twofa-reconfigure"]',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});

describe('TwoFactorDisableForm: disable form (showForm=true)', () => {
  it('password input has autocomplete=current-password and aria-required=true', () => {
    const fixture = render(true);
    const input = byTestId(fixture.nativeElement, 'twofa-disable-password') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.autocomplete).toBe('current-password');
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('password input exposes aria-invalid + aria-describedby and a role=alert error when touched and empty', () => {
    const fixture = render(true);
    fixture.componentInstance.disableForm.password().markAsTouched();
    fixture.componentInstance.disableForm.password().value.set('');
    fixture.detectChanges();

    const input = byTestId(fixture.nativeElement, 'twofa-disable-password') as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('twofa-setup-disable-pw-error');

    const error = describedError(fixture.nativeElement, 'twofa-disable-password');
    expect(error).not.toBeNull();
    expect(error!.getAttribute('role')).toBe('alert');
    expect(error!.textContent?.trim()).toBe('Ce champ est obligatoire');
  });

  it.each([
    { length: 11, error: 'Le mot de passe doit contenir au moins 12 caractères' },
    { length: 12, error: null },
  ])(
    'Given a $length-character password When the field is touched Then the error is $error',
    ({ length, error }) => {
      const fixture = render(true);
      fixture.componentInstance.disableForm.password().value.set('a'.repeat(length));
      fixture.componentInstance.disableForm.password().markAsTouched();
      fixture.detectChanges();

      const message = describedError(fixture.nativeElement, 'twofa-disable-password');
      expect(message?.textContent?.trim() ?? null).toBe(error);
    },
  );

  it('emits cancel when the cancel button is clicked', () => {
    const fixture = render(true);
    let emitted = 0;
    fixture.componentInstance.cancelled.subscribe(() => (emitted += 1));

    const button = fixture.nativeElement.querySelector(
      '[data-testid="twofa-disable-cancel"]',
    ) as HTMLButtonElement;
    expect(button).not.toBeNull();
    button.click();
    fixture.detectChanges();

    expect(emitted).toBe(1);
  });
});

describe('TwoFactorDisableForm: feedback inputs', () => {
  it('renders the successMessage input', () => {
    const fixture = render(false);
    fixture.componentRef.setInput('successMessage', 'Authentification à deux facteurs désactivée.');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Authentification à deux facteurs désactivée.',
    );
  });

  it('renders the errorMessage input', () => {
    const fixture = render(true);
    fixture.componentRef.setInput('errorMessage', 'Mot de passe incorrect.');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mot de passe incorrect.');
  });
});

describe('TwoFactorDisableForm: disable output', () => {
  it('does not emit disable when the form is invalid', async () => {
    const fixture = render(true);
    let emitted = false;
    fixture.componentInstance.disable.subscribe(() => (emitted = true));

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(emitted).toBe(false);
  });

  it('emits disable with the typed password when the form is valid', async () => {
    const fixture = render(true);
    let received: string | undefined;
    fixture.componentInstance.disable.subscribe((password: string) => (received = password));

    fixture.componentInstance.disableForm.password().value.set('MyPassword1!');
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(received).toBe('MyPassword1!');
  });
});

describe('TwoFactorDisableForm: reset token', () => {
  it('resets the password form when the resetToken input changes', async () => {
    const fixture = render(true);
    fixture.componentRef.setInput('resetToken', 0);
    fixture.detectChanges();

    fixture.componentInstance.disableForm.password().value.set('MyPass1!');

    fixture.componentRef.setInput('resetToken', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.disableForm.password().value()).toBe('');
  });
});

describe('TwoFactorDisableForm: feedback announced', () => {
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
