import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HomeHeroSection } from './home-hero-section';
import { HomeKeyNumbers } from './home-key-numbers';
import { HomeProjects } from './home-projects';
import { HomeTechStack } from './home-tech-stack';
import { HomeContactCta } from './home-contact-cta';
import { HomeBlog } from './home-blog';
import { HomeTestimonials } from './home-testimonials';

@Component({
  selector: 'app-home',
  imports: [
    HomeHeroSection,
    HomeKeyNumbers,
    HomeProjects,
    HomeTechStack,
    HomeBlog,
    HomeTestimonials,
    HomeContactCta,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <app-home-hero-section />
    <app-home-key-numbers />
    <app-home-projects />
    <app-home-tech-stack />
    <app-home-blog />
    <app-home-testimonials />
    <app-home-contact-cta />
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
