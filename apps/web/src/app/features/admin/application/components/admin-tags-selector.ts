import { Component, ChangeDetectionStrategy, computed, input, model } from '@angular/core';
import { blogTagPalette } from '@features/blog/application/blog-tag-palette';

type TagChip = { readonly tag: string; readonly selected: boolean; readonly classes: string };

@Component({
  selector: 'app-admin-tags-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <span class="form-label">Tags</span>
    <div class="flex flex-wrap gap-2">
      @for (chip of chips(); track chip.tag) {
        <button
          type="button"
          data-testid="tag-chip"
          [attr.aria-pressed]="chip.selected"
          (click)="toggleTag(chip.tag)"
          class="inline-flex min-h-11 items-center px-3 py-2 rounded-lg text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          [class]="chip.classes"
        >
          {{ chip.tag }}
        </button>
      }
    </div>
  `,
})
export class AdminTagsSelector {
  readonly availableTags = input.required<readonly string[]>();
  readonly selectedTags = model.required<Set<string>>();

  protected readonly chips = computed((): readonly TagChip[] => {
    const selected = this.selectedTags();
    return this.availableTags().map((tag) => {
      const palette = blogTagPalette(tag);
      const isSelected = selected.has(tag);
      return { tag, selected: isSelected, classes: isSelected ? palette.solid : palette.tint };
    });
  });

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
