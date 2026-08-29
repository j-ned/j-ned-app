import { Directive, TemplateRef } from '@angular/core';

// Méthodes plutôt que input() : InputSignal interdit l'élargissement de type base/subclass.
@Directive()
export abstract class AdminColumnBase<T = unknown> {
  abstract getKey(): string;
  abstract getLabel(): string;
  abstract isSortable(): boolean;
  abstract getAlign(): 'left' | 'right';
  abstract getTpl(): TemplateRef<{ $implicit: T }>;
  getSortAccessor(): ((row: T) => unknown) | undefined {
    return undefined;
  }
}
