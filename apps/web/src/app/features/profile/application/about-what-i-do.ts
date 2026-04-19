import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { PROFILE_GATEWAY } from './tokens';

@Component({
  selector: 'app-about-what-i-do',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section>
      <header class="flex items-center gap-2 mb-4">
        <i class="pi pi-code text-2xl text-primary" aria-hidden="true"></i>
        <h2 class="text-2xl font-bold text-foreground">Ce que je fais</h2>
      </header>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (item of whatIDo(); track item.title) {
          <article
            class="bg-background/50 border border-foreground/10 rounded-xl p-4 hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <h3
              class="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors"
            >
              {{ item.title }}
            </h3>
            <p class="text-muted text-sm leading-relaxed">
              {{ item.description }}
            </p>
          </article>
        }
      </div>
    </section>
  `,
})
export class AboutWhatIDo {
  private readonly profileGateway = inject(PROFILE_GATEWAY);

  private readonly whatIDoResource = rxResource({
    stream: () => this.profileGateway.getWhatIDo(),
  });
  protected readonly whatIDo = computed(() => this.whatIDoResource.value() ?? []);
}
