import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HOME_GATEWAY } from '../../core/home/gateways';

@Component({
  selector: 'app-home-tech-stack',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h3 class="text-xl font-bold mb-6">Stack technique</h3>

      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        @for (tech of techStack(); track tech.name) {
          <div
            class="p-4 flex flex-col items-center justify-center text-center rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/50 transition-colors group"
          >
            <div class="w-10 h-10 transition-colors">
              <img
                [src]="'/icons/' + tech.icon + '.svg'"
                [alt]="tech.name"
                class="w-8 h-8 group-hover:scale-110 transition-transform"
              />
            </div>
            <span class="text-xs text-muted">{{ tech.category }}</span>
          </div>
        }
      </div>

      <div class="p-6 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/50">
        <h4 class="font-semibold mb-3 flex items-center gap-2">
          <svg class="w-5 h-5 text-primary">
            <use href="/icons/sprite.svg#lucide-zap"></use>
          </svg>
          Spécialisations
        </h4>
        <ul class="space-y-2 text-sm text-muted">
          @for (spec of aboutSection.specializations; track $index) {
            <li>• {{ spec }}</li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class HomeTechStack {
  private homeGateway = inject(HOME_GATEWAY);
  private techStackObservable = this.homeGateway.getTechStack();
  protected readonly techStack = toSignal(this.techStackObservable, { initialValue: [] });
  protected readonly aboutSection = {
    title: 'À propos',
    paragraphs: [
      "Développeur full-stack passionné par la création d'applications web modernes et performantes. Je me spécialise dans l'écosystème Angular et NestJS, avec un focus particulier sur l'architecture logicielle et les bonnes pratiques.",
      'Mon approche combine rigueur technique et pragmatisme : du code maintenable, des patterns éprouvés, et une infrastructure maîtrisée de bout en bout. De la conception à la mise en production.',
      "Actuellement disponible pour toutes vos missions de développement ou de refonte d'applications Angular/NestJS.",
    ],
    specializations: [
      'Architecture Angular moderne',
      'APIs REST avec NestJS et PostgreSQL',
      'Infrastructure Docker et déploiement CI/CD',
      'Optimisation performance et SEO',
    ],
  };
}
