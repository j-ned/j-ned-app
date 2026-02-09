import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HomeHero } from './home-hero';
import { HomeSpeciality } from './home-speciality';
import { HomeCta } from './home-cta';
import { HomeAvailability } from './home-availability';

@Component({
  selector: 'app-home-hero-section',
  imports: [HomeHero, HomeSpeciality, HomeCta, HomeAvailability],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative block pt-28 pb-12 md:pt-48 md:pb-20 px-6 min-h-screen flex items-center',
  },
  template: `
    <div class="max-w-7xl mx-auto w-full">
      <app-home-hero />
      <ul
        class="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14 mb-16 md:mb-14 pb-12 md:pb-14 border-b border-white/10 min-h-50 md:min-h-37.5"
        role="list"
      >
        <app-home-speciality />
      </ul>
      <div
        class="flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-between gap-6"
      >
        <app-home-cta />
        <app-home-availability />
      </div>
    </div>
  `,
})
export class HomeHeroSection {}
