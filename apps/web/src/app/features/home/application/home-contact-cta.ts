import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UiButton } from '@shared/ui';

@Component({
  selector: 'app-home-contact-cta',
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'contact', class: 'block' },
  template: `
    <div class="max-w-3xl mx-auto text-center">
      <span
        class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-5"
      >
        <i class="pi pi-calendar text-base" aria-hidden="true"></i>
        Discutons de votre projet
      </span>

      <h2
        class="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 leading-[1.2] pb-1"
        style="background: linear-gradient(135deg, var(--color-foreground) 40%, var(--color-primary) 100%); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;"
      >
        Un appel, un projet qui avance.
      </h2>

      <p class="text-base md:text-lg text-muted mb-10 leading-relaxed max-w-2xl mx-auto">
        30 minutes pour cerner votre besoin et vous proposer une approche concrète. Aucune
        préparation nécessaire de votre côté, juste une idée du problème à résoudre.
      </p>

      <div class="flex flex-col items-center gap-4">
        <app-ui-button severity="primary" size="large" (click)="goToBooking()">
          Réserver un appel découverte gratuit
          <i class="pi pi-calendar" aria-hidden="true"></i>
        </app-ui-button>

        <button
          type="button"
          (click)="goToContact()"
          class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors cursor-pointer"
        >
          ou envoyez-moi un message
          <i class="pi pi-arrow-right text-xs" aria-hidden="true"></i>
        </button>
      </div>

      <ul
        class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10 text-xs md:text-sm text-muted"
        role="list"
      >
        <li class="inline-flex items-center gap-1.5">
          <i class="pi pi-check-circle text-green-500" aria-hidden="true"></i>
          Réponse sous 24 h
        </li>
        <li class="inline-flex items-center gap-1.5">
          <i class="pi pi-check-circle text-green-500" aria-hidden="true"></i>
          Sans engagement
        </li>
        <li class="inline-flex items-center gap-1.5">
          <i class="pi pi-check-circle text-green-500" aria-hidden="true"></i>
          100 % gratuit
        </li>
      </ul>
    </div>
  `,
})
export class HomeContactCta {
  private readonly router = inject(Router);

  goToContact(): void {
    void this.router.navigate(['/contact']);
  }

  goToBooking(): void {
    void this.router.navigate(['/booking']);
  }
}
