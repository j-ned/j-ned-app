import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HERO_DATA } from './data/home.data';

@Component({
  selector: 'app-home-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-16 md:mb-20 text-center md:text-left">
      <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
        {{ hero().name }}
      </h1>

      <p class="text-xl md:text-3xl font-medium text-foreground/90 mb-4 leading-relaxed">
        {{ hero().tagline }}
        <span class="text-primary font-semibold">{{ hero().technologies[0] }}</span>
        et
        <span class="text-primary font-semibold">{{ hero().technologies[1] }}</span>
      </p>

      <p class="text-lg md:text-xl text-muted max-w-3xl leading-relaxed mx-auto md:mx-0">
        {{ hero().description }}
      </p>
    </div>
  `,
})
export class HomeHero {
  protected readonly hero = signal(HERO_DATA);
}
