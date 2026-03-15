import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '@layout';

@Component({
  selector: 'app-home-contact-cta',
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'contact', class: 'block' },
  template: `
    <div class="max-w-3xl mx-auto text-center">
      <span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-5">
        <svg aria-hidden="true" class="w-4 h-4">
          <use href="/icons/sprite.svg#lucide-rocket"></use>
        </svg>
        Contact
      </span>
      <h2
        class="text-3xl md:text-5xl font-extrabold tracking-tight mb-5"
        style="background: linear-gradient(135deg, var(--color-foreground) 40%, var(--color-primary) 100%); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;"
      >
        {{ ctaSection().title }}
      </h2>
      <p class="text-base md:text-lg text-muted mb-8 leading-relaxed">
        {{ ctaSection().description }}
      </p>
      <nav class="flex flex-col sm:flex-row gap-4 justify-center" aria-label="Actions de contact">
        <app-button variant="primary" size="lg" radius="md" (clicked)="goToContact()">
          Discutons de votre projet
          <svg aria-hidden="true" class="w-5 h-5">
            <use href="/icons/sprite.svg#lucide-mail"></use>
          </svg>
        </app-button>
        <app-button variant="accent" size="lg" radius="md" (clicked)="goToBooking()">
          Prenez rendez-vous avec moi
          <svg aria-hidden="true" class="w-5 h-5">
            <use href="/icons/sprite.svg#lucide-calendar"></use>
          </svg>
        </app-button>
      </nav>
    </div>
  `,
})
export class HomeContactCta {
  private readonly router = inject(Router);

  protected readonly ctaSection = signal({
    title: 'Prêt à donner vie à votre projet ?',
    description:
      'Que ce soit pour une nouvelle application, une refonte ou un accompagnement technique, discutons ensemble de vos besoins et objectifs.',
  });

  goToContact(): void {
    this.router.navigate(['/contact']);
  }

  goToBooking(): void {
    this.router.navigate(['/booking']);
  }
}
