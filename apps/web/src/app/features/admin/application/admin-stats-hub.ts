import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-stats-hub',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Statistiques</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      @for (card of cards; track card.route) {
        <a
          [routerLink]="card.route"
          class="group bg-background border border-foreground/10 rounded-2xl p-6 shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300"
        >
          <div class="flex flex-col items-center text-center gap-3">
            <div
              class="w-14 h-14 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-colors"
            >
              <svg class="w-7 h-7 text-primary" aria-hidden="true">
                <use [attr.href]="'/icons/sprite.svg#' + card.icon" />
              </svg>
            </div>
            <h2 class="text-sm font-semibold text-foreground">{{ card.label }}</h2>
          </div>
        </a>
      }
    </div>
  `,
})
export class AdminStatsHub {
  readonly cards = [
    { icon: 'lucide-eye', label: "Vue d'ensemble", route: '/admin/stats/overview' },
    { icon: 'lucide-globe', label: 'Visites', route: '/admin/stats/visits' },
    { icon: 'lucide-notebook-pen', label: 'Articles', route: '/admin/stats/articles' },
    { icon: 'lucide-laptop', label: 'Projets', route: '/admin/stats/projects' },
  ];
}
