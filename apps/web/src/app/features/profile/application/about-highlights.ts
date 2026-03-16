import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { PROFILE_GATEWAY } from './tokens';

@Component({
  selector: 'app-about-highlights',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section>
      <header class="flex items-center gap-2 mb-5">
        <svg aria-hidden="true" class="w-6 h-6 text-primary">
          <use href="/icons/sprite.svg#lucide-sparkles"></use>
        </svg>
        <h2 class="text-2xl font-bold text-foreground">Ce qui me caractérise</h2>
      </header>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        @for (highlight of highlights(); track highlight.title) {
          <article
            class="bg-background/50 border border-foreground/10 rounded-xl p-4 hover:border-accent/50 hover:bg-accent/5 transition-all group"
          >
            <div
              class="w-10 h-10 rounded-lg bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
            >
              <svg aria-hidden="true" class="w-6 h-6 text-accent">
                <use [attr.href]="'/icons/sprite.svg#' + highlight.icon"></use>
              </svg>
            </div>
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
  private readonly profileGateway = inject(PROFILE_GATEWAY);

  private readonly highlightsResource = rxResource({
    stream: () => this.profileGateway.getHighlights(),
  });
  protected readonly highlights = computed(() => this.highlightsResource.value() ?? []);
}
