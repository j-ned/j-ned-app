import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ButtonComponent } from '@layout';
import { HOME_GATEWAY } from './tokens';

@Component({
  selector: 'app-home-services',
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section id="services">
      <header class="text-center mb-14">
        <span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-5">
          <svg aria-hidden="true" class="w-4 h-4">
            <use href="/icons/sprite.svg#lucide-briefcase"></use>
          </svg>
          Services
        </span>
        <h2
          class="text-3xl md:text-5xl font-extrabold tracking-tight mb-5"
          style="background: linear-gradient(135deg, var(--color-foreground) 40%, var(--color-primary) 100%); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;"
        >
          Mes prestations
        </h2>
        <p class="text-muted max-w-xl mx-auto text-base md:text-lg leading-relaxed">
          Des formules adaptées à vos besoins, du conseil technique au développement complet.
        </p>
      </header>

      <ul class="grid grid-cols-1 md:grid-cols-3 gap-8" role="list">
        @for (service of services(); track service.id) {
          <li
            class="relative flex flex-col p-8 rounded-xl border transition-all duration-300"
            [class]="
              !service.enabled
                ? 'border-foreground/10 bg-foreground/[0.02] opacity-80'
                : service.highlighted
                  ? 'border-primary/30 bg-foreground/[0.03] shadow-sm'
                  : 'border-foreground/10 bg-foreground/[0.03] hover:border-foreground/20'
            "
          >
            @if (!service.enabled) {
              <!-- Offre désactivée -->
              <div class="flex flex-col items-center justify-center text-center flex-1 py-8">
                <div
                  class="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-5"
                >
                  <svg class="w-8 h-8 text-amber-500" aria-hidden="true">
                    <use href="/icons/sprite.svg#lucide-wrench"></use>
                  </svg>
                </div>
                <h3 class="text-lg font-bold text-foreground mb-2">{{ service.title }}</h3>
                <p class="text-sm text-amber-500 font-semibold mb-2">Offre en cours de finalisation</p>
                <p class="text-xs text-muted max-w-[220px] leading-relaxed">
                  Cette prestation sera prochainement disponible. N'hésitez pas à me contacter pour en savoir plus.
                </p>
              </div>
            } @else {
              @if (service.highlighted) {
                <span
                  class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-[0.7rem] font-semibold tracking-wide uppercase rounded-full bg-primary text-white"
                >
                  Populaire
                </span>
              }

              <h3 class="text-xl font-bold mb-2">{{ service.title }}</h3>
              <p class="text-muted text-sm mb-4 leading-relaxed">{{ service.description }}</p>

              <p class="text-2xl font-semibold text-primary mb-6">{{ service.price }}</p>

              <ul class="space-y-2 mb-8 flex-1" role="list">
                @for (feature of service.features; track feature) {
                  <li class="flex items-start gap-2 text-sm text-muted">
                    <svg aria-hidden="true" class="w-4 h-4 text-primary mt-0.5 shrink-0">
                      <use href="/icons/sprite.svg#lucide-check"></use>
                    </svg>
                    {{ feature }}
                  </li>
                }
              </ul>

              <app-button
                [variant]="service.highlighted ? 'primary' : 'secondary'"
                size="md"
                radius="md"
                (clicked)="goToBooking()"
              >
                Réserver un appel
                <svg aria-hidden="true" class="w-5 h-5">
                  <use href="/icons/sprite.svg#lucide-calendar"></use>
                </svg>
              </app-button>
            }
          </li>
        }
      </ul>
    </section>
  `,
})
export class HomeServices {
  private readonly router = inject(Router);
  private readonly homeGateway = inject(HOME_GATEWAY);

  protected readonly services = toSignal(this.homeGateway.getServicePricing(), {
    initialValue: [],
  });

  goToBooking(): void {
    this.router.navigate(['/booking']);
  }
}
