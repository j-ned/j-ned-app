import { Component, signal } from '@angular/core';
import {
  HERO_DATA,
  SPECIALITIES,
  PROJECTS_SECTION,
  ABOUT_SECTION,
  TECH_STACK,
  CTA_SECTION,
} from './data/home.data';
import { Button } from '../../components/button/button';

@Component({
  selector: 'app-home',
  imports: [Button],
  template: `
    <section class="relative py-28 md:py-48 px-6 min-h-screen flex items-center">
      <div class="max-w-7xl mx-auto w-full">
        <div class="mb-16 md:mb-20 text-center md:text-left">
          <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
            {{ hero.name }}
          </h1>

          <p class="text-xl md:text-3xl font-medium text-foreground/90 mb-4 leading-relaxed">
            {{ hero.tagline }}
            <span class="text-primary font-semibold">{{ hero.technologies[0] }}</span>
            et
            <span class="text-primary font-semibold">{{ hero.technologies[1] }}</span>
          </p>

          <p class="text-lg md:text-xl text-muted max-w-3xl leading-relaxed mx-auto md:mx-0">
            {{ hero.description }}
          </p>
        </div>

        <div
          class="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14 mb-16 md:mb-20 pb-12 md:pb-14 border-b border-white/10"
        >
          @for (speciality of specialities(); track speciality.title) {
            <div class="space-y-3 text-center md:text-left">
              <h3 class="text-sm font-bold uppercase tracking-widest text-primary">
                {{ speciality.title }}
              </h3>
              <p class="text-base text-muted leading-relaxed">
                {{ speciality.description }}
              </p>
            </div>
          }
        </div>

        <div
          class="flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-between gap-6"
        >
          <div
            class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-stretch sm:items-stretch"
          >
            <app-button href="#projects" size="lg" customClass="w-full sm:w-auto group">
              Voir mes réalisations
              <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform">
                <use href="/icons/sprite.svg#lucide-arrow-right"></use>
              </svg>
            </app-button>
            <app-button href="#contact" variant="accent" size="lg" customClass="w-full sm:w-auto">
              Me contacter
            </app-button>
          </div>

          <div class="flex items-center gap-3 text-base justify-center lg:justify-start">
            <div class="relative flex h-3 w-3">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
              ></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>
            <span class="text-muted font-medium">
              {{ hero.availability }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <section id="projects" class="py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-end justify-between mb-12">
          <div>
            <h2 class="text-3xl md:text-4xl font-bold mb-4">
              {{ projectsSection.title }}
            </h2>
            <p class="text-muted max-w-2xl">
              {{ projectsSection.description }}
            </p>
          </div>
          <a
            href="/projects"
            class="hidden md:inline-flex items-center gap-2 text-muted hover:text-primary transition-colors"
          >
            Tous mes projets →
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Placeholder pour les projets - à implémenter avec les vraies données -->
          <div
            class="p-6 rounded-lg bg-white/5 border border-white/10 hover:border-primary/50 transition-colors"
          >
            <div class="text-center text-muted">Projets à venir...</div>
          </div>
          <div
            class="p-6 rounded-lg bg-white/5 border border-white/10 hover:border-primary/50 transition-colors"
          >
            <div class="text-center text-muted">Projets à venir...</div>
          </div>
        </div>

        <div class="mt-8 text-center md:hidden">
          <a
            href="/projects"
            class="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors"
          >
            Tous mes projets →
          </a>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="py-20 px-6 bg-white/5">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <!-- About Content -->
          <div>
            <h2 class="text-3xl md:text-4xl font-bold mb-6">
              {{ aboutSection.title }}
            </h2>
            <div class="space-y-4 text-muted leading-relaxed">
              @for (paragraph of aboutSection.paragraphs; track $index) {
                <p>{{ paragraph }}</p>
              }
            </div>
            <div class="mt-8">
              <app-button href="/about" variant="accent"> En savoir plus </app-button>
            </div>
          </div>

          <!-- Tech Stack -->
          <div>
            <h3 class="text-xl font-bold mb-6">Stack technique</h3>

            <!-- Tech Grid -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              @for (tech of techStack(); track tech.name) {
                <div
                  class="p-4 flex flex-col items-center justify-center text-center rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/50 transition-colors group"
                >
                  <div class="w-10 h-10 mb-3 transition-colors">
                    <svg class="w-10 h-10 text-primary">
                      <use [attr.href]="'/icons/sprite.svg#' + tech.icon"></use>
                    </svg>
                  </div>
                  <span class="font-bold text-foreground hover:text-primary transition-colors">{{
                    tech.name
                  }}</span>
                  <span class="text-xs text-muted">{{ tech.category }}</span>
                </div>
              }
            </div>

            <!-- Specializations -->
            <div
              class="p-6 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/50"
            >
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
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section id="contact" class="py-20 px-6">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-6">
          {{ ctaSection.title }}
        </h2>
        <p class="text-lg text-muted mb-8 leading-relaxed">
          {{ ctaSection.description }}
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <app-button href="/contact" size="lg"> Discutons de votre projet </app-button>
          <app-button href="/calendar" variant="accent" size="lg">
            Prenez rendez-vous avec moi
          </app-button>
        </div>
      </div>
    </section>
  `,
})
export class Home {
  protected readonly hero = HERO_DATA;
  protected readonly specialities = signal(SPECIALITIES);
  protected readonly projectsSection = PROJECTS_SECTION;
  protected readonly aboutSection = ABOUT_SECTION;
  protected readonly techStack = signal(TECH_STACK);
  protected readonly ctaSection = CTA_SECTION;
}
