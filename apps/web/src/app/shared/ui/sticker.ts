import { Component, computed, input } from '@angular/core';

export type StickerTone = 'sage' | 'lavender';
export type StickerTilt = 'none' | 'left' | 'right';

const BASE_CLASSES =
  'inline-flex w-fit items-center rounded-full border-2 border-transparent px-3 py-1 font-display text-sm font-bold leading-tight forced-colors:border-[CanvasText]';

const TONE_CLASSES: Record<StickerTone, string> = {
  sage: 'bg-sticker-sage text-on-sticker-sage',
  lavender: 'bg-sticker-lavender text-on-sticker-lavender',
};

const TILT_CLASSES: Record<StickerTilt, string> = {
  none: '',
  left: '-rotate-2',
  right: 'rotate-2',
};

@Component({
  selector: 'app-sticker',
  host: { '[class]': 'classes()' },
  template: `<ng-content />`,
})
export class Sticker {
  readonly tone = input<StickerTone>('sage');
  readonly tilt = input<StickerTilt>('none');

  protected readonly classes = computed(() =>
    [BASE_CLASSES, TONE_CLASSES[this.tone()], TILT_CLASSES[this.tilt()]].filter(Boolean).join(' '),
  );
}
