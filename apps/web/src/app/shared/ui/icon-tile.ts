import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type IconTileSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-icon-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
  },
  template: '<ng-content />',
})
export class AppIconTile {
  readonly size = input<IconTileSize>('md');

  protected readonly classes = computed(() => {
    const dims =
      this.size() === 'sm' ? 'h-9 w-9' : this.size() === 'lg' ? 'h-14 w-14' : 'h-11 w-11';
    return `inline-flex ${dims} shrink-0 items-center justify-center rounded-xl`;
  });
}
