import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { asButton } from '@shared/testing/as-button';
import { byTestId } from '@shared/testing/by-test-id';
import { settleBounded } from '@shared/testing/settle';
import type { CommentDraft } from '../../domain/models/comment.model';
import { makeCommentDraft } from '../../testing/comment-builders';
import { CommentForm } from './comment-form';

type Field = 'name' | 'email' | 'body';

type RenderedForm = {
  readonly fixture: ComponentFixture<CommentForm>;
  readonly host: HTMLElement;
  readonly submitted: CommentDraft[];
};

async function renderForm(idPrefix = 'comment'): Promise<RenderedForm> {
  const fixture = TestBed.createComponent(CommentForm);
  fixture.componentRef.setInput('idPrefix', idPrefix);
  fixture.componentRef.setInput('legend', 'Laisser un commentaire');
  const submitted: CommentDraft[] = [];
  fixture.componentInstance.submitted.subscribe((draft) => submitted.push(draft));
  document.body.append(fixture.nativeElement as HTMLElement);
  await settleBounded(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement, submitted };
}

function control(
  host: HTMLElement,
  field: Field | 'website',
): HTMLInputElement | HTMLTextAreaElement {
  const element = byTestId(host, `comment-${field}`);
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return element;
  throw new Error(`Expected the ${field} control`);
}

async function type(rendered: RenderedForm, field: Field, text: string): Promise<void> {
  const element = control(rendered.host, field);
  element.value = text;
  element.dispatchEvent(new Event('input'));
  element.dispatchEvent(new Event('blur'));
  await settleBounded(rendered.fixture);
}

async function fill(rendered: RenderedForm, draft: Partial<CommentDraft> = {}): Promise<void> {
  const { name, email, body } = makeCommentDraft(draft);
  await type(rendered, 'name', name);
  await type(rendered, 'email', email);
  await type(rendered, 'body', body);
}

async function send(rendered: RenderedForm): Promise<void> {
  asButton(byTestId(rendered.host, 'comment-submit')).click();
  await settleBounded(rendered.fixture);
}

const errorOf = (host: HTMLElement, field: Field): string | null =>
  host.querySelector(`#comment-${field}-error`)?.textContent?.trim() ?? null;

describe('CommentForm', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));
  afterEach(() => document.body.replaceChildren());

  it('Given the form When it renders Then its group is named, and each field has its own label and is said to be required', async () => {
    const { host } = await renderForm();
    const fields: readonly Field[] = ['name', 'email', 'body'];

    expect({
      legend: host.querySelector('fieldset > legend')?.textContent?.trim(),
      labels: fields.map(
        (field) =>
          host.querySelector(`label[for="${control(host, field).id}"]`)?.textContent?.trim() ??
          null,
      ),
      required: fields.map((field) => control(host, field).getAttribute('aria-required')),
    }).toEqual({
      legend: 'Laisser un commentaire',
      labels: ['Nom ou pseudo (requis)', 'E-mail (requis, jamais publié)', 'Message (requis)'],
      required: ['true', 'true', 'true'],
    });
  });

  it('Given an empty form When it is sent Then each field says what is missing, the first one takes the focus, and nothing is sent', async () => {
    const rendered = await renderForm();

    await send(rendered);

    expect({
      errors: (['name', 'email', 'body'] as const).map((field) => errorOf(rendered.host, field)),
      invalid: control(rendered.host, 'name').getAttribute('aria-invalid'),
      describedBy: control(rendered.host, 'name').getAttribute('aria-describedby'),
      focused: document.activeElement === control(rendered.host, 'name'),
      submitted: rendered.submitted,
    }).toEqual({
      errors: [
        'Ton nom est obligatoire.',
        'Ton adresse e-mail est obligatoire.',
        'Ton message est obligatoire.',
      ],
      invalid: 'true',
      describedBy: 'comment-name-error',
      focused: true,
      submitted: [],
    });
  });

  it.each([
    { field: 'name', text: 'a', error: 'Ton nom doit compter entre 2 et 80 caractères.' },
    {
      field: 'name',
      text: 'x'.repeat(81),
      error: 'Ton nom doit compter entre 2 et 80 caractères.',
    },
    {
      field: 'name',
      text: '\u3164\u3164',
      error: 'Ton nom doit contenir au moins un caractère visible.',
    },
    { field: 'email', text: 'pas-une-adresse', error: 'Ton adresse e-mail n’est pas valide.' },
    {
      field: 'email',
      text: `${'x'.repeat(320)}@example.test`,
      error: 'Ton adresse e-mail n’est pas valide.',
    },
    {
      field: 'body',
      text: '😀',
      error: 'Ton message doit compter entre 2 et 2\u202F000 caractères.',
    },
    {
      field: 'body',
      text: 'x'.repeat(2001),
      error: 'Ton message doit compter entre 2 et 2\u202F000 caractères.',
    },
    {
      field: 'body',
      text: '\u2800\u2800',
      error: 'Ton message doit contenir au moins un caractère visible.',
    },
    {
      field: 'name',
      text: 'Camille\u202Eellimac',
      error: 'Ton nom contient des caractères non autorisés.',
    },
    {
      field: 'name',
      text: 'Ca\u200Bmille',
      error: 'Ton nom contient des caractères non autorisés.',
    },
    {
      field: 'body',
      text: 'texte\u0000',
      error: 'Ton message contient des caractères non autorisés.',
    },
    {
      field: 'body',
      text: 'merci \uD83D',
      error: 'Ton message contient des caractères non autorisés.',
    },
  ] as const)(
    'Given the $field $text When the reader leaves the field Then it reads « $error » under it',
    async ({ field, text, error }) => {
      const rendered = await renderForm();

      await type(rendered, field, text);

      expect(errorOf(rendered.host, field)).toBe(error);
    },
  );

  it.each([
    { field: 'name', text: 'ab' },
    { field: 'name', text: 'x'.repeat(80) },
    { field: 'body', text: 'ok' },
    { field: 'body', text: '😀'.repeat(2000) },
    { field: 'body', text: '<app-root> & <img src=x>' },
    { field: 'body', text: 'ligne 1\n\tligne 2' },
    { field: 'name', text: '\u{1F469}\u200D\u{1F4BB} Camille' },
  ] as const)(
    'Given the $field at the bound of the API When the reader leaves the field Then no error shows',
    async ({ field, text }) => {
      const rendered = await renderForm();

      await type(rendered, field, text);

      expect(errorOf(rendered.host, field)).toBeNull();
    },
  );

  it('Given a valid form When it is sent Then the draft goes out with an empty trap field', async () => {
    const rendered = await renderForm();
    await fill(rendered, { name: 'Lou', email: 'lou@example.test', body: 'Bel article.' });

    await send(rendered);

    expect(rendered.submitted).toEqual([
      makeCommentDraft({ name: 'Lou', email: 'lou@example.test', body: 'Bel article.' }),
    ]);
  });

  it('Given the trap field When the form renders Then it is out of the tab order and hidden from assistive technologies', async () => {
    const { host } = await renderForm();
    const trap = control(host, 'website');

    expect({
      tabindex: trap.getAttribute('tabindex'),
      hidden: trap.closest('[aria-hidden="true"]') !== null,
      autocomplete: trap.getAttribute('autocomplete'),
    }).toEqual({ tabindex: '-1', hidden: true, autocomplete: 'off' });
  });

  it('Given a comment being sent When the reader presses send again Then nothing more goes out, and the button keeps the focus it had', async () => {
    const rendered = await renderForm();
    await fill(rendered);
    rendered.fixture.componentRef.setInput('sending', true);
    await settleBounded(rendered.fixture);
    const button = asButton(byTestId(rendered.host, 'comment-submit'));
    button.focus();

    await send(rendered);

    expect({
      submitted: rendered.submitted,
      ariaDisabled: button.getAttribute('aria-disabled'),
      disabled: button.disabled,
      focused: document.activeElement === button,
      name: control(rendered.host, 'name').disabled,
    }).toEqual({
      submitted: [],
      ariaDisabled: 'true',
      disabled: false,
      focused: true,
      name: false,
    });
  });

  it('Given a sent comment When the reset token moves Then the fields are empty again and no error shows', async () => {
    const rendered = await renderForm();
    await fill(rendered);

    rendered.fixture.componentRef.setInput('resetToken', 1);
    await settleBounded(rendered.fixture);

    expect({
      values: (['name', 'email', 'body'] as const).map(
        (field) => control(rendered.host, field).value,
      ),
      errors: (['name', 'email', 'body'] as const).map((field) => errorOf(rendered.host, field)),
    }).toEqual({ values: ['', '', ''], errors: [null, null, null] });
  });

  it('Given two forms on the page When they render Then their ids do not collide', async () => {
    const first = await renderForm('comment');
    const second = await renderForm('reply-c-1');

    expect([control(first.host, 'name').id, control(second.host, 'name').id]).toEqual([
      'comment-name',
      'reply-c-1-name',
    ]);
  });

  it('Given the privacy note When the form renders Then it links to the privacy policy', async () => {
    const { host } = await renderForm();

    expect(byTestId(host, 'comment-privacy-note')?.querySelector('a')?.getAttribute('href')).toBe(
      '/confidentialite',
    );
  });
});
