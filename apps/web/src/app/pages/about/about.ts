import { Component, signal } from '@angular/core';
import {
  PROFILE_INFO,
  SOCIAL_BUTTONS,
  QUICK_STATS,
  HIGHLIGHTS,
  BIOGRAPHY,
  EXPERIENCE,
  DIPLOMAS,
  PAGE_METADATA,
  WHAT_I_DO,
  WHAT_I_SEEK,
} from './data/about.data';
import { AboutHero } from './about-hero';
import { AboutStack } from './about-stack';
import { AboutSearch } from './about-search';
import { AboutDiploma } from './about-diploma';

@Component({
  selector: 'app-about',
  imports: [AboutHero, AboutStack, AboutSearch, AboutDiploma],
  template: `
    <main
      class="min-h-screen pt-20 pb-16 bg-gradient-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg h-full"
    >
      <section class="relative mb-10">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2">
              <app-about-hero />
            </div>
            <div class="lg:col-span-1">
              <app-about-stack />
            </div>
          </div>
        </div>
      </section>

      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <aside class="lg:col-span-1 space-y-8">
            <app-about-search />
            <app-about-diploma />
          </aside>

          <!-- Contenu principal -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Grosse card principale -->
            <div
              class="bg-gradient-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg space-y-8"
            >
              <!-- Mon parcours -->
              <div>
                <div class="flex items-center gap-2 mb-4">
                  <svg class="w-6 h-6 text-primary">
                    <use href="/icons/sprite.svg#lucide-user"></use>
                  </svg>
                  <h2 class="text-2xl font-bold text-foreground">{{ biography.title }}</h2>
                </div>
                <div class="space-y-3">
                  @for (paragraph of biography.paragraphs; track paragraph) {
                    <p class="text-muted text-sm leading-relaxed">{{ paragraph }}</p>
                  }
                </div>
              </div>

              <!-- Divider -->
              <div class="border-t border-foreground/10"></div>

              <!-- Ce que je fais -->
              <div>
                <div class="flex items-center gap-2 mb-4">
                  <svg class="w-6 h-6 text-primary">
                    <use href="/icons/sprite.svg#lucide-code-xml"></use>
                  </svg>
                  <h2 class="text-2xl font-bold text-foreground">Ce que je fais</h2>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (item of whatIDo(); track item.title) {
                    <div
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
                    </div>
                  }
                </div>
              </div>

              <!-- Divider -->
              <div class="border-t border-foreground/10"></div>

              <!-- Ce qui me caractérise -->
              <div>
                <div class="flex items-center gap-2 mb-5">
                  <svg class="w-6 h-6 text-primary">
                    <use href="/icons/sprite.svg#lucide-sparkles"></use>
                  </svg>
                  <h2 class="text-2xl font-bold text-foreground">Ce qui me caractérise</h2>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  @for (highlight of highlights(); track highlight.title) {
                    <div
                      class="bg-background/50 border border-foreground/10 rounded-xl p-4 hover:border-accent/50 hover:bg-accent/5 transition-all group"
                    >
                      <div
                        class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                      >
                        <svg class="w-5 h-5 text-accent">
                          <use [attr.href]="'/icons/sprite.svg#' + highlight.icon"></use>
                        </svg>
                      </div>
                      <h3
                        class="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors"
                      >
                        {{ highlight.title }}
                      </h3>
                      <p class="text-muted text-xs leading-relaxed">
                        {{ highlight.description }}
                      </p>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `,
})
export class About {
  protected readonly highlights = signal(HIGHLIGHTS);
  protected readonly biography = BIOGRAPHY;

  protected readonly whatIDo = signal(WHAT_I_DO);
}
