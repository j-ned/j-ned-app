import { Directive, TemplateRef } from '@angular/core';

/**
 * Base abstraite pour toutes les colonnes admin.
 * Sert de token d'injection pour `contentChildren(AdminColumnBase)` côté table.
 * Chaque sous-classe expose son template + ses metadata via des méthodes
 * (et non via des `input()` typés directement, à cause du contrat strict
 * d'InputSignal qui interdit l'élargissement de type entre base et subclass).
 */
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
