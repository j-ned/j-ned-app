import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button';
import { CTA_SECTION } from './data/home.data';

@Component({
  selector: 'app-home-contact-cta',
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="contact" class="py-20 px-6">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-6">
          {{ ctaSection().title }}
        </h2>
        <p class="text-lg text-muted mb-8 leading-relaxed">
          {{ ctaSection().description }}
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <app-button variant="primary" size="lg" radius="md" (clicked)="goToContact()">
            Discutons de votre projet
            <svg class="w-5 h-5">
              <use href="/icons/sprite.svg#lucide-mail"></use>
            </svg>
          </app-button>
          <app-button variant="accent" size="lg" radius="md" (clicked)="openCalendly()">
            Prenez rendez-vous avec moi
            <svg class="w-5 h-5">
              <use href="/icons/sprite.svg#lucide-notebook-pen"></use>
            </svg>
          </app-button>
        </div>
      </div>
    </section>
  `,
})
export class HomeContactCta implements OnInit {
  protected readonly ctaSection = signal(CTA_SECTION);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    // Initialization logic if needed
  }

  goToContact() {
    this.router.navigate(['/contact']);
  }

  openCalendly() {
    if (isPlatformBrowser(this.platformId)) {
      window.open('https://calendly.com/nedellec-julien/contact-telephonique', '_blank');
    }
  }
}
