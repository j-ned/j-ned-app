import { inputBinding, signal, type WritableSignal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle, settleBounded } from '@shared/testing/settle';
import { FileDropzone } from '@shared/ui/file-dropzone';
import { readConfirmDialog } from '@shared/ui/testing/confirm-dialog-page';
import { AdminProfilePortrait } from './admin-profile-portrait';

const STORED = '/api/storage/portfolio-storage/profile/portrait-1a2b3c4d.avif';

type Rendered = {
  readonly fixture: ComponentFixture<AdminProfilePortrait>;
  readonly host: HTMLElement;
  readonly portraitUrl: WritableSignal<string | null>;
  readonly busy: WritableSignal<boolean>;
  readonly selected: File[];
  readonly rejected: number[];
  readonly removed: number[];
};

async function renderPortrait(initial: string | null): Promise<Rendered> {
  const portraitUrl = signal<string | null>(initial);
  const busy = signal(false);
  const fixture = TestBed.createComponent(AdminProfilePortrait, {
    bindings: [inputBinding('portraitUrl', portraitUrl), inputBinding('busy', busy)],
  });
  const selected: File[] = [];
  const rejected: number[] = [];
  const removed: number[] = [];
  fixture.componentInstance.portraitSelected.subscribe((file) => selected.push(file));
  fixture.componentInstance.portraitRejected.subscribe(() => rejected.push(1));
  fixture.componentInstance.removeConfirmed.subscribe(() => removed.push(1));
  await settle(fixture);
  return {
    fixture,
    host: fixture.nativeElement as HTMLElement,
    portraitUrl,
    busy,
    selected,
    rejected,
    removed,
  };
}

const nativeButton = (element: Element | null | undefined): HTMLButtonElement | null =>
  element instanceof HTMLButtonElement ? element : (element?.querySelector('button') ?? null);

const thumbnail = (host: HTMLElement): { src: string | null; alt: string | null } => {
  const image = byTestId(host, 'admin-profile-portrait-current')?.querySelector('img') ?? null;
  return { src: image?.getAttribute('src') ?? null, alt: image?.getAttribute('alt') ?? null };
};

async function drop(rendered: Rendered, file: File): Promise<void> {
  rendered.fixture.debugElement
    .query(By.directive(FileDropzone))
    ?.triggerEventHandler('fileSelected', file);
  await settle(rendered.fixture);
}

async function askRemoval(rendered: Rendered): Promise<void> {
  nativeButton(byTestId(rendered.host, 'admin-profile-portrait-remove'))?.click();
  await settleBounded(rendered.fixture);
}

async function answer(rendered: Rendered, choice: 'confirm' | 'cancel'): Promise<void> {
  nativeButton(byTestId(rendered.host, `confirm-dialog-${choice}`))?.click();
  await settleBounded(rendered.fixture);
}

describe('AdminProfilePortrait: vignette', () => {
  it('Given no stored portrait When the section renders Then the default portrait shows, named as such, without a way back', async () => {
    const { host } = await renderPortrait(null);

    expect({
      thumbnail: thumbnail(host),
      mention: testIdText(host, 'admin-profile-portrait-default'),
      remove: byTestId(host, 'admin-profile-portrait-remove'),
    }).toEqual({
      thumbnail: { src: '/avatar.avif', alt: 'Portrait de Julien Nédellec' },
      mention: 'Portrait par défaut',
      remove: null,
    });
  });

  it('Given a stored portrait When the section renders Then it shows, with the way back to the default portrait', async () => {
    const { host } = await renderPortrait(STORED);

    expect({
      thumbnail: thumbnail(host),
      mention: byTestId(host, 'admin-profile-portrait-default'),
      remove: nativeButton(byTestId(host, 'admin-profile-portrait-remove'))?.textContent?.trim(),
    }).toEqual({
      thumbnail: { src: STORED, alt: 'Portrait de Julien Nédellec' },
      mention: null,
      remove: 'Revenir au portrait par défaut',
    });
  });

  it('Given the default portrait When a stored one arrives Then the thumbnail follows', async () => {
    const rendered = await renderPortrait(null);

    rendered.portraitUrl.set(STORED);
    await settle(rendered.fixture);

    expect(thumbnail(rendered.host).src).toBe(STORED);
  });
});

describe('AdminProfilePortrait: dépôt', () => {
  it('Given the drop zone When it renders Then it accepts the four image types the API takes and says so, with their size limit', async () => {
    const { host } = await renderPortrait(null);
    const zone = byTestId(host, 'admin-profile-portrait-dropzone');

    expect({
      accept: zone?.querySelector('input[type="file"]')?.getAttribute('accept'),
      helper: (zone?.textContent ?? '').includes('AVIF, WebP, PNG ou JPEG, 5 Mo au plus'),
    }).toEqual({ accept: 'image/avif,image/webp,image/png,image/jpeg', helper: true });
  });

  it.each([
    { type: 'image/avif', name: 'p.avif' },
    { type: 'image/webp', name: 'p.webp' },
    { type: 'image/png', name: 'p.png' },
    { type: 'image/jpeg', name: 'p.jpg' },
  ])(
    'Given a $type file dropped When it is read Then it is handed over at once',
    async ({ type, name }) => {
      const rendered = await renderPortrait(null);
      const file = new File(['x'], name, { type });

      await drop(rendered, file);

      expect({ selected: rendered.selected, rejected: rendered.rejected.length }).toEqual({
        selected: [file],
        rejected: 0,
      });
    },
  );

  it.each([
    { type: 'image/gif', name: 'p.gif' },
    { type: 'application/pdf', name: 'cv.pdf' },
  ])(
    'Given a $type file dropped When it is read Then it is refused, nothing is handed over',
    async ({ type, name }) => {
      const rendered = await renderPortrait(null);

      await drop(rendered, new File(['x'], name, { type }));

      expect({ selected: rendered.selected.length, rejected: rendered.rejected.length }).toEqual({
        selected: 0,
        rejected: 1,
      });
    },
  );

  it('Given a portrait being sent When the section renders Then a status says so and the way back is disabled', async () => {
    const rendered = await renderPortrait(STORED);

    rendered.busy.set(true);
    await settle(rendered.fixture);
    const status = byTestId(rendered.host, 'admin-profile-portrait-busy');

    expect({
      role: status?.getAttribute('role'),
      text: status?.textContent?.trim(),
      removeDisabled: nativeButton(byTestId(rendered.host, 'admin-profile-portrait-remove'))
        ?.disabled,
    }).toEqual({ role: 'status', text: 'Envoi du portrait…', removeDisabled: true });
  });
});

describe('AdminProfilePortrait: revenir au portrait par défaut', () => {
  it('Given a stored portrait When the way back is pressed Then a dialog asks to confirm, and nothing is emitted yet', async () => {
    const rendered = await renderPortrait(STORED);

    await askRemoval(rendered);
    const dialog = readConfirmDialog(rendered.host);

    expect({
      open: dialog.open,
      heading: dialog.heading,
      confirm: dialog.confirm,
      removed: rendered.removed.length,
    }).toEqual({
      open: true,
      heading: 'Revenir au portrait par défaut\u202f?',
      confirm: 'Revenir au portrait par défaut',
      removed: 0,
    });
  });

  it.each([
    { choice: 'confirm', removed: 1 },
    { choice: 'cancel', removed: 0 },
  ] as const)(
    'Given the dialog When the admin answers $choice Then the removal is emitted $removed time(s) and the dialog closes',
    async ({ choice, removed }) => {
      const rendered = await renderPortrait(STORED);

      await askRemoval(rendered);
      await answer(rendered, choice);

      expect({
        removed: rendered.removed.length,
        open: readConfirmDialog(rendered.host).open,
        asked: byTestId(rendered.host, 'admin-profile-portrait-remove') !== null,
      }).toEqual({ removed, open: false, asked: true });
    },
  );
});

describe('AdminProfilePortrait: focus après le retrait (revue F2-F7)', () => {
  const removeButton = (host: HTMLElement): HTMLButtonElement | null =>
    nativeButton(byTestId(host, 'admin-profile-portrait-remove'));

  it('Given the removal confirmed When it fails Then the focus goes back to the way back button', async () => {
    const rendered = await renderPortrait(STORED);

    await askRemoval(rendered);
    await answer(rendered, 'confirm');
    rendered.busy.set(true);
    await settle(rendered.fixture);
    rendered.busy.set(false);
    await settleBounded(rendered.fixture);

    expect({
      removed: rendered.removed.length,
      focused: document.activeElement === removeButton(rendered.host),
    }).toEqual({ removed: 1, focused: true });
  });

  it('Given the removal confirmed When it succeeds Then the focus goes to the drop zone', async () => {
    const rendered = await renderPortrait(STORED);

    await askRemoval(rendered);
    await answer(rendered, 'confirm');
    rendered.busy.set(true);
    await settle(rendered.fixture);
    rendered.portraitUrl.set(null);
    rendered.busy.set(false);
    await settleBounded(rendered.fixture);

    expect(
      document.activeElement?.closest('[data-testid="admin-profile-portrait-dropzone"]') !== null,
    ).toBe(true);
  });
});

describe('AdminProfilePortrait: fichier sans type connu du navigateur (revue F2-F7)', () => {
  it.each(['p.avif', 'P.AVIF', 'p.webp', 'p.png', 'p.jpg', 'p.JPEG'])(
    'Given %s dropped without MIME type When it is read Then its extension lets it through',
    async (name) => {
      const rendered = await renderPortrait(null);
      const file = new File(['x'], name, { type: '' });

      await drop(rendered, file);

      expect({ selected: rendered.selected, rejected: rendered.rejected.length }).toEqual({
        selected: [file],
        rejected: 0,
      });
    },
  );

  it.each(['p.gif', 'cv.pdf', 'sans-extension'])(
    'Given %s dropped without MIME type When it is read Then it is refused',
    async (name) => {
      const rendered = await renderPortrait(null);

      await drop(rendered, new File(['x'], name, { type: '' }));

      expect({ selected: rendered.selected.length, rejected: rendered.rejected.length }).toEqual({
        selected: 0,
        rejected: 1,
      });
    },
  );
});
