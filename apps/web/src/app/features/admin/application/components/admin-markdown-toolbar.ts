import {
  Component,
  ElementRef,
  computed,
  input,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { AppIcon } from '@shared/icons/app-icon';
import type { BlockLevel } from '../markdown-edit';
import { TOOLBAR_TOOLS, toolbarToolOf } from '../markdown-toolbar-controls';
import { nextToolbarIndex } from '../toolbar-focus';
import { AdminContentImageUpload } from './admin-content-image-upload';
import type { MarkdownEditor } from './markdown-editor';

const BLOCK_LEVELS: readonly BlockLevel[] = ['paragraph', 'h2', 'h3', 'h4'];

@Component({
  selector: 'app-admin-markdown-toolbar',
  imports: [AppIcon, AdminContentImageUpload],
  host: {
    class: 'block',
    '(keydown)': 'moveFocus($event)',
    '(focusin)': 'rememberFocus($event)',
  },
  template: `
    <div
      role="toolbar"
      data-testid="markdown-toolbar"
      aria-label="Mise en forme du contenu"
      [attr.aria-controls]="zoneId()"
      class="mb-2 flex flex-wrap items-center gap-1 border-b border-line pb-1.5"
    >
      <select
        #control
        data-testid="markdown-block-level"
        aria-label="Niveau du texte"
        class="app-select"
        [tabIndex]="activeIndex() === 0 ? 0 : -1"
        [value]="blockLevel()"
        (change)="chooseLevel($event)"
      >
        <option value="paragraph">Paragraphe</option>
        <option value="h2">Titre 2</option>
        <option value="h3">Titre 3</option>
        <option value="h4">Titre 4</option>
        <option value="" disabled>Autre titre</option>
      </select>
      <span aria-hidden="true" class="mx-1 h-6 w-px bg-line"></span>
      @for (tool of tools; track tool.id; let index = $index) {
        @if (tool.action; as action) {
          <button
            #control
            type="button"
            [attr.data-testid]="'markdown-tool-' + tool.id"
            [attr.aria-label]="tool.label"
            [attr.aria-keyshortcuts]="tool.shortcut"
            [tabIndex]="activeIndex() === index + 1 ? 0 : -1"
            class="inline-grid size-11 place-items-center rounded-md text-foreground hover:bg-surface-elevated"
            (click)="editor().apply(action)"
          >
            <app-icon [name]="tool.icon" [size]="16" />
          </button>
        } @else {
          <button
            #control
            #imageButton
            type="button"
            [attr.data-testid]="'markdown-tool-' + tool.id"
            [attr.aria-label]="tool.label"
            [attr.aria-expanded]="imagePanelOpen()"
            [attr.aria-controls]="imagePanelOpen() ? imagePanelId() : null"
            [tabIndex]="activeIndex() === index + 1 ? 0 : -1"
            class="inline-grid size-11 place-items-center rounded-md text-foreground hover:bg-surface-elevated aria-expanded:bg-surface-elevated"
            (click)="imagePanelOpen.set(!imagePanelOpen())"
          >
            <app-icon [name]="tool.icon" [size]="16" />
          </button>
        }
      }
    </div>
    @if (imagePanelOpen()) {
      <app-admin-content-image-upload
        [id]="imagePanelId()"
        [attr.id]="imagePanelId()"
        (inserted)="insertImage($event)"
        (cancelled)="closeImagePanel()"
      />
    }
    <p role="status" data-testid="markdown-toolbar-status" class="sr-only">
      @for (message of announcement(); track message) {
        <span>{{ message.text }}</span>
      }
    </p>
  `,
})
export class AdminMarkdownToolbar {
  readonly editor = input.required<MarkdownEditor>();

  private readonly _controls = viewChildren<ElementRef<HTMLElement>>('control');
  private readonly _imageButton = viewChild.required<ElementRef<HTMLElement>>('imageButton');

  protected readonly tools = TOOLBAR_TOOLS.map((tool) => ({
    ...tool,
    shortcut: tool.key && shortcutLabel(tool.key),
  }));
  protected readonly activeIndex = signal(0);
  protected readonly imagePanelOpen = signal(false);
  protected readonly zoneId = computed(() => this.editor().zoneId);
  protected readonly imagePanelId = computed(() => `${this.zoneId()}-image-panel`);
  protected readonly blockLevel = computed(() => this.editor().blockLevel() ?? '');
  // Un nouvel objet à chaque action recrée le nœud : la même phrase est annoncée de nouveau.
  protected readonly announcement = computed(() => {
    const applied = this.editor().applied();
    const tool = applied && toolbarToolOf(applied.action);
    return tool ? [{ text: applied.removed ? tool.removed : tool.applied }] : [];
  });

  protected insertImage(image: { readonly alt: string; readonly url: string }): void {
    this.editor().apply({ kind: 'image', ...image });
    this.imagePanelOpen.set(false);
  }

  protected closeImagePanel(): void {
    this.imagePanelOpen.set(false);
    this._imageButton().nativeElement.focus();
  }

  protected chooseLevel(event: Event): void {
    const select = event.target;
    if (!(select instanceof HTMLSelectElement)) return;
    const level = BLOCK_LEVELS.find((candidate) => candidate === select.value);
    if (!level) return;
    this.editor().apply({ kind: 'block-level', level });
    // Haut et Bas changent la valeur d'un select fermé : il garde le focus pour la suite.
    select.focus();
  }

  protected moveFocus(event: KeyboardEvent): void {
    const controls = this._controls().map(({ nativeElement }) => nativeElement);
    const current = controls.findIndex((control) => control === event.target);
    if (current < 0) return;
    const next = nextToolbarIndex(current, event.key, controls.length);
    if (next === null) return;
    event.preventDefault();
    controls[next].focus();
  }

  protected rememberFocus(event: FocusEvent): void {
    const index = this._controls().findIndex(({ nativeElement }) => nativeElement === event.target);
    if (index >= 0) this.activeIndex.set(index);
  }
}

function shortcutLabel(key: string): string {
  const letter = key.toUpperCase();
  return `Control+${letter} Meta+${letter}`;
}
