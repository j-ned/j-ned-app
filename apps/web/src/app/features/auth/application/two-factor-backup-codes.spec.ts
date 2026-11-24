import { ComponentFixture, TestBed } from '@angular/core/testing';
import { byTestId } from '@shared/testing/by-test-id';
import { asButton } from '@shared/testing/as-button';
import { TwoFactorBackupCodes } from './two-factor-backup-codes';

function render(codes: readonly string[]): ComponentFixture<TwoFactorBackupCodes> {
  TestBed.configureTestingModule({ imports: [TwoFactorBackupCodes] });
  const fixture = TestBed.createComponent(TwoFactorBackupCodes);
  fixture.componentRef.setInput('codes', codes);
  fixture.detectChanges();
  return fixture;
}

describe('TwoFactorBackupCodes', () => {
  it('Given backup codes, Then each one is listed in order', () => {
    const fixture = render(['a1b2-c3d4', 'e5f6-g7h8']);
    const host = fixture.nativeElement as HTMLElement;

    const items = [...host.querySelectorAll('[data-testid="twofa-backup-code"]')].map((item) =>
      item.textContent?.trim(),
    );

    expect(items).toEqual(['a1b2-c3d4', 'e5f6-g7h8']);
  });

  it('Given backup codes, Then they are announced with a heading', () => {
    const fixture = render(['a1b2-c3d4']);
    const host = fixture.nativeElement as HTMLElement;
    const section = host.querySelector('section');
    const heading = section?.querySelector('h2');

    expect(heading?.textContent?.trim()).toBe('Codes de secours');
    expect(section?.getAttribute('aria-labelledby')).toBe(heading?.id);
  });

  it('When the admin confirms they kept the codes, Then acknowledged is emitted', () => {
    const fixture = render(['a1b2-c3d4']);
    let emitted = 0;
    fixture.componentInstance.acknowledged.subscribe(() => (emitted += 1));

    asButton(byTestId(fixture.nativeElement as HTMLElement, 'twofa-backup-codes-done')).click();

    expect(emitted).toBe(1);
  });
});
