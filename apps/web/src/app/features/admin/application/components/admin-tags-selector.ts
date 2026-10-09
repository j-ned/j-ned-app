import { Component, ChangeDetectionStrategy, computed, input, model } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { blogTagPalette } from '@features/blog/application/blog-tag-palette';

type TagChip = { readonly tag: string; readonly selected: boolean; readonly classes: string };

@Component({
  selector: 'app-admin-tags-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <span class="field-label">Tags</span>
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
export class AdminTagsSelector implements FormValueControl<readonly string[]> {
  readonly availableTags = input.required<readonly string[]>();
  readonly value = model<readonly string[]>([]);

  protected readonly chips = computed((): readonly TagChip[] => {
    const selected = this.value();
    return this.availableTags().map((tag) => {
      const palette = blogTagPalette(tag);
      const isSelected = selected.includes(tag);
      return { tag, selected: isSelected, classes: isSelected ? palette.solid : palette.tint };
    });
  });

  protected toggleTag(tag: string): void {
    this.value.update((tags) =>
      tags.includes(tag) ? tags.filter((selected) => selected !== tag) : [...tags, tag],
    );
  }
}
