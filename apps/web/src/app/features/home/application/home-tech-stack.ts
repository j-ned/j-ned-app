import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { PROFILE_GATEWAY } from '@features/profile/application';

@Component({
  selector: 'app-home-tech-stack',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section class="max-w-5xl mx-auto">
      <header class="text-center mb-14">
        <span
          class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-5"
        >
          <svg aria-hidden="true" class="w-4 h-4">
            <use href="/icons/sprite.svg#lucide-layers"></use>
          </svg>
          Technologies
        </span>
        <h2
          class="text-3xl md:text-5xl font-extrabold tracking-tight mb-5"
          style="background: linear-gradient(135deg, var(--color-foreground) 40%, var(--color-primary) 100%); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;"
        >
          Stack technique
        </h2>
        <p class="text-muted max-w-xl mx-auto text-base md:text-lg leading-relaxed">
          Les technologies que j'utilise au quotidien pour concevoir des applications robustes et
          performantes.
        </p>
      </header>

      <ul class="grid grid-cols-3 md:grid-cols-6 gap-6 mb-12" role="list">
        @for (tech of techStack(); track tech.name) {
          <li
            class="p-4 flex flex-col items-center justify-center text-center rounded-xl bg-foreground/[0.03] border border-foreground/10 hover:border-foreground/20 transition-colors group"
          >
            <div class="w-10 h-10 transition-colors">
              <img
                [ngSrc]="'/icons/' + tech.icon + '.svg'"
                [alt]="tech.name"
                width="32"
                height="32"
                class="w-8 h-8 group-hover:scale-105 transition-transform"
              />
            </div>
            <p class="text-xs text-muted mt-1">{{ tech.name }}</p>
          </li>
        }
      </ul>

      <aside
        class="max-w-3xl mx-auto p-6 rounded-xl bg-foreground/[0.03] border border-foreground/10"
      >
        <h3 class="font-semibold mb-3 flex items-center gap-2">
          <svg aria-hidden="true" class="w-5 h-5 text-primary">
            <use href="/icons/sprite.svg#lucide-zap"></use>
          </svg>
          Spécialisations
        </h3>
        <ul class="space-y-2 text-sm text-muted">
          @for (spec of specializations; track $index) {
            <li>• {{ spec }}</li>
          }
        </ul>
      </aside>
    </section>
  `,
})
export class HomeTechStack {
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  protected readonly techStack = toSignal(this.profileGateway.getTechnologies(), {
    initialValue: [],
  });
  protected readonly specializations = [
    'Architecture Angular moderne',
    'APIs REST avec NestJS et PostgreSQL',
    'Infrastructure Docker et déploiement CI/CD',
    'Optimisation performance et SEO',
  ];
}
