import { Component, signal } from '@angular/core';
import { Button } from '../../components/button/button';
import {
  PROFILE_INFO,
  SOCIAL_BUTTONS,
  QUICK_STATS,
  HIGHLIGHTS,
  BIOGRAPHY,
  TECHNOLOGIES,
  EXPERIENCE,
  DIPLOMAS,
  PAGE_METADATA,
} from './data/about.data';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-about',
  imports: [Button, NgOptimizedImage],
  template: `
    <main class="min-h-screen pt-24 sm:pt-32 pb-16">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

          <!-- Sidebar -->
          <div class="lg:col-span-1 space-y-8">
            <!-- Photo + Social Links -->
            <div class="flex items-center gap-4">
              <!-- Photo de profil -->
              <div class="aspect-square bg-background/50 rounded-2xl overflow-hidden border border-foreground/10 flex-shrink-0 w-2/3">
                <img
                  [ngSrc]="profileInfo.avatarUrl"
                  [alt]="profileInfo.displayName"
                  class="w-full h-full object-cover"
                  width="200"
                  height="200"
                  priority
                />
              </div>

              <!-- Social Links (vertical) -->
              <div class="flex flex-col gap-3.5">
                @for (social of socialButtons(); track social.label) {
                  <a
                    [href]="social.href"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="p-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg border border-primary/30 hover:border-primary/50 transition-all hover:scale-110"
                    [attr.aria-label]="social.label"
                  >
                    <svg class="w-8 h-8">
                      <use [attr.href]="'/icons/sprite.svg#' + social.icon"></use>
                    </svg>
                  </a>
                }
              </div>
            </div>

            <!-- Formations -->
            <div class="space-y-6">
              <h3 class="font-bold text-lg text-foreground">Formations</h3>
              @for (diploma of diplomas(); track diploma.id) {
                <div
                  class="bg-background border border-foreground/10 rounded-2xl p-6 hover:border-accent/50 transition-all"
                >
                  <h4 class="text-lg font-bold text-foreground mb-2">
                    {{ diploma.title }}
                  </h4>
                  <p class="text-accent font-medium mb-2 text-sm">
                    {{ diploma.provider }}
                  </p>
                  <p class="text-muted text-xs mb-4">
                    {{ diploma.shortDescription }}
                  </p>

                  <div class="border-t border-foreground/10 pt-4">
                    <h5 class="text-xs font-semibold text-muted mb-3">Compétences acquises :</h5>
                    <div class="flex flex-wrap gap-2">
                      @for (skill of diploma.skills; track skill) {
                        <span
                          class="px-2 py-1 text-xs rounded-md bg-foreground/5 text-muted border border-foreground/10"
                        >
                          {{ skill }}
                        </span>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Contenu principal -->
          <div class="lg:col-span-2 space-y-16">

            <!-- Biographie -->
            <section>
              <h1 class="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                {{ biography.title }}
              </h1>
              <div class="prose prose-invert prose-lg max-w-none mb-8">
                @for (paragraph of biography.paragraphs; track paragraph) {
                  <p class="text-muted leading-relaxed mb-4">{{ paragraph }}</p>
                }
              </div>

              <!-- Statistiques rapides (horizontal) -->
              <div class="mt-8 flex items-center gap-6 flex-wrap">
                @for (stat of quickStats(); track stat.label) {
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-muted">{{ stat.label }}</span>
                    <span class="text-sm font-bold text-foreground px-3 py-1 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg border border-primary/30">
                      {{ stat.value }}
                    </span>
                  </div>
                }
              </div>

              <!-- Ma Stack (compact) -->
              <div class="mt-6">
                <h3 class="text-xl font-bold mb-4 text-foreground">Ma Stack</h3>
                <div class="flex flex-wrap gap-3">
                  @for (tech of technologies(); track tech.name) {
                    <div
                      class="bg-background border border-foreground/10 rounded-lg px-3 py-2 flex items-center gap-2 hover:border-accent/50 transition-all group"
                    >
                      <svg class="w-5 h-5 text-accent group-hover:scale-110 transition-transform">
                        <use [attr.href]="'/icons/sprite.svg#' + tech.icon"></use>
                      </svg>
                      <span class="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                        {{ tech.name }}
                      </span>
                    </div>
                  }
                </div>
              </div>
            </section>

            <!-- Mes atouts -->
            <section>
              <h2 class="text-3xl font-bold mb-8 text-foreground">Mes atouts</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                @for (highlight of highlights(); track highlight.title) {
                  <div
                    class="bg-background border border-foreground/10 rounded-xl p-4 hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/10 group"
                  >
                    <svg class="w-10 h-10 text-accent mb-3 group-hover:scale-110 transition-transform">
                      <use [attr.href]="'/icons/sprite.svg#' + highlight.icon"></use>
                    </svg>
                    <h3 class="text-base font-bold text-foreground mb-1.5">
                      {{ highlight.title }}
                    </h3>
                    <p class="text-muted text-xs leading-relaxed">
                      {{ highlight.description }}
                    </p>
                  </div>
                }
              </div>
            </section>

            <!-- Expérience -->
            <section>
              <h2 class="text-3xl font-bold mb-8 text-foreground">Expérience</h2>
              <div class="space-y-6">
                @for (job of experience(); track job.company) {
                  <div
                    class="flex flex-col md:flex-row md:items-center justify-between p-6 bg-background rounded-2xl border border-foreground/10 hover:border-accent/30 transition-all"
                  >
                    <div>
                      <h3 class="text-xl font-bold text-foreground">{{ job.role }}</h3>
                      <p class="text-accent font-medium">{{ job.company }}</p>
                    </div>
                    <span
                      class="mt-2 md:mt-0 text-sm text-muted bg-foreground/5 px-3 py-1 rounded-full w-fit"
                    >
                      {{ job.date }}
                    </span>
                  </div>
                }
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  `,
})
export class About {
  protected readonly profileInfo = PROFILE_INFO;
  protected readonly socialButtons = signal(SOCIAL_BUTTONS);
  protected readonly quickStats = signal(QUICK_STATS);
  protected readonly highlights = signal(HIGHLIGHTS);
  protected readonly biography = BIOGRAPHY;
  protected readonly technologies = signal(TECHNOLOGIES);
  protected readonly experience = signal(EXPERIENCE);
  protected readonly diplomas = signal(DIPLOMAS);
  protected readonly pageMetadata = PAGE_METADATA;
}
