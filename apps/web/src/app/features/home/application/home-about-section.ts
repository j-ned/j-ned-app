import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HomeAbout } from './home-about';
import { HomeTechStack } from './home-tech-stack';

@Component({
  selector: 'app-home-about-section',
  imports: [HomeAbout, HomeTechStack],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block py-20 px-6 bg-white/5' },
  template: `
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        <app-home-about />
        <app-home-tech-stack />
      </div>
    </div>
  `,
})
export class HomeAboutSection {}
