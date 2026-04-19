import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

type ScheduleCard = {
  readonly icon: string;
  readonly label: string;
  readonly description: string;
  readonly route: string;
  readonly accent: string;
};

@Component({
  selector: 'app-admin-schedule-index',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="mb-10">
      <h1 class="text-3xl font-bold text-foreground mb-2">Agenda</h1>
      <p class="text-sm text-muted">Gestion des créneaux et des disponibilités</p>
    </header>

    <ul class="grid grid-cols-1 md:grid-cols-2 gap-4" role="list">
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
export class AdminScheduleIndex {
  readonly cards: readonly ScheduleCard[] = [
    {
      icon: 'pi pi-calendar text-cyan-500',
      label: 'Calendrier',
      description: 'Vue mensuelle de toutes les réservations reçues',
      route: '/admin/schedule/calendar',
      accent: 'bg-linear-to-br from-cyan-500/15 to-cyan-500/5',
    },
    {
      icon: 'pi pi-times-circle text-red-500',
      label: 'Disponibilités',
      description: 'Désactiver des dates (congés, indispo)',
      route: '/admin/schedule/availability',
      accent: 'bg-linear-to-br from-red-500/15 to-red-500/5',
    },
  ];
}
