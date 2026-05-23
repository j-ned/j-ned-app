import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProfileGateway } from '@features/profile/domain';
import { AppIcon } from '@shared/icons';

@Component({
  selector: 'app-about-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, AppIcon],
  host: {
    class:
      'block bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 h-full',
  },
  template: `
    @let profile = profileInfo();
    @if (profile) {
      <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
        <figure
          class="relative w-32 h-32 md:w-58 md:h-58 rounded-2xl overflow-hidden border-4 border-foreground/10 shrink-0"
        >
          <img
            [ngSrc]="avatarUrl()"
            [alt]="profile.displayName"
            class="w-full h-full object-cover"
            width="160"
            height="160"
            priority
          />
        </figure>

        <div class="flex-1 text-center md:text-left space-y-3">
          <h1 class="text-2xl md:text-3xl font-bold text-foreground mb-1">
            {{ profile.displayName }}
          </h1>
          <p class="text-lg text-muted">Développeur Angular | NestJS & Typescript</p>

          <div
            class="flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-3 text-sm"
          >
            <div class="flex items-center gap-2 text-muted">
              <app-icon name="map-marker" [size]="16" />
              <span>{{ profile.location }}</span>
            </div>
            <span class="hidden sm:inline text-foreground/20">•</span>
            <div class="flex items-center gap-2">
              <div class="relative flex h-2.5 w-2.5">
                <span
                  class="animate-ping motion-reduce:animate-none will-change-[transform,opacity] absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"
                ></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-success"></span>
              </div>
              <span class="text-status-success font-medium">{{ profile.availabilityMessage }}</span>
            </div>
          </div>

          <nav
            class="flex items-center justify-center md:justify-start gap-3 pt-4"
            aria-label="Réseaux sociaux"
          >
            @for (social of socialButtons(); track social.id) {
              <a
                [href]="social.href"
                target="_blank"
                rel="noopener noreferrer"
                class="group icon-tile bg-foreground/5 border border-foreground/10 hover:border-primary/50 hover:bg-primary/10 transition-colors"
                [attr.aria-label]="social.label"
              >
                <app-icon [name]="social.icon" [size]="18" class="text-muted group-hover:text-primary transition-colors" />
              </a>
            }
          </nav>
        </div>
      </div>
    }
  `,
})
export class AboutHero {
  private readonly _gateway = inject(ProfileGateway);

  private readonly profileResource = rxResource({
    stream: () => this._gateway.getProfileInfo(),
  });
  protected readonly profileInfo = computed(() => this.profileResource.value());
  protected readonly avatarUrl = computed(() => this.profileInfo()?.avatarUrl ?? '');

  private readonly socialButtonsResource = rxResource({
    stream: () => this._gateway.getSocialButtons(),
  });
  protected readonly socialButtons = computed(() => this.socialButtonsResource.value() ?? []);
}
