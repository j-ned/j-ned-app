import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TwoFactorEnableForm } from './two-factor-enable-form';

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

describe('TwoFactorEnableForm — initial state (no QR yet)', () => {
  it('does not render the code input before a QR code is provided', () => {
    const fixture = render();
    const code = fixture.nativeElement.querySelector('input[formcontrolname="code"]');
    expect(code).toBeNull();
  });

  it('emits generate (no payload) when the configure button is clicked', () => {
    const fixture = render();
    let emitted = 0;
    fixture.componentInstance.generate.subscribe(() => (emitted += 1));

    const button = fixture.nativeElement.querySelector(
      '[data-testid="twofa-generate"]',
    ) as HTMLElement;
    expect(button).not.toBeNull();
    (button.querySelector('button') ?? button).click();
    fixture.detectChanges();

    expect(emitted).toBe(1);
  });

  it('disables the configure action while loading is true', () => {
    const fixture = render();
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const button = fixture.nativeElement
      .querySelector('[data-testid="twofa-generate"]')
      ?.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});

describe('TwoFactorEnableForm — QR generated state', () => {
  it('renders the QR image with the accessible alt text and the secret', () => {
    const fixture = withQr();

    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('data:image/png;base64,abc');
    expect(img.getAttribute('alt')).toBe(
      'QR code à scanner avec votre application d\'authentification',
    );
    expect(fixture.nativeElement.textContent).toContain('SECRETXYZ');
  });

  it('code input has autocomplete=one-time-code, inputmode=numeric, aria-required=true', () => {
    const fixture = withQr();
    const code = fixture.nativeElement.querySelector(
      'input[formcontrolname="code"]',
    ) as HTMLInputElement;
    expect(code).not.toBeNull();
    expect(code.autocomplete).toBe('one-time-code');
    expect(code.inputMode).toBe('numeric');
    expect(code.getAttribute('aria-required')).toBe('true');
  });

  it('code input exposes aria-invalid + aria-describedby and a role=alert error when touched and empty', () => {
    const fixture = withQr();
    fixture.componentInstance.tfaForm.controls.code.markAsTouched();
    fixture.componentInstance.tfaForm.controls.code.setValue('');
    fixture.detectChanges();

    const code = fixture.nativeElement.querySelector(
      'input[formcontrolname="code"]',
    ) as HTMLInputElement;
    expect(code.getAttribute('aria-invalid')).toBe('true');
    expect(code.getAttribute('aria-describedby')).toBe('twofa-setup-code-error');

    const error = fixture.nativeElement.querySelector('#twofa-setup-code-error');
    expect(error).not.toBeNull();
    expect(error!.getAttribute('role')).toBe('alert');
    expect(error!.textContent?.trim()).toBe('Ce champ est obligatoire');
  });

  it('shows the pattern message when the code is not 6 digits', () => {
    const fixture = withQr();
    fixture.componentInstance.tfaForm.controls.code.markAsTouched();
    fixture.componentInstance.tfaForm.controls.code.setValue('12');
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('#twofa-setup-code-error');
    expect(error?.textContent).toContain('Le code doit contenir 6 chiffres');
  });
});

describe('TwoFactorEnableForm — feedback inputs', () => {
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
    fixture.componentRef.setInput('errorMessage', 'Code invalide. Réessayez.');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Code invalide. Réessayez.');
  });
});

describe('TwoFactorEnableForm — verify output', () => {
  it('does not emit verify when the code is invalid', () => {
    const fixture = withQr();
    let emitted = false;
    fixture.componentInstance.verify.subscribe(() => (emitted = true));

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(emitted).toBe(false);
  });

  it('emits verify with the typed code when the form is valid', () => {
    const fixture = withQr();
    let received: string | undefined;
    fixture.componentInstance.verify.subscribe((code: string) => (received = code));

    fixture.componentInstance.tfaForm.controls.code.setValue('123456');
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(received).toBe('123456');
  });
});

describe('TwoFactorEnableForm — reset token', () => {
  it('resets the code form when the resetToken input changes', async () => {
    const fixture = withQr();
    fixture.componentRef.setInput('resetToken', 0);
    fixture.detectChanges();

    fixture.componentInstance.tfaForm.controls.code.setValue('123456');

    fixture.componentRef.setInput('resetToken', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.tfaForm.controls.code.value).toBe('');
  });
});
