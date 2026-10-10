import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_LINKS } from './nav-items';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { SectionScroller } from '@core/navigation/section-scroller';
import { ActiveSection } from '@core/navigation/active-section';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { Drawer } from '@shared/ui/drawer';
import { AppIconTile } from '@shared/ui/icon-tile';
import { ThemeStore } from '@core/theme/theme-store';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, AppIcon, Button, Drawer, AppIconTile],
  template: `
    <header
      class="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-nav-border shadow-nav"
    >
      <div class="page-container h-20 flex items-center justify-between">
        <a
          routerLink="/"
          (click)="scrollToTop()"
          title="Retour à l'accueil"
          class="group flex items-center gap-3 sm:gap-4 min-w-0 hover:opacity-90 transition-opacity"
        >
          <app-icon-tile
            aria-hidden="true"
            class="bg-primary/15 border border-primary/25 text-primary text-base font-bold group-hover:bg-primary/20 group-hover:border-primary/40 transition-colors"
          >
            JN
          </app-icon-tile>
          <span
            class="font-display text-2xl font-bold tracking-tight text-foreground max-sm:sr-only"
            >Julien <span class="text-primary">Nédellec</span></span
          >
        </a>

        <nav class="hidden lg:flex items-center gap-6" aria-label="Navigation principale">
          @for (item of navItems; track item.label) {
            @if (item.kind === 'route') {
              <a
                [routerLink]="item.href"
                routerLinkActive="is-link-active text-primary"
                class="group relative text-[0.9375rem] font-medium text-muted hover:text-primary transition-colors"
              >
                {{ item.label }}
                <span class="nav-underline" aria-hidden="true"></span>
              </a>
            } @else {
              <button
                type="button"
                (click)="scrollToSection(item.sectionId)"
                [class.is-link-active]="activeKey() === item.sectionId"
                [class.text-primary]="activeKey() === item.sectionId"
                class="group relative cursor-pointer text-[0.9375rem] font-medium text-muted hover:text-primary transition-colors"
              >
                {{ item.label }}
                <span class="nav-underline" aria-hidden="true"></span>
              </button>
            }
          }
        </nav>

        <div class="flex items-center gap-2 sm:gap-4">
          <button
            appButton
            type="button"
            variant="outlined"
            class="max-sm:hidden"
            size="icon"
            [rounded]="true"
            [attr.aria-label]="themeToggleLabel()"
            (click)="toggleTheme()"
          >
            <app-icon [name]="isDarkTheme() ? 'moon' : 'sun'" [size]="16" />
          </button>

          <button appButton type="button" data-testid="header-cta" (click)="describeProject()">
            {{ ctaLabel }}
          </button>

          <button
            appButton
            type="button"
            variant="text-muted"
            class="lg:hidden"
            size="icon"
            [rounded]="true"
            [attr.aria-label]="isMobileMenuOpen() ? 'Fermer le menu' : 'Ouvrir le menu'"
            (click)="toggleMobileMenu()"
          >
            <app-icon [name]="isMobileMenuOpen() ? 'times' : 'bars'" [size]="20" />
          </button>
        </div>
      </div>
    </header>

    <app-drawer
      class="lg:hidden"
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
      </nav>
      <button
        type="button"
        data-testid="drawer-theme-toggle"
        (click)="toggleTheme()"
        class="mt-4 flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg border border-foreground/15 px-3 py-2.5 text-left text-base font-medium text-foreground hover:bg-foreground/5 transition-colors"
      >
        <app-icon [name]="isDarkTheme() ? 'moon' : 'sun'" [size]="20" />
        {{ themeToggleLabel() }}
      </button>
    </app-drawer>
  `,
})
export class Header {
  private readonly analytics = inject(AnalyticsGateway);
  private readonly scroller = inject(SectionScroller);
  private readonly theme = inject(ThemeStore);

  protected readonly navItems = NAV_LINKS;
  protected readonly activeKey = inject(ActiveSection).key;
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly isDarkTheme = this.theme.isDark;
  protected readonly themeToggleLabel = computed(() =>
    this.isDarkTheme() ? 'Passer en mode clair' : 'Passer en mode sombre',
  );
  protected readonly ctaLabel = 'Décrire mon projet';

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

  protected describeProject(): void {
    this.analytics.trackCtaClick('header_contact', this.ctaLabel);
    this.scroller.scrollToRequestForm();
  }

  protected toggleTheme(): void {
    this.theme.toggle();
  }
}
