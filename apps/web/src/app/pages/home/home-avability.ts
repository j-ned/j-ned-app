import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HERO_DATA } from './data/home.data';

@Component({
  selector: 'app-home-avability',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div class="flex items-center gap-3 text-base justify-center lg:justify-start">
    <div class="relative flex h-3 w-3">
      <span
        class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
      ></span>
      <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
    </div>
    <span class="text-muted font-medium">
      {{ hero().availability }}
    </span>
  </div>`,
})
export class HomeAvability {
  protected readonly hero = signal(HERO_DATA);
}
