import { describedError } from '@shared/testing/described-error';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TwoFactorEnableForm } from './two-factor-enable-form';
import { asButton } from '@shared/testing/as-button';

function render(): ComponentFixture<TwoFactorEnableForm> {
  TestBed.configureTestingModule({ imports: [TwoFactorEnableForm] });
  const fixture = TestBed.createComponent(TwoFactorEnableForm);
  fixture.detectChanges();
  return fixture;
}

function withQr(): ComponentFixture<TwoFactorEnableForm> {
  const fixture = render();
  fixture.componentRef.setInput('qrCodeUrl', 'data:image/png;base64,abc');
  fixture.componentRef.setInput('secret', 'SECRETXYZ');
  fixture.detectChanges();
  return fixture;
}

describe('TwoFactorEnableForm: initial state (no QR yet)', () => {
  it('does not render the code input before a QR code is provided', () => {
    const fixture = render();
    const code = byTestId(fixture.nativeElement, 'twofa-setup-code');
    expect(code).toBeNull();
  });

  it('emits generate (no payload) when the configure button is clicked', () => {
    const fixture = render();
    let emitted = 0;
    fixture.componentInstance.generate.subscribe(() => (emitted += 1));

    asButton(byTestId(fixture.nativeElement as HTMLElement, 'twofa-generate')).click();
    fixture.detectChanges();

    expect(emitted).toBe(1);
  });

  it('disables the configure action while loading is true', () => {
    const fixture = render();
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const button = asButton(byTestId(fixture.nativeElement as HTMLElement, 'twofa-generate'));
    expect(button.disabled).toBe(true);
  });
});

describe('TwoFactorEnableForm: QR generated state', () => {
  it('renders the QR image with the accessible alt text and the secret', () => {
    const fixture = withQr();

    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('data:image/png;base64,abc');
    expect(img.getAttribute('alt')).toBe(
      "QR code à scanner avec ton application d'authentification",
    );
    expect(fixture.nativeElement.textContent).toContain('SECRETXYZ');
  });

  it('code input has autocomplete=one-time-code, inputmode=numeric, aria-required=true', () => {
    const fixture = withQr();
    const code = byTestId(fixture.nativeElement, 'twofa-setup-code') as HTMLInputElement;
    expect(code).not.toBeNull();
    expect(code.autocomplete).toBe('one-time-code');
    expect(code.inputMode).toBe('numeric');
    expect(code.getAttribute('aria-required')).toBe('true');
  });

  it('code input exposes aria-invalid + aria-describedby and a role=alert error when touched and empty', () => {
    const fixture = withQr();
    fixture.componentInstance.tfaForm.code().markAsTouched();
    fixture.componentInstance.tfaForm.code().value.set('');
    fixture.detectChanges();

    const code = byTestId(fixture.nativeElement, 'twofa-setup-code') as HTMLInputElement;
    expect(code.getAttribute('aria-invalid')).toBe('true');
    expect(code.getAttribute('aria-describedby')).toBe('twofa-setup-code-error');

    const error = describedError(fixture.nativeElement, 'twofa-setup-code');
    expect(error).not.toBeNull();
    expect(error!.getAttribute('role')).toBe('alert');
    expect(error!.textContent?.trim()).toBe('Ce champ est obligatoire');
  });

  it('shows the pattern message when the code is not 6 digits', () => {
    const fixture = withQr();
    fixture.componentInstance.tfaForm.code().markAsTouched();
    fixture.componentInstance.tfaForm.code().value.set('12');
    fixture.detectChanges();

    const error = describedError(fixture.nativeElement, 'twofa-setup-code');
    expect(error?.textContent).toContain('Le code doit contenir 6 chiffres');
  });
});

describe('TwoFactorEnableForm: feedback inputs', () => {
  it('renders the successMessage input', () => {
    const fixture = render();
    fixture.componentRef.setInput(
      'successMessage',
      'Authentification à deux facteurs activée avec succès !',
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Authentification à deux facteurs activée avec succès !',
    );
  });

  it('renders the errorMessage input', () => {
    const fixture = render();
    fixture.componentRef.setInput('errorMessage', 'Code invalide. Réessaie.');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Code invalide. Réessaie.');
  });
});

describe('TwoFactorEnableForm: verify output', () => {
  it('does not emit verify when the code is invalid', async () => {
    const fixture = withQr();
    let emitted = false;
    fixture.componentInstance.verify.subscribe(() => (emitted = true));

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(emitted).toBe(false);
  });

  it('emits verify with the typed code when the form is valid', async () => {
    const fixture = withQr();
    let received: string | undefined;
    fixture.componentInstance.verify.subscribe((code: string) => (received = code));

    fixture.componentInstance.tfaForm.code().value.set('123456');
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(received).toBe('123456');
  });
});

describe('TwoFactorEnableForm: reset token', () => {
  it('resets the code form when the resetToken input changes', async () => {
    const fixture = withQr();
    fixture.componentRef.setInput('resetToken', 0);
    fixture.detectChanges();

    fixture.componentInstance.tfaForm.code().value.set('123456');

    fixture.componentRef.setInput('resetToken', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.tfaForm.code().value()).toBe('');
  });
});

describe('TwoFactorEnableForm: feedback announced', () => {
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
