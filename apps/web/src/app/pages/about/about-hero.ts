import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { PROFILE_INFO, SOCIAL_BUTTONS } from './data/about.data';

@Component({
  selector: 'app-about-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
  template: `
    <div
      class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg h-full"
    >
      <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
        <div
          class="relative w-32 h-32 md:w-58 md:h-58 rounded-2xl overflow-hidden border-4 border-foreground/10 shadow-xl shrink-0"
        >
          <img
            [ngSrc]="profileInfo().avatarUrl"
            [alt]="profileInfo().displayName"
            class="w-full h-full object-cover"
            width="160"
            height="160"
            priority
          />
        </div>

        <!-- Informations -->
        <div class="flex-1 text-center md:text-left space-y-3">
          <!-- Nom -->
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-foreground mb-1">
              {{ profileInfo().displayName }}
            </h1>
            <p class="text-lg text-muted">Développeur Angular | NestJS & Typescript</p>
          </div>

          <!-- Localisation et disponibilité -->
          <div
            class="flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-3 text-sm"
          >
            <div class="flex items-center gap-2 text-muted">
              <svg class="w-4 h-4">
                <use href="/icons/sprite.svg#lucide-map-pin"></use>
              </svg>
              <span>{{ profileInfo().location }}</span>
            </div>
            <span class="hidden sm:inline text-foreground/20">•</span>
            <div class="flex items-center gap-2">
              <div class="relative flex h-2.5 w-2.5">
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                ></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </div>
              <span class="text-green-500 font-medium">{{
                profileInfo().availabilityMessage
              }}</span>
            </div>
          </div>

          <!-- Réseaux sociaux -->
          <div class="flex items-center justify-center md:justify-start gap-3 pt-2">
            @for (social of socialButtons(); track social.label) {
              <a
                [href]="social.href"
                target="_blank"
                rel="noopener noreferrer"
                class="p-2.5 bg-foreground/5 rounded-lg border border-foreground/10 hover:border-primary/50 hover:bg-primary/10 transition-all hover:scale-110 group"
                [attr.aria-label]="social.label"
              >
                <svg class="w-5 h-5 text-muted group-hover:text-primary transition-colors">
                  <use [attr.href]="'/icons/sprite.svg#' + social.icon"></use>
                </svg>
              </a>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AboutHero {
  protected readonly profileInfo = signal(PROFILE_INFO);
  protected readonly socialButtons = signal(SOCIAL_BUTTONS);
}
