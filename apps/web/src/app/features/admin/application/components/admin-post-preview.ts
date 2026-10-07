import { Component, computed, input } from '@angular/core';
import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { BlogPostRow } from '@features/blog/application/components/blog-post-row';
import { toBlogPostRowView } from '@features/blog/application/blog-list-view';

@Component({
  selector: 'app-admin-post-preview',
  imports: [BlogPostRow],
  host: { class: 'block' },
  template: `
    <section
      data-testid="admin-post-preview"
      aria-labelledby="admin-post-preview-title"
      class="rounded-sm border-[1.5px] border-line-strong"
    >
      <div
        class="flex items-center justify-between gap-3 border-b-[1.5px] border-line-strong bg-surface p-3.5 text-sm"
      >
        <div class="grid gap-0.5">
          <h2 id="admin-post-preview-title" class="font-display font-bold font-stretch-110%">
            Aperçu public
          </h2>
          <p data-testid="admin-post-preview-reference" class="font-mono text-xs text-muted">
            Blog · Liste des articles
          </p>
        </div>
        <p data-testid="admin-post-preview-live" class="font-mono text-xs text-muted">en direct</p>
      </div>
      @if (pendingCover()) {
        <p
          data-testid="admin-post-preview-pending-cover"
          class="border-b border-line px-4.5 py-2.5 text-[0.8125rem] text-muted"
        >
          Nouvelle couverture&nbsp;: visible ici après l'enregistrement.
        </p>
      }
      <div data-testid="admin-post-preview-body" inert class="bg-background px-4.5">
        <app-blog-post-row [post]="row()" />
      </div>
    </section>
  `,
})
export class AdminPostPreview {
  readonly post = input.required<BlogPost>();
  readonly pendingCover = input(false);

  protected readonly row = computed(() => toBlogPostRowView(this.post(), false));
}
