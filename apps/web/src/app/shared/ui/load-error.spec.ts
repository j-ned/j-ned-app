import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { LoadError } from './load-error';
import { byTestId, pressTestId, settle, testIdText } from '@shared/testing/press-test-id';

const MESSAGE = "Les projets n'ont pas pu être chargés. Vérifiez votre connexion, puis réessayez.";

async function renderError(): Promise<{
  fixture: ComponentFixture<LoadError>;
  host: HTMLElement;
  retries: () => number;
}> {
  const fixture = TestBed.createComponent(LoadError);
  fixture.componentRef.setInput('message', MESSAGE);
  let count = 0;
  fixture.componentInstance.retry.subscribe(() => count++);
  await settle(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement, retries: () => count };
}

describe('LoadError', () => {
  it('Given a message When the error renders Then the host is an alert showing the message and a retry button', async () => {
    const { host } = await renderError();

    expect({
      role: host.getAttribute('role'),
      testId: host.getAttribute('data-testid'),
      message: testIdText(host, 'load-error-message'),
      retry: testIdText(host, 'load-error-retry'),
    }).toEqual({ role: 'alert', testId: 'load-error', message: MESSAGE, retry: 'Réessayer' });
  });

  it('Given the error When Réessayer is pressed Then retry is emitted once', async () => {
    const { fixture, retries } = await renderError();

    await pressTestId(fixture, 'load-error-retry');

    expect(retries()).toBe(1);
  });

  it('Given the error Then Réessayer is a native button', async () => {
    const { host } = await renderError();
    const retry = byTestId(host, 'load-error-retry');
    const button = retry?.tagName === 'BUTTON' ? retry : retry?.querySelector('button');

    expect({ tag: button?.tagName, type: button?.getAttribute('type') }).toEqual({
      tag: 'BUTTON',
      type: 'button',
    });
  });
});
