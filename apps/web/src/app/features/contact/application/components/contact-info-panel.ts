import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ContactInfo } from '@features/contact/domain/models/contact-info.model';
import type { SocialLinks } from '@features/contact/domain/models/social-link.model';
import { AppIcon } from '@shared/icons/app-icon';
import { AppIconTile } from '@shared/ui/icon-tile';

@Component({
  selector: 'app-contact-info-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [AppIcon, AppIconTile],
  template: `
    <aside
      class="bg-surface border border-foreground/10 rounded-2xl p-6 flex flex-col justify-between gap-6"
    >
      <address class="space-y-4 not-italic">
        <h3 class="text-xs font-semibold text-muted uppercase tracking-wider">Coordonnées</h3>

        <a
          [href]="'mailto:' + contactInfo().email"
          class="group flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/5 transition-colors duration-200"
        >
          <app-icon-tile class="bg-primary/10">
            <app-icon name="envelope" [size]="18" class="text-primary" />
          </app-icon-tile>
          <div class="min-w-0">
            <p class="text-xs text-muted">Email</p>
            <p
              class="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate"
            >
              {{ contactInfo().email }}
            </p>
          </div>
        </a>

        <a
          [href]="socialLinks().phone.url"
          class="group flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/5 transition-colors duration-200"
        >
          <app-icon-tile class="bg-accent/10">
            <app-icon name="phone" [size]="18" class="text-accent" />
          </app-icon-tile>
          <div>
            <p class="text-xs text-muted">Téléphone</p>
            <p
              class="text-sm font-medium text-foreground group-hover:text-accent transition-colors"
            >
              {{ contactInfo().phone }}
            </p>
          </div>
        </a>

        <div class="flex items-center gap-3 p-3 rounded-xl">
          <app-icon-tile class="bg-status-success/15">
            <app-icon name="map-marker" [size]="18" class="text-status-success" />
          </app-icon-tile>
          <div>
            <p class="text-xs text-muted">Localisation</p>
            <p class="text-sm font-medium text-foreground">
              {{ contactInfo().location }}
            </p>
          </div>
        </div>
      </address>
      <hr class="border-t border-foreground/10" />
      <div class="space-y-3">
        <h3 class="text-xs font-semibold text-muted uppercase tracking-wider">Retrouvez-moi</h3>
        <nav class="flex items-center gap-2" aria-label="Réseaux sociaux">
          @if (socialLinks().linkedin.url) {
            <a
              [href]="socialLinks().linkedin.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group icon-tile bg-foreground/5 border border-foreground/10 hover:border-primary/30 hover:bg-primary/10 transition-colors"
              [attr.aria-label]="socialLinks().linkedin.label"
            >
              <app-icon
                [name]="socialLinks().linkedin.icon"
                [size]="16"
                class="text-muted group-hover:text-primary transition-colors"
              />
            </a>
          }
          @if (socialLinks().github.url) {
            <a
              [href]="socialLinks().github.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group icon-tile bg-foreground/5 border border-foreground/10 hover:border-foreground/30 hover:bg-foreground/10 transition-colors"
              [attr.aria-label]="socialLinks().github.label"
            >
              <app-icon
                [name]="socialLinks().github.icon"
                [size]="16"
                class="text-muted group-hover:text-foreground transition-colors"
              />
            </a>
          }
          @if (socialLinks().twitter.url) {
            <a
              [href]="socialLinks().twitter.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group icon-tile bg-foreground/5 border border-foreground/10 hover:border-foreground/30 hover:bg-foreground/10 transition-colors"
              [attr.aria-label]="socialLinks().twitter.label"
            >
              <app-icon
                [name]="socialLinks().twitter.icon"
                [size]="16"
                class="text-muted group-hover:text-foreground transition-colors"
              />
            </a>
          }
          @if (socialLinks().email.url) {
            <a
              [href]="socialLinks().email.url"
              class="group icon-tile bg-foreground/5 border border-foreground/10 hover:border-primary/30 hover:bg-primary/10 transition-colors"
              [attr.aria-label]="socialLinks().email.label"
            >
              <app-icon
                [name]="socialLinks().email.icon"
                [size]="16"
                class="text-muted group-hover:text-primary transition-colors"
              />
            </a>
          }
          @if (socialLinks().phone.url) {
            <a
              [href]="socialLinks().phone.url"
              class="group icon-tile bg-foreground/5 border border-foreground/10 hover:border-accent/30 hover:bg-accent/10 transition-colors"
              [attr.aria-label]="socialLinks().phone.label"
            >
              <app-icon
                [name]="socialLinks().phone.icon"
                [size]="16"
                class="text-muted group-hover:text-accent transition-colors"
              />
            </a>
          }
        </nav>
      </div>
    </aside>
  `,
})
export class ContactInfoPanel {
  readonly contactInfo = input.required<ContactInfo>();
  readonly socialLinks = input.required<SocialLinks>();
}
