import { DestroyRef, Directive, PendingTasks, inject, signal } from '@angular/core';

const COPIED = 'Code copié dans le presse-papiers';
const FAILED = 'Copie impossible\u00a0: sélectionnez le code.';
const RESET_DELAY_MS = 2000;
const REANNOUNCE_DELAY_MS = 100;

async function writeToClipboard(text: string): Promise<boolean> {
  const clipboard: Clipboard | undefined = navigator.clipboard;
  if (!clipboard) return false;
  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// HTML injecté, jamais hydraté : clic délégué, libellé écrit dans le DOM.
@Directive({
  selector: '[appCodeCopy]',
  exportAs: 'appCodeCopy',
  host: { '(click)': 'copyFrom($event)' },
})
export class CodeCopy {
  private readonly _pendingTasks = inject(PendingTasks);

  private readonly _status = signal('');
  readonly status = this._status.asReadonly();

  private readonly _changedLabels = new Set<Element>();
  private _resetTimer: ReturnType<typeof setTimeout> | undefined;
  private _reannounceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this._resetTimer);
      clearTimeout(this._reannounceTimer);
    });
  }

  protected copyFrom(event: Event): void {
    const button =
      event.target instanceof Element ? event.target.closest('[data-code-copy]') : null;
    const code = button?.closest('[data-code-block]')?.querySelector('pre code');
    if (!button || !code) return;
    void this._pendingTasks.run(() => this.copy(code.textContent ?? '', button));
  }

  private async copy(text: string, button: Element): Promise<void> {
    const copied = await writeToClipboard(text);
    this.showOnButton(button, copied ? 'Copié' : 'Échec');
    this.announce(copied ? COPIED : FAILED);
  }

  private showOnButton(button: Element, text: string): void {
    const label = button.querySelector('[data-code-copy-label]');
    if (!label) return;
    label.textContent = text;
    this._changedLabels.add(label);
  }

  private announce(message: string): void {
    clearTimeout(this._reannounceTimer);
    if (this._status() === message) {
      // Vidé puis réécrit dans le même rendu, le texte ne change pas pour le lecteur d'écran.
      this._status.set('');
      this._reannounceTimer = setTimeout(() => this._status.set(message), REANNOUNCE_DELAY_MS);
    } else {
      this._status.set(message);
    }
    clearTimeout(this._resetTimer);
    this._resetTimer = setTimeout(() => this.reset(), RESET_DELAY_MS);
  }

  private reset(): void {
    clearTimeout(this._reannounceTimer);
    for (const label of this._changedLabels) label.textContent = 'Copier';
    this._changedLabels.clear();
    this._status.set('');
  }
}
