import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TwoFactorDisableForm } from './two-factor-disable-form';

function render(showForm = false): ComponentFixture<TwoFactorDisableForm> {
  TestBed.configureTestingModule({ imports: [TwoFactorDisableForm] });
  const fixture = TestBed.createComponent(TwoFactorDisableForm);
  fixture.componentRef.setInput('showForm', showForm);
  fixture.detectChanges();
  return fixture;
}

describe('TwoFactorDisableForm — enabled status (showForm=false)', () => {
  it('announces that 2FA is enabled', () => {
    const fixture = render(false);
    expect(fixture.nativeElement.textContent).toContain('2FA activé');
  });

  it('does not render the password form while showForm is false', () => {
    const fixture = render(false);
    const input = fixture.nativeElement.querySelector('input[formcontrolname="password"]');
    expect(input).toBeNull();
  });

  it('emits reconfigure when the reconfigure button is clicked', () => {
    const fixture = render(false);
    let emitted = 0;
    fixture.componentInstance.reconfigure.subscribe(() => (emitted += 1));

    const button = fixture.nativeElement
      .querySelector('[data-testid="twofa-reconfigure"]')
      ?.querySelector('button') as HTMLButtonElement;
    expect(button).not.toBeNull();
    button.click();
    fixture.detectChanges();

    expect(emitted).toBe(1);
  });

  it('disables the reconfigure action while loading is true', () => {
    const fixture = render(false);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const button = fixture.nativeElement
      .querySelector('[data-testid="twofa-reconfigure"]')
      ?.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});

describe('TwoFactorDisableForm — disable form (showForm=true)', () => {
  it('password input has autocomplete=current-password and aria-required=true', () => {
    const fixture = render(true);
    const input = fixture.nativeElement.querySelector(
      'input[formcontrolname="password"]',
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.autocomplete).toBe('current-password');
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('password input exposes aria-invalid + aria-describedby and a role=alert error when touched and empty', () => {
    const fixture = render(true);
    fixture.componentInstance.disableForm.controls.password.markAsTouched();
    fixture.componentInstance.disableForm.controls.password.setValue('');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input[formcontrolname="password"]',
    ) as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('twofa-setup-disable-pw-error');

    const error = fixture.nativeElement.querySelector('#twofa-setup-disable-pw-error');
    expect(error).not.toBeNull();
    expect(error!.getAttribute('role')).toBe('alert');
    expect(error!.textContent?.trim()).toBe('Ce champ est obligatoire');
  });

  it('emits cancel when the cancel button is clicked', () => {
    const fixture = render(true);
    let emitted = 0;
    fixture.componentInstance.cancelled.subscribe(() => (emitted += 1));

    const button = fixture.nativeElement
      .querySelector('[data-testid="twofa-disable-cancel"]')
      ?.querySelector('button') as HTMLButtonElement;
    expect(button).not.toBeNull();
    button.click();
    fixture.detectChanges();

    expect(emitted).toBe(1);
  });
});

describe('TwoFactorDisableForm — feedback inputs', () => {
  it('renders the successMessage input', () => {
    const fixture = render(false);
    fixture.componentRef.setInput(
      'successMessage',
      'Authentification à deux facteurs désactivée.',
    );
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

describe('TwoFactorDisableForm — disable output', () => {
  it('does not emit disable when the form is invalid', () => {
    const fixture = render(true);
    let emitted = false;
    fixture.componentInstance.disable.subscribe(() => (emitted = true));

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(emitted).toBe(false);
  });

  it('emits disable with the typed password when the form is valid', () => {
    const fixture = render(true);
    let received: string | undefined;
    fixture.componentInstance.disable.subscribe(
      (password: string) => (received = password),
    );

    fixture.componentInstance.disableForm.controls.password.setValue('MyPass1!');
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(received).toBe('MyPass1!');
  });
});

describe('TwoFactorDisableForm — reset token', () => {
  it('resets the password form when the resetToken input changes', async () => {
    const fixture = render(true);
    fixture.componentRef.setInput('resetToken', 0);
    fixture.detectChanges();

    fixture.componentInstance.disableForm.controls.password.setValue('MyPass1!');

    fixture.componentRef.setInput('resetToken', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.disableForm.controls.password.value).toBe('');
  });
});
