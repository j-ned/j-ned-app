import { Component } from '@angular/core';

// Une `legend` flottante n'est plus la légende rendue du `fieldset` : seule façon d'en faire un élément de la grille.
@Component({
  selector: 'div[app-admin-setting-row], fieldset[app-admin-setting-row]',
  host: {
    class:
      'grid min-w-0 gap-x-6 gap-y-1 border-b border-line py-4.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center [&>legend]:float-left [&>:is(h3,legend)]:font-display [&>:is(h3,legend)]:text-[1.03125rem] [&>:is(h3,legend)]:font-bold [&>:is(h3,legend)]:font-stretch-104% [&>p]:max-w-[60ch] [&>p]:text-sm [&>p]:text-muted [&>:last-child]:mt-3 sm:[&>:last-child]:col-start-2 sm:[&>:last-child]:row-span-2 sm:[&>:last-child]:row-start-1 sm:[&>:last-child]:mt-0',
  },
  template: `<ng-content />`,
})
export class AdminSettingRow {}
