import { Component, ChangeDetectionStrategy, input, model } from '@angular/core';

@Component({
  selector: 'app-admin-project-tags-selector',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <span class="form-label">Tags</span>
    <div class="flex flex-wrap gap-2">
      @for (tag of availableTags(); track tag) {
        <button
          type="button"
          (click)="toggleTag(tag)"
          [class]="
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ' +
            (selectedTags().has(tag)
              ? 'bg-primary text-white border-primary'
              : 'bg-background text-foreground border-foreground/20 hover:border-primary/50')
          "
        >
          {{ tag }}
        </button>
      }
    </div>
  `,
})
export class AdminProjectTagsSelector {
  readonly availableTags = input.required<readonly string[]>();
  readonly selectedTags = model.required<Set<string>>();

  toggleTag(tag: string): void {
    const tags = new Set(this.selectedTags());
    if (tags.has(tag)) {
      tags.delete(tag);
    } else {
      tags.add(tag);
    }
    this.selectedTags.set(tags);
  }
}
