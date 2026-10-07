import { outputBinding } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of, throwError, type Observable } from 'rxjs';
import type { Mock } from 'vitest';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import type { ContentImage } from '@features/blog/domain/models/content-image.model';
import { makeContentImage } from '@features/blog/testing/blog-post-builders';
import { stubBlogGateway } from '@features/blog/testing/stub-blog-gateway';
import { accessibleName } from '@shared/testing/accessible-name';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settleBounded } from '@shared/testing/settle';
import {
  BODY_IMAGE_FILE,
  imagePanel,
  imagePanelAlt,
  pickImageFile,
  pressImagePanel,
  pressKeyInImageAlt,
  typeImageAlt,
} from '../testing/content-image-panel-page';
import { AdminContentImageUpload } from './admin-content-image-upload';

type Upload = Mock<(file: File) => Observable<ContentImage>>;

type RenderedPanel = {
  readonly fixture: ComponentFixture<AdminContentImageUpload>;
  readonly root: HTMLElement;
  readonly upload: Upload;
  readonly inserted: { readonly alt: string; readonly url: string }[];
  readonly cancelled: number[];
};

const IMAGE = makeContentImage();

async function renderPanel(upload: Upload = vi.fn(() => of(IMAGE))): Promise<RenderedPanel> {
  TestBed.configureTestingModule({
    providers: [
      { provide: BlogGateway, useValue: stubBlogGateway({ uploadContentImage: upload }) },
    ],
  });
  const inserted: { readonly alt: string; readonly url: string }[] = [];
  const cancelled: number[] = [];
  const fixture = TestBed.createComponent(AdminContentImageUpload, {
    bindings: [
      outputBinding<{ readonly alt: string; readonly url: string }>('inserted', (image) =>
        inserted.push(image),
      ),
      outputBinding('cancelled', () => cancelled.push(1)),
    ],
  });
  await settleBounded(fixture);
  const host = fixture.nativeElement as HTMLElement;
  return { fixture, root: host.parentElement ?? host, upload, inserted, cancelled };
}

const httpError = (status: number): HttpErrorResponse =>
  new HttpErrorResponse({ status, statusText: 'Refused' });

const alert = (root: HTMLElement, testId: string): { role: string | null; text: string } | null => {
  const element = byTestId(root, testId);
  return element ? { role: element.getAttribute('role'), text: testIdText(root, testId) } : null;
};

const submitButton = (root: HTMLElement): HTMLButtonElement | null => {
  const element = byTestId(root, 'markdown-image-submit');
  return element instanceof HTMLButtonElement ? element : null;
};

const availability = (
  root: HTMLElement,
): { readonly ariaDisabled: string | null; readonly disabled: boolean } | null => {
  const button = submitButton(root);
  return button
    ? {
        ariaDisabled: button.getAttribute('aria-disabled'),
        disabled: button.hasAttribute('disabled'),
      }
    : null;
};

const fileShown = (root: HTMLElement): boolean =>
  Boolean(imagePanel(root)?.querySelector('[data-testid="file-dropzone-clear"]'));

describe('AdminContentImageUpload: structure', () => {
  it('Given the panel When it renders Then it is a named group of the article form, without a form of its own, with plain buttons', async () => {
    const { root } = await renderPanel();
    const panel = imagePanel(root);
    const alt = imagePanelAlt(root);
    const label = alt?.id ? root.querySelector(`label[for="${alt.id}"]`) : null;

    expect({
      role: panel?.getAttribute('role'),
      name: panel ? accessibleName(panel, root) : null,
      forms: panel?.querySelectorAll('form').length,
      altLabel: label?.textContent?.replace(/\s+/g, ' ').trim(),
      altRequired: alt?.getAttribute('aria-required'),
      accept: panel?.querySelector('input[type="file"]')?.getAttribute('accept'),
      submit: {
        type: byTestId(root, 'markdown-image-submit')?.getAttribute('type'),
        text: testIdText(root, 'markdown-image-submit'),
      },
      cancel: {
        type: byTestId(root, 'markdown-image-cancel')?.getAttribute('type'),
        text: testIdText(root, 'markdown-image-cancel'),
      },
    }).toEqual({
      role: 'group',
      name: 'Insérer une image',
      forms: 0,
      altLabel: 'Texte alternatif',
      altRequired: 'true',
      accept: 'image/avif,image/webp,image/png,image/jpeg',
      submit: { type: 'button', text: "Insérer l'image" },
      cancel: { type: 'button', text: 'Annuler' },
    });
  });
});

describe('AdminContentImageUpload: champs obligatoires', () => {
  it('Given nothing chosen When « Insérer l’image » is pressed Then both fields say what is missing and nothing is sent', async () => {
    const rendered = await renderPanel();

    await pressImagePanel(rendered.fixture, 'markdown-image-submit');

    expect({
      file: alert(rendered.root, 'markdown-image-file-error'),
      alt: alert(rendered.root, 'markdown-image-alt-error'),
      uploads: rendered.upload.mock.calls.length,
      inserted: rendered.inserted,
    }).toEqual({
      file: { role: 'alert', text: 'Choisissez une image' },
      alt: { role: 'alert', text: 'Ce champ est obligatoire' },
      uploads: 0,
      inserted: [],
    });
  });

  it.each([
    {
      case: 'a file only',
      file: true,
      alt: '',
      fileError: null,
      altError: 'Ce champ est obligatoire',
    },
    {
      case: 'blank alt text',
      file: true,
      alt: '   ',
      fileError: null,
      altError: 'Ce champ est obligatoire',
    },
    {
      case: 'an alt text only',
      file: false,
      alt: 'Schéma',
      fileError: 'Choisissez une image',
      altError: null,
    },
    {
      case: 'an alt text over 300 characters',
      file: true,
      alt: 'x'.repeat(301),
      fileError: null,
      altError: '300 caractères au plus',
    },
  ])(
    'Given $case When « Insérer l’image » is pressed Then only the missing field speaks and nothing is sent',
    async ({ file, alt, fileError, altError }) => {
      const rendered = await renderPanel();
      if (file) await pickImageFile(rendered.fixture);
      await typeImageAlt(rendered.fixture, alt);

      await pressImagePanel(rendered.fixture, 'markdown-image-submit');

      expect({
        file: alert(rendered.root, 'markdown-image-file-error')?.text ?? null,
        alt: alert(rendered.root, 'markdown-image-alt-error')?.text ?? null,
        uploads: rendered.upload.mock.calls.length,
      }).toEqual({ file: fileError, alt: altError, uploads: 0 });
    },
  );
});

describe('AdminContentImageUpload: champ du texte alternatif en erreur', () => {
  it('Given an empty alt text When « Insérer l’image » is pressed Then the field is marked invalid and described by its error message', async () => {
    const rendered = await renderPanel();
    await pickImageFile(rendered.fixture);
    const before = imagePanelAlt(rendered.root)?.getAttribute('aria-invalid') ?? null;

    await pressImagePanel(rendered.fixture, 'markdown-image-submit');
    const alt = imagePanelAlt(rendered.root);
    const error = byTestId(rendered.root, 'markdown-image-alt-error');
    const describedBy = (alt?.getAttribute('aria-describedby') ?? '').split(/\s+/);

    expect({
      invalidBefore: before === 'true',
      invalid: alt?.getAttribute('aria-invalid'),
      errorHasId: Boolean(error?.id),
      describedByError: error?.id ? describedBy.includes(error.id) : false,
      errorText: testIdText(rendered.root, 'markdown-image-alt-error'),
    }).toEqual({
      invalidBefore: false,
      invalid: 'true',
      errorHasId: true,
      describedByError: true,
      errorText: 'Ce champ est obligatoire',
    });
  });

  it('Given an alt text in error When a valid text is typed Then the field is no longer marked invalid nor described by a message that is gone', async () => {
    const rendered = await renderPanel();
    await pickImageFile(rendered.fixture);
    await pressImagePanel(rendered.fixture, 'markdown-image-submit');

    await typeImageAlt(rendered.fixture, 'Schéma');
    const alt = imagePanelAlt(rendered.root);
    const describedBy = (alt?.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);

    expect({
      invalid: alt?.getAttribute('aria-invalid') === 'true',
      error: byTestId(rendered.root, 'markdown-image-alt-error'),
      dangling: describedBy.filter((id) => !rendered.root.querySelector(`[id="${id}"]`)),
    }).toEqual({ invalid: false, error: null, dangling: [] });
  });
});

describe('AdminContentImageUpload: envoi', () => {
  it('Given a file and an alt text When « Insérer l’image » is pressed Then the file alone is sent and the resolved address is handed over with the trimmed alt text', async () => {
    const rendered = await renderPanel();
    await pickImageFile(rendered.fixture);
    await typeImageAlt(rendered.fixture, '  Schéma du chiffrement ');

    await pressImagePanel(rendered.fixture, 'markdown-image-submit');

    expect({
      calls: rendered.upload.mock.calls,
      inserted: rendered.inserted,
      cancelled: rendered.cancelled.length,
    }).toEqual({
      calls: [[BODY_IMAGE_FILE]],
      inserted: [{ alt: 'Schéma du chiffrement', url: IMAGE.url }],
      cancelled: 0,
    });
  });

  it('Given a file and an alt text When Enter is pressed in the alt field Then the key is kept from the article form and the image is sent', async () => {
    const rendered = await renderPanel();
    await pickImageFile(rendered.fixture);
    await typeImageAlt(rendered.fixture, 'Schéma');

    const event = await pressKeyInImageAlt(rendered.fixture, 'Enter');

    expect({
      prevented: event.defaultPrevented,
      uploads: rendered.upload.mock.calls.length,
      inserted: rendered.inserted,
    }).toEqual({ prevented: true, uploads: 1, inserted: [{ alt: 'Schéma', url: IMAGE.url }] });
  });

  it('Given an empty alt text When Enter is pressed in the alt field Then the key is kept from the article form and the field says it is required', async () => {
    const rendered = await renderPanel();
    await pickImageFile(rendered.fixture);

    const event = await pressKeyInImageAlt(rendered.fixture, 'Enter');

    expect({
      prevented: event.defaultPrevented,
      alt: alert(rendered.root, 'markdown-image-alt-error')?.text ?? null,
      uploads: rendered.upload.mock.calls.length,
    }).toEqual({ prevented: true, alt: 'Ce champ est obligatoire', uploads: 0 });
  });

  it('Given an upload under way When « Insérer l’image » and Enter are pressed again Then the button is announced as unavailable without being disabled, and nothing more is sent', async () => {
    const pending = new Subject<ContentImage>();
    const rendered = await renderPanel(vi.fn(() => pending));
    await pickImageFile(rendered.fixture);
    await typeImageAlt(rendered.fixture, 'Schéma');
    await pressImagePanel(rendered.fixture, 'markdown-image-submit');

    const during = availability(rendered.root);
    await pressImagePanel(rendered.fixture, 'markdown-image-submit');
    await pressKeyInImageAlt(rendered.fixture, 'Enter');
    pending.next(IMAGE);
    pending.complete();
    await settleBounded(rendered.fixture);

    expect({
      during,
      uploads: rendered.upload.mock.calls.length,
      inserted: rendered.inserted.length,
    }).toEqual({
      during: { ariaDisabled: 'true', disabled: false },
      uploads: 1,
      inserted: 1,
    });
  });

  it('Given the focus on « Insérer l’image » When the upload is under way, then refused Then the focus never leaves the button', async () => {
    const pending = new Subject<ContentImage>();
    const rendered = await renderPanel(vi.fn(() => pending));
    await pickImageFile(rendered.fixture);
    await typeImageAlt(rendered.fixture, 'Schéma');
    const button = submitButton(rendered.root);
    button?.focus();

    await pressImagePanel(rendered.fixture, 'markdown-image-submit');
    const focusedDuring = document.activeElement === button;
    pending.error(httpError(413));
    await settleBounded(rendered.fixture);

    expect({
      focusedDuring,
      focusedAfter: document.activeElement === button,
      error: alert(rendered.root, 'markdown-image-error')?.text ?? null,
      after: availability(rendered.root),
    }).toEqual({
      focusedDuring: true,
      focusedAfter: true,
      error: "L'image dépasse 5\u00a0Mo.",
      after: { ariaDisabled: 'false', disabled: false },
    });
  });
});

describe('AdminContentImageUpload: échec de l’envoi', () => {
  it.each([
    { status: 413, message: "L'image dépasse 5\u00a0Mo." },
    {
      status: 422,
      message: 'Image refusée\u00a0: format non pris en charge ou fichier illisible.',
    },
    { status: 429, message: "L'image n'a pas pu être envoyée. Réessayez." },
    { status: 500, message: "L'image n'a pas pu être envoyée. Réessayez." },
  ])(
    'Given the API answers $status When the image is sent Then the panel says « $message », keeps the file and the alt text, and inserts nothing',
    async ({ status, message }) => {
      const rendered = await renderPanel(vi.fn(() => throwError(() => httpError(status))));
      await pickImageFile(rendered.fixture);
      await typeImageAlt(rendered.fixture, 'Schéma');

      await pressImagePanel(rendered.fixture, 'markdown-image-submit');

      expect({
        error: alert(rendered.root, 'markdown-image-error'),
        alt: imagePanelAlt(rendered.root)?.value,
        file: fileShown(rendered.root),
        available: availability(rendered.root),
        inserted: rendered.inserted,
      }).toEqual({
        error: { role: 'alert', text: message },
        alt: 'Schéma',
        file: true,
        available: { ariaDisabled: 'false', disabled: false },
        inserted: [],
      });
    },
  );

  it('Given a refused upload When the image is sent again and accepted Then the same file is sent twice, the error is gone and the image is handed over', async () => {
    const upload: Upload = vi
      .fn<(file: File) => Observable<ContentImage>>()
      .mockReturnValueOnce(throwError(() => httpError(422)))
      .mockReturnValueOnce(of(IMAGE));
    const rendered = await renderPanel(upload);
    await pickImageFile(rendered.fixture);
    await typeImageAlt(rendered.fixture, 'Schéma');

    await pressImagePanel(rendered.fixture, 'markdown-image-submit');
    await pressImagePanel(rendered.fixture, 'markdown-image-submit');

    expect({
      calls: upload.mock.calls,
      error: alert(rendered.root, 'markdown-image-error'),
      inserted: rendered.inserted,
    }).toEqual({
      calls: [[BODY_IMAGE_FILE], [BODY_IMAGE_FILE]],
      error: null,
      inserted: [{ alt: 'Schéma', url: IMAGE.url }],
    });
  });
});

describe('AdminContentImageUpload: annulation', () => {
  it('Given a file and an alt text When « Annuler » is pressed Then the panel asks to close and sends nothing', async () => {
    const rendered = await renderPanel();
    await pickImageFile(rendered.fixture);
    await typeImageAlt(rendered.fixture, 'Schéma');

    await pressImagePanel(rendered.fixture, 'markdown-image-cancel');

    expect({
      cancelled: rendered.cancelled.length,
      uploads: rendered.upload.mock.calls.length,
      inserted: rendered.inserted,
    }).toEqual({ cancelled: 1, uploads: 0, inserted: [] });
  });

  it('Given the focus in the alt field When Escape is pressed Then the panel asks to close and sends nothing', async () => {
    const rendered = await renderPanel();
    await typeImageAlt(rendered.fixture, 'Schéma');

    await pressKeyInImageAlt(rendered.fixture, 'Escape');

    expect({
      cancelled: rendered.cancelled.length,
      uploads: rendered.upload.mock.calls.length,
    }).toEqual({ cancelled: 1, uploads: 0 });
  });
});
