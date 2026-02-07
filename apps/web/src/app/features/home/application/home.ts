import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HomeHeroSection } from './home-hero-section';
import { HomeProjects } from './home-projects';
import { HomeAboutSection } from './home-about-section';
import { HomeContactCta } from './home-contact-cta';
import { HomeBlog } from './home-blog';

@Component({
  selector: 'app-home',
  imports: [HomeHeroSection, HomeProjects, HomeAboutSection, HomeBlog, HomeContactCta],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-home-hero-section />
    <app-home-projects />
    <app-home-about-section />
    <app-home-blog />
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
