import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProfileGateway } from '@features/profile/domain';
import { AppIcon } from '@shared/icons';

@Component({
  selector: 'app-about-what-i-do',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppIcon],
  host: {
    class:
      'block animate-fade-up bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6',
  },
  template: `
    <section>
      <header class="flex items-center gap-2 mb-4">
        <app-icon name="code" [size]="24" class="text-primary" />
        <h2 class="text-2xl font-bold text-foreground">Ce que je fais</h2>
      </header>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (item of whatIDo(); track item.id) {
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
  private readonly _gateway = inject(ProfileGateway);

  private readonly whatIDoResource = rxResource({
    stream: () => this._gateway.getWhatIDo(),
  });
  protected readonly whatIDo = computed(() => this.whatIDoResource.value() ?? []);
}
