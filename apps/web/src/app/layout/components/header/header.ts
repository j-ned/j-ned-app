import {
  ChangeDetectionStrategy,
  Component,
  signal,
  effect,
  afterNextRender,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NAV_LINKS } from './nav-items';
import { ANALYTICS_GATEWAY } from '@shared/analytics';
import { firstValueFrom } from 'rxjs';
import { CV_GATEWAY } from '@shared/cv';
import { AppIcon } from '@shared/icons';
import { UiButton, UiDrawer } from '@shared/ui';

const THEME_STORAGE_KEY = 'j-ned:theme';
type ThemePreference = 'dark' | 'light';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AppIcon, UiButton, UiDrawer],
  styles: `
    .nav-surface {
      border-bottom: 1px solid var(--theme-nav-border);
      box-shadow: var(--theme-nav-shadow);
    }
  `,
  template: `
    <div class="nav-surface fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <a routerLink="/" class="group flex items-center gap-4 hover:opacity-90 transition-opacity">
          <div
            class="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/15 border border-primary/25 text-primary text-base font-bold group-hover:bg-primary/20 group-hover:border-primary/40 transition-colors"
          >
            JN
          </div>
          <div class="flex items-baseline gap-0.5">
            <span class="text-2xl font-bold text-foreground tracking-tight">Julien </span>
            <span class="text-2xl font-bold text-primary">N.</span>
          </div>
        </a>

        <nav class="hidden md:flex items-center gap-8" aria-label="Navigation principale">
          @for (item of navItems(); track item) {
            @if (item.href.startsWith('#')) {
              <a
                [href]="item.href"
                class="flex items-center gap-2 text-lg font-medium text-muted hover:text-primary transition-colors"
              >
                <app-icon [name]="item.icons" [size]="20" />
                {{ item.label }}
              </a>
            } @else {
              <a
                [routerLink]="item.href"
                [fragment]="item.fragment"
                class="flex items-center gap-2 text-lg font-medium text-muted hover:text-primary transition-colors"
              >
                <app-icon [name]="item.icons" [size]="20" />
                {{ item.label }}
              </a>
            }
          }
        </nav>

        <div class="flex items-center gap-4">
          <app-ui-button
            variant="outlined"
            severity="secondary"
            [rounded]="true"
            [ariaLabel]="isDarkTheme() ? 'Passer en mode clair' : 'Passer en mode sombre'"
            (click)="toggleTheme()"
          >
            <app-icon [name]="isDarkTheme() ? 'moon' : 'sun'" [size]="16" />
          </app-ui-button>

          @if (cvUrl()) {
            <a
              [href]="cvUrl()"
              target="_blank"
              rel="noopener noreferrer"
              (click)="trackCvDownload()"
              class="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground/15 text-foreground text-sm font-medium hover:bg-foreground/5 hover:border-foreground/30 transition-colors"
            >
              <app-icon name="download" />
              Télécharger mon CV
            </a>
          }

          <app-ui-button
            class="md:hidden"
            variant="text"
            severity="secondary"
            [rounded]="true"
            [ariaLabel]="isMobileMenuOpen() ? 'Fermer le menu' : 'Ouvrir le menu'"
            (click)="toggleMobileMenu()"
          >
            <app-icon [name]="isMobileMenuOpen() ? 'times' : 'bars'" [size]="20" />
          </app-ui-button>
        </div>
      </div>
    </div>

    <app-ui-drawer
      class="md:hidden"
      [(visible)]="isMobileMenuOpen"
      position="right"
      heading="Menu"
      ariaLabel="Menu de navigation"
    >
      <nav class="flex flex-col gap-4" aria-label="Navigation mobile">
        @for (item of navItems(); track item) {
          @if (item.href.startsWith('#')) {
            <a
              [href]="item.href"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 text-lg font-medium text-muted hover:text-primary transition-colors"
            >
              <app-icon [name]="item.icons" [size]="20" />
              {{ item.label }}
            </a>
          } @else {
            <a
              [routerLink]="item.href"
              [fragment]="item.fragment"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 text-lg font-medium text-muted hover:text-primary transition-colors"
            >
              <app-icon [name]="item.icons" [size]="20" />
              {{ item.label }}
            </a>
          }
        }
        @if (cvUrl()) {
          <a
            [href]="cvUrl()"
            target="_blank"
            rel="noopener noreferrer"
            (click)="trackCvDownload(); closeMobileMenu()"
            class="flex items-center gap-3 text-lg font-medium text-primary hover:text-primary/80 transition-colors py-2 border-t border-white/5 pt-4 mt-2"
          >
            <app-icon name="download" [size]="20" />
            Télécharger mon CV
          </a>
        }
      </nav>
    </app-ui-drawer>
  `,
})
export class Header {
  private readonly analytics = inject(ANALYTICS_GATEWAY);
  private readonly cvService = inject(CV_GATEWAY);

  protected readonly navItems = signal(NAV_LINKS);
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly isDarkTheme = signal(Header.readStoredTheme() === 'dark');
  protected readonly cvUrl = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      this.applyTheme();
      this.loadCvUrl();
    });

    effect(() => {
      const isDark = this.isDarkTheme();
      this.applyTheme();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
      }
    });
  }

  private static readStoredTheme(): ThemePreference {
    if (typeof localStorage === 'undefined') return 'dark';
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
  }

  private applyTheme(): void {
    if (typeof document === 'undefined') return;
    if (this.isDarkTheme()) {
      document.documentElement.classList.add('app-dark');
    } else {
      document.documentElement.classList.remove('app-dark');
    }
  }

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((value) => !value);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  protected trackCvDownload(): void {
    this.analytics.trackCvDownload();
  }

  protected toggleTheme(): void {
    this.isDarkTheme.update((value) => !value);
  }

  private loadCvUrl(): void {
    firstValueFrom(this.cvService.getCurrent()).then((data) => {
      if (data) {
        this.cvUrl.set(this.cvService.getDownloadUrl());
      }
    });
  }
}
