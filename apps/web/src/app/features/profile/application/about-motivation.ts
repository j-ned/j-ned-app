import { Component, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProfileGateway } from '@features/profile/domain/gateways/profile.gateway';
import { SectionScroller } from '@core/navigation/section-scroller';
import { Button } from '@shared/ui/button';
import { AppIcon } from '@shared/icons/app-icon';

// Conclusion de la page : la motivation, puis deux sorties (projets, contact) au lieu d'une impasse.
@Component({
  selector: 'app-about-motivation',
  imports: [Button, AppIcon],
  host: { class: 'block border-t border-foreground/8' },
  template: `
    @let m = motivation();
    @if (m) {
      <section class="page-container py-26 md:py-34" aria-labelledby="motivation-heading">
        <h2 id="motivation-heading" class="font-mono text-[0.8125rem] font-medium text-muted">
          {{ m.title }}
        </h2>
        <p
          class="mt-4 max-w-[28ch] text-[clamp(1.75rem,3.6vw,3rem)] font-bold leading-[1.12] tracking-[-0.025em] text-balance"
          data-testid="motivation-statement"
        >
          {{ m.statement }}
        </p>
        <p class="mt-5 max-w-[56ch] text-[1.0625rem] text-muted">{{ m.description }}</p>
        <div class="mt-9 flex flex-wrap gap-3">
          <button appButton type="button" data-testid="about-cta-projects" (click)="goToProjects()">
            Voir les projets
            <app-icon name="arrow-right" [size]="20" />
          </button>
          <button
            appButton
            type="button"
            variant="outlined"
            data-testid="about-cta-contact"
            (click)="goToContact()"
          >
            Me contacter
          </button>
        </div>
      </section>
    }
  `,
})
export class AboutMotivation {
  private readonly _gateway = inject(ProfileGateway);
  private readonly _router = inject(Router);
  private readonly _scroller = inject(SectionScroller);

  private readonly motivationResource = rxResource({
    stream: () => this._gateway.getMotivation(),
  });
  protected readonly motivation = computed(() => this.motivationResource.value());

  protected goToProjects(): void {
    void this._router.navigate(['/projects']);
  }

  protected goToContact(): void {
    this._scroller.scrollTo('contact');
  }
}
