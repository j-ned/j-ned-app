import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { NEVER, of, throwError, type Observable } from 'rxjs';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';

import { AdminProjectGallery } from './admin-project-gallery';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import type { ProjectImage } from '@features/projects/domain/models/project.model';
import { makeProjectImage } from '@features/projects/testing/project-builders';
import { ToastStore } from '@shared/ui/toast-store';
import type { ToastMessage } from '@shared/ui/toast.types';

const capture = (key: string, alt: string): ProjectImage =>
  makeProjectImage({
    id: `img-${key}`,
    src: `https://cdn.test/project-images/img-${key}.avif`,
    alt,
  });

const CAPTURES: readonly ProjectImage[] = [
  capture('a', 'Vue globale'),
  makeProjectImage({
    id: 'img-b',
    src: 'https://cdn.test/project-images/img-b.avif',
    alt: 'Transactions',
    width: 1280,
    height: 800,
  }),
  capture('c', 'Enveloppes'),
];

const gallery = (size: number): readonly ProjectImage[] =>
  Array.from({ length: size }, (_, i) => capture(String(i), `Capture ${i + 1}`));

const httpError = (status: number): HttpErrorResponse =>
  new HttpErrorResponse({ status, statusText: 'Refused' });

type GatewayStub = {
  uploadGalleryImage: Mock<
    (projectId: string, file: File, alt: string) => Observable<ProjectImage>
  >;
  updateGalleryImageAlt: Mock<
    (projectId: string, imageId: string, alt: string) => Observable<ProjectImage>
  >;
  deleteGalleryImage: Mock<(projectId: string, imageId: string) => Observable<void>>;
  reorderGallery: Mock<
    (projectId: string, imageIds: readonly string[]) => Observable<readonly ProjectImage[]>
  >;
};

function makeGateway(images: readonly ProjectImage[]): GatewayStub {
  const byId = (id: string): ProjectImage =>
    images.find((image) => image.id === id) ?? capture(id, id);
  return {
    uploadGalleryImage: vi.fn((_projectId: string, _file: File, alt: string) =>
      of(capture('new', alt)),
    ),
    updateGalleryImageAlt: vi.fn((_projectId: string, imageId: string, alt: string) =>
      of({ ...byId(imageId), alt }),
    ),
    deleteGalleryImage: vi.fn(() => of(undefined)),
    reorderGallery: vi.fn((_projectId: string, ids: readonly string[]) => of(ids.map(byId))),
  };
}

type Rendered = {
  fixture: ComponentFixture<AdminProjectGallery>;
  host: HTMLElement;
  gateway: GatewayStub;
  toast: { add: ReturnType<typeof vi.fn> };
  changes: (readonly ProjectImage[])[];
};

async function render(
  images: readonly ProjectImage[] = CAPTURES,
  configure: (gateway: GatewayStub) => void = () => undefined,
): Promise<Rendered> {
  const gateway = makeGateway(images);
  configure(gateway);
  const toast = { add: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      { provide: ProjectsGateway, useValue: gateway },
      { provide: ToastStore, useValue: toast },
    ],
  });
  const fixture = TestBed.createComponent(AdminProjectGallery);
  fixture.componentRef.setInput('projectId', 'uuid-1');
  fixture.componentRef.setInput('images', images);
  const changes: (readonly ProjectImage[])[] = [];
  fixture.componentInstance.galleryChange.subscribe((next) => changes.push(next));
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, host: fixture.nativeElement as HTMLElement, gateway, toast, changes };
}

async function settle(fixture: ComponentFixture<AdminProjectGallery>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

const normalized = (text: string | null | undefined): string =>
  (text ?? '').replace(/\s+/g, ' ').trim();

const accessibleName = (element: Element | null | undefined): string => {
  if (!element) return '';
  const label = element.getAttribute('aria-label');
  if (label !== null) return normalized(label);
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
    if (!(node instanceof Element) || node.getAttribute('aria-hidden') === 'true') return '';
    if (node.tagName === 'IMG') return ` ${node.getAttribute('alt') ?? ''} `;
    return [...node.childNodes].map(walk).join('');
  };
  return normalized(walk(element));
};

const items = (host: HTMLElement): HTMLElement[] => [
  ...host.querySelectorAll<HTMLElement>('[data-testid="admin-gallery-item"]'),
];

const byTestId = (root: Element | null | undefined, testId: string): HTMLElement | null =>
  root?.querySelector<HTMLElement>(`[data-testid="${testId}"]`) ?? null;

const buttonIn = (root: Element | null | undefined, testId: string): HTMLButtonElement | null => {
  const element = byTestId(root, testId);
  if (!element) return null;
  return element.tagName === 'BUTTON'
    ? (element as HTMLButtonElement)
    : element.querySelector('button');
};

const formOf = (element: Element | null | undefined): HTMLFormElement | null => {
  if (!element) return null;
  return element.tagName === 'FORM' ? (element as HTMLFormElement) : element.querySelector('form');
};

const thumbnailAlts = (host: HTMLElement): (string | null | undefined)[] =>
  items(host).map((item) => byTestId(item, 'admin-gallery-item-thumb')?.getAttribute('alt'));

const toasts = (toast: Rendered['toast']): readonly ToastMessage[] =>
  toast.add.mock.calls.map(([message]: ToastMessage[]) => message);

function type(input: HTMLElement | null, value: string): void {
  if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) return;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function pickFile(host: HTMLElement, file: File): void {
  const input = formOf(byTestId(host, 'admin-gallery-upload'))?.querySelector<HTMLInputElement>(
    'input[type="file"]',
  );
  if (!input) return;
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new Event('change'));
}

async function submit(
  fixture: ComponentFixture<AdminProjectGallery>,
  form: HTMLFormElement | null,
): Promise<void> {
  form?.dispatchEvent(new Event('submit', { cancelable: true }));
  await settle(fixture);
}

async function upload(rendered: Rendered, alt: string, file: File | null = PNG): Promise<void> {
  const uploadForm = formOf(byTestId(rendered.host, 'admin-gallery-upload'));
  if (file) pickFile(rendered.host, file);
  type(byTestId(uploadForm, 'admin-gallery-upload-alt'), alt);
  rendered.fixture.detectChanges();
  await submit(rendered.fixture, uploadForm);
}

async function click(
  fixture: ComponentFixture<AdminProjectGallery>,
  button: HTMLButtonElement | null,
): Promise<void> {
  button?.click();
  await settle(fixture);
}

const PNG = new File(['png'], 'vue-mobile.png', { type: 'image/png' });

describe('AdminProjectGallery', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  describe('liste des captures', () => {
    it('Given three captures When the gallery renders Then each one shows its thumbnail and its alt, in order', async () => {
      const { host } = await render();

      expect(
        items(host).map((item) => {
          const thumb = byTestId(item, 'admin-gallery-item-thumb');
          return {
            tag: thumb?.tagName,
            src: thumb?.getAttribute('src'),
            alt: thumb?.getAttribute('alt'),
            width: thumb?.getAttribute('width'),
            height: thumb?.getAttribute('height'),
            altField: (byTestId(item, 'admin-gallery-item-alt') as HTMLInputElement | null)?.value,
          };
        }),
      ).toEqual(
        CAPTURES.map((image) => ({
          tag: 'IMG',
          src: image.src,
          alt: image.alt,
          width: String(image.width),
          height: String(image.height),
          altField: image.alt,
        })),
      );
    });

    it('Given three captures When the gallery renders Then the alt field and the buttons of a capture are named with its rank', async () => {
      const { host } = await render();
      const second = items(host)[1];
      const altField = byTestId(second, 'admin-gallery-item-alt');
      const label = altField?.id ? host.querySelector(`label[for="${altField.id}"]`) : null;

      expect({
        altLabel: normalized(label?.textContent),
        up: accessibleName(buttonIn(second, 'admin-gallery-item-up')),
        down: accessibleName(buttonIn(second, 'admin-gallery-item-down')),
        remove: accessibleName(buttonIn(second, 'admin-gallery-item-remove')),
      }).toEqual({
        altLabel: 'Texte alternatif de la capture 2',
        up: 'Monter la capture 2',
        down: 'Descendre la capture 2',
        remove: 'Supprimer la capture 2',
      });
    });
  });

  describe('grille de vignettes', () => {
    it('Given three captures When the gallery renders Then they form a list of three columns, one item per capture', async () => {
      const { host } = await render();
      const list = byTestId(host, 'admin-gallery-list');

      expect({
        tag: list?.tagName,
        items: list?.querySelectorAll(':scope > li').length,
        captures: [...(list?.querySelectorAll(':scope > li') ?? [])].map(
          (li) => byTestId(li, 'admin-gallery-item-thumb')?.getAttribute('alt') ?? null,
        ),
        grid: list?.classList.contains('grid') ?? false,
        threeColumns: [...(list?.classList ?? [])].some((token) => /(^|:)grid-cols-3$/.test(token)),
      }).toEqual({
        tag: 'UL',
        items: 3,
        captures: ['Vue globale', 'Transactions', 'Enveloppes'],
        grid: true,
        threeColumns: true,
      });
    });

    it('Given a capture When it renders Then its thumbnail comes first, then its alt text, then its position and its actions', async () => {
      const { host } = await render();
      const second = items(host)[1];
      const order = [
        'admin-gallery-item-thumb',
        'admin-gallery-item-alt',
        'admin-gallery-item-position',
        'admin-gallery-item-up',
        'admin-gallery-item-down',
        'admin-gallery-item-remove',
      ].map((testId) => byTestId(second, testId));
      const followsPrevious = order.slice(1).map((element, index) => {
        const previous = order[index];
        return previous && element
          ? (previous.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
          : false;
      });

      expect({
        followsPrevious,
        position: normalized(byTestId(second, 'admin-gallery-item-position')?.textContent),
      }).toEqual({ followsPrevious: [true, true, true, true, true], position: '2 / 3' });
    });

    it.each(['admin-gallery-item-up', 'admin-gallery-item-down', 'admin-gallery-item-remove'])(
      'Given a capture in the grid When its action %s renders Then it is an icon button named by its label',
      async (testId) => {
        const { host } = await render();
        const button = buttonIn(items(host)[1], testId);

        expect({
          icon: button?.querySelector('app-icon') !== null && button !== null,
          text: normalized(button?.textContent),
          named: (button?.getAttribute('aria-label') ?? '').endsWith('la capture 2'),
        }).toEqual({ icon: true, text: '', named: true });
      },
    );
  });

  describe('ajout d’une capture', () => {
    it('Given the upload form When it renders Then the alt field is labelled and required and the file input accepts the four API formats', async () => {
      const { host } = await render();
      const uploadForm = formOf(byTestId(host, 'admin-gallery-upload'));
      const altField = byTestId(uploadForm, 'admin-gallery-upload-alt');
      const label = altField?.id ? host.querySelector(`label[for="${altField.id}"]`) : null;

      expect({
        label: normalized(label?.textContent),
        ariaRequired: altField?.getAttribute('aria-required'),
        accept: uploadForm?.querySelector('input[type="file"]')?.getAttribute('accept'),
      }).toEqual({
        label: 'Texte alternatif',
        ariaRequired: 'true',
        accept: 'image/avif,image/webp,image/png,image/jpeg',
      });
    });

    it('Given a file and an alt with surrounding spaces When the form is submitted Then the trimmed capture is uploaded, appended and announced', async () => {
      const rendered = await render();

      await upload(rendered, '  Vue mobile  ');

      expect({
        calls: rendered.gateway.uploadGalleryImage.mock.calls,
        alts: thumbnailAlts(rendered.host),
        changes: rendered.changes,
      }).toEqual({
        calls: [['uuid-1', PNG, 'Vue mobile']],
        alts: ['Vue globale', 'Transactions', 'Enveloppes', 'Vue mobile'],
        changes: [[...CAPTURES, capture('new', 'Vue mobile')]],
      });
    });

    it('Given a successful upload When the form comes back Then its alt and its file are cleared', async () => {
      const rendered = await render();
      await upload(rendered, 'Vue mobile');

      const altField = byTestId(
        rendered.host,
        'admin-gallery-upload-alt',
      ) as HTMLInputElement | null;
      const altAfterUpload = altField?.value;
      await upload(rendered, 'Autre vue', null);

      expect({
        altAfterUpload,
        calls: rendered.gateway.uploadGalleryImage.mock.calls.length,
        fileError: normalized(
          byTestId(rendered.host, 'admin-gallery-upload-file-error')?.textContent,
        ),
      }).toEqual({ altAfterUpload: '', calls: 1, fileError: 'Choisissez une image' });
    });

    it('Given an alt of exactly 300 characters When the form is submitted Then the capture is uploaded', async () => {
      const rendered = await render();

      await upload(rendered, 'a'.repeat(300));

      expect(rendered.gateway.uploadGalleryImage.mock.calls.map(([, , alt]) => alt.length)).toEqual(
        [300],
      );
    });

    it.each([
      { label: 'empty', alt: '', message: 'Ce champ est obligatoire' },
      { label: 'blank', alt: '   ', message: 'Ce champ est obligatoire' },
      { label: '301 characters', alt: 'a'.repeat(301), message: '300 caractères au plus' },
    ])(
      'Given a file and a $label alt When the form is submitted Then nothing is uploaded and the alt error is announced',
      async ({ alt, message }) => {
        const rendered = await render();

        await upload(rendered, alt);
        const error = byTestId(rendered.host, 'admin-gallery-upload-alt-error');

        expect({
          calls: rendered.gateway.uploadGalleryImage.mock.calls.length,
          role: error?.getAttribute('role'),
          message: normalized(error?.textContent),
        }).toEqual({ calls: 0, role: 'alert', message });
      },
    );

    it('Given an alt but no file When the form is submitted Then nothing is uploaded and the file error is announced', async () => {
      const rendered = await render();

      await upload(rendered, 'Vue mobile', null);
      const error = byTestId(rendered.host, 'admin-gallery-upload-file-error');

      expect({
        calls: rendered.gateway.uploadGalleryImage.mock.calls.length,
        role: error?.getAttribute('role'),
        message: normalized(error?.textContent),
      }).toEqual({ calls: 0, role: 'alert', message: 'Choisissez une image' });
    });

    it.each([
      { status: 413, detail: "L'image dépasse 5 Mo." },
      {
        status: 422,
        detail: 'Image refusée\u00a0: format non pris en charge, ou galerie déjà complète.',
      },
      { status: 500, detail: "Erreur lors de l'ajout de la capture" },
    ])(
      'Given the API answers $status When a capture is uploaded Then an error toast explains it and the gallery and the alt are kept',
      async ({ status, detail }) => {
        const rendered = await render(CAPTURES, (gateway) =>
          gateway.uploadGalleryImage.mockReturnValue(throwError(() => httpError(status))),
        );

        await upload(rendered, 'Vue mobile');

        expect({
          toasts: toasts(rendered.toast),
          alts: thumbnailAlts(rendered.host),
          changes: rendered.changes,
          alt: (byTestId(rendered.host, 'admin-gallery-upload-alt') as HTMLInputElement | null)
            ?.value,
        }).toEqual({
          toasts: [{ severity: 'error', detail }],
          alts: ['Vue globale', 'Transactions', 'Enveloppes'],
          changes: [],
          alt: 'Vue mobile',
        });
      },
    );
  });

  describe('plafond de 12 captures', () => {
    it.each([
      { size: 11, form: true, full: '' },
      {
        size: 12,
        form: false,
        full: '12 captures au plus : supprimez-en une pour en ajouter une autre.',
      },
    ])(
      'Given $size captures When the gallery renders Then the upload form is shown: $form',
      async ({ size, form, full }) => {
        const { host } = await render(gallery(size));

        expect({
          form: byTestId(host, 'admin-gallery-upload') !== null,
          full: normalized(byTestId(host, 'admin-gallery-full')?.textContent),
        }).toEqual({ form, full });
      },
    );

    it('Given 11 captures When a 12th is uploaded Then the upload form gives way to the limit notice', async () => {
      const rendered = await render(gallery(11));

      await upload(rendered, 'Douzième vue');

      expect({
        items: items(rendered.host).length,
        form: byTestId(rendered.host, 'admin-gallery-upload') !== null,
        full: byTestId(rendered.host, 'admin-gallery-full') !== null,
      }).toEqual({ items: 12, form: false, full: true });
    });
  });

  describe('texte alternatif d’une capture', () => {
    it('Given a new alt on the second capture When its form is submitted Then the alt is saved and the gallery is announced', async () => {
      const rendered = await render();
      const second = items(rendered.host)[1];

      type(byTestId(second, 'admin-gallery-item-alt'), ' Liste des transactions du mois ');
      await submit(rendered.fixture, formOf(second));

      expect({
        calls: rendered.gateway.updateGalleryImageAlt.mock.calls,
        alts: thumbnailAlts(rendered.host),
        changes: rendered.changes,
      }).toEqual({
        calls: [['uuid-1', 'img-b', 'Liste des transactions du mois']],
        alts: ['Vue globale', 'Liste des transactions du mois', 'Enveloppes'],
        changes: [
          [CAPTURES[0], { ...CAPTURES[1], alt: 'Liste des transactions du mois' }, CAPTURES[2]],
        ],
      });
    });

    it.each([
      { label: 'empty', alt: '', message: 'Ce champ est obligatoire' },
      { label: '301 characters', alt: 'a'.repeat(301), message: '300 caractères au plus' },
    ])(
      'Given a $label alt on a capture When its form is submitted Then nothing is saved and the error is announced',
      async ({ alt, message }) => {
        const rendered = await render();
        const second = items(rendered.host)[1];

        type(byTestId(second, 'admin-gallery-item-alt'), alt);
        await submit(rendered.fixture, formOf(second));
        const error = byTestId(items(rendered.host)[1], 'admin-gallery-item-alt-error');

        expect({
          calls: rendered.gateway.updateGalleryImageAlt.mock.calls.length,
          role: error?.getAttribute('role'),
          message: normalized(error?.textContent),
        }).toEqual({ calls: 0, role: 'alert', message });
      },
    );

    it('Given the API refuses the alt When it is saved Then an error toast is shown and nothing is announced', async () => {
      const rendered = await render(CAPTURES, (gateway) =>
        gateway.updateGalleryImageAlt.mockReturnValue(throwError(() => httpError(500))),
      );
      const second = items(rendered.host)[1];

      type(byTestId(second, 'admin-gallery-item-alt'), 'Liste des transactions');
      await submit(rendered.fixture, formOf(second));

      expect({ toasts: toasts(rendered.toast), changes: rendered.changes }).toEqual({
        toasts: [
          { severity: 'error', detail: "Erreur lors de l'enregistrement du texte alternatif" },
        ],
        changes: [],
      });
    });
  });

  describe('erreur du texte alternatif annoncée et reliée', () => {
    const ALT_FIELDS = [
      {
        form: 'the second capture',
        root: (host: HTMLElement): HTMLElement | null => items(host)[1] ?? null,
        field: 'admin-gallery-item-alt',
        errorId: 'gallery-alt-img-b-error',
        errorTestId: 'admin-gallery-item-alt-error',
      },
      {
        form: 'the upload form',
        root: (host: HTMLElement): HTMLElement | null => byTestId(host, 'admin-gallery-upload'),
        field: 'admin-gallery-upload-alt',
        errorId: 'gallery-upload-alt-error',
        errorTestId: 'admin-gallery-upload-alt-error',
      },
    ];

    async function emptyAndLeave(rendered: Rendered, input: HTMLElement | null): Promise<void> {
      type(input, '');
      input?.dispatchEvent(new Event('blur'));
      await settle(rendered.fixture);
    }

    const elementWithId = (host: HTMLElement, id: string | null | undefined): HTMLElement | null =>
      id ? host.querySelector<HTMLElement>(`[id="${id}"]`) : null;

    it.each(ALT_FIELDS)(
      'Given $form When its alt is emptied then left Then the field is invalid and described by its announced error',
      async ({ root, field, errorId, errorTestId }) => {
        const rendered = await render();
        const input = byTestId(root(rendered.host), field);

        await emptyAndLeave(rendered, input);
        const error = elementWithId(rendered.host, errorId);

        expect({
          invalid: input?.getAttribute('aria-invalid'),
          describedBy: input?.getAttribute('aria-describedby'),
          error: {
            testId: error?.getAttribute('data-testid'),
            role: error?.getAttribute('role'),
            text: normalized(error?.textContent),
          },
        }).toEqual({
          invalid: 'true',
          describedBy: errorId,
          error: { testId: errorTestId, role: 'alert', text: 'Ce champ est obligatoire' },
        });
      },
    );

    it.each(ALT_FIELDS)(
      'Given $form When it renders Then its alt is valid and described by nothing',
      async ({ root, field }) => {
        const rendered = await render();
        const input = byTestId(root(rendered.host), field);

        expect({
          invalid: input?.getAttribute('aria-invalid'),
          describedBy: input?.getAttribute('aria-describedby'),
        }).toEqual({ invalid: 'false', describedBy: null });
      },
    );

    it('Given two captures with their alt emptied then left Then each field is described by its own error, inside its own capture', async () => {
      const rendered = await render();
      for (const item of items(rendered.host).slice(0, 2)) {
        await emptyAndLeave(rendered, byTestId(item, 'admin-gallery-item-alt'));
      }

      expect(
        items(rendered.host)
          .slice(0, 2)
          .map((item) => {
            const id = byTestId(item, 'admin-gallery-item-alt')?.getAttribute('aria-describedby');
            return { id, inItem: item.contains(elementWithId(rendered.host, id)) };
          }),
      ).toEqual([
        { id: 'gallery-alt-img-a-error', inItem: true },
        { id: 'gallery-alt-img-b-error', inItem: true },
      ]);
    });
  });

  describe('suppression d’une capture', () => {
    it('Given a capture When « Supprimer » is activated Then an in-page confirmation takes focus and nothing is deleted yet', async () => {
      const nativeConfirm = vi.fn(() => true);
      vi.stubGlobal('confirm', nativeConfirm);
      const rendered = await render();

      await click(rendered.fixture, buttonIn(items(rendered.host)[1], 'admin-gallery-item-remove'));
      const confirmButton = buttonIn(items(rendered.host)[1], 'admin-gallery-item-confirm-remove');

      expect({
        confirmName: accessibleName(confirmButton),
        cancelName: accessibleName(
          buttonIn(items(rendered.host)[1], 'admin-gallery-item-cancel-remove'),
        ),
        focused: confirmButton !== null && document.activeElement === confirmButton,
        deletes: rendered.gateway.deleteGalleryImage.mock.calls.length,
        nativeConfirm: nativeConfirm.mock.calls.length,
        items: items(rendered.host).length,
      }).toEqual({
        confirmName: 'Confirmer la suppression de la capture 2',
        cancelName: 'Annuler',
        focused: true,
        deletes: 0,
        nativeConfirm: 0,
        items: 3,
      });
    });

    it('Given the confirmation When « Annuler » is activated Then it closes, focus returns to « Supprimer » and nothing is deleted', async () => {
      const rendered = await render();
      await click(rendered.fixture, buttonIn(items(rendered.host)[1], 'admin-gallery-item-remove'));

      await click(
        rendered.fixture,
        buttonIn(items(rendered.host)[1], 'admin-gallery-item-cancel-remove'),
      );
      const removeButton = buttonIn(items(rendered.host)[1], 'admin-gallery-item-remove');

      expect({
        confirm: byTestId(items(rendered.host)[1], 'admin-gallery-item-confirm-remove'),
        focused: removeButton !== null && document.activeElement === removeButton,
        deletes: rendered.gateway.deleteGalleryImage.mock.calls.length,
      }).toEqual({ confirm: null, focused: true, deletes: 0 });
    });

    it('Given the confirmation When it is confirmed Then the capture is deleted, removed from the list and the gallery is announced', async () => {
      const rendered = await render();
      await click(rendered.fixture, buttonIn(items(rendered.host)[1], 'admin-gallery-item-remove'));

      await click(
        rendered.fixture,
        buttonIn(items(rendered.host)[1], 'admin-gallery-item-confirm-remove'),
      );

      expect({
        calls: rendered.gateway.deleteGalleryImage.mock.calls,
        alts: thumbnailAlts(rendered.host),
        changes: rendered.changes,
      }).toEqual({
        calls: [['uuid-1', 'img-b']],
        alts: ['Vue globale', 'Enveloppes'],
        changes: [[CAPTURES[0], CAPTURES[2]]],
      });
    });

    it('Given the API refuses the deletion When it is confirmed Then an error toast is shown and the capture stays', async () => {
      const rendered = await render(CAPTURES, (gateway) =>
        gateway.deleteGalleryImage.mockReturnValue(throwError(() => httpError(500))),
      );
      await click(rendered.fixture, buttonIn(items(rendered.host)[1], 'admin-gallery-item-remove'));

      await click(
        rendered.fixture,
        buttonIn(items(rendered.host)[1], 'admin-gallery-item-confirm-remove'),
      );

      expect({
        toasts: toasts(rendered.toast),
        alts: thumbnailAlts(rendered.host),
        changes: rendered.changes,
      }).toEqual({
        toasts: [{ severity: 'error', detail: 'Erreur lors de la suppression de la capture' }],
        alts: ['Vue globale', 'Transactions', 'Enveloppes'],
        changes: [],
      });
    });
  });

  describe('ordre des captures', () => {
    it('Given three captures When the gallery renders Then « Monter » is absent on the first and « Descendre » on the last', async () => {
      const { host } = await render();

      expect(
        items(host).map((item) => ({
          up: buttonIn(item, 'admin-gallery-item-up') !== null,
          down: buttonIn(item, 'admin-gallery-item-down') !== null,
        })),
      ).toEqual([
        { up: false, down: true },
        { up: true, down: true },
        { up: true, down: false },
      ]);
    });

    it('Given a single capture When the gallery renders Then it has neither « Monter » nor « Descendre »', async () => {
      const { host } = await render([CAPTURES[0]]);
      const only = items(host)[0];

      expect({
        items: items(host).length,
        up: byTestId(only, 'admin-gallery-item-up'),
        down: byTestId(only, 'admin-gallery-item-down'),
      }).toEqual({ items: 1, up: null, down: null });
    });

    it.each([
      {
        rank: 1,
        button: 'admin-gallery-item-down',
        ids: ['img-b', 'img-a', 'img-c'],
        alts: ['Transactions', 'Vue globale', 'Enveloppes'],
        focus: { rank: 2, button: 'admin-gallery-item-down' },
      },
      {
        rank: 2,
        button: 'admin-gallery-item-up',
        ids: ['img-b', 'img-a', 'img-c'],
        alts: ['Transactions', 'Vue globale', 'Enveloppes'],
        focus: { rank: 1, button: 'admin-gallery-item-down' },
      },
      {
        rank: 2,
        button: 'admin-gallery-item-down',
        ids: ['img-a', 'img-c', 'img-b'],
        alts: ['Vue globale', 'Enveloppes', 'Transactions'],
        focus: { rank: 3, button: 'admin-gallery-item-up' },
      },
      {
        rank: 3,
        button: 'admin-gallery-item-up',
        ids: ['img-a', 'img-c', 'img-b'],
        alts: ['Vue globale', 'Enveloppes', 'Transactions'],
        focus: { rank: 2, button: 'admin-gallery-item-up' },
      },
    ])(
      'Given capture $rank When $button is activated Then the whole permutation is sent, the list follows and focus stays on the moved capture',
      async ({ rank, button, ids, alts, focus }) => {
        const rendered = await render();

        await click(rendered.fixture, buttonIn(items(rendered.host)[rank - 1], button));
        const expectedFocus = buttonIn(items(rendered.host)[focus.rank - 1], focus.button);

        expect({
          calls: rendered.gateway.reorderGallery.mock.calls,
          alts: thumbnailAlts(rendered.host),
          focused: expectedFocus !== null && document.activeElement === expectedFocus,
        }).toEqual({ calls: [['uuid-1', ids]], alts, focused: true });
      },
    );

    it('Given the API answers the reorder When the list is rebuilt Then the gallery is the API answer, announced as is', async () => {
      const fromApi = [{ ...CAPTURES[1], alt: 'Transactions (serveur)' }, CAPTURES[0], CAPTURES[2]];
      const rendered = await render(CAPTURES, (gateway) =>
        gateway.reorderGallery.mockReturnValue(of(fromApi)),
      );

      await click(rendered.fixture, buttonIn(items(rendered.host)[0], 'admin-gallery-item-down'));

      expect({ alts: thumbnailAlts(rendered.host), changes: rendered.changes }).toEqual({
        alts: ['Transactions (serveur)', 'Vue globale', 'Enveloppes'],
        changes: [fromApi],
      });
    });

    it('Given the API refuses the reorder When a capture is moved Then an error toast is shown and the order is kept', async () => {
      const rendered = await render(CAPTURES, (gateway) =>
        gateway.reorderGallery.mockReturnValue(throwError(() => httpError(422))),
      );

      await click(rendered.fixture, buttonIn(items(rendered.host)[0], 'admin-gallery-item-down'));

      expect({
        toasts: toasts(rendered.toast),
        alts: thumbnailAlts(rendered.host),
        changes: rendered.changes,
      }).toEqual({
        toasts: [{ severity: 'error', detail: 'Erreur lors du déplacement de la capture' }],
        alts: ['Vue globale', 'Transactions', 'Enveloppes'],
        changes: [],
      });
    });
  });

  describe('focus après une suppression', () => {
    it.each([
      {
        label: 'in the middle',
        images: CAPTURES,
        rank: 2,
        focusRank: 2,
        alts: ['Vue globale', 'Enveloppes'],
      },
      {
        label: 'at the end',
        images: CAPTURES,
        rank: 3,
        focusRank: 2,
        alts: ['Vue globale', 'Transactions'],
      },
    ])(
      'Given a capture $label When its deletion is confirmed Then focus lands on « Supprimer » of the capture now at its rank, or of the new last one',
      async ({ images, rank, focusRank, alts }) => {
        const rendered = await render(images);
        await click(
          rendered.fixture,
          buttonIn(items(rendered.host)[rank - 1], 'admin-gallery-item-remove'),
        );

        await click(
          rendered.fixture,
          buttonIn(items(rendered.host)[rank - 1], 'admin-gallery-item-confirm-remove'),
        );
        const expected = buttonIn(items(rendered.host)[focusRank - 1], 'admin-gallery-item-remove');

        expect({
          alts: thumbnailAlts(rendered.host),
          focused: accessibleName(document.activeElement),
          isExpected: expected !== null && document.activeElement === expected,
        }).toEqual({ alts, focused: `Supprimer la capture ${focusRank}`, isExpected: true });
      },
    );

    it('Given a single capture When its deletion is confirmed Then focus lands on the alt field of the upload form', async () => {
      const rendered = await render([CAPTURES[0]]);
      await click(rendered.fixture, buttonIn(items(rendered.host)[0], 'admin-gallery-item-remove'));

      await click(
        rendered.fixture,
        buttonIn(items(rendered.host)[0], 'admin-gallery-item-confirm-remove'),
      );
      const altField = byTestId(rendered.host, 'admin-gallery-upload-alt');

      expect({
        items: items(rendered.host).length,
        focused: altField !== null && document.activeElement === altField,
      }).toEqual({ items: 0, focused: true });
    });
  });

  describe('une seule écriture à la fois par capture', () => {
    it('Given a pending deletion When « Confirmer » is activated again Then a single DELETE is sent and the button is disabled', async () => {
      const rendered = await render(CAPTURES, (gateway) =>
        gateway.deleteGalleryImage.mockReturnValue(NEVER),
      );
      await click(rendered.fixture, buttonIn(items(rendered.host)[1], 'admin-gallery-item-remove'));
      const confirmButton = (): HTMLButtonElement | null =>
        buttonIn(items(rendered.host)[1], 'admin-gallery-item-confirm-remove');

      await click(rendered.fixture, confirmButton());
      await click(rendered.fixture, confirmButton());

      expect({
        deletes: rendered.gateway.deleteGalleryImage.mock.calls.length,
        disabled: confirmButton()?.disabled,
      }).toEqual({ deletes: 1, disabled: true });
    });

    it('Given a pending move When the capture buttons are activated again Then a single reorder is sent and « Monter » and « Descendre » are disabled', async () => {
      const rendered = await render(CAPTURES, (gateway) =>
        gateway.reorderGallery.mockReturnValue(NEVER),
      );
      const second = (): HTMLElement => items(rendered.host)[1];

      await click(rendered.fixture, buttonIn(second(), 'admin-gallery-item-down'));
      await click(rendered.fixture, buttonIn(second(), 'admin-gallery-item-down'));
      await click(rendered.fixture, buttonIn(second(), 'admin-gallery-item-up'));

      expect({
        reorders: rendered.gateway.reorderGallery.mock.calls.length,
        up: buttonIn(second(), 'admin-gallery-item-up')?.disabled,
        down: buttonIn(second(), 'admin-gallery-item-down')?.disabled,
      }).toEqual({ reorders: 1, up: true, down: true });
    });
  });
});
