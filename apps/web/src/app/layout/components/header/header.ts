import { Component, signal, effect, afterNextRender, ElementRef, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NAV_LINKS } from './nav-items';

@Component({
  selector: 'app-header',
  imports: [NgClass, RouterLink],
  host: {
    class:
      'fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5',
  },
  template: `
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <a
        routerLink="/"
        class="flex items-center gap-3 text-2xl font-display font-bold text-primary"
      >
        <div
          class="p-2 bg-linear-to-br from-primary/20 to-accent/20 rounded-lg border border-primary/30 hover:border-primary/50 transition-all"
        >
          <svg class="w-6 h-6">
            <use href="/icons/sprite.svg#lucide-code-xml"></use>
          </svg>
        </div>
        Julien<span class="text-primary">.N</span>
      </a>

      <nav class="hidden md:flex items-center gap-8">
        @for (item of navItems(); track item) {
          @if (item.href.startsWith('#')) {
            <a
              [href]="item.href"
              class="flex items-center gap-2 text-lg font-medium text-muted hover:text-primary transition-colors"
            >
              <svg class="w-5 h-5">
                <use [attr.href]="'/icons/sprite.svg#' + item.icons"></use>
              </svg>
              {{ item.label }}
            </a>
          } @else {
            <a
              [routerLink]="item.href"
              class="flex items-center gap-2 text-lg font-medium text-muted hover:text-primary transition-colors"
            >
              <svg class="w-5 h-5">
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
          class="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 group"
          aria-label="Toggle theme"
        >
          <svg
            [ngClass]="{ hidden: isDarkTheme() }"
            class="w-6 h-6 text-primary group-hover:text-primary/80 transition-colors"
          >
            <use href="/icons/sprite.svg#lucide-sun"></use>
          </svg>
          <svg
            [ngClass]="{ hidden: !isDarkTheme() }"
            class="w-6 h-6 text-primary group-hover:text-primary/80 transition-colors"
          >
            <use href="/icons/sprite.svg#lucide-moon"></use>
          </svg>
        </button>
        <a
          href="/docs/CV_JULIEN_NEDELLEC.pdf"
          download
          class="hidden md:flex items-center gap-2 px-5 py-2 bg-white/10 hover:bg-white/20 rounded-full text-md font-medium transition-colors"
        >
          <svg class="w-6 h-6 text-primary">
            <use href="/icons/sprite.svg#lucide-download"></use>
          </svg>
          Télécharger mon CV
        </a>
        <button
          (click)="toggleMobileMenu()"
          class="relative md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
          aria-label="Toggle menu"
        >
          <svg [ngClass]="{ hidden: isMobileMenuOpen() }" class="w-6 h-6 text-primary">
            <use href="/icons/sprite.svg#lucide-menu"></use>
          </svg>
          <svg [ngClass]="{ hidden: !isMobileMenuOpen() }" class="w-6 h-6 text-primary">
            <use href="/icons/sprite.svg#lucide-x"></use>
          </svg>
        </button>
      </div>
    </div>

    <div [ngClass]="{ hidden: !isMobileMenuOpen() }" class="md:hidden border-t border-white/5">
      <nav class="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
        @for (item of navItems(); track item) {
          @if (item.href.startsWith('#')) {
            <a
              [href]="item.href"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 text-lg font-medium text-muted hover:text-primary transition-colors"
            >
              <svg class="w-5 h-5">
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
              <svg class="w-5 h-5">
                <use [attr.href]="'/icons/sprite.svg#' + item.icons"></use>
              </svg>
              {{ item.label }}
            </a>
          }
        }
        <a
          href="/docs/CV_JULIEN_NEDELLEC.pdf"
          download
          (click)="closeMobileMenu()"
          class="flex items-center gap-3 text-lg font-medium text-primary hover:text-primary/80 transition-colors py-2 border-t border-white/5 pt-4 mt-2"
        >
          <svg class="w-5 h-5">
            <use href="/icons/sprite.svg#lucide-download"></use>
          </svg>
          Télécharger mon CV
        </a>
      </nav>
    </div>
  `,
})
export class Header {
  private readonly elementRef = inject(ElementRef);

  protected readonly navItems = signal(NAV_LINKS);
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly isDarkTheme = signal(true);

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

    const handleClick = (event: MouseEvent) => {
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

  protected toggleTheme(): void {
    this.isDarkTheme.update((value) => !value);
  }
}
