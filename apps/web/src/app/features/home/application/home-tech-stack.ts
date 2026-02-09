import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { HOME_GATEWAY } from '../domain';

@Component({
  selector: 'app-home-tech-stack',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block py-24 px-6 bg-white/5' },
  template: `
    <section class="max-w-5xl mx-auto">
      <header class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">Stack technique</h2>
        <p class="text-muted max-w-2xl mx-auto">
          Les technologies que j'utilise au quotidien pour concevoir des applications robustes et
          performantes.
        </p>
      </header>

      <ul class="grid grid-cols-3 md:grid-cols-6 gap-6 mb-12" role="list">
        @for (tech of techStack(); track tech.name) {
          <li
            class="p-4 flex flex-col items-center justify-center text-center rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/50 transition-colors group"
          >
            <div class="w-10 h-10 transition-colors">
              <img
                [ngSrc]="'/icons/' + tech.icon + '.svg'"
                [alt]="tech.name"
                width="32"
                height="32"
                class="w-8 h-8 group-hover:scale-110 transition-transform"
              />
            </div>
            <p class="text-xs text-muted mt-1">{{ tech.name }}</p>
          </li>
        }
      </ul>

      <aside
        class="max-w-3xl mx-auto p-6 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/50"
      >
        <h4 class="font-semibold mb-3 flex items-center gap-2">
          <svg class="w-5 h-5 text-primary">
            <use href="/icons/sprite.svg#lucide-zap"></use>
          </svg>
          Spécialisations
        </h4>
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
  private homeGateway = inject(HOME_GATEWAY);
  private techStackObservable = this.homeGateway.getTechStack();
  protected readonly techStack = toSignal(this.techStackObservable, { initialValue: [] });
  protected readonly specializations = [
    'Architecture Angular moderne',
    'APIs REST avec NestJS et PostgreSQL',
    'Infrastructure Docker et déploiement CI/CD',
    'Optimisation performance et SEO',
  ];
}
