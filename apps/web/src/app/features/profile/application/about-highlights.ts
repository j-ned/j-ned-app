import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProfileGateway } from '@features/profile/domain/gateways/profile.gateway';
import { AppIcon } from '@shared/icons/app-icon';
import { AppIconTile } from '@shared/ui/icon-tile';

@Component({
  selector: 'app-about-highlights',
  imports: [AppIcon, AppIconTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'block animate-fade-up bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6',
  },
  template: `
    <section>
      <header class="flex items-center gap-2 mb-5">
        <app-icon name="sparkles" [size]="24" class="text-primary" />
        <h2 class="text-2xl font-bold text-foreground">Ce qui me caractérise</h2>
      </header>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        @for (highlight of highlights(); track highlight.id) {
          <article
            class="bg-background/50 border border-foreground/10 rounded-xl p-4 hover:border-accent/50 hover:bg-accent/5 transition-all group"
          >
            <app-icon-tile class="bg-accent/10 mb-3">
              <app-icon [name]="highlight.icon" [size]="22" class="text-accent" />
            </app-icon-tile>
            <h3
              class="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors"
            >
              {{ highlight.title }}
            </h3>
            <p class="text-muted text-xs leading-relaxed">
              {{ highlight.description }}
            </p>
          </article>
        }
      </div>
    </section>
  `,
})
export class AboutHighlights {
  private readonly _gateway = inject(ProfileGateway);

  private readonly highlightsResource = rxResource({
    stream: () => this._gateway.getHighlights(),
  });
  protected readonly highlights = computed(() => this.highlightsResource.value() ?? []);
}
