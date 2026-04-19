import { Component, signal, effect, afterNextRender, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Drawer } from 'primeng/drawer';
import { NAV_LINKS } from './nav-items';
import { AnalyticsService } from '@shared/analytics';
import { CvService } from '@shared/cv';
import { SiteSettingsService } from '@core/services';
import { PiIconPipe } from '@shared/icons';

const THEME_STORAGE_KEY = 'j-ned:theme';
type ThemePreference = 'dark' | 'light';

@Component({
  selector: 'app-header',
  imports: [RouterLink, Button, Drawer, PiIconPipe],
  host: {
    class:
      'fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5',
  },
  template: `
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <a routerLink="/" class="group flex items-center gap-4 hover:opacity-90 transition-opacity">
        <div
          class="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/15 border border-primary/25 text-primary text-base font-bold group-hover:bg-primary/20 group-hover:border-primary/40 transition-colors"
        >
          JN
        </div>
        <div class="flex items-baseline gap-0.5">
          <span class="text-2xl font-bold text-foreground tracking-tight">j-ned</span>
          <span class="text-2xl font-bold text-primary">.dev</span>
        </div>
      </a>

      <nav class="hidden md:flex items-center gap-8">
        @for (item of navItems(); track item) {
          @if (item.href === '/blog' && !siteSettings.blogEnabled()) {
            <span
              class="relative flex items-center gap-2 px-4 py-2 rounded-full cursor-not-allowed select-none bg-[repeating-linear-gradient(-45deg,#eab308_0px,#eab308_8px,#111_8px,#111_16px)] overflow-hidden"
            >
              <span
                class="relative flex items-center gap-2 px-2 py-0.5 rounded bg-black/80 text-yellow-400 text-xs font-bold uppercase tracking-wider"
              >
                <i class="text-base" [class]="item.icons | piIcon" aria-hidden="true"></i>
                Blog en construction
              </span>
            </span>
          } @else if (item.href.startsWith('#')) {
            <a
              [href]="item.href"
              class="flex items-center gap-2 text-lg font-medium text-muted hover:text-primary transition-colors"
            >
              <i class="text-xl" [class]="item.icons | piIcon" aria-hidden="true"></i>
              {{ item.label }}
            </a>
          } @else {
            <a
              [routerLink]="item.href"
              class="flex items-center gap-2 text-lg font-medium text-muted hover:text-primary transition-colors"
            >
              <i class="text-xl" [class]="item.icons | piIcon" aria-hidden="true"></i>
              {{ item.label }}
            </a>
          }
        }
      </nav>

      <div class="flex items-center gap-4">
        <p-button
          [rounded]="true"
          severity="secondary"
          [outlined]="true"
          [icon]="isDarkTheme() ? 'pi pi-moon' : 'pi pi-sun'"
          [ariaLabel]="isDarkTheme() ? 'Passer en mode clair' : 'Passer en mode sombre'"
          (onClick)="toggleTheme()"
        />
        @if (cvUrl()) {
          <a
            [href]="cvUrl()"
            target="_blank"
            rel="noopener noreferrer"
            (click)="trackCvDownload()"
            class="hidden md:inline-flex"
          >
            <p-button
              label="Télécharger mon CV"
              icon="pi pi-download"
              severity="secondary"
              [outlined]="true"
              [rounded]="true"
            />
          </a>
        }
        <p-button
          styleClass="md:!hidden"
          [rounded]="true"
          severity="secondary"
          [text]="true"
          [icon]="isMobileMenuOpen() ? 'pi pi-times' : 'pi pi-bars'"
          [ariaLabel]="isMobileMenuOpen() ? 'Fermer le menu' : 'Ouvrir le menu'"
          (onClick)="toggleMobileMenu()"
        />
      </div>
    </div>

    <p-drawer
      [visible]="isMobileMenuOpen()"
      (visibleChange)="isMobileMenuOpen.set($event)"
      position="right"
      styleClass="md:!hidden"
    >
      <ng-template #header>
        <span class="text-lg font-bold text-foreground">Menu</span>
      </ng-template>
      <nav class="flex flex-col gap-4">
        @for (item of navItems(); track item) {
          @if (item.href === '/blog' && !siteSettings.blogEnabled()) {
            <span
              class="relative flex items-center gap-2 px-4 py-2 rounded-full cursor-not-allowed select-none bg-[repeating-linear-gradient(-45deg,#eab308_0px,#eab308_8px,#111_8px,#111_16px)] overflow-hidden"
            >
              <span
                class="relative flex items-center gap-2 px-2 py-0.5 rounded bg-black/80 text-yellow-400 text-xs font-bold uppercase tracking-wider"
              >
                <i class="text-base" [class]="item.icons | piIcon" aria-hidden="true"></i>
                Blog en construction
              </span>
            </span>
          } @else if (item.href.startsWith('#')) {
            <a
              [href]="item.href"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 text-lg font-medium text-muted hover:text-primary transition-colors"
            >
              <i class="text-xl" [class]="item.icons | piIcon" aria-hidden="true"></i>
              {{ item.label }}
            </a>
          } @else {
            <a
              [routerLink]="item.href"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 text-lg font-medium text-muted hover:text-primary transition-colors"
            >
              <i class="text-xl" [class]="item.icons | piIcon" aria-hidden="true"></i>
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
            <i class="pi pi-download text-xl" aria-hidden="true"></i>
            Télécharger mon CV
          </a>
        }
      </nav>
    </p-drawer>
  `,
})
export class Header {
  private readonly analytics = inject(AnalyticsService);
  private readonly cvService = inject(CvService);
  protected readonly siteSettings = inject(SiteSettingsService);

  protected readonly navItems = signal(NAV_LINKS);
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly isDarkTheme = signal(Header.readStoredTheme() === 'dark');
  protected readonly cvUrl = signal<string | null>(null);

  private readonly _initTheme = afterNextRender(() => {
    this.applyTheme();
    this.loadCvUrl();
  });

  private readonly _syncTheme = effect(() => {
    const isDark = this.isDarkTheme();
    this.applyTheme();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    }
  });

  private static readStoredTheme(): ThemePreference {
    if (typeof localStorage === 'undefined') return 'dark';
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    // Fallback : préférence système si aucun choix explicite
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
    this.cvService.getCurrent().then((data) => {
      if (data) {
        this.cvUrl.set(this.cvService.getDownloadUrl());
      }
    });
  }
}
