import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-projects-hub',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-foreground">Projets</h1>
      <a
        routerLink="/admin/projects/all"
        class="px-4 py-2 rounded-lg bg-foreground/5 text-foreground text-sm font-medium hover:bg-foreground/10 border border-foreground/20 transition-colors"
      >
        Voir tous les projets
      </a>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      @for (card of cards; track card.slug) {
        <a
          [routerLink]="'/admin/projects/' + card.slug"
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
export class AdminProjectsHub {
  readonly cards = [
    { icon: 'lucide-globe', label: 'Application Web', slug: 'web' },
    { icon: 'lucide-smartphone', label: 'Application Mobile', slug: 'mobile' },
    { icon: 'lucide-server', label: 'API / Backend', slug: 'api' },
    { icon: 'lucide-terminal', label: 'Script', slug: 'script' },
    { icon: 'lucide-package', label: 'Package / Librairie', slug: 'package' },
    { icon: 'lucide-puzzle', label: 'Extension', slug: 'extension' },
    { icon: 'lucide-palette', label: 'Design / Maquette', slug: 'design' },
  ];
}
