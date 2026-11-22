import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { asButton } from '@shared/testing/as-button';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settleBounded } from '@shared/testing/settle';
import { AdminCommentReplyForm } from './admin-comment-reply-form';

type RenderedForm = {
  readonly fixture: ComponentFixture<AdminCommentReplyForm>;
  readonly host: HTMLElement;
  readonly submitted: string[];
  readonly cancelled: { count: number };
};

async function renderForm(): Promise<RenderedForm> {
  const fixture = TestBed.createComponent(AdminCommentReplyForm);
  fixture.componentRef.setInput('formId', 'reply-c-1');
  fixture.componentRef.setInput('legend', 'Répondre à Camille');
  const submitted: string[] = [];
  const cancelled = { count: 0 };
  fixture.componentInstance.submitted.subscribe((body) => submitted.push(body));
  fixture.componentInstance.cancelled.subscribe(() => (cancelled.count += 1));
  document.body.append(fixture.nativeElement as HTMLElement);
  await settleBounded(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement, submitted, cancelled };
}

const textarea = (host: HTMLElement): HTMLTextAreaElement => {
  const element = byTestId(host, 'reply-body');
  if (!(element instanceof HTMLTextAreaElement)) throw new Error('Expected the reply textarea');
  return element;
};

async function type(rendered: RenderedForm, text: string): Promise<void> {
  const field = textarea(rendered.host);
  field.value = text;
  field.dispatchEvent(new Event('input'));
  await settleBounded(rendered.fixture);
}

async function press(rendered: RenderedForm, testId: string): Promise<void> {
  asButton(byTestId(rendered.host, testId)).click();
  await settleBounded(rendered.fixture);
}

describe('AdminCommentReplyForm', () => {
  afterEach(() => document.body.replaceChildren());

  it('Given the form opens When it renders Then its group is named after the visitor and the text field has the focus', async () => {
    const rendered = await renderForm();

    expect({
      legend: testIdText(rendered.host, 'reply-legend'),
      label: rendered.host.querySelector(`label[for="${textarea(rendered.host).id}"]`) !== null,
      focused: document.activeElement === textarea(rendered.host),
    }).toEqual({ legend: 'Répondre à Camille', label: true, focused: true });
  });

  it.each([
    { name: 'an empty reply', text: '', error: 'Ta réponse est obligatoire' },
    {
      name: 'a reply of blanks',
      text: '   \n ',
      error: 'Ta réponse doit contenir au moins 2\u00a0caractères',
    },
    {
      name: 'a reply too long',
      text: 'é'.repeat(2001),
      error: 'Ta réponse ne doit pas dépasser 2\u202f000\u00a0caractères',
    },
  ])(
    'Given $name When it is sent Then nothing is emitted and the error is announced under the field, which gets the focus',
    async ({ text, error }) => {
      const rendered = await renderForm();
      await type(rendered, text);
      textarea(rendered.host).blur();

      await press(rendered, 'reply-submit');
      const field = textarea(rendered.host);
      const errorElement = byTestId(rendered.host, 'reply-body-error');

      expect({
        submitted: rendered.submitted,
        error: testIdText(rendered.host, 'reply-body-error'),
        role: errorElement?.getAttribute('role'),
        invalid: field.getAttribute('aria-invalid'),
        describedBy: field.getAttribute('aria-describedby'),
        errorId: errorElement?.id,
        focused: document.activeElement === field,
      }).toEqual({
        submitted: [],
        error,
        role: 'alert',
        invalid: 'true',
        describedBy: errorElement?.id,
        errorId: 'reply-c-1-body-error',
        focused: true,
      });
    },
  );

  it('Given a reply of 2 000 characters When it is sent Then it is emitted', async () => {
    const rendered = await renderForm();
    const text = 'é'.repeat(2000);
    await type(rendered, text);

    await press(rendered, 'reply-submit');

    expect(rendered.submitted).toEqual([text]);
  });

  it('Given a sent reply When the reset token changes Then the field is emptied and shows no error', async () => {
    const rendered = await renderForm();
    await type(rendered, 'Merci à toi');
    await press(rendered, 'reply-submit');

    rendered.fixture.componentRef.setInput('resetToken', 1);
    await settleBounded(rendered.fixture);

    expect({
      submitted: rendered.submitted,
      value: textarea(rendered.host).value,
      error: byTestId(rendered.host, 'reply-body-error'),
    }).toEqual({ submitted: ['Merci à toi'], value: '', error: null });
  });

  it('Given a reply being sent When the form renders Then only the send button is disabled and says so', async () => {
    const rendered = await renderForm();

    rendered.fixture.componentRef.setInput('sending', true);
    await settleBounded(rendered.fixture);

    expect({
      submit: asButton(byTestId(rendered.host, 'reply-submit')).disabled,
      cancel: asButton(byTestId(rendered.host, 'reply-cancel')).disabled,
      text: testIdText(rendered.host, 'reply-submit'),
    }).toEqual({ submit: true, cancel: false, text: 'Publication…' });
  });

  it('Given the form When « Annuler » is pressed Then cancellation is emitted', async () => {
    const rendered = await renderForm();

    await press(rendered, 'reply-cancel');

    expect(rendered.cancelled.count).toBe(1);
  });

  it('Given the form When Escape is pressed in the field Then cancellation is emitted', async () => {
    const rendered = await renderForm();

    textarea(rendered.host).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await settleBounded(rendered.fixture);

    expect(rendered.cancelled.count).toBe(1);
  });
});
