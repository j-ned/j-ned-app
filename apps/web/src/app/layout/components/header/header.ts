import { Component, signal, effect, afterNextRender, ElementRef, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NAV_LINKS } from './nav-items';
import { AnalyticsService } from '@shared/analytics';
import { CvService } from '@shared/cv';
import { SiteSettingsService } from '@core/services';

@Component({
  selector: 'app-header',
  imports: [NgClass, RouterLink],
  host: {
    class:
      'fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5',
  },
  template: `
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <a routerLink="/" class="group flex items-center gap-4 hover:opacity-90 transition-opacity">
        <div
          class="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/15 border border-primary/25 text-primary text-base font-bold group-hover:bg-primary/20 group-hover:border-primary/40 transition-all"
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
                <svg aria-hidden="true" class="w-4 h-4">
                  <use [attr.href]="'/icons/sprite.svg#' + item.icons"></use>
                </svg>
                Blog en construction
              </span>
            </span>
          } @else if (item.href.startsWith('#')) {
            <a
              [href]="item.href"
              class="flex items-center gap-2 text-lg font-medium text-muted hover:text-primary transition-colors"
            >
              <svg aria-hidden="true" class="w-5 h-5">
                <use [attr.href]="'/icons/sprite.svg#' + item.icons"></use>
              </svg>
              {{ item.label }}
            </a>
          } @else {
            <a
              [routerLink]="item.href"
              class="flex items-center gap-2 text-lg font-medium text-muted hover:text-primary transition-colors"
            >
              <svg aria-hidden="true" class="w-5 h-5">
                <use [attr.href]="'/icons/sprite.svg#' + item.icons"></use>
              </svg>
              {{ item.label }}
            </a>
          }
        }
      </nav>

      <div class="flex items-center gap-4">
        <button
          (click)="toggleTheme()"
          class="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 hover:bg-primary/20 hover:border-primary/40 transition-all group"
          aria-label="Changer le thème"
        >
          <svg
            aria-hidden="true"
            [ngClass]="{ hidden: isDarkTheme() }"
            class="w-5 h-5 text-primary"
          >
            <use href="/icons/sprite.svg#lucide-sun"></use>
          </svg>
          <svg
            aria-hidden="true"
            [ngClass]="{ hidden: !isDarkTheme() }"
            class="w-5 h-5 text-primary"
          >
            <use href="/icons/sprite.svg#lucide-moon"></use>
          </svg>
        </button>
        <a
          [href]="cvUrl() ?? '#'"
          [class.pointer-events-none]="!cvUrl()"
          [class.opacity-0]="!cvUrl()"
          target="_blank"
          rel="noopener noreferrer"
          (click)="cvUrl() && trackCvDownload()"
          class="hidden md:flex items-center gap-2 px-5 py-2 bg-white/10 hover:bg-white/20 rounded-full text-md font-medium transition-all duration-300"
        >
          <svg aria-hidden="true" class="w-6 h-6 text-primary">
            <use href="/icons/sprite.svg#lucide-download"></use>
          </svg>
          Télécharger mon CV
        </a>
        <button
          (click)="toggleMobileMenu()"
          class="relative md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
          [attr.aria-label]="isMobileMenuOpen() ? 'Fermer le menu' : 'Ouvrir le menu'"
        >
          <svg
            aria-hidden="true"
            [ngClass]="{ hidden: isMobileMenuOpen() }"
            class="w-6 h-6 text-primary"
          >
            <use href="/icons/sprite.svg#lucide-menu"></use>
          </svg>
          <svg
            aria-hidden="true"
            [ngClass]="{ hidden: !isMobileMenuOpen() }"
            class="w-6 h-6 text-primary"
          >
            <use href="/icons/sprite.svg#lucide-x"></use>
          </svg>
        </button>
      </div>
    </div>

    <div [ngClass]="{ hidden: !isMobileMenuOpen() }" class="md:hidden border-t border-white/5">
      <nav class="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
        @for (item of navItems(); track item) {
          @if (item.href === '/blog' && !siteSettings.blogEnabled()) {
            <span
              class="relative flex items-center gap-2 px-4 py-2 rounded-full cursor-not-allowed select-none bg-[repeating-linear-gradient(-45deg,#eab308_0px,#eab308_8px,#111_8px,#111_16px)] overflow-hidden"
            >
              <span
                class="relative flex items-center gap-2 px-2 py-0.5 rounded bg-black/80 text-yellow-400 text-xs font-bold uppercase tracking-wider"
              >
                <svg aria-hidden="true" class="w-4 h-4">
                  <use [attr.href]="'/icons/sprite.svg#' + item.icons"></use>
                </svg>
                Blog en construction
              </span>
            </span>
          } @else if (item.href.startsWith('#')) {
            <a
              [href]="item.href"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 text-lg font-medium text-muted hover:text-primary transition-colors"
            >
              <svg aria-hidden="true" class="w-5 h-5">
                <use [attr.href]="'/icons/sprite.svg#' + item.icons"></use>
              </svg>
              {{ item.label }}
            </a>
          } @else {
            <a
              [routerLink]="item.href"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 text-lg font-medium text-muted hover:text-primary transition-colors"
            >
              <svg aria-hidden="true" class="w-5 h-5">
                <use [attr.href]="'/icons/sprite.svg#' + item.icons"></use>
              </svg>
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
            <svg aria-hidden="true" class="w-5 h-5">
              <use href="/icons/sprite.svg#lucide-download"></use>
            </svg>
            Télécharger mon CV
          </a>
        }
      </nav>
    </div>
  `,
})
export class Header {
  private readonly elementRef = inject(ElementRef);
  private readonly analytics = inject(AnalyticsService);
  private readonly cvService = inject(CvService);
  protected readonly siteSettings = inject(SiteSettingsService);

  protected readonly navItems = signal(NAV_LINKS);
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly isDarkTheme = signal(true);
  protected readonly cvUrl = signal<string | null>(null);

  constructor() {
    this.loadCvUrl();
  }

  private readonly _initTheme = afterNextRender(() => {
    document.documentElement.classList.add('dark');
  });

  private readonly _syncTheme = effect(() => {
    if (this.isDarkTheme()) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  private readonly _closeMenuOnOutsideClick = effect((onCleanup) => {
    if (!this.isMobileMenuOpen()) return;

    const handleClick = (event: MouseEvent): void => {
      if (!this.elementRef.nativeElement.contains(event.target)) {
        this.isMobileMenuOpen.set(false);
      }
    };

    setTimeout(() => document.addEventListener('click', handleClick), 0);
    onCleanup(() => document.removeEventListener('click', handleClick));
  });

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
