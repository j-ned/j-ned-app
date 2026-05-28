import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type SkeletonTone = 'subtle' | 'strong';

@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class]': 'classes()',
  },
  template: '',
})
export class AppSkeleton {
  readonly tone = input<SkeletonTone>('subtle');

  protected readonly classes = computed(() =>
    this.tone() === 'strong' ? 'bg-foreground/10 animate-pulse' : 'bg-foreground/5 animate-pulse',
  );
}
