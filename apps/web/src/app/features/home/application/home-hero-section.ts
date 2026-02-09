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
      <app-home-speciality />
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
