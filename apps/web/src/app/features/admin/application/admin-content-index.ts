import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

type ContentCard = {
  readonly icon: string;
  readonly label: string;
  readonly description: string;
  readonly route: string;
  readonly accent: string;
};

@Component({
  selector: 'app-admin-content-index',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="mb-10">
      <h1 class="text-3xl font-bold text-foreground mb-2">Contenu</h1>
      <p class="text-sm text-muted">Gestion des données dynamiques du portfolio.</p>
    </header>

    <ul class="grid grid-cols-1 md:grid-cols-3 gap-4" role="list">
      @for (card of cards; track card.route) {
        <li>
          <a
            [routerLink]="card.route"
            class="group flex items-start gap-4 bg-surface border border-foreground/10 rounded-xl p-6 hover:border-primary/40 hover:bg-primary/[0.02] transition-all"
          >
            <div
              class="w-12 h-12 shrink-0 rounded-lg flex items-center justify-center"
              [class]="card.accent"
            >
              <i class="text-2xl" [class]="card.icon" aria-hidden="true"></i>
            </div>
            <div class="min-w-0">
              <h3
                class="text-base font-semibold text-foreground group-hover:text-primary transition-colors"
              >
                {{ card.label }}
              </h3>
              <p class="text-xs text-muted leading-relaxed mt-1">{{ card.description }}</p>
            </div>
          </a>
        </li>
      }
    </ul>
  `,
})
export class AdminContentIndex {
  readonly cards: readonly ContentCard[] = [
    {
      icon: 'pi pi-desktop text-green-500',
      label: 'Projets',
      description: 'Ajouter, modifier ou supprimer des projets affichés sur le portfolio.',
      route: '/admin/content/projects',
      accent: 'bg-linear-to-br from-green-500/15 to-green-500/5',
    },
    {
      icon: 'pi pi-file-pdf text-purple-500',
      label: 'CV',
      description: 'Téléverser un nouveau CV (PDF) ou supprimer le CV actuel.',
      route: '/admin/content/cv',
      accent: 'bg-linear-to-br from-purple-500/15 to-purple-500/5',
    },
    {
      icon: 'pi pi-user text-primary',
      label: 'Photo de profil',
      description: 'Changer la photo affichée sur la page À propos.',
      route: '/admin/content/profile',
      accent: 'bg-linear-to-br from-primary/15 to-primary/5',
    },
  ];
}
