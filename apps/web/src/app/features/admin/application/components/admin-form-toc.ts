import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { FormTocEntry } from '../form-toc-entries';

@Component({
  selector: 'app-admin-form-toc',
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    <nav data-testid="form-toc" aria-label="Sections du formulaire" class="border-t border-line">
      @for (section of sections(); track section.id) {
        <a
          data-testid="form-toc-link"
          routerLink="."
          [fragment]="section.id"
          class="flex min-h-11 items-center justify-between gap-3 border-b border-line text-sm text-muted hover:text-foreground"
        >
          <span data-testid="form-toc-label">{{ section.label }}</span>
          <span data-testid="form-toc-state" class="font-mono text-xs text-primary">{{
            section.state
          }}</span>
        </a>
      }
    </nav>
  `,
})
export class AdminFormToc {
  readonly sections = input.required<readonly FormTocEntry[]>();
}
