import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HomeHeroSection } from './home-hero-section';
import { HomeKeyNumbers } from './home-key-numbers';
import { HomeProjects } from './home-projects';
import { HomeTechStack } from './home-tech-stack';
import { HomeContactCta } from './home-contact-cta';
import { HomeBlog } from './home-blog';

@Component({
  selector: 'app-home',
  imports: [HomeHeroSection, HomeKeyNumbers, HomeProjects, HomeTechStack, HomeBlog, HomeContactCta],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <app-home-hero-section />
    @defer (on viewport) {
      <app-home-key-numbers />
    } @placeholder {
      <div class="block py-24 px-6 bg-white/5"></div>
    }
    @defer (on viewport) {
      <app-home-projects />
    } @placeholder {
      <div class="block py-24 px-6"></div>
    }
    @defer (on viewport) {
      <app-home-tech-stack />
    } @placeholder {
      <div class="block py-24 px-6"></div>
    }
    @defer (on viewport) {
      <app-home-blog />
    } @placeholder {
      <div class="block py-24 px-6"></div>
    }
    @defer (on viewport) {
      <app-home-contact-cta />
    } @placeholder {
      <div class="block py-24 px-6"></div>
    }
  `,
})
export class Home {
  private readonly document = inject(DOCUMENT);

  scrollTo(anchor: string): void {
    const el = this.document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
