import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, afterRenderEffect, inject, signal } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import {
  blockLevelAt,
  markdownEdit,
  type MarkdownAction,
  type MarkdownEdit,
} from '../markdown-edit';
import { shortcutAction } from '../markdown-shortcut';

type AppliedAction = { readonly action: MarkdownAction; readonly removed: boolean };

@Directive({
  selector: 'textarea[appMarkdownEditor]',
  exportAs: 'markdownEditor',
  host: {
    '(input)': 'readCaret()',
    '(select)': 'readCaret()',
    '(keyup)': 'readCaret()',
    '(pointerup)': 'readCaret()',
    '(focus)': 'readCaret()',
    '(keydown)': 'applyShortcut($event)',
  },
})
export class MarkdownEditor {
  private readonly _document = inject(DOCUMENT);
  private readonly _zone = inject<ElementRef<HTMLTextAreaElement>>(ElementRef).nativeElement;
  private readonly _field = inject(FormField, { self: true, optional: true });

  private readonly _blockLevel = signal(blockLevelAt('', 0));
  private readonly _applied = signal<AppliedAction | null>(null);

  readonly zoneId = this._zone.id;
  readonly blockLevel = this._blockLevel.asReadonly();
  readonly applied = this._applied.asReadonly();

  // [formField] écrit la valeur sans événement input, et Chromium met alors le curseur en fin de texte :
  // hors focus, il revient au début, où le menu de niveau et la barre s'accordent.
  private readonly _valueWritten = afterRenderEffect({
    write: () => {
      const value = this._field?.state().value();
      if (this._document.activeElement !== this._zone) this._zone.setSelectionRange(0, 0);
      return value;
    },
    read: (value) => {
      value();
      this.readCaret();
    },
  });

  apply(action: MarkdownAction): void {
    const zone = this._zone;
    const text = zone.value;
    const edit = markdownEdit(text, { start: zone.selectionStart, end: zone.selectionEnd }, action);
    zone.focus();
    if (text.slice(edit.from, edit.to) !== edit.text) this.write(edit);
    zone.setSelectionRange(edit.selection.start, edit.selection.end);
    this.readCaret();
    this._applied.set({ action, removed: edit.removed });
  }

  protected readCaret(): void {
    this._blockLevel.set(blockLevelAt(this._zone.value, this._zone.selectionStart));
  }

  protected applyShortcut(event: KeyboardEvent): void {
    const action = shortcutAction(event);
    if (!action) return;
    event.preventDefault();
    this.apply(action);
  }

  // insertText est la seule écriture qui entre dans la pile d'annulation native (Ctrl+Z).
  private write(edit: MarkdownEdit): void {
    const zone = this._zone;
    zone.setSelectionRange(edit.from, edit.to);
    const document = this._document;
    const inserted =
      typeof document.execCommand === 'function' &&
      document.execCommand('insertText', false, edit.text);
    if (inserted) return;
    zone.setRangeText(edit.text, edit.from, edit.to);
    zone.dispatchEvent(
      new InputEvent('input', { bubbles: true, inputType: 'insertText', data: edit.text }),
    );
  }
}
