import type { Locator, Page, Request, Route } from '@playwright/test';
import { expect, test } from './a11y-test';

type HydratedForm = {
  readonly name: string;
  readonly path: string;
  readonly group: string;
  readonly typedLabel: string;
  readonly payloadKey: string;
  readonly endpoint: RegExp;
  readonly fillOthers: (form: Locator) => Promise<void>;
  readonly submitLabel: string;
};

const TYPED = 'Une frappe pendant le chargement ne se perd jamais';
const TYPED_BEFORE_RELEASE = TYPED.slice(0, 12);

const FORMS: readonly HydratedForm[] = [
  {
    name: 'commentaire',
    path: '/blog/article-temoin',
    group: 'Laisser un commentaire',
    typedLabel: 'Message',
    payloadKey: 'body',
    endpoint: /\/api\/blog\/posts\/article-temoin\/comments$/,
    fillOthers: async (form): Promise<void> => {
      await form.getByLabel('Nom ou pseudo').fill('Lou');
      await form.getByLabel('E-mail').fill('lou@example.test');
    },
    submitLabel: 'Envoyer',
  },
  {
    name: 'contact',
    path: '/',
    group: 'Tes coordonnées',
    typedLabel: 'Message',
    payloadKey: 'message',
    endpoint: /\/api\/contact\/messages$/,
    fillOthers: async (form): Promise<void> => {
      await form.getByLabel('Ton nom').fill('Lou');
      await form.getByLabel('Email').fill('lou@example.test');
      await form.getByLabel('Sujet').fill('Hydratation');
    },
    submitLabel: 'Envoyer le message',
  },
];

// Les scripts demandés après le chargement de la page sont ceux des blocs `@defer` : retenus.
async function holdDeferredScripts(page: Page, path: string): Promise<() => Promise<void>> {
  const held: Route[] = [];
  let holding = false;
  await page.route('**/*.js', async (route) => {
    if (!holding) {
      await route.fallback();
      return;
    }
    held.push(route);
  });
  await page.goto(path);
  holding = true;
  return async () => {
    await expect
      .poll(() => held.length, { message: 'aucun script de bloc retenu' })
      .toBeGreaterThan(0);
    holding = false;
    await Promise.all(held.splice(0).map((route) => route.fallback()));
  };
}

const runtimeErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
};

const formOf = (page: Page, group: string): Locator =>
  page.locator('form').filter({ has: page.getByRole('group', { name: group }) });

for (const spec of FORMS) {
  test.describe(`Formulaire ${spec.name} rendu par le serveur`, () => {
    test('Given the section is still hydrating, When the reader types as soon as the field accepts it, Then every keystroke reaches the field and the request without any NG0950', async ({
      page,
    }) => {
      const errors = runtimeErrors(page);
      const release = await holdDeferredScripts(page, spec.path);
      const form = formOf(page, spec.group);
      const field = form.getByLabel(spec.typedLabel);
      await field.scrollIntoViewIfNeeded();

      const typedEarly = (await field.isEditable()) ? TYPED_BEFORE_RELEASE : '';
      if (typedEarly) await field.pressSequentially(typedEarly);
      await release();
      await expect(field).toBeEditable();
      await field.pressSequentially(TYPED.slice(typedEarly.length));

      await expect(field).toHaveValue(TYPED);
      await spec.fillOthers(form);
      const sent: Promise<Request> = page.waitForRequest(
        (request) => request.method() === 'POST' && spec.endpoint.test(request.url()),
      );
      await form.getByRole('button', { name: spec.submitLabel, exact: true }).click();
      const payload: unknown = (await sent).postDataJSON();
      expect(payload).toMatchObject({ [spec.payloadKey]: TYPED });
      expect(errors.filter((error) => error.includes('NG0950'))).toEqual([]);
    });
  });
}
