import { Component, ElementRef, input, output, viewChild } from '@angular/core';
import { Button } from './button';

@Component({
  selector: 'app-load-error',
  imports: [Button],
  host: {
    role: 'alert',
    'data-testid': 'load-error',
    class: 'block py-12 text-center',
  },
  template: `
    <p data-testid="load-error-message" class="mb-4 text-lg text-muted">{{ message() }}</p>
    <button
      #retryButton
      appButton
      type="button"
      variant="outlined"
      data-testid="load-error-retry"
      (click)="retry.emit()"
    >
      Réessayer
    </button>
  `,
})
export class LoadError {
  readonly message = input.required<string>();
  readonly retry = output<void>();

  private readonly retryButton = viewChild.required<ElementRef<HTMLButtonElement>>('retryButton');

  focusRetry(): void {
    this.retryButton().nativeElement.focus();
  }
}
