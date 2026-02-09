import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-about',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">À propos</h1>

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
export class AdminAbout {
  readonly cards = [
    { icon: 'lucide-user', label: 'Profil', route: '/admin/about/profile' },
    { icon: 'lucide-book-open', label: 'Biographie', route: '/admin/about/biography' },
    { icon: 'lucide-graduation-cap', label: 'Diplômes', route: '/admin/about/diplomas' },
    { icon: 'lucide-star', label: 'Points forts', route: '/admin/about/highlights' },
    { icon: 'lucide-briefcase', label: 'Ce que je fais', route: '/admin/about/what-i-do' },
    { icon: 'lucide-search', label: 'Ce que je cherche', route: '/admin/about/what-i-seek' },
    { icon: 'lucide-share-2', label: 'Boutons sociaux', route: '/admin/about/social-buttons' },
    { icon: 'lucide-cpu', label: 'Technologies', route: '/admin/about/technologies' },
    { icon: 'lucide-file-text', label: 'CV', route: '/admin/about/cv' },
  ];
}
