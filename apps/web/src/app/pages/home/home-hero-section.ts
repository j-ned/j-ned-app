import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HomeHero } from './home-hero';
import { HomeSpeciality } from './home-speciality';
import { HomeCta } from './home-cta';
import { HomeAvability } from './home-avability';

@Component({
  selector: 'app-home-hero-section',
  imports: [HomeHero, HomeSpeciality, HomeCta, HomeAvability],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block py-28 md:py-48 px-6 min-h-screen flex items-center' },
  template: `
    <div class="max-w-7xl mx-auto w-full">
      <app-home-hero />
      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14 mb-16 md:mb-20 pb-12 md:pb-14 border-b border-white/10"
      >
        <app-home-speciality />
      </div>
      <div
        class="flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-between gap-6"
      >
        <app-home-cta />
        <app-home-avability />
      </div>
    </div>
  `,
})
export class HomeHeroSection {}
