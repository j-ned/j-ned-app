import { Component, inject, computed } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProfileGateway } from '@features/profile/domain/gateways/profile.gateway';
import { AppIcon } from '@shared/icons/app-icon';

const ROLE = 'développeur full-stack';
const STACK = 'Angular · NestJS · TypeScript';

@Component({
  selector: 'app-about-hero',
  imports: [NgOptimizedImage, AppIcon],
  host: { class: 'block' },
  template: `
    <section class="page-container pt-18 pb-22 md:pt-26 md:pb-30" aria-labelledby="about-heading">
      @let profile = profileInfo();
      @let bio = biography();
      @if (profile && bio) {
        <div class="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div>
            <p
              class="animate-fade-up flex flex-wrap gap-x-3.5 gap-y-1.5 font-mono text-[0.8125rem] text-muted"
            >
              <span class="text-primary">{{ role }}</span>
              <span>{{ stack }}</span>
              <span>{{ profile.location }}</span>
            </p>
            <h1
              id="about-heading"
              data-testid="about-title"
              class="mt-5 text-[clamp(2.5rem,5.6vw,5rem)] font-extrabold leading-[1.02] tracking-[-0.035em]"
            >
              {{ profile.displayName }}
            </h1>
            <p
              class="animate-fade-up [animation-delay:120ms] mt-7 max-w-[32ch] text-[clamp(1.25rem,2.1vw,1.75rem)] font-medium leading-snug tracking-tight text-balance"
              data-testid="about-lead"
            >
              {{ bio.lead }} <span class="text-primary">{{ bio.leadEmphasis }}</span>
            </p>
            <ul
              class="animate-fade-up [animation-delay:180ms] mt-8 flex flex-wrap gap-x-6 gap-y-2"
              aria-label="Réseaux et contact"
              role="list"
            >
              @for (social of socialLinks(); track social.id) {
                <li>
                  <a
                    [href]="social.href"
                    [attr.target]="social.external ? '_blank' : null"
                    [attr.rel]="social.external ? 'noopener noreferrer' : null"
                    class="group inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold transition-colors hover:text-primary"
                    data-testid="about-social-link"
                  >
                    <app-icon
                      [name]="social.icon"
                      [size]="18"
                      class="text-muted transition-colors group-hover:text-primary"
                    />
                    {{ social.label }}
                  </a>
                </li>
              }
            </ul>
          </div>
          <figure class="w-full max-w-80" data-testid="about-portrait">
            <div
              class="relative aspect-[4/5] overflow-hidden rounded-xl border border-foreground/8 bg-surface"
            >
              <img
                [ngSrc]="avatarUrl()"
                [alt]="'Portrait de ' + profile.displayName"
                fill
                priority
                sizes="20rem"
                class="object-cover"
              />
            </div>
          </figure>
        </div>
      } @else {
        <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]" aria-hidden="true">
          <div class="space-y-6 animate-pulse">
            <div class="h-4 w-80 max-w-full rounded bg-foreground/5"></div>
            <div class="h-16 md:h-20 max-w-xl rounded-lg bg-foreground/5"></div>
            <div class="h-24 max-w-lg rounded-lg bg-foreground/5"></div>
          </div>
          <div class="aspect-[4/5] w-full max-w-80 rounded-xl bg-foreground/5 animate-pulse"></div>
        </div>
      }
    </section>
  `,
})
export class AboutHero {
  private readonly _gateway = inject(ProfileGateway);

  protected readonly role = ROLE;
  protected readonly stack = STACK;

  private readonly profileResource = rxResource({
    stream: () => this._gateway.getProfileInfo(),
  });
  protected readonly profileInfo = computed(() => this.profileResource.value());
  protected readonly avatarUrl = computed(() => this.profileInfo()?.avatarUrl ?? '');

  private readonly biographyResource = rxResource({
    stream: () => this._gateway.getBiography(),
  });
  protected readonly biography = computed(() => this.biographyResource.value());

  private readonly socialButtonsResource = rxResource({
    stream: () => this._gateway.getSocialButtons(),
  });
  // `mailto:` ne s'ouvre pas dans un nouvel onglet : seuls les liens web sont externes.
  protected readonly socialLinks = computed(() =>
    (this.socialButtonsResource.value() ?? []).map((social) => ({
      ...social,
      external: social.href.startsWith('http'),
    })),
  );
}
