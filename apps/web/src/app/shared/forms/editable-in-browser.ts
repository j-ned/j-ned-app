import { Directive, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Une saisie avant que l'hydratation lie `[formField]` est effacée, ou lève NG0950 : rendu verrouillé.
@Directive({
  selector: 'fieldset[appEditableInBrowser]',
  host: { '[attr.disabled]': 'isBrowser ? null : ""' },
})
export class EditableInBrowser {
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
}
