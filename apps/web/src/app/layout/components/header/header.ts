import {
  ChangeDetectionStrategy,
  Component,
  signal,
  effect,
  afterNextRender,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_LINKS } from './nav-items';
import { AnalyticsGateway } from '@features/analytics/domain';
import { firstValueFrom } from 'rxjs';
import { CvGateway } from '@features/cv/domain';
import { SectionScroller } from '@core/navigation/section-scroller';
import { ActiveSection } from '@core/navigation/active-section';
import { AppIcon } from '@shared/icons';
import { Button, Drawer, AppIconTile } from '@shared/ui';

const THEME_STORAGE_KEY = 'j-ned:theme';
type ThemePreference = 'dark' | 'light';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, AppIcon, Button, Drawer, AppIconTile],
  template: `
    <div class="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-nav-border shadow-nav">
      <div class="page-container h-20 flex items-center justify-between">
        <a
          routerLink="/"
          (click)="scrollToTop()"
          aria-label="Retour en haut de la page d'accueil"
          class="group flex items-center gap-4 hover:opacity-90 transition-opacity"
        >
          <app-icon-tile
            class="bg-primary/15 border border-primary/25 text-primary text-base font-bold group-hover:bg-primary/20 group-hover:border-primary/40 transition-colors"
          >
            JN
          </app-icon-tile>
          <div class="flex items-baseline gap-0.5">
            <span class="text-2xl font-bold text-foreground tracking-tight">Julien </span>
            <span class="text-2xl font-bold text-primary">N.</span>
          </div>
        </a>

        <nav class="hidden md:flex items-center gap-8" aria-label="Navigation principale">
          @for (item of navItems; track item.label) {
            @if (item.kind === 'route') {
              <a
                [routerLink]="item.href"
                routerLinkActive="is-link-active text-primary"
                class="group relative flex items-center gap-2 text-lg font-medium text-muted hover:text-primary transition-colors"
              >
                <app-icon [name]="item.icons" [size]="20" />
                {{ item.label }}
                <span class="nav-underline" aria-hidden="true"></span>
              </a>
            } @else {
              <button
                type="button"
                (click)="scrollToSection(item.sectionId)"
                [class.is-link-active]="activeKey() === item.sectionId"
                [class.text-primary]="activeKey() === item.sectionId"
                class="group relative flex items-center gap-2 text-lg font-medium text-muted hover:text-primary transition-colors"
              >
                <app-icon [name]="item.icons" [size]="20" />
                {{ item.label }}
                <span class="nav-underline" aria-hidden="true"></span>
              </button>
            }
          }
        </nav>

        <div class="flex items-center gap-4">
          <app-button
            variant="outlined"
            severity="secondary"
            [rounded]="true"
            [ariaLabel]="isDarkTheme() ? 'Passer en mode clair' : 'Passer en mode sombre'"
            (click)="toggleTheme()"
          >
            <app-icon [name]="isDarkTheme() ? 'moon' : 'sun'" [size]="16" />
          </app-button>

          @if (cvUrl()) {
            <a
              [href]="cvUrl()"
              target="_blank"
              rel="noopener noreferrer"
              (click)="trackCvDownload()"
              class="hidden md:inline-flex items-center gap-2 min-h-11 px-4 py-2 rounded-full border border-foreground/15 text-foreground text-sm font-medium hover:bg-foreground/5 hover:border-foreground/30 transition-colors"
            >
              <app-icon name="download" />
              Télécharger mon CV
            </a>
          }

          <app-button
            class="md:hidden"
            variant="text"
            severity="secondary"
            [rounded]="true"
            [ariaLabel]="isMobileMenuOpen() ? 'Fermer le menu' : 'Ouvrir le menu'"
            (click)="toggleMobileMenu()"
          >
            <app-icon [name]="isMobileMenuOpen() ? 'times' : 'bars'" [size]="20" />
          </app-button>
        </div>
      </div>
    </div>

    <app-drawer
      class="md:hidden"
      [(visible)]="isMobileMenuOpen"
      position="right"
      heading="Menu"
      ariaLabel="Menu de navigation"
    >
      <nav class="flex flex-col gap-1" aria-label="Navigation mobile">
        @for (item of navItems; track item.label) {
          @if (item.kind === 'route') {
            <a
              [routerLink]="item.href"
              routerLinkActive="text-primary bg-foreground/5"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-lg font-medium text-muted hover:text-primary hover:bg-foreground/5 transition-colors"
            >
              <app-icon [name]="item.icons" [size]="20" />
              {{ item.label }}
            </a>
          } @else {
            <button
              type="button"
              (click)="scrollToSection(item.sectionId); closeMobileMenu()"
              [class]="activeKey() === item.sectionId ? 'text-primary bg-foreground/5' : ''"
              class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-lg font-medium text-muted hover:text-primary hover:bg-foreground/5 transition-colors"
            >
              <app-icon [name]="item.icons" [size]="20" />
              {{ item.label }}
            </button>
          }
        }
        @if (cvUrl()) {
          <a
            [href]="cvUrl()"
            target="_blank"
            rel="noopener noreferrer"
            (click)="trackCvDownload(); closeMobileMenu()"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-lg font-medium text-primary hover:bg-foreground/5 transition-colors mt-2 border-t border-white/5 pt-4"
          >
            <app-icon name="download" [size]="20" />
            Télécharger mon CV
          </a>
        }
      </nav>
    </app-drawer>
  `,
})
export class Header {
  private readonly analytics = inject(AnalyticsGateway);
  private readonly cvService = inject(CvGateway);
  private readonly scroller = inject(SectionScroller);

  protected readonly navItems = NAV_LINKS;
  protected readonly activeKey = inject(ActiveSection).key;
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly isDarkTheme = signal(Header.readStoredTheme() === 'dark');
  protected readonly cvUrl = signal<string | null>(null);

  constructor() {
    afterNextRender({
      write: () => this.applyTheme(),
    });
    afterNextRender(() => this.loadCvUrl());

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

  protected scrollToSection(sectionId: string): void {
    this.scroller.scrollTo(sectionId);
  }

  protected scrollToTop(): void {
    this.scroller.scrollToTop();
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
