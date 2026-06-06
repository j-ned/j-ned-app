import {
  ChangeDetectionStrategy,
  Component,
  signal,
  effect,
  afterNextRender,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NAV_LINKS } from './nav-items';
import { AnalyticsGateway } from '@features/analytics/domain';
import { firstValueFrom } from 'rxjs';
import { CvGateway } from '@features/cv/domain';
import { AppIcon } from '@shared/icons';
import { Button, Drawer, AppIconTile } from '@shared/ui';

const THEME_STORAGE_KEY = 'j-ned:theme';
type ThemePreference = 'dark' | 'light';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AppIcon, Button, Drawer, AppIconTile],
  template: `
    <div class="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-nav-border shadow-nav">
      <div class="page-container h-20 flex items-center justify-between">
        <a routerLink="/" class="group flex items-center gap-4 hover:opacity-90 transition-opacity">
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
          @for (item of navItems(); track item) {
            @if (item.scrollTo) {
              <a
                [href]="item.href"
                (click)="scrollToSection(item.scrollTo, $event)"
                class="flex items-center gap-2 text-lg font-medium text-muted hover:text-primary transition-colors"
              >
                <app-icon [name]="item.icons" [size]="20" />
                {{ item.label }}
              </a>
            } @else {
              <a
                [routerLink]="item.href"
                class="flex items-center gap-2 text-lg font-medium text-muted hover:text-primary transition-colors"
              >
                <app-icon [name]="item.icons" [size]="20" />
                {{ item.label }}
              </a>
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
      <nav class="flex flex-col gap-4" aria-label="Navigation mobile">
        @for (item of navItems(); track item) {
          @if (item.scrollTo) {
            <a
              [href]="item.href"
              (click)="scrollToSection(item.scrollTo, $event)"
              class="flex items-center gap-3 text-lg font-medium text-muted hover:text-primary transition-colors"
            >
              <app-icon [name]="item.icons" [size]="20" />
              {{ item.label }}
            </a>
          } @else {
            <a
              [routerLink]="item.href"
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
    </app-drawer>
  `,
})
export class Header {
  private readonly analytics = inject(AnalyticsGateway);
  private readonly cvService = inject(CvGateway);
  private readonly router = inject(Router);

  protected readonly navItems = signal(NAV_LINKS);
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

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((value) => !value);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  /**
   * Scrolle vers une section de la landing sans polluer l'URL avec une ancre `#`.
   * Si on est déjà sur la home → scroll direct ; sinon on navigue d'abord vers `/`
   * puis on scrolle après le rendu (`afterNextRender`, SSR-safe).
   */
  protected scrollToSection(id: string, event: Event): void {
    event.preventDefault();
    this.closeMobileMenu();
    if (this.router.url.split(/[?#]/)[0] === '/') {
      this._scrollToAnchor(id);
    } else {
      void this.router.navigateByUrl('/').then(() => this._scrollToAnchor(id));
    }
  }

  /**
   * Scrolle vers la cible et la « suit » tant que sa position absolue bouge :
   * les sections au-dessus (projets `@defer` + données async) se chargent
   * progressivement et décalent la cible vers le bas. On re-vise le scroll fluide
   * à chaque décalage, et on s'arrête une fois la position stable (~12 frames).
   * `window.scrollY + rect.top` = position document-absolue, invariante pendant le
   * scroll lui-même → on ne re-vise que sur un vrai décalage de mise en page.
   */
  private _scrollToAnchor(id: string): void {
    if (typeof document === 'undefined') return;
    let lastTop = -1;
    let stableFrames = 0;
    const follow = (frame: number): void => {
      const el = document.getElementById(id);
      if (!el) {
        // Cible pas encore rendue (navigation cross-page) → on attend.
        if (frame < 60) requestAnimationFrame(() => follow(frame + 1));
        return;
      }
      const absTop = window.scrollY + el.getBoundingClientRect().top;
      if (Math.abs(absTop - lastTop) < 1) {
        stableFrames++;
      } else {
        stableFrames = 0;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      lastTop = absTop;
      if (stableFrames < 12 && frame < 180) {
        requestAnimationFrame(() => follow(frame + 1));
      }
    };
    follow(0);
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
