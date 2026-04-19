import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

type ContentCard = {
  readonly icon: string;
  readonly label: string;
  readonly description: string;
  readonly route: string;
};

type ContentSection = {
  readonly title: string;
  readonly cards: readonly ContentCard[];
};

@Component({
  selector: 'app-admin-content-index',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="mb-10">
      <h1 class="text-3xl font-bold text-foreground mb-2">Contenu du site</h1>
      <p class="text-sm text-muted">
        Toutes les sections éditables : profil, projets, articles, technologies…
      </p>
    </header>

    @for (section of sections; track section.title) {
      <section class="mb-10">
        <h2
          class="text-xs font-semibold uppercase tracking-widest text-muted mb-4 pb-2 border-b border-foreground/5"
        >
          {{ section.title }}
        </h2>
        <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
          @for (card of section.cards; track card.route) {
            <li>
              <a
                [routerLink]="card.route"
                class="group flex items-start gap-4 bg-surface border border-foreground/10 rounded-xl p-5 hover:border-primary/40 hover:bg-primary/[0.02] transition-all"
              >
                <div
                  class="w-11 h-11 shrink-0 rounded-lg bg-linear-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:from-primary/25 group-hover:to-primary/10 transition-colors"
                >
                  <i class="text-xl text-primary" [class]="card.icon" aria-hidden="true"></i>
                </div>
                <div class="min-w-0">
                  <h3
                    class="text-sm font-semibold text-foreground group-hover:text-primary transition-colors"
                  >
                    {{ card.label }}
                  </h3>
                  <p class="text-xs text-muted leading-relaxed mt-1">{{ card.description }}</p>
                </div>
              </a>
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class AdminContentIndex {
  readonly sections: readonly ContentSection[] = [
    {
      title: 'Identité',
      cards: [
        {
          icon: 'pi pi-user',
          label: 'Hero',
          description: 'Nom, tagline, disponibilité affichés en haut du site',
          route: '/admin/content/hero',
        },
        {
          icon: 'pi pi-id-card',
          label: 'Profil',
          description: 'Photo, nom, localisation, message de disponibilité',
          route: '/admin/content/profile',
        },
        {
          icon: 'pi pi-book',
          label: 'Biographie',
          description: 'Votre histoire et parcours détaillé',
          route: '/admin/content/biography',
        },
        {
          icon: 'pi pi-file',
          label: 'CV',
          description: 'PDF téléchargeable depuis le site',
          route: '/admin/content/cv',
        },
      ],
    },
    {
      title: 'Expertise & compétences',
      cards: [
        {
          icon: 'pi pi-sparkles',
          label: "Points forts d'accueil",
          description: "Les 3 blocs affichés sur la page d'accueil",
          route: '/admin/content/home-highlights',
        },
        {
          icon: 'pi pi-star',
          label: 'Points forts (À propos)',
          description: 'Ce qui vous caractérise sur la page à propos',
          route: '/admin/content/highlights',
        },
        {
          icon: 'pi pi-briefcase',
          label: 'Ce que je fais',
          description: 'Vos spécialités et prestations techniques',
          route: '/admin/content/what-i-do',
        },
        {
          icon: 'pi pi-compass',
          label: 'Ce que je cherche',
          description: 'Aspirations professionnelles affichées',
          route: '/admin/content/what-i-seek',
        },
        {
          icon: 'pi pi-microchip',
          label: 'Technologies',
          description: 'Stack technique affichée sur À propos',
          route: '/admin/content/technologies',
        },
        {
          icon: 'pi pi-graduation-cap',
          label: 'Diplômes',
          description: 'Formations et certifications',
          route: '/admin/content/diplomas',
        },
      ],
    },
    {
      title: 'Portfolio',
      cards: [
        {
          icon: 'pi pi-desktop',
          label: 'Projets',
          description: 'Portfolio affiché sur la page Projets',
          route: '/admin/content/projects',
        },
        {
          icon: 'pi pi-credit-card',
          label: 'Prestations',
          description: 'Tarifs et services commerciaux',
          route: '/admin/content/services',
        },
      ],
    },
    {
      title: 'Publications',
      cards: [
        {
          icon: 'pi pi-pencil',
          label: 'Articles',
          description: 'Articles du blog publiés ou en brouillon',
          route: '/admin/content/articles',
        },
      ],
    },
    {
      title: 'Liens',
      cards: [
        {
          icon: 'pi pi-share-alt',
          label: 'Réseaux sociaux',
          description: 'Liens GitHub, LinkedIn, X, Discord…',
          route: '/admin/content/social',
        },
      ],
    },
  ];
}
